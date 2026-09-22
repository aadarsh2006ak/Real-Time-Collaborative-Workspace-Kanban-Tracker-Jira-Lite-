// server/src/modules/tasks/task.routes.js
const { Router } = require('express');
const taskController = require('./task.controller');
const {
  createTaskSchema,
  updateTaskSchema,
  moveTaskSchema,
  getTasksFilterSchema,
} = require('./task.schema');
const { validate } = require('../../middlewares/validate');
const { auth } = require('../../middlewares/auth');
const { requireRole } = require('../../middlewares/rbac');

const router = Router();

// Apply auth to all task routes
router.use(auth);

// Project-nested endpoints
router.get(
  '/projects/:projectId/tasks',
  requireRole('viewer'),
  validate(getTasksFilterSchema),
  taskController.getProjectTasks
);

router.post(
  '/projects/:projectId/tasks',
  requireRole('member'),
  validate(createTaskSchema),
  taskController.createTask
);

// Project Data Export & Bulk Import
router.get(
  '/projects/:projectId/export',
  requireRole('viewer'),
  taskController.exportTasks
);

router.post(
  '/projects/:projectId/import',
  requireRole('member'),
  taskController.importTasks
);

// Bulk Task Operations
router.post(
  '/projects/:projectId/tasks/bulk-move',
  requireRole('member'),
  taskController.bulkMoveTasks
);

router.post(
  '/projects/:projectId/tasks/bulk-delete',
  requireRole('member'),
  taskController.bulkDeleteTasks
);

router.post(
  '/projects/:projectId/tasks/bulk-update',
  requireRole('member'),
  taskController.bulkUpdateTasks
);

// Direct task item endpoints
router.get('/tasks/:taskId', taskController.getTask);
router.patch('/tasks/:taskId', validate(updateTaskSchema), taskController.updateTask);
router.patch('/tasks/:taskId/move', validate(moveTaskSchema), taskController.moveTask);
router.delete('/tasks/:taskId', taskController.deleteTask);

module.exports = router;
