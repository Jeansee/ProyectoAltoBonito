import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { ReservasService } from './reservas.service';
import { CreateReservaDto } from './dto/create-reserva.dto';

@Controller('reservas')
export class ReservasController {
  constructor(private readonly service: ReservasService) {}

  @Post()
  create(@Body() dto: CreateReservaDto) {
    return this.service.create(dto);
  }

  // ⚠️ Importante: esta ruta VA ANTES de ':id'
  @Get('mias')
  getMine(
    @Req() req: any,
    @Query('userId') userIdFromQuery?: string,
  ) {
    // Si tienes JWT, aquí normalmente tendrías: const userId = req.user.id
    const userId =
      (req && req.user && req.user.id) ||
      userIdFromQuery ||
      null;

    if (!userId) {
      throw new UnauthorizedException(
        'No se pudo determinar el usuario. Inicia sesión o envía ?userId=',
      );
    }
    return this.service.getMine(userId);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.service.getById(id);
  }
}
