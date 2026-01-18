import express from 'express';
import { body, validationResult } from 'express-validator';
import Product from '../models/Product.js';
import { protect, requireRole } from '../middleware/auth.js';
import { cacheMiddleware, invalidateCache, CACHE_TTL } from '../utils/cache.js';

const router = express.Router();

const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
};

router.get('/', cacheMiddleware(CACHE_TTL.MEDIUM), async (req, res) => {
  const { category, limitedEdition, q, sort = '-createdAt', page = 1, limit = 20 } = req.query;

  // Parse pagination params
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const skip = (pageNum - 1) * limitNum;

  // Build filter
  const filter = {};
  if (category) filter.category = category;
  if (limitedEdition) filter.limitedEdition = limitedEdition === 'true';
  if (q) filter.title = { $regex: q, $options: 'i' };

  // Get total count for pagination
  const totalProducts = await Product.countDocuments(filter);
  const totalPages = Math.ceil(totalProducts / limitNum);

  // Get paginated products
  const products = await Product.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limitNum);

  res.json({
    products,
    currentPage: pageNum,
    totalPages,
    totalProducts,
    hasNextPage: pageNum < totalPages,
    hasPrevPage: pageNum > 1
  });
});

router.get('/:slug', cacheMiddleware(CACHE_TTL.MEDIUM), async (req, res) => {
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
    invalidateCache('products'); // Clear product cache
    res.status(201).json(product);
  }
);

router.put('/:id', protect, requireRole('admin', 'manager'), async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!product) return res.status(404).json({ message: 'Not found' });

  invalidateCache('products'); // Clear product cache
  req.io.emit('product:update', product);
  res.json(product);
});

router.delete('/:id', protect, requireRole('admin'), async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  invalidateCache('products'); // Clear product cache
  res.json({ message: 'Deleted' });
});

export default router;

