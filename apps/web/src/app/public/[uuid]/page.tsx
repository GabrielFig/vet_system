import { notFound } from 'next/navigation';

interface PublicNote { title: string; content: string; createdAt: string; clinicId: string }
interface PublicPrescription { diagnosis: string; medications: string; instructions: string; validUntil: string | null; clinicId: string; createdAt: string }
interface PublicVaccination { vaccineName: string; batch: string | null; appliedAt: string; nextDose: string | null; clinicId: string }
interface PublicConsultation {
  id: string;
  reason: string;
  clinicId: string;
  createdAt: string;
  note: PublicNote | null;
  prescriptions: PublicPrescription[];
  vaccinations: PublicVaccination[];
}
interface PublicRecord {
  id: string;
  publicUuid: string;
  pet: {
    name: string;
    species: string;
    breed: string | null;
    sex: string;
    birthDate: string | null;
    owner: { firstName: string; lastName: string };
  };
  consultations: PublicConsultation[];
}

const SPECIES_EMOJI: Record<string, string> = { dog: '🐶', cat: '🐱', bird: '🐦', rabbit: '🐰', other: '🐾' };

async function getRecord(uuid: string): Promise<PublicRecord | null> {
  const API_URL = process.env.API_URL ?? 'http://localhost:3001';
  try {
    const res = await fetch(`${API_URL}/public/${uuid}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function PublicCartillaPage({ params }: { params: { uuid: string } }) {
  const record = await getRecord(params.uuid);
  if (!record) notFound();

  const { pet, consultations } = record;
  const age = pet.birthDate
    ? `${Math.floor((Date.now() - new Date(pet.birthDate).getTime()) / 31536000000)} años`
    : '';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">

        <div className="text-center mb-8">
          <div className="text-xs text-gray-400 mb-2">🐾 VetSystem · Cartilla Digital</div>
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
            {SPECIES_EMOJI[pet.species] ?? '🐾'}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{pet.name}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {pet.breed ?? pet.species} · {pet.sex === 'female' || pet.sex === 'FEMALE' ? 'Hembra' : 'Macho'}
            {age ? ` · ${age}` : ''}
          </p>
          <p className="text-gray-400 text-sm">Dueño: {pet.owner.firstName} {pet.owner.lastName}</p>
          <div className="mt-3 inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium">
            <span>✓</span> Cartilla activa verificada
          </div>
        </div>

        <div className="space-y-4">
          {consultations.length === 0 && (
            <div className="text-center text-gray-400 py-8">Sin consultas registradas</div>
          )}
          {consultations.map((c) => (
            <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-semibold text-gray-900">{c.reason}</div>
                </div>
                <div className="text-gray-400 text-xs flex-shrink-0 ml-4">
                  {new Date(c.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>

              {c.note && (
                <div className="mb-3">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Nota</div>
                  <p className="text-gray-700 text-sm leading-relaxed">{c.note.content}</p>
                </div>
              )}

              {c.prescriptions.map((rx, i) => (
                <div key={i} className="bg-emerald-50 rounded-lg p-3 mb-2">
                  <div className="text-xs font-semibold text-emerald-700 mb-1">💊 {rx.diagnosis}</div>
                  <p className="text-gray-700 text-xs">{rx.medications}</p>
                </div>
              ))}

              {c.vaccinations.map((v, i) => (
                <div key={i} className="bg-amber-50 rounded-lg p-3 mb-2">
                  <div className="text-xs font-semibold text-amber-700">💉 {v.vaccineName}</div>
                  {v.batch && <p className="text-gray-500 text-xs">Lote: {v.batch}</p>}
                  {v.nextDose && <p className="text-gray-500 text-xs">Próxima dosis: {new Date(v.nextDose).toLocaleDateString('es-MX')}</p>}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-400 text-xs">Cartilla de solo lectura · VetSystem</p>
          <p className="text-gray-400 text-xs mt-1">
            ¿Eres veterinario?{' '}
            <a href="/login" className="text-indigo-600 hover:underline">Inicia sesión</a> para agregar una consulta
          </p>
        </div>
      </div>
    </div>
  );
}
