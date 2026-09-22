// server/src/modules/auth/auth.routes.js
const { Router } = require('express');
const authController = require('./auth.controller');
const { registerSchema, loginSchema } = require('./auth.schema');
const { validate } = require('../../middlewares/validate');
const { auth } = require('../../middlewares/auth');
const { authLimiter } = require('../../middlewares/rateLimit');

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', auth, authController.logout);
router.get('/me', auth, authController.getMe);

module.exports = router;
