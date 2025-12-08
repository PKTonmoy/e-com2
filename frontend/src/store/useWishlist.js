import { create } from 'zustand';
import api from '../lib/api.js';

export const useWishlist = create((set, get) => ({
    items: [],

    fetchWishlist: async () => {
        try {
            const res = await api.get('/wishlist');
            set({ items: res.data });
        } catch (err) {
            console.error('Failed to fetch wishlist:', err);
        }
    },

    addToWishlist: async (productId) => {
        try {
            await api.post(`/wishlist/${productId}`);
            get().fetchWishlist();
        } catch (err) {
            console.error('Failed to add to wishlist:', err);
        }
    },

    removeFromWishlist: async (productId) => {
        try {
            await api.delete(`/wishlist/${productId}`);
            get().fetchWishlist();
        } catch (err) {
            console.error('Failed to remove from wishlist:', err);
        }
    },

    isInWishlist: (productId) => {
        return get().items.some((item) => item._id === productId);
    },
}));
