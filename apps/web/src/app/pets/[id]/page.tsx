'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/layout/app-shell';
import { Skeleton } from '@/components/ui/skeleton';

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

function PawIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="4" r="2"/>
      <circle cx="18" cy="8" r="2"/>
      <circle cx="20" cy="16" r="2"/>
      <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 19-7-7 7-7"/>
      <path d="M19 12H5"/>
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

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

  if (!ready || !user) return <div className="min-h-screen bg-vet-50" />;

  if (loading) {
    return (
      <AppShell>
        <div className="mb-4">
          <Skeleton className="h-6 w-28" />
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-vet-100 p-6 mb-4">
          <div className="flex items-center gap-5">
            <Skeleton className="w-20 h-20 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-4 w-44" />
            </div>
          </div>
        </div>
        <Skeleton className="h-14 w-full rounded-xl" />
      </AppShell>
    );
  }

  if (!pet) {
    return (
      <AppShell>
        <div className="text-center py-16">
          <p className="text-red-500 font-medium">Mascota no encontrada</p>
        </div>
      </AppShell>
    );
  }

  const age = pet.birthDate
    ? `${Math.floor((Date.now() - new Date(pet.birthDate).getTime()) / 31536000000)} años`
    : 'Edad desconocida';

  return (
    <AppShell>
      {/* Back link */}
      <Link
        href="/pets"
        className="inline-flex items-center gap-2 text-vet-500 hover:text-vet-700 text-sm font-medium mb-5 cursor-pointer transition-colors duration-200"
      >
        <ArrowLeftIcon />
        Mascotas
      </Link>

      {/* Pet card */}
      <div className="bg-white rounded-xl shadow-sm border border-vet-100 p-6 mb-4">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 bg-vet-100 rounded-full flex items-center justify-center text-vet-500 flex-shrink-0">
            {pet.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={pet.photoUrl} alt={pet.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <PawIcon size={40} />
            )}
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-vet-800">{pet.name}</h1>
            <p className="text-gray-500 text-sm mt-1">
              {pet.breed ?? pet.species} · {pet.sex === 'female' || pet.sex === 'FEMALE' ? 'Hembra' : 'Macho'} · {age}
            </p>
            <div className="flex items-center gap-1.5 text-gray-400 text-xs mt-1.5">
              <UserIcon />
              <span>{pet.owner.firstName} {pet.owner.lastName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Medical record link */}
      {pet.record && (
        <Link
          href={`/pets/${pet.id}/record`}
          className="flex items-center justify-center gap-3 bg-vet-500 hover:bg-vet-600 active:scale-95 text-white font-semibold rounded-xl p-4 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-vet-500 focus:ring-offset-2"
        >
          <ClipboardIcon />
          Ver cartilla médica
        </Link>
      )}
    </AppShell>
  );
}
