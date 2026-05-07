'use client';

interface AppointmentDoc {
  id: string;
  startsAt: string;
  endsAt: string;
  reason: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'DONE';
  notes: string | null;
  pet: { id: string; name: string; species: string };
  doctor: { id: string; firstName: string; lastName: string };
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente', CONFIRMED: 'Confirmada', CANCELLED: 'Cancelada', DONE: 'Realizada',
};
const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-300',
  CONFIRMED: 'bg-green-500/20 text-green-300',
  CANCELLED: 'bg-red-500/20 text-red-300',
  DONE: 'bg-slate-500/20 text-slate-400',
};
const SPECIES_EMOJI: Record<string, string> = {
  dog: '🐶', cat: '🐱', bird: '🐦', rabbit: '🐰', other: '🐾',
};

interface Props {
  appointment: AppointmentDoc;
  onStatusChange: (id: string, status: string) => void;
  canAdmin: boolean;
}

export function AppointmentCard({ appointment: a, onStatusChange, canAdmin }: Props) {
  const time = new Date(a.startsAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-start gap-4">
      <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center text-xl flex-shrink-0">
        {SPECIES_EMOJI[a.pet.species] ?? '🐾'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <span className="font-semibold text-white text-sm">{time}</span>
            <span className="text-slate-400 text-sm ml-2">— {a.pet.name}</span>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[a.status]}`}>
            {STATUS_LABEL[a.status]}
          </span>
        </div>
        <p className="text-slate-400 text-sm mt-0.5">{a.reason}</p>
        <p className="text-slate-500 text-xs mt-0.5">Dr. {a.doctor.firstName} {a.doctor.lastName}</p>
        {a.notes && <p className="text-slate-500 text-xs mt-1 italic">{a.notes}</p>}
      </div>
      {canAdmin && a.status !== 'DONE' && a.status !== 'CANCELLED' && (
        <div className="flex flex-col gap-1 flex-shrink-0">
          {a.status === 'PENDING' && (
            <button
              onClick={() => onStatusChange(a.id, 'CONFIRMED')}
              className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded transition-colors"
            >
              Confirmar
            </button>
          )}
          <button
            onClick={() => onStatusChange(a.id, 'DONE')}
            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded transition-colors"
          >
            Realizada
          </button>
          <button
            onClick={() => onStatusChange(a.id, 'CANCELLED')}
            className="text-xs bg-slate-600 hover:bg-slate-500 text-white px-2 py-1 rounded transition-colors"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
