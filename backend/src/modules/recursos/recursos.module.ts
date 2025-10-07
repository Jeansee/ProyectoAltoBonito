import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { RecursosController } from './recursos.controller';
import { RecursosService } from './recursos.service';

@Module({
  imports: [PrismaModule],
  controllers: [RecursosController],   // 👈 aquí debe estar
  providers: [RecursosService],
  exports: [RecursosService],
})
export class RecursosModule {}
