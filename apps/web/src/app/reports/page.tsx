'use client';

import { useState } from 'react';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useAuthStore } from '@/store/auth.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function ReportsPage() {
  const { user, accessToken, ready } = useRequireAuth();
  const { role } = useAuthStore();
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [loading, setLoading] = useState(false);

  if (!ready || !user) return <div className="min-h-screen bg-slate-900" />;
  if (role !== 'ADMIN') return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-red-400">
      Solo los administradores pueden ver reportes
    </div>
  );

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
    <div className="min-h-screen bg-slate-900 text-white">
      <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center gap-4">
        <a href="/dashboard" className="text-slate-400 hover:text-white text-sm">← Dashboard</a>
        <span className="text-slate-600">|</span>
        <span className="font-semibold">Reportes</span>
      </nav>

      <main className="max-w-lg mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold mb-2">Reportes PDF</h1>
        <p className="text-slate-400 text-sm mb-8">Genera un reporte mensual con consultas atendidas, inventario y movimientos de stock.</p>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">Reporte mensual de clínica</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 text-sm mb-1">Mes</label>
              <select value={month} onChange={(e) => setMonth(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
                {months.map((m, i) => <option key={i} value={String(i + 1)}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-slate-300 text-sm mb-1">Año</label>
              <select value={year} onChange={(e) => setYear(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <button onClick={downloadReport} disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg py-3 text-sm transition-colors">
            {loading ? 'Generando...' : 'Descargar reporte PDF'}
          </button>
        </div>
      </main>
    </div>
  );
}
