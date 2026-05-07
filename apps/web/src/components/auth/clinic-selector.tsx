'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { ClinicSelectionRequired, AuthResponse } from '@vet/shared-types';

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
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-sm bg-slate-800 rounded-xl p-8">
        <h2 className="text-white font-semibold text-center mb-1">¿Desde qué clínica trabajas hoy?</h2>
        <p className="text-slate-400 text-sm text-center mb-6">Tu cuenta está asociada a más de una clínica</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {data.clinics.map((clinic) => (
            <button
              key={clinic.id}
              onClick={() => select(clinic.id)}
              disabled={loading}
              className="w-full bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-indigo-500 text-left rounded-xl p-4 flex items-center gap-4 transition-colors disabled:opacity-50"
            >
              <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center text-xl">🏥</div>
              <div className="flex-1">
                <div className="text-white font-medium text-sm">{clinic.name}</div>
                <div className="text-slate-400 text-xs mt-0.5">Rol: {clinic.role}</div>
              </div>
              <span className="text-slate-400">›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
