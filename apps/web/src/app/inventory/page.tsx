'use client';

import { useEffect, useState } from 'react';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { apiFetch } from '@/lib/api';
import { ProductForm } from '@/components/inventory/product-form';
import { MovementForm } from '@/components/inventory/movement-form';
import { AppShell } from '@/components/layout/app-shell';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlan } from '@/hooks/use-plan';
import { UpgradeBanner } from '@/components/ui/upgrade-banner';

interface Product {
  id: string; name: string; sku: string; category: string; unit: string;
  currentStock: number; minStock: number; costPrice: string; salePrice: string; isActive: boolean;
}

function BoxIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
      <polyline points="3.29 7 12 12 20.71 7"/>
      <line x1="12" x2="12" y1="22" y2="12"/>
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" x2="12" y1="5" y2="19"/>
      <line x1="5" x2="19" y1="12" y2="12"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18"/>
      <path d="m6 6 12 12"/>
    </svg>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-vet-50">
      <td className="py-3 pr-4"><Skeleton className="h-4 w-40" /></td>
      <td className="py-3 pr-4"><Skeleton className="h-4 w-24" /></td>
      <td className="py-3 pr-4"><Skeleton className="h-4 w-28" /></td>
      <td className="py-3 pr-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
      <td className="py-3 pr-4"><Skeleton className="h-4 w-20" /></td>
      <td className="py-3"><Skeleton className="h-8 w-24 rounded-lg" /></td>
    </tr>
  );
}

export default function InventoryPage() {
  const { user, accessToken, role, ready } = useRequireAuth();
  const { canUseInventory, planType } = usePlan();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [movementProductId, setMovementProductId] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !user || !canUseInventory) return;
    apiFetch<Product[]>('/products', { token: accessToken ?? undefined })
      .then(setProducts)
      .finally(() => setLoading(false));
  }, [ready, user, accessToken, canUseInventory]);

  const isAdmin = role === 'ADMIN';
  const movementProduct = products.find((p) => p.id === movementProductId);

  if (!ready || !user) return <div className="min-h-screen bg-vet-50" />;

  if (!canUseInventory) {
    return (
      <AppShell>
        <UpgradeBanner feature="Inventario" requiredPlan="PRO" currentPlan={planType} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-vet-100 flex items-center justify-center text-vet-500">
            <BoxIcon />
          </div>
          <h1 className="font-heading text-2xl font-bold text-vet-800">Inventario</h1>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowProductForm(true)}
            className="bg-vet-500 hover:bg-vet-600 active:scale-95 text-white font-medium px-4 py-2.5 rounded-lg text-sm transition-all duration-200 cursor-pointer flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-vet-500 focus:ring-offset-2"
          >
            <PlusIcon />
            Nuevo producto
          </button>
        )}
      </div>

      {/* New product modal */}
      {showProductForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-heading font-semibold text-vet-800 text-lg">Nuevo producto</h2>
              <button
                onClick={() => setShowProductForm(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-vet-500 rounded-lg p-1"
                aria-label="Cerrar"
              >
                <XIcon />
              </button>
            </div>
            <ProductForm
              token={accessToken}
              onSuccess={(p) => { setProducts((prev) => [p, ...prev]); setShowProductForm(false); }}
              onCancel={() => setShowProductForm(false)}
            />
          </div>
        </div>
      )}

      {/* Movement modal */}
      {movementProduct && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-heading font-semibold text-vet-800 text-lg">Registrar movimiento</h2>
              <button
                onClick={() => setMovementProductId(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-vet-500 rounded-lg p-1"
                aria-label="Cerrar"
              >
                <XIcon />
              </button>
            </div>
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

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-vet-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-vet-50 border-b border-vet-100 text-gray-500 text-left">
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Categoría</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Precio venta</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="px-4">
              {[1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)}
            </tbody>
          </table>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-vet-100 mb-4 text-vet-200">
            <BoxIcon />
          </div>
          <p className="text-gray-500 font-medium">No hay productos registrados</p>
          <p className="text-gray-400 text-sm mt-1">Agrega tu primer producto al inventario</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-vet-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-vet-50 border-b border-vet-100 text-gray-500 text-left">
                  <th className="px-4 py-3 font-medium">Producto</th>
                  <th className="px-4 py-3 font-medium">SKU</th>
                  <th className="px-4 py-3 font-medium">Categoría</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Precio venta</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-vet-50 hover:bg-vet-50 transition-colors duration-150">
                    <td className="px-4 py-3 font-medium text-vet-800">{p.name}</td>
                    <td className="px-4 py-3 text-gray-500">{p.sku}</td>
                    <td className="px-4 py-3 text-gray-500">{p.category}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        p.currentStock <= p.minStock
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {p.currentStock} {p.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-vet-800">${Number(p.salePrice).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setMovementProductId(p.id)}
                        className="text-xs bg-vet-50 hover:bg-vet-100 text-vet-600 border border-vet-100 hover:border-vet-200 px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer font-medium active:scale-95"
                      >
                        + Movimiento
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {products.map((p) => (
              <div key={p.id} className="bg-white rounded-xl p-4 shadow-sm border border-vet-100">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold text-vet-800 text-sm">{p.name}</div>
                    <div className="text-gray-400 text-xs mt-0.5">{p.sku} · {p.category}</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    p.currentStock <= p.minStock
                      ? 'bg-red-100 text-red-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {p.currentStock} {p.unit}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-gray-500 text-sm">${Number(p.salePrice).toFixed(2)}</span>
                  <button
                    onClick={() => setMovementProductId(p.id)}
                    className="text-xs bg-vet-50 hover:bg-vet-100 text-vet-600 border border-vet-100 px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer font-medium active:scale-95"
                  >
                    + Movimiento
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </AppShell>
  );
}
