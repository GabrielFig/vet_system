import { ConsultationSummary } from '@vet/shared-types';
import { ConsultationDetail } from './consultation-detail';

export function ConsultationTimeline({ consultations }: { consultations: ConsultationSummary[] }) {
  if (consultations.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <div className="text-4xl mb-3">📋</div>
        <p>No hay consultas registradas aún</p>
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
