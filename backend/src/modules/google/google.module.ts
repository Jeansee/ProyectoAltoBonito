import { Module } from '@nestjs/common';
import { GoogleController } from './google.controller';
import { GoogleService } from './google.service';
import { AuthModule } from '../auth/auth.module';                 
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
  ],
  controllers: [GoogleController],
  providers: [GoogleService],
  exports: [GoogleService],
})
export class GoogleModule {}
