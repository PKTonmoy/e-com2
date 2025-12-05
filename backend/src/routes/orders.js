import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, async (req, res) => {
  const { items, shipping, paymentStatus = 'pending' } = req.body;
  const total = items.reduce((acc, item) => acc + item.price * item.qty, 0);
  const order = await Order.create({
    userId: req.user._id,
    items,
    shipping,
    paymentStatus,
    total,
  });

  // decrease stock
  await Promise.all(
    items.map(async ({ productId, variantId, qty }) => {
      const product = await Product.findById(productId);
      if (product) {
        product.stock = Math.max(0, product.stock - qty);
        const variant = product.variants?.find((v) => v.id === variantId);
        if (variant) variant.stock = Math.max(0, variant.stock - qty);
        await product.save();
      }
    })
  );

  req.io.emit('order:new', order);
  res.status(201).json(order);
});

router.get('/mine', protect, async (req, res) => {
  const orders = await Order.find({ userId: req.user._id }).sort('-createdAt');
  res.json(orders);
});

router.get('/:id', protect, async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Not found' });
  if (order.userId.toString() !== req.user._id.toString() && req.user.role === 'customer') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  res.json(order);
});

router.put('/:id/status', protect, requireRole('staff', 'manager', 'admin'), async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Not found' });
  order.orderStatus = req.body.status || order.orderStatus;
  order.paymentStatus = req.body.paymentStatus || order.paymentStatus;
  if (req.body.note) {
    order.notes.push({ message: req.body.note });
  }
  await order.save();
  req.io.emit('order:update', order);
  res.json(order);
});

export default router;

