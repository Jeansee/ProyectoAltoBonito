import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EstadoReserva } from '@prisma/client';

type Range = {
  from?: string;
  to?: string;
  tipoRecurso?: 'QUINCHO' | 'PISCINA' | 'CANCHA';
  modalidad?: 'POR_HORA' | 'BLOQUE' | 'DIA_COMPLETO';
};

// WHERE para reservas: inicio >= from 00:00 AND inicio < (to+1) 00:00
const buildReservaDateWhere = (from?: string, to?: string) => {
  const where: any = {};

  if (from || to) {
    const cond: any = {};

    if (from) {
      const start = new Date(from + 'T00:00:00'); // sin Z para no liar el huso
      cond.gte = start;
    }

    if (to) {
      const end = new Date(to + 'T00:00:00');
      end.setDate(end.getDate() + 1); // día siguiente
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
          usuarioId: true, // 👈 necesario para clientes nuevos vs recurrentes
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
    ).length; // solo CONFIRMADA/PAGADA/CANCELADA

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

      // --- Mes para recursoMes ---
      const year = inicio.getUTCFullYear();
      const monthNum = inicio.getUTCMonth() + 1;
      const month = `${year}-${String(monthNum).padStart(2, '0')}`; // ej: "2026-01"

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

      // --- Día de la semana (0=Dom ... 6=Sáb) ---
      const dow = inicio.getUTCDay();
      reservasPorDiaSemanaMap.set(
        dow,
        (reservasPorDiaSemanaMap.get(dow) ?? 0) + 1,
      );

      // --- Franja horaria ---
      const hour = inicio.getUTCHours();
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
    const cutoff = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutos atrás

    const findArgs: any = {
      where: {
        OR: [
          // Siempre mostramos CONFIRMADA / PAGADA / CANCELADA
          { estado: { in: ['CONFIRMADA', 'PAGADA', 'CANCELADA'] } },
          // PENDIENTE solo si fue creada hace menos de 5 minutos
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
}
