import express from 'express';
import User from '../models/User.js';
import Order from '../models/Order.js';
import ActivityLog from '../models/ActivityLog.js';
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

router.get('/logs', requireRole('admin'), async (req, res) => {
  const logs = await ActivityLog.find().sort('-createdAt').limit(200);
  res.json(logs);
});

export default router;

