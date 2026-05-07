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
const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  DONE: 'bg-gray-100 text-gray-600',
};
const STATUS_BORDER: Record<string, string> = {
  PENDING: 'border-l-amber-400',
  CONFIRMED: 'border-l-green-400',
  CANCELLED: 'border-l-red-400',
  DONE: 'border-l-gray-300',
};

function PawIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="4" r="2"/>
      <circle cx="18" cy="8" r="2"/>
      <circle cx="20" cy="16" r="2"/>
      <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>
    </svg>
  );
}

interface Props {
  appointment: AppointmentDoc;
  onStatusChange: (id: string, status: string) => void;
  canAdmin: boolean;
}

export function AppointmentCard({ appointment: a, onStatusChange, canAdmin }: Props) {
  const time = new Date(a.startsAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-vet-100 border-l-4 ${STATUS_BORDER[a.status]} p-4 flex items-start gap-4 hover:shadow-md transition-all duration-200`}>
      <div className="w-10 h-10 bg-vet-100 rounded-full flex items-center justify-center text-vet-500 flex-shrink-0">
        <PawIcon />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <span className="font-semibold text-vet-800 text-sm">{time}</span>
            <span className="text-gray-500 text-sm ml-2">— {a.pet.name}</span>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_BADGE[a.status]}`}>
            {STATUS_LABEL[a.status]}
          </span>
        </div>
        <p className="text-gray-500 text-sm mt-0.5">{a.reason}</p>
        <p className="text-gray-400 text-xs mt-0.5">Dr. {a.doctor.firstName} {a.doctor.lastName}</p>
        {a.notes && <p className="text-gray-400 text-xs mt-1 italic">{a.notes}</p>}
      </div>
      {canAdmin && a.status !== 'DONE' && a.status !== 'CANCELLED' && (
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          {a.status === 'PENDING' && (
            <button
              onClick={() => onStatusChange(a.id, 'CONFIRMED')}
              className="text-xs bg-green-500 hover:bg-green-600 active:scale-95 text-white px-2.5 py-1.5 rounded-lg transition-all duration-200 cursor-pointer font-medium"
            >
              Confirmar
            </button>
          )}
          <button
            onClick={() => onStatusChange(a.id, 'DONE')}
            className="text-xs bg-vet-500 hover:bg-vet-600 active:scale-95 text-white px-2.5 py-1.5 rounded-lg transition-all duration-200 cursor-pointer font-medium"
          >
            Realizada
          </button>
          <button
            onClick={() => onStatusChange(a.id, 'CANCELLED')}
            className="text-xs bg-white hover:bg-gray-50 active:scale-95 text-gray-600 border border-gray-200 px-2.5 py-1.5 rounded-lg transition-all duration-200 cursor-pointer font-medium"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
