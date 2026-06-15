export type Category = string;

export interface Product {
  id: string;
  name: string;
  description: string;
  category: Category;
  price: number;
  images: string[];
  colors?: string[];
  stock: number;
  featured: boolean;
  brand?: string;
  created_at: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'delivered' | 'cancelled';
export type DeliveryMethod = string;

export interface OrderItem {
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Order {
  id: string;
  order_id: string;
  customer_name: string;
  phone: string;
  location: string;
  delivery_notes?: string;
  products: OrderItem[];
  total: number;
  delivery_method: DeliveryMethod;
  delivery_fee: number;
  status: OrderStatus;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  itemKey: string;
}

export interface CheckoutFormData {
  fullName: string;
  phone: string;
  location: string;
  deliveryNotes: string;
  deliveryMethod: DeliveryMethod;
}
