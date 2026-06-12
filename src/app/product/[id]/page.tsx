'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, ChevronLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { getProductById, getProducts } from '@/lib/supabase';
import { useCart } from '@/context/CartContext';
import { Product } from '@/lib/types';
import { formatMK } from '@/components/ProductCard';
import toast from 'react-hot-toast';

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    async function load() {
      try {
        const p = await getProductById(id);
        setProduct(p);
        const rel = await getProducts(p.category);
        setRelated(rel.filter((r: Product) => r.id !== id).slice(0, 4));
      } catch {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-2 gap-10">
            <div className="aspect-square bg-gray-100 animate-pulse" />
            <div className="space-y-4">
              <div className="h-8 bg-gray-100 rounded animate-pulse w-2/3" />
              <div className="h-6 bg-gray-100 rounded animate-pulse w-1/3" />
              <div className="h-20 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!product) return notFound();

  const images =
    product.images?.length > 0
      ? product.images
      : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'];

  const handleAddToCart = () => {
    addItem(product, quantity);
    toast.success(`${product.name} added to cart`);
  };

  return (
    <>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <Link
          href="/shop"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-accent uppercase tracking-widest mb-8 transition-colors"
        >
          <ChevronLeft size={14} />
          Back to collection
        </Link>

        <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
          {/* Image gallery */}
          <div>
            <div className="w-full aspect-square bg-gray-50 relative overflow-hidden">
              <img
                src={images[activeImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {product.stock === 0 && (
                <div className="absolute inset-0 bg-white/75 flex items-center justify-center z-10">
                  <span className="text-sm font-bold uppercase tracking-widest text-gray-500">Sold Out</span>
                </div>
              )}
              {/* Thumbnails overlaid on image */}
              {images.length > 1 && (
                <div className="absolute bottom-2 left-2 right-2 flex gap-1 overflow-x-auto no-scrollbar">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`w-9 h-9 shrink-0 overflow-hidden border-2 transition-colors ${
                        i === activeImage ? 'border-white' : 'border-white/50'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product info */}
          <div className="flex flex-col">
            {product.brand && (
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                {product.brand}
              </p>
            )}
            <h1 className="text-3xl font-black uppercase tracking-tight mb-3 leading-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl font-black text-mk">{formatMK(product.price)}</span>
              {product.stock > 0 && product.stock <= 3 && (
                <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded">
                  Only {product.stock} left
                </span>
              )}
              {product.stock === 0 && (
                <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded">
                  Out of stock
                </span>
              )}
            </div>

            {product.description && (
              <p className="text-sm text-gray-600 leading-relaxed mb-6 border-t border-gray-100 pt-5">
                {product.description}
              </p>
            )}

            <div className="space-y-4 mt-auto">
              {product.stock > 0 && (
                <>
                  {/* Quantity */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 w-20">
                      Quantity
                    </span>
                    <div className="flex items-center border border-gray-200">
                      <button
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors text-lg leading-none"
                      >
                        −
                      </button>
                      <span className="w-10 text-center text-sm font-medium">{quantity}</span>
                      <button
                        onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                        className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors text-lg leading-none"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={handleAddToCart}
                    className="w-full flex items-center justify-center gap-2.5 bg-black text-white py-3.5 font-bold text-xs tracking-widest uppercase hover:bg-charcoal transition-colors"
                  >
                    <ShoppingBag size={16} />
                    Add to Cart
                  </button>
                </>
              )}

              {/* Category */}
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-400 uppercase tracking-wider">Category:</span>
                <Link
                  href={`/shop?category=${product.category}`}
                  className="text-xs font-semibold uppercase tracking-wider text-accent hover:underline capitalize"
                >
                  {product.category}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <section className="mt-20">
            <div className="accent-line">
              <h2 className="text-2xl font-black uppercase tracking-tight mb-8">
                You Might Also Like
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {related.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}
