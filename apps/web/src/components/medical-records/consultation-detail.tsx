'use client';

import { ConsultationSummary } from '@vet/shared-types';
import { useState } from 'react';

export function ConsultationDetail({ consultation }: { consultation: ConsultationSummary }) {
  const [open, setOpen] = useState(false);
  const { note, prescriptions, vaccinations } = consultation;
  const totalItems = (note ? 1 : 0) + prescriptions.length + vaccinations.length;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-4 flex items-start gap-4 text-left hover:bg-slate-750 transition-colors"
      >
        <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-white text-sm">{consultation.reason}</span>
            <span className="text-slate-500 text-xs flex-shrink-0">
              {new Date(consultation.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <div className="flex gap-2 mt-1.5 flex-wrap">
            {note && <span className="bg-indigo-500/20 text-indigo-300 text-xs px-2 py-0.5 rounded-full">1 nota</span>}
            {prescriptions.length > 0 && <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2 py-0.5 rounded-full">{prescriptions.length} receta{prescriptions.length > 1 ? 's' : ''}</span>}
            {vaccinations.length > 0 && <span className="bg-amber-500/20 text-amber-300 text-xs px-2 py-0.5 rounded-full">{vaccinations.length} vacuna{vaccinations.length > 1 ? 's' : ''}</span>}
            {totalItems === 0 && <span className="text-slate-500 text-xs">Sin registros aún</span>}
          </div>
        </div>
        <span className="text-slate-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-slate-700 p-4 space-y-4">
          {note && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">📋 Nota médica</h4>
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="font-medium text-white text-sm mb-1">{note.title}</div>
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{note.content}</p>
              </div>
            </div>
          )}

          {prescriptions.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">💊 Recetas</h4>
              <div className="space-y-2">
                {prescriptions.map((rx) => (
                  <div key={rx.id} className="bg-slate-700/50 rounded-lg p-3">
                    <div className="font-medium text-white text-sm mb-1">{rx.diagnosis}</div>
                    <p className="text-slate-300 text-sm"><strong>Medicamentos:</strong> {rx.medications}</p>
                    <p className="text-slate-300 text-sm"><strong>Instrucciones:</strong> {rx.instructions}</p>
                    {rx.validUntil && <p className="text-slate-400 text-xs mt-1">Válida hasta: {new Date(rx.validUntil).toLocaleDateString('es-MX')}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {vaccinations.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">💉 Vacunas</h4>
              <div className="space-y-2">
                {vaccinations.map((vac) => (
                  <div key={vac.id} className="bg-slate-700/50 rounded-lg p-3">
                    <div className="font-medium text-white text-sm">{vac.vaccineName}</div>
                    {vac.batch && <p className="text-slate-400 text-xs">Lote: {vac.batch}</p>}
                    <p className="text-slate-400 text-xs">Aplicada: {new Date(vac.appliedAt).toLocaleDateString('es-MX')}</p>
                    {vac.nextDose && <p className="text-slate-400 text-xs">Próxima dosis: {new Date(vac.nextDose).toLocaleDateString('es-MX')}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
