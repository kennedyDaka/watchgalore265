'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, MessageCircle, RefreshCw } from 'lucide-react';
import { getOrders, updateOrderStatus } from '@/lib/supabase';
import { Order, OrderStatus } from '@/lib/types';
import { formatMK } from '@/components/ProductCard';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  confirmed: 'bg-blue-50 text-blue-700 border border-blue-200',
  processing: 'bg-purple-50 text-purple-700 border border-purple-200',
  delivered: 'bg-green-50 text-green-700 border border-green-200',
  cancelled: 'bg-red-50 text-red-700 border border-red-200',
};

const STATUS_OPTIONS: OrderStatus[] = ['pending', 'confirmed', 'processing', 'delivered', 'cancelled'];

function OrderRow({ order, onStatusChange }: { order: Order; onStatusChange: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    setUpdating(true);
    try {
      await updateOrderStatus(order.id, newStatus);
      toast.success(`Order ${order.order_id} updated to ${newStatus}`);
      onStatusChange();
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const whatsappNumber = order.phone.replace(/\D/g, '');
  const waUrl = `https://wa.me/${whatsappNumber}`;

  return (
    <div className="border border-gray-100 hover:border-gray-200 transition-colors">
      {/* Main row */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-0.5">
            <span className="text-sm font-black uppercase tracking-wide">{order.order_id}</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status]}`}>
              {order.status}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            {order.customer_name} · {order.phone}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(order.created_at).toLocaleString('en-MW', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <p className="text-sm font-black">{formatMK(order.total)}</p>
            <p className="text-xs text-gray-400">{order.products?.length || 0} item{order.products?.length !== 1 ? 's' : ''}</p>
          </div>
          {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 space-y-4">
          {/* Customer info */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div><span className="text-gray-400 uppercase tracking-wider block mb-0.5">Customer</span><span className="font-semibold">{order.customer_name}</span></div>
            <div><span className="text-gray-400 uppercase tracking-wider block mb-0.5">Phone</span><span className="font-semibold">{order.phone}</span></div>
            <div><span className="text-gray-400 uppercase tracking-wider block mb-0.5">Location</span><span className="font-semibold">{order.location}</span></div>
            <div><span className="text-gray-400 uppercase tracking-wider block mb-0.5">Delivery</span><span className="font-semibold capitalize">{order.delivery_method?.replace('_', ' ')}</span></div>
            {order.delivery_notes && <div className="col-span-2"><span className="text-gray-400 uppercase tracking-wider block mb-0.5">Notes</span><span className="font-semibold">{order.delivery_notes}</span></div>}
          </div>

          {/* Products */}
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-400 mb-2">Items</p>
            <div className="space-y-1.5">
              {order.products?.map((item, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="font-medium">{item.product_name} <span className="text-gray-400">×{item.quantity}</span></span>
                  <span className="font-semibold">{formatMK(item.price * item.quantity)}</span>
                </div>
              ))}
              <div className="flex justify-between text-xs pt-1.5 border-t border-gray-200">
                <span className="text-gray-400">Delivery fee</span>
                <span className="font-semibold">{order.delivery_fee === 0 ? 'FREE' : formatMK(order.delivery_fee)}</span>
              </div>
              <div className="flex justify-between text-sm font-black pt-1">
                <span>Total</span>
                <span>{formatMK(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 flex-wrap pt-1">
            <select
              value={order.status}
              onChange={e => handleStatusChange(e.target.value as OrderStatus)}
              disabled={updating}
              className="text-xs border border-gray-200 px-3 py-1.5 bg-white focus:outline-none focus:border-accent capitalize disabled:opacity-50"
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s} className="capitalize">{s}</option>
              ))}
            </select>

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold text-whatsapp border border-whatsapp px-3 py-1.5 hover:bg-whatsapp hover:text-white transition-colors"
            >
              <MessageCircle size={12} />
              WhatsApp Customer
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

type FilterTab = 'pending' | 'completed' | 'cancelled' | 'all';

export default function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<FilterTab>('pending');
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const statusMap: Record<FilterTab, string | undefined> = {
        pending: 'pending',
        completed: 'delivered',
        cancelled: 'cancelled',
        all: undefined,
      };
      const data = await getOrders(statusMap[filter]);
      setOrders(data || []);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetch(); }, [fetch]);

  const allOrders = async () => {
    const data = await getOrders();
    const counts = { pending: 0, completed: 0, cancelled: 0, all: data?.length || 0 };
    data?.forEach((o: Order) => {
      if (o.status === 'pending') counts.pending++;
      if (o.status === 'delivered') counts.completed++;
      if (o.status === 'cancelled') counts.cancelled++;
    });
    return counts;
  };

  const [counts, setCounts] = useState({ pending: 0, completed: 0, cancelled: 0, all: 0 });

  useEffect(() => {
    allOrders().then(setCounts).catch(() => {});
  }, [orders]);

  const FILTER_TABS: { key: FilterTab; label: string; count: number }[] = [
    { key: 'pending', label: 'PENDING', count: counts.pending },
    { key: 'completed', label: 'COMPLETED', count: counts.completed },
    { key: 'cancelled', label: 'CANCELLED', count: counts.cancelled },
    { key: 'all', label: 'ALL', count: counts.all },
  ];

  return (
    <div>
      {/* Status cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`text-left p-4 border-2 transition-all ${
              filter === tab.key ? 'border-accent bg-accent/5' : 'border-gray-100 hover:border-gray-200'
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">{tab.label}</p>
            <p className="text-3xl font-black">{tab.count}</p>
          </button>
        ))}
      </div>

      {/* Refresh */}
      <div className="flex justify-end mb-3">
        <button
          onClick={fetch}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-accent transition-colors"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-50 animate-pulse rounded" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <p className="text-sm uppercase tracking-widest">No orders found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map(order => (
            <OrderRow key={order.id} order={order} onStatusChange={fetch} />
          ))}
        </div>
      )}
    </div>
  );
}
