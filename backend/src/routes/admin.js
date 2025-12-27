import express from 'express';
import User from '../models/User.js';
import Order from '../models/Order.js';
import ReturnRequest from '../models/ReturnRequest.js';
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

// Get activity logs
router.get('/logs', async (req, res) => {
  const logs = await ActivityLog.find()
    .sort('-createdAt')
    .limit(100)
    .populate('actorId', 'name email');
  res.json(logs);
});

// Delete activity log
router.delete('/logs/:id', async (req, res) => {
  await ActivityLog.findByIdAndDelete(req.params.id);
  res.json({ message: 'Log deleted' });
});

// Delete ALL activity logs
router.delete('/logs', async (req, res) => {
  await ActivityLog.deleteMany({});
  res.json({ message: 'All logs deleted' });
});

router.get('/orders', async (req, res) => {
  const orders = await Order.find({ hiddenFromAdmin: { $ne: true } })  // Exclude admin-soft-deleted orders
    .sort('-createdAt')
    .limit(200)
    .populate('userId', 'name email');
  res.json(orders);
});

// Admin delete order - only allowed for delivered or cancelled orders
// This is a SOFT DELETE - order is only hidden from admin, still visible to user
router.delete('/orders/:id', async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  // Only allow deletion for delivered or cancelled orders
  if (!['delivered', 'cancelled'].includes(order.orderStatus)) {
    return res.status(400).json({
      message: 'Orders can only be deleted when status is delivered or cancelled',
    });
  }

  // Soft delete - hide from admin only, user can still see it
  order.hiddenFromAdmin = true;
  await order.save();

  res.json({ message: 'Order hidden from admin view' });
});



// Admin delete return - only allowed for completed or rejected
router.delete('/returns/:id', async (req, res) => {
  const returnReq = await ReturnRequest.findById(req.params.id);
  if (!returnReq) return res.status(404).json({ message: 'Return request not found' });

  // Only allow deletion for completed or rejected requests
  if (!['completed', 'rejected'].includes(returnReq.status)) {
    return res.status(400).json({
      message: 'Return requests can only be deleted when status is completed or rejected',
    });
  }

  returnReq.hiddenFromAdmin = true;
  await returnReq.save();

  res.json({ message: 'Return request hidden from admin view' });
});

// Get orders that are soft-deleted by BOTH user and admin (candidates for permanent deletion)
router.get('/orders/deleted-by-both', async (req, res) => {
  const orders = await Order.find({
    hiddenFromUser: true,
    hiddenFromAdmin: true
  })
    .sort('-createdAt')
    .limit(100)
    .populate('userId', 'name email');
  res.json(orders);
});

// Permanently delete an order - ONLY allowed if both user and admin have soft-deleted it
router.delete('/orders/:id/permanent', requireRole('admin'), async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  // Only allow permanent deletion if both parties have soft-deleted
  if (!order.hiddenFromUser || !order.hiddenFromAdmin) {
    return res.status(400).json({
      message: 'Order can only be permanently deleted when both user and admin have deleted it',
    });
  }

  await Order.findByIdAndDelete(req.params.id);
  res.json({ message: 'Order permanently deleted from database' });
});

// Bulk permanent delete - delete all orders that both user and admin have soft-deleted
router.delete('/orders/purge-deleted', requireRole('admin'), async (req, res) => {
  const result = await Order.deleteMany({
    hiddenFromUser: true,
    hiddenFromAdmin: true
  });
  res.json({
    message: `Permanently deleted ${result.deletedCount} orders from database`,
    deletedCount: result.deletedCount
  });
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

