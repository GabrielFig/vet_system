'use client';

import { ConsultationSummary } from '@vet/shared-types';
import { useState } from 'react';

function ChevronDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6"/>
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m18 15-6-6-6 6"/>
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    </svg>
  );
}

function PillIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/>
      <path d="m8.5 8.5 7 7"/>
    </svg>
  );
}

function SyringeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m18 2 4 4"/>
      <path d="m17 7 3-3"/>
      <path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5"/>
      <path d="m9 11 4 4"/>
      <path d="m5 19-3 3"/>
      <path d="m14 4 6 6"/>
    </svg>
  );
}

export function ConsultationDetail({ consultation }: { consultation: ConsultationSummary }) {
  const [open, setOpen] = useState(false);
  const { note, prescriptions, vaccinations } = consultation;
  const totalItems = (note ? 1 : 0) + prescriptions.length + vaccinations.length;

  return (
    <div className="bg-white border border-vet-100 rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-4 flex items-start gap-4 text-left hover:bg-vet-50 transition-colors duration-150 cursor-pointer"
      >
        <div className="w-2 h-2 rounded-full bg-vet-500 mt-2 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-vet-800 text-sm">{consultation.reason}</span>
            <span className="text-gray-400 text-xs flex-shrink-0">
              {new Date(consultation.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <div className="flex gap-2 mt-1.5 flex-wrap">
            {note && (
              <span className="inline-flex items-center gap-1 bg-vet-100 text-vet-600 text-xs px-2 py-0.5 rounded-full">
                <ClipboardIcon /> 1 nota
              </span>
            )}
            {prescriptions.length > 0 && (
              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full">
                <PillIcon /> {prescriptions.length} receta{prescriptions.length > 1 ? 's' : ''}
              </span>
            )}
            {vaccinations.length > 0 && (
              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">
                <SyringeIcon /> {vaccinations.length} vacuna{vaccinations.length > 1 ? 's' : ''}
              </span>
            )}
            {totalItems === 0 && <span className="text-gray-400 text-xs">Sin registros aún</span>}
          </div>
        </div>
        <span className="text-vet-400 flex-shrink-0">
          {open ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </span>
      </button>

      {open && (
        <div className="border-t border-vet-100 p-4 space-y-4 bg-vet-50">
          {note && (
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                <ClipboardIcon /> Nota médica
              </h4>
              <div className="bg-white rounded-lg p-3 border border-vet-100">
                <div className="font-medium text-vet-800 text-sm mb-1">{note.title}</div>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{note.content}</p>
              </div>
            </div>
          )}

          {prescriptions.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                <PillIcon /> Recetas
              </h4>
              <div className="space-y-2">
                {prescriptions.map((rx) => (
                  <div key={rx.id} className="bg-white rounded-lg p-3 border border-emerald-100">
                    <div className="font-medium text-vet-800 text-sm mb-1">{rx.diagnosis}</div>
                    <p className="text-gray-600 text-sm"><strong className="text-gray-700">Medicamentos:</strong> {rx.medications}</p>
                    <p className="text-gray-600 text-sm"><strong className="text-gray-700">Instrucciones:</strong> {rx.instructions}</p>
                    {rx.validUntil && (
                      <p className="text-gray-400 text-xs mt-1">
                        Válida hasta: {new Date(rx.validUntil).toLocaleDateString('es-MX')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {vaccinations.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                <SyringeIcon /> Vacunas
              </h4>
              <div className="space-y-2">
                {vaccinations.map((vac) => (
                  <div key={vac.id} className="bg-white rounded-lg p-3 border border-amber-100">
                    <div className="font-medium text-vet-800 text-sm">{vac.vaccineName}</div>
                    {vac.batch && <p className="text-gray-400 text-xs">Lote: {vac.batch}</p>}
                    <p className="text-gray-400 text-xs">
                      Aplicada: {new Date(vac.appliedAt).toLocaleDateString('es-MX')}
                    </p>
                    {vac.nextDose && (
                      <p className="text-gray-400 text-xs">
                        Próxima dosis: {new Date(vac.nextDose).toLocaleDateString('es-MX')}
                      </p>
                    )}
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
