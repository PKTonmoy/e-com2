import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { signToken } from '../utils/jwt.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
};

router.post(
  '/signup',
  [
    body('name').notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
  ],
  async (req, res) => {
    const error = handleValidation(req, res);
    if (error) return;
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    const user = await User.create({ name, email, passwordHash: password });
    const token = signToken(user);
    res.status(201).json({ token, user: { id: user._id, name, email, role: user.role } });
  }
);

router.post('/login', [body('email').isEmail(), body('password').notEmpty()], async (req, res) => {
  const error = handleValidation(req, res);
  if (error) return;
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = signToken(user);
  res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});

export default router;

