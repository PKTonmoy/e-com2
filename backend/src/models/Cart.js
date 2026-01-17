import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    variantId: String,
    qty: { type: Number, default: 1 },
    price: Number,
    title: String,
    sku: String,
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    items: [cartItemSchema],
  },
  { timestamps: true }
);

// ============================================
// DATABASE INDEXES FOR PERFORMANCE
// ============================================
cartSchema.index({ userId: 1 });  // Fast cart lookup by user

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;

