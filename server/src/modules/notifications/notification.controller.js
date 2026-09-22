// server/src/modules/notifications/notification.controller.js
const notificationService = require('./notification.service');

exports.getMyNotifications = async (req, res, next) => {
  try {
    const unreadOnly = req.query.unreadOnly === 'true';
    const limit = req.query.limit || 50;
    const page = req.query.page || 1;

    const data = await notificationService.getUserNotifications(req.user.id, {
      unreadOnly,
      limit,
      page,
    });

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

exports.markRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(
      req.params.notificationId,
      req.user.id
    );

    res.status(200).json({
      success: true,
      data: { notification },
    });
  } catch (err) {
    next(err);
  }
};

exports.markAllRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllAsRead(req.user.id);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};
