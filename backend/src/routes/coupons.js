import express from 'express';
import { body, validationResult } from 'express-validator';
import Coupon from '../models/Coupon.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
};

// Get all coupons (admin only)
router.get('/', protect, requireRole('manager', 'admin'), async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json(coupons);
});

// Create coupon (admin only)
router.post(
  '/',
  protect,
  requireRole('manager', 'admin'),
  [body('code').notEmpty(), body('value').isNumeric()],
  async (req, res) => {
    const error = validate(req, res);
    if (error) return;

    // Ensure code is uppercase
    const couponData = { ...req.body, code: req.body.code.toUpperCase() };
    const coupon = await Coupon.create(couponData);
    res.status(201).json(coupon);
  }
);

// Update coupon (admin only)
router.put('/:id', protect, requireRole('manager', 'admin'), async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(
    req.params.id,
    { ...req.body, code: req.body.code?.toUpperCase() },
    { new: true }
  );
  if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
  res.json(coupon);
});

// Delete coupon (admin only)
router.delete('/:id', protect, requireRole('manager', 'admin'), async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
  res.json({ message: 'Coupon deleted' });
});

// Validate coupon (public - for cart use)
router.post('/validate', async (req, res) => {
  const { code, cartTotal } = req.body;

  if (!code) {
    return res.status(400).json({ message: 'Coupon code is required' });
  }

  const coupon = await Coupon.findOne({ code: code.toUpperCase(), active: true });

  if (!coupon) {
    return res.status(404).json({ message: 'Invalid coupon code' });
  }

  // Check expiry
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return res.status(400).json({ message: 'This coupon has expired' });
  }

  // Check minimum purchase
  if (coupon.minPurchase && cartTotal && cartTotal < coupon.minPurchase) {
    return res.status(400).json({
      message: `Minimum purchase of $${coupon.minPurchase} required for this coupon`
    });
  }

  // Calculate discount
  let discount = 0;
  if (coupon.type === 'percentage') {
    discount = cartTotal ? (cartTotal * coupon.value) / 100 : coupon.value;
  } else {
    discount = coupon.value;
  }

  res.json({
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    discount,
    message: `Coupon applied! ${coupon.type === 'percentage' ? coupon.value + '% off' : '$' + coupon.value + ' off'}`
  });
});

// Get single coupon by code (legacy)
router.get('/:code', async (req, res) => {
  const coupon = await Coupon.findOne({ code: req.params.code.toUpperCase(), active: true });
  if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
  res.json(coupon);
});

export default router;
