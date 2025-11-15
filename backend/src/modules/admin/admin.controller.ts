import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminOnlyGuard } from '../../common/guards/admin-only.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminOnlyGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  // GET /api/admin/metrics?from=YYYY-MM-DD&to=YYYY-MM-DD
  @Get('metrics')
  async getMetrics(@Query('from') from?: string, @Query('to') to?: string) {
    return this.admin.metrics({ from, to });
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
}
