'use client';

function LockIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

interface UpgradeBannerProps {
  feature: string;
  requiredPlan: 'PRO' | 'ENTERPRISE';
  currentPlan: string;
}

const PLAN_LABEL: Record<string, string> = { BASIC: 'Básico', PRO: 'Pro', ENTERPRISE: 'Enterprise' };

export function UpgradeBanner({ feature, requiredPlan, currentPlan }: UpgradeBannerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center text-amber-500 mb-5">
        <LockIcon />
      </div>
      <h2 className="font-heading text-xl font-bold text-vet-800 mb-2">{feature}</h2>
      <p className="text-gray-500 text-sm max-w-xs mb-1">
        Esta función está disponible en el plan <span className="font-semibold text-vet-700">{PLAN_LABEL[requiredPlan] ?? requiredPlan}</span>.
      </p>
      <p className="text-gray-400 text-xs mb-6">
        Tu clínica está en plan <span className="font-medium">{PLAN_LABEL[currentPlan] ?? currentPlan}</span>.
      </p>
      <div className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors cursor-default select-none">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
        Actualizar plan
      </div>
      <p className="text-gray-400 text-xs mt-3">Contacta al administrador del sistema</p>
    </div>
  );
}
