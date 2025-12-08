/**
 * Image Upload Routes
 * Handles file uploads with multer and stores them in /uploads folder
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename: timestamp-randomstring.ext
        const ext = path.extname(file.originalname);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + ext);
    }
});

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
 * POST /api/upload
 * Upload a single image
 * Returns the URL to access the uploaded image
 */
router.post('/', protect, requireRole('staff', 'manager', 'admin'), upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
    }

    // Construct the URL to access the image
    const imageUrl = `/uploads/${req.file.filename}`;

    console.log(`[Upload] Image uploaded: ${req.file.filename}`);

    res.json({
        success: true,
        url: imageUrl,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
    });
});

/**
 * POST /api/upload/multiple
 * Upload multiple images (max 10)
 */
router.post('/multiple', protect, requireRole('staff', 'manager', 'admin'), upload.array('images', 10), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No image files provided' });
    }

    const uploadedFiles = req.files.map(file => ({
        url: `/uploads/${file.filename}`,
        filename: file.filename,
        size: file.size
    }));

    console.log(`[Upload] ${uploadedFiles.length} images uploaded`);

    res.json({
        success: true,
        files: uploadedFiles
    });
});

/**
 * DELETE /api/upload/:filename
 * Delete an uploaded image
 */
router.delete('/:filename', protect, requireRole('staff', 'manager', 'admin'), (req, res) => {
    const { filename } = req.params;
    const filepath = path.join(uploadsDir, filename);

    // Security: Make sure we're only deleting from uploads folder
    if (!filepath.startsWith(uploadsDir)) {
        return res.status(400).json({ message: 'Invalid filename' });
    }

    if (!fs.existsSync(filepath)) {
        return res.status(404).json({ message: 'File not found' });
    }

    fs.unlinkSync(filepath);
    console.log(`[Upload] Image deleted: ${filename}`);

    res.json({ success: true, message: 'Image deleted' });
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
