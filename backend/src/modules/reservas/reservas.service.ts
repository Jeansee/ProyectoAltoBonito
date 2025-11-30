// src/modules/reservas/reservas.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { GoogleService } from '../google/google.service';
import { EstadoPago, Prisma } from '@prisma/client';

@Injectable()
export class ReservasService {
  private readonly logger = new Logger(ReservasService.name);

  constructor(
    private prisma: PrismaService,
    private readonly google: GoogleService,
  ) {}

  async esDisponible(recursoId: string, desde: Date, hasta: Date) {
    // ⏱ solo consideramos PENDIENTE si fue creada hace menos de 1 minuto
    const now = new Date();
    const cutoff = new Date(now.getTime() - 1 * 60 * 1000);

    const overlapReserva = await this.prisma.reservaRecurso.findFirst({
      where: {
        recursoId,
        reserva: {
          estado: { in: ['PENDIENTE', 'CONFIRMADA', 'PAGADA'] },
          inicio: { lt: hasta },
          fin: { gt: desde },
          OR: [
            { estado: { not: 'PENDIENTE' } },
            { estado: 'PENDIENTE', createdAt: { gt: cutoff } },
          ],
        },
      },
    });

    const overlapBloqueo = await this.prisma.bloqueo.findFirst({
      where: {
        recursoId,
        inicio: { lt: hasta },
        fin: { gt: desde },
      },
    });

    return !overlapReserva && !overlapBloqueo;
  }

  /**
   * Parsea varios formatos de entrada:
   * - "YYYY-MM-DD"           -> día (se interpreta como local midnight)
   * - "YYYY-MM-DDTHH:mm(:ss)?(Z|±HH:MM)?" -> si incluye 'Z' o ±HH:MM, Date lo parsea correctamente (UTC/offset)
   *   si no incluye zona (no Z y no ±HH:MM) lo tratamos como hora LOCAL explícita.
   */
  private parseISOOrThrow(v?: string, name = 'fecha') {
    if (!v) throw new BadRequestException(`Campo "${name}" es requerido`);

    // YYYY-MM-DD (solo fecha) -> interpretar como día local
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(v);
    if (dateOnly) {
      const [y, m, d] = v.split('-').map(Number);
      return new Date(y, m - 1, d, 0, 0, 0, 0); // local midnight
    }

    // ISO datetime con offset 'Z' o +/-HH:MM
    const hasTZ = /Z$|[+-]\d{2}:\d{2}$/.test(v);

    if (hasTZ) {
      const d = new Date(v);
      if (isNaN(d.getTime())) throw new BadRequestException(`Campo "${name}" inválido: ${v}`);
      return d; // Date will handle offset/Z correctly
    }

    // Datetime sin zona (e.g. '2025-11-29T07:00:00' o '2025-11-29T07:00')
    // Interpretar como LOCAL (evita que node trate de forma ambigua)
    const dtMatch = v.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?$/);
    if (dtMatch) {
      const [, yS, mS, dS, hS, minS, sS] = dtMatch;
      const y = Number(yS), m = Number(mS), d = Number(dS);
      const h = Number(hS), min = Number(minS), s = sS ? Number(sS) : 0;
      const dateLocal = new Date(y, m - 1, d, h, min, s, 0); // local time
      if (isNaN(dateLocal.getTime())) throw new BadRequestException(`Campo "${name}" inválido: ${v}`);
      return dateLocal;
    }

    // Fallback: intentar construir con Date (acepta otros formatos)
    const d = new Date(v);
    if (isNaN(d.getTime())) {
      throw new BadRequestException(`Campo "${name}" inválido: ${v}`);
    }
    return d;
  }

  private ceilToHour(ms: number) {
    const hour = 3600000;
    return Math.ceil(ms / hour) * hour;
  }

  async create(dto: CreateReservaDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: dto.usuarioId },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        correo: true,
        googleRefreshCipher: true,
      },
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    if (!dto.items?.length) {
      throw new BadRequestException('Debe incluir al menos un recurso');
    }

    const recursosMap = new Map<
      string,
      Awaited<ReturnType<typeof this.prisma.recurso.findUnique>>
    >();
    for (const i of dto.items) {
      const r = await this.prisma.recurso.findUnique({
        where: { id: i.recursoId },
      });
      if (!r) throw new BadRequestException(`Recurso inválido: ${i.recursoId}`);
      if (!r.activo)
        throw new BadRequestException(`El recurso ${r.nombre} está inactivo`);
      recursosMap.set(i.recursoId, r);
    }

    // hoy en forma local (YYYY-MM-DD) -> para comparar DIA_COMPLETO contra "hoy"
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const todayLocalStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    const itemsExpanded: {
      recurso: NonNullable<
        Awaited<ReturnType<typeof this.prisma.recurso.findUnique>>
      >;
      desde: Date;
      hasta: Date;
      precioItem: number;
    }[] = [];

    for (const i of dto.items) {
      const recurso = recursosMap.get(i.recursoId)!;
      const modalidad = i.modalidad;

      let desde: Date;
      let hasta: Date;
      let precioItem = 0;

      const precioHora = recurso.precioHoraCLP ?? recurso.precioBaseCLP ?? 0;
      const precioDia = recurso.precioDiaCLP ?? recurso.precioBaseCLP ?? 0;

      if (modalidad === 'POR_HORA') {
        // Se acepta ISO con zona (recomendado) o sin zona (se interpreta como local)
        desde = this.parseISOOrThrow(i.desde, 'desde');
        hasta = this.parseISOOrThrow(i.hasta, 'hasta');

        if (!(desde < hasta))
          throw new BadRequestException('Rango horario inválido (desde >= hasta)');

        if (desde <= now || hasta <= now) {
          throw new BadRequestException('No se puede reservar horas en el pasado');
        }

        const msRounded = this.ceilToHour(hasta.getTime() - desde.getTime());
        const horas = Math.max(1, msRounded / 3600000);

        const minH = (recurso.tiempoMinimo ?? 60) / 60;
        const maxH = (recurso.tiempoMaximo ?? 480) / 60;
        if (horas < minH || horas > maxH)
          throw new BadRequestException(
            `Duración debe ser entre ${minH} y ${maxH} horas`,
          );

        precioItem = precioHora * horas;

      } else if (modalidad === 'BLOQUE') {
        // Igual que POR_HORA: aceptar ISO con zona o sin zona (local)
        desde = this.parseISOOrThrow(i.desde, 'desde');
        hasta = this.parseISOOrThrow(i.hasta, 'hasta');
        if (!(desde < hasta))
          throw new BadRequestException('Rango horario inválido (desde >= hasta)');

        if (desde <= now || hasta <= now) {
          throw new BadRequestException('No se puede reservar horas en el pasado');
        }

        const diffMs = hasta.getTime() - desde.getTime();
        const horas = Math.ceil(diffMs / 3600000);

        const minH = (recurso.tiempoMinimo ?? 60) / 60;
        const maxH = (recurso.tiempoMaximo ?? 480) / 60;
        if (horas < minH || horas > maxH)
          throw new BadRequestException(
            `Duración del bloque debe ser entre ${minH} y ${maxH} horas`,
          );

        precioItem = precioHora * horas;

      } else if (modalidad === 'DIA_COMPLETO') {
        const f = i.fecha;
        if (!f) {
          throw new BadRequestException(
            'fecha es requerida para DIA_COMPLETO (YYYY-MM-DD)',
          );
        }

        // Compara con hoy en local (evita que '2025-11-29' se interprete en UTC y quede desfasado)
        if (f < todayLocalStr) {
          throw new BadRequestException('No se puede reservar días pasados');
        }

        // Interpreta el día como local (medianoche local -> guardamos Date que luego prisma convertirá a UTC)
        const [y, m, d] = f.split('-').map(Number);
        desde = new Date(y, m - 1, d, 0, 0, 0, 0); // local midnight
        hasta = new Date(y, m - 1, d, 23, 59, 59, 999); // local end of day
        precioItem = precioDia;

      } else {
        throw new BadRequestException(`Modalidad inválida: ${modalidad}`);
      }

      const disponible = await this.esDisponible(recurso.id, desde, hasta);
      if (!disponible) {
        throw new BadRequestException(
          `El recurso ${recurso.nombre} no está disponible en ese horario`,
        );
      }

      itemsExpanded.push({ recurso, desde, hasta, precioItem });
    }

    const inicioReserva = new Date(
      Math.min(...itemsExpanded.map((i) => i.desde.getTime())),
    );
    const finReserva = new Date(
      Math.max(...itemsExpanded.map((i) => i.hasta.getTime())),
    );
    const total = itemsExpanded.reduce((acc, it) => acc + it.precioItem, 0);

    // 🔥 Modalidad de la reserva basada en dto.modalidad o en el primer item
    const modalidadReserva =
      dto.modalidad ?? (dto.items.length ? dto.items[0].modalidad : 'POR_HORA');

    const reserva = await this.prisma.reserva.create({
      data: {
        usuarioId: dto.usuarioId,
        modalidad: modalidadReserva,
        inicio: inicioReserva,
        fin: finReserva,
        montoTotalCLP: total,
        estado: 'PENDIENTE',
        recursos: {
          create: itemsExpanded.map((it) => ({
            recursoId: it.recurso.id,
            precioBaseCLP: it.precioItem,
            precioFinalCLP: it.precioItem,
          })),
        },
      },
      include: {
        recursos: { include: { recurso: true } },
      },
    });

    if (dto.addToCalendar) {
      try {
        if (usuario.googleRefreshCipher) {
          const gEventId = await this.google.createEventForUser(
            usuario,
            reserva,
            reserva.recursos,
          );
          if (gEventId) {
            await this.prisma.reserva.update({
              where: { id: reserva.id },
              data: { gcalEventId: gEventId },
            });
          }
        } else {
          this.logger.log(
            `Usuario ${usuario.id} no tiene Google conectado; se omite Calendar.`,
          );
        }
      } catch (e: any) {
        this.logger.warn(
          `No se pudo crear evento de Calendar para reserva ${reserva.id}: ${e?.message}`,
        );
      }
    }

    return reserva;
  }

  async getById(id: string) {
    const reserva = await this.prisma.reserva.findUnique({
      where: { id },
      include: {
        recursos: { include: { recurso: true } },
        usuario: true,
      },
    });
    if (!reserva) throw new NotFoundException('Reserva no encontrada');
    return reserva;
  }

  // ✅ Mis reservas (CONFIRMADAS/PAGADAS) con pago Transbank
  async getMine(userId: string) {
    const include = Prisma.validator<Prisma.ReservaInclude>()({
      recursos: { include: { recurso: true } },
      pagos: {
        where: { estado: EstadoPago.APPROVED },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    });
    type ReservaWithRel = Prisma.ReservaGetPayload<{ include: typeof include }>;

    const reservas: ReservaWithRel[] = await this.prisma.reserva.findMany({
      where: {
        usuarioId: userId,
        estado: { in: ['CONFIRMADA', 'PAGADA'] },
      },
      orderBy: { createdAt: 'desc' },
      include,
    });

    return reservas.map((r) => {
      const p = r.pagos?.[0] ?? null;

      const tbkAuthorizationCode =
        p && (p as any).tbkAuthorizationCode ? String((p as any).tbkAuthorizationCode) : null;

      const tbkBuyOrder =
        p && (p as any).tbkBuyOrder ? String((p as any).tbkBuyOrder) : null;

      return {
        id: r.id,
        estado: r.estado,
        modalidad: r.modalidad,
        inicio: r.inicio,
        fin: r.fin,
        montoTotalCLP: r.montoTotalCLP,
        montoAbonoCLP: r.montoAbonoCLP,
        recursos: r.recursos.map((rr) => ({
          id: rr.id,
          recursoId: rr.recursoId,
          nombre: rr.recurso.nombre,
          tipo: rr.recurso.tipo,
          precioFinalCLP: rr.precioFinalCLP,
        })),
        ultimoPago: p
          ? {
              id: p.id,
              estado: p.estado,
              montoCLP: p.montoCLP,
              metodoPago: p.metodoPago,
              tbkAuthorizationCode,
              tbkBuyOrder,
              createdAt: p.createdAt,
            }
          : null,
      };
    });
  }
}
