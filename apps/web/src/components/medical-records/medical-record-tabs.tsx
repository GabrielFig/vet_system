'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { MedicalNoteSummary, PrescriptionSummary, VaccinationSummary } from '@vet/shared-types';

type Tab = 'notes' | 'prescriptions' | 'vaccinations';

interface Props {
  recordId: string;
  token: string | null;
}

export function MedicalRecordTabs({ recordId, token }: Props) {
  const [tab, setTab] = useState<Tab>('notes');
  const [q, setQ] = useState('');
  const [results, setResults] = useState<(MedicalNoteSummary | PrescriptionSummary | VaccinationSummary)[]>([]);
  const [loading, setLoading] = useState(false);

  const tabEndpoints: Record<Tab, string> = {
    notes: `/medical-records/${recordId}/notes`,
    prescriptions: `/medical-records/${recordId}/prescriptions`,
    vaccinations: `/medical-records/${recordId}/vaccinations`,
  };

  async function search() {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    const data = await apiFetch<(MedicalNoteSummary | PrescriptionSummary | VaccinationSummary)[]>(
      `${tabEndpoints[tab]}?${params}`,
      { token: token ?? undefined },
    ).catch(() => []);
    setResults(data);
    setLoading(false);
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'notes', label: '📋 Notas' },
    { key: 'prescriptions', label: '💊 Recetas' },
    { key: 'vaccinations', label: '💉 Vacunas' },
  ];

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold mb-3 text-white">Búsqueda en historial</h2>
      <div className="flex gap-2 mb-4 border-b border-slate-700">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setResults([]); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-white'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          placeholder="Buscar término..."
          className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
        />
        <button
          onClick={search}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          Buscar
        </button>
      </div>

      {loading && <div className="text-slate-400 text-sm">Buscando...</div>}

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((item) => (
            <div key={item.id} className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm">
              {'title' in item && <div className="font-medium text-white">{item.title}</div>}
              {'diagnosis' in item && <div className="font-medium text-white">{item.diagnosis}</div>}
              {'vaccineName' in item && <div className="font-medium text-white">{item.vaccineName}</div>}
              {'content' in item && <p className="text-slate-400 text-xs mt-1 line-clamp-2">{item.content}</p>}
              {'medications' in item && <p className="text-slate-400 text-xs mt-1">{item.medications}</p>}
              <div className="text-slate-500 text-xs mt-1">
                {'createdAt' in item && new Date((item as { createdAt: string }).createdAt).toLocaleDateString('es-MX')}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && results.length === 0 && q && (
        <div className="text-slate-400 text-sm">No se encontraron resultados para &ldquo;{q}&rdquo;</div>
      )}
    </div>
  );
}
