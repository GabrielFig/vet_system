'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Props {
  appointment: {
    id: string;
    reason: string;
    pet: { name: string };
    doctor: { firstName: string; lastName: string };
  };
  token?: string | null;
  onDone: () => void;
  onClose: () => void;
}

interface Prescription { diagnosis: string; medications: string; instructions: string }
interface Vaccination { vaccineName: string; batch: string; appliedAt: string; nextDose: string }

export function AttendAppointmentModal({ appointment, token, onDone, onClose }: Props) {
  const today = new Date().toISOString().split('T')[0];

  const [tab, setTab] = useState<'consulta' | 'materiales'>('consulta');
  const [noteContent, setNoteContent] = useState('');
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [newRx, setNewRx] = useState<Prescription>({ diagnosis: '', medications: '', instructions: '' });
  const [newVax, setNewVax] = useState<Vaccination>({ vaccineName: '', batch: '', appliedAt: today, nextDose: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [materials, setMaterials] = useState<Array<{
    id: string; quantity: number; notes: string | null;
    product: { name: string; unit: string; category: string };
    user: { firstName: string; lastName: string };
  }>>([]);
  const [products, setProducts] = useState<Array<{ id: string; name: string; unit: string; currentStock: number }>>([]);
  const [matsLoaded, setMatsLoaded] = useState(false);
  const [loadingMats, setLoadingMats] = useState(false);
  const [matForm, setMatForm] = useState({ productId: '', quantity: 1, notes: '' });
  const [addingMat, setAddingMat] = useState(false);
  const [matError, setMatError] = useState('');

  async function loadMaterials() {
    if (matsLoaded) return;
    setLoadingMats(true);
    try {
      const [mats, prods] = await Promise.all([
        apiFetch<typeof materials>(`/appointments/${appointment.id}/products-used`, { token: token ?? undefined }),
        apiFetch<typeof products>('/products', { token: token ?? undefined }),
      ]);
      setMaterials(mats);
      setProducts(prods);
      setMatsLoaded(true);
    } finally {
      setLoadingMats(false);
    }
  }

  function switchTab(t: 'consulta' | 'materiales') {
    setTab(t);
    if (t === 'materiales') loadMaterials();
  }

  async function handleAddMat() {
    if (!matForm.productId || matForm.quantity < 1) return;
    setAddingMat(true);
    setMatError('');
    try {
      const result = await apiFetch<{ movement: object; currentStock: number }>(
        `/appointments/${appointment.id}/products-used`,
        { method: 'POST', token: token ?? undefined, body: { productId: matForm.productId, quantity: matForm.quantity, notes: matForm.notes || undefined } },
      );
      const mats = await apiFetch<typeof materials>(`/appointments/${appointment.id}/products-used`, { token: token ?? undefined });
      setMaterials(mats);
      setProducts((prev) => prev.map((p) => p.id === matForm.productId ? { ...p, currentStock: result.currentStock } : p));
      setMatForm({ productId: '', quantity: 1, notes: '' });
    } catch (e: unknown) {
      setMatError(e instanceof Error ? e.message : 'Error al registrar material');
    } finally {
      setAddingMat(false);
    }
  }

  async function handleFinish() {
    setSaving(true);
    setError('');
    try {
      await apiFetch(`/appointments/${appointment.id}/attend`, {
        method: 'POST',
        token: token ?? undefined,
        body: {
          noteContent: noteContent.trim() || undefined,
          prescriptions: prescriptions.length ? prescriptions : undefined,
          vaccinations: vaccinations.length
            ? vaccinations.map((v) => ({ ...v, batch: v.batch || undefined, nextDose: v.nextDose || undefined }))
            : undefined,
        },
      });
      onDone();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al completar la cita');
    } finally {
      setSaving(false);
    }
  }

  const selectedProduct = products.find((p) => p.id === matForm.productId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-vet-100">
          <div>
            <h2 className="font-heading font-bold text-vet-800 text-lg">Atender cita</h2>
            <p className="text-sm text-gray-500">{appointment.pet.name} — {appointment.reason}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-vet-100 px-5">
          {(['consulta', 'materiales'] as const).map((t) => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                tab === t ? 'border-vet-500 text-vet-700' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'consulta' ? 'Consulta médica' : 'Materiales usados'}
              {t === 'materiales' && materials.length > 0 && (
                <span className="ml-1.5 bg-vet-100 text-vet-700 text-xs rounded-full px-1.5 py-0.5">{materials.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {tab === 'consulta' && (
            <>
              {/* Note */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Notas de la consulta</label>
                <textarea
                  rows={4}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Observaciones, diagnóstico, tratamiento..."
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 text-vet-800 bg-white focus:outline-none focus:ring-2 focus:ring-vet-500 resize-none"
                />
              </div>

              {/* Prescriptions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-600">Recetas</label>
                  {prescriptions.length > 0 && <span className="text-xs text-vet-600 font-medium">{prescriptions.length} agregada(s)</span>}
                </div>
                {prescriptions.map((rx, i) => (
                  <div key={i} className="flex items-start justify-between bg-vet-50 rounded-lg px-3 py-2 mb-1.5 gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-vet-800">{rx.diagnosis}</p>
                      <p className="text-xs text-gray-500">{rx.medications}</p>
                      {rx.instructions && <p className="text-xs text-gray-400 italic">{rx.instructions}</p>}
                    </div>
                    <button onClick={() => setPrescriptions((p) => p.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500 cursor-pointer flex-shrink-0 mt-0.5">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                ))}
                <div className="border border-dashed border-gray-200 rounded-xl p-3 space-y-2">
                  <input placeholder="Diagnóstico" value={newRx.diagnosis} onChange={(e) => setNewRx((r) => ({ ...r, diagnosis: e.target.value }))}
                    className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-vet-500" />
                  <input placeholder="Medicamentos" value={newRx.medications} onChange={(e) => setNewRx((r) => ({ ...r, medications: e.target.value }))}
                    className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-vet-500" />
                  <input placeholder="Indicaciones de uso" value={newRx.instructions} onChange={(e) => setNewRx((r) => ({ ...r, instructions: e.target.value }))}
                    className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-vet-500" />
                  <button
                    onClick={() => { if (newRx.diagnosis && newRx.medications) { setPrescriptions((p) => [...p, newRx]); setNewRx({ diagnosis: '', medications: '', instructions: '' }); } }}
                    disabled={!newRx.diagnosis || !newRx.medications}
                    className="text-xs text-vet-600 hover:text-vet-700 font-medium cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
                    Agregar receta
                  </button>
                </div>
              </div>

              {/* Vaccinations */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-600">Vacunas</label>
                  {vaccinations.length > 0 && <span className="text-xs text-green-600 font-medium">{vaccinations.length} agregada(s)</span>}
                </div>
                {vaccinations.map((v, i) => (
                  <div key={i} className="flex items-start justify-between bg-green-50 rounded-lg px-3 py-2 mb-1.5 gap-2">
                    <div>
                      <p className="text-xs font-medium text-green-800">{v.vaccineName}</p>
                      {v.batch && <p className="text-xs text-green-600">Lote: {v.batch}</p>}
                      {v.nextDose && <p className="text-xs text-gray-500">Próxima dosis: {new Date(v.nextDose).toLocaleDateString('es-MX')}</p>}
                    </div>
                    <button onClick={() => setVaccinations((vs) => vs.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500 cursor-pointer flex-shrink-0 mt-0.5">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                ))}
                <div className="border border-dashed border-gray-200 rounded-xl p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="Nombre de vacuna" value={newVax.vaccineName} onChange={(e) => setNewVax((v) => ({ ...v, vaccineName: e.target.value }))}
                      className="text-xs border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-vet-500" />
                    <input placeholder="Lote (opcional)" value={newVax.batch} onChange={(e) => setNewVax((v) => ({ ...v, batch: e.target.value }))}
                      className="text-xs border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-vet-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Fecha de aplicación</label>
                      <input type="date" value={newVax.appliedAt} onChange={(e) => setNewVax((v) => ({ ...v, appliedAt: e.target.value }))}
                        className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-vet-500" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Próxima dosis</label>
                      <input type="date" value={newVax.nextDose} onChange={(e) => setNewVax((v) => ({ ...v, nextDose: e.target.value }))}
                        className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-vet-500" />
                    </div>
                  </div>
                  <button
                    onClick={() => { if (newVax.vaccineName && newVax.appliedAt) { setVaccinations((vs) => [...vs, newVax]); setNewVax({ vaccineName: '', batch: '', appliedAt: today, nextDose: '' }); } }}
                    disabled={!newVax.vaccineName || !newVax.appliedAt}
                    className="text-xs text-vet-600 hover:text-vet-700 font-medium cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
                    Agregar vacuna
                  </button>
                </div>
              </div>
            </>
          )}

          {tab === 'materiales' && (
            <div>
              {loadingMats ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => <div key={i} className="h-10 bg-vet-50 rounded-xl animate-pulse" />)}
                </div>
              ) : (
                <>
                  {materials.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">Sin materiales registrados</p>
                  ) : (
                    <div className="space-y-2 mb-4">
                      {materials.map((m, i) => (
                        <div key={i} className="flex items-center justify-between bg-vet-50 rounded-xl px-3 py-2.5">
                          <div>
                            <span className="text-sm font-medium text-vet-800">{m.product.name}</span>
                            <span className="text-xs text-gray-500 ml-2">× {m.quantity} {m.product.unit}</span>
                            {m.notes && <span className="text-xs text-gray-400 ml-2">— {m.notes}</span>}
                          </div>
                          <span className="text-xs text-gray-400">{m.user.firstName}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {matError && (
                    <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{matError}</div>
                  )}
                  <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-3 space-y-2">
                    <p className="text-xs font-medium text-gray-600">Registrar material usado</p>
                    <select
                      value={matForm.productId}
                      onChange={(e) => setMatForm((f) => ({ ...f, productId: e.target.value, quantity: 1 }))}
                      className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-vet-500 cursor-pointer"
                    >
                      <option value="">Selecciona un producto...</option>
                      {products.filter((p) => p.currentStock > 0).map((p) => (
                        <option key={p.id} value={p.id}>{p.name} — {p.currentStock} {p.unit} disponibles</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <input type="number" min={1} max={selectedProduct?.currentStock ?? 999} value={matForm.quantity}
                        onChange={(e) => setMatForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
                        className="w-24 text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-vet-500" placeholder="Cant." />
                      <input value={matForm.notes} onChange={(e) => setMatForm((f) => ({ ...f, notes: e.target.value }))}
                        className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-vet-500" placeholder="Notas (opcional)" />
                      <button
                        onClick={handleAddMat}
                        disabled={addingMat || !matForm.productId || matForm.quantity < 1}
                        className="text-xs bg-vet-500 hover:bg-vet-600 text-white font-medium px-3 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50 active:scale-95"
                      >
                        {addingMat ? '...' : 'Agregar'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-vet-100 flex items-center justify-between gap-3">
          {error && <p className="text-xs text-red-600 flex-1">{error}</p>}
          <div className="flex gap-2 ml-auto">
            <button onClick={onClose} className="text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-xl transition-colors cursor-pointer font-medium">
              Cancelar
            </button>
            <button
              onClick={handleFinish}
              disabled={saving}
              className="text-sm bg-vet-500 hover:bg-vet-600 active:scale-95 text-white font-semibold px-5 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Completar cita'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
