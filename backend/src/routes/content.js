import express from 'express';
import ContentBlock from '../models/ContentBlock.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/:key', async (req, res) => {
  const block = await ContentBlock.findOne({ key: req.params.key });
  res.json(block || { key: req.params.key, html: '' });
});

router.post('/:key', protect, requireRole('staff', 'manager', 'admin'), async (req, res) => {
  const block = await ContentBlock.findOneAndUpdate(
    { key: req.params.key },
    { html: req.body.html, meta: req.body.meta },
    { upsert: true, new: true }
  );
  res.json(block);
});

export default router;

