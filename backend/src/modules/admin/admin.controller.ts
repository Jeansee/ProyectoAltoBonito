// src/modules/admin/admin.controller.ts
import { Controller, Get, Query, UseGuards, Patch, Param } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminOnlyGuard } from '../../common/guards/admin-only.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminOnlyGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  // GET /api/admin/metrics?from=YYYY-MM-DD&to=YYYY-MM-DD&tipoRecurso=QUINCHO&modalidad=BLOQUE
  @Get('metrics')
  async getMetrics(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('tipoRecurso') tipoRecurso?: 'QUINCHO' | 'PISCINA' | 'CANCHA',
    @Query('modalidad') modalidad?: 'POR_HORA' | 'BLOQUE' | 'DIA_COMPLETO',
  ) {
    return this.admin.metrics({
      from,
      to,
      tipoRecurso,
      modalidad,
    });
  }

  // GET /api/admin/recent-reservas?limit=10
  @Get('recent-reservas')
  async recent(@Query('limit') limit?: string) {
    // sin ?limit -> devuelve todas
    if (!limit) {
      return this.admin.recentReservas();
    }

    const n = Math.max(1, Math.min(50, parseInt(limit, 10) || 10));
    return this.admin.recentReservas(n);
  }

  // PATCH /api/admin/reservas/:id/cancel
  @Patch('reservas/:id/cancel')
  async cancelReserva(@Param('id') id: string) {
    return this.admin.cancelReservaByAdmin(id);
  }
}
