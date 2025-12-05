import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';

const router = express.Router();

router.get('/sales', async (req, res) => {
  const range = Number(req.query.range || 30);
  const since = new Date();
  since.setDate(since.getDate() - range);
  const data = await Order.aggregate([
    { $match: { createdAt: { $gte: since }, paymentStatus: 'paid' } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$total' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  res.json(data);
});

router.get('/top-products', async (req, res) => {
  const data = await Order.aggregate([
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productId',
        sold: { $sum: '$items.qty' },
        revenue: { $sum: { $multiply: ['$items.qty', '$items.price'] } },
      },
    },
    { $sort: { sold: -1 } },
    { $limit: 10 },
  ]);
  const withProducts = await Product.populate(data, { path: '_id', select: 'title slug images' });
  res.json(withProducts);
});

router.get('/admin-tiles', async (req, res) => {
  const now = new Date();
  const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const revenue = await Order.aggregate([
    { $match: { createdAt: { $gte: since }, paymentStatus: 'paid' } },
    { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
  ]);
  const activeCarts = 7; // placeholder metric for demo
  res.json({
    totalRevenue: revenue[0]?.total || 0,
    ordersReceived: revenue[0]?.count || 0,
    ordersCompleted: await Order.countDocuments({ orderStatus: 'delivered' }),
    activeCarts,
  });
});

export default router;

