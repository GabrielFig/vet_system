'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

interface QRModalProps {
  recordId: string;
  publicUuid: string;
  onClose: () => void;
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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Compartir cartilla</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
        </div>

        {qrDataUrl ? (
          <div className="text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="QR de la cartilla" className="w-48 h-48 mx-auto rounded-lg" />
            <p className="text-slate-400 text-xs mt-3 break-all">{publicUrl}</p>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="text-4xl mb-3">📱</div>
            <p className="text-slate-400 text-sm">Genera el código QR para compartir esta cartilla</p>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <button
            onClick={copyLink}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg py-2 transition-colors"
          >
            Copiar enlace
          </button>
          <button
            onClick={generateQr}
            disabled={loading}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg py-2 transition-colors"
          >
            {loading ? 'Generando...' : qrDataUrl ? 'Regenerar QR' : 'Generar QR'}
          </button>
        </div>
      </div>
    </div>
  );
}
