'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { ClinicSelectionRequired, AuthResponse } from '@vet/shared-types';

function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" x2="12" y1="8" y2="12"/>
      <line x1="12" x2="12.01" y1="16" y2="16"/>
    </svg>
  );
}

function ClinicBuildingIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}

function PawIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="4" r="2"/>
      <circle cx="18" cy="8" r="2"/>
      <circle cx="20" cy="16" r="2"/>
      <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>
    </svg>
  );
}

export function ClinicSelector({ data }: { data: ClinicSelectionRequired }) {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function select(clinicId: string) {
    setError('');
    setLoading(true);
    try {
      const result = await apiFetch<AuthResponse>('/auth/select-clinic', {
        method: 'POST',
        body: { tempToken: data.tempToken, clinicId },
      });
      setAuth(result);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al seleccionar clínica');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-vet-50 px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-vet-100 mb-4">
            <PawIcon />
          </div>
          <h2 className="font-heading font-bold text-vet-800 text-xl">Selecciona tu clínica</h2>
          <p className="text-gray-500 text-sm mt-1">Tu cuenta está asociada a más de una clínica</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
            <AlertIcon />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3">
          {data.clinics.map((clinic) => (
            <button
              key={clinic.id}
              onClick={() => select(clinic.id)}
              disabled={loading}
              className="w-full bg-white hover:bg-vet-50 border border-vet-100 hover:border-vet-300 text-left rounded-xl p-4 flex items-center gap-4 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-95 focus:outline-none focus:ring-2 focus:ring-vet-500 focus:ring-offset-2"
            >
              <div className="w-10 h-10 bg-vet-100 rounded-lg flex items-center justify-center text-vet-500 flex-shrink-0">
                <ClinicBuildingIcon />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-vet-800 font-medium text-sm">{clinic.name}</div>
                <div className="text-gray-500 text-xs mt-0.5">Rol: {clinic.role}</div>
              </div>
              <span className="text-vet-400 flex-shrink-0">
                <ChevronRightIcon />
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
