'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { CartItem, Product } from '@/lib/types';

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: 'ADD_ITEM'; product: Product; quantity?: number; itemKey?: string }
  | { type: 'REMOVE_ITEM'; itemKey: string }
  | { type: 'UPDATE_QUANTITY'; itemKey: string; quantity: number }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; items: CartItem[] };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const itemKey = action.itemKey || action.product.id;
      const existing = state.items.find(i => i.itemKey === itemKey);
      if (existing) {
        return {
          items: state.items.map(i =>
            i.itemKey === itemKey
              ? { ...i, quantity: i.quantity + (action.quantity || 1) }
              : i
          ),
        };
      }
      return { items: [...state.items, { product: action.product, quantity: action.quantity || 1, itemKey }] };
    }
    case 'REMOVE_ITEM':
      return { items: state.items.filter(i => i.itemKey !== action.itemKey) };
    case 'UPDATE_QUANTITY':
      if (action.quantity <= 0) {
        return { items: state.items.filter(i => i.itemKey !== action.itemKey) };
      }
      return {
        items: state.items.map(i =>
          i.itemKey === action.itemKey ? { ...i, quantity: action.quantity } : i
        ),
      };
    case 'CLEAR_CART':
      return { items: [] };
    case 'LOAD_CART':
      return { items: action.items };
    default:
      return state;
  }
}

interface CartContextValue {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, itemKey?: string) => void;
  removeItem: (itemKey: string) => void;
  updateQuantity: (itemKey: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  // Persist cart to localStorage
  useEffect(() => {
    const saved = localStorage.getItem('wg265_cart');
    if (saved) {
      try {
        const items: CartItem[] = JSON.parse(saved);
        // Migrate: add itemKey for items saved before itemKey existed
        const migrated = items.map(item => ({
          ...item,
          itemKey: item.itemKey || item.product.id,
        }));
        dispatch({ type: 'LOAD_CART', items: migrated });
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('wg265_cart', JSON.stringify(state.items));
  }, [state.items]);

  const addItem = (product: Product, quantity = 1, itemKey?: string) =>
    dispatch({ type: 'ADD_ITEM', product, quantity, itemKey });
  const removeItem = (itemKey: string) =>
    dispatch({ type: 'REMOVE_ITEM', itemKey });
  const updateQuantity = (itemKey: string, quantity: number) =>
    dispatch({ type: 'UPDATE_QUANTITY', itemKey, quantity });
  const clearCart = () => dispatch({ type: 'CLEAR_CART' });

  const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = state.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items: state.items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
