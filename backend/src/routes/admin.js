import express from 'express';
import User from '../models/User.js';
import Order from '../models/Order.js';
import ActivityLog from '../models/ActivityLog.js';
import CourierTariff from '../models/CourierTariff.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, requireRole('staff', 'manager', 'admin'));

router.get('/users', async (req, res) => {
  const users = await User.find().select('-passwordHash').limit(200);
  res.json(users);
});

router.put('/users/:id/role', requireRole('manager', 'admin'), async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true });
  if (!user) return res.status(404).json({ message: 'User not found' });
  await ActivityLog.create({
    actorId: req.user._id,
    action: 'role:update',
    entity: 'user',
    meta: { target: req.params.id, role: req.body.role },
  });
  res.json(user);
});

router.get('/orders', async (req, res) => {
  const orders = await Order.find()
    .sort('-createdAt')
    .limit(200)
    .populate('userId', 'name email');
  res.json(orders);
});

// Admin delete order - only allowed for delivered or cancelled orders
router.delete('/orders/:id', async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  // Only allow deletion for delivered or cancelled orders
  if (!['delivered', 'cancelled'].includes(order.orderStatus)) {
    return res.status(400).json({
      message: 'Orders can only be deleted when status is delivered or cancelled',
    });
  }

  await Order.findByIdAndDelete(req.params.id);
  res.json({ message: 'Order deleted successfully' });
});

// Courier tariff management (Steadfast)
router.get('/courier-tariffs', async (req, res) => {
  const tariffs = await CourierTariff.find({}).sort({ originDistrict: 1, destinationDistrict: 1 });
  res.json(tariffs);
});

router.post('/courier-tariffs', async (req, res) => {
  const payload = req.body;
  const tariff = await CourierTariff.create(payload);
  await ActivityLog.create({
    actorId: req.user._id,
    action: 'courier_tariff:create',
    entity: 'courierTariff',
    meta: { id: tariff._id },
  });
  res.status(201).json(tariff);
});

router.put('/courier-tariffs/:id', async (req, res) => {
  const tariff = await CourierTariff.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!tariff) return res.status(404).json({ message: 'Tariff not found' });
  await ActivityLog.create({
    actorId: req.user._id,
    action: 'courier_tariff:update',
    entity: 'courierTariff',
    meta: { id: tariff._id },
  });
  res.json(tariff);
});

router.delete('/courier-tariffs/:id', async (req, res) => {
  const tariff = await CourierTariff.findById(req.params.id);
  if (!tariff) return res.status(404).json({ message: 'Tariff not found' });
  await CourierTariff.findByIdAndDelete(req.params.id);
  await ActivityLog.create({
    actorId: req.user._id,
    action: 'courier_tariff:delete',
    entity: 'courierTariff',
    meta: { id: req.params.id },
  });
  res.json({ message: 'Tariff deleted' });
});

export default router;

