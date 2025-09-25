import { IsOptional, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(100)
  nombre?: string;

  @IsOptional() @IsString() @MinLength(2) @MaxLength(100)
  apellido?: string;

  @IsOptional() @Matches(/^\+?\d{8,15}$/)
  telefono?: string;

  @IsOptional() @Matches(/^\+?\d{8,15}$/)
  whatsapp?: string | null;
}
