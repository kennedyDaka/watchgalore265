'use client';

import { MessageCircle } from 'lucide-react';

export default function WhatsAppButton() {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '265888810581';
  const message = encodeURIComponent("Hello \uD83D\uDC4B\n\nI\u2019m looking for a watch/accessory and would appreciate some recommendations.");

  return (
    <a
      href={`https://api.whatsapp.com/send?phone=${number}&text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex items-center justify-center w-[52px] h-[52px] sm:w-14 sm:h-14 rounded-full bg-whatsapp shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <MessageCircle fill="white" color="white" size={24} />
    </a>
  );
}
