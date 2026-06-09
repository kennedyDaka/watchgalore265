'use client';

import { MessageCircle } from 'lucide-react';

export default function WhatsAppButton() {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '265993000000';
  const message = encodeURIComponent('Hello WatchGalore265 👋 I would like to enquire about your products.');

  return (
    <a
      href={`https://wa.me/${number}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-whatsapp shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
    >
      <MessageCircle fill="white" color="white" size={26} />
    </a>
  );
}
