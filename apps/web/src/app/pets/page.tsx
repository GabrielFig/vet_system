'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { apiFetch } from '@/lib/api';
import { PetSummary } from '@vet/shared-types';
import { PetCard } from '@/components/pets/pet-card';
import { PetForm } from '@/components/pets/pet-form';
import { AppShell } from '@/components/layout/app-shell';
import { SkeletonCard } from '@/components/ui/skeleton';

function PawIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="4" r="2"/>
      <circle cx="18" cy="8" r="2"/>
      <circle cx="20" cy="16" r="2"/>
      <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" x2="12" y1="5" y2="19"/>
      <line x1="5" x2="19" y1="12" y2="12"/>
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.35-4.35"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18"/>
      <path d="m6 6 12 12"/>
    </svg>
  );
}

function PetsPageInner() {
  const { user, accessToken, ready } = useRequireAuth();
  const searchParams = useSearchParams();
  const clientId = searchParams.get('clientId');
  const [pets, setPets] = useState<PetSummary[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready || !user) return;
    const url = clientId ? `/pets?clientId=${encodeURIComponent(clientId)}` : '/pets';
    apiFetch<PetSummary[]>(url, { token: accessToken ?? undefined })
      .then(setPets)
      .finally(() => setLoading(false));
  }, [ready, user, accessToken, clientId]);

  const filtered = pets.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.breed ?? '').toLowerCase().includes(search.toLowerCase()) ||
      `${p.client.firstName} ${p.client.lastName}`.toLowerCase().includes(search.toLowerCase()),
  );

  if (!ready || !user) return <div className="min-h-screen bg-vet-50" />;

  const clientName = pets[0]?.client ? `${pets[0].client.firstName} ${pets[0].client.lastName}` : '';

  return (
    <AppShell>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-vet-100 flex items-center justify-center text-vet-500">
            <PawIcon />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-vet-800">Mascotas</h1>
            {clientId && clientName && (
              <p className="text-xs text-vet-500 mt-0.5">Filtrando por: {clientName}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-vet-500 hover:bg-vet-600 active:scale-95 text-white font-medium px-4 py-2.5 rounded-lg text-sm transition-all duration-200 cursor-pointer flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-vet-500 focus:ring-offset-2"
        >
          <PlusIcon />
          Nueva mascota
        </button>
      </div>

      {/* Search input */}
      <div className="relative mb-5">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <SearchIcon />
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, raza o dueño..."
          className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-3 text-sm text-vet-800 focus:outline-none focus:ring-2 focus:ring-vet-500 focus:border-transparent transition-all duration-200"
        />
      </div>

      {/* Pet list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-vet-100 mb-4 text-vet-200">
            <PawIcon size={48} />
          </div>
          <p className="text-gray-500 font-medium">No se encontraron mascotas</p>
          <p className="text-gray-400 text-sm mt-1">
            {search ? 'Intenta con otra búsqueda' : 'Agrega tu primera mascota'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((pet) => <PetCard key={pet.id} pet={pet} />)}
        </div>
      )}

      {/* New pet modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-heading font-semibold text-vet-800 text-lg">Nueva mascota</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-vet-500 rounded-lg p-1"
                aria-label="Cerrar"
              >
                <XIcon />
              </button>
            </div>
            <PetForm
              onSuccess={(pet) => {
                setPets((prev) => [pet as unknown as PetSummary, ...prev]);
                setShowForm(false);
              }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default function PetsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-vet-50" />}>
      <PetsPageInner />
    </Suspense>
  );
}
