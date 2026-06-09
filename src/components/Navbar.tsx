'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Menu, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { getCategories } from '@/lib/supabase';

interface Category {
  id: string;
  slug: string;
  name: string;
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { totalItems } = useCart();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  const NAV_LINKS = [
    { href: '/shop', label: 'SHOP' },
    ...categories.map(c => ({
      href: `/shop?category=${c.slug}`,
      label: c.name.toUpperCase(),
    })),
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <Image
              src="/logo.jpg"
              alt="WatchGalore265 logo"
              width={40}
              height={40}
              className="object-contain"
              priority
            />
            <div className="leading-none">
              <div className="text-lg font-heading tracking-tight">
                WATCHGALORE
                <span className="text-accent">265</span>
              </div>
              <div className="text-[9px] tracking-widest text-gray-500 font-heading mt-0.5 hidden sm:block">
                And Other Men&apos;s Essentials
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(link => (
              <Link
                key={link.label}
                href={link.href}
                className={`text-sm font-heading tracking-widest transition-colors hover:text-accent ${
                  pathname === link.href.split('?')[0] && link.label === 'SHOP'
                    ? 'text-accent'
                    : 'text-gray-700'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right — Cart + Mobile menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/checkout"
              className="relative p-2.5 text-gray-700 hover:text-accent transition-colors"
              aria-label="Cart"
            >
              <ShoppingBag size={22} strokeWidth={1.75} />
              {totalItems > 0 && (
                <span className="absolute top-0.5 right-0.5 w-[18px] h-[18px] bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Link>

            {/* Mobile burger */}
            <button
              className="md:hidden p-2.5 text-gray-700"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <nav className="flex flex-col px-4 py-2 gap-0">
            {NAV_LINKS.map(link => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="py-3.5 text-sm font-semibold tracking-widest uppercase text-gray-700 border-b border-gray-50 hover:text-accent transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
