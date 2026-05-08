'use client';

import { useEffect, useState } from 'react';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { apiFetch } from '@/lib/api';
import { AppShell } from '@/components/layout/app-shell';
import { SkeletonCard } from '@/components/ui/skeleton';
import Link from 'next/link';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  isActive: boolean;
  _count: { pets: number };
}

function UsersIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/>
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  );
}

export default function ClientsPage() {
  const { user, accessToken, ready } = useRequireAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  function load(q = '') {
    if (!accessToken) return;
    apiFetch<Client[]>(`/clients${q ? `?q=${encodeURIComponent(q)}` : ''}`, { token: accessToken })
      .then(setClients)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!ready || !user) return;
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user, accessToken]);

  useEffect(() => {
    const timer = setTimeout(() => load(search), 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName || !form.lastName) return;
    setSaving(true);
    setFormError('');
    try {
      const c = await apiFetch<Client>('/clients', {
        method: 'POST',
        token: accessToken ?? undefined,
        body: { ...form, phone: form.phone || undefined, email: form.email || undefined, notes: form.notes || undefined },
      });
      setClients((prev) => [{ ...c, _count: { pets: 0 } }, ...prev]);
      setShowForm(false);
      setForm({ firstName: '', lastName: '', phone: '', email: '', notes: '' });
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error al crear cliente');
    } finally {
      setSaving(false);
    }
  }

  if (!ready || !user) return <div className="min-h-screen bg-vet-50" />;

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-vet-100 flex items-center justify-center text-vet-500">
            <UsersIcon />
          </div>
          <h1 className="font-heading text-2xl font-bold text-vet-800">Clientes</h1>
        </div>
        <button onClick={() => setShowForm(true)}
          className="bg-vet-500 hover:bg-vet-600 active:scale-95 text-white font-medium px-4 py-2.5 rounded-lg text-sm transition-all duration-200 cursor-pointer flex items-center gap-2">
          <PlusIcon />
          Nuevo cliente
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><SearchIcon /></div>
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, teléfono o email..."
          className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-3 text-sm text-vet-800 focus:outline-none focus:ring-2 focus:ring-vet-500 focus:border-transparent transition-all" />
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <SkeletonCard key={i} />)}</div>
      ) : clients.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-vet-100 mb-4 text-vet-300">
            <UsersIcon />
          </div>
          <p className="text-gray-500 font-medium">{search ? 'Sin resultados' : 'Sin clientes registrados'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-vet-100 p-4 hover:shadow-md transition-all duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-vet-100 rounded-full flex items-center justify-center text-vet-600 font-semibold text-sm flex-shrink-0">
                    {c.firstName[0]}{c.lastName[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-vet-800">{c.firstName} {c.lastName}</p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {c.phone && <span className="text-xs text-gray-500">{c.phone}</span>}
                      {c.email && <span className="text-xs text-gray-400">{c.email}</span>}
                    </div>
                    {c.notes && <p className="text-xs text-gray-400 mt-0.5 italic">{c.notes}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs bg-vet-50 text-vet-600 border border-vet-100 rounded-full px-2.5 py-1 font-medium">
                    {c._count.pets} {c._count.pets === 1 ? 'mascota' : 'mascotas'}
                  </span>
                  <Link href={`/pets?clientId=${c.id}`}
                    className="text-xs text-vet-500 hover:text-vet-700 cursor-pointer font-medium transition-colors">
                    Ver mascotas
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New client modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-vet-100">
              <h2 className="font-heading font-bold text-vet-800 text-lg">Nuevo cliente</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              {formError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{formError}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-vet-800 mb-1">Nombre *</label>
                  <input value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-vet-800 bg-white focus:outline-none focus:ring-2 focus:ring-vet-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-vet-800 mb-1">Apellido *</label>
                  <input value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-vet-800 bg-white focus:outline-none focus:ring-2 focus:ring-vet-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-vet-800 mb-1">Teléfono</label>
                  <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-vet-800 bg-white focus:outline-none focus:ring-2 focus:ring-vet-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-vet-800 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-vet-800 bg-white focus:outline-none focus:ring-2 focus:ring-vet-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-vet-800 mb-1">Notas</label>
                <textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Alergias, preferencias, etc."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-vet-800 bg-white focus:outline-none focus:ring-2 focus:ring-vet-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg py-2.5 text-sm font-medium cursor-pointer transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-vet-500 hover:bg-vet-600 disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 text-sm cursor-pointer transition-colors active:scale-95">
                  {saving ? 'Guardando...' : 'Crear cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
