'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { getAllProducts, updateProduct } from '@/lib/supabase';
import { Product } from '@/lib/types';
import { formatMK } from '@/components/ProductCard';
import toast from 'react-hot-toast';

export default function StockTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [updates, setUpdates] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllProducts();
      setProducts(data || []);
      const init: Record<string, string> = {};
      data?.forEach((p: Product) => { init[p.id] = String(p.stock); });
      setUpdates(init);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleStockUpdate = async (product: Product) => {
    const newStock = Number(updates[product.id] ?? product.stock);
    if (isNaN(newStock) || newStock < 0) {
      toast.error('Invalid stock value');
      return;
    }
    setSaving(s => ({ ...s, [product.id]: true }));
    try {
      await updateProduct(product.id, { stock: newStock });
      toast.success(`${product.name} stock updated to ${newStock}`);
      fetch();
    } catch {
      toast.error('Failed to update stock');
    } finally {
      setSaving(s => ({ ...s, [product.id]: false }));
    }
  };

  const stockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Out of Stock', cls: 'bg-red-50 text-red-600 border-red-200' };
    if (stock <= 3) return { label: 'Low Stock', cls: 'bg-amber-50 text-amber-600 border-amber-200' };
    return { label: 'In Stock', cls: 'bg-green-50 text-green-600 border-green-200' };
  };

  const outOfStock = products.filter(p => p.stock === 0).length;
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 3).length;
  const inStock = products.filter(p => p.stock > 3).length;

  return (
    <div>
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'In Stock', count: inStock, cls: 'border-green-200 bg-green-50' },
          { label: 'Low Stock', count: lowStock, cls: 'border-amber-200 bg-amber-50' },
          { label: 'Out of Stock', count: outOfStock, cls: 'border-red-200 bg-red-50' },
        ].map(card => (
          <div key={card.label} className={`border-2 p-4 ${card.cls}`}>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">{card.label}</p>
            <p className="text-3xl font-black">{card.count}</p>
          </div>
        ))}
      </div>

      {/* Stock table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-gray-50 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {products.map(p => {
            const status = stockStatus(p.stock);
            const currentVal = updates[p.id] ?? String(p.stock);
            const isDirty = currentVal !== String(p.stock);

            return (
              <div key={p.id} className="flex items-center gap-3 border border-gray-100 px-4 py-3 hover:border-gray-200 transition-colors">
                {/* Image */}
                <div className="relative w-10 h-10 shrink-0 bg-gray-100">
                  {p.images?.[0] && <Image src={p.images[0]} alt="" fill className="object-cover" sizes="40px" />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide truncate">{p.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{p.category_name || p.category} · {formatMK(p.price)}</p>
                </div>

                {/* Status badge */}
                <span className={`hidden sm:inline text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border rounded-full ${status.cls}`}>
                  {status.label}
                </span>

                {/* Stock input */}
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={currentVal}
                    onChange={e => setUpdates(u => ({ ...u, [p.id]: e.target.value }))}
                    className="w-16 text-center border border-gray-200 py-1.5 text-sm font-bold focus:outline-none focus:border-accent bg-gray-50"
                  />
                  <button
                    onClick={() => handleStockUpdate(p)}
                    disabled={saving[p.id] || !isDirty}
                    className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 transition-colors ${
                      isDirty && !saving[p.id]
                        ? 'bg-accent text-white hover:bg-accent-dark'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {saving[p.id] ? '…' : 'Save'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
