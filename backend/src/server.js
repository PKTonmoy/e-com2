import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import rateLimiter from './utils/rateLimiter.js';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import cartRoutes from './routes/cart.js';
import blogRoutes from './routes/blog.js';
import contentRoutes from './routes/content.js';
import statsRoutes from './routes/stats.js';
import adminRoutes from './routes/admin.js';
import couponRoutes from './routes/coupons.js';
import wishlistRoutes from './routes/wishlist.js';
import { errorHandler, notFound } from './middleware/error.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
  },
});

connectDB();

app.use(rateLimiter);
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL?.split(',') || '*',
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Attach io instance so routes can emit events
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', name: 'PRELUX API', version: '1.0.0' });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/wishlist', wishlistRoutes);

// Friendly root response
app.get('/', (req, res) => {
  res.json({
    name: 'PRELUX API',
    status: 'ok',
    docs: '/health',
    api: '/api',
  });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`PRELUX API running on port ${PORT}`);
  });
}

export { app, server };

