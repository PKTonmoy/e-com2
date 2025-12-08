import express from 'express';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Admin: Get all reviews for monitoring (must be before /:productId)
router.get('/admin/all', protect, requireRole('admin'), async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('userId', 'name email')
            .populate('productId', 'title slug images')
            .sort({ createdAt: -1 });

        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin: Delete a review
router.delete('/admin/:reviewId', protect, requireRole('admin'), async (req, res) => {
    try {
        const review = await Review.findByIdAndDelete(req.params.reviewId);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }
        res.json({ message: 'Review deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Check if user can review a product (must be before /:productId)
router.get('/can-review/:productId', protect, async (req, res) => {
    try {
        // Check if user has already reviewed
        const existingReview = await Review.findOne({
            productId: req.params.productId,
            userId: req.user._id,
        });

        if (existingReview) {
            return res.json({ canReview: false, reason: 'already_reviewed', review: existingReview });
        }

        // Check if user has purchased this product
        const orders = await Order.find({
            userId: req.user._id,
            'items.productId': req.params.productId,
            paymentStatus: 'paid',
        });

        if (orders.length === 0) {
            return res.json({ canReview: false, reason: 'not_purchased' });
        }

        res.json({ canReview: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all reviews for a product (public) - MUST BE LAST due to :productId param
router.get('/:productId', async (req, res) => {
    try {
        const reviews = await Review.find({ productId: req.params.productId })
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });

        // Calculate rating statistics
        const totalReviews = reviews.length;
        const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let totalRating = 0;

        reviews.forEach((review) => {
            ratingCounts[review.rating]++;
            totalRating += review.rating;
        });

        const averageRating = totalReviews > 0 ? (totalRating / totalReviews).toFixed(1) : 0;

        res.json({
            reviews,
            stats: {
                totalReviews,
                averageRating: parseFloat(averageRating),
                ratingCounts,
            },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a review (requires auth + purchase)
router.post('/:productId', protect, async (req, res) => {
    try {
        const { rating, comment } = req.body;

        // Validate rating
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        if (!comment || comment.trim().length < 5) {
            return res.status(400).json({ message: 'Comment must be at least 5 characters' });
        }

        // Check if product exists
        const product = await Product.findById(req.params.productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check if user already reviewed
        const existingReview = await Review.findOne({
            productId: req.params.productId,
            userId: req.user._id,
        });

        if (existingReview) {
            return res.status(400).json({ message: 'You have already reviewed this product' });
        }

        // Check if user has purchased
        const orders = await Order.find({
            userId: req.user._id,
            'items.productId': req.params.productId,
            paymentStatus: 'paid',
        });

        const purchaseVerified = orders.length > 0;

        if (!purchaseVerified) {
            return res.status(403).json({
                message: 'You must purchase this product before reviewing',
                redirectToPurchase: true,
            });
        }

        const review = new Review({
            productId: req.params.productId,
            userId: req.user._id,
            rating,
            comment: comment.trim(),
            purchaseVerified,
        });

        await review.save();

        const populatedReview = await Review.findById(review._id).populate('userId', 'name email');

        res.status(201).json(populatedReview);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: 'You have already reviewed this product' });
        }
        res.status(500).json({ message: err.message });
    }
});

export default router;
