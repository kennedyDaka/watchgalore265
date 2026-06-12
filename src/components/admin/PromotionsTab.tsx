'use client';

import { useState, useEffect, useCallback } from 'react';
import { Save, Plus, Trash2, ChevronDown, ChevronUp, AlertCircle, Upload } from 'lucide-react';
import { getSiteContent, upsertSiteContent, getCategories } from '@/lib/supabase';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { revalidateHome } from '@/app/actions';
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

interface DeliveryOption {
  value: string;
  label: string;
  fee: number;
  desc: string;
}

type Section = 'hero' | 'promo_banner' | 'trust' | 'testimonials' | 'cta' | 'category_images' | 'delivery_options';

const SECTIONS: { key: Section; label: string }[] = [
  { key: 'hero', label: 'Hero Section' },
  { key: 'category_images', label: 'Collection Images' },
  { key: 'delivery_options', label: 'Delivery Options' },
  { key: 'promo_banner', label: 'Promo Marquee Banner' },
  { key: 'trust', label: 'Trust Indicators' },
  { key: 'testimonials', label: 'Testimonials' },
  { key: 'cta', label: 'CTA Banner' },
];

const DEFAULTS = {
  hero: { badge: 'Free Same-Day Delivery in Lilongwe', heading: 'Wear Time. Define Style.', subtitle: 'Hand-picked watches, wallets and belts for the modern Malawian gentleman. Order in minutes via WhatsApp.', bgImage: 'https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=1800&q=80' },
  promo_banner: { items: ['Free Same-Day Delivery in Lilongwe', 'Premium Quality Guaranteed', 'Secure WhatsApp Checkout', 'Authentic Products Only'] },
  trust: { items: [{ title: 'Same-Day Delivery', desc: 'Available in Lilongwe. Order before 2PM.' }, { title: 'Authenticity Guaranteed', desc: '100% genuine products. No counterfeits.' }, { title: 'WhatsApp Support', desc: 'Chat with us anytime for order support.' }] },
  testimonials: { items: [{ name: 'James M.', location: 'Lilongwe', text: 'The chronograph I ordered arrived perfectly packaged. Quality is outstanding for the price. Will order again!', stars: 5 }, { name: 'David K.', location: 'Blantyre', text: 'Ordering via WhatsApp was so easy. Got my watch the same day. Very impressed with the service.', stars: 5 }, { name: 'Chris P.', location: 'Mzuzu', text: 'Bought a wallet as a gift for my brother. He loved it. Looks very premium and leather quality is great.', stars: 5 }] },
  cta: { heading: 'Ready to Elevate Your Style?', subtitle: 'Browse our collection and place your order directly on WhatsApp in minutes.' },
  delivery_options: [
    { value: 'same_day', label: 'Same Day Delivery', fee: 2000, desc: 'Available in Lilongwe. Order before 2PM.' },
    { value: 'pickup', label: 'Pickup', fee: 0, desc: 'Collect from our location. Free.' },
    { value: 'standard', label: 'Standard Delivery', fee: 3000, desc: 'Nationwide. 2\u20134 business days.' },
  ],
};

export default function PromotionsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<Section | null>('hero');
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);

  // Hero
  const [heroBadge, setHeroBadge] = useState(DEFAULTS.hero.badge);
  const [heroHeading, setHeroHeading] = useState(DEFAULTS.hero.heading);
  const [heroSubtitle, setHeroSubtitle] = useState(DEFAULTS.hero.subtitle);
  const [heroBg, setHeroBg] = useState(DEFAULTS.hero.bgImage);
  const [heroBgUploading, setHeroBgUploading] = useState(false);
  const [heroImageOnly, setHeroImageOnly] = useState(false);

  // Promo banner
  const [promoItems, setPromoItems] = useState<string[]>(DEFAULTS.promo_banner.items);

  // Trust
  const [trustItems, setTrustItems] = useState<TrustItem[]>(DEFAULTS.trust.items);

  // Testimonials
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>(DEFAULTS.testimonials.items);

  // CTA
  const [ctaHeading, setCtaHeading] = useState(DEFAULTS.cta.heading);
  const [ctaSubtitle, setCtaSubtitle] = useState(DEFAULTS.cta.subtitle);

  // Delivery options
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>(DEFAULTS.delivery_options);

  // Category images
  const [categoryImages, setCategoryImages] = useState<Record<string, string>>({});
  const [categoryImagesUploading, setCategoryImagesUploading] = useState<Record<string, boolean>>({});
  const [dbCategories, setDbCategories] = useState<{ id: string; slug: string; name: string }[]>([]);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const [data, cats] = await Promise.all([getSiteContent(), getCategories()]);
      setDbCategories(cats || []);
      const hasData = Object.keys(data).length > 0;
      setDbConnected(hasData);

      if (hasData) {
        const hero = (data.hero || {}) as { badge?: string; heading?: string; subtitle?: string; bgImage?: string; imageOnly?: boolean };
        setHeroBadge(hero.badge || DEFAULTS.hero.badge);
        setHeroHeading(hero.heading || DEFAULTS.hero.heading);
        setHeroSubtitle(hero.subtitle || DEFAULTS.hero.subtitle);
        setHeroBg(hero.bgImage || DEFAULTS.hero.bgImage);
        setHeroImageOnly(hero.imageOnly === true);

        const promo = (data.promo_banner || {}) as Record<string, string[]>;
        setPromoItems(promo.items || DEFAULTS.promo_banner.items);

        const trust = (data.trust || {}) as Record<string, TrustItem[]>;
        setTrustItems(trust.items || DEFAULTS.trust.items);

        const test = (data.testimonials || {}) as Record<string, TestimonialItem[]>;
        setTestimonials(test.items || DEFAULTS.testimonials.items);

        const cta = (data.cta || {}) as Record<string, string>;
        setCtaHeading(cta.heading || DEFAULTS.cta.heading);
        setCtaSubtitle(cta.subtitle || DEFAULTS.cta.subtitle);

        const catImg = (data.category_images || {}) as Record<string, string>;
        setCategoryImages(catImg);

        const delOpts = data.delivery_options as { options: DeliveryOption[] } | undefined;
        if (delOpts?.options && delOpts.options.length > 0) setDeliveryOptions(delOpts.options);
      }
    } catch (e) {
      console.error('Failed to load site content:', e);
      setDbConnected(false);
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
            imageOnly: heroImageOnly,
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
        case 'category_images':
          await upsertSiteContent('category_images', categoryImages);
          break;
        case 'delivery_options':
          await upsertSiteContent('delivery_options', { options: deliveryOptions });
          break;
      }
      toast.success('Saved — homepage updated');
      revalidateHome().catch(() => {});
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
      <p className="text-sm text-gray-500 mb-4">
        Edit everything that appears on the homepage. Changes go live immediately.
      </p>

      {dbConnected === false && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs px-4 py-3 mb-6 flex items-start gap-2">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-bold mb-1">Could not load from database</p>
            <p>The <code>site_content</code> table may not exist yet. Run the SQL migration in your Supabase Dashboard → SQL Editor. The form below shows defaults — you can edit and save, and it will create the table data automatically.</p>
          </div>
        </div>
      )}

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
                  <Field label="Heading">
                    <input value={heroHeading} onChange={e => setHeroHeading(e.target.value)}
                      placeholder="Wear Time. Define Style." className="input-base" />
                  </Field>
                  <Field label="Subtitle">
                    <textarea value={heroSubtitle} onChange={e => setHeroSubtitle(e.target.value)} rows={2}
                      placeholder="Hand-picked watches..." className="input-base resize-none" />
                  </Field>
                  <Field label="Background Image">
                    {heroBg && (
                      <div className="relative mb-2 w-full aspect-video bg-gray-100 overflow-hidden">
                        <img src={heroBg} alt="Hero background" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <label className="flex items-center justify-center gap-2 w-full px-4 py-3 border border-dashed border-gray-300 bg-gray-50 text-xs font-semibold text-gray-500 hover:border-accent hover:text-accent cursor-pointer transition-colors">
                      <Upload size={14} />
                      {heroBgUploading ? 'Uploading…' : 'Upload Image'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={heroBgUploading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setHeroBgUploading(true);
                          try {
                            const url = await uploadToCloudinary(file, 'site-content');
                            setHeroBg(url);
                            toast.success('Image uploaded');
                          } catch (err: unknown) {
                            const msg = err instanceof Error ? err.message : 'Upload failed';
                            toast.error(msg);
                          } finally {
                            setHeroBgUploading(false);
                          }
                        }}
                      />
                    </label>
                    <p className="text-[10px] text-gray-400 mt-1.5">Or paste a URL:</p>
                    <input value={heroBg} onChange={e => setHeroBg(e.target.value)}
                      placeholder="https://images.unsplash.com/..." className="input-base mt-1" />
                  </Field>

                  <label className="flex items-center gap-2.5 cursor-pointer pt-2">
                    <input
                      type="checkbox"
                      checked={heroImageOnly}
                      onChange={e => setHeroImageOnly(e.target.checked)}
                      className="w-4 h-4 accent-[#2563EB]"
                    />
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Image only (hide text &amp; overlay)
                    </span>
                  </label>
                </>
              )}

              {/* CATEGORY IMAGES */}
              {section.key === 'category_images' && (
                <>
                  <p className="text-xs text-gray-400">Upload images for each collection shown on the homepage.</p>
                  {dbCategories.map(cat => (
                    <div key={cat.slug} className="border border-gray-100 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{cat.name}</span>
                      </div>
                      {categoryImages[cat.slug] && (
                        <div className="relative mb-2 w-full aspect-video bg-gray-100 overflow-hidden">
                          <img src={categoryImages[cat.slug]} alt={cat.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <label className="flex items-center justify-center gap-2 w-full px-4 py-3 border border-dashed border-gray-300 bg-gray-50 text-xs font-semibold text-gray-500 hover:border-accent hover:text-accent cursor-pointer transition-colors">
                        <Upload size={14} />
                        {categoryImagesUploading[cat.slug] ? 'Uploading…' : 'Upload Image'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={categoryImagesUploading[cat.slug]}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setCategoryImagesUploading(prev => ({ ...prev, [cat.slug]: true }));
                            try {
                              const url = await uploadToCloudinary(file, `site-content/${cat.slug}`);
                              const updated = { ...categoryImages, [cat.slug]: url };
                              setCategoryImages(updated);
                              await upsertSiteContent('category_images', updated);
                              revalidateHome().catch(() => {});
                              toast.success('Image uploaded & saved');
                            } catch (err: unknown) {
                              const msg = err instanceof Error ? err.message : 'Upload failed';
                              toast.error(msg);
                            } finally {
                              setCategoryImagesUploading(prev => ({ ...prev, [cat.slug]: false }));
                            }
                          }}
                        />
                      </label>
                      <p className="text-[10px] text-gray-400 mt-1.5">Or paste a URL:</p>
                      <input
                        value={categoryImages[cat.slug] || ''}
                        onChange={e => setCategoryImages(prev => ({ ...prev, [cat.slug]: e.target.value }))}
                        placeholder="https://images.unsplash.com/..."
                        className="input-base mt-1"
                      />
                    </div>
                  ))}
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

              {/* DELIVERY OPTIONS */}
              {section.key === 'delivery_options' && (
                <>
                  <p className="text-xs text-gray-400">Configure delivery methods shown at checkout.</p>
                  {deliveryOptions.map((opt, i) => (
                    <div key={i} className="border border-gray-100 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Option #{i + 1}</span>
                        <button onClick={() => setDeliveryOptions(deliveryOptions.filter((_, idx) => idx !== i))}
                          className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input value={opt.label}
                          onChange={e => { const next = [...deliveryOptions]; next[i] = { ...next[i], label: e.target.value }; setDeliveryOptions(next); }}
                          className="input-base" placeholder="Label (e.g. Same Day)" />
                        <input value={opt.desc}
                          onChange={e => { const next = [...deliveryOptions]; next[i] = { ...next[i], desc: e.target.value }; setDeliveryOptions(next); }}
                          className="input-base" placeholder="Description" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Value (slug)">
                          <input value={opt.value}
                            onChange={e => { const next = [...deliveryOptions]; next[i] = { ...next[i], value: e.target.value.replace(/\s+/g, '_') }; setDeliveryOptions(next); }}
                            className="input-base" placeholder="same_day" />
                        </Field>
                        <Field label="Fee (MK)">
                          <input type="number" value={opt.fee}
                            onChange={e => { const next = [...deliveryOptions]; next[i] = { ...next[i], fee: Number(e.target.value) }; setDeliveryOptions(next); }}
                            className="input-base" min="0" />
                        </Field>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setDeliveryOptions([...deliveryOptions, { value: '', label: '', fee: 0, desc: '' }])}
                    className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline">
                    <Plus size={12} /> Add delivery option
                  </button>
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
