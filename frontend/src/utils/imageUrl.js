/**
 * Utility to normalize image URLs
 * Handles both external URLs (https://...) and local uploads (/uploads/...)
 */

export const getImageUrl = (url) => {
    if (!url) return '';

    // If it's an absolute URL, return as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

    // For relative paths like /uploads/...:
    // - In development: Vite proxy will forward /uploads to backend
    // - In production: VITE_API_URL should be set to prepend the backend URL

    // Check if we have a configured API URL for production
    const apiUrl = import.meta.env.VITE_API_URL;

    if (apiUrl) {
        // Production or explicitly configured - prepend the API URL
        // Remove /api suffix if present since uploads are at root
        const baseUrl = apiUrl.replace(/\/api$/, '');
        return `${baseUrl}${url}`;
    }

    // Development mode - just use relative path, Vite proxy handles it
    return url;
};
