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
      deliveryCharge: Number,
      lastSyncedAt: Date,
      error: String,
    },
    // Soft delete fields - allows independent visibility control
    hiddenFromUser: { type: Boolean, default: false },
    hiddenFromAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);
export default Order;

