// src/modules/auth/dto/register.dto.ts
import { IsEmail, IsString, MinLength, IsOptional, Matches, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsString() nombre: string;

  @IsEmail() correo: string;

  
  @IsString() @MinLength(2) @MaxLength(100)
  apellido: string;    

  @IsString()
  @Matches(/^\+?\d{8,15}$/) // +569..., 9-15 dígitos
  telefono: string;

  @IsOptional()
  @Matches(/^\+?\d{8,15}$/)
  whatsapp?: string | null;

  @IsString()
  @MinLength(8)
  password: string;
}
