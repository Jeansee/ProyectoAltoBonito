import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { RecursosModule } from './modules/recursos/recursos.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { ReservasModule } from './modules/reservas/reservas.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,    
    RecursosModule, 
    PrismaModule,
    ReservasModule // 👈 IMPORTANTE
  ],
})
export class AppModule {}
