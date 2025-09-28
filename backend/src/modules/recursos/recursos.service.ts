import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PrismaClient, Prisma } from '@prisma/client';

@Injectable()
export class RecursosService {
  constructor(private prisma: PrismaService) {}

  private buildOrderBy(sort?: string): Prisma.RecursoOrderByWithRelationInput[] {
    switch (sort) {
      case 'nombre_asc': return [{ nombre: 'asc' }];
      case 'nombre_desc': return [{ nombre: 'desc' }];
      case 'precioHora_asc': return [{ precioHoraCLP: 'asc' }];
      case 'precioHora_desc': return [{ precioHoraCLP: 'desc' }];
      case 'precioDia_asc': return [{ precioDiaCLP: 'asc' }];
      case 'precioDia_desc': return [{ precioDiaCLP: 'desc' }];
      default: return [{ nombre: 'asc' }];
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

    const where: Prisma.RecursoWhereInput = {
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
}
