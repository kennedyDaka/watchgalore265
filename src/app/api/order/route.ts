import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const payload = {
      order_code: body.order_id,
      customer_name: body.customer_name,
      customer_phone: body.phone,
      customer_location: body.location,
      notes: body.delivery_notes || '',
      items: body.products || [],
      subtotal: (body.total || 0) - (body.delivery_fee || 0),
      total: body.total || 0,
      delivery_method: body.delivery_method,
      delivery_fee: body.delivery_fee || 0,
      status: body.status || 'pending',
    };

    const res = await fetch(`${supabaseUrl}/rest/v1/orders`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      return NextResponse.json({ error: err.message || res.statusText }, { status: res.status });
    }

    const [data] = await res.json();
    return NextResponse.json({ success: true, order_id: body.order_id, id: data?.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to create order' }, { status: 500 });
  }
}
