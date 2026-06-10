'use client';

import { useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError('Invalid credentials. Please try again.');
      setLoading(false);
    } else {
      window.location.href = '/admin/dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <Image src="/logo.jpg" alt="WatchGalore265" width={60} height={60} className="object-contain" />
          </div>
          <div className="text-xl font-black uppercase tracking-tight">
            WATCHGALORE<span className="text-accent">265</span>
          </div>
          <p className="text-xs text-gray-400 tracking-widest uppercase mt-1">Admin Portal</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white border border-gray-100 p-8 shadow-sm space-y-5">
          <h1 className="text-lg font-black uppercase tracking-tight mb-1">Sign In</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2.5 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@watchgalore265.com"
              required
              className="w-full px-4 py-3 border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-accent focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 pr-11 border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-accent focus:bg-white transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white font-bold text-xs tracking-widest uppercase py-3.5 hover:bg-charcoal transition-colors disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Powered by{' '}
          <span className="font-semibold text-gray-500">Operon Systems</span>
        </p>
      </div>
    </div>
  );
}
