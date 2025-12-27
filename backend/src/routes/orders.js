import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import User from '../models/User.js';
import { protect, requireRole } from '../middleware/auth.js';
import { notifyOrderEvent } from '../services/notifications.js';
import { signToken } from '../utils/jwt.js';
import crypto from 'crypto';

const router = express.Router();

// Helper to generate a human-readable unique order number
const generateOrderNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `ORD-${dateStr}-${randomStr}`;
};

// Helper to generate a temporary password for auto-created accounts
const generateTempPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

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

router.post('/', protect, async (req, res, next) => {
  try {
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
      orderNumber: generateOrderNumber(),
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

    if (req.io) {
      req.io.emit('order:new', order);
    }

    // Send notifications (async, don't wait)
    notifyOrderEvent(order, 'new').catch(err => console.error('Notification error:', err));

    res.status(201).json(order);
  } catch (err) {
    console.error('Order creation error:', err);
    next(err);
  }
});

// Guest order creation - auto-creates user account from checkout details
router.post('/guest', async (req, res, next) => {
  try {
    const { items, shipping, paymentMethod = 'cod', shippingCharge = 0, couponCode } = req.body;

    // Validate required shipping fields - email is now required for account creation
    if (!shipping?.name || !shipping?.phone || !shipping?.address || !shipping?.city) {
      return res.status(400).json({ message: 'Please fill in all shipping details' });
    }

    if (!shipping?.email) {
      return res.status(400).json({ message: 'Email is required for order confirmation and account creation' });
    }

    // Validate items
    if (!items || !items.length) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    let total = items.reduce((acc, item) => acc + item.price * item.qty, 0);
    let discount = 0;
    let userId = null;
    let accountCreated = false;
    let tempPassword = null;
    let token = null;
    let existingAccount = false;

    // Check if user with this email already exists
    let user = await User.findOne({ email: shipping.email.toLowerCase() });

    if (user) {
      // Link order to existing user (but don't auto-login for security)
      userId = user._id;
      existingAccount = true;
      // No token issued - user must login manually to verify identity
    } else {
      // Create new user account from checkout details
      tempPassword = generateTempPassword();

      user = await User.create({
        name: shipping.name,
        email: shipping.email.toLowerCase(),
        passwordHash: tempPassword,
        phone: shipping.phone,
        address: shipping.address,
        city: shipping.city,
        country: shipping.country || 'Bangladesh',
        provider: 'local',
        profileComplete: true,
      });

      userId = user._id;
      accountCreated = true;
      token = signToken(user);
    }

    // Handle coupon
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode, active: true });
      if (coupon) {
        // Check if user already used this coupon
        if (coupon.usedBy.includes(userId)) {
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
      }
    }

    const order = await Order.create({
      userId,              // Link to user account
      isGuest: false,      // No longer a guest order since account was created/linked
      orderNumber: generateOrderNumber(),
      items,
      shipping,
      paymentMethod,
      paymentStatus: 'pending',
      total,
      shippingCharge,
      discount,
      couponCode: discount > 0 ? couponCode : null
    });

    // Decrease stock
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
    if (couponCode && discount > 0) {
      await Coupon.updateOne(
        { code: couponCode },
        { $addToSet: { usedBy: userId } }
      );
    }

    if (req.io) {
      req.io.emit('order:new', order);
    }

    // Send notifications (async, don't wait)
    notifyOrderEvent(order, 'new').catch(err => console.error('Notification error:', err));

    // Build response with account info
    const response = {
      ...order.toObject(),
      accountCreated,
      existingAccount,
    };

    if (accountCreated) {
      response.tempPassword = tempPassword;
      response.token = token;
      response.user = {
        id: user._id,
        customId: user.customId,
        name: user.name,
        email: user.email,
      };
    }

    res.status(201).json(response);
  } catch (err) {
    console.error('Guest order creation error:', err);
    next(err);
  }
});

// Guest order tracking - by order number and email/phone
router.post('/guest/track', async (req, res, next) => {
  try {
    const { orderNumber, email, phone } = req.body;

    if (!orderNumber || (!email && !phone)) {
      return res.status(400).json({ message: 'Order number and email or phone required' });
    }

    const order = await Order.findOne({ orderNumber, isGuest: true });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify identity by email or phone
    const emailMatch = email && order.shipping?.email?.toLowerCase() === email.toLowerCase();
    const phoneMatch = phone && order.shipping?.phone === phone;

    if (!emailMatch && !phoneMatch) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (err) {
    console.error('Guest order tracking error:', err);
    next(err);
  }
});

router.get('/mine', protect, async (req, res) => {
  const orders = await Order.find({
    userId: req.user._id,
    hiddenFromUser: { $ne: true }  // Exclude soft-deleted orders
  }).sort('-createdAt');
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
// This is a SOFT DELETE - order is only hidden from user, still visible to admin
router.delete('/:id', protect, async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  // Check if user owns this order
  if (order.userId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'You can only delete your own orders' });
  }

  // Soft delete - hide from user only, admin can still see it
  order.hiddenFromUser = true;
  await order.save();

  req.io.emit('order:userDelete', { orderId: req.params.id });
  res.json({ message: 'Order removed from your history' });
});

export default router;


