import mongoose from 'mongoose';

const returnItemSchema = new mongoose.Schema(
    {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        title: String,
        qty: Number,
        price: Number,
        selectedSize: String,
        image: String,
        reason: String,  // Item-specific return reason
    },
    { _id: false }
);

const returnRequestSchema = new mongoose.Schema(
    {
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
        orderNumber: String,  // For easy reference
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

        // Items being returned
        items: [returnItemSchema],

        // Return status workflow
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'pickup_scheduled', 'in_transit', 'received', 'completed'],
            default: 'pending',
        },

        // User's reason for return
        reason: {
            type: String,
            enum: ['defective', 'wrong_item', 'not_as_described', 'changed_mind', 'other'],
            required: true,
        },
        reasonDetails: String,  // Additional details from user

        // Admin fields
        adminNotes: String,
        processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  // Admin who processed

        // Refund handling
        refundType: {
            type: String,
            enum: ['pending', 'refund', 'coupon', 'none'],
            default: 'pending',
        },
        refundAmount: { type: Number, default: 0 },
        couponCode: String,  // Generated coupon code if refundType is 'coupon'
        couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },

        // Steadfast pickup data
        steadfastData: {
            consignmentId: String,
            trackingCode: String,
            status: String,
            pickupDate: Date,
            error: String,
        },

        // Timestamps for each stage
        approvedAt: Date,
        rejectedAt: Date,
        pickupScheduledAt: Date,
        receivedAt: Date,
        completedAt: Date,

        // Soft delete
        hiddenFromUser: { type: Boolean, default: false },
        hiddenFromAdmin: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Index for efficient queries
returnRequestSchema.index({ userId: 1, createdAt: -1 });
returnRequestSchema.index({ status: 1 });
returnRequestSchema.index({ orderId: 1 });

const ReturnRequest = mongoose.model('ReturnRequest', returnRequestSchema);
export default ReturnRequest;
