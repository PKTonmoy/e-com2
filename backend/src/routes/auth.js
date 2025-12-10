import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { signToken } from '../utils/jwt.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return true; // Return true to indicate there was an error
  }
  return false; // Return false to indicate no errors
};

router.post(
  '/signup',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').notEmpty().withMessage('Phone number is required'),
    body('address').notEmpty().withMessage('Address is required'),
  ],
  async (req, res) => {
    try {
      if (handleValidation(req, res)) return;

      const { name, email, password, phone, address, city, country, postalCode } = req.body;
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      const user = await User.create({
        name,
        email,
        passwordHash: password,
        phone,
        address,
        city,
        country,
        postalCode,
        profileComplete: true,
      });
      const token = signToken(user);
      res.status(201).json({ token, user: { id: user._id, name, email, role: user.role, phone, address } });
    } catch (err) {
      console.error('Signup error:', err);
      res.status(500).json({ message: err.message || 'Signup failed. Please try again.' });
    }
  }
);

router.post('/login', [body('email').isEmail(), body('password').notEmpty()], async (req, res) => {
  try {
    if (handleValidation(req, res)) return;
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
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: err.message || 'Login failed. Please try again.' });
  }
});

router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});

// Update user profile (for completing profile with phone/address)
router.put('/me', protect, async (req, res) => {
  try {
    const { phone, address, city, country, postalCode } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        phone,
        address,
        city,
        country,
        postalCode,
        profileComplete: true
      },
      { new: true }
    );

    res.json(user);
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

export default router;

