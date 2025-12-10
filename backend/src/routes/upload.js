/**
 * Image Upload Routes
 * Handles file uploads with multer and stores them in Cloudinary
 */

import express from 'express';
import multer from 'multer';
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
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'prelux',
                resource_type: 'image',
                ...options
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        uploadStream.end(buffer);
    });
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

        // Upload to Cloudinary
        const result = await uploadToCloudinary(req.file.buffer);

        console.log(`[Upload] Image uploaded to Cloudinary: ${result.public_id}`);

        res.json({
            success: true,
            url: result.secure_url,
            publicId: result.public_id,
            size: req.file.size,
            mimetype: req.file.mimetype
        });
    } catch (error) {
        console.error('[Upload] Cloudinary upload error:', error);
        res.status(500).json({ message: 'Failed to upload image', error: error.message });
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

        // Upload all files to Cloudinary
        const uploadPromises = req.files.map(file => uploadToCloudinary(file.buffer));
        const results = await Promise.all(uploadPromises);

        const uploadedFiles = results.map((result, index) => ({
            url: result.secure_url,
            publicId: result.public_id,
            size: req.files[index].size
        }));

        console.log(`[Upload] ${uploadedFiles.length} images uploaded to Cloudinary`);

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
