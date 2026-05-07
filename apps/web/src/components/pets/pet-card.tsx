import Link from 'next/link';
import { PetSummary } from '@vet/shared-types';

function PawIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="4" r="2"/>
      <circle cx="18" cy="8" r="2"/>
      <circle cx="20" cy="16" r="2"/>
      <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>
    </svg>
  );
}

function BirdIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 7h.01"/>
      <path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20"/>
      <path d="m20 7 2 .5-2 .5"/>
      <path d="M10 18v3"/>
      <path d="M14 17.75V21"/>
      <path d="M7 18a6 6 0 0 0 3.84-10.61"/>
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

function SpeciesIcon({ species }: { species: string }) {
  if (species === 'bird') return <BirdIcon />;
  return <PawIcon />;
}

export function PetCard({ pet }: { pet: PetSummary }) {
  const age = pet.birthDate
    ? `${Math.floor((Date.now() - new Date(pet.birthDate).getTime()) / 31536000000)} años`
    : 'Edad desconocida';

  return (
    <Link
      href={`/pets/${pet.id}`}
      className="block bg-white rounded-xl p-5 shadow-sm border border-vet-100 hover:shadow-md hover:border-vet-300 transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-vet-100 rounded-full flex items-center justify-center text-vet-500 flex-shrink-0">
          {pet.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pet.photoUrl} alt={pet.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            <SpeciesIcon species={pet.species} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-vet-800">{pet.name}</div>
          <div className="text-gray-500 text-sm truncate mt-0.5">
            {pet.breed ?? pet.species} · {(pet.sex as string) === 'FEMALE' || pet.sex === 'female' ? 'Hembra' : 'Macho'} · {age}
          </div>
          <div className="text-gray-400 text-xs mt-0.5">
            Dueño: {pet.owner.firstName} {pet.owner.lastName}
          </div>
        </div>
        <span className="text-vet-300 flex-shrink-0">
          <ChevronRightIcon />
        </span>
      </div>
    </Link>
  );
}
