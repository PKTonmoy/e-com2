import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api.js';

export const useCart = create(
  persist(
    (set, get) => ({
      items: [],
      setItems: (items) => set({ items }),
      addItem: (product, variantId, stock = null, selectedSize = null) => {
        const maxStock = stock ?? product.stock ?? 999;
        const existing = get().items.find(
          (i) => i.productId === product._id && i.variantId === variantId && i.selectedSize === selectedSize
        );

        // Check if already at max stock
        if (existing && existing.qty >= maxStock) {
          return { success: false, message: `Maximum stock (${maxStock}) reached` };
        }

        let next;
        if (existing) {
          next = get().items.map((i) =>
            i.productId === product._id && i.variantId === variantId && i.selectedSize === selectedSize
              ? { ...i, qty: Math.min(i.qty + 1, maxStock) }
              : i
          );
        } else {
          next = [
            ...get().items,
            {
              productId: product._id,
              variantId,
              qty: 1,
              price: product.salePrice || product.price,
              title: product.title,
              sku: product.sku,
              stock: maxStock,
              selectedSize,
              image: product.images?.[0],
              category: product.category,
            },
          ];
        }
        set({ items: next });
        return { success: true };
      },
      removeItem: (productId, variantId) => {
        const next = get().items.filter((i) => !(i.productId === productId && i.variantId === variantId));
        set({ items: next });
      },
      updateQty: (productId, variantId, newQty) => {
        const item = get().items.find((i) => i.productId === productId && i.variantId === variantId);
        if (!item) return { success: false };

        // Don't allow qty less than 1 or more than stock
        const maxStock = item.stock || 999;
        if (newQty < 1) return { success: false, message: 'Minimum quantity is 1' };
        if (newQty > maxStock) return { success: false, message: `Maximum stock (${maxStock}) reached` };

        const next = get().items.map((i) =>
          i.productId === productId && i.variantId === variantId ? { ...i, qty: newQty } : i
        );
        set({ items: next });
        return { success: true };
      },
      updateStock: (productId, variantId, newStock) => {
        const next = get().items.map((i) =>
          i.productId === productId && i.variantId === variantId ? { ...i, stock: newStock } : i
        );
        set({ items: next });
      },
      clearCart: () => set({ items: [], coupon: null }),
      syncToServer: async () => {
        const { items } = get();
        try {
          await api.put('/cart', { items });
        } catch (err) {
          console.warn('Cart sync failed', err.message);
        }
      },
      coupon: null,
      applyCoupon: (coupon) => set({ coupon }),
      removeCoupon: () => set({ coupon: null }),
    }),
    {
      name: 'prelux-cart', // localStorage key
      // Only persist items, NOT the coupon - coupon must be applied each session
      partialize: (state) => ({ items: state.items }),
    }
  )
);
