'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/layout/app-shell';
import { Skeleton } from '@/components/ui/skeleton';
import { NewAppointmentForm } from '@/components/appointments/new-appointment-form';

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
  const [showNewAppt, setShowNewAppt] = useState(false);

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

      {/* Action buttons */}
      <div className="flex flex-col gap-3">
        {/* Create appointment */}
        <button
          onClick={() => setShowNewAppt(true)}
          className="flex items-center justify-center gap-3 bg-vet-500 hover:bg-vet-600 active:scale-95 text-white font-semibold rounded-xl p-4 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-vet-500 focus:ring-offset-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
            <line x1="16" x2="16" y1="2" y2="6"/>
            <line x1="8" x2="8" y1="2" y2="6"/>
            <line x1="3" x2="21" y1="10" y2="10"/>
            <line x1="12" x2="12" y1="14" y2="18"/>
            <line x1="10" x2="14" y1="16" y2="16"/>
          </svg>
          Crear cita
        </button>

        {/* Medical record link */}
        {pet.record && (
          <Link
            href={`/pets/${pet.id}/record`}
            className="flex items-center justify-center gap-3 bg-white hover:bg-vet-50 active:scale-95 text-vet-700 border border-vet-200 font-semibold rounded-xl p-4 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-vet-500 focus:ring-offset-2"
          >
            <ClipboardIcon />
            Ver cartilla médica
          </Link>
        )}
      </div>

      {/* New appointment modal */}
      {showNewAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-vet-100">
              <h2 className="font-heading font-bold text-vet-800 text-lg">Nueva cita — {pet.name}</h2>
              <button onClick={() => setShowNewAppt(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="p-5">
              <NewAppointmentForm
                token={accessToken}
                initialPetId={pet.id}
                initialPetName={pet.name}
                onSuccess={() => setShowNewAppt(false)}
                onCancel={() => setShowNewAppt(false)}
              />
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
