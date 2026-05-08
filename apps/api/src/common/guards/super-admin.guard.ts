import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { JwtPayload } from '@vet/shared-types';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest<{ user: JwtPayload }>();
    if (!user?.isSuperAdmin) {
      throw new ForbiddenException('Se requieren permisos de super administrador');
    }
    return true;
  }
}
