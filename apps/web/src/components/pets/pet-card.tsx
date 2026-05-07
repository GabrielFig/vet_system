import Link from 'next/link';
import { PetSummary } from '@vet/shared-types';

const SPECIES_EMOJI: Record<string, string> = {
  dog: '🐶', cat: '🐱', bird: '🐦', rabbit: '🐰', other: '🐾',
};

export function PetCard({ pet }: { pet: PetSummary }) {
  const age = pet.birthDate
    ? `${Math.floor((Date.now() - new Date(pet.birthDate).getTime()) / 31536000000)} años`
    : 'Edad desconocida';

  return (
    <Link href={`/pets/${pet.id}`} className="block bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-indigo-500 rounded-xl p-5 transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
          {pet.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pet.photoUrl} alt={pet.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            SPECIES_EMOJI[pet.species] ?? '🐾'
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white">{pet.name}</div>
          <div className="text-slate-400 text-sm truncate">
            {pet.breed ?? pet.species} · {(pet.sex as string) === 'FEMALE' || pet.sex === 'female' ? 'Hembra' : 'Macho'} · {age}
          </div>
          <div className="text-slate-500 text-xs mt-0.5">
            Dueño: {pet.owner.firstName} {pet.owner.lastName}
          </div>
        </div>
        <span className="text-slate-500">›</span>
      </div>
    </Link>
  );
}
