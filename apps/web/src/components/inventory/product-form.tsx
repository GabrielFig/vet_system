'use client';

import { useState, FormEvent } from 'react';
import { apiFetch, ApiError } from '@/lib/api';

interface Product {
  id: string; name: string; sku: string; category: string; unit: string;
  currentStock: number; minStock: number; costPrice: string; salePrice: string; isActive: boolean;
}

interface Props {
  token: string | null;
  onSuccess: (p: Product) => void;
  onCancel: () => void;
}

const inputClass =
  'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-vet-800 bg-white focus:outline-none focus:ring-2 focus:ring-vet-500 focus:border-transparent transition-all duration-200';
const labelClass = 'block text-sm font-medium text-vet-800 mb-1';

export function ProductForm({ token, onSuccess, onCancel }: Props) {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState('piezas');
  const [minStock, setMinStock] = useState('5');
  const [costPrice, setCostPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const product = await apiFetch<Product>('/products', {
        method: 'POST',
        token: token ?? undefined,
        body: { name, sku, category, unit, minStock: Number(minStock), costPrice: Number(costPrice), salePrice: Number(salePrice) },
      });
      onSuccess(product);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al crear producto');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Nombre *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>SKU *</label>
          <input value={sku} onChange={(e) => setSku(e.target.value)} required className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Categoría *</label>
          <input value={category} onChange={(e) => setCategory(e.target.value)} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Unidad *</label>
          <input value={unit} onChange={(e) => setUnit(e.target.value)} required className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>Stock mínimo</label>
          <input type="number" value={minStock} onChange={(e) => setMinStock(e.target.value)} min="0" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Precio costo *</label>
          <input type="number" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} required min="0" step="0.01" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Precio venta *</label>
          <input type="number" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} required min="0" step="0.01" className={inputClass} />
        </div>
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
          {loading ? 'Guardando...' : 'Crear producto'}
        </button>
      </div>
    </form>
  );
}
