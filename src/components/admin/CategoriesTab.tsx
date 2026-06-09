'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { getCategories, createCategory, deleteCategory, getAllProducts } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  created_at: string;
  product_count: number;
}

export default function CategoriesTab() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newSlug, setNewSlug] = useState('');
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, products] = await Promise.all([getCategories(), getAllProducts()]);
      const counts: Record<string, number> = {};
      (products || []).forEach((p: { category: string }) => {
        counts[p.category] = (counts[p.category] || 0) + 1;
      });
      setCategories((cats || []).map((c: { id: string; slug: string; name: string; created_at: string }) => ({
        ...c,
        product_count: counts[c.slug] || 0,
      })));
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleAdd = async () => {
    if (!newSlug.trim() || !newName.trim()) {
      toast.error('Slug and name are required');
      return;
    }
    setSaving(true);
    try {
      await createCategory(newSlug.trim().toLowerCase(), newName.trim());
      toast.success('Category created');
      setNewSlug('');
      setNewName('');
      setShowAdd(false);
      fetch();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to create category';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: CategoryRow) => {
    if (cat.product_count > 0) {
      toast.error(`Cannot delete "${cat.name}" — it has ${cat.product_count} product(s). Remove them first.`);
      return;
    }
    if (!confirm(`Delete category "${cat.name}"? This cannot be undone.`)) return;
    try {
      await deleteCategory(cat.id);
      toast.success('Category deleted');
      fetch();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to delete category';
      toast.error(msg);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">
          {categories.length} categor{categories.length === 1 ? 'y' : 'ies'} total
        </p>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-charcoal transition-colors">
          <Plus size={14} /> Add Category
        </button>
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex sm:items-center sm:justify-center sm:bg-black/40 sm:px-4 bg-white sm:bg-transparent">
          <div className="bg-white w-full sm:max-w-md sm:shadow-xl min-h-screen sm:min-h-0">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-black uppercase tracking-widest">New Category</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Slug</label>
                <input value={newSlug} onChange={e => setNewSlug(e.target.value)} placeholder="e.g. sunglasses"
                  className="w-full px-4 py-2.5 border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-accent focus:bg-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Name</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Sunglasses"
                  className="w-full px-4 py-2.5 border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-accent focus:bg-white" />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 border border-gray-200 text-xs font-bold uppercase tracking-widest hover:border-gray-400">Cancel</button>
              <button onClick={handleAdd} disabled={saving}
                className="flex-1 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-charcoal disabled:opacity-60">
                {saving ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories table */}
      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-50 animate-pulse" />)}</div>
      ) : categories.length === 0 ? (
        <div className="py-16 text-center text-gray-400"><p className="text-sm uppercase tracking-widest">No categories yet</p></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Slug</th>
                <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Name</th>
                <th className="text-center py-3 px-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Products</th>
                <th className="py-3 px-3 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {categories.map(cat => (
                <tr key={cat.id} className="hover:bg-gray-50/50">
                  <td className="py-3 px-3 font-mono text-xs text-gray-500">{cat.slug}</td>
                  <td className="py-3 px-3 font-bold text-xs uppercase tracking-wide">{cat.name}</td>
                  <td className="py-3 px-3 text-center text-xs text-gray-500">{cat.product_count}</td>
                  <td className="py-3 px-3">
                    <button onClick={() => handleDelete(cat)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
