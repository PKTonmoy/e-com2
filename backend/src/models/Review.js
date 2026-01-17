import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
    {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, required: true },
        purchaseVerified: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Ensure one review per user per product
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

// Additional indexes for performance
reviewSchema.index({ productId: 1, createdAt: -1 }); // Product reviews sorted by date
reviewSchema.index({ userId: 1, createdAt: -1 });    // User's reviews
reviewSchema.index({ rating: 1 });                    // Filter by rating

const Review = mongoose.model('Review', reviewSchema);
export default Review;
