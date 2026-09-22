// server/src/modules/notifications/notification.routes.js
const { Router } = require('express');
const notificationController = require('./notification.controller');
const { auth } = require('../../middlewares/auth');

const router = Router();

router.get('/', auth, notificationController.getMyNotifications);
router.patch('/read-all', auth, notificationController.markAllRead);
router.patch('/:notificationId/read', auth, notificationController.markRead);

module.exports = router;
