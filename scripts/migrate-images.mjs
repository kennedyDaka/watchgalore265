import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env.local since we're running outside Next.js
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    process.env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
  }
}

// ── Config ──────────────────────────────────────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
const apiKey = process.env.CLOUDINARY_API_KEY || '';
const apiSecret = process.env.CLOUDINARY_API_SECRET || '';

const SUPABASE_PREFIX = 'supabase.co/storage/v1/object/public';
const ADMIN_EMAIL = 'admin@watchgalore265.com';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Helpers ──────────────────────────────────────────────────────────────────

function isSupabaseUrl(url) {
  return typeof url === 'string' && url.includes(SUPABASE_PREFIX);
}

async function uploadToCloudinary(imageUrl, folder) {
  console.log(`  Downloading: ${imageUrl.slice(0, 80)}…`);
  const resp = await fetch(imageUrl);
  if (!resp.ok) throw new Error(`Download failed: ${resp.status}`);

  const buffer = Buffer.from(await resp.arrayBuffer());
  const base64 = buffer.toString('base64');
  const contentType = resp.headers.get('content-type') || 'image/jpeg';
  const dataUri = `data:${contentType};base64,${base64}`;

  const timestamp = Math.floor(Date.now() / 1000);
  const params = { folder, timestamp };
  const signingStr = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&') + apiSecret;
  const signature = crypto.createHash('sha1').update(signingStr).digest('hex');

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: dataUri, api_key: apiKey, timestamp, folder, signature }),
    }
  );

  if (!uploadRes.ok) {
    const errBody = await uploadRes.json().catch(() => null);
    throw new Error(`Cloudinary ${uploadRes.status}: ${errBody?.error?.message || 'unknown'}`);
  }

  const data = await uploadRes.json();
  console.log(`  ✅ Uploaded: ${data.secure_url.slice(0, 80)}…`);
  return data.secure_url;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Supabase → Cloudinary Image Migration ===\n');

  // Sign in as admin
  const { data: { session }, error: signInErr } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: process.argv.find(a => a.startsWith('--pass='))?.split('=')[1] || '',
  });
  if (signInErr || !session) {
    console.error('Sign in failed. Usage: node scripts/migrate-images.mjs --pass=YOUR_ADMIN_PASSWORD');
    process.exit(1);
  }
  console.log(`Signed in as ${session.user.email}\n`);

  let migrated = 0;

  // ── 1. Product images ──────────────────────────────────────────────────────
  console.log('── Products ──');
  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select('id, name, images, image_url');
  if (prodErr) { console.error('Products query failed:', prodErr.message); process.exit(1); }

  for (const product of products || []) {
    let changed = false;
    const newImages = [...(product.images || [])];

    for (let i = 0; i < newImages.length; i++) {
      if (isSupabaseUrl(newImages[i])) {
        console.log(`  Product "${product.name}" (${product.id}) image ${i}:`);
        const newUrl = await uploadToCloudinary(newImages[i], `products/${product.id}`);
        newImages[i] = newUrl;
        changed = true;
      }
    }

    let newImageUrl = product.image_url;
    if (isSupabaseUrl(newImageUrl)) {
      console.log(`  Product "${product.name}" main image:`);
      const newUrl = await uploadToCloudinary(newImageUrl, `products/${product.id}`);
      newImageUrl = newUrl;
      changed = true;
    }

    if (changed) {
      const { error: updateErr } = await supabase
        .from('products')
        .update({ images: newImages, image_url: newImageUrl, updated_at: new Date().toISOString() })
        .eq('id', product.id);
      if (updateErr) { console.error(`  ❌ Update failed:`, updateErr.message); }
      else { console.log(`  ✅ Product "${product.name}" updated\n`); migrated++; }
    }
  }

  // ── 2. Site content (hero bg + category images) ────────────────────────────
  console.log('── Site Content ──');
  const { data: siteRows, error: siteErr } = await supabase
    .from('site_content')
    .select('key, value');
  if (siteErr) { console.error('Site content query failed:', siteErr.message); process.exit(1); }

  for (const row of siteRows || []) {
    const val = row.value;
    if (!val || typeof val !== 'object') continue;

    let changed = false;
    let newVal = { ...val };

    // Hero bgImage
    if (row.key === 'hero' && isSupabaseUrl(newVal.bgImage)) {
      console.log(`  Hero bgImage:`);
      newVal.bgImage = await uploadToCloudinary(newVal.bgImage, 'site-content');
      changed = true;
    }

    // Category images (items object with slug → URL)
    if (row.key === 'category_images') {
      const items = { ...(newVal.items || newVal) };
      for (const [slug, url] of Object.entries(items)) {
        if (isSupabaseUrl(url)) {
          console.log(`  Category "${slug}":`);
          items[slug] = await uploadToCloudinary(url, `site-content/${slug}`);
          changed = true;
        }
      }
      if (newVal.items) {
        newVal.items = items;
      } else {
        newVal = items;
      }
    }

    if (changed) {
      const { error: updateErr } = await supabase
        .from('site_content')
        .upsert({ key: row.key, value: newVal, updated_at: new Date().toISOString() }, { onConflict: 'key' });
      if (updateErr) { console.error(`  ❌ ${row.key} update failed:`, updateErr.message); }
      else { console.log(`  ✅ "${row.key}" updated\n`); migrated++; }
    }
  }

  console.log(`\n=== Migration complete. ${migrated} records updated ===`);
}

main().catch(console.error);
