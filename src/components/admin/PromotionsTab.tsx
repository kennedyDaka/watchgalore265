'use client';

import { useState } from 'react';
import { MessageCircle, Share2, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const PROMO_TEMPLATES = [
  {
    id: 'sale',
    title: '🔥 Flash Sale',
    template: (details: string) =>
      `🔥 *FLASH SALE — WATCHGALORE265* 🔥\n\n${details}\n\n⏰ Limited time only!\n\n📲 Shop now: watchgalore265.com\n💬 Order via WhatsApp: +265 993 000 000`,
  },
  {
    id: 'new_arrival',
    title: '✨ New Arrival',
    template: (details: string) =>
      `✨ *NEW ARRIVAL — WATCHGALORE265* ✨\n\n${details}\n\n🛍 Available now in limited quantities.\n\n📲 Shop: watchgalore265.com\n💬 WhatsApp: +265 993 000 000`,
  },
  {
    id: 'bundle',
    title: '🎁 Bundle Deal',
    template: (details: string) =>
      `🎁 *BUNDLE DEAL — WATCHGALORE265* 🎁\n\n${details}\n\n✅ Premium quality guaranteed\n✅ Same-day delivery in Lilongwe\n\n📲 watchgalore265.com`,
  },
];

export default function PromotionsTab() {
  const [selectedTemplate, setSelectedTemplate] = useState(PROMO_TEMPLATES[0].id);
  const [details, setDetails] = useState('');
  const [copied, setCopied] = useState(false);

  const template = PROMO_TEMPLATES.find(t => t.id === selectedTemplate)!;
  const preview = template.template(details || '[Add your promotional details here]');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(preview);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const wa = `https://wa.me/?text=${encodeURIComponent(preview)}`;
    window.open(wa, '_blank');
  };

  return (
    <div className="max-w-2xl">
      <p className="text-sm text-gray-500 mb-6">
        Generate ready-to-share promotional messages for WhatsApp and social media.
      </p>

      {/* Template selector */}
      <div className="mb-5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
          Message Template
        </label>
        <div className="flex gap-2 flex-wrap">
          {PROMO_TEMPLATES.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedTemplate(t.id)}
              className={`px-4 py-2 text-xs font-bold border transition-all ${
                selectedTemplate === t.id
                  ? 'bg-accent border-accent text-white'
                  : 'border-gray-200 text-gray-600 hover:border-accent'
              }`}
            >
              {t.title}
            </button>
          ))}
        </div>
      </div>

      {/* Details input */}
      <div className="mb-5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
          Promotion Details
        </label>
        <textarea
          value={details}
          onChange={e => setDetails(e.target.value)}
          placeholder="e.g. Black Chronograph Watch — Was MK120,000 NOW MK85,000 (Save MK35,000!)"
          rows={3}
          className="w-full px-4 py-3 border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-accent focus:bg-white resize-none transition-colors"
        />
      </div>

      {/* Preview */}
      <div className="mb-5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
          Preview
        </label>
        <div className="bg-gray-50 border border-gray-100 p-4 text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
          {preview}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-xs font-bold uppercase tracking-widest hover:border-gray-400 transition-colors"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy Text'}
        </button>
        <button
          onClick={handleWhatsApp}
          className="flex items-center gap-2 px-5 py-2.5 bg-whatsapp text-white text-xs font-bold uppercase tracking-widest hover:bg-green-600 transition-colors"
        >
          <MessageCircle size={14} />
          Share on WhatsApp
        </button>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-5 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-charcoal transition-colors"
        >
          <Share2 size={14} />
          Copy for Social
        </button>
      </div>
    </div>
  );
}
