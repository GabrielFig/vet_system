'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

interface QRModalProps {
  recordId: string;
  publicUuid: string;
  onClose: () => void;
}

function XIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18"/>
      <path d="m6 6 12 12"/>
    </svg>
  );
}

function QRIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
    </svg>
  );
}

export function QRModal({ recordId, publicUuid, onClose }: QRModalProps) {
  const token = useAuthStore((s) => s.accessToken);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/public/${publicUuid}`;

  async function generateQr() {
    setLoading(true);
    const result = await apiFetch<{ qrCodeUrl: string }>(`/medical-records/${recordId}/qr`, {
      method: 'POST',
      token: token ?? undefined,
    }).catch(() => null);
    if (result) setQrDataUrl(result.qrCodeUrl);
    setLoading(false);
  }

  function copyLink() {
    navigator.clipboard.writeText(publicUrl);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading font-semibold text-vet-800">Compartir cartilla</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-vet-500 rounded-lg p-1"
            aria-label="Cerrar"
          >
            <XIcon />
          </button>
        </div>

        {qrDataUrl ? (
          <div className="text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="QR de la cartilla" className="w-48 h-48 mx-auto rounded-lg border border-vet-100" />
            <p className="text-gray-400 text-xs mt-3 break-all">{publicUrl}</p>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="flex justify-center text-vet-200 mb-3">
              <QRIcon />
            </div>
            <p className="text-gray-500 text-sm">Genera el código QR para compartir esta cartilla</p>
          </div>
        )}

        <div className="flex gap-2 mt-5">
          <button
            onClick={copyLink}
            className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm rounded-lg py-2.5 transition-all duration-200 cursor-pointer active:scale-95 font-medium focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            <CopyIcon />
            Copiar enlace
          </button>
          <button
            onClick={generateQr}
            disabled={loading}
            className="flex-1 bg-vet-500 hover:bg-vet-600 active:scale-95 disabled:opacity-50 disabled:active:scale-100 text-white text-sm font-semibold rounded-lg py-2.5 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-vet-500 focus:ring-offset-2"
          >
            {loading ? 'Generando...' : qrDataUrl ? 'Regenerar QR' : 'Generar QR'}
          </button>
        </div>
      </div>
    </div>
  );
}
