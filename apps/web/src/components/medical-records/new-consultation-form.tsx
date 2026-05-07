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
      {error && <div className="bg-red-500/10 border border-red-500 text-red-400 text-sm rounded-lg p-3">{error}</div>}

      <div>
        <label className="block text-slate-300 text-sm mb-1">Motivo de consulta *</label>
        <input value={reason} onChange={(e) => setReason(e.target.value)} required
          className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
          placeholder="Ej: Revisión general, vacunación, malestar..." />
      </div>

      <div className="border-t border-slate-700 pt-4">
        <p className="text-slate-400 text-xs mb-3">Nota médica (opcional — puedes agregarla después)</p>
        <div className="space-y-3">
          <div>
            <label className="block text-slate-300 text-sm mb-1">Título de la nota</label>
            <input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-slate-300 text-sm mb-1">Contenido</label>
            <textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)} rows={4}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 resize-none" />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onCancel}
          className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg py-2 text-sm transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg py-2 text-sm transition-colors">
          {loading ? 'Guardando...' : 'Crear consulta'}
        </button>
      </div>
    </form>
  );
}
