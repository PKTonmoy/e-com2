import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased from 200 to 1000 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  // Skip rate limiting for development
  skip: (req) => {
    // Skip rate limiting in development mode
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    // Skip health check endpoint
    if (req.path === '/health') {
      return true;
    }
    return false;
  },
});

export default limiter;
