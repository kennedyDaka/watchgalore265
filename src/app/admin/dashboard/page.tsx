'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { LogOut, KeyRound, Eye, EyeOff } from 'lucide-react';
import { supabase, getCategories } from '@/lib/supabase';
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
  const [navCategories, setNavCategories] = useState<{ slug: string; name: string }[]>([]);
  const [showPwChange, setShowPwChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setAdminEmail(data.user.email);
    });
    getCategories().then(setNavCategories).catch(e => console.error('Failed to load nav categories:', e));
  }, []);

  const handleSignOut = async () => {
    setSigning(true);
    await supabase.auth.signOut();
    window.location.href = '/admin/login';
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (newPassword.length < 6) {
      setPwError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('Passwords do not match.');
      return;
    }
    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwLoading(false);
    if (error) {
      setPwError(error.message);
    } else {
      setPwSuccess('Password updated successfully.');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => { setShowPwChange(false); setPwSuccess(''); }, 1500);
    }
  };

  return (
    <>
      {/* ─── Header (matches screenshot) ─────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <Image src="/logo.jpg" alt="WatchGalore265" width={60} height={60} className="object-contain" />
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
                ...navCategories.map(c => ({
                  href: `/shop?category=${encodeURIComponent(c.slug)}`,
                  label: c.name.toUpperCase(),
                })),
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 min-h-screen">
        {/* ─── Page title ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="accent-line">
            <h1 className="text-xl sm:text-3xl font-black uppercase tracking-tight leading-tight">Admin</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowPwChange(true)}
              className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-200 text-[10px] sm:text-xs font-bold uppercase tracking-widest hover:border-gray-400 hover:text-accent transition-colors rounded"
            >
              <KeyRound size={13} />
              <span className="hidden sm:inline">Change Password</span>
            </button>
            <button
              onClick={handleSignOut}
              disabled={signing}
              className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-200 text-[10px] sm:text-xs font-bold uppercase tracking-widest hover:border-gray-400 hover:text-red-500 transition-colors rounded"
            >
              <LogOut size={13} />
              {signing ? '…' : 'Sign Out'}
            </button>
          </div>
        </div>
        {adminEmail && <p className="text-xs text-gray-400 -mt-4 mb-6">{adminEmail}</p>}

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

      {showPwChange && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={() => { setShowPwChange(false); setPwError(''); setPwSuccess(''); }}>
          <div className="bg-white w-full max-w-sm p-6 shadow-lg" onClick={e => e.stopPropagation()}>
            <h2 className="text-sm font-black uppercase tracking-widest mb-5">Change Password</h2>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {pwError && <div className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2">{pwError}</div>}
              {pwSuccess && <div className="text-xs text-green-600 bg-green-50 border border-green-200 px-3 py-2">{pwSuccess}</div>}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3 pr-11 border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-accent focus:bg-white transition-colors"
                  />
                  <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-accent focus:bg-white transition-colors"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowPwChange(false); setPwError(''); setPwSuccess(''); }} className="flex-1 py-3 border border-gray-200 text-xs font-bold uppercase tracking-widest hover:border-gray-400 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={pwLoading} className="flex-1 py-3 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-charcoal transition-colors disabled:opacity-60">
                  {pwLoading ? 'Updating…' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
