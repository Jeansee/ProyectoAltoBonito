import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';
// ❌  NO uses: import { Prisma } from '@prisma/client';

export const TIPO_RECURSO_VALUES = ['QUINCHO','PISCINA','CANCHA'] as const;
export type TipoRecursoLiteral = typeof TIPO_RECURSO_VALUES[number];

export class ListRecursosDto {
  @IsOptional()
  @IsIn(TIPO_RECURSO_VALUES, { message: 'tipo inválido' })
  tipo?: TipoRecursoLiteral;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => ['true', true, '1', 1].includes(value))
  activo?: boolean;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => parseInt(value, 10))
  @Min(1)
  page: number = 1;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => parseInt(value, 10))
  @Min(1)
  limit: number = 12;

  @IsOptional()
  @IsString()
  sort?: 'nombre_asc' | 'nombre_desc' | 'precioHora_asc' | 'precioHora_desc' | 'precioDia_asc' | 'precioDia_desc';
}
