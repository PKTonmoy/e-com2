/**
 * Cloudinary Configuration
 * Cloud-based image storage for persistent uploads
 */

import { v2 as cloudinary } from 'cloudinary';

// Check if Cloudinary credentials are configured
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
    console.warn('[Cloudinary] WARNING: Missing Cloudinary credentials!');
    console.warn('[Cloudinary] CLOUDINARY_CLOUD_NAME:', cloudName ? 'SET' : 'MISSING');
    console.warn('[Cloudinary] CLOUDINARY_API_KEY:', apiKey ? 'SET' : 'MISSING');
    console.warn('[Cloudinary] CLOUDINARY_API_SECRET:', apiSecret ? 'SET' : 'MISSING');
} else {
    console.log('[Cloudinary] Configured with cloud name:', cloudName);
}

cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
});

export default cloudinary;
