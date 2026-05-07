'use client';

import { useState } from 'react';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useAuthStore } from '@/store/auth.store';
import { AppShell } from '@/components/layout/app-shell';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function ChartIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" x2="18" y1="20" y2="10"/>
      <line x1="12" x2="12" y1="20" y2="4"/>
      <line x1="6" x2="6" y1="20" y2="14"/>
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" x2="12" y1="15" y2="3"/>
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

const selectClass =
  'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-vet-800 bg-white focus:outline-none focus:ring-2 focus:ring-vet-500 focus:border-transparent transition-all duration-200 cursor-pointer';
const labelClass = 'block text-sm font-medium text-vet-800 mb-1';

export default function ReportsPage() {
  const { user, accessToken, ready } = useRequireAuth();
  const { role } = useAuthStore();
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [loading, setLoading] = useState(false);

  if (!ready || !user) return <div className="min-h-screen bg-vet-50" />;

  if (role !== 'ADMIN') {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center text-red-400 mb-4">
            <LockIcon />
          </div>
          <h2 className="font-heading font-semibold text-vet-800 text-lg mb-1">Acceso restringido</h2>
          <p className="text-gray-500 text-sm">Solo los administradores pueden ver reportes</p>
        </div>
      </AppShell>
    );
  }

  async function downloadReport() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/reports/monthly?month=${month}&year=${year}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error('Error al generar reporte');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-${year}-${month.padStart(2, '0')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Error al generar el reporte');
    } finally {
      setLoading(false);
    }
  }

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  const years = [String(now.getFullYear()), String(now.getFullYear() - 1)];

  return (
    <AppShell>
      {/* Page header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-vet-100 flex items-center justify-center text-vet-500">
          <ChartIcon />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-vet-800">Reportes</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Genera un reporte mensual con consultas, inventario y movimientos
          </p>
        </div>
      </div>

      <div className="max-w-lg">
        <div className="bg-white rounded-2xl shadow-sm border border-vet-100 p-6 space-y-5">
          <h2 className="font-heading font-semibold text-vet-800">Reporte mensual de clínica</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Mes</label>
              <select value={month} onChange={(e) => setMonth(e.target.value)} className={selectClass}>
                {months.map((m, i) => (
                  <option key={i} value={String(i + 1)}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Año</label>
              <select value={year} onChange={(e) => setYear(e.target.value)} className={selectClass}>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={downloadReport}
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed text-white font-semibold rounded-lg py-3 text-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          >
            {loading ? (
              <>
                <SpinnerIcon />
                Generando...
              </>
            ) : (
              <>
                <DownloadIcon />
                Descargar reporte PDF
              </>
            )}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
