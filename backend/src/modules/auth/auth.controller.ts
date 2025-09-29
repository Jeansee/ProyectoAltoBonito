import { 
  Body, 
  Controller, 
  Post, 
  Get, 
  Patch, 
  UseGuards, 
  Req, 
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';


interface RequestWithUser extends Request {
  user: {
    userId: string;
    correo: string;
    rol: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /**
   * Registra un nuevo usuario en el sistema
   */
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    try {
      return await this.auth.register(dto);
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException('El correo electrónico ya está registrado');
      }
      throw new InternalServerErrorException('Error al registrar el usuario');
    }
  }

  /**
   * Inicia sesión con credenciales de usuario
   */
  @Post('login')
  async login(@Body() dto: LoginDto) {
    try {
      return await this.auth.login(dto);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al iniciar sesión');
    }
  }

  /**
   * Obtiene los datos del usuario actual
   */
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async me(@Req() req: RequestWithUser) {
    if (!req.user?.userId) {
      throw new UnauthorizedException('Usuario no autenticado');
    }
    try {
      return await this.auth.me(req.user.userId);
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener datos del usuario');
    }
  }

  /**
   * Actualiza el perfil del usuario
   */
  @UseGuards(AuthGuard('jwt'))
  @Patch('profile')
  async updateProfile(@Req() req: RequestWithUser, @Body() dto: UpdateProfileDto) {
    if (!req.user?.userId) {
      throw new UnauthorizedException('Usuario no autenticado');
    }
    try {
      return await this.auth.updateProfile(req.user.userId, dto);
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException('El teléfono ya está registrado');
      }
      throw new InternalServerErrorException('Error al actualizar el perfil');
    }
  }

  /**
   * Cambia la contraseña del usuario
   */
  @UseGuards(AuthGuard('jwt'))
  @Post('change-password')
  async changePassword(@Req() req: RequestWithUser, @Body() dto: ChangePasswordDto) {
    if (!req.user?.userId) {
      throw new UnauthorizedException('Usuario no autenticado');
    }
    try {
      return await this.auth.changePassword(req.user.userId, dto);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al cambiar la contraseña');
    }
  }
}
