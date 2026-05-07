'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export default function DashboardPage() {
  const router = useRouter();
  const { user, clinic, role, clearAuth } = useAuthStore();

  useEffect(() => {
    if (!user) router.replace('/login');
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🐾</span>
          <div>
            <div className="font-bold">VetSystem</div>
            <div className="text-slate-400 text-xs">{clinic?.name}</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <a href="/pets" className="text-slate-300 hover:text-white text-sm">Mascotas</a>
          <button onClick={() => { clearAuth(); router.push('/login'); }} className="text-slate-400 hover:text-white text-sm">
            Salir
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold mb-2">
          Bienvenido, {user.firstName} {user.lastName}
        </h1>
        <p className="text-slate-400 mb-8">
          {clinic?.name} · Rol: <span className="text-indigo-400">{role}</span>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a href="/pets" className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl p-6 block transition-colors">
            <div className="text-3xl mb-3">🐾</div>
            <div className="font-semibold">Mascotas</div>
            <div className="text-slate-400 text-sm mt-1">Ver y gestionar pacientes</div>
          </a>
        </div>
      </main>
    </div>
  );
}
