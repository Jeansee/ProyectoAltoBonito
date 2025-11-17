// src/modules/admin/admin.controller.ts
import { Controller, Get, Query, UseGuards, Patch, Param } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminOnlyGuard } from '../../common/guards/admin-only.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Body, Req, Post, Delete } from '@nestjs/common/decorators';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminOnlyGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

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

  @Get('recent-reservas')
  async recent(@Query('limit') limit?: string) {
    if (!limit) return this.admin.recentReservas();
    const n = Math.max(1, Math.min(50, parseInt(limit, 10) || 10));
    return this.admin.recentReservas(n);
  }

  @Patch('reservas/:id/cancel')
  async cancelReserva(@Param('id') id: string) {
    return this.admin.cancelReservaByAdmin(id);
  }

  // ------------------ BLOQUEOS ------------------

  @Get('bloqueos')
  async listBloqueos() {
    return this.admin.getBloqueos();
  }

  @Post('bloqueos')
  async crearBloqueo(@Body() body, @Req() req) {
    const adminId = req.user.userId ?? req.user.sub;

    if (!adminId) {
      throw new Error('adminId requerido para crear bloqueo');
    }

    return this.admin.createBloqueo({
      recursoId: body.recursoId,
      motivo: body.motivo,
      inicio: body.inicio,
      fin: body.fin,
      adminId,
    });
  }

  @Delete('bloqueos/:id')
  async eliminarBloqueo(@Param('id') id: string) {
    return this.admin.deleteBloqueo(id);
  }
}
