import express from 'express';
import Cart from '../models/Cart.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, async (req, res) => {
  let cart = await Cart.findOne({ userId: req.user._id });
  if (!cart) cart = await Cart.create({ userId: req.user._id, items: [] });
  res.json(cart);
});

router.post('/merge', protect, async (req, res) => {
  const guestItems = req.body.items || [];
  let cart = await Cart.findOne({ userId: req.user._id });
  if (!cart) cart = await Cart.create({ userId: req.user._id, items: guestItems });
  else cart.items = [...cart.items, ...guestItems];
  await cart.save();
  res.json(cart);
});

router.put('/', protect, async (req, res) => {
  const { items } = req.body;
  const cart = await Cart.findOneAndUpdate(
    { userId: req.user._id },
    { items },
    { upsert: true, new: true }
  );
  res.json(cart);
});

export default router;

