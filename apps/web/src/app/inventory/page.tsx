'use client';

import { useEffect, useState } from 'react';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { apiFetch } from '@/lib/api';
import { ProductForm } from '@/components/inventory/product-form';
import { MovementForm } from '@/components/inventory/movement-form';

interface Product {
  id: string; name: string; sku: string; category: string; unit: string;
  currentStock: number; minStock: number; costPrice: string; salePrice: string; isActive: boolean;
}

export default function InventoryPage() {
  const { user, accessToken, role, ready } = useRequireAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [movementProductId, setMovementProductId] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !user) return;
    apiFetch<Product[]>('/products', { token: accessToken ?? undefined })
      .then(setProducts)
      .finally(() => setLoading(false));
  }, [ready, user, accessToken]);

  const isAdmin = role === 'ADMIN';
  const movementProduct = products.find((p) => p.id === movementProductId);

  if (!ready || !user) return <div className="min-h-screen bg-slate-900" />;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center gap-4">
        <a href="/dashboard" className="text-slate-400 hover:text-white text-sm">← Dashboard</a>
        <span className="text-slate-600">|</span>
        <span className="font-semibold">Inventario</span>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Inventario</h1>
          {isAdmin && (
            <button onClick={() => setShowProductForm(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              + Nuevo producto
            </button>
          )}
        </div>

        {showProductForm && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
            <h2 className="font-semibold mb-4">Nuevo producto</h2>
            <ProductForm
              token={accessToken}
              onSuccess={(p) => { setProducts((prev) => [p, ...prev]); setShowProductForm(false); }}
              onCancel={() => setShowProductForm(false)}
            />
          </div>
        )}

        {movementProduct && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-sm">
              <h2 className="font-semibold mb-4">Registrar movimiento</h2>
              <MovementForm
                productId={movementProduct.id}
                productName={movementProduct.name}
                token={accessToken}
                onSuccess={(newStock) => {
                  setProducts((prev) => prev.map((p) => p.id === movementProduct.id ? { ...p, currentStock: newStock } : p));
                  setMovementProductId(null);
                }}
                onCancel={() => setMovementProductId(null)}
              />
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-slate-400 text-center py-12">Cargando...</div>
        ) : products.length === 0 ? (
          <div className="text-slate-400 text-center py-12">No hay productos registrados</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-left">
                  <th className="pb-3 pr-4">Producto</th>
                  <th className="pb-3 pr-4">SKU</th>
                  <th className="pb-3 pr-4">Categoría</th>
                  <th className="pb-3 pr-4">Stock</th>
                  <th className="pb-3 pr-4">Precio venta</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-slate-800">
                    <td className="py-3 pr-4 font-medium text-white">{p.name}</td>
                    <td className="py-3 pr-4 text-slate-400">{p.sku}</td>
                    <td className="py-3 pr-4 text-slate-400">{p.category}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.currentStock <= p.minStock ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                        {p.currentStock} {p.unit}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-300">${Number(p.salePrice).toFixed(2)}</td>
                    <td className="py-3">
                      <button onClick={() => setMovementProductId(p.id)}
                        className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg transition-colors">
                        + Movimiento
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
