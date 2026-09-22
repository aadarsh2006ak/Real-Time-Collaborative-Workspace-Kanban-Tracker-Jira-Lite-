// server/src/routes.js
const { Router } = require('express');

const authRoutes = require('./modules/auth/auth.routes');
const projectRoutes = require('./modules/projects/project.routes');
const taskRoutes = require('./modules/tasks/task.routes');
const commentRoutes = require('./modules/comments/comment.routes');
const activityRoutes = require('./modules/activity/activity.routes');
const notificationRoutes = require('./modules/notifications/notification.routes');

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

// Project routes
router.use('/projects', projectRoutes);

// Task routes (includes project-nested and item-level routes)
router.use('/', taskRoutes);

// Comment routes (task-nested and comment-level routes)
router.use('/', commentRoutes);

// Activity audit stream routes
router.use('/', activityRoutes);

// Notification routes
router.use('/notifications', notificationRoutes);

// Test routes for test environment
if (process.env.NODE_ENV === 'test') {
  const { auth } = require('./middlewares/auth');
  const { requireRole } = require('./middlewares/rbac');
  router.get('/test-rbac/:projectId', auth, requireRole('member'), (req, res) => {
    res.json({ success: true, role: req.role });
  });
}

module.exports = router;
