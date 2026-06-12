import { NextResponse } from 'next/server';
import { getSiteContent } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const content = await getSiteContent();
    return NextResponse.json(
      { ok: true, data: content, keys: Object.keys(content) },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
