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
      {error && <div className="bg-red-500/10 border border-red-500 text-red-400 text-sm rounded-lg p-3">{error}</div>}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-slate-300 text-sm mb-1">Nombre *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required
            className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
        </div>
        <div>
          <label className="block text-slate-300 text-sm mb-1">SKU *</label>
          <input value={sku} onChange={(e) => setSku(e.target.value)} required
            className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-slate-300 text-sm mb-1">Categoría *</label>
          <input value={category} onChange={(e) => setCategory(e.target.value)} required
            className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
        </div>
        <div>
          <label className="block text-slate-300 text-sm mb-1">Unidad *</label>
          <input value={unit} onChange={(e) => setUnit(e.target.value)} required
            className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-slate-300 text-sm mb-1">Stock mínimo</label>
          <input type="number" value={minStock} onChange={(e) => setMinStock(e.target.value)} min="0"
            className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
        </div>
        <div>
          <label className="block text-slate-300 text-sm mb-1">Precio costo *</label>
          <input type="number" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} required min="0" step="0.01"
            className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
        </div>
        <div>
          <label className="block text-slate-300 text-sm mb-1">Precio venta *</label>
          <input type="number" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} required min="0" step="0.01"
            className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
        </div>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onCancel}
          className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg py-2 text-sm transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg py-2 text-sm transition-colors">
          {loading ? 'Guardando...' : 'Crear producto'}
        </button>
      </div>
    </form>
  );
}
