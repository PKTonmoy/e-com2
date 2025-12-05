import express from 'express';
import User from '../models/User.js';
import Product from '../models/Product.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', async (req, res) => {
    const user = await User.findById(req.user._id).populate('wishlist');
    res.json(user.wishlist || []);
});

router.post('/:productId', async (req, res) => {
    const user = await User.findById(req.user._id);
    const product = await Product.findById(req.params.productId);

    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }

    if (!user.wishlist.includes(req.params.productId)) {
        user.wishlist.push(req.params.productId);
        await user.save();
    }

    res.json({ message: 'Added to wishlist' });
});

router.delete('/:productId', async (req, res) => {
    const user = await User.findById(req.user._id);
    user.wishlist = user.wishlist.filter((id) => id.toString() !== req.params.productId);
    await user.save();
    res.json({ message: 'Removed from wishlist' });
});

export default router;
