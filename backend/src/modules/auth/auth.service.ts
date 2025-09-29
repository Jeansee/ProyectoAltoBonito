// src/modules/auth/auth.service.ts
import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private get prisma() {
    return this.prismaService.prisma;
  }

  private async generateToken(user: { id: string; correo: string; rol: string }) {
    try {
      const token = await this.jwt.signAsync({
        sub: user.id,
        correo: user.correo,
        rol: user.rol,
      });
      return token;
    } catch (err) {
      console.error('JWT SIGN ERROR', err);
      throw new InternalServerErrorException('No se pudo firmar el token');
    }
  }

  async me(userId: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        correo: true,
        telefono: true,
        rol: true,
        createdAt: true,
      },
    });

    if (!user) throw new UnauthorizedException('Usuario no encontrado');
    const token = await this.generateToken(user);
    return { user, token };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    try {
      const user = await this.prisma.usuario.update({
        where: { id: userId },
        data: {
          ...(dto.nombre !== undefined && { nombre: dto.nombre }),
          ...(dto.apellido !== undefined && { apellido: dto.apellido }),
          ...(dto.telefono !== undefined && { telefono: dto.telefono }),
          ...(dto.whatsapp !== undefined && { whatsapp: dto.whatsapp ?? null }),
        },
        select: {
          id: true,
          nombre: true,
          apellido: true,
          correo: true,
          telefono: true,
          rol: true,
          createdAt: true,
        },
      });

      const token = await this.generateToken(user);
      return { user, token };
    } catch (e) {
      console.error('UPDATE PROFILE ERROR', e);
      throw new InternalServerErrorException();
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    try {
      const user = await this.prisma.usuario.findUnique({
        where: { id: userId },
        select: { password: true },
      });

      if (!user) throw new UnauthorizedException('Usuario no encontrado');

      const ok = await bcrypt.compare(dto.currentPassword, user.password);
      if (!ok) throw new UnauthorizedException('Contraseña actual incorrecta');

      await this.prisma.usuario.update({
        where: { id: userId },
        data: { password: await bcrypt.hash(dto.newPassword, 10) },
      });

      return { ok: true };
    } catch (e) {
      if (e instanceof UnauthorizedException) throw e;
      console.error('CHANGE PASSWORD ERROR', e);
      throw new InternalServerErrorException();
    }
  }

  async register(dto: RegisterDto) {
    try {
      const user = await this.prisma.usuario.create({
        data: {
          nombre: dto.nombre,
          apellido: dto.apellido,
          correo: dto.correo,
          telefono: dto.telefono,
          whatsapp: dto.whatsapp ?? null,
          password: dto.password, // <- Prisma Extension lo hashea
        },
        select: {
          id: true,
          nombre: true,
          apellido: true,
          correo: true,
          telefono: true,
          rol: true,
          createdAt: true,
        },
      });

      // ⬇️ Firma del token protegida con try/catch
      try {
        const token = await this.jwt.signAsync({
          sub: user.id,
          correo: user.correo,
          rol: user.rol,
        });
        return { user, token };
      } catch (err) {
        console.error('JWT SIGN ERROR (register)', err);
        throw new InternalServerErrorException('No se pudo firmar el token');
      }
    } catch (e: any) {
      console.error('🚨 [AUTH REGISTER ERROR FULL]', JSON.stringify(e, null, 2));
      if (e?.code === 'P2002') throw new ConflictException('El correo ya está registrado');
      if (e?.code === 'P2000') throw new BadRequestException('Dato inválido o demasiado largo');
      if (e?.code === 'P2003') throw new BadRequestException('Referencia no válida');
      if (e?.code === 'P2025') throw new BadRequestException('Recurso no encontrado para la operación');
      throw new InternalServerErrorException();
    }
  }

  async login(dto: LoginDto) {
    try {
      const user = await this.prisma.usuario.findUnique({
        where: { correo: dto.correo },
        select: {
          id: true,
          nombre: true,
          apellido: true,   // ⬅️ importante para mostrar en UI
          correo: true,
          telefono: true,
          rol: true,
          password: true,   // para comparar
        },
      });

      if (!user) throw new UnauthorizedException('Credenciales inválidas');

      const ok = await bcrypt.compare(dto.password, user.password);
      if (!ok) throw new UnauthorizedException('Credenciales inválidas');

      const { password, ...safeUser } = user;

      // ⬇️ Firma del token protegida con try/catch
      try {
        const token = await this.jwt.signAsync({
          sub: safeUser.id,
          correo: safeUser.correo,
          rol: safeUser.rol,
        });
        return { user: safeUser, token };
      } catch (err) {
        console.error('JWT SIGN ERROR (login)', err);
        throw new InternalServerErrorException('No se pudo firmar el token');
      }
    } catch (e) {
      if (e instanceof UnauthorizedException) throw e;
      console.error('AUTH LOGIN ERROR', e);
      throw new InternalServerErrorException();
    }
  }
}
