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

// Project-nested endpoints
router.get(
  '/projects/:projectId/tasks',
  auth,
  requireRole('viewer'),
  validate(getTasksFilterSchema),
  taskController.getProjectTasks
);

router.post(
  '/projects/:projectId/tasks',
  auth,
  requireRole('member'),
  validate(createTaskSchema),
  taskController.createTask
);

// Project Data Export & Bulk Import
router.get(
  '/projects/:projectId/export',
  auth,
  requireRole('viewer'),
  taskController.exportTasks
);

router.post(
  '/projects/:projectId/import',
  auth,
  requireRole('member'),
  taskController.importTasks
);

// Bulk Task Operations
router.post(
  '/projects/:projectId/tasks/bulk-move',
  auth,
  requireRole('member'),
  taskController.bulkMoveTasks
);

router.post(
  '/projects/:projectId/tasks/bulk-delete',
  auth,
  requireRole('member'),
  taskController.bulkDeleteTasks
);

router.post(
  '/projects/:projectId/tasks/bulk-update',
  auth,
  requireRole('member'),
  taskController.bulkUpdateTasks
);

// Direct task item endpoints
router.get('/tasks/:taskId', auth, taskController.getTask);
router.patch('/tasks/:taskId', auth, validate(updateTaskSchema), taskController.updateTask);
router.patch('/tasks/:taskId/move', auth, validate(moveTaskSchema), taskController.moveTask);
router.delete('/tasks/:taskId', auth, taskController.deleteTask);

module.exports = router;
