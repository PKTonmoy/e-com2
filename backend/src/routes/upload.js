/**
 * Image Upload Routes
 * Handles file uploads with multer and stores them in Cloudinary
 */

import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import cloudinary from '../config/cloudinary.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Configure multer to use memory storage (files stored in buffer)
const storage = multer.memoryStorage();

// File filter - only allow images
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WebP)'), false);
    }
};

// Configure multer
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
    }
});

/**
 * Upload buffer to Cloudinary
 */
const uploadToCloudinary = (buffer, options = {}) => {
    return new Promise((resolve, reject) => {
        console.log('[Cloudinary] Starting upload to Cloudinary...');
        console.log('[Cloudinary] Cloud name:', process.env.CLOUDINARY_CLOUD_NAME);
        console.log('[Cloudinary] API Key (first 8 chars):', process.env.CLOUDINARY_API_KEY?.substring(0, 8) + '...');

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'prelux',
                resource_type: 'image',
                // ============================================
                // AUTOMATIC IMAGE OPTIMIZATION
                // ============================================
                // These transformations reduce file size by 50-80%
                transformation: [
                    {
                        quality: 'auto:good',     // Smart quality optimization
                        fetch_format: 'auto',      // Serve WebP/AVIF to supported browsers
                        flags: 'progressive',      // Progressive loading (appears faster)
                    }
                ],
                // Eager transformations: pre-generate common sizes
                eager: [
                    { width: 400, crop: 'limit', quality: 'auto', fetch_format: 'auto' },  // Thumbnail
                    { width: 800, crop: 'limit', quality: 'auto', fetch_format: 'auto' },  // Product card
                    { width: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }, // Product detail
                ],
                eager_async: true, // Generate sizes in background
                ...options
            },
            (error, result) => {
                if (error) {
                    console.error('[Cloudinary] Upload stream error:', error);
                    reject(error);
                } else if (!result || !result.secure_url || !result.public_id) {
                    // Catch case where Cloudinary returns an incomplete response
                    console.error('[Cloudinary] Invalid response from Cloudinary:', result);
                    reject(new Error('Cloudinary returned an invalid response. Please check your API credentials.'));
                } else {
                    console.log('[Cloudinary] Upload successful:', result.public_id);
                    console.log('[Cloudinary] Secure URL:', result.secure_url);
                    resolve(result);
                }
            }
        );
        uploadStream.end(buffer);
    });
};

/**
 * Save buffer to local storage
 */
const saveLocally = async (buffer, mimetype) => {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Determine extension
    let ext = 'jpg';
    if (mimetype === 'image/png') ext = 'png';
    else if (mimetype === 'image/gif') ext = 'gif';
    else if (mimetype === 'image/webp') ext = 'webp';
    else if (mimetype === 'image/jpeg') ext = 'jpg';

    const filename = `local-${Date.now()}-${Math.round(Math.random() * 1E9)}.${ext}`;
    const filepath = path.join(uploadsDir, filename);

    await fs.promises.writeFile(filepath, buffer);

    // Return relative URL that server.js serves
    return {
        secure_url: `/uploads/${filename}`,
        public_id: filename
    };
};

/**
 * POST /api/upload
 * Upload a single image
 * Returns the Cloudinary URL to access the uploaded image
 */
router.post('/', protect, requireRole('staff', 'manager', 'admin'), upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }

        let result;
        const hasCloudinary = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;

        if (hasCloudinary) {
            // Upload to Cloudinary
            result = await uploadToCloudinary(req.file.buffer);
            console.log(`[Upload] Image uploaded to Cloudinary: ${result.public_id}`);
        } else {
            // Fallback to local
            console.log('[Upload] Cloudinary not configured, saving locally');
            result = await saveLocally(req.file.buffer, req.file.mimetype);
            console.log(`[Upload] Image saved locally: ${result.public_id}`);
        }

        res.json({
            success: true,
            url: result.secure_url,
            publicId: result.public_id,
            size: req.file.size,
            mimetype: req.file.mimetype
        });
    } catch (error) {
        console.error('[Upload] Upload error:', {
            message: error.message,
            name: error.name,
            http_code: error.http_code,
            error: error.error
        });
        res.status(500).json({
            message: 'Failed to upload image',
            error: error.message,
            details: error.http_code ? `Cloudinary error (${error.http_code})` : undefined
        });
    }
});

/**
 * POST /api/upload/multiple
 * Upload multiple images (max 10)
 */
router.post('/multiple', protect, requireRole('staff', 'manager', 'admin'), upload.array('images', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No image files provided' });
        }

        const hasCloudinary = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;

        // Upload all files
        const uploadPromises = req.files.map(file => {
            if (hasCloudinary) return uploadToCloudinary(file.buffer);
            return saveLocally(file.buffer, file.mimetype);
        });

        const results = await Promise.all(uploadPromises);

        const uploadedFiles = results.map((result, index) => ({
            url: result.secure_url,
            publicId: result.public_id,
            size: req.files[index].size
        }));

        console.log(`[Upload] ${uploadedFiles.length} images uploaded (${hasCloudinary ? 'Cloudinary' : 'Local'})`);

        res.json({
            success: true,
            files: uploadedFiles
        });
    } catch (error) {
        console.error('[Upload] Cloudinary upload error:', error);
        res.status(500).json({ message: 'Failed to upload images', error: error.message });
    }
});

/**
 * GET /api/upload/health
 * Check Cloudinary configuration and connectivity
 */
router.get('/health', protect, requireRole('staff', 'manager', 'admin'), async (req, res) => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    const config = {
        cloudName: cloudName || 'NOT SET',
        apiKey: apiKey ? apiKey.substring(0, 8) + '...' + apiKey.slice(-4) : 'NOT SET',
        apiSecret: apiSecret ? '***SET***' : 'NOT SET',
        isConfigured: !!(cloudName && apiKey && apiSecret)
    };

    if (!config.isConfigured) {
        return res.json({
            status: 'error',
            message: 'Cloudinary credentials not configured',
            config
        });
    }

    try {
        // Try to ping Cloudinary API
        const result = await cloudinary.api.ping();
        res.json({
            status: 'ok',
            message: 'Cloudinary is properly configured and connected',
            config,
            ping: result
        });
    } catch (error) {
        res.json({
            status: 'error',
            message: error.message,
            config,
            errorCode: error.http_code
        });
    }
});

/**
 * DELETE /api/upload/:publicId
 * Delete an uploaded image from Cloudinary
 * Note: publicId should be URL-encoded if it contains slashes
 */
router.delete('/:publicId(*)', protect, requireRole('staff', 'manager', 'admin'), async (req, res) => {
    try {
        const { publicId } = req.params;

        const result = await cloudinary.uploader.destroy(publicId);

        if (result.result === 'ok') {
            console.log(`[Upload] Image deleted from Cloudinary: ${publicId}`);
            res.json({ success: true, message: 'Image deleted' });
        } else {
            res.status(404).json({ message: 'Image not found or already deleted' });
        }
    } catch (error) {
        console.error('[Upload] Cloudinary delete error:', error);
        res.status(500).json({ message: 'Failed to delete image', error: error.message });
    }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
        }
        return res.status(400).json({ message: error.message });
    } else if (error) {
        return res.status(400).json({ message: error.message });
    }
    next();
});

export default router;
