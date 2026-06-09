'use client';

import { useState, useEffect, useCallback } from 'react';
import { Save, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { getSiteContent, upsertSiteContent } from '@/lib/supabase';
import toast from 'react-hot-toast';

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

type Section = 'hero' | 'promo_banner' | 'trust' | 'testimonials' | 'cta';

const SECTIONS: { key: Section; label: string }[] = [
  { key: 'hero', label: 'Hero Section' },
  { key: 'promo_banner', label: 'Promo Marquee Banner' },
  { key: 'trust', label: 'Trust Indicators' },
  { key: 'testimonials', label: 'Testimonials' },
  { key: 'cta', label: 'CTA Banner' },
];

export default function PromotionsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<Section | null>('hero');

  // Hero
  const [heroBadge, setHeroBadge] = useState('');
  const [heroHeading, setHeroHeading] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [heroBg, setHeroBg] = useState('');

  // Promo banner
  const [promoItems, setPromoItems] = useState<string[]>([]);

  // Trust
  const [trustItems, setTrustItems] = useState<TrustItem[]>([]);

  // Testimonials
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);

  // CTA
  const [ctaHeading, setCtaHeading] = useState('');
  const [ctaSubtitle, setCtaSubtitle] = useState('');

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSiteContent();

      const hero = (data.hero || {}) as Record<string, string>;
      setHeroBadge(hero.badge || '');
      setHeroHeading(hero.heading || '');
      setHeroSubtitle(hero.subtitle || '');
      setHeroBg(hero.bgImage || '');

      const promo = (data.promo_banner || {}) as Record<string, string[]>;
      setPromoItems(promo.items || []);

      const trust = (data.trust || {}) as Record<string, TrustItem[]>;
      setTrustItems(trust.items || []);

      const test = (data.testimonials || {}) as Record<string, TestimonialItem[]>;
      setTestimonials(test.items || []);

      const cta = (data.cta || {}) as Record<string, string>;
      setCtaHeading(cta.heading || '');
      setCtaSubtitle(cta.subtitle || '');
    } catch (e) {
      console.error('Failed to load site content:', e);
      toast.error('Failed to load homepage content');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchContent(); }, [fetchContent]);

  const handleSave = async (section: Section) => {
    setSaving(true);
    try {
      switch (section) {
        case 'hero':
          await upsertSiteContent('hero', {
            badge: heroBadge,
            heading: heroHeading,
            subtitle: heroSubtitle,
            bgImage: heroBg,
          });
          break;
        case 'promo_banner':
          await upsertSiteContent('promo_banner', { items: promoItems });
          break;
        case 'trust':
          await upsertSiteContent('trust', { items: trustItems });
          break;
        case 'testimonials':
          await upsertSiteContent('testimonials', { items: testimonials });
          break;
        case 'cta':
          await upsertSiteContent('cta', { heading: ctaHeading, subtitle: ctaSubtitle });
          break;
      }
      toast.success('Saved');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to save';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const toggle = (key: Section) => setExpanded(expanded === key ? null : key);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 bg-gray-50 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <p className="text-sm text-gray-500 mb-6">
        Edit everything that appears on the homepage. Changes go live immediately.
      </p>

      {SECTIONS.map(section => (
        <div key={section.key} className="border border-gray-100 mb-3">
          {/* Section header */}
          <button
            onClick={() => toggle(section.key)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
          >
            <span className="text-xs font-bold uppercase tracking-widest">{section.label}</span>
            {expanded === section.key ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {/* Section body */}
          {expanded === section.key && (
            <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
              {/* HERO */}
              {section.key === 'hero' && (
                <>
                  <Field label="Badge Text">
                    <input value={heroBadge} onChange={e => setHeroBadge(e.target.value)}
                      placeholder="Free Same-Day Delivery in Lilongwe" className="input-base" />
                  </Field>
                  <Field label="Heading (e.g. Wear Time. Define Style.)">
                    <input value={heroHeading} onChange={e => setHeroHeading(e.target.value)}
                      placeholder="Wear Time. Define Style." className="input-base" />
                  </Field>
                  <Field label="Subtitle">
                    <textarea value={heroSubtitle} onChange={e => setHeroSubtitle(e.target.value)} rows={2}
                      placeholder="Hand-picked watches..." className="input-base resize-none" />
                  </Field>
                  <Field label="Background Image URL">
                    <input value={heroBg} onChange={e => setHeroBg(e.target.value)}
                      placeholder="https://images.unsplash.com/..." className="input-base" />
                  </Field>
                </>
              )}

              {/* PROMO BANNER */}
              {section.key === 'promo_banner' && (
                <>
                  <p className="text-xs text-gray-400">Marquee items shown in the scrolling banner.</p>
                  {promoItems.map((item, i) => (
                    <div key={i} className="flex gap-2">
                      <input value={item} onChange={e => {
                        const next = [...promoItems]; next[i] = e.target.value; setPromoItems(next);
                      }} className="input-base flex-1" placeholder={`Item ${i + 1}`} />
                      <button onClick={() => setPromoItems(promoItems.filter((_, idx) => idx !== i))}
                        className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                  ))}
                  <button onClick={() => setPromoItems([...promoItems, ''])}
                    className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline">
                    <Plus size={12} /> Add item
                  </button>
                </>
              )}

              {/* TRUST */}
              {section.key === 'trust' && (
                <>
                  {trustItems.map((item, i) => (
                    <div key={i} className="border border-gray-100 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Trust #{i + 1}</span>
                        <button onClick={() => setTrustItems(trustItems.filter((_, idx) => idx !== i))}
                          className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                      </div>
                      <input value={item.title} onChange={e => {
                        const next = [...trustItems]; next[i] = { ...next[i], title: e.target.value }; setTrustItems(next);
                      }} className="input-base" placeholder="Title" />
                      <input value={item.desc} onChange={e => {
                        const next = [...trustItems]; next[i] = { ...next[i], desc: e.target.value }; setTrustItems(next);
                      }} className="input-base" placeholder="Description" />
                    </div>
                  ))}
                  <button onClick={() => setTrustItems([...trustItems, { title: '', desc: '' }])}
                    className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline">
                    <Plus size={12} /> Add trust indicator
                  </button>
                </>
              )}

              {/* TESTIMONIALS */}
              {section.key === 'testimonials' && (
                <>
                  {testimonials.map((t, i) => (
                    <div key={i} className="border border-gray-100 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Review #{i + 1}</span>
                        <button onClick={() => setTestimonials(testimonials.filter((_, idx) => idx !== i))}
                          className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input value={t.name} onChange={e => {
                          const next = [...testimonials]; next[i] = { ...next[i], name: e.target.value }; setTestimonials(next);
                        }} className="input-base" placeholder="Name" />
                        <input value={t.location} onChange={e => {
                          const next = [...testimonials]; next[i] = { ...next[i], location: e.target.value }; setTestimonials(next);
                        }} className="input-base" placeholder="Location" />
                      </div>
                      <textarea value={t.text} onChange={e => {
                        const next = [...testimonials]; next[i] = { ...next[i], text: e.target.value }; setTestimonials(next);
                      }} rows={2} className="input-base resize-none" placeholder="Review text" />
                      <select value={t.stars} onChange={e => {
                        const next = [...testimonials]; next[i] = { ...next[i], stars: Number(e.target.value) }; setTestimonials(next);
                      }} className="input-base">
                        {[3, 4, 5].map(s => <option key={s} value={s}>{s} stars</option>)}
                      </select>
                    </div>
                  ))}
                  <button onClick={() => setTestimonials([...testimonials, { name: '', location: '', text: '', stars: 5 }])}
                    className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline">
                    <Plus size={12} /> Add testimonial
                  </button>
                </>
              )}

              {/* CTA */}
              {section.key === 'cta' && (
                <>
                  <Field label="Heading">
                    <input value={ctaHeading} onChange={e => setCtaHeading(e.target.value)}
                      placeholder="Ready to Elevate Your Style?" className="input-base" />
                  </Field>
                  <Field label="Subtitle">
                    <textarea value={ctaSubtitle} onChange={e => setCtaSubtitle(e.target.value)} rows={2}
                      placeholder="Browse our collection..." className="input-base resize-none" />
                  </Field>
                </>
              )}

              {/* Save button */}
              <button
                onClick={() => handleSave(section.key)}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-charcoal transition-colors disabled:opacity-60"
              >
                <Save size={14} />
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      ))}

      <style jsx>{`
        .input-base {
          width: 100%;
          padding: 0.625rem 0.875rem;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.15s;
        }
        .input-base:focus {
          border-color: #2563eb;
          background: white;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
