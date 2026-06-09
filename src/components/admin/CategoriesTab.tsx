'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAllProducts } from '@/lib/supabase';
import { Product } from '@/lib/types';
import { formatMK } from '@/components/ProductCard';
import { Watch, Wallet, Tag } from 'lucide-react';

const CATEGORY_META = [
  { key: 'watches', label: 'Watches', icon: Watch, desc: 'Timepieces for the modern gentleman' },
  { key: 'wallets', label: 'Wallets', icon: Wallet, desc: 'Premium leather and bifold wallets' },
  { key: 'belts', label: 'Belts', icon: Tag, desc: 'Classic and contemporary belts' },
] as const;

export default function CategoriesTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllProducts();
      setProducts(data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const statsFor = (cat: string) => {
    const items = products.filter(p => p.category === cat);
    const inStock = items.filter(p => p.stock > 0).length;
    const totalValue = items.reduce((s, p) => s + p.price * p.stock, 0);
    const avgPrice = items.length ? Math.round(items.reduce((s, p) => s + p.price, 0) / items.length) : 0;
    return { total: items.length, inStock, totalValue, avgPrice };
  };

  return (
    <div>
      <p className="text-sm text-gray-500 mb-6">
        Category overview. To add or edit categories, update the product&apos;s category field in the Products tab.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        {CATEGORY_META.map(cat => {
          const stats = statsFor(cat.key);
          const Icon = cat.icon;
          return (
            <div key={cat.key} className="border border-gray-100 p-6 hover:border-accent/30 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-accent/10 flex items-center justify-center">
                  <Icon size={20} className="text-accent" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wide">{cat.label}</h3>
                  <p className="text-xs text-gray-400">{cat.desc}</p>
                </div>
              </div>

              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-4 bg-gray-100 animate-pulse rounded" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total products</span>
                    <span className="font-bold">{stats.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">In stock</span>
                    <span className="font-bold">{stats.inStock}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Avg. price</span>
                    <span className="font-bold">{stats.avgPrice ? formatMK(stats.avgPrice) : '—'}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-100">
                    <span className="text-gray-400">Inventory value</span>
                    <span className="font-black">{stats.totalValue ? formatMK(stats.totalValue) : '—'}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
