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

function PawIcon({ size = 48, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="4" r="2"/>
      <circle cx="18" cy="8" r="2"/>
      <circle cx="20" cy="16" r="2"/>
      <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
      <rect width="20" height="16" x="2" y="4" rx="2"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" x2="12" y1="8" y2="12"/>
      <line x1="12" x2="12.01" y1="16" y2="16"/>
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  );
}

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
    <div className="min-h-screen flex">
      {/* Left panel - decorative */}
      <div className="hidden md:flex md:w-1/2 bg-vet-800 flex-col items-center justify-center p-12">
        <div className="text-center">
          <div className="mb-8 opacity-90">
            <PawIcon size={120} color="white" />
          </div>
          <h2 className="font-heading text-3xl font-bold text-white mb-4">VetSystem</h2>
          <p className="text-vet-200 text-lg leading-relaxed max-w-xs">
            Gestiona tu clínica con confianza
          </p>
          <p className="text-vet-300 text-sm mt-4 max-w-xs">
            Historiales médicos, citas, inventario y reportes en un solo lugar.
          </p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Logo for mobile */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-vet-100 mb-4">
              <PawIcon size={40} color="#0D9488" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-vet-800">VetSystem</h1>
            <p className="text-gray-500 text-sm mt-1">Accede a tu clínica</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                <AlertIcon />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-vet-800 mb-1.5">
                Correo electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <EmailIcon />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="doctor@clinica.com"
                  className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-3 text-sm text-vet-800 bg-white focus:outline-none focus:ring-2 focus:ring-vet-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-vet-800 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <LockIcon />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-3 text-sm text-vet-800 bg-white focus:outline-none focus:ring-2 focus:ring-vet-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-vet-500 hover:bg-vet-600 active:scale-95 text-white font-semibold rounded-lg py-3 text-sm transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-vet-500 focus:ring-offset-2"
            >
              {loading ? (
                <>
                  <SpinnerIcon />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
