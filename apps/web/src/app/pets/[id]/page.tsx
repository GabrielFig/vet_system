'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { apiFetch } from '@/lib/api';

interface PetDetail {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  sex: string;
  birthDate: string | null;
  photoUrl: string | null;
  owner: { id: string; firstName: string; lastName: string; email: string };
  record: { id: string; publicUuid: string; isPublic: boolean } | null;
}

const SPECIES_EMOJI: Record<string, string> = {
  dog: '🐶', cat: '🐱', bird: '🐦', rabbit: '🐰', other: '🐾',
};

export default function PetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, accessToken, ready } = useRequireAuth();
  const [pet, setPet] = useState<PetDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready || !user) return;
    apiFetch<PetDetail>(`/pets/${id}`, { token: accessToken ?? undefined })
      .then(setPet)
      .finally(() => setLoading(false));
  }, [ready, user, id, accessToken]);

  if (!ready || !user || loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">Cargando...</div>;
  if (!pet) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-red-400">Mascota no encontrada</div>;

  const age = pet.birthDate
    ? `${Math.floor((Date.now() - new Date(pet.birthDate).getTime()) / 31536000000)} años`
    : 'Edad desconocida';

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center gap-4">
        <a href="/pets" className="text-slate-400 hover:text-white text-sm">← Mascotas</a>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-4">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center text-4xl flex-shrink-0">
              {SPECIES_EMOJI[pet.species] ?? '🐾'}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{pet.name}</h1>
              <p className="text-slate-400 text-sm mt-1">
                {pet.breed ?? pet.species} · {pet.sex === 'female' || pet.sex === 'FEMALE' ? 'Hembra' : 'Macho'} · {age}
              </p>
              <p className="text-slate-500 text-xs mt-1">
                Dueño: {pet.owner.firstName} {pet.owner.lastName}
              </p>
            </div>
          </div>
        </div>

        {pet.record && (
          <Link
            href={`/pets/${pet.id}/record`}
            className="block bg-indigo-600 hover:bg-indigo-700 text-white text-center font-semibold rounded-xl p-4 transition-colors"
          >
            📋 Ver cartilla médica
          </Link>
        )}
      </main>
    </div>
  );
}
