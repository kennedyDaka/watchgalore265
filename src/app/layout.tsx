import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: {
    default: 'WatchGalore265 — Premium Watches, Wallets & Belts in Malawi',
    template: '%s | WatchGalore265',
  },
  description: "Malawi's home for premium watches, wallets and belts. Shop top brands, order via WhatsApp, and enjoy fast delivery. WatchGalore265 — Timeless Style. Delivered.",
  keywords: 'watches, wallets, belts, Malawi, luxury accessories, WatchGalore265, men accessories, premium watches Malawi, Lilongwe watches',
  authors: [{ name: 'WatchGalore265' }],
  creator: 'WatchGalore265',
  metadataBase: new URL('https://watchgalore265.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'WatchGalore265 — Premium Watches, Wallets & Belts',
    description: "Malawi's home for premium watches, wallets and belts. Shop now via WhatsApp.",
    url: 'https://watchgalore265.com',
    siteName: 'WatchGalore265',
    images: [
      {
        url: 'https://res.cloudinary.com/dcipvrt6c/image/fetch/w_1200,h_630,c_fill,q_auto,f_auto/https://watchgalore265.com/logo.jpg',
        width: 1200,
        height: 630,
        alt: 'WatchGalore265',
      },
    ],
    locale: 'en_MW',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WatchGalore265 — Premium Watches, Wallets & Belts',
    description: "Malawi's home for premium watches, wallets and belts.",
    images: ['https://res.cloudinary.com/dcipvrt6c/image/fetch/w_1200,h_630,c_fill,q_auto,f_auto/https://watchgalore265.com/logo.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {},
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          {children}
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        </CartProvider>
      </body>
    </html>
  );
}
