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
    // ⏱ solo consideramos PENDIENTE si fue creada hace menos de 5 minutos
    const now = new Date();
    const cutoff = new Date(now.getTime() - 5 * 60 * 1000);

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

  private parseISOOrThrow(v?: string, name = 'fecha') {
    if (!v) throw new BadRequestException(`Campo "${name}" es requerido`);
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

    const now = new Date();
    const todayStrUTC = now.toISOString().slice(0, 10);

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

        if (f < todayStrUTC) {
          throw new BadRequestException('No se puede reservar días pasados');
        }

        desde = new Date(`${f}T00:00:00.000Z`);
        hasta = new Date(`${f}T23:59:59.999Z`);
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
