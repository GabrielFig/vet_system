'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Escanear QR</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
        </div>

        {error ? (
          <div className="bg-red-500/10 border border-red-500 text-red-400 text-sm rounded-lg p-3 mb-4">{error}</div>
        ) : (
          <div className="bg-black rounded-xl overflow-hidden aspect-square mb-4 relative">
            <video ref={videoRef} className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-indigo-500 rounded-lg" />
            </div>
          </div>
        )}

        <div className="border-t border-slate-700 pt-4">
          <p className="text-slate-400 text-xs mb-2">— o ingresa el UUID manualmente —</p>
          <div className="flex gap-2">
            <input
              value={manualUuid}
              onChange={(e) => setManualUuid(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="flex-1 bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleManualSubmit}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
            >
              Ir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
