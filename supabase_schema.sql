-- ============================================================
-- WatchGalore265 — Supabase Database Schema
-- Aligned with src/lib/supabase.ts expectations
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Categories Table ─────────────────────────────────────────
create table if not exists public.categories (
  id   uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  name text not null
);

-- ─── Products Table ───────────────────────────────────────────
create table if not exists public.products (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  description     text default '',
  tagline         text default '',
  category_id     uuid references public.categories(id) on delete set null,
  price           integer not null check (price >= 0),
  brand           text,
  stock_quantity  integer not null default 0 check (stock_quantity >= 0),
  in_stock        boolean not null default false,
  featured        boolean not null default false,
  images          text[] default '{}',
  colors          text[] default '{}',
  image_url       text,
  slug            text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ─── Orders Table ─────────────────────────────────────────────
create table if not exists public.orders (
  id                uuid primary key default uuid_generate_v4(),
  order_code        text not null unique,
  customer_name     text not null,
  customer_phone    text not null,
  customer_location text not null,
  notes             text,
  items             jsonb not null default '[]',
  subtotal          integer not null default 0,
  total             integer not null check (total >= 0),
  delivery_method   text not null check (delivery_method in ('same_day', 'pickup', 'standard')),
  delivery_fee      integer not null default 0,
  status            text not null default 'pending'
                      check (status in ('pending', 'confirmed', 'processing', 'delivered', 'cancelled')),
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ─── Site Content (editable homepage) ─────────────────────────
create table if not exists public.site_content (
  key        text primary key,
  value      jsonb not null default '{}',
  updated_at timestamptz default now()
);

-- ─── Indexes ──────────────────────────────────────────────────
create index if not exists products_category_idx    on public.products(category_id);
create index if not exists products_featured_idx    on public.products(featured);
create index if not exists products_in_stock_idx    on public.products(in_stock);
create index if not exists orders_status_idx        on public.orders(status);
create index if not exists orders_created_idx       on public.orders(created_at desc);

-- ─── Row Level Security ───────────────────────────────────────
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.site_content enable row level security;

-- Categories: anyone can read
create policy "Public can read categories"
  on public.categories for select
  using (true);

-- Categories: only authenticated admins can write
create policy "Admins can insert categories"
  on public.categories for insert
  with check (auth.role() = 'authenticated');

create policy "Admins can update categories"
  on public.categories for update
  using (auth.role() = 'authenticated');

create policy "Admins can delete categories"
  on public.categories for delete
  using (auth.role() = 'authenticated');

-- Products: anyone can read (public catalog)
create policy "Public can read products"
  on public.products for select
  using (true);

-- Products: only authenticated admins can write
create policy "Admins can insert products"
  on public.products for insert
  with check (auth.role() = 'authenticated');

create policy "Admins can update products"
  on public.products for update
  using (auth.role() = 'authenticated');

create policy "Admins can delete products"
  on public.products for delete
  using (auth.role() = 'authenticated');

-- Orders: anyone can create (checkout flow)
create policy "Anyone can create orders"
  on public.orders for insert
  with check (true);

-- Orders: only authenticated admins can read/update
create policy "Admins can read orders"
  on public.orders for select
  using (auth.role() = 'authenticated');

create policy "Admins can update orders"
  on public.orders for update
  using (auth.role() = 'authenticated');

-- Site Content: anyone can read, admins can write
create policy "Public can read site content"
  on public.site_content for select
  using (true);

create policy "Admins can upsert site content"
  on public.site_content for insert
  with check (auth.role() = 'authenticated');

create policy "Admins can update site content"
  on public.site_content for update
  using (auth.role() = 'authenticated');

create policy "Admins can delete site content"
  on public.site_content for delete
  using (auth.role() = 'authenticated');

-- ─── Storage Bucket ───────────────────────────────────────────
insert into storage.buckets (id, name, public)
  values ('product-images', 'product-images', true)
  on conflict (id) do nothing;

create policy "Anyone can view product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "Admins can upload product images"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and auth.role() = 'authenticated');

create policy "Admins can delete product images"
  on storage.objects for delete
  using (bucket_id = 'product-images' and auth.role() = 'authenticated');

-- ─── Seed Categories ──────────────────────────────────────────
insert into public.categories (slug, name) values
  ('watches', 'Watches'),
  ('wallets', 'Wallets'),
  ('belts',  'Belts')
on conflict (slug) do nothing;

-- ─── Seed Products ────────────────────────────────────────────
-- Uses category_id resolved from the categories table
do $$
declare
  w_id uuid;  -- watches
  a_id uuid;  -- wallets
  b_id uuid;  -- belts
begin
  select id into w_id from public.categories where slug = 'watches';
  select id into a_id from public.categories where slug = 'wallets';
  select id into b_id from public.categories where slug = 'belts';

  insert into public.products (name, description, tagline, category_id, price, images, image_url, stock_quantity, in_stock, featured, brand, slug) values
    (
      'Black Chronograph Watch',
      'A precision-engineered chronograph with a bold matte black dial. Features sapphire crystal glass, 100m water resistance, and a genuine leather strap. The perfect statement piece for the modern professional.',
      '',
      w_id, 105000,
      ARRAY['https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=600&q=80'],
      'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=600&q=80',
      5, true, true, 'Rolex',
      'black-chronograph-watch-' || extract(epoch from now())::text
    ),
    (
      'Classic Silver Dress Watch',
      'Timeless elegance with a silver case and white dial. Swiss movement, scratch-resistant mineral crystal, and stainless steel bracelet. Versatile enough for boardrooms and formal events.',
      '',
      w_id, 85000,
      ARRAY['https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=600&q=80'],
      'https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=600&q=80',
      3, true, true, 'Tissot',
      'classic-silver-dress-watch-' || extract(epoch from now())::text
    ),
    (
      'Brown Leather Bifold Wallet',
      'Handcrafted from full-grain brown leather with a clean, slim profile. Features 6 card slots, 2 bill compartments, and RFID blocking technology. Develops a beautiful patina over time.',
      '',
      a_id, 25000,
      ARRAY['https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&q=80'],
      'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&q=80',
      10, true, true, 'Montblanc',
      'brown-leather-bifold-wallet-' || extract(epoch from now())::text
    ),
    (
      'Black Leather Slim Wallet',
      'Ultra-slim design crafted from top-grain Italian leather. Holds up to 8 cards and cash. The minimalist choice for the man who values style and function.',
      '',
      a_id, 18000,
      ARRAY['https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=600&q=80'],
      'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=600&q=80',
      8, true, false, null,
      'black-leather-slim-wallet-' || extract(epoch from now())::text
    ),
    (
      'Classic Black Leather Belt',
      'Premium full-grain leather belt with polished silver buckle. 35mm width, suitable for formal and smart-casual wear. Available in waist sizes 30–44 inches.',
      '',
      b_id, 15000,
      ARRAY['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80'],
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80',
      12, true, true, null,
      'classic-black-leather-belt-' || extract(epoch from now())::text
    ),
    (
      'Brown Reversible Belt',
      'Two-in-one reversible belt — black on one side, rich cognac brown on the other. Single-prong buckle with easy-release mechanism. Full-grain leather construction.',
      '',
      b_id, 20000,
      ARRAY['https://images.unsplash.com/photo-1618932260643-eee4a2f652a6?w=600&q=80'],
      'https://images.unsplash.com/photo-1618932260643-eee4a2f652a6?w=600&q=80',
      7, true, false, null,
      'brown-reversible-belt-' || extract(epoch from now())::text
    );
end $$;

-- ─── Create admin user ─────────────────────────────────────────
-- After running this schema, go to:
-- Supabase Dashboard > Authentication > Users > Add User
-- Email: admin@watchgalore265.com
-- Password: (choose a strong password)

-- ─── Default Site Content ──────────────────────────────────────
insert into public.site_content (key, value) values
  ('hero', '{"badge":"Free Same-Day Delivery in Lilongwe","heading":"Wear Time. Define Style.","subtitle":"Hand-picked watches, wallets and belts for the modern Malawian gentleman. Order in minutes via WhatsApp.","bgImage":"https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=1800&q=80"}'),
  ('promo_banner', '{"items":["Free Same-Day Delivery in Lilongwe","Premium Quality Guaranteed","Secure WhatsApp Checkout","Authentic Products Only"]}'),
  ('trust', '{"items":[{"title":"Same-Day Delivery","desc":"Available in Lilongwe. Order before 2PM."},{"title":"Authenticity Guaranteed","desc":"100% genuine products. No counterfeits."},{"title":"WhatsApp Support","desc":"Chat with us anytime for order support."}]}'),
  ('testimonials', '{"items":[{"name":"James M.","location":"Lilongwe","text":"The chronograph I ordered arrived perfectly packaged. Quality is outstanding for the price. Will order again!","stars":5},{"name":"David K.","location":"Blantyre","text":"Ordering via WhatsApp was so easy. Got my watch the same day. Very impressed with the service.","stars":5},{"name":"Chris P.","location":"Mzuzu","text":"Bought a wallet as a gift for my brother. He loved it. Looks very premium and leather quality is great.","stars":5}]}'),
  ('cta', '{"heading":"Ready to Elevate Your Style?","subtitle":"Browse our collection and place your order directly on WhatsApp in minutes."}')
on conflict (key) do nothing;
-- ============================================================
