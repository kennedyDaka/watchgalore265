import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'WatchGalore265 — Premium Watches, Wallets & Belts',
  description: "Malawi's home for premium watches, wallets and belts. Order via WhatsApp.",
  keywords: 'watches, wallets, belts, Malawi, luxury accessories, WatchGalore265',
  openGraph: {
    title: 'WatchGalore265',
    description: "Malawi's home for premium watches, wallets and belts.",
    type: 'website',
    locale: 'en_MW',
  },
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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body>
        <CartProvider>
          {children}
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        </CartProvider>
      </body>
    </html>
  );
}
