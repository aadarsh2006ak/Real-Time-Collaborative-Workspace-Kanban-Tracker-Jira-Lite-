// server/src/modules/activity/activity.routes.js
const { Router } = require('express');
const activityController = require('./activity.controller');
const { auth } = require('../../middlewares/auth');

const router = Router();

router.get(
  '/projects/:projectId/activity',
  auth,
  activityController.getProjectActivities
);

router.get(
  '/tasks/:taskId/activity',
  auth,
  activityController.getTaskActivities
);

module.exports = router;
