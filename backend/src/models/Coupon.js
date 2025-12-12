import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    type: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
    value: { type: Number, required: true },
    active: { type: Boolean, default: true },
    expiresAt: Date,
    minPurchase: Number,
    usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;

