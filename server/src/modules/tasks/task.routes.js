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

// Direct task item endpoints
router.get('/tasks/:taskId', taskController.getTask);
router.patch('/tasks/:taskId', validate(updateTaskSchema), taskController.updateTask);
router.patch('/tasks/:taskId/move', validate(moveTaskSchema), taskController.moveTask);
router.delete('/tasks/:taskId', taskController.deleteTask);

module.exports = router;
