'use client';

import { useState, useEffect, FormEvent } from 'react';
import { apiFetch, ApiError } from '@/lib/api';

interface Slot { startsAt: string; endsAt: string }
interface Pet { id: string; name: string; species: string }
interface AppointmentDoc {
  id: string; startsAt: string; endsAt: string; reason: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'DONE';
  notes: string | null;
  pet: { id: string; name: string; species: string };
  doctor: { id: string; firstName: string; lastName: string };
  consultation: { id: string } | null;
}

interface Props {
  token: string | null;
  onSuccess: (a: AppointmentDoc) => void;
  onCancel: () => void;
  initialPetId?: string;
  initialPetName?: string;
}

const inputClass =
  'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-vet-800 bg-white focus:outline-none focus:ring-2 focus:ring-vet-500 focus:border-transparent transition-all duration-200';
const labelClass = 'block text-sm font-medium text-vet-800 mb-1';

export function NewAppointmentForm({ token, onSuccess, onCancel, initialPetId, initialPetName }: Props) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [petId, setPetId] = useState(initialPetId ?? '');
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotIndex, setSlotIndex] = useState<number>(-1);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (!initialPetId) {
      apiFetch<Pet[]>('/pets', { token: token ?? undefined }).then(setPets).catch(() => {});
    }
  }, [token, initialPetId]);

  useEffect(() => {
    if (!date) { setSlots([]); return; }
    setLoadingSlots(true);
    apiFetch<Slot[]>(`/appointments/available-slots?date=${date}`, { token: token ?? undefined })
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [date, token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (slotIndex < 0) { setError('Selecciona un horario'); return; }
    setError('');
    setLoading(true);
    try {
      const appt = await apiFetch<AppointmentDoc>('/appointments', {
        method: 'POST',
        token: token ?? undefined,
        body: { petId, startsAt: slots[slotIndex].startsAt, reason },
      });
      onSuccess(appt);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al crear cita');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
          {error}
        </div>
      )}

      <div>
        <label className={labelClass}>Mascota *</label>
        {initialPetId ? (
          <div className={`${inputClass} bg-vet-50 text-vet-700 cursor-default`}>{initialPetName ?? initialPetId}</div>
        ) : (
          <select value={petId} onChange={(e) => setPetId(e.target.value)} required className={inputClass}>
            <option value="">Seleccionar...</option>
            {pets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
      </div>

      <div>
        <label className={labelClass}>Fecha *</label>
        <input
          type="date"
          value={date}
          onChange={(e) => { setDate(e.target.value); setSlotIndex(-1); }}
          required
          className={inputClass}
        />
      </div>

      {date && (
        <div>
          <label className={labelClass}>Horario *</label>
          {loadingSlots ? (
            <p className="text-gray-400 text-sm">Cargando horarios disponibles...</p>
          ) : slots.length === 0 ? (
            <p className="text-gray-400 text-sm">No hay horarios disponibles para este día</p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {slots.map((s, i) => {
                const time = new Date(s.startsAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSlotIndex(i)}
                    className={`py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer active:scale-95 ${
                      slotIndex === i
                        ? 'bg-vet-500 text-white'
                        : 'bg-vet-50 text-vet-600 border border-vet-100 hover:bg-vet-100 hover:border-vet-200'
                    }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div>
        <label className={labelClass}>Motivo *</label>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
          placeholder="Revisión general, vacunación..."
          className={inputClass}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-vet-500 hover:bg-vet-600 disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 text-sm transition-all duration-200 cursor-pointer active:scale-95 disabled:active:scale-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-vet-500 focus:ring-offset-2"
        >
          {loading ? 'Guardando...' : 'Crear cita'}
        </button>
      </div>
    </form>
  );
}
