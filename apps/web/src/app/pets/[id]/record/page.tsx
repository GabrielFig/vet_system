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
import { AppShell } from '@/components/layout/app-shell';
import { Skeleton } from '@/components/ui/skeleton';

interface PetWithRecord {
  id: string;
  name: string;
  species: string;
  record: { id: string; publicUuid: string; isPublic: boolean } | null;
}

function ArrowLeftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 19-7-7 7-7"/>
      <path d="M19 12H5"/>
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" x2="12" y1="5" y2="19"/>
      <line x1="5" x2="19" y1="12" y2="12"/>
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" x2="12" y1="15" y2="3"/>
    </svg>
  );
}

function QRIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="5" height="5" x="3" y="3" rx="1"/>
      <rect width="5" height="5" x="16" y="3" rx="1"/>
      <rect width="5" height="5" x="3" y="16" rx="1"/>
      <path d="M21 16h-3a2 2 0 0 0-2 2v3"/>
      <path d="M21 21v.01"/>
      <path d="M12 7v3a2 2 0 0 1-2 2H7"/>
      <path d="M3 12h.01"/>
      <path d="M12 3h.01"/>
      <path d="M12 16v.01"/>
      <path d="M16 12h1"/>
      <path d="M21 12v.01"/>
      <path d="M12 21v-1"/>
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/>
      <line x1="10" x2="21" y1="14" y2="3"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18"/>
      <path d="m6 6 12 12"/>
    </svg>
  );
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

  if (!ready || !user) return <div className="min-h-screen bg-vet-50" />;

  if (loading) {
    return (
      <AppShell>
        <div className="mb-4"><Skeleton className="h-6 w-32" /></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl p-5 border border-vet-100 shadow-sm">
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </AppShell>
    );
  }

  if (!pet || !record) {
    return (
      <AppShell>
        <div className="text-center py-16">
          <p className="text-red-500 font-medium">No se encontró la cartilla</p>
        </div>
      </AppShell>
    );
  }

  function handleConsultationCreated(c: ConsultationSummary) {
    setRecord((prev) => prev ? { ...prev, consultations: [c, ...prev.consultations] } : prev);
    setShowForm(false);
  }

  return (
    <AppShell>
      {/* Back link */}
      <Link
        href={`/pets/${petId}`}
        className="inline-flex items-center gap-2 text-vet-500 hover:text-vet-700 text-sm font-medium mb-5 cursor-pointer transition-colors duration-200"
      >
        <ArrowLeftIcon />
        {pet.name}
      </Link>

      {/* Page title + actions */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <h1 className="font-heading text-2xl font-bold text-vet-800">Cartilla de {pet.name}</h1>
        <div className="flex items-center gap-2 flex-wrap">
          {/* PDF download */}
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
            className="flex items-center gap-1.5 text-xs bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer font-medium active:scale-95"
          >
            <DownloadIcon />
            PDF
          </button>

          {/* QR */}
          <button
            onClick={() => setShowQR(true)}
            className="flex items-center gap-1.5 text-xs bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer font-medium active:scale-95"
          >
            <QRIcon />
            QR
          </button>

          {/* Public link */}
          <Link
            href={`/public/${record.publicUuid}`}
            target="_blank"
            className="flex items-center gap-1.5 text-xs bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer font-medium active:scale-95"
          >
            <ExternalLinkIcon />
            Ver pública
          </Link>

          {/* New consultation */}
          {canEdit && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 text-xs bg-vet-500 hover:bg-vet-600 active:scale-95 text-white px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer font-medium focus:outline-none focus:ring-2 focus:ring-vet-500 focus:ring-offset-2"
            >
              <PlusIcon />
              Nueva consulta
            </button>
          )}
        </div>
      </div>

      {/* New consultation modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-heading font-semibold text-vet-800 text-lg">Nueva consulta</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-vet-500 rounded-lg p-1"
                aria-label="Cerrar"
              >
                <XIcon />
              </button>
            </div>
            <NewConsultationForm
              recordId={record.id}
              token={accessToken}
              onSuccess={handleConsultationCreated}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      <ConsultationTimeline consultations={record.consultations as ConsultationSummary[]} />

      <MedicalRecordTabs recordId={record.id} token={accessToken} />

      {showQR && (
        <QRModal
          recordId={record.id}
          publicUuid={record.publicUuid}
          onClose={() => setShowQR(false)}
        />
      )}
    </AppShell>
  );
}
