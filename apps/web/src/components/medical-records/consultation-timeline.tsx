import { ConsultationSummary } from '@vet/shared-types';
import { ConsultationDetail } from './consultation-detail';

function ClipboardIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    </svg>
  );
}

export function ConsultationTimeline({ consultations }: { consultations: ConsultationSummary[] }) {
  if (consultations.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-vet-100 shadow-sm">
        <div className="flex justify-center text-vet-200 mb-3">
          <ClipboardIcon />
        </div>
        <p className="text-gray-500 font-medium">No hay consultas registradas aún</p>
        <p className="text-gray-400 text-sm mt-1">Crea la primera consulta para este paciente</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {consultations.map((c) => (
        <ConsultationDetail key={c.id} consultation={c} />
      ))}
    </div>
  );
}
