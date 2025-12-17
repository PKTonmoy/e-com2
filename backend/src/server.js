import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
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
import reviewRoutes from './routes/reviews.js';
import validateEmailRoutes from './routes/validateEmail.js';
import googleAuthRoutes from './routes/googleAuth.js';
import uploadRoutes from './routes/upload.js';
import settingsRoutes from './routes/settings.js';
import deliveryRoutes from './routes/delivery.js';
import notificationRoutes from './routes/notificationRoutes.js';
import adminNotificationRoutes from './routes/adminNotificationRoutes.js';
import { errorHandler, notFound } from './middleware/error.js';
import ensureAdmin from './utils/ensureAdmin.js';
import syncCourierStatuses from './cron/courierSync.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
  },
});

io.on('connection', (socket) => {
  // console.log('Socket connected:', socket.id);

  socket.on('join', (room) => {
    socket.join(room);
    // console.log(`Socket ${socket.id} joined room ${room}`);
  });

  socket.on('disconnect', () => {
    // console.log('Socket disconnected:', socket.id);
  });
});

// Connect to database and ensure admin user exists
connectDB().then(() => {
  ensureAdmin();
});

// Middleware
app.use(rateLimiter);
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com", "https://*.cloudinary.com"],
      connectSrc: ["'self'", "https://res.cloudinary.com", "https://api.cloudinary.com", "wss:", "ws:"],
      mediaSrc: ["'self'", "https://res.cloudinary.com"],
      objectSrc: ["'none'"],
      frameSrc: ["'self'"],
    },
  },
}));
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

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Attach io instance so routes can emit events
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Health check with database status
app.get('/health', async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  res.json({
    status: dbState === 1 ? 'ok' : 'degraded',
    name: 'PRELUX API',
    version: '1.0.0',
    database: dbStates[dbState] || 'unknown',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
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
app.use('/api/reviews', reviewRoutes);
app.use('/api/validate-email', validateEmailRoutes);
app.use('/api/auth', googleAuthRoutes); // Google OAuth routes
app.use('/api/upload', uploadRoutes); // Image upload routes
app.use('/api/settings', settingsRoutes); // Settings routes
app.use('/api/delivery', deliveryRoutes); // Courier & delivery routes
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin/notifications', adminNotificationRoutes);

// Friendly root response
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend/dist')));

  app.get('*', (req, res) =>
    res.sendFile(path.resolve(__dirname, '../../frontend', 'dist', 'index.html'))
  );
} else {
  app.get('/', (req, res) => {
    res.json({
      name: 'PRELUX API',
      status: 'ok',
      docs: '/health',
      api: '/api',
    });
  });
}

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  console.error(err.stack);
  // Keep the server running, don't exit
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Keep the server running, don't exit
});

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`PRELUX API running on port ${PORT}`);

    // Schedule courier sync every 3 hours (production-safe, idempotent)
    const intervalMs = Number(process.env.COURIER_SYNC_INTERVAL_MS || 3 * 60 * 60 * 1000);

    setInterval(() => {
      syncCourierStatuses()
        .then(() => {
          console.log('[Courier Sync] Completed');
        })
        .catch((err) => {
          console.error('[Courier Sync] Error', err.message);
        });
    }, intervalMs);
  });
}

export { app, server };
