import { createClient, Session } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
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
    category: row.categories?.slug || row.category_slug || 'watches',
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
  const payload = {
    order_code: orderData.order_id,
    customer_name: orderData.customer_name,
    customer_phone: orderData.phone,
    customer_location: orderData.location,
    notes: orderData.delivery_notes || '',
    items: orderData.products,
    subtotal: orderData.total - orderData.delivery_fee,
    total: orderData.total,
    delivery_method: orderData.delivery_method,
    delivery_fee: orderData.delivery_fee,
    status: orderData.status,
  };

  const { data, error } = await supabase
    .from('orders')
    .insert([payload])
    .select()
    .single();
  if (error) throw error;
  return data;
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
  // Resolve category slug → id
  const { data: cat } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', productData.category)
    .single();

  const slug = productData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const payload = {
    name: productData.name,
    description: productData.description,
    category_id: cat?.id || null,
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
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', productData.category)
      .single();
    if (cat) updates.category_id = cat.id;
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

export async function deleteProduct(id: string) {
  await requireAuth();
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

// ─── Categories ──────────────────────────────────────────────

export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');
  if (error) throw error;
  return data || [];
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

export async function uploadProductImage(file: File, productId: string) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${productId}-${Date.now()}.${fileExt}`;
  const { error } = await supabase.storage
    .from('product-images')
    .upload(fileName, file);
  if (error) throw error;

  const { data } = supabase.storage
    .from('product-images')
    .getPublicUrl(fileName);
  return data.publicUrl;
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
  const { error } = await supabase
    .from('site_content')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  if (error) throw error;
}
