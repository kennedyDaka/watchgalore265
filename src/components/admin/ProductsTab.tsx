'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Plus, Pencil, Trash2, X, Upload, Star, RefreshCw, Copy } from 'lucide-react';
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  appendProductImage,
  createDraftProduct,
  splitProductImages,
  getCategories,
} from '@/lib/supabase';
import { Product, Category } from '@/lib/types';
import { formatMK } from '@/components/ProductCard';
import toast from 'react-hot-toast';

interface DbCategory {
  id: string;
  slug: string;
  name: string;
}

const EMPTY_FORM = {
  name: '',
  description: '',
  category: '' as Category,
  price: '',
  brand: '',
  stock: '',
  featured: false,
  colors: '' as string,
};

type FormState = typeof EMPTY_FORM;

function ProductModal({
  product,
  onClose,
  onSaved,
  categories,
}: {
  product?: Product | null;
  onClose: () => void;
  onSaved: () => void;
  categories: DbCategory[];
}) {
  const [form, setForm] = useState<FormState>(
    product
      ? {
          name: product.name,
          description: product.description,
          category: product.category,
          price: String(product.price),
          brand: product.brand || '',
          stock: String(product.stock),
          featured: product.featured,
          colors: (product.colors || []).join(', '),
        }
      : EMPTY_FORM
  );
  const [images, setImages] = useState<string[]>(product?.images || []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Map<string, string>>(new Map());

  // Reset draft and failures when the modal opens for a different product
  useEffect(() => { setDraftId(null); setFailedImages(new Map()); }, [product]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Ensure we have a real product ID to attach images to
    let targetId = product?.id || draftId;
    if (!targetId) {
      try {
        const draft = await createDraftProduct({
          name: form.name.trim() || 'Untitled',
          category: form.category || undefined,
          price: form.price ? Number(form.price) : undefined,
          stock: form.stock ? Number(form.stock) : undefined,
        });
        targetId = draft.id;
        setDraftId(draft.id);
      } catch {
        toast.error('Could not create draft product');
        return;
      }
    }

    setUploading(true);

    for (const file of files) {
      let url: string;
      try {
        url = await uploadProductImage(file, targetId);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Upload failed';
        toast.error(msg);
        continue;
      }

      // Cloudinary succeeded — persist to DB immediately
      try {
        await appendProductImage(targetId!, url);
        setImages(prev => [...prev, url]);
        setFailedImages(prev => { const m = new Map(prev); m.delete(url); return m; });
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to save image';
        setFailedImages(prev => new Map(prev).set(url, msg));
        toast.error(`Uploaded but DB save failed: ${msg}`);
      }
    }

    setUploading(false);
  };

  const handleRetryImage = async (url: string) => {
    const targetId = product?.id || draftId;
    if (!targetId) return;
    try {
      await appendProductImage(targetId, url);
      setImages(prev => [...prev, url]);
      setFailedImages(prev => { const m = new Map(prev); m.delete(url); return m; });
      toast.success('Image saved');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Retry failed';
      setFailedImages(prev => new Map(prev).set(url, msg));
      toast.error(msg);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.price || !form.stock || !form.category) {
      toast.error('Name, price, stock and category are required');
      return;
    }
    setSaving(true);
    try {
      const data = {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        price: Number(form.price),
        brand: form.brand.trim() || null,
        stock: Number(form.stock),
        featured: form.featured,
        images,
        colors: form.colors ? form.colors.split(',').map(c => c.trim()).filter(Boolean) : [],
      };
      if (product) {
        await updateProduct(product.id, data);
        toast.success('Product updated');
      } else if (draftId) {
        // Draft was auto-created when images were uploaded — update it
        await updateProduct(draftId, data);
        toast.success('Product created');
      } else {
        await createProduct(data);
        toast.success('Product created');
      }
      onSaved();
      onClose();
    } catch {
      toast.error('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const set = (key: keyof FormState, value: string | boolean) =>
    setForm(f => ({ ...f, [key]: value }));

  return (
    <div className="fixed inset-0 z-50 flex sm:items-start sm:justify-center sm:bg-black/40 sm:overflow-y-auto sm:py-8 sm:px-4 bg-white sm:bg-transparent">
      <div className="bg-white w-full sm:max-w-xl sm:shadow-xl min-h-screen sm:min-h-0 sm:my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-black uppercase tracking-widest">
            {product ? 'Edit Product' : 'Add Product'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Name */}
          <Field label="Product Name *">
            <input
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. Black Chronograph Watch"
              className="input-base"
            />
          </Field>

          {/* Brand + Category */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Brand">
              <input value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="e.g. Rolex" className="input-base" />
            </Field>
            <Field label="Category *">
              <select value={form.category} onChange={e => set('category', e.target.value as Category)} className="input-base capitalize">
                <option value="" disabled>Select a category</option>
                {categories.map(c => <option key={c.id} value={c.slug} className="capitalize">{c.name}</option>)}
              </select>
            </Field>
          </div>

          {/* Price + Stock */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price (MK) *">
              <input type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="e.g. 85000" className="input-base" min="0" />
            </Field>
            <Field label="Stock Qty *">
              <input type="number" value={form.stock} onChange={e => set('stock', e.target.value)} placeholder="e.g. 5" className="input-base" min="0" />
            </Field>
          </div>

          {/* Description */}
          <Field label="Description">
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Product description…"
              rows={3}
              className="input-base resize-none"
            />
          </Field>

          {/* Colors */}
          <Field label="Colors (comma-separated)">
            <input
              value={form.colors}
              onChange={e => set('colors', e.target.value)}
              placeholder="e.g. Black, Silver, Gold"
              className="input-base"
            />
          </Field>

          {/* Featured */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={e => set('featured', e.target.checked)}
                      className="w-4 h-4 accent-accent"
            />
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
              Featured product (shown on homepage)
            </span>
            <Star size={13} className={form.featured ? 'text-accent fill-accent' : 'text-gray-300'} />
          </label>

          {/* Images */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Images
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {/* Successfully saved images */}
              {images.map((img, i) => (
                <div key={i} className="relative w-16 h-16 group">
                  <Image src={img} alt="" fill className="object-cover" sizes="64px" />
                  <button
                    onClick={() => setImages(imgs => imgs.filter((_, idx) => idx !== i))}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
              {/* Failed DB saves — retry button */}
              {Array.from(failedImages.entries()).map(([url, errorMsg]) => (
                <div key={url} className="relative w-16 h-16 border-2 border-red-400">
                  <Image src={url} alt="" fill className="object-cover" sizes="64px" />
                  <button
                    onClick={() => handleRetryImage(url)}
                    className="absolute inset-0 bg-red-500/60 flex items-center justify-center hover:bg-red-500/80 transition-colors"
                    title={errorMsg}
                  >
                    <RefreshCw size={16} className="text-white" />
                  </button>
                </div>
              ))}
              <label className={`w-16 h-16 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-accent transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <Upload size={14} className="text-gray-400 mb-0.5" />
                <span className="text-[9px] text-gray-400 uppercase">Upload</span>
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
            {uploading && <p className="text-xs text-accent">Uploading images…</p>}
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-3 border border-gray-200 text-xs font-bold uppercase tracking-widest hover:border-gray-400 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-charcoal transition-colors disabled:opacity-60"
          >
            {saving ? 'Saving…' : product ? 'Update Product' : 'Add Product'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .input-base {
          width: 100%;
          padding: 0.625rem 0.875rem;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.15s;
        }
        .input-base:focus {
          border-color: #2563eb;
          background: white;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function SplitModal({
  product,
  onClose,
  onSaved,
  categories,
}: {
  product: Product;
  onClose: () => void;
  onSaved: () => void;
  categories: DbCategory[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [name, setName] = useState(product.name + ' (Split)');
  const [category, setCategory] = useState(product.category);
  const [price, setPrice] = useState(String(product.price));
  const [stock, setStock] = useState(String(product.stock));
  const [colors, setColors] = useState((product.colors || []).join(', '));
  const [splitting, setSplitting] = useState(false);

  const toggleImage = (url: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url); else next.add(url);
      return next;
    });
  };

  const handleSplit = async () => {
    if (selected.size === 0) { toast.error('Select at least one image'); return; }
    if (!name.trim() || !price || !stock || !category) {
      toast.error('Name, price, stock and category are required');
      return;
    }
    setSplitting(true);
    try {
      await splitProductImages(
        product.id,
        Array.from(selected),
        {
          name: name.trim(),
          description: '',
          category,
          price: Number(price),
          stock: Number(stock),
          featured: false,
          colors: colors ? colors.split(',').map(c => c.trim()).filter(Boolean) : [],
        }
      );
      toast.success(`Split into "${name.trim()}"`);
      onSaved();
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Split failed';
      toast.error(msg);
    } finally {
      setSplitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex sm:items-start sm:justify-center sm:bg-black/40 sm:overflow-y-auto sm:py-8 sm:px-4 bg-white sm:bg-transparent">
      <div className="bg-white w-full sm:max-w-xl sm:shadow-xl min-h-screen sm:min-h-0 sm:my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-black uppercase tracking-widest">Split Product</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-gray-500">
            Select images to move into a new product from <strong className="text-gray-800">{product.name}</strong>.
          </p>

          {/* Image grid with checkboxes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Select images to split ({selected.size} of {product.images.length})
            </label>
            <div className="flex flex-wrap gap-2">
              {product.images.map((img, i) => {
                const isSelected = selected.has(img);
                return (
                  <button
                    key={i}
                    onClick={() => toggleImage(img)}
                    className={`relative w-16 h-16 overflow-hidden border-2 transition-all ${
                      isSelected ? 'border-accent ring-1 ring-accent' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <Image src={img} alt="" fill className="object-cover" sizes="64px" />
                    {isSelected && (
                      <div className="absolute inset-0 bg-accent/20 flex items-center justify-center">
                        <span className="w-5 h-5 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center">✓</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* New product details */}
          <Field label="New Product Name *">
            <input value={name} onChange={e => setName(e.target.value)} className="input-base" placeholder="e.g. Premium Belts" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category *">
              <select value={category} onChange={e => setCategory(e.target.value)} className="input-base capitalize">
                <option value="" disabled>Select</option>
                {categories.map(c => <option key={c.id} value={c.slug} className="capitalize">{c.name}</option>)}
              </select>
            </Field>
            <Field label="Price (MK) *">
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="input-base" min="0" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Stock Qty *">
              <input type="number" value={stock} onChange={e => setStock(e.target.value)} className="input-base" min="0" />
            </Field>
            <Field label="Colors (comma-sep)">
              <input value={colors} onChange={e => setColors(e.target.value)} className="input-base" placeholder="Black, Brown" />
            </Field>
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-3 border border-gray-200 text-xs font-bold uppercase tracking-widest hover:border-gray-400 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSplit}
            disabled={splitting || selected.size === 0}
            className="flex-1 py-3 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-charcoal transition-colors disabled:opacity-60"
          >
            {splitting ? 'Splitting…' : `Split ${selected.size} Image(s)`}
          </button>
        </div>
      </div>

      <style jsx>{`
        .input-base {
          width: 100%;
          padding: 0.625rem 0.875rem;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.15s;
        }
        .input-base:focus {
          border-color: #2563eb;
          background: white;
        }
      `}</style>
    </div>
  );
}

export default function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | Category>('all');
  const [modalProduct, setModalProduct] = useState<Product | null | undefined>(undefined);
  const [splitProduct, setSplitProduct] = useState<Product | null>(null);
  const [dbCategories, setDbCategories] = useState<DbCategory[]>([]);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const [data, cats] = await Promise.all([getAllProducts(), getCategories()]);
      setProducts(data || []);
      setDbCategories(cats || []);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleDelete = async (product: Product) => {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await deleteProduct(product.id);
      toast.success('Product deleted');
      fetch();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to delete product';
      toast.error(msg);
    }
  };

  const filtered = products.filter(p => {
    const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.brand || '').toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="text"
          placeholder="Search products…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-4 py-2.5 border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-accent"
        />
        <div className="flex gap-2 flex-wrap">
          {(['all', ...dbCategories.map(c => c.slug)] as const).map(c => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`px-3 py-2 text-xs font-bold uppercase tracking-wider border transition-all ${
                categoryFilter === c ? 'bg-accent border-accent text-white' : 'border-gray-200 text-gray-600 hover:border-accent'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <button
          onClick={() => setModalProduct(null)}
          className="flex items-center gap-2 px-5 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-charcoal transition-colors shrink-0"
        >
          <Plus size={14} />
          Add Product
        </button>
      </div>

      {/* Product table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-gray-50 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <p className="text-sm uppercase tracking-widest">No products found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-widest text-gray-400 w-14"></th>
                <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Name</th>
                <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-widest text-gray-400 hidden sm:table-cell">Category</th>
                <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Price</th>
                <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-widest text-gray-400 hidden md:table-cell">Stock</th>
                <th className="py-3 px-3 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-3">
                    <div className="relative w-10 h-10 bg-gray-100">
                      {p.images?.[0] ? (
                        <>
                          <Image src={p.images[0]} alt="" fill className="object-cover" sizes="40px" />
                          {p.images.length > 1 && (
                            <span className="absolute -bottom-1 -right-1 bg-black text-white text-[8px] font-bold px-1 leading-4 rounded-full">
                              +{p.images.length - 1}
                            </span>
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full bg-gray-100" />
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs uppercase tracking-wide">{p.name}</span>
                      {p.featured && <Star size={11} className="text-accent fill-accent" />}
                    </div>
                    {p.brand && <span className="text-xs text-gray-400">{p.brand}</span>}
                  </td>
                  <td className="py-3 px-3 hidden sm:table-cell">
                    <span className="text-xs text-gray-500 capitalize">{p.category}</span>
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-xs">{formatMK(p.price)}</td>
                  <td className="py-3 px-3 text-right hidden md:table-cell">
                    <span className={`text-xs font-semibold ${p.stock === 0 ? 'text-red-500' : p.stock <= 3 ? 'text-amber-500' : 'text-gray-600'}`}>
                      {p.stock === 0 ? 'Out of stock' : p.stock}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setSplitProduct(p)}
                        className="p-1.5 text-gray-400 hover:text-purple-500 transition-colors"
                        title="Split images into new product"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        onClick={() => setModalProduct(p)}
                        className="p-1.5 text-gray-400 hover:text-accent transition-colors"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit / Add Modal */}
      {modalProduct !== undefined && (
        <ProductModal
          product={modalProduct}
          onClose={() => setModalProduct(undefined)}
          onSaved={fetch}
          categories={dbCategories}
        />
      )}

      {/* Split Modal */}
      {splitProduct && (
        <SplitModal
          product={splitProduct}
          onClose={() => setSplitProduct(null)}
          onSaved={fetch}
          categories={dbCategories}
        />
      )}
    </div>
  );
}
