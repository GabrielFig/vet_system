import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClinicModuleType, JwtPayload } from '@vet/shared-types';
import { MODULE_KEY } from '../decorators/requires-module.decorator';

@Injectable()
export class ModuleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<ClinicModuleType>(MODULE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;

    const { user } = context.switchToHttp().getRequest<{ user: JwtPayload }>();
    const modules: string[] = user?.modules ?? [];

    if (!modules.includes(required)) {
      throw new HttpException(
        { message: 'MODULE_NOT_ENABLED', requiredModule: required },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
    return true;
  }
}
