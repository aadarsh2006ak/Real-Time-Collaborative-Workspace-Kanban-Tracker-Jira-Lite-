// server/src/middlewares/validate.js
const { AppError } = require('../utils/AppError');

/**
 * Zod validation middleware - prevents NoSQL injection and guarantees typed request payloads
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params,
  });

  if (!result.success) {
    return next(
      new AppError(400, 'Validation failed', 'VALIDATION_ERROR', result.error.flatten())
    );
  }

  // Bind sanitized & validated data to req.valid
  req.valid = result.data;
  next();
};

module.exports = { validate };
