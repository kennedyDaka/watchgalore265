import { createClient, Session } from '@supabase/supabase-js';
import { uploadToCloudinary } from '@/lib/cloudinary';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
);

// Ensure the client has a valid session before write operations.
// Refreshes the session if expired and throws a clear error if not authenticated.
async function requireAuth(): Promise<Session> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw new Error(`Session error: ${sessionError.message}`);
  if (!session) throw new Error('Not authenticated — please sign in again.');

  // If the access token is expired, attempt a refresh
  const expiresAt = session.expires_at ?? 0;
  const now = Math.floor(Date.now() / 1000);
  if (expiresAt - now < 60) {
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError || !refreshed.session) {
      throw new Error('Session expired — please sign in again.');
    }
    return refreshed.session;
  }

  return session;
}

// ─── Helper: normalise DB row → Product shape ─────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeProduct(row: any) {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    tagline: row.tagline || '',
    // category slug comes from the joined categories table
    category: row.categories?.slug || row.category_slug || '',
    category_name: row.categories?.name || '',
    price: row.price,
    // prefer multi-image array; fall back to image_url
    images: row.images?.length ? row.images : (row.image_url ? [row.image_url] : []),
    colors: row.colors || [],
    stock: row.stock_quantity ?? 0,
    featured: row.featured,
    brand: row.brand || null,
    created_at: row.created_at,
    slug: row.slug,
  };
}

// ─── Products ──────────────────────────────────────────────────────────────

export async function getProducts(category?: string, search?: string, sort?: string) {
  let query = supabase
    .from('products')
    .select('*, categories(slug, name)')
    .eq('in_stock', true)
    .gt('stock_quantity', 0);

  if (category && category !== 'all') {
    // Filter by joining category slug
    const { data: cats } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', category)
      .single();
    if (cats?.id) {
      query = query.eq('category_id', cats.id);
    }
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,brand.ilike.%${search}%`);
  }

  switch (sort) {
    case 'price_asc':  query = query.order('price', { ascending: true }); break;
    case 'price_desc': query = query.order('price', { ascending: false }); break;
    case 'popular':    query = query.order('featured', { ascending: false }); break;
    default:           query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(normalizeProduct);
}

export async function getProductById(id: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(slug, name)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return normalizeProduct(data);
}

export async function getFeaturedProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(slug, name)')
    .eq('featured', true)
    .eq('in_stock', true)
    .gt('stock_quantity', 0)
    .order('created_at', { ascending: false })
    .limit(6);
  if (error) throw error;
  return (data || []).map(normalizeProduct);
}

export async function getCategoryProductImages(): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('products')
    .select('category_id, images, categories(slug)')
    .eq('in_stock', true)
    .gt('stock_quantity', 0)
    .order('created_at', { ascending: false });
  if (error) throw error;

  const result: Record<string, string> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const row of (data || []) as any[]) {
    const slug = row.categories?.slug;
    if (slug && row.images?.length > 0 && !result[slug]) {
      result[slug] = row.images[0];
    }
  }
  return result;
}

// ─── Orders ───────────────────────────────────────────────────────────────

export async function createOrder(orderData: {
  order_id: string;
  customer_name: string;
  phone: string;
  location: string;
  delivery_notes?: string;
  products: object[];
  total: number;
  delivery_method: string;
  delivery_fee: number;
  status: string;
}) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const res = await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    if (res.ok) return await res.json();
    if (attempt === 1) {
      await new Promise(r => setTimeout(r, 500));
    } else {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || res.statusText);
    }
  }
}

export async function getOrders(status?: string) {
  let query = supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    if (status === 'delivered') {
      query = query.eq('status', 'delivered');
    } else {
      query = query.eq('status', status);
    }
  }

  const { data, error } = await query;
  if (error) throw error;

  // Normalize column names for our components
  return (data || []).map((row) => ({
    id: row.id,
    order_id: row.order_code,
    customer_name: row.customer_name,
    phone: row.customer_phone,
    location: row.customer_location,
    delivery_notes: row.notes,
    products: row.items || [],
    total: row.total,
    delivery_fee: row.delivery_fee,
    delivery_method: row.delivery_method,
    status: row.status,
    created_at: row.created_at,
  }));
}

export async function updateOrderStatus(id: string, status: string) {
  const { error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

// ─── Admin — Products CRUD ────────────────────────────────────────────────

export async function getAllProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(slug, name)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(normalizeProduct);
}

async function ensureCategory(slug: string): Promise<string | null> {
  const { data: cat } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', slug)
    .single();
  if (cat?.id) return cat.id;

  const displayName = slug.charAt(0).toUpperCase() + slug.slice(1);
  const { data: created } = await supabase
    .from('categories')
    .insert([{ slug, name: displayName }])
    .select('id')
    .single();
  return created?.id || null;
}

export async function createProduct(productData: {
  name: string;
  description: string;
  category: string;
  price: number;
  brand?: string | null;
  stock: number;
  featured: boolean;
  images: string[];
  colors?: string[];
}) {
  await requireAuth();
  const categoryId = await ensureCategory(productData.category);

  const slug = productData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const payload = {
    name: productData.name,
    description: productData.description,
    category_id: categoryId,
    price: productData.price,
    brand: productData.brand || null,
    stock_quantity: productData.stock,
    in_stock: productData.stock > 0,
    featured: productData.featured,
    images: productData.images,
    image_url: productData.images[0] || null,
    slug: `${slug}-${Date.now()}`,
    tagline: '',
    colors: productData.colors || [],
  };

  const { data, error } = await supabase
    .from('products')
    .insert([payload])
    .select('*, categories(slug, name)')
    .single();
  if (error) throw error;
  return normalizeProduct(data);
}

export async function updateProduct(id: string, productData: {
  name?: string;
  description?: string;
  category?: string;
  price?: number;
  brand?: string | null;
  stock?: number;
  featured?: boolean;
  images?: string[];
  colors?: string[];
}) {
  await requireAuth();
  const updates: Record<string, unknown> = {};

  if (productData.name !== undefined) updates.name = productData.name;
  if (productData.description !== undefined) updates.description = productData.description;
  if (productData.price !== undefined) updates.price = productData.price;
  if (productData.brand !== undefined) updates.brand = productData.brand;
  if (productData.featured !== undefined) updates.featured = productData.featured;
  if (productData.images !== undefined) {
    updates.images = productData.images;
    updates.image_url = productData.images[0] || null;
  }
  if (productData.colors !== undefined) updates.colors = productData.colors;
  if (productData.stock !== undefined) {
    updates.stock_quantity = productData.stock;
    updates.in_stock = productData.stock > 0;
  }
  if (productData.category !== undefined) {
    const categoryId = await ensureCategory(productData.category);
    if (categoryId) updates.category_id = categoryId;
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select('*, categories(slug, name)')
    .single();
  if (error) throw error;
  return normalizeProduct(data);
}

export async function deleteCloudinaryImages(urls: string[]) {
  const cloudinaryUrls = urls.filter(u => u && u.includes('res.cloudinary.com'));
  if (cloudinaryUrls.length === 0) return;

  const res = await fetch('/api/delete-images', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls: cloudinaryUrls }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || `Failed to delete images (${res.status})`);
  }
}

export async function deleteProduct(id: string) {
  await requireAuth();

  const { data: product } = await supabase
    .from('products')
    .select('images')
    .eq('id', id)
    .single();

  if (product?.images?.length) {
    await deleteCloudinaryImages(product.images).catch(() => {});
  }

  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

export async function bulkDeleteProducts(ids: string[]) {
  await requireAuth();
  if (ids.length === 0) return;

  const { data: products } = await supabase
    .from('products')
    .select('id, images')
    .in('id', ids);

  const allUrls = (products || []).flatMap(p => p.images || []);
  if (allUrls.length) {
    await deleteCloudinaryImages(allUrls).catch(() => {});
  }

  const { error } = await supabase.from('products').delete().in('id', ids);
  if (error) throw error;
}

// ─── Categories ──────────────────────────────────────────────

async function supabaseFetch(path: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const res = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Supabase fetch ${res.status}: ${res.statusText}`);
  return res.json();
}

export async function getCategories() {
  return supabaseFetch('categories?select=id,slug,name,sort_order,created_at&order=name.asc');
}

export async function createCategory(slug: string, name: string) {
  await requireAuth();
  const { data, error } = await supabase
    .from('categories')
    .insert([{ slug, name }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCategory(id: string) {
  await requireAuth();
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function updateCategory(id: string, data: { name?: string }) {
  await requireAuth();
  const { error } = await supabase
    .from('categories')
    .update(data)
    .eq('id', id);
  if (error) throw error;
}

export async function uploadProductImage(file: File, productId: string) {
  return uploadToCloudinary(file, `products/${productId}`);
}

/**
 * Immediately persist a single image URL to the product row,
 * so the URL is never lost even if the final "Save" fails.
 * Throws on error so the caller can show a retry UI.
 */
export async function appendProductImage(productId: string, url: string) {
  await requireAuth();
  const { data, error: fetchError } = await supabase
    .from('products')
    .select('images')
    .eq('id', productId)
    .single();
  if (fetchError) throw fetchError;

  const current: string[] = data?.images || [];
  if (current.includes(url)) return; // already persisted

  const { error: updateError } = await supabase
    .from('products')
    .update({
      images: [...current, url],
      image_url: current[0] || url,
    })
    .eq('id', productId);
  if (updateError) throw updateError;
}

/**
 * Auto-create a minimal draft product so we have a real ID
 * to attach images to before the user does the final save.
 */
export async function createDraftProduct(draft: {
  name: string;
  category?: string;
  price?: number;
  stock?: number;
}) {
  await requireAuth();
  let categoryId: string | null = null;
  if (draft.category) {
    categoryId = await ensureCategory(draft.category);
  }

  const slug =
    draft.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '') || 'draft';

  const { data, error } = await supabase
    .from('products')
    .insert([
      {
        name: draft.name,
        slug: `${slug}-${Date.now()}`,
        category_id: categoryId,
        price: draft.price ?? 0,
        stock_quantity: draft.stock ?? 0,
        in_stock: (draft.stock ?? 0) > 0,
        featured: false,
        images: [],
        colors: [],
        tagline: '',
      },
    ])
    .select('id, name')
    .single();
  if (error) throw error;
  return data as { id: string; name: string };
}

/**
 * Split selected images out of a product into a new product.
 * The images are MOVED (removed from the original).
 */
export async function splitProductImages(
  originalId: string,
  imagesToMove: string[],
  newProduct: {
    name: string;
    description: string;
    category: string;
    price: number;
    brand?: string | null;
    stock: number;
    featured: boolean;
    colors?: string[];
  }
) {
  await requireAuth();

  // 1. Read original product
  const { data: original, error: readError } = await supabase
    .from('products')
    .select('images')
    .eq('id', originalId)
    .single();
  if (readError) throw readError;

  const remainingImages = (original?.images || []).filter(
    (img: string) => !imagesToMove.includes(img)
  );

  // 2. Create new product with moved images
  const categoryId = await ensureCategory(newProduct.category);
  const slug =
    newProduct.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '') || 'split';

  const { error: insertError } = await supabase.from('products').insert([
    {
      name: newProduct.name,
      description: newProduct.description,
      category_id: categoryId,
      price: newProduct.price,
      brand: newProduct.brand || null,
      stock_quantity: newProduct.stock,
      in_stock: newProduct.stock > 0,
      featured: newProduct.featured,
      images: imagesToMove,
      image_url: imagesToMove[0] || null,
      slug: `${slug}-${Date.now()}`,
      tagline: '',
      colors: newProduct.colors || [],
    },
  ]);
  if (insertError) throw insertError;

  // 3. Update original product — remove moved images
  const { error: updateError } = await supabase
    .from('products')
    .update({
      images: remainingImages,
      image_url: remainingImages[0] || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', originalId);
  if (updateError) throw updateError;
}

// ─── Site Content (editable homepage) ────────────────────────────

export async function getSiteContent(): Promise<Record<string, unknown>> {
  try {
    const { data, error } = await supabase
      .from('site_content')
      .select('key, value, updated_at');
    if (error) {
      console.error('getSiteContent error:', error.message);
      return {};
    }
    const map: Record<string, unknown> = {};
    let latestUpdate = '';
    (data || []).forEach((row: { key: string; value: unknown; updated_at?: string }) => {
      map[row.key] = row.value;
      if (row.updated_at && row.updated_at > latestUpdate) latestUpdate = row.updated_at;
    });
    map._updatedAt = latestUpdate;
    return map;
  } catch (e) {
    console.error('getSiteContent failed:', e);
    return {};
  }
}

export async function getSiteContentKey(key: string): Promise<unknown> {
  const { data, error } = await supabase
    .from('site_content')
    .select('value')
    .eq('key', key)
    .single();
  if (error) throw error;
  return data?.value ?? null;
}

export async function upsertSiteContent(key: string, value: Record<string, unknown>) {
  await requireAuth();
  const { data, error } = await supabase
    .from('site_content')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    .select();
  if (error) {
    console.error(`upsertSiteContent(${key}) error:`, error.message, error.details, error.hint);
    throw error;
  }
  if (!data || data.length === 0) {
    console.warn(`upsertSiteContent(${key}): no rows returned — RLS may be blocking the upsert`);
  }
}
