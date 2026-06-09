'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, MessageCircle, Check, ShoppingBag } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { createOrder } from '@/lib/supabase';
import { formatMK } from '@/components/ProductCard';
import { CheckoutFormData, DeliveryMethod } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

const DELIVERY_OPTIONS: { value: DeliveryMethod; label: string; fee: number; desc: string }[] = [
  { value: 'same_day', label: 'Same Day Delivery', fee: 2000, desc: 'Available in Lilongwe. Order before 2PM.' },
  { value: 'pickup', label: 'Pickup', fee: 0, desc: 'Collect from our location. Free.' },
  { value: 'standard', label: 'Standard Delivery', fee: 3000, desc: 'Nationwide. 2–4 business days.' },
];

const STEPS = ['Your Details', 'Delivery', 'Confirm & Order'];

function generateOrderId(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `WG265-${num}`;
}

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<CheckoutFormData>({
    fullName: '',
    phone: '',
    location: '',
    deliveryNotes: '',
    deliveryMethod: 'same_day',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutFormData, string>>>({});

  const selectedDelivery = DELIVERY_OPTIONS.find(d => d.value === form.deliveryMethod)!;
  const deliveryFee = selectedDelivery.fee;
  const grandTotal = totalPrice + deliveryFee;
  const orderId = generateOrderId();

  const validateStep0 = () => {
    const errs: typeof errors = {};
    if (!form.fullName.trim()) errs.fullName = 'Name is required';
    if (!form.phone.trim() || form.phone.length < 9) errs.phone = 'Enter a valid phone number';
    if (!form.location.trim()) errs.location = 'Location is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (step === 0 && !validateStep0()) return;
    setStep(s => s + 1);
  };

  const buildWhatsAppMessage = () => {
    const itemLines = items
      .map((i, idx) => `${idx + 1}. ${i.product.name} x${i.quantity} — ${formatMK(i.product.price * i.quantity)}`)
      .join('\n');

    return encodeURIComponent(
      `Hello WatchGalore265 👋\n\nI would like to place an order:\n\nORDER #${orderId}\n\n${itemLines}\n\nSubtotal: ${formatMK(totalPrice)}\nDelivery (${selectedDelivery.label}): ${deliveryFee === 0 ? 'FREE' : formatMK(deliveryFee)}\n*Total: ${formatMK(grandTotal)}*\n\nCustomer Details:\nName: ${form.fullName}\nLocation: ${form.location}\nPhone: ${form.phone}${form.deliveryNotes ? '\nNotes: ' + form.deliveryNotes : ''}\n\nDelivery Method:\n${selectedDelivery.label}\n\nThank you.`
    );
  };

  const handlePlaceOrder = async () => {
    setSubmitting(true);
    try {
      const orderData = {
        order_id: orderId,
        customer_name: form.fullName,
        phone: form.phone,
        location: form.location,
        delivery_notes: form.deliveryNotes,
        products: items.map(i => ({
          product_id: i.product.id,
          product_name: i.product.name,
          price: i.product.price,
          quantity: i.quantity,
          image: i.product.images?.[0],
        })),
        total: grandTotal,
        delivery_method: form.deliveryMethod,
        delivery_fee: deliveryFee,
        status: 'pending',
      };

      await createOrder(orderData).catch(() => {}); // Save to DB; don't block on error
    } finally {
      setSubmitting(false);
    }

    const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '265993000000';
    const waUrl = `https://wa.me/${waNumber}?text=${buildWhatsAppMessage()}`;
    clearCart();
    window.open(waUrl, '_blank');
  };

  if (items.length === 0 && step < 2) {
    return (
      <>
        <Navbar />
        <main className="max-w-lg mx-auto px-4 py-24 text-center">
          <ShoppingBag size={40} className="text-gray-200 mx-auto mb-4" />
          <h1 className="text-xl font-black uppercase tracking-tight mb-2">Your Cart is Empty</h1>
          <p className="text-sm text-gray-500 mb-8">Add some products before checking out.</p>
          <Link href="/shop" className="inline-block bg-black text-white font-bold text-xs tracking-widest uppercase px-8 py-3.5 hover:bg-charcoal transition-colors">
            Browse Collection
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/shop" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-accent uppercase tracking-widest mb-8 transition-colors">
          <ChevronLeft size={14} /> Continue Shopping
        </Link>

        <div className="accent-line mb-8">
          <h1 className="text-3xl font-black uppercase tracking-tight">Checkout</h1>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-0 mb-10">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  i < step ? 'bg-accent border-accent text-white'
                  : i === step ? 'border-accent text-accent'
                  : 'border-gray-200 text-gray-300'
                }`}>
                  {i < step ? <Check size={14} /> : i + 1}
                </div>
                <span className={`text-xs uppercase tracking-wide font-semibold hidden sm:block ${
                  i === step ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-3 ${i < step ? 'bg-accent' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-8">
          {/* Left — step content */}
          <div>
            {/* Step 0 — Customer Info */}
            {step === 0 && (
              <div className="space-y-4 animate-fadeIn">
                <h2 className="text-sm font-bold uppercase tracking-widest mb-5">Your Details</h2>
                {[
                  { id: 'fullName', label: 'Full Name', placeholder: 'e.g. Kennedy Daka', type: 'text' },
                  { id: 'phone', label: 'Phone Number', placeholder: 'e.g. 0993 123 456', type: 'tel' },
                  { id: 'location', label: 'Delivery Location', placeholder: 'e.g. Lilongwe, Area 3', type: 'text' },
                  { id: 'deliveryNotes', label: 'Delivery Notes (optional)', placeholder: 'Any special instructions…', type: 'text' },
                ].map(field => (
                  <div key={field.id}>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={form[field.id as keyof CheckoutFormData]}
                      onChange={e => {
                        setForm(f => ({ ...f, [field.id]: e.target.value }));
                        if (errors[field.id as keyof CheckoutFormData]) {
                          setErrors(er => ({ ...er, [field.id]: undefined }));
                        }
                      }}
                      className={`w-full px-4 py-3 border text-sm focus:outline-none focus:border-accent transition-colors ${
                        errors[field.id as keyof CheckoutFormData]
                          ? 'border-red-400 bg-red-50'
                          : 'border-gray-200 bg-gray-50 focus:bg-white'
                      }`}
                    />
                    {errors[field.id as keyof CheckoutFormData] && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors[field.id as keyof CheckoutFormData]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Step 1 — Delivery */}
            {step === 1 && (
              <div className="animate-fadeIn">
                <h2 className="text-sm font-bold uppercase tracking-widest mb-5">Delivery Method</h2>
                <div className="space-y-3">
                  {DELIVERY_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setForm(f => ({ ...f, deliveryMethod: opt.value }))}
                      className={`w-full text-left p-4 border-2 transition-all flex items-center justify-between ${
                        form.deliveryMethod === opt.value
                          ? 'border-accent bg-accent/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          form.deliveryMethod === opt.value ? 'border-accent' : 'border-gray-300'
                        }`}>
                          {form.deliveryMethod === opt.value && (
                            <div className="w-2 h-2 rounded-full bg-accent" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold">{opt.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        {opt.fee === 0 ? 'FREE' : formatMK(opt.fee)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2 — Summary */}
            {step === 2 && (
              <div className="animate-fadeIn">
                <h2 className="text-sm font-bold uppercase tracking-widest mb-5">Order Summary</h2>

                <div className="bg-gray-50 p-5 mb-6 space-y-3">
                  <div className="flex justify-between text-xs uppercase tracking-wider text-gray-500 pb-2 border-b border-gray-200">
                    <span>Product</span><span>Amount</span>
                  </div>
                  {items.map(item => (
                    <div key={item.product.id} className="flex items-center gap-3">
                      <div className="relative w-12 h-12 shrink-0 bg-gray-100">
                        <Image
                          src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80'}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold uppercase truncate">{item.product.name}</p>
                        <p className="text-xs text-gray-400">x{item.quantity}</p>
                      </div>
                      <p className="text-sm font-bold">{formatMK(item.product.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 text-sm mb-6">
                  <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-medium">{formatMK(totalPrice)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Delivery ({selectedDelivery.label})</span><span className="font-medium">{deliveryFee === 0 ? 'FREE' : formatMK(deliveryFee)}</span></div>
                  <div className="flex justify-between pt-3 border-t border-gray-200 font-black text-base"><span>Total</span><span>{formatMK(grandTotal)}</span></div>
                </div>

                <div className="bg-gray-50 p-4 text-xs space-y-1.5 text-gray-500 border border-gray-100">
                  <div><strong className="text-gray-700">Name:</strong> {form.fullName}</div>
                  <div><strong className="text-gray-700">Phone:</strong> {form.phone}</div>
                  <div><strong className="text-gray-700">Location:</strong> {form.location}</div>
                  <div><strong className="text-gray-700">Delivery:</strong> {selectedDelivery.label}</div>
                  {form.deliveryNotes && <div><strong className="text-gray-700">Notes:</strong> {form.deliveryNotes}</div>}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 mt-8">
              {step > 0 && (
                <button
                  onClick={() => setStep(s => s - 1)}
                  className="px-6 py-3 border border-gray-200 text-sm font-bold uppercase tracking-widest hover:border-gray-400 transition-colors"
                >
                  Back
                </button>
              )}
              {step < 2 ? (
                <button
                  onClick={handleNext}
                  className="flex-1 py-3 bg-black text-white font-bold text-xs tracking-widest uppercase hover:bg-charcoal transition-colors"
                >
                  Continue →
                </button>
              ) : (
                <button
                  onClick={handlePlaceOrder}
                  disabled={submitting}
                  className="flex-1 py-3.5 bg-whatsapp text-white font-bold text-xs tracking-widest uppercase hover:bg-green-600 transition-colors flex items-center justify-center gap-2.5 disabled:opacity-60"
                >
                  <MessageCircle size={16} />
                  {submitting ? 'Opening WhatsApp…' : 'Place Order on WhatsApp'}
                </button>
              )}
            </div>
          </div>

          {/* Right — Cart summary */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="border border-gray-100 p-5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">
                Cart ({items.length} {items.length === 1 ? 'item' : 'items'})
              </h3>
              <div className="space-y-3 mb-5">
                {items.map(item => (
                  <div key={item.product.id} className="flex items-center gap-3">
                    <div className="relative w-14 h-14 shrink-0 bg-gray-50">
                      <Image
                        src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80'}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                      <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 bg-gray-700 text-white text-[10px] rounded-full flex items-center justify-center font-bold w-[18px] h-[18px]">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold uppercase truncate">{item.product.name}</p>
                      <p className="text-xs text-gray-400">{formatMK(item.product.price)}</p>
                    </div>
                    <p className="text-sm font-bold">{formatMK(item.product.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-4 space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-500 text-xs"><span>Subtotal</span><span>{formatMK(totalPrice)}</span></div>
                <div className="flex justify-between text-gray-500 text-xs"><span>Delivery</span><span>{deliveryFee === 0 ? 'FREE' : formatMK(deliveryFee)}</span></div>
                <div className="flex justify-between font-black pt-2 border-t border-gray-100 text-base"><span>Total</span><span>{formatMK(grandTotal)}</span></div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
