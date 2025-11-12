// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { RecursosModule } from './modules/recursos/recursos.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { ReservasModule } from './modules/reservas/reservas.module';
import { GoogleModule } from './modules/google/google.module';
import { HealthController } from './common/health.controller';
import { AdminModule } from './modules/admin/admin.module';
import { TbkModule } from './modules/tbk/tbk.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    RecursosModule,
    PrismaModule,
    ReservasModule,
    AdminModule,
    GoogleModule,
    TbkModule
    ],
  controllers: [HealthController],

})
export class AppModule {}
