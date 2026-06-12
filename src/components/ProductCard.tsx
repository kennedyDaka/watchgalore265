'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { Product } from '@/lib/types';
import { useCart } from '@/context/CartContext';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
}

export function formatMK(amount: number): string {
  return `MK${amount.toLocaleString()}`;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product);
    toast.success(`${product.name} added to cart`);
  };

  const primaryImage =
    product.images?.[0] ||
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80';

  return (
    <Link href={`/product/${product.id}`} className="group block">
      {/* Image */}
      <div className="relative overflow-hidden bg-gray-50 aspect-square mb-3 w-full">
        <Image
          src={primaryImage}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-xs font-bold tracking-widest uppercase text-gray-500">
              Sold Out
            </span>
          </div>
        )}
        {/* Quick add */}
        {product.stock > 0 && (
          <button
            onClick={handleAddToCart}
            className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white shadow-md p-2 hover:bg-accent hover:text-white text-gray-700 rounded-sm"
            aria-label="Add to cart"
          >
            <ShoppingBag size={16} />
          </button>
        )}
      </div>

      {/* Info */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-wider text-gray-900 truncate leading-snug">
            {product.name}
          </p>
          {product.brand && (
            <p className="text-[11px] text-gray-400 uppercase tracking-wide mt-0.5">
              {product.brand}
            </p>
          )}
        </div>
        <p className="text-sm font-bold text-gray-900 shrink-0 text-mk">
          {formatMK(product.price)}
        </p>
      </div>
    </Link>
  );
}
