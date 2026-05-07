'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import {
  LoginResult,
  AuthResponse,
  ClinicSelectionRequired,
} from '@vet/shared-types';
import { ClinicSelector } from './clinic-selector';

export function LoginForm() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [clinicSelection, setClinicSelection] = useState<ClinicSelectionRequired | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await apiFetch<LoginResult>('/auth/login', {
        method: 'POST',
        body: { email, password },
      });

      if ('requiresClinicSelection' in result) {
        setClinicSelection(result);
      } else {
        const auth = result as AuthResponse;
        setAuth(auth);
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  if (clinicSelection) {
    return <ClinicSelector data={clinicSelection} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🐾</div>
          <h1 className="text-2xl font-bold text-white">VetSystem</h1>
          <p className="text-slate-400 text-sm mt-1">Accede a tu clínica</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-800 rounded-xl p-8 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          <div>
            <label className="block text-slate-300 text-sm mb-1.5">Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
              placeholder="doctor@clinica.com"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm mb-1.5">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
