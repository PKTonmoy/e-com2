import express from 'express';
import { body, validationResult } from 'express-validator';
import BlogPost from '../models/BlogPost.js';
import { protect, requireRole } from '../middleware/auth.js';
import { cacheMiddleware, invalidateCache, CACHE_TTL } from '../utils/cache.js';

const router = express.Router();

const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
};

// Blog posts rarely change - cache for 30 minutes
router.get('/', cacheMiddleware(CACHE_TTL.LONG), async (req, res) => {
  const { tag, q } = req.query;
  const filter = {};
  if (tag) filter.tags = tag;
  if (q) filter.title = { $regex: q, $options: 'i' };
  const posts = await BlogPost.find(filter).sort('-publishedAt');
  res.json(posts);
});

router.get('/:slug', cacheMiddleware(CACHE_TTL.LONG), async (req, res) => {
  const post = await BlogPost.findOne({ slug: req.params.slug });
  if (!post) return res.status(404).json({ message: 'Not found' });
  res.json(post);
});

router.post(
  '/',
  protect,
  requireRole('staff', 'manager', 'admin'),
  [body('title').notEmpty(), body('slug').notEmpty(), body('contentHTML').notEmpty()],
  async (req, res) => {
    const error = validate(req, res);
    if (error) return;
    const post = await BlogPost.create({ ...req.body, authorId: req.user._id });
    invalidateCache('blog');
    res.status(201).json(post);
  }
);

router.put('/:id', protect, requireRole('staff', 'manager', 'admin'), async (req, res) => {
  const post = await BlogPost.findByIdAndUpdate(req.params.id, req.body, { new: true });
  invalidateCache('blog');
  res.json(post);
});

router.delete('/:id', protect, requireRole('admin'), async (req, res) => {
  await BlogPost.findByIdAndDelete(req.params.id);
  invalidateCache('blog');
  res.json({ message: 'Deleted' });
});

export default router;

