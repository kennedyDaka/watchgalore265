import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import ProductCard from '@/components/ProductCard';
import HomeSections from '@/components/HomeSections';
import { getFeaturedProducts, getCategoriesWithProducts, getSiteContent, getCategoryProductImages } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let featuredProducts: Awaited<ReturnType<typeof getFeaturedProducts>> = [];
  let categories: Awaited<ReturnType<typeof getCategoriesWithProducts>> = [];
  let siteContent: Record<string, unknown> = {};
  let categoryProductImages: Record<string, string> = {};
  try {
    [featuredProducts, categories, siteContent, categoryProductImages] = await Promise.all([
      getFeaturedProducts(),
      getCategoriesWithProducts(),
      getSiteContent(),
      getCategoryProductImages(),
    ]);
  } catch {}

  return (
    <>
      <Navbar />

      <HomeSections categories={categories} initialContent={siteContent as Record<string, unknown>} categoryProductImages={categoryProductImages} />

      {/* ─── Featured Products ──────────────────────────────────────────── */}
      {featuredProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20">
          <div className="accent-line">
            <h2 className="text-3xl font-black uppercase tracking-tight mb-1">{(siteContent as any)?.sections?.featuredTitle || 'Featured Pieces'}</h2>
            <p className="text-gray-500 text-sm mb-10">{(siteContent as any)?.sections?.featuredSubtitle || 'Hand-picked for the discerning gentleman'}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {featuredProducts.map((product, i) => (
              <ProductCard key={product.id} product={product} priority={i < 4} />
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

      <Footer />
      <WhatsAppButton />
    </>
  );
}
