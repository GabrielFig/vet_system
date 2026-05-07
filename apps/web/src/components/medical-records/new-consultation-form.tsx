'use client';

import { useState, FormEvent } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { ConsultationSummary } from '@vet/shared-types';

interface Props {
  recordId: string;
  token: string | null;
  onSuccess: (c: ConsultationSummary) => void;
  onCancel: () => void;
}

const inputClass =
  'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-vet-800 bg-white focus:outline-none focus:ring-2 focus:ring-vet-500 focus:border-transparent transition-all duration-200';
const labelClass = 'block text-sm font-medium text-vet-800 mb-1';

export function NewConsultationForm({ recordId, token, onSuccess, onCancel }: Props) {
  const [reason, setReason] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const consultation = await apiFetch<ConsultationSummary>(
        `/medical-records/${recordId}/consultations`,
        { method: 'POST', token: token ?? undefined, body: { reason } },
      );

      if (noteTitle && noteContent) {
        await apiFetch(`/consultations/${consultation.id}/note`, {
          method: 'POST',
          token: token ?? undefined,
          body: { title: noteTitle, content: noteContent },
        });
      }

      onSuccess(consultation);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al crear consulta');
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
        <label className={labelClass}>Motivo de consulta *</label>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
          placeholder="Ej: Revisión general, vacunación, malestar..."
          className={inputClass}
        />
      </div>

      <div className="border-t border-vet-100 pt-4">
        <p className="text-gray-400 text-xs mb-3">Nota médica (opcional — puedes agregarla después)</p>
        <div className="space-y-3">
          <div>
            <label className={labelClass}>Título de la nota</label>
            <input
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Contenido</label>
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              rows={4}
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>
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
          {loading ? 'Guardando...' : 'Crear consulta'}
        </button>
      </div>
    </form>
  );
}
