/**
 * Utility to normalize image URLs
 * Handles both external URLs (https://...) and local uploads (/uploads/...)
 */
const API_BASE = import.meta.env.VITE_API_URL || 'https://prelux-store.onrender.com';

export const getImageUrl = (url) => {
    if (!url) return '';
    // If it's an absolute URL, return as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    // If it's a relative path (like /uploads/...), prepend API base
    return `${API_BASE}${url}`;
};
