import { Module } from '@nestjs/common';
import { MailerService } from './mailer.service';

@Module({
  providers: [MailerService],
  exports: [MailerService], // 👈 exportamos para que otros módulos lo usen
})
export class MailerModule {}
