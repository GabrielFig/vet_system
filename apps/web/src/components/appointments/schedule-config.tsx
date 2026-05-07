'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Schedule {
  id: string;
  clinicId: string;
  workDays: number[];
  startTime: string;
  endTime: string;
  slotMinutes: number;
}

interface Exception {
  id: string;
  date: string;
  isClosed: boolean;
  reason?: string;
}

interface Props {
  token: string | null | undefined;
  onClose: () => void;
}

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const SLOT_OPTIONS = [15, 20, 30, 45, 60, 90];

function XIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18"/>
      <path d="m6 6 12 12"/>
    </svg>
  );
}

export function ScheduleConfig({ token, onClose }: Props) {
  const [workDays, setWorkDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [slotMinutes, setSlotMinutes] = useState(30);
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [exDate, setExDate] = useState('');
  const [exReason, setExReason] = useState('');
  const [addingEx, setAddingEx] = useState(false);
  const [exError, setExError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Schedule | null>('/appointments/schedule', { token: token ?? undefined })
      .then((data) => {
        if (data) {
          setWorkDays(data.workDays);
          setStartTime(data.startTime);
          setEndTime(data.endTime);
          setSlotMinutes(data.slotMinutes);
        }
      })
      .catch(() => {
        // Use defaults if fetch fails
      })
      .finally(() => setLoading(false));
  }, [token]);

  function toggleDay(day: number) {
    setWorkDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b),
    );
  }

  async function handleSave() {
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    try {
      await apiFetch('/appointments/schedule', {
        method: 'POST',
        token: token ?? undefined,
        body: { workDays, startTime, endTime, slotMinutes },
      });
      setSaveSuccess(true);
      setTimeout(() => onClose(), 1200);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar horario');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddException() {
    if (!exDate) return;
    setAddingEx(true);
    setExError('');
    try {
      const result = await apiFetch<Exception>('/appointments/schedule/exceptions', {
        method: 'POST',
        token: token ?? undefined,
        body: { date: exDate, isClosed: true, reason: exReason || undefined },
      });
      setExceptions((prev) => [...prev, result]);
      setExDate('');
      setExReason('');
    } catch (err: unknown) {
      setExError(err instanceof Error ? err.message : 'Error al agregar excepción');
    } finally {
      setAddingEx(false);
    }
  }

  async function handleDeleteException(id: string) {
    try {
      await apiFetch(`/appointments/schedule/exceptions/${id}`, {
        method: 'DELETE',
        token: token ?? undefined,
      });
      setExceptions((prev) => prev.filter((e) => e.id !== id));
    } catch {
      // Silent failure — UI stays unchanged
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-heading font-semibold text-vet-800 text-lg">Configurar horario</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-vet-500 rounded-lg p-1"
            aria-label="Cerrar"
          >
            <XIcon />
          </button>
        </div>

        {loading ? (
          <div className="px-6 py-10 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-vet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="px-6 py-5 space-y-6">
            {/* Section 1 — Días laborables */}
            <div>
              <p className="text-sm font-medium text-vet-800 mb-3">Días laborables</p>
              <div className="flex gap-2 flex-wrap">
                {DAY_LABELS.map((label, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleDay(idx)}
                    className={`w-10 h-10 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${
                      workDays.includes(idx)
                        ? 'bg-vet-500 text-white'
                        : 'bg-white border border-gray-200 text-gray-600 hover:border-vet-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Section 2 — Horario */}
            <div>
              <p className="text-sm font-medium text-vet-800 mb-3">Horario de atención</p>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Hora de inicio</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-vet-800 bg-white focus:outline-none focus:ring-2 focus:ring-vet-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Hora de cierre</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-vet-800 bg-white focus:outline-none focus:ring-2 focus:ring-vet-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 3 — Duración de slot */}
            <div>
              <p className="text-sm font-medium text-vet-800 mb-3">Duración de slot</p>
              <div className="flex gap-2 flex-wrap">
                {SLOT_OPTIONS.map((min) => (
                  <button
                    key={min}
                    type="button"
                    onClick={() => setSlotMinutes(min)}
                    className={`px-3 h-9 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${
                      slotMinutes === min
                        ? 'bg-vet-500 text-white'
                        : 'bg-white border border-gray-200 text-gray-600 hover:border-vet-300'
                    }`}
                  >
                    {min} min
                  </button>
                ))}
              </div>
            </div>

            {/* Section 4 — Excepciones */}
            <div>
              <p className="text-sm font-medium text-vet-800 mb-3">Excepciones (días cerrados)</p>

              {exceptions.length > 0 && (
                <div className="space-y-2 mb-3">
                  {exceptions.map((ex) => (
                    <div key={ex.id} className="flex items-center justify-between bg-vet-50 rounded-lg px-3 py-2">
                      <div>
                        <span className="text-sm font-medium text-vet-800">{ex.date}</span>
                        {ex.reason && (
                          <span className="text-xs text-gray-500 ml-2">— {ex.reason}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteException(ex.id)}
                        className="text-gray-400 hover:text-red-500 cursor-pointer transition-colors duration-200 p-1 rounded"
                        aria-label="Eliminar excepción"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                {exError && (
                  <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1.5">{exError}</div>
                )}
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={exDate}
                    onChange={(e) => setExDate(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-vet-800 bg-white focus:outline-none focus:ring-2 focus:ring-vet-500"
                  />
                  <input
                    type="text"
                    value={exReason}
                    onChange={(e) => setExReason(e.target.value)}
                    placeholder="Motivo (opcional)"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-vet-800 bg-white focus:outline-none focus:ring-2 focus:ring-vet-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddException}
                  disabled={!exDate || addingEx}
                  className="text-xs bg-white border border-gray-200 hover:border-vet-300 text-gray-600 hover:text-vet-600 font-medium px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingEx ? 'Agregando...' : 'Agregar cierre'}
                </button>
              </div>
            </div>

            {/* Feedback messages */}
            {saveError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{saveError}</div>
            )}
            {saveSuccess && (
              <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">Horario guardado</div>
            )}
          </div>
        )}

        {/* Footer */}
        {!loading && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-lg transition-all duration-200 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || saveSuccess}
              className="text-sm bg-vet-500 hover:bg-vet-600 text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {saving ? 'Guardando...' : 'Guardar horario'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
