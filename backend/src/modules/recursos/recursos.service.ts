// src/modules/recursos/recursos.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

type Slot = { inicio: string; fin: string; busy: boolean };

@Injectable()
export class RecursosService {
  constructor(private prisma: PrismaService) {}

  private buildOrderBy(sort?: string) {
    switch (sort) {
      case 'nombre_asc': return [{ nombre: 'asc' }] as any;
      case 'nombre_desc': return [{ nombre: 'desc' }] as any;
      case 'precioHora_asc': return [{ precioHoraCLP: 'asc' }] as any;
      case 'precioHora_desc': return [{ precioHoraCLP: 'desc' }] as any;
      case 'precioDia_asc': return [{ precioDiaCLP: 'asc' }] as any;
      case 'precioDia_desc': return [{ precioDiaCLP: 'desc' }] as any;
      default: return [{ nombre: 'asc' }] as any;
    }
  }

  async list(params: {
    tipo?: 'QUINCHO' | 'PISCINA' | 'CANCHA';
    search?: string;
    activo?: boolean;
    page: number;
    limit: number;
    sort?: string;
  }) {
    const { tipo, search, activo, page, limit, sort } = params;

    const where: any = {
      ...(tipo ? { tipo } : {}),
      ...(typeof activo === 'boolean' ? { activo } : {}),
      ...(search ? { nombre: { contains: search, mode: 'insensitive' } } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.recurso.findMany({
        where,
        orderBy: this.buildOrderBy(sort),
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, nombre: true, tipo: true, descripcion: true, activo: true,
          capacidad: true, ubicacion: true,
          precioHoraCLP: true, precioDiaCLP: true, precioBaseCLP: true,
          tiempoMinimo: true, tiempoMaximo: true, diasAnticipacion: true,
          createdAt: true, updatedAt: true,
        },
      }),
      this.prisma.recurso.count({ where }),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) || 1 };
  }

  async findOne(id: string) {
    return this.prisma.recurso.findUniqueOrThrow({
      where: { id },
      select: {
        id: true, nombre: true, tipo: true, descripcion: true, activo: true,
        capacidad: true, ubicacion: true,
        precioHoraCLP: true, precioDiaCLP: true, precioBaseCLP: true,
        tiempoMinimo: true, tiempoMaximo: true, diasAnticipacion: true,
        horarios: { select: { id: true, diaSemana: true, abreMin: true, cierraMin: true, activo: true } },
        turnos:   { select: { id: true, nombre: true, inicioMin: true, finMin: true, diasSemana: true, precioFijoCLP: true, activo: true } },
      },
    });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // SLOTS (por hora / bloque) con bloqueo de días pasados y horas pasadas
  // ────────────────────────────────────────────────────────────────────────────
  async getSlots(recursoId: string, fechaYYYYMMDD: string, stepMin: number) {
    const recurso = await this.prisma.recurso.findUnique({ where: { id: recursoId } });
    if (!recurso) throw new NotFoundException('Recurso no encontrado');

    // Bloquea días pasados (LOCAL)
    const todayLocalStr = this.dayStr(new Date());
    if (fechaYYYYMMDD < todayLocalStr) {
      return { fecha: fechaYYYYMMDD, step: stepMin, slots: [] as Slot[] };
    }

    // Interpreta fecha como día local
    const [y, m, d] = fechaYYYYMMDD.split('-').map(Number);
    const dateLocal = new Date(y, m - 1, d, 0, 0, 0, 0);

    const day = dateLocal.getDay(); // 0=domingo (local)
    const horario = await this.prisma.horario.findFirst({
      where: { recursoId, diaSemana: day, activo: true },
    });

    if (!horario) return { fecha: fechaYYYYMMDD, step: stepMin, slots: [] as Slot[] };

    // Ventana de trabajo (maneja overnight) — usamos minutos en hora local
    const start = new Date(dateLocal);
    start.setMinutes(horario.abreMin, 0, 0); // horario.abreMin = minutos desde 00:00

    const end = new Date(dateLocal);
    end.setMinutes(horario.cierraMin, 0, 0);
    if (horario.abreMin >= horario.cierraMin) {
      end.setDate(end.getDate() + 1); // cierra al día siguiente (local)
    }

    // ⏱ límite para PENDIENTE: 1 minuto
    const now = new Date();
    const cutoff = new Date(now.getTime() - 1 * 60 * 1000);

    // Reservas y bloqueos que se cruzan
    const reservas = await this.prisma.reservaRecurso.findMany({
      where: {
        recursoId,
        reserva: {
          estado: { in: ['PENDIENTE', 'CONFIRMADA', 'PAGADA'] },
          inicio: { lt: end },
          fin: { gt: start },
          OR: [
            { estado: { not: 'PENDIENTE' } },
            { estado: 'PENDIENTE', createdAt: { gt: cutoff } },
          ],
        },
      },
      select: { reserva: { select: { inicio: true, fin: true } } },
    });

    const bloqueos = await this.prisma.bloqueo.findMany({
      where: { recursoId, inicio: { lt: end }, fin: { gt: start } },
      select: { inicio: true, fin: true },
    });

    const overlaps = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) =>
      aStart < bEnd && aEnd > bStart;

    const busyIntervals = [
      ...reservas.map((r) => ({ inicio: r.reserva.inicio, fin: r.reserva.fin })),
      ...bloqueos.map((b) => ({ inicio: b.inicio, fin: b.fin })),
    ];

    const isToday = fechaYYYYMMDD === todayLocalStr;

    const slots: Slot[] = [];
    for (let cur = new Date(start); cur < end; cur = new Date(cur.getTime() + stepMin * 60000)) {
      const s = cur;
      const e = new Date(cur.getTime() + stepMin * 60000);
      if (e > end) break;

      // Ocultar slots del pasado si es el día actual
      if (isToday && e <= now) continue;

      const busy = busyIntervals.some((b) =>
        overlaps(s, e, new Date(b.inicio), new Date(b.fin)),
      );

      // Devuelve ISO (UTC) — el frontend debe presentar en la zona local del usuario
      slots.push({ inicio: s.toISOString(), fin: e.toISOString(), busy });
    }

    return { fecha: fechaYYYYMMDD, step: stepMin, slots };
  }

  // Helpers de fechas (LOCAL)
  private dayStr(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  private addDays(d: Date, days: number) {
    const x = new Date(d);
    x.setDate(x.getDate() + days);
    return x;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // DISPONIBILIDAD POR DÍA EN RANGO (para “Día completo” y vista mensual)
  // ────────────────────────────────────────────────────────────────────────────
  async getAvailabilityRange(
    recursoId: string,
    fromYYYYMMDD: string,
    toYYYYMMDD: string,
    mode: 'DIA_COMPLETO' | 'POR_HORA' | 'BLOQUE' = 'DIA_COMPLETO',
  ) {
    const recurso = await this.prisma.recurso.findUnique({ where: { id: recursoId } });
    if (!recurso) throw new NotFoundException('Recurso no encontrado');

    // Validaciones básicas de rango (interpretadas en local)
    const [fy, fm, fd] = fromYYYYMMDD.split('-').map(Number);
    const [ty, tm, td] = toYYYYMMDD.split('-').map(Number);
    const rangeStart = new Date(fy, fm - 1, fd, 0, 0, 0, 0);
    const rangeEnd = new Date(ty, tm - 1, td, 23, 59, 59, 999);

    if (isNaN(rangeStart.getTime()) || isNaN(rangeEnd.getTime())) {
      throw new BadRequestException('Fechas inválidas en "from" o "to" (YYYY-MM-DD)');
    }
    if (rangeStart > rangeEnd) {
      throw new BadRequestException('"from" debe ser <= "to"');
    }
    const daysCount = Math.floor((rangeEnd.getTime() - rangeStart.getTime()) / 86400000) + 1;
    if (daysCount > 62) {
      throw new BadRequestException('Rango demasiado grande (máximo 62 días).');
    }

    // horarios por día de la semana
    const horarios = await this.prisma.horario.findMany({
      where: { recursoId, activo: true },
      select: { diaSemana: true, abreMin: true, cierraMin: true },
    });
    const horariosMap = new Map<number, { abreMin: number; cierraMin: number }>();
    for (const h of horarios) horariosMap.set(h.diaSemana, { abreMin: h.abreMin, cierraMin: h.cierraMin });

    // ⏱ límite para PENDIENTE: 1 minuto
    const now = new Date();
    const cutoff = new Date(now.getTime() - 1 * 60 * 1000);

    // reservas y bloqueos en el rango
    const reservas = await this.prisma.reservaRecurso.findMany({
      where: {
        recursoId,
        reserva: {
          estado: { in: ['PENDIENTE', 'CONFIRMADA', 'PAGADA'] },
          inicio: { lt: rangeEnd },
          fin: { gt: rangeStart },
          OR: [
            { estado: { not: 'PENDIENTE' } },
            { estado: 'PENDIENTE', createdAt: { gt: cutoff } },
          ],
        },
      },
      select: { reserva: { select: { inicio: true, fin: true } } },
    });
    const bloqueos = await this.prisma.bloqueo.findMany({
      where: { recursoId, inicio: { lt: rangeEnd }, fin: { gt: rangeStart } },
      select: { inicio: true, fin: true },
    });

    // Marca días con cualquier overlap (día a día) — usamos fechas locales para marcar
    const busyDays = new Set<string>();
    const markBusy = (start: Date, end: Date) => {
      let cur = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0);
      const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 0, 0, 0, 0);
      while (cur <= endDay) {
        busyDays.add(this.dayStr(cur));
        cur = this.addDays(cur, 1);
      }
    };
    reservas.forEach(r => markBusy(new Date(r.reserva.inicio), new Date(r.reserva.fin)));
    bloqueos.forEach(b => markBusy(new Date(b.inicio), new Date(b.fin)));

    // genera respuesta día a día
    const days: { date: string; available: boolean }[] = [];
    let d = new Date(rangeStart);
    const end = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), rangeEnd.getDate(), 0, 0, 0, 0);
    const todayStr = this.dayStr(new Date());

    while (d <= end) {
      const dateStr = this.dayStr(d);
      const isPast = dateStr < todayStr;

      const wd = d.getDay(); // 0=domingo (local)
      const h = horariosMap.get(wd);

      const available = !isPast && !!h && !busyDays.has(dateStr);

      days.push({ date: dateStr, available });
      d = this.addDays(d, 1);
    }

    return { from: fromYYYYMMDD, to: toYYYYMMDD, mode, days };
  }
}
