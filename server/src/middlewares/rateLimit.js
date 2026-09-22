// server/src/middlewares/rateLimit.js
const rateLimit = require('express-rate-limit');
const { AppError } = require('../utils/AppError');

// Rate limiter for authentication endpoints: 10 attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new AppError(429, 'Too many login attempts. Please try again after 15 minutes.', 'RATE_LIMIT_EXCEEDED'));
  },
  skip: () => process.env.NODE_ENV === 'test', // Skip in testing for fast suite execution
});

module.exports = { authLimiter };
