import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import ProductCard from '@/components/ProductCard';
import HomeSections from '@/components/HomeSections';
import { getFeaturedProducts, getCategories, getSiteContent } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let featuredProducts: Awaited<ReturnType<typeof getFeaturedProducts>> = [];
  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  let siteContent: Record<string, unknown> = {};
  try {
    [featuredProducts, categories, siteContent] = await Promise.all([
      getFeaturedProducts(),
      getCategories(),
      getSiteContent(),
    ]);
  } catch {}

  return (
    <>
      <Navbar />

      <HomeSections categories={categories} initialContent={siteContent as Record<string, unknown>} />

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

      <Footer />
      <WhatsAppButton />
    </>
  );
}
