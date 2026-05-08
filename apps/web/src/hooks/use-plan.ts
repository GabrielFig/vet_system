import { useAuthStore } from '@/store/auth.store';

const PLAN_LEVEL: Record<string, number> = { BASIC: 0, PRO: 1, ENTERPRISE: 2 };

export function usePlan() {
  const clinic = useAuthStore((s) => s.clinic);
  const planType = clinic?.planType ?? 'BASIC';
  const level = PLAN_LEVEL[planType] ?? 0;

  return {
    planType,
    planLabel: planType === 'BASIC' ? 'Básico' : planType === 'PRO' ? 'Pro' : 'Enterprise',
    isPro: level >= PLAN_LEVEL['PRO'],
    isEnterprise: level >= PLAN_LEVEL['ENTERPRISE'],
    canUseInventory: level >= PLAN_LEVEL['PRO'],
    canUseReports: level >= PLAN_LEVEL['PRO'],
  };
}
