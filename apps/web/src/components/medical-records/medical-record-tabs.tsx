'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { MedicalNoteSummary, PrescriptionSummary, VaccinationSummary } from '@vet/shared-types';

type Tab = 'notes' | 'prescriptions' | 'vaccinations';

interface Props {
  recordId: string;
  token: string | null;
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.35-4.35"/>
    </svg>
  );
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
    { key: 'notes', label: 'Notas' },
    { key: 'prescriptions', label: 'Recetas' },
    { key: 'vaccinations', label: 'Vacunas' },
  ];

  return (
    <div className="mt-6">
      <h2 className="font-heading text-lg font-semibold text-vet-800 mb-3">Búsqueda en historial</h2>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-vet-100">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setResults([]); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-all duration-200 cursor-pointer ${
              tab === t.key
                ? 'border-vet-500 text-vet-600'
                : 'border-transparent text-gray-400 hover:text-vet-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search input */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <SearchIcon />
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            placeholder="Buscar término..."
            className="w-full border border-gray-200 bg-white text-vet-800 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-vet-500 focus:border-transparent transition-all duration-200"
          />
        </div>
        <button
          onClick={search}
          className="bg-vet-500 hover:bg-vet-600 active:scale-95 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-vet-500 focus:ring-offset-2"
        >
          Buscar
        </button>
      </div>

      {loading && (
        <div className="text-gray-400 text-sm">Buscando...</div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((item) => (
            <div key={item.id} className="bg-white border border-vet-100 rounded-lg p-3 shadow-sm text-sm">
              {'title' in item && <div className="font-medium text-vet-800">{item.title}</div>}
              {'diagnosis' in item && <div className="font-medium text-vet-800">{item.diagnosis}</div>}
              {'vaccineName' in item && <div className="font-medium text-vet-800">{item.vaccineName}</div>}
              {'content' in item && <p className="text-gray-500 text-xs mt-1 line-clamp-2">{item.content}</p>}
              {'medications' in item && <p className="text-gray-500 text-xs mt-1">{item.medications}</p>}
              <div className="text-gray-400 text-xs mt-1">
                {'createdAt' in item && new Date((item as { createdAt: string }).createdAt).toLocaleDateString('es-MX')}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && results.length === 0 && q && (
        <div className="text-gray-400 text-sm">
          No se encontraron resultados para &ldquo;{q}&rdquo;
        </div>
      )}
    </div>
  );
}
