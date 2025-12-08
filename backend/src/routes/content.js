import express from 'express';
import ContentBlock from '../models/ContentBlock.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET content by key
router.get('/:key', async (req, res) => {
  try {
    const block = await ContentBlock.findOne({ key: req.params.key });
    res.json(block || { key: req.params.key, content: {} });
  } catch (err) {
    console.error('[Content] Error fetching:', err);
    res.status(500).json({ message: 'Failed to fetch content' });
  }
});

// POST/UPDATE content by key
router.post('/:key', protect, requireRole('staff', 'manager', 'admin'), async (req, res) => {
  try {
    const updateData = {};

    // Support both old (html, meta) and new (content) formats
    if (req.body.content) {
      updateData.content = req.body.content;
    }
    if (req.body.html !== undefined) {
      updateData.html = req.body.html;
    }
    if (req.body.meta !== undefined) {
      updateData.meta = req.body.meta;
    }

    const block = await ContentBlock.findOneAndUpdate(
      { key: req.params.key },
      updateData,
      { upsert: true, new: true }
    );

    console.log(`[Content] Updated: ${req.params.key}`);
    res.json(block);
  } catch (err) {
    console.error('[Content] Error updating:', err);
    res.status(500).json({ message: 'Failed to update content' });
  }
});

export default router;
