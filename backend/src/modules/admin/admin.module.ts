// backend/src/modules/admin/admin.module.ts
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminOnlyGuard } from '../../common/guards/admin-only.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }), // asegura estrategia 'jwt'
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminOnlyGuard],
})
export class AdminModule {}
