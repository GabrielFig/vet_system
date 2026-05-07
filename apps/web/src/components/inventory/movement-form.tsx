'use client';

import { useState, FormEvent } from 'react';
import { apiFetch, ApiError } from '@/lib/api';

interface Props {
  productId: string;
  productName: string;
  token: string | null;
  onSuccess: (newStock: number) => void;
  onCancel: () => void;
}

export function MovementForm({ productId, productName, token, onSuccess, onCancel }: Props) {
  const [type, setType] = useState<'IN' | 'OUT' | 'ADJUSTMENT'>('IN');
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await apiFetch<{ currentStock: number }>(`/products/${productId}/movements`, {
        method: 'POST',
        token: token ?? undefined,
        body: { type, quantity: Number(quantity), notes: notes || undefined },
      });
      onSuccess(result.currentStock);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al registrar movimiento');
    } finally {
      setLoading(false);
    }
  }

  const TYPE_LABEL = { IN: 'Entrada', OUT: 'Salida', ADJUSTMENT: 'Ajuste' };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-slate-300 text-sm font-medium">{productName}</div>
      {error && <div className="bg-red-500/10 border border-red-500 text-red-400 text-sm rounded-lg p-3">{error}</div>}

      <div>
        <label className="block text-slate-300 text-sm mb-1">Tipo</label>
        <div className="flex gap-2">
          {(['IN', 'OUT', 'ADJUSTMENT'] as const).map((t) => (
            <button key={t} type="button" onClick={() => setType(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${type === t ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
              {TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-slate-300 text-sm mb-1">
          {type === 'ADJUSTMENT' ? 'Nuevo stock total' : 'Cantidad'}
        </label>
        <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required min="1"
          className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
      </div>

      <div>
        <label className="block text-slate-300 text-sm mb-1">Notas</label>
        <input value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="Opcional"
          className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onCancel}
          className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg py-2 text-sm transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg py-2 text-sm transition-colors">
          {loading ? 'Guardando...' : 'Registrar'}
        </button>
      </div>
    </form>
  );
}
