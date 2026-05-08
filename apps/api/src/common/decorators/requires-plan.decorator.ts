import { SetMetadata } from '@nestjs/common';
import { PlanType } from '@vet/shared-types';

export const PLAN_KEY = 'requiredPlan';
export const RequiresPlan = (plan: PlanType) => SetMetadata(PLAN_KEY, plan);
