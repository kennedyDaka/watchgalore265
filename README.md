# WatchGalore265 — Luxury Accessories Ecommerce Platform

Malawi's premium WhatsApp-integrated accessories store.  
Built with **Next.js 14**, **Supabase**, and deployed on **Vercel**.

---

## ✅ Current Status

| Item | Status |
|------|--------|
| Supabase project | ✅ Live (`hiqpwgyqonyrnztilgxg`) |
| Database tables | ✅ Created (products, orders, categories, promotions) |
| Sample products | ✅ 6 products seeded (watches, wallets, belts) |
| RLS policies | ✅ Configured |
| `.env.local` | ✅ Pre-filled — ready to run |

**You just need to:** create your admin user, then deploy to Vercel.

---

## Step 1 — Create Your Admin User

1. Open [Supabase Dashboard → Authentication → Users](https://supabase.com/dashboard/project/hiqpwgyqonyrnztilgxg/auth/users)
2. Click **"Add User" → "Create New User"**
3. Enter:
   - **Email:** `admin@watchgalore265.com`
   - **Password:** Choose a strong password (save it!)
4. Click **Create User** and **copy the User ID** that appears

5. Back in Supabase, open the **SQL Editor** and run:
   ```sql
   -- Replace the UUID below with your actual admin user ID
   INSERT INTO public.user_roles (user_id, role)
   VALUES ('PASTE-YOUR-USER-UUID-HERE', 'admin');
   ```

This gives your login full admin access to orders, products, and stock.

---

## Step 2 — Run Locally

```bash
# Install dependencies
npm install

# .env.local is already pre-filled with your Supabase URL + anon key
# Just update NEXT_PUBLIC_WHATSAPP_NUMBER with your real number

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — your store is running.  
Open [http://localhost:3000/admin/dashboard](http://localhost:3000/admin/dashboard) — admin dashboard.

---

## Step 3 — Deploy to Vercel

### Option A — GitHub (Recommended)

```bash
# 1. Create a GitHub repo at github.com → New → "watchgalore265"

# 2. Push code
git init
git add .
git commit -m "WatchGalore265 — initial deployment"
git remote add origin https://github.com/YOUR_USERNAME/watchgalore265.git
git push -u origin main
```

3. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo
4. Add these **Environment Variables** in Vercel settings:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://hiqpwgyqonyrnztilgxg.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(copy from `.env.local`)* |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Your WhatsApp number (e.g. `265993XXXXXX`) |
| `NEXT_PUBLIC_ADMIN_EMAIL` | `admin@watchgalore265.com` |

5. Click **Deploy** — live in ~90 seconds!

### Option B — Vercel CLI

```bash
npm i -g vercel
vercel
# Follow prompts, then add env vars:
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add NEXT_PUBLIC_WHATSAPP_NUMBER
vercel env add NEXT_PUBLIC_ADMIN_EMAIL
vercel --prod
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx              # Homepage (hero, categories, featured products)
│   ├── shop/page.tsx         # The Collection — search, filter, sort
│   ├── product/[id]/         # Product detail with image gallery + WhatsApp reserve
│   ├── checkout/             # 3-step WhatsApp checkout
│   └── admin/
│       ├── login/            # Admin login page
│       └── dashboard/        # Dashboard: orders, products, stock, promotions
├── components/
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   ├── ProductCard.tsx
│   ├── WhatsAppButton.tsx    # Floating WhatsApp FAB
│   └── admin/
│       ├── OrdersTab.tsx     # View + manage orders, update status
│       ├── ProductsTab.tsx   # Full product CRUD + image upload
│       ├── StockTab.tsx      # Quick stock level editor
│       ├── PromotionsTab.tsx # WhatsApp promo message generator
│       └── CategoriesTab.tsx # Category stats and inventory values
├── context/CartContext.tsx   # Global cart (persisted to localStorage)
└── lib/
    ├── supabase.ts           # All database queries (schema-adapted)
    └── types.ts              # TypeScript types
```

---

## 🛒 WhatsApp Checkout Flow

1. Customer browses → adds to cart → proceeds to checkout
2. Fills in name, phone, delivery location
3. Selects delivery method (same day / pickup / standard)
4. Reviews order summary
5. Clicks **"Place Order on WhatsApp"** → WhatsApp opens with:

```
Hello WatchGalore265 👋

I would like to place an order:

ORDER #WG265-4821

1. Black Chronograph Watch x1 — MK105,000

Subtotal: MK105,000
Delivery (Same Day Delivery): MK2,000
Total: MK107,000

Customer Details:
Name: Kennedy Daka
Location: Lilongwe, Area 3
Phone: 0993XXXXXX

Delivery Method:
Same Day Delivery

Thank you.
```

The order is also saved to your Supabase `orders` table automatically.

---

## ⚙️ Customisation

### Change WhatsApp Number
Update `NEXT_PUBLIC_WHATSAPP_NUMBER` in Vercel environment variables.  
Format: `265993XXXXXX` (no `+`, no spaces)

### Change Delivery Fees
Edit `DELIVERY_OPTIONS` in `src/app/checkout/page.tsx`:
```ts
{ value: 'same_day', fee: 2000, ... }  // MK 2,000
{ value: 'pickup',   fee: 0,    ... }  // Free
{ value: 'standard', fee: 3000, ... }  // MK 3,000
```

### Add Products
Log in to `/admin/dashboard` → Products tab → **Add Product** button.  
Or insert directly via Supabase SQL Editor.

### Social Media Links
Update Instagram/Facebook URLs in `src/components/Footer.tsx`.

---

## 🗄️ Database Schema

| Table | Purpose |
|-------|---------|
| `products` | All products with prices, images, stock, category |
| `orders` | WhatsApp checkout orders |
| `categories` | watches / wallets / belts |
| `promotions` | Featured promotional banners |
| `user_roles` | Admin role assignments |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 App Router |
| Styling | Tailwind CSS |
| Database + Auth | Supabase (PostgreSQL + RLS) |
| Storage | Supabase Storage (product images) |
| Hosting | Vercel |
| State | React Context + localStorage |
| Icons | Lucide React |

---

*© 2026 WatchGalore265 · Crafted in Malawi · Powered by Operon Systems*
