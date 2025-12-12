import express from 'express';
import { body, validationResult } from 'express-validator';
import Product from '../models/Product.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
};

router.get('/', async (req, res) => {
  const { category, limitedEdition, q, sort = '-createdAt' } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (limitedEdition) filter.limitedEdition = limitedEdition === 'true';
  if (q) filter.title = { $regex: q, $options: 'i' };
  const products = await Product.find(filter).sort(sort).limit(100);
  res.json(products);
});

router.get('/:slug', async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug });
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
});

router.post(
  '/',
  protect,
  requireRole('admin', 'manager'),
  [body('title').notEmpty(), body('slug').notEmpty(), body('price').isNumeric()],
  async (req, res) => {
    const error = validate(req, res);
    if (error) return;
    const product = await Product.create(req.body);
    res.status(201).json(product);
  }
);

router.put('/:id', protect, requireRole('admin', 'manager'), async (req, res) => {
  // Debug: Log what we're receiving
  console.log('[Products PUT] Received images:', req.body.images);

  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!product) return res.status(404).json({ message: 'Not found' });

  // Debug: Log what was saved
  console.log('[Products PUT] Saved product images:', product.images);

  req.io.emit('product:update', product);
  res.json(product);
});

router.delete('/:id', protect, requireRole('admin'), async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

export default router;

