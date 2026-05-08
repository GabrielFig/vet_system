import { useAuthStore } from '@/store/auth.store';

export function usePlan() {
  const clinic = useAuthStore((s) => s.clinic);
  const modules = useAuthStore((s) => s.modules);
  const isSuperAdmin = useAuthStore((s) => s.isSuperAdmin);
  const planType = (clinic?.planType ?? 'BASIC') as string;

  return {
    planType,
    planLabel: planType === 'BASIC' ? 'Básico' : planType === 'PRO' ? 'Pro' : 'Enterprise',
    canUseInventory: modules.includes('INVENTORY'),
    canUseReports: modules.includes('REPORTS'),
    modules,
    isSuperAdmin,
  };
}
