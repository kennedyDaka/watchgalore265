'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import OrdersTab from '@/components/admin/OrdersTab';
import ProductsTab from '@/components/admin/ProductsTab';
import StockTab from '@/components/admin/StockTab';
import PromotionsTab from '@/components/admin/PromotionsTab';
import CategoriesTab from '@/components/admin/CategoriesTab';
import Footer from '@/components/Footer';

type Tab = 'orders' | 'products' | 'stock' | 'promotions' | 'categories';

const TABS: { key: Tab; label: string }[] = [
  { key: 'orders', label: 'ORDERS' },
  { key: 'products', label: 'PRODUCTS' },
  { key: 'stock', label: 'STOCK' },
  { key: 'promotions', label: 'PROMOTIONS' },
  { key: 'categories', label: 'CATEGORIES' },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('orders');
  const [adminEmail, setAdminEmail] = useState('');
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setAdminEmail(data.user.email);
    });
  }, []);

  const handleSignOut = async () => {
    setSigning(true);
    await supabase.auth.signOut();
    window.location.href = '/admin/login';
  };

  return (
    <>
      {/* ─── Header (matches screenshot) ─────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <Image src="/logo.jpg" alt="WatchGalore265" width={44} height={44} className="object-contain" />
              <div className="leading-none">
                <div className="text-lg font-black tracking-tight uppercase">
                  WATCHGALORE<span className="text-accent">265</span>
                </div>
                <div className="text-[9px] tracking-widest text-gray-500 uppercase font-medium mt-0.5">
                  And Other Men&apos;s Essentials
                </div>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              {[
                { href: '/shop', label: 'SHOP' },
                { href: '/shop?category=watches', label: 'WATCHES' },
                { href: '/shop?category=wallets', label: 'WALLETS' },
                { href: '/shop?category=belts', label: 'BELTS' },
              ].map(l => (
                <Link
                  key={l.label}
                  href={l.href}
                  className="text-xs font-semibold tracking-widest uppercase text-gray-600 hover:text-accent transition-colors"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
        {/* ─── Page title ──────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
          <div className="accent-line">
            <h1 className="text-4xl font-black uppercase tracking-tight">Admin Dashboard</h1>
            <p className="text-sm text-gray-400 mt-1">{adminEmail}</p>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signing}
            className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-xs font-bold uppercase tracking-widest hover:border-gray-400 transition-colors shrink-0 self-start"
          >
            <LogOut size={14} />
            {signing ? 'Signing out…' : 'Sign Out'}
          </button>
        </div>

        {/* ─── Tab navigation (matches screenshot) ─────────────────────── */}
        <div className="border-b border-gray-200 mb-8 overflow-x-auto no-scrollbar">
          <div className="flex gap-0 min-w-max">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-3 text-xs font-bold tracking-widest uppercase border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-accent text-gray-900'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ─── Tab content ──────────────────────────────────────────────── */}
        <div className="animate-fadeIn">
          {activeTab === 'orders' && <OrdersTab />}
          {activeTab === 'products' && <ProductsTab />}
          {activeTab === 'stock' && <StockTab />}
          {activeTab === 'promotions' && <PromotionsTab />}
          {activeTab === 'categories' && <CategoriesTab />}
        </div>
      </main>

      <Footer />
    </>
  );
}
