// server/src/middlewares/error.js
const { AppError } = require('../utils/AppError');
const logger = require('../config/logger');

const notFound = (req, res, next) => {
  next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`, 'NOT_FOUND'));
};

const errorHandler = (err, req, res, _next) => {
  const status = err.status || 500;
  const isServerErr = status >= 500;

  if (isServerErr) {
    if (req.log) {
      req.log.error(err);
    } else {
      logger.error(err);
    }
  }

  res.status(status).json({
    success: false,
    error: {
      code: err.code || (isServerErr ? 'INTERNAL_SERVER_ERROR' : 'ERROR'),
      message: isServerErr && process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
      details: err.details || undefined,
    },
  });
};

module.exports = { notFound, errorHandler };
