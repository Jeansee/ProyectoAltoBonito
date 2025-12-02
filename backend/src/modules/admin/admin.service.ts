import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EstadoReserva } from '@prisma/client';

type Range = {
  from?: string;
  to?: string;
  tipoRecurso?: 'QUINCHO' | 'PISCINA' | 'CANCHA';
  modalidad?: 'POR_HORA' | 'BLOQUE' | 'DIA_COMPLETO';
};

// WHERE para reservas: inicio >= from 00:00 (local) AND inicio < (to+1) 00:00 (local)
const buildReservaDateWhere = (from?: string, to?: string) => {
  const where: any = {};

  if (from || to) {
    const cond: any = {};

    if (from) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(from)) {
        throw new BadRequestException('from debe estar en formato YYYY-MM-DD');
      }
      const [fy, fm, fd] = from.split('-').map(Number);
      // start = local midnight del día "from"
      const start = new Date(fy, fm - 1, fd, 0, 0, 0, 0);
      cond.gte = start;
    }

    if (to) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(to)) {
        throw new BadRequestException('to debe estar en formato YYYY-MM-DD');
      }
      const [ty, tm, td] = to.split('-').map(Number);
      // end = midnight del día siguiente (local) -> usamos < end para incluir todo el "to"
      const end = new Date(ty, tm - 1, td, 0, 0, 0, 0);
      end.setDate(end.getDate() + 1);
      cond.lt = end;
    }

    // seguimos filtrando por fecha de INICIO del evento
    where.inicio = cond;
  }

  return where;
};

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async metrics(range: Range) {
    const { from, to, tipoRecurso, modalidad } = range;

    // Base: filtro de fechas
    const whereReservaDate = buildReservaDateWhere(from, to) as any;

    // where completo con filtros opcionales
    const whereReserva: any = {
      ...whereReservaDate,
      // 👇 solo consideramos CONFIRMADA / PAGADA / CANCELADA en los insights
      estado: {
        in: [
          EstadoReserva.CONFIRMADA,
          EstadoReserva.PAGADA,
          EstadoReserva.CANCELADA,
        ],
      },
    };

    // Filtro por modalidad (POR_HORA / BLOQUE / DIA_COMPLETO)
    if (modalidad) {
      whereReserva.modalidad = modalidad;
    }

    // Filtro por tipo de recurso (QUINCHO / PISCINA / CANCHA)
    if (tipoRecurso) {
      whereReserva.recursos = {
        some: {
          recurso: {
            tipo: tipoRecurso,
          },
        },
      };
    }

    const [reservas, usuarios] = await Promise.all([
      // 👉 Reservas del período según INICIO + filtros extra
      this.prisma.prisma.reserva.findMany({
        where: Object.keys(whereReserva).length ? whereReserva : undefined,
        select: {
          estado: true,
          modalidad: true,
          inicio: true,
          usuarioId: true,
          recursos: {
            select: {
              recursoId: true,
              precioFinalCLP: true,
              recurso: {
                select: {
                  nombre: true,
                  tipo: true,
                },
              },
            },
          },
        },
      }),
      // 👉 Usuarios totales SIEMPRE (no dependen del filtro)
      this.prisma.prisma.usuario.count(),
    ]);

    // ====== KPIs ======
    const totalReservas = reservas.filter(
      (r) =>
        r.estado === EstadoReserva.CONFIRMADA ||
        r.estado === EstadoReserva.PAGADA,
    ).length;

    // Ingresos globales: suma SOLO de CONFIRMADA/PAGADA
    let ingresosCLP = 0;
    for (const r of reservas) {
      if (
        r.estado === EstadoReserva.CONFIRMADA ||
        r.estado === EstadoReserva.PAGADA
      ) {
        for (const rr of r.recursos) {
          ingresosCLP += rr.precioFinalCLP ?? 0;
        }
      }
    }

    // ====== Reservas por modalidad ======
    const reservasPorModalidadMap = new Map<string, number>();
    for (const r of reservas) {
      if (
        r.estado !== EstadoReserva.CONFIRMADA &&
        r.estado !== EstadoReserva.PAGADA
      ) {
        continue;
      }

      reservasPorModalidadMap.set(
        r.modalidad,
        (reservasPorModalidadMap.get(r.modalidad) ?? 0) + 1,
      );
    }

    const reservasPorModalidad = Array.from(
      reservasPorModalidadMap.entries(),
    ).map(([modalidad, count]) => ({ modalidad, count }));

    // ====== Ocupancia e ingresos por recurso / mes ======
    const recursoMesMap = new Map<
      string,
      {
        recursoId: string;
        recursoNombre: string;
        recursoTipo: string;
        month: string; // "YYYY-MM"
        reservas: number;
        ingresosCLP: number;
      }
    >();

    // ====== Reservas por día de la semana y por franja horaria ======
    const reservasPorDiaSemanaMap = new Map<number, number>(); // 0=Dom ... 6=Sáb

    const FRANJAS = [
      { id: '06-12', label: '06:00–12:00', from: 6, to: 12 },
      { id: '12-18', label: '12:00–18:00', from: 12, to: 18 },
      { id: '18-24', label: '18:00–00:00', from: 18, to: 24 },
    ];
    const reservasPorFranjaMap = new Map<string, number>(); // key = franja.id

    // Mapa para reservas por usuario en el PERÍODO (solo CONFIRMADA/PAGADA)
    const reservasPorUsuarioPeriodo = new Map<string, number>();

    // 🔴 Insights de uso real: SOLO reservas CONFIRMADA / PAGADA
    for (const r of reservas) {
      if (
        r.estado !== EstadoReserva.CONFIRMADA &&
        r.estado !== EstadoReserva.PAGADA
      ) {
        continue;
      }

      const inicio = r.inicio;
      if (!inicio) continue;

      // --- Contabilizar reservas por usuario en EL PERÍODO ---
      if (r.usuarioId) {
        reservasPorUsuarioPeriodo.set(
          r.usuarioId,
          (reservasPorUsuarioPeriodo.get(r.usuarioId) ?? 0) + 1,
        );
      }

      // --- Mes para recursoMes (USAMOS hora/local aquí) ---
      const year = inicio.getFullYear();
      const monthNum = inicio.getMonth() + 1;
      const month = `${year}-${String(monthNum).padStart(2, '0')}`;

      for (const rr of r.recursos) {
        const key = `${rr.recursoId}|${month}`;
        const monto = rr.precioFinalCLP ?? 0;

        const current = recursoMesMap.get(key);
        if (current) {
          current.reservas += 1;
          current.ingresosCLP += monto;
        } else {
          recursoMesMap.set(key, {
            recursoId: rr.recursoId,
            recursoNombre: rr.recurso.nombre,
            recursoTipo: rr.recurso.tipo,
            month,
            reservas: 1,
            ingresosCLP: monto,
          });
        }
      }

      // --- Día de la semana (0=Dom ... 6=Sáb) -> USAR local
      const dow = inicio.getDay();
      reservasPorDiaSemanaMap.set(
        dow,
        (reservasPorDiaSemanaMap.get(dow) ?? 0) + 1,
      );

      // --- Franja horaria (hora local) ---
      const hour = inicio.getHours();
      const franja =
        FRANJAS.find((f) => hour >= f.from && hour < f.to) ?? FRANJAS[0];

      reservasPorFranjaMap.set(
        franja.id,
        (reservasPorFranjaMap.get(franja.id) ?? 0) + 1,
      );
    }

    const recursoMes = Array.from(recursoMesMap.values());

    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const reservasPorDiaSemana = Array.from(
      reservasPorDiaSemanaMap.entries(),
    )
      .sort(([a, b]) => a - b)
      .map(([dia, count]) => ({
        dia,
        label: dayNames[dia] ?? String(dia),
        count,
      }));

    const reservasPorFranja = FRANJAS.map((f) => ({
      id: f.id,
      label: f.label,
      count: reservasPorFranjaMap.get(f.id) ?? 0,
    }));

    // ====== Clientes nuevos vs recurrentes (histórico) ======

    let clientesNuevos = 0;
    let clientesRecurrentes = 0;
    let reservasClientesNuevos = 0;
    let reservasClientesRecurrentes = 0;

    // Usuarios que realmente hicieron reservas en este período (CONFIRMADA/PAGADA)
    if (reservasPorUsuarioPeriodo.size > 0) {
      const usuarioIds = Array.from(reservasPorUsuarioPeriodo.keys());

      // Obtenemos el total histórico de reservas confirmadas/pagadas por usuario
      const resumenHistorico = await this.prisma.prisma.reserva.groupBy({
        by: ['usuarioId'],
        where: {
          usuarioId: { in: usuarioIds },
          estado: { in: [EstadoReserva.CONFIRMADA, EstadoReserva.PAGADA] },
        },
        _count: { _all: true },
      });

      const historicoMap = new Map<string, number>();
      for (const row of resumenHistorico) {
        historicoMap.set(row.usuarioId, row._count._all);
      }

      for (const usuarioId of usuarioIds) {
        const totalGlobal = historicoMap.get(usuarioId) ?? 0;
        const reservasEnPeriodo = reservasPorUsuarioPeriodo.get(usuarioId) ?? 0;

        if (totalGlobal <= 1) {
          // 👉 Cliente NUEVO: SOLO 1 reserva en su vida
          clientesNuevos += 1;
          reservasClientesNuevos += reservasEnPeriodo;
        } else {
          // 👉 Cliente RECURRENTE: más de 1 reserva
          clientesRecurrentes += 1;
          reservasClientesRecurrentes += reservasEnPeriodo;
        }
      }
    }
    return {
      range: { from: from ?? null, to: to ?? null },
      kpis: {
        usuarios, // total del sistema
        reservas: totalReservas, // solo CONFIRMADA/PAGADA/CANCELADA
        ingresosCLP, // ingresos solo confirmadas/pagadas
      },
      reservasPorModalidad,
      recursoMes,
      reservasPorDiaSemana,
      reservasPorFranja,
      clientesNuevosVsRecurrentes: {
        nuevos: {
          clientes: clientesNuevos,
          reservas: reservasClientesNuevos,
        },
        recurrentes: {
          clientes: clientesRecurrentes,
          reservas: reservasClientesRecurrentes,
        },
      },
    };
  }

  async recentReservas(limit?: number) {
    const now = new Date();
    // ⏱ PENDIENTE: 1 minuto (coherente con el resto)
    const cutoff = new Date(now.getTime() - 1 * 60 * 1000);

    const findArgs: any = {
      where: {
        OR: [
          // Siempre mostramos CONFIRMADA / PAGADA / CANCELADA
          { estado: { in: ['CONFIRMADA', 'PAGADA', 'CANCELADA'] } },
          // PENDIENTE solo si fue creada hace menos de 1 minuto
          { estado: 'PENDIENTE', createdAt: { gt: cutoff } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        inicio: true,
        fin: true,
        estado: true,
        modalidad: true,
        usuario: {
          select: { id: true, nombre: true, apellido: true, correo: true },
        },
        recursos: {
          select: {
            recurso: { select: { id: true, nombre: true, tipo: true } },
            precioFinalCLP: true,
          },
        },
      },
    };

    if (typeof limit === 'number') {
      findArgs.take = limit;
    }

    const rows = (await this.prisma.prisma.reserva.findMany(
      findArgs,
    )) as any[];

    return rows.map((r) => ({
      id: r.id,
      fecha: r.createdAt,
      inicio: r.inicio,
      fin: r.fin,
      estado: r.estado,
      modalidad: r.modalidad,
      cliente: r.usuario
        ? {
            id: r.usuario.id,
            nombre: `${r.usuario.nombre} ${r.usuario.apellido}`.trim(),
            correo: r.usuario.correo,
          }
        : null,
      recursos: r.recursos.map((rr: any) => ({
        id: rr.recurso.id,
        nombre: rr.recurso.nombre,
        tipo: rr.recurso.tipo,
        precioFinalCLP: rr.precioFinalCLP,
      })),
      totalCLP: r.recursos.reduce(
        (acc: number, rr: any) => acc + (rr.precioFinalCLP ?? 0),
        0,
      ),
    }));
  }

  async cancelReservaByAdmin(id: string) {
    const reserva = await this.prisma.prisma.reserva.findUnique({
      where: { id },
      include: {
        pagos: true,
      },
    });

    if (!reserva) {
      throw new NotFoundException('Reserva no encontrada');
    }

    // Si ya está cancelada, devolvemos tal cual
    if (reserva.estado === EstadoReserva.CANCELADA) {
      return reserva;
    }

    const updated = await this.prisma.prisma.reserva.update({
      where: { id },
      data: {
        estado: EstadoReserva.CANCELADA,
      },
    });

    return updated;
  }

  // -------- BLOQUEOS --------

  async createBloqueo(args: {
    recursoId: string; // puede ser UUID o tipo QUINCHO/PISCINA/CANCHA
    motivo: string;
    inicio: string; // "YYYY-MM-DD"
    fin: string;    // "YYYY-MM-DD"
    adminId: string;
  }) {
    const { recursoId, motivo, inicio, fin, adminId } = args;

    if (!adminId) {
      throw new Error('adminId requerido para crear bloqueo');
    }

    let realRecursoId = recursoId;

    // Si viene el tipo de recurso, buscamos un recurso activo de ese tipo
    if (recursoId === 'QUINCHO' || recursoId === 'PISCINA' || recursoId === 'CANCHA') {
      const recurso = await this.prisma.prisma.recurso.findFirst({
        where: { tipo: recursoId as any, activo: true },
      });

      if (!recurso) {
        throw new NotFoundException(
          `No se encontró un recurso activo para el tipo ${recursoId}`,
        );
      }

      realRecursoId = recurso.id;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(inicio) || !/^\d{4}-\d{2}-\d{2}$/.test(fin)) {
      throw new BadRequestException('Fechas deben ir en formato YYYY-MM-DD');
    }

    // INTERPRETAR COMO LOCAL (medianoche inicio -> fin del día fin)
    const [ys, ms, ds] = inicio.split('-').map(Number);
    const [ye, me, de] = fin.split('-').map(Number);

    const inicioDate = new Date(ys, ms - 1, ds, 0, 0, 0, 0); // local midnight
    const finDate = new Date(ye, me - 1, de, 23, 59, 59, 999); // local end of day

    if (inicioDate > finDate) {
      throw new BadRequestException('"inicio" debe ser <= "fin"');
    }

    // ---------- Rechazar si hay reservas CONFIRMADA / PAGADA / PENDIENTE que se solapen ----------
    const solapadasActivas = await this.prisma.prisma.reservaRecurso.findMany({
      where: {
        recursoId: realRecursoId,
        reserva: {
          estado: { in: ['CONFIRMADA', 'PAGADA', 'PENDIENTE'] },
          inicio: { lt: finDate },
          fin: { gt: inicioDate },
        },
      },
      include: {
        reserva: { select: { id: true, inicio: true, fin: true, estado: true, usuarioId: true } },
      },
    });

    if (solapadasActivas.length > 0) {
      // Construir mensaje útil (máx 5 reservas en el mensaje para no explotar)
      const sample = solapadasActivas.slice(0, 5).map((s) => {
        const r = s.reserva;
        return `id=${r.id} inicio=${r.inicio.toISOString()} fin=${r.fin.toISOString()} estado=${r.estado}`;
      });
      const more = solapadasActivas.length > 5 ? ` (+${solapadasActivas.length - 5} más)` : '';
      throw new BadRequestException(
        `No se puede crear bloqueo: existen ${solapadasActivas.length} reserva(s) activa(s) (CONFIRMADA/PAGADA/PENDIENTE) que se solapan. Ej: ${sample.join(' | ')}${more}`
      );
    }

    // Si no hay conflictos con reservas activas, creamos el bloqueo
    return this.prisma.prisma.bloqueo.create({
      data: {
        recursoId: realRecursoId,
        motivo,
        inicio: inicioDate,
        fin: finDate,
        createdBy: adminId,
      },
    });
  }

  async getBloqueos() {
    return this.prisma.prisma.bloqueo.findMany({
      orderBy: { inicio: 'asc' },
      include: {
        recurso: {
          select: { id: true, nombre: true, tipo: true },
        },
      },
    });
  }

  async deleteBloqueo(id: string) {
    return this.prisma.prisma.bloqueo.delete({
      where: { id },
    });
  }
}
