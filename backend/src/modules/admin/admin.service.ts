// backend/src/modules/admin/admin.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EstadoPago } from '@prisma/client'; // 👈 importa el enum

type Range = { from?: string; to?: string };
const makeRangeFilter = (from?: string, to?: string) => {
  const where: any = {};
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(`${from}T00:00:00.000Z`);
    if (to) where.createdAt.lte = new Date(`${to}T23:59:59.999Z`);
  }
  return where;
};

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async metrics(range: Range) {
    const { from, to } = range;

    const whereReserva = makeRangeFilter(from, to);
    const wherePago = makeRangeFilter(from, to);
    const whereUsuario = makeRangeFilter(from, to);

    const [usuarios, totalReservas, pagosAgg, reservasPorEstado, reservasPorModalidad] =
      await Promise.all([
        this.prisma.prisma.usuario.count({ where: whereUsuario }),
        this.prisma.prisma.reserva.count({ where: whereReserva }),
        this.prisma.prisma.pago.aggregate({
          _sum: { montoCLP: true },
          where: {
            ...wherePago,
            estado: EstadoPago.APPROVED, // ✅ en tu esquema
            // (opcional) si además guardas mpStatus textual:
            // mpStatus: 'approved',
          },
        }),
        this.prisma.prisma.reserva.groupBy({
          by: ['estado'],
          _count: { _all: true },
          where: whereReserva,
        }),
        this.prisma.prisma.reserva.groupBy({
          by: ['modalidad'],
          _count: { _all: true },
          where: whereReserva,
        }),
      ]);

    const ingresosCLP = pagosAgg._sum.montoCLP ?? 0;

    return {
      range: { from: from ?? null, to: to ?? null },
      kpis: { usuarios, reservas: totalReservas, ingresosCLP },
      reservasPorEstado: reservasPorEstado.map(r => ({
        estado: r.estado,
        count: r._count._all,
      })),
      reservasPorModalidad: reservasPorModalidad.map(r => ({
        modalidad: r.modalidad,
        count: r._count._all,
      })),
    };
  }

  async recentReservas(limit = 10) {
    const rows = await this.prisma.prisma.reserva.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        createdAt: true,
        inicio: true,
        fin: true,
        estado: true,
        modalidad: true,
        usuario: { select: { id: true, nombre: true, apellido: true, correo: true } },
        recursos: {
          select: {
            recurso: { select: { id: true, nombre: true, tipo: true } },
            precioFinalCLP: true,
          },
        },
      },
    });

    return rows.map(r => ({
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
      recursos: r.recursos.map(rr => ({
        id: rr.recurso.id,
        nombre: rr.recurso.nombre,
        tipo: rr.recurso.tipo,
        precioFinalCLP: rr.precioFinalCLP,
      })),
      totalCLP: r.recursos.reduce((acc, rr) => acc + (rr.precioFinalCLP ?? 0), 0),
    }));
  }
}
