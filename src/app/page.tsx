import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import ProductCard from '@/components/ProductCard';
import { getFeaturedProducts, getCategories, getSiteContent } from '@/lib/supabase';
import { ShieldCheck, Truck, Star, Headphones } from 'lucide-react';

export const dynamic = 'force-dynamic';

const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
  watches: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
  wallets: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&q=80',
  belts: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80',
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  watches: 'Precision crafted timepieces',
  wallets: 'Premium leather wallets',
  belts: 'Classic and contemporary belts',
};

const DEFAULT_TRUST = [
  { title: 'Same-Day Delivery', desc: 'Available in Lilongwe. Order before 2PM.' },
  { title: 'Authenticity Guaranteed', desc: '100% genuine products. No counterfeits.' },
  { title: 'WhatsApp Support', desc: 'Chat with us anytime for order support.' },
];

const TRUST_ICONS = [Truck, ShieldCheck, Headphones];

export default async function HomePage() {
  let featuredProducts: Awaited<ReturnType<typeof getFeaturedProducts>> = [];
  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  let content: Record<string, unknown> = {};
  try {
    [featuredProducts, categories, content] = await Promise.all([
      getFeaturedProducts(),
      getCategories(),
      getSiteContent(),
    ]);
  } catch {}

  // Parse site content with safe defaults
  const hero = (content.hero || {}) as Record<string, string>;
  const promo = (content.promo_banner || {}) as Record<string, string[]>;
  const trust = ((content.trust || {}) as Record<string, unknown[]>).items || DEFAULT_TRUST;
  const testimonials = ((content.testimonials || {}) as Record<string, unknown[]>).items || [];
  const cta = (content.cta || {}) as Record<string, string>;

  const heroBadge = hero.badge || 'Free Same-Day Delivery in Lilongwe';
  const heroHeading = hero.heading || 'Wear Time. Define Style.';
  const heroSubtitle = hero.subtitle || 'Hand-picked watches, wallets and belts for the modern Malawian gentleman. Order in minutes via WhatsApp.';
  const heroBgImage = (hero.bgImage || 'https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=1800&q=80') + (hero.bgImage ? `?v=${(content._updatedAt as string) || ''}` : '');
  const promoItems = promo.items || ['Free Same-Day Delivery in Lilongwe', 'Premium Quality Guaranteed', 'Secure WhatsApp Checkout', 'Authentic Products Only'];
  const ctaHeading = cta.heading || 'Ready to Elevate Your Style?';
  const ctaSubtitle = cta.subtitle || 'Browse our collection and place your order directly on WhatsApp in minutes.';
  const catImages = (content.category_images || {}) as Record<string, string>;

  return (
    <>
      <Navbar />

      {/* ─── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-charcoal">
        <div className="absolute inset-0">
          <Image
            src={heroBgImage}
            alt="Luxury watches"
            fill
            className="object-cover opacity-40"
            priority
          />
        </div>

        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          {heroBadge && (
            <div className="inline-flex items-center gap-2 bg-accent/20 border border-accent/40 text-white text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
              {heroBadge}
            </div>
          )}

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight text-white mb-6 leading-[0.95]">
            {heroHeading.split('.').map((part, i) => {
              const trimmed = part.trim();
              if (!trimmed) return null;
              return (
                <span key={i}>
                  {i > 0 && <><br /></>}
                  {trimmed}
                  {heroHeading.includes('.') ? '.' : ''}
                  {i === 0 && ' '}
                </span>
              );
            })}
          </h1>

          <p className="text-base sm:text-lg text-gray-300 mb-10 max-w-xl mx-auto leading-relaxed">
            {heroSubtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/shop"
              className="px-8 py-3.5 bg-white text-black font-bold text-sm tracking-widest uppercase hover:bg-gray-100 transition-colors w-full sm:w-auto text-center"
            >
              Shop Now
            </Link>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/40">
          <div className="w-px h-10 bg-gradient-to-b from-white/0 to-white/40 animate-pulse"></div>
        </div>
      </section>

      {/* ─── Promo Banner ──────────────────────────────────────────────── */}
      {promoItems.length > 0 && (
        <section className="bg-accent text-white py-3 overflow-hidden">
          <div className="flex animate-[marquee_25s_linear_infinite] whitespace-nowrap gap-10 text-xs font-semibold tracking-widest uppercase">
            {Array.from({ length: 4 }).map((_, i) => (
              <span key={i} className="flex items-center gap-10">
                {promoItems.map((item, j) => (
                  <span key={j} className="flex items-center gap-10">
                    <span>{item}</span>
                    {j < promoItems.length - 1 && <span className="text-white/50">✦</span>}
                  </span>
                ))}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ─── Categories ────────────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="accent-line">
            <h2 className="text-3xl font-black uppercase tracking-tight mb-1">The Collection</h2>
            <p className="text-gray-500 text-sm mb-10">Explore our curated categories</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {categories.map(cat => (
              <Link
                key={cat.id}
                href={`/shop?category=${cat.slug}`}
                className="relative group overflow-hidden aspect-[4/3] bg-gray-100"
              >
                <Image
                  src={(catImages[cat.slug] || DEFAULT_CATEGORY_IMAGES[cat.slug] || DEFAULT_CATEGORY_IMAGES.watches) + (catImages[cat.slug] ? `?v=${(content._updatedAt as string) || ''}` : '')}
                  alt={cat.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6">
                  <p className="text-white text-xl font-black uppercase tracking-wide">{cat.name}</p>
                  <p className="text-white/70 text-xs mt-1">{CATEGORY_DESCRIPTIONS[cat.slug] || cat.name}</p>
                </div>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="bg-white text-black text-[10px] font-bold uppercase tracking-widest px-3 py-1.5">
                    Shop →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ─── Featured Products ──────────────────────────────────────────── */}
      {featuredProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20">
          <div className="accent-line">
            <h2 className="text-3xl font-black uppercase tracking-tight mb-1">Featured Pieces</h2>
            <p className="text-gray-500 text-sm mb-10">Hand-picked for the discerning gentleman</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/shop"
              className="inline-block border border-black text-black font-bold text-xs tracking-widest uppercase px-10 py-3.5 hover:bg-black hover:text-white transition-colors"
            >
              View All Products
            </Link>
          </div>
        </section>
      )}

      {/* ─── Trust Indicators ──────────────────────────────────────────── */}
      <section className="bg-gray-50 py-12 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {(trust as TrustItem[]).map((item, i) => {
              const Icon = TRUST_ICONS[i] || ShieldCheck;
              return (
                <div key={i} className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <Icon size={22} className="text-accent" />
                  </div>
                  <h3 className="font-bold text-sm uppercase tracking-wide">{item.title}</h3>
                  <p className="text-xs text-gray-500 max-w-xs">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ──────────────────────────────────────────────── */}
      {testimonials.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="accent-line">
            <h2 className="text-3xl font-black uppercase tracking-tight mb-1">Customer Reviews</h2>
            <p className="text-gray-500 text-sm mb-10">What our customers say</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(testimonials as TestimonialItem[]).map((t, i) => (
              <div key={i} className="border border-gray-100 p-6 hover:border-accent/30 transition-colors">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars || 5 }).map((_, j) => (
                    <Star key={j} size={14} fill="#2563EB" color="#2563EB" />
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.location}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── CTA Banner ────────────────────────────────────────────────── */}
      <section className="bg-charcoal text-white py-14 sm:py-16 text-center">
        <div className="max-w-xl mx-auto px-4">
          <h2 className="text-3xl font-black uppercase tracking-tight mb-3">
            {ctaHeading}
          </h2>
          <p className="text-gray-400 text-sm mb-8">
            {ctaSubtitle}
          </p>
          <div className="flex justify-center">
            <Link href="/shop" className="px-8 py-3.5 bg-white text-black font-bold text-xs tracking-widest uppercase hover:bg-gray-100 transition-colors">
              Browse Collection
            </Link>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </>
  );
}

interface TrustItem {
  title: string;
  desc: string;
}

interface TestimonialItem {
  name: string;
  location: string;
  text: string;
  stars: number;
}
