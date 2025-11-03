// backend/src/common/guards/admin-only.guard.ts
import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AdminOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user) throw new ForbiddenException('No autenticado');
    if (user.rol !== 'ADMIN') throw new ForbiddenException('Requiere rol ADMIN');

    return true;
    }
}
