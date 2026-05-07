'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';

interface AppointmentDoc {
  id: string;
  startsAt: string;
  endsAt: string;
  reason: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'DONE';
  notes: string | null;
  pet: { id: string; name: string; species: string };
  doctor: { id: string; firstName: string; lastName: string };
}

interface Material {
  id: string;
  quantity: number;
  notes: string | null;
  product: { id: string; name: string; unit: string; category: string };
  user: { firstName: string; lastName: string };
}

interface Product {
  id: string;
  name: string;
  unit: string;
  category: string;
  currentStock: number;
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente', CONFIRMED: 'Confirmada', CANCELLED: 'Cancelada', DONE: 'Realizada',
};
const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  DONE: 'bg-gray-100 text-gray-600',
};
const STATUS_BORDER: Record<string, string> = {
  PENDING: 'border-l-amber-400',
  CONFIRMED: 'border-l-green-400',
  CANCELLED: 'border-l-red-400',
  DONE: 'border-l-gray-300',
};

function PawIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="4" r="2"/>
      <circle cx="18" cy="8" r="2"/>
      <circle cx="20" cy="16" r="2"/>
      <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>
    </svg>
  );
}

interface Props {
  appointment: AppointmentDoc;
  onStatusChange: (id: string, status: string) => void;
  canAdmin: boolean;
  token?: string | null;
}

export function AppointmentCard({ appointment: a, onStatusChange, canAdmin, token }: Props) {
  const time = new Date(a.startsAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  const [expanded, setExpanded] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ productId: '', quantity: 1, notes: '' });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  async function toggleExpand() {
    if (!expanded && materials.length === 0) {
      setLoadingMaterials(true);
      try {
        const [mats, prods] = await Promise.all([
          apiFetch<Material[]>(`/appointments/${a.id}/products-used`, { token: token ?? undefined }),
          apiFetch<Product[]>('/products', { token: token ?? undefined }),
        ]);
        setMaterials(mats);
        setProducts(prods);
      } finally {
        setLoadingMaterials(false);
      }
    }
    setExpanded((v) => !v);
  }

  async function handleAddMaterial() {
    if (!addForm.productId || addForm.quantity < 1) return;
    setAdding(true);
    setAddError('');
    try {
      const result = await apiFetch<{ movement: object; currentStock: number }>(
        `/appointments/${a.id}/products-used`,
        {
          method: 'POST',
          token: token ?? undefined,
          body: { productId: addForm.productId, quantity: addForm.quantity, notes: addForm.notes || undefined },
        },
      );
      // Refresh materials list
      const mats = await apiFetch<Material[]>(`/appointments/${a.id}/products-used`, { token: token ?? undefined });
      setMaterials(mats);
      // Update product stock in local list
      setProducts((prev) =>
        prev.map((p) => p.id === addForm.productId ? { ...p, currentStock: result.currentStock } : p),
      );
      setAddForm({ productId: '', quantity: 1, notes: '' });
      setShowAddForm(false);
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : 'Error al registrar material');
    } finally {
      setAdding(false);
    }
  }

  const selectedProduct = products.find((p) => p.id === addForm.productId);
  const canAddMaterials = a.status !== 'CANCELLED' && (canAdmin || a.status === 'CONFIRMED' || a.status === 'DONE');

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-vet-100 border-l-4 ${STATUS_BORDER[a.status]} p-4 hover:shadow-md transition-all duration-200`}>
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-vet-100 rounded-full flex items-center justify-center text-vet-500 flex-shrink-0">
          <PawIcon />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <span className="font-semibold text-vet-800 text-sm">{time}</span>
              <span className="text-gray-500 text-sm ml-2">— {a.pet.name}</span>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_BADGE[a.status]}`}>
              {STATUS_LABEL[a.status]}
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">{a.reason}</p>
          <p className="text-gray-400 text-xs mt-0.5">Dr. {a.doctor.firstName} {a.doctor.lastName}</p>
          {a.notes && <p className="text-gray-400 text-xs mt-1 italic">{a.notes}</p>}

          {/* Materials section */}
          {canAddMaterials && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <button
                onClick={toggleExpand}
                className="flex items-center gap-1.5 text-xs text-vet-600 hover:text-vet-700 font-medium cursor-pointer transition-colors"
              >
                {/* Package icon */}
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
                  <polyline points="3.29 7 12 12 20.71 7"/>
                  <line x1="12" x2="12" y1="22" y2="12"/>
                </svg>
                Materiales usados {materials.length > 0 && `(${materials.length})`}
                {/* Chevron */}
                <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {expanded && (
                <div className="mt-3 space-y-2">
                  {loadingMaterials ? (
                    <div className="h-8 bg-vet-50 rounded animate-pulse" />
                  ) : materials.length === 0 ? (
                    <p className="text-xs text-gray-400">Sin materiales registrados</p>
                  ) : (
                    <div className="space-y-1.5">
                      {materials.map((m, i) => (
                        <div key={i} className="flex items-center justify-between bg-vet-50 rounded-lg px-3 py-2">
                          <div>
                            <span className="text-xs font-medium text-vet-800">{m.product.name}</span>
                            <span className="text-xs text-gray-500 ml-1.5">× {m.quantity} {m.product.unit}</span>
                            {m.notes && <span className="text-xs text-gray-400 ml-1.5">— {m.notes}</span>}
                          </div>
                          <span className="text-xs text-gray-400">{m.user.firstName} {m.user.lastName}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {!showAddForm ? (
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="flex items-center gap-1 text-xs text-vet-500 hover:text-vet-600 cursor-pointer transition-colors font-medium mt-1"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/>
                      </svg>
                      Agregar material
                    </button>
                  ) : (
                    <div className="bg-white border border-vet-100 rounded-lg p-3 space-y-2 mt-2">
                      {addError && (
                        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1.5">{addError}</div>
                      )}
                      <select
                        value={addForm.productId}
                        onChange={(e) => setAddForm((f) => ({ ...f, productId: e.target.value, quantity: 1 }))}
                        className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 text-vet-800 bg-white focus:outline-none focus:ring-2 focus:ring-vet-500 cursor-pointer"
                      >
                        <option value="">Selecciona un producto...</option>
                        {products.filter((p) => p.currentStock > 0).map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} — {p.currentStock} {p.unit} disponibles
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min={1}
                          max={selectedProduct?.currentStock ?? 999}
                          value={addForm.quantity}
                          onChange={(e) => setAddForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
                          className="w-24 text-xs border border-gray-200 rounded-lg px-2.5 py-2 text-vet-800 bg-white focus:outline-none focus:ring-2 focus:ring-vet-500"
                          placeholder="Cant."
                        />
                        <input
                          type="text"
                          value={addForm.notes}
                          onChange={(e) => setAddForm((f) => ({ ...f, notes: e.target.value }))}
                          className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-2 text-vet-800 bg-white focus:outline-none focus:ring-2 focus:ring-vet-500"
                          placeholder="Notas (opcional)"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleAddMaterial}
                          disabled={adding || !addForm.productId || addForm.quantity < 1}
                          className="text-xs bg-vet-500 hover:bg-vet-600 text-white font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                        >
                          {adding ? 'Registrando...' : 'Registrar'}
                        </button>
                        <button
                          onClick={() => { setShowAddForm(false); setAddError(''); }}
                          className="text-xs border border-gray-200 text-gray-600 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        {canAdmin && a.status !== 'DONE' && a.status !== 'CANCELLED' && (
          <div className="flex flex-col gap-1.5 flex-shrink-0">
            {a.status === 'PENDING' && (
              <button
                onClick={() => onStatusChange(a.id, 'CONFIRMED')}
                className="text-xs bg-green-500 hover:bg-green-600 active:scale-95 text-white px-2.5 py-1.5 rounded-lg transition-all duration-200 cursor-pointer font-medium"
              >
                Confirmar
              </button>
            )}
            <button
              onClick={() => onStatusChange(a.id, 'DONE')}
              className="text-xs bg-vet-500 hover:bg-vet-600 active:scale-95 text-white px-2.5 py-1.5 rounded-lg transition-all duration-200 cursor-pointer font-medium"
            >
              Realizada
            </button>
            <button
              onClick={() => onStatusChange(a.id, 'CANCELLED')}
              className="text-xs bg-white hover:bg-gray-50 active:scale-95 text-gray-600 border border-gray-200 px-2.5 py-1.5 rounded-lg transition-all duration-200 cursor-pointer font-medium"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
