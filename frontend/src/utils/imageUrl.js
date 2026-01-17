/**
 * Image URL Utility with Cloudinary Optimization
 * Handles both external URLs (Cloudinary) and local uploads
 * Automatically applies responsive image transformations
 */

/**
 * Cloudinary URL transformation helper
 * Adds optimization parameters to Cloudinary URLs
 * 
 * @param {string} url - Original Cloudinary URL
 * @param {object} options - Transformation options
 * @returns {string} - Optimized URL
 */
const applyCloudinaryTransformations = (url, options = {}) => {
    const {
        width,           // Resize width
        height,          // Resize height
        quality = 'auto', // Auto quality
        format = 'auto',  // Auto format (WebP/AVIF)
        crop = 'limit',   // Crop mode: limit = scale down, never up
    } = options;

    // Check if it's a Cloudinary URL
    if (!url.includes('res.cloudinary.com')) {
        return url;
    }

    // Build transformation string
    const transforms = [];

    if (width) transforms.push(`w_${width}`);
    if (height) transforms.push(`h_${height}`);
    if (crop) transforms.push(`c_${crop}`);
    if (quality) transforms.push(`q_${quality}`);
    if (format) transforms.push(`f_${format}`);

    // Add progressive loading for JPEGs
    transforms.push('fl_progressive');

    if (transforms.length === 0) {
        return url;
    }

    const transformString = transforms.join(',');

    // Insert transformations into Cloudinary URL
    // URL format: https://res.cloudinary.com/cloud_name/image/upload/v123/folder/image.jpg
    // Becomes:    https://res.cloudinary.com/cloud_name/image/upload/w_400,q_auto,f_auto/v123/folder/image.jpg
    return url.replace(
        '/image/upload/',
        `/image/upload/${transformString}/`
    );
};

/**
 * Get image URL with automatic optimization
 * @param {string} url - Original image URL
 * @param {object} options - Optional: { width, height, quality, format }
 * @returns {string} - Optimized URL
 */
export const getImageUrl = (url, options = {}) => {
    if (!url) return '';

    // If it's a Cloudinary URL, apply transformations
    if (url.includes('res.cloudinary.com')) {
        return applyCloudinaryTransformations(url, options);
    }

    // If it's an absolute URL (non-Cloudinary), return as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

    // For relative paths like /uploads/...
    const apiUrl = import.meta.env.VITE_API_URL;

    if (apiUrl) {
        const baseUrl = apiUrl.replace(/\/api$/, '');
        return `${baseUrl}${url}`;
    }

    return url;
};

/**
 * Get optimized thumbnail URL (small size for grids/lists)
 * @param {string} url - Original image URL
 * @returns {string} - Thumbnail URL (400px wide)
 */
export const getThumbnailUrl = (url) => {
    return getImageUrl(url, { width: 400 });
};

/**
 * Get optimized product card URL (medium size)
 * @param {string} url - Original image URL
 * @returns {string} - Card image URL (800px wide)
 */
export const getCardImageUrl = (url) => {
    return getImageUrl(url, { width: 800 });
};

/**
 * Get optimized full-size image URL (for product detail pages)
 * @param {string} url - Original image URL
 * @returns {string} - Full size URL (1200px wide)
 */
export const getFullImageUrl = (url) => {
    return getImageUrl(url, { width: 1200 });
};

/**
 * Get srcset for responsive images
 * @param {string} url - Original image URL
 * @returns {string} - srcset attribute value
 */
export const getImageSrcSet = (url) => {
    if (!url || !url.includes('res.cloudinary.com')) {
        return '';
    }

    return [
        `${getImageUrl(url, { width: 400 })} 400w`,
        `${getImageUrl(url, { width: 800 })} 800w`,
        `${getImageUrl(url, { width: 1200 })} 1200w`,
    ].join(', ');
};
