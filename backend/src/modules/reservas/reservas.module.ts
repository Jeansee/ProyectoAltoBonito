import { Module } from '@nestjs/common';
import { ReservasService } from './reservas.service';
import { ReservasController } from './reservas.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { GoogleModule } from '../google/google.module';
import { MailerModule } from '../mailer/mailer.module'; // 👈

@Module({
  imports: [PrismaModule, GoogleModule, MailerModule], // 👈 agregado
  controllers: [ReservasController],
  providers: [ReservasService],
  exports: [ReservasService],
})
export class ReservasModule {}
