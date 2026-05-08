import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlanType, JwtPayload } from '@vet/shared-types';
import { PLAN_KEY } from '../decorators/requires-plan.decorator';

const PLAN_LEVEL: Record<PlanType, number> = {
  [PlanType.BASIC]: 0,
  [PlanType.PRO]: 1,
  [PlanType.ENTERPRISE]: 2,
};

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<PlanType>(PLAN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;

    const { user } = context.switchToHttp().getRequest<{ user: JwtPayload }>();
    const userLevel = PLAN_LEVEL[user?.planType ?? PlanType.BASIC] ?? 0;

    if (userLevel < PLAN_LEVEL[required]) {
      throw new HttpException(
        { message: 'PLAN_UPGRADE_REQUIRED', requiredPlan: required },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
    return true;
  }
}
