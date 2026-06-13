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
  delivery_method   text not null,
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

-- ─── How to create the admin user ──────────────────────────────
-- Go to: Supabase Dashboard → Authentication → Users → Add User
-- Email: admin@watchgalore265.com
-- Password: (choose a strong password)

-- ─── ⚠️ Migration required for existing databases ═══════════════
-- The CHECK constraint on delivery_method was removed to support
-- custom delivery methods added via PromotionsTab.
-- If you already ran the old schema, run this in SQL Editor:
--
--   alter table public.orders
--     drop constraint if exists orders_delivery_method_check;
--
-- ============================================================
