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
}

interface Props {
  token: string | null;
  onSuccess: (a: AppointmentDoc) => void;
  onCancel: () => void;
}

export function NewAppointmentForm({ token, onSuccess, onCancel }: Props) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [petId, setPetId] = useState('');
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotIndex, setSlotIndex] = useState<number>(-1);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    apiFetch<Pet[]>('/pets', { token: token ?? undefined }).then(setPets).catch(() => {});
  }, [token]);

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
    if (slotIndex < 0) { setError('Selecciona un slot'); return; }
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
      {error && <div className="bg-red-500/10 border border-red-500 text-red-400 text-sm rounded-lg p-3">{error}</div>}

      <div>
        <label className="block text-slate-300 text-sm mb-1">Mascota *</label>
        <select value={petId} onChange={(e) => setPetId(e.target.value)} required
          className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
          <option value="">Seleccionar...</option>
          {pets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-slate-300 text-sm mb-1">Fecha *</label>
        <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setSlotIndex(-1); }} required
          className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
      </div>

      {date && (
        <div>
          <label className="block text-slate-300 text-sm mb-1">Horario *</label>
          {loadingSlots ? (
            <p className="text-slate-400 text-sm">Cargando slots...</p>
          ) : slots.length === 0 ? (
            <p className="text-slate-400 text-sm">No hay slots disponibles para este día</p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {slots.map((s, i) => {
                const time = new Date(s.startsAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
                return (
                  <button key={i} type="button" onClick={() => setSlotIndex(i)}
                    className={`py-2 rounded-lg text-sm font-medium transition-colors ${slotIndex === i ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                    {time}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-slate-300 text-sm mb-1">Motivo *</label>
        <input value={reason} onChange={(e) => setReason(e.target.value)} required
          className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
          placeholder="Revisión general, vacunación..." />
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onCancel}
          className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg py-2 text-sm transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg py-2 text-sm transition-colors">
          {loading ? 'Guardando...' : 'Crear cita'}
        </button>
      </div>
    </form>
  );
}
