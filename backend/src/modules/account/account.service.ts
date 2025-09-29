import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AccountService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwt: JwtService,
  ) {}
  private get prisma() { return this.prismaService.prisma; }

  me(userId: string) {
    return this.prisma.usuario.findUnique({
      where: { id: userId },
      select: { id: true, nombre: true, apellido: true, correo: true, telefono: true, rol: true, createdAt: true },
    });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    try {
      const updatedUser = await this.prisma.usuario.update({
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

      // Generar nuevo token con la información actualizada
      const token = await this.jwt.signAsync({
        sub: updatedUser.id,
        correo: updatedUser.correo,
        rol: updatedUser.rol,
      });

      return { user: updatedUser, token };
    } catch (e) {
      console.error('ACCOUNT UPDATE PROFILE ERROR', e);
      throw new InternalServerErrorException();
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    try {
      const user = await this.prisma.usuario.findUnique({
        where: { id: userId },
        select: { id: true, password: true },
      });
      if (!user) throw new UnauthorizedException('Usuario no encontrado');

      const ok = await bcrypt.compare(dto.currentPassword, user.password);
      if (!ok) throw new UnauthorizedException('Contraseña actual incorrecta');

      // ⚠️ Deja el hashing al Prisma Extension que ya tienes:
      await this.prisma.usuario.update({
        where: { id: userId },
        data: { password: dto.newPassword },
      });

      return { ok: true };
    } catch (e) {
      if (e instanceof UnauthorizedException) throw e;
      console.error('ACCOUNT CHANGE PASSWORD ERROR', e);
      throw new InternalServerErrorException();
    }
  }
}
