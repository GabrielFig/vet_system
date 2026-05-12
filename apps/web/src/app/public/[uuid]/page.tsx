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
    weight: number | null;
    client: { firstName: string; lastName: string };
  };
  consultations: PublicConsultation[];
}

async function getRecord(uuid: string): Promise<PublicRecord | null> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  try {
    const res = await fetch(`${API_URL}/public/${uuid}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function PawIcon({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="4" r="2"/>
      <circle cx="18" cy="8" r="2"/>
      <circle cx="20" cy="16" r="2"/>
      <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function PillIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/>
      <path d="m8.5 8.5 7 7"/>
    </svg>
  );
}

function SyringeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m18 2 4 4"/>
      <path d="m17 7 3-3"/>
      <path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5"/>
      <path d="m9 11 4 4"/>
      <path d="m5 19-3 3"/>
      <path d="m14 4 6 6"/>
    </svg>
  );
}

export default async function PublicCartillaPage({ params }: { params: { uuid: string } }) {
  const record = await getRecord(params.uuid);
  if (!record) notFound();

  const { pet, consultations } = record;
  const age = pet.birthDate
    ? `${Math.floor((Date.now() - new Date(pet.birthDate).getTime()) / 31536000000)} años`
    : '';

  return (
    <div className="min-h-screen bg-vet-50">
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-xs text-gray-400 mb-3 font-medium tracking-wide uppercase">VetSystem · Cartilla Digital</div>
          <div className="w-20 h-20 bg-vet-100 rounded-full flex items-center justify-center text-vet-500 mx-auto mb-4">
            <PawIcon size={44} />
          </div>
          <h1 className="font-heading text-2xl font-bold text-vet-800">{pet.name}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {pet.breed ?? pet.species} · {pet.sex === 'female' || pet.sex === 'FEMALE' ? 'Hembra' : 'Macho'}
            {age ? ` · ${age}` : ''}
            {pet.weight != null ? ` · ${pet.weight} kg` : ''}
          </p>
          <p className="text-gray-400 text-sm mt-0.5">
            Dueño: {pet.client.firstName} {pet.client.lastName}
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs px-3 py-1.5 rounded-full font-medium">
            <CheckIcon />
            Cartilla activa verificada
          </div>
        </div>

        {/* Consultations */}
        <div className="space-y-4">
          {consultations.length === 0 && (
            <div className="text-center text-gray-400 py-12 bg-white rounded-xl border border-vet-100">
              <div className="text-vet-200 mb-2 flex justify-center">
                <PawIcon size={40} />
              </div>
              Sin consultas registradas
            </div>
          )}
          {consultations.map((c) => (
            <div key={c.id} className="bg-white border border-vet-100 rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div className="font-heading font-semibold text-vet-800">{c.reason}</div>
                <div className="text-gray-400 text-xs flex-shrink-0 ml-4 mt-0.5">
                  {new Date(c.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>

              {c.note && (
                <div className="mb-3">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Nota clínica</div>
                  <p className="text-gray-600 text-sm leading-relaxed">{c.note.content}</p>
                </div>
              )}

              {c.prescriptions.map((rx, i) => (
                <div key={i} className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 mb-1">
                    <PillIcon />
                    {rx.diagnosis}
                  </div>
                  <p className="text-gray-600 text-xs">{rx.medications}</p>
                  {rx.instructions && (
                    <p className="text-gray-500 text-xs mt-0.5 italic">{rx.instructions}</p>
                  )}
                </div>
              ))}

              {c.vaccinations.map((v, i) => (
                <div key={i} className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 mb-1">
                    <SyringeIcon />
                    {v.vaccineName}
                  </div>
                  {v.batch && <p className="text-gray-500 text-xs">Lote: {v.batch}</p>}
                  {v.nextDose && (
                    <p className="text-gray-500 text-xs mt-0.5">
                      Próxima dosis: {new Date(v.nextDose).toLocaleDateString('es-MX')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-xs">Cartilla de solo lectura · VetSystem</p>
          <p className="text-gray-400 text-xs mt-1">
            ¿Eres veterinario?{' '}
            <a href="/login" className="text-vet-500 hover:text-vet-700 hover:underline transition-colors duration-200">
              Inicia sesión
            </a>{' '}
            para agregar una consulta
          </p>
        </div>
      </div>
    </div>
  );
}
