import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-32 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-accent mb-4">404</p>
        <h1 className="text-4xl font-black uppercase tracking-tight mb-4">Page Not Found</h1>
        <p className="text-gray-500 text-sm mb-10">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/shop"
          className="inline-block bg-black text-white font-bold text-xs tracking-widest uppercase px-10 py-3.5 hover:bg-charcoal transition-colors"
        >
          Browse Collection
        </Link>
      </main>
      <Footer />
    </>
  );
}
