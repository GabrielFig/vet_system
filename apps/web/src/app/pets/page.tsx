'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { apiFetch } from '@/lib/api';
import { PetSummary } from '@vet/shared-types';
import { PetCard } from '@/components/pets/pet-card';
import { PetForm } from '@/components/pets/pet-form';

export default function PetsPage() {
  const router = useRouter();
  const { user, accessToken } = useAuthStore();
  const [pets, setPets] = useState<PetSummary[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    apiFetch<PetSummary[]>('/pets', { token: accessToken ?? undefined })
      .then(setPets)
      .finally(() => setLoading(false));
  }, [user, accessToken, router]);

  const filtered = pets.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.breed ?? '').toLowerCase().includes(search.toLowerCase()) ||
      `${p.owner.firstName} ${p.owner.lastName}`.toLowerCase().includes(search.toLowerCase()),
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center gap-4">
        <a href="/dashboard" className="text-slate-400 hover:text-white text-sm">← Dashboard</a>
        <span className="text-slate-600">|</span>
        <span className="font-semibold">Mascotas</span>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Mascotas</h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            + Nueva mascota
          </button>
        </div>

        {showForm && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
            <h2 className="font-semibold mb-4">Nueva mascota</h2>
            <PetForm
              onSuccess={(pet) => { setPets((prev) => [pet as unknown as PetSummary, ...prev]); setShowForm(false); }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Buscar por nombre, raza o dueño..."
          className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm mb-4 focus:outline-none focus:border-indigo-500"
        />

        {loading ? (
          <div className="text-slate-400 text-center py-12">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-slate-400 text-center py-12">No se encontraron mascotas</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((pet) => <PetCard key={pet.id} pet={pet} />)}
          </div>
        )}
      </main>
    </div>
  );
}
