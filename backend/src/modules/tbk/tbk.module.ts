import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { TbkService } from './tbk.service';
import { TbkController } from './tbk.controller';
import { MailerModule } from '../mailer/mailer.module'; // 👈

@Module({
  imports: [PrismaModule, MailerModule], // 👈 agregado
  controllers: [TbkController],
  providers: [TbkService],
  exports: [TbkService],
})
export class TbkModule {}
