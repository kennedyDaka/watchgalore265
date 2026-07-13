'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, SlidersHorizontal } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import ProductCard from '@/components/ProductCard';
import { getProducts, getCategories } from '@/lib/supabase';
import { Product } from '@/lib/types';

type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'popular';

interface Category {
  id: string;
  slug: string;
  name: string;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low–High' },
  { value: 'price_desc', label: 'Price: High–Low' },
  { value: 'popular', label: 'Popularity' },
];

export default function ShopPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(
    searchParams.get('category') || 'all'
  );
  const [sort, setSort] = useState<SortOption>('newest');
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    getCategories().then(setCategories).catch(e => console.error('Failed to load categories:', e));
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProducts(
        category === 'all' ? undefined : category,
        search || undefined,
        sort === 'newest' ? undefined : sort
      );
      setProducts(data || []);
    } catch (e) {
      console.error('Failed to fetch products:', e);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [category, search, sort]);

  useEffect(() => {
    const timer = setTimeout(fetchProducts, search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [fetchProducts, search]);

  // Sync category from URL params
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat && cat !== category) setCategory(cat);
  }, [searchParams]); // eslint-disable-line

  // Restore scroll position when coming back from a product
  useEffect(() => {
    if (loading) return;
    const saved = sessionStorage.getItem('shop_scroll');
    if (saved) {
      sessionStorage.removeItem('shop_scroll');
      requestAnimationFrame(() => window.scrollTo(0, Number(saved)));
    }
  }, [loading]);

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    const params = new URLSearchParams(searchParams.toString());
    if (cat === 'all') {
      params.delete('category');
    } else {
      params.set('category', cat);
    }
    router.replace(`/shop?${params.toString()}`, { scroll: false });
  };

  return (
    <>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 min-h-screen overflow-hidden">
        {/* Page header */}
        <div className="mb-6 sm:mb-8 accent-line">
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight mb-1">
            The Collection
          </h1>
          <p className="text-gray-500 text-sm">
            Hand-picked watches, wallets and belts for the modern gentleman.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-4 sm:mb-5">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search the collection..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-accent focus:bg-white transition-colors placeholder:text-gray-400"
          />
        </div>

        {/* Filters row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 sm:mb-6">
          {/* Category — dropdown on mobile, pills on desktop */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Mobile dropdown */}
            <div className="flex md:hidden items-center gap-2 w-full">
              <SlidersHorizontal size={14} className="text-gray-400 shrink-0" />
              <select
                value={category}
                onChange={e => handleCategoryChange(e.target.value)}
                className="text-sm border border-gray-200 py-1.5 px-2 focus:outline-none focus:border-accent bg-white text-gray-700 w-full"
              >
                <option value="all">ALL</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.name.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Desktop pills */}
            <div className="hidden md:flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleCategoryChange('all')}
                className={`px-4 py-1.5 text-xs font-bold tracking-widest uppercase border transition-all rounded-full ${
                  category === 'all'
                    ? 'bg-accent border-accent text-white'
                    : 'border-gray-300 text-gray-600 hover:border-accent hover:text-accent'
                }`}
              >
                ALL
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.slug)}
                  className={`px-4 py-1.5 text-xs font-bold tracking-widest uppercase border transition-all rounded-full ${
                    category === cat.slug
                      ? 'bg-accent border-accent text-white'
                      : 'border-gray-300 text-gray-600 hover:border-accent hover:text-accent'
                  }`}
                >
                  {cat.name.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 shrink-0">
            <SlidersHorizontal size={14} className="text-gray-400" />
            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortOption)}
              className="text-sm border border-gray-200 py-1.5 px-2 focus:outline-none focus:border-accent bg-white text-gray-700"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Product grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-gray-100 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-3/4 mb-1.5" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-gray-400 text-sm uppercase tracking-widest mb-2">
              Nothing found
            </p>
            <p className="text-gray-300 text-xs">
              Try a different category or clear your search
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 animate-fadeIn">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <Footer />
      <WhatsAppButton />
    </>
  );
}
