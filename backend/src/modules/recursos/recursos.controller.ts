import { Controller, Get, Param, Query } from '@nestjs/common';
import { RecursosService } from './recursos.service';

@Controller('recursos')
export class RecursosController {
  constructor(private readonly service: RecursosService) {}

  @Get()
  list(@Query() q: any) {
    return this.service.list({
      tipo: q.tipo,
      search: q.search,
      activo: q.activo === 'true' ? true : q.activo === 'false' ? false : undefined,
      page: Number(q.page ?? 1),
      limit: Number(q.limit ?? 12),
      sort: q.sort ?? 'nombre_asc',
    });
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
