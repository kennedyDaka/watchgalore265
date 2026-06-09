import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json({ error: 'Missing env vars', url: !!url, key: !!key }, { status: 500 });
  }

  const supabase = createClient(url, key);

  // 1. Check site_content table exists and has rows
  const { data: rows, error: readErr } = await supabase
    .from('site_content')
    .select('key, value, updated_at');

  // 2. Check categories
  const { data: cats, error: catErr } = await supabase
    .from('categories')
    .select('id, slug, name');

  // 3. Try a direct insert to see if write works
  const { error: writeErr } = await supabase
    .from('site_content')
    .upsert({ key: '_debug_ping', value: { ts: Date.now() }, updated_at: new Date().toISOString() }, { onConflict: 'key' });

  // 4. Clean up debug row
  await supabase.from('site_content').delete().eq('key', '_debug_ping');

  return NextResponse.json({
    site_content_rows: rows,
    site_content_count: rows?.length ?? 0,
    site_content_read_error: readErr?.message ?? null,
    categories: cats,
    categories_error: catErr?.message ?? null,
    write_test_error: writeErr?.message ?? null,
  }, { status: writeErr ? 500 : 200 });
}
