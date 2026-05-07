'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

function XIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18"/>
      <path d="m6 6 12 12"/>
    </svg>
  );
}

export function QRScanner({ onClose }: { onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [manualUuid, setManualUuid] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    let readerInstance: { reset?: () => void } | null = null;

    async function startScanner() {
      try {
        const { BrowserQRCodeReader } = await import('@zxing/browser');
        const codeReader = new BrowserQRCodeReader();
        readerInstance = codeReader as unknown as { reset?: () => void };
        if (videoRef.current) {
          await codeReader.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
            if (result) {
              const text = result.getText();
              const match = text.match(/\/public\/([a-f0-9-]{36})/);
              const uuid = match ? match[1] : text;
              router.push(`/public/${uuid}`);
            }
          });
        }
      } catch {
        setError('No se pudo acceder a la cámara');
      }
    }

    startScanner();
    return () => {
      readerInstance?.reset?.();
    };
  }, [router]);

  function handleManualSubmit() {
    const uuid = manualUuid.trim();
    if (!uuid) return;
    router.push(`/public/${uuid}`);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading font-semibold text-vet-800">Escanear QR</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-vet-500 rounded-lg p-1"
            aria-label="Cerrar"
          >
            <XIcon />
          </button>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">{error}</div>
        ) : (
          <div className="bg-black rounded-xl overflow-hidden aspect-square mb-4 relative">
            <video ref={videoRef} className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-vet-500 rounded-lg" />
            </div>
          </div>
        )}

        <div className="border-t border-vet-100 pt-4">
          <p className="text-gray-400 text-xs mb-2 text-center">— o ingresa el UUID manualmente —</p>
          <div className="flex gap-2">
            <input
              value={manualUuid}
              onChange={(e) => setManualUuid(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="flex-1 border border-gray-200 bg-white text-vet-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-vet-500 focus:border-transparent transition-all duration-200"
            />
            <button
              onClick={handleManualSubmit}
              className="bg-vet-500 hover:bg-vet-600 active:scale-95 text-white px-3 py-2 rounded-lg text-sm transition-all duration-200 cursor-pointer font-medium focus:outline-none focus:ring-2 focus:ring-vet-500"
            >
              Ir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
