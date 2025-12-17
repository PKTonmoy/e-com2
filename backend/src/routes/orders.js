import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import { protect, requireRole } from '../middleware/auth.js';
import { notifyOrderEvent } from '../services/notifications.js';

const router = express.Router();

// Helper function to restore stock when order is cancelled
async function restoreOrderStock(items) {
  await Promise.all(
    items.map(async ({ productId, variantId, qty }) => {
      const product = await Product.findById(productId);
      if (product) {
        product.stock = product.stock + qty;
        const variant = product.variants?.find((v) => v.id === variantId);
        if (variant) variant.stock = variant.stock + qty;
        await product.save();
      }
    })
  );
}

router.post('/', protect, async (req, res) => {
  const { items, shipping, paymentStatus = 'pending', paymentMethod = 'cod', shippingCharge = 0, couponCode } = req.body;
  let total = items.reduce((acc, item) => acc + item.price * item.qty, 0);
  let discount = 0;

  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode, active: true });
    if (coupon) {
      // Check if user already used this coupon
      if (coupon.usedBy.includes(req.user._id)) {
        return res.status(400).json({ message: 'You have already used this coupon' });
      }

      // Validate expiry
      if (!coupon.expiresAt || new Date(coupon.expiresAt) > new Date()) {
        // Validate min purchase
        if (!coupon.minPurchase || total >= coupon.minPurchase) {
          if (coupon.type === 'percentage') {
            discount = total * (coupon.value / 100);
          } else {
            discount = coupon.value;
          }
          total = Math.max(0, total - discount);
        }
      }
    } else {
      return res.status(400).json({ message: 'Invalid coupon code' });
    }
  }

  const order = await Order.create({
    userId: req.user._id,
    items,
    shipping,
    paymentMethod,
    paymentStatus,
    total,
    shippingCharge,
    discount,
    couponCode
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

  // Mark coupon as used
  if (couponCode) {
    await Coupon.updateOne(
      { code: couponCode },
      { $addToSet: { usedBy: req.user._id } }
    );
  }

  req.io.emit('order:new', order);

  // Send notifications (async, don't wait)
  notifyOrderEvent(order, 'new').catch(err => console.error('Notification error:', err));

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

// User cancel order - only allowed for pending or confirmed orders
router.put('/:id/cancel', protect, async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  // Check if user owns this order
  if (order.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'You can only cancel your own orders' });
  }

  // Check if order can be cancelled (only pending or confirmed)
  if (!['pending', 'confirmed'].includes(order.orderStatus)) {
    return res.status(400).json({
      message: 'Order can only be cancelled when status is pending or confirmed',
    });
  }

  // Restore stock
  await restoreOrderStock(order.items);

  // Restore coupon usage if applicable
  if (order.couponCode) {
    await Coupon.updateOne(
      { code: order.couponCode },
      { $pull: { usedBy: order.userId } }
    );
  }

  // Update order status
  order.orderStatus = 'cancelled';
  order.notes.push({ message: 'Order cancelled by customer' });
  await order.save();

  req.io.emit('order:update', order);

  // Send notifications (async, don't wait)
  notifyOrderEvent(order, 'cancelled').catch(err => console.error('Notification error:', err));

  res.json(order);
});

router.put('/:id/status', protect, requireRole('staff', 'manager', 'admin'), async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Not found' });

  const previousStatus = order.orderStatus;
  const newStatus = req.body.status || order.orderStatus;

  // Restore stock if changing to cancelled and wasn't already cancelled
  if (newStatus === 'cancelled' && previousStatus !== 'cancelled') {
    await restoreOrderStock(order.items);

    // Restore coupon usage
    if (order.couponCode) {
      await Coupon.updateOne(
        { code: order.couponCode },
        { $pull: { usedBy: order.userId } }
      );
    }
  }

  order.orderStatus = newStatus;
  order.paymentStatus = req.body.paymentStatus || order.paymentStatus;
  if (req.body.note) {
    order.notes.push({ message: req.body.note });
  }
  await order.save();
  req.io.emit('order:update', order);

  // Send notifications for status changes (async, don't wait)
  notifyOrderEvent(order, 'status_update').catch(err => console.error('Notification error:', err));

  res.json(order);
});

// Delete order from history (user can only delete their own orders)
router.delete('/:id', protect, async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  // Check if user owns this order
  if (order.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'You can only delete your own orders' });
  }

  // Restore coupon usage if order deleted (optional but good for consistency)
  if (order.couponCode) {
    await Coupon.updateOne(
      { code: order.couponCode },
      { $pull: { usedBy: order.userId } }
    );
  }

  await Order.findByIdAndDelete(req.params.id);
  req.io.emit('order:delete', { orderId: req.params.id });
  res.json({ message: 'Order deleted from history' });
});

export default router;


