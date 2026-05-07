'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { apiFetch } from '@/lib/api';
import { MedicalRecordDetail, ConsultationSummary } from '@vet/shared-types';
import { ConsultationTimeline } from '@/components/medical-records/consultation-timeline';
import { MedicalRecordTabs } from '@/components/medical-records/medical-record-tabs';
import { NewConsultationForm } from '@/components/medical-records/new-consultation-form';
import { QRModal } from '@/components/medical-records/qr-modal';

interface PetWithRecord {
  id: string;
  name: string;
  species: string;
  record: { id: string; publicUuid: string; isPublic: boolean } | null;
}

export default function MedicalRecordPage() {
  const { id: petId } = useParams<{ id: string }>();
  const { user, accessToken, role, ready } = useRequireAuth();
  const [pet, setPet] = useState<PetWithRecord | null>(null);
  const [record, setRecord] = useState<MedicalRecordDetail | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready || !user) return;
    apiFetch<PetWithRecord>(`/pets/${petId}`, { token: accessToken ?? undefined })
      .then(async (p) => {
        setPet(p);
        if (p.record) {
          const r = await apiFetch<MedicalRecordDetail>(`/medical-records/${p.record.id}`, { token: accessToken ?? undefined });
          setRecord(r);
        }
      })
      .finally(() => setLoading(false));
  }, [ready, user, petId, accessToken]);

  const canEdit = role === 'ADMIN' || role === 'DOCTOR';

  if (!ready || !user || loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">Cargando...</div>;
  if (!pet || !record) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-red-400">No se encontró la cartilla</div>;

  function handleConsultationCreated(c: ConsultationSummary) {
    setRecord((prev) => prev ? { ...prev, consultations: [c, ...prev.consultations] } : prev);
    setShowForm(false);
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center gap-4">
        <Link href={`/pets/${petId}`} className="text-slate-400 hover:text-white text-sm">← {pet.name}</Link>
        <span className="text-slate-600">|</span>
        <span className="font-semibold">Cartilla médica</span>
        <div className="ml-auto flex gap-2">
          <button
            onClick={async () => {
              const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
              const res = await fetch(`${API_URL}/pets/${petId}/record/pdf`, {
                headers: { Authorization: `Bearer ${accessToken}` },
              });
              if (res.ok) {
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `cartilla-${pet.name}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
              }
            }}
            className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-lg transition-colors"
          >
            PDF
          </button>
          <button
            onClick={() => setShowQR(true)}
            className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-lg transition-colors"
          >
            📱 QR
          </button>
          <Link
            href={`/public/${record.publicUuid}`}
            target="_blank"
            className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-lg transition-colors"
          >
            Ver pública
          </Link>
          {canEdit && (
            <button
              onClick={() => setShowForm(true)}
              className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              + Nueva consulta
            </button>
          )}
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-xl font-bold mb-6">Cartilla de {pet.name}</h1>

        {showForm && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
            <h2 className="font-semibold mb-4">Nueva consulta</h2>
            <NewConsultationForm
              recordId={record.id}
              token={accessToken}
              onSuccess={handleConsultationCreated}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        <ConsultationTimeline consultations={record.consultations as ConsultationSummary[]} />

        <MedicalRecordTabs recordId={record.id} token={accessToken} />
      </main>

      {showQR && (
        <QRModal
          recordId={record.id}
          publicUuid={record.publicUuid}
          onClose={() => setShowQR(false)}
        />
      )}
    </div>
  );
}
