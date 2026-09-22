// server/src/middlewares/auth.js
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { AppError } = require('../utils/AppError');

const auth = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;

  if (!token) {
    return next(new AppError(401, 'Authentication token required', 'NO_TOKEN'));
  }

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
    req.user = { id: payload.sub };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError(401, 'Access token has expired', 'TOKEN_EXPIRED'));
    }
    return next(new AppError(401, 'Invalid authentication token', 'INVALID_TOKEN'));
  }
};

module.exports = { auth };
