import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  IsBoolean,           
} from 'class-validator';

export class ReservaItemDto {
  @IsString()
  recursoId: string;

  @IsIn(['POR_HORA', 'DIA_COMPLETO', 'BLOQUE'])
  modalidad: 'POR_HORA' | 'DIA_COMPLETO' | 'BLOQUE';

  // POR_HORA y BLOQUE usan desde/hasta
  @IsOptional()
  @IsDateString()
  desde?: string;

  @IsOptional()
  @IsDateString()
  hasta?: string;

  // DIA_COMPLETO
  @IsOptional()
  @IsString()
  fecha?: string;

  // (Opcional para futuro: bloque por turno predefinido)
  @IsOptional()
  @IsString()
  turnoId?: string;
}

export class CreateReservaDto {
  @IsString()
  @IsNotEmpty()
  usuarioId: string;

  // Informativa (la que se muestra arriba). Cada item trae su modalidad real.
  @IsOptional()
  @IsIn(['POR_HORA', 'DIA_COMPLETO', 'BLOQUE'])
  modalidad?: 'POR_HORA' | 'DIA_COMPLETO' | 'BLOQUE';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReservaItemDto)
  items: ReservaItemDto[];

  @IsOptional()
  @Type(() => Boolean)   // permite recibir "true"/"false" como string y convertirlos
  @IsBoolean()
  addToCalendar?: boolean;
}
