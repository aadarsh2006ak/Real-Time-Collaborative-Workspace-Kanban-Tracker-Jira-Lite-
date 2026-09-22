// server/src/routes.js
const { Router } = require('express');

const authRoutes = require('./modules/auth/auth.routes');

const router = Router();

// Base info endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'Jira-Lite API',
      version: '1.0.0',
      status: 'operational',
      docs: '/api/v1/docs',
    },
  });
});

// Authentication routes
router.use('/auth', authRoutes);

// Test routes for test environment
if (process.env.NODE_ENV === 'test') {
  const { auth } = require('./middlewares/auth');
  const { requireRole } = require('./middlewares/rbac');
  router.get('/test-rbac/:projectId', auth, requireRole('member'), (req, res) => {
    res.json({ success: true, role: req.role });
  });
}

module.exports = router;
