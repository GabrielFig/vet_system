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

const inputClass =
  'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-vet-800 bg-white focus:outline-none focus:ring-2 focus:ring-vet-500 focus:border-transparent transition-all duration-200';
const labelClass = 'block text-sm font-medium text-vet-800 mb-1';

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
  const TYPE_ACTIVE: Record<string, string> = {
    IN: 'bg-green-500 text-white border-green-500',
    OUT: 'bg-red-500 text-white border-red-500',
    ADJUSTMENT: 'bg-vet-500 text-white border-vet-500',
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-sm font-medium text-vet-800 bg-vet-50 rounded-lg px-3 py-2 border border-vet-100">
        {productName}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
          {error}
        </div>
      )}

      <div>
        <label className={labelClass}>Tipo de movimiento</label>
        <div className="flex gap-2">
          {(['IN', 'OUT', 'ADJUSTMENT'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer active:scale-95 border ${
                type === t
                  ? TYPE_ACTIVE[t]
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelClass}>
          {type === 'ADJUSTMENT' ? 'Nuevo stock total' : 'Cantidad'}
        </label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
          min="1"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Notas</label>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Opcional"
          className={inputClass}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-vet-500 hover:bg-vet-600 disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 text-sm transition-all duration-200 cursor-pointer active:scale-95 disabled:active:scale-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-vet-500 focus:ring-offset-2"
        >
          {loading ? 'Guardando...' : 'Registrar'}
        </button>
      </div>
    </form>
  );
}
