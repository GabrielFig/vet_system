'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { usePlan } from '@/hooks/use-plan';
import { apiFetch, ApiError } from '@/lib/api';
import { AppShell } from '@/components/layout/app-shell';

const ALL_MODULES = ['INVENTORY', 'REPORTS'] as const;
type ModuleType = typeof ALL_MODULES[number];

interface ClinicModule { module: ModuleType; enabledAt: string }
interface Clinic {
  id: string;
  name: string;
  slug: string;
  planType: string;
  isActive: boolean;
  createdAt: string;
  modules: ClinicModule[];
  _count: { users: number };
}

const MODULE_LABELS: Record<ModuleType, string> = {
  INVENTORY: 'Inventario',
  REPORTS: 'Reportes',
};

const PLAN_COLORS: Record<string, string> = {
  BASIC: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  PRO: 'bg-vet-500/20 text-vet-300 border-vet-500/30',
  ENTERPRISE: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
};

function ShieldIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
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

export default function AdminClinicsPage() {
  const { user, accessToken, ready } = useRequireAuth();
  const { isSuperAdmin } = usePlan();
  const router = useRouter();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', slug: '', planType: 'BASIC' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [togglingModule, setTogglingModule] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!isSuperAdmin) { router.replace('/dashboard'); return; }
    apiFetch<Clinic[]>('/admin/clinics', { token: accessToken ?? undefined })
      .then(setClinics)
      .finally(() => setLoading(false));
  }, [ready, isSuperAdmin, accessToken, router]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      const clinic = await apiFetch<Clinic>('/admin/clinics', {
        method: 'POST',
        token: accessToken ?? undefined,
        body: createForm,
      });
      setClinics((prev) => [clinic, ...prev]);
      setShowCreate(false);
      setCreateForm({ name: '', slug: '', planType: 'BASIC' });
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : 'Error al crear clínica');
    } finally {
      setCreating(false);
    }
  }

  async function toggleModule(clinic: Clinic, mod: ModuleType) {
    const key = `${clinic.id}-${mod}`;
    setTogglingModule(key);
    const hasModule = clinic.modules.some((m) => m.module === mod);
    const currentModules = clinic.modules.map((m) => m.module);
    const newModules: ModuleType[] = hasModule
      ? currentModules.filter((m) => m !== mod)
      : [...currentModules, mod];

    try {
      const updated = await apiFetch<Clinic>(`/admin/clinics/${clinic.id}/modules`, {
        method: 'PATCH',
        token: accessToken ?? undefined,
        body: { modules: newModules },
      });
      setClinics((prev) => prev.map((c) => (c.id === clinic.id ? { ...updated, _count: c._count } : c)));
    } catch {
      // ignore
    } finally {
      setTogglingModule(null);
    }
  }

  async function toggleActive(clinic: Clinic) {
    try {
      const updated = await apiFetch<Clinic>(`/admin/clinics/${clinic.id}`, {
        method: 'PATCH',
        token: accessToken ?? undefined,
        body: { isActive: !clinic.isActive },
      });
      setClinics((prev) => prev.map((c) => (c.id === clinic.id ? { ...updated, _count: c._count } : c)));
    } catch { /* ignore */ }
  }

  if (!ready || !user) return <div className="min-h-screen bg-vet-50" />;

  return (
    <AppShell>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
            <ShieldIcon />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-vet-800">Panel Admin</h1>
            <p className="text-xs text-gray-400 mt-0.5">Gestión de clínicas y módulos</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-medium px-4 py-2.5 rounded-lg text-sm transition-all duration-200 cursor-pointer flex items-center gap-2">
          <PlusIcon />
          Nueva clínica
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {(['BASIC', 'PRO', 'ENTERPRISE'] as const).map((plan) => {
          const count = clinics.filter((c) => c.planType === plan).length;
          return (
            <div key={plan} className="bg-white rounded-xl border border-vet-100 p-4 text-center">
              <p className="text-2xl font-bold text-vet-800">{count}</p>
              <p className={`text-xs font-semibold mt-1 px-2 py-0.5 rounded-full border inline-block ${PLAN_COLORS[plan]}`}>{plan}</p>
            </div>
          );
        })}
      </div>

      {/* Clinic list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-vet-100 p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-40 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-24" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {clinics.map((clinic) => (
            <div key={clinic.id}
              className={`bg-white rounded-xl border p-4 transition-all ${clinic.isActive ? 'border-vet-100' : 'border-red-100 opacity-60'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-vet-800">{clinic.name}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${PLAN_COLORS[clinic.planType] ?? ''}`}>
                      {clinic.planType}
                    </span>
                    {!clinic.isActive && (
                      <span className="text-xs bg-red-50 text-red-500 border border-red-200 rounded-full px-2 py-0.5 font-medium">
                        Inactiva
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {clinic.slug} · {clinic._count.users} {clinic._count.users === 1 ? 'usuario' : 'usuarios'}
                  </p>

                  {/* Module toggles */}
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    {ALL_MODULES.map((mod) => {
                      const enabled = clinic.modules.some((m) => m.module === mod);
                      const key = `${clinic.id}-${mod}`;
                      return (
                        <button
                          key={mod}
                          onClick={() => toggleModule(clinic, mod)}
                          disabled={togglingModule === key}
                          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all cursor-pointer disabled:opacity-50 ${
                            enabled
                              ? 'bg-vet-50 text-vet-700 border-vet-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                              : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-vet-50 hover:text-vet-600 hover:border-vet-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${enabled ? 'bg-vet-500' : 'bg-gray-300'}`} />
                          {MODULE_LABELS[mod]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={() => toggleActive(clinic)}
                  className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    clinic.isActive
                      ? 'text-red-500 border-red-200 hover:bg-red-50'
                      : 'text-vet-600 border-vet-200 hover:bg-vet-50'
                  }`}
                >
                  {clinic.isActive ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create clinic modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-vet-100">
              <h2 className="font-heading font-bold text-vet-800 text-lg">Nueva clínica</h2>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              {createError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{createError}</div>
              )}
              <div>
                <label className="block text-sm font-medium text-vet-800 mb-1">Nombre *</label>
                <input
                  value={createForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setCreateForm((f) => ({ ...f, name, slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }));
                  }}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-vet-800 focus:outline-none focus:ring-2 focus:ring-vet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-vet-800 mb-1">Slug *</label>
                <input
                  value={createForm.slug}
                  onChange={(e) => setCreateForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-vet-800 focus:outline-none focus:ring-2 focus:ring-vet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-vet-800 mb-1">Plan inicial</label>
                <select
                  value={createForm.planType}
                  onChange={(e) => setCreateForm((f) => ({ ...f, planType: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-vet-800 focus:outline-none focus:ring-2 focus:ring-vet-500 bg-white cursor-pointer"
                >
                  <option value="BASIC">BASIC — Sin módulos extra</option>
                  <option value="PRO">PRO — Inventario + Reportes</option>
                  <option value="ENTERPRISE">ENTERPRISE — Todo</option>
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg py-2.5 text-sm font-medium cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" disabled={creating}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 text-sm cursor-pointer">
                  {creating ? 'Creando...' : 'Crear clínica'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
