import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    variantId: String,
    qty: Number,
    price: Number,
    title: String,
    sku: String,
    selectedSize: String,
    image: String,
    category: String,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isGuest: { type: Boolean, default: false },
    items: [orderItemSchema],
    shipping: {
      name: String,
      phone: String,
      email: String,
      address: String,
      city: String,
      country: String,
      postalCode: String,
    },
    paymentMethod: { type: String, enum: ['cod', 'online'], default: 'cod' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
    orderStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'],
      default: 'pending',
    },
    notes: [{ message: String, createdAt: { type: Date, default: Date.now } }],
    total: Number,
    shippingCharge: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    couponCode: String,
    currency: { type: String, default: 'USD' },
    orderNumber: { type: String, unique: true, sparse: true },
    courier: {
      name: String,
      trackingId: String,
      statusRaw: String,
      statusFriendly: String,
      statusFriendly: String,
      deliveryCharge: Number, // what customer sees/paid
      actualCost: Number, // what courier actually charged us
      lastSyncedAt: Date,
      error: String,
    },
    // SMS notification tracking
    sms: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      error: String,
      attempts: { type: Number, default: 0 },
    },
    // Soft delete fields - allows independent visibility control
    hiddenFromUser: { type: Boolean, default: false },
    hiddenFromAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ============================================
// DATABASE INDEXES FOR PERFORMANCE
// ============================================
orderSchema.index({ userId: 1 });                    // User's orders lookup
orderSchema.index({ createdAt: -1 });                // Sort by newest
orderSchema.index({ orderStatus: 1 });               // Filter by status
orderSchema.index({ orderNumber: 1 });               // Order lookup by number
orderSchema.index({ paymentStatus: 1 });             // Payment filtering
orderSchema.index({ 'shipping.email': 1 });          // Guest order lookup
orderSchema.index({ hiddenFromAdmin: 1, createdAt: -1 }); // Admin dashboard
orderSchema.index({ userId: 1, createdAt: -1 });     // User order history

const Order = mongoose.model('Order', orderSchema);
export default Order;

