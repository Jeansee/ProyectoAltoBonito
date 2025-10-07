// backend/src/modules/recursos/recursos.controller.ts
import { Controller, Get, Param, Query, BadRequestException } from '@nestjs/common';
import { RecursosService } from './recursos.service';

type Modalidad = 'POR_HORA' | 'DIA_COMPLETO' | 'BLOQUE';

@Controller('recursos')
export class RecursosController {
  constructor(private readonly service: RecursosService) {}

  @Get()
  list(@Query() q: any) {
    // normaliza tipo
    const tipoRaw = (q.tipo ?? '').toString().toUpperCase();
    const tipo: 'QUINCHO' | 'PISCINA' | 'CANCHA' | undefined =
      tipoRaw === 'QUINCHO' || tipoRaw === 'PISCINA' || tipoRaw === 'CANCHA'
        ? (tipoRaw as any)
        : undefined;

    // normaliza sort
    const validSort = [
      'nombre_asc',
      'nombre_desc',
      'precioHora_asc',
      'precioHora_desc',
      'precioDia_asc',
      'precioDia_desc',
    ] as const;
    const sort = validSort.includes(q.sort) ? q.sort : 'nombre_asc';

    const activo =
      q.activo === 'true' ? true : q.activo === 'false' ? false : undefined;

    const page = Number(q.page ?? 1);
    const limit = Number(q.limit ?? 12);

    return this.service.list({
      tipo,
      search: q.search,
      activo,
      page,
      limit,
      sort,
    });
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/slots')
  async slots(
    @Param('id') id: string,
    @Query('fecha') fecha: string,
    @Query('step') stepStr?: string,
  ) {
    if (!fecha) throw new BadRequestException('Parámetro "fecha" es requerido (YYYY-MM-DD)');
    const step = Math.max(15, Number(stepStr ?? 60));
    return this.service.getSlots(id, fecha, step);
  }

  @Get(':id/availability')
  async availability(
    @Param('id') id: string,
    @Query('from') from: string, // YYYY-MM-DD
    @Query('to') to: string,     // YYYY-MM-DD
    @Query('mode') mode?: string,
  ) {
    if (!from || !to) {
      throw new BadRequestException('Parámetros "from" y "to" son requeridos (YYYY-MM-DD)');
    }
    const normalizedMode: Modalidad =
      mode === 'POR_HORA' || mode === 'BLOQUE' || mode === 'DIA_COMPLETO'
        ? (mode as Modalidad)
        : 'DIA_COMPLETO';

    return this.service.getAvailabilityRange(id, from, to, normalizedMode);
  }
}
