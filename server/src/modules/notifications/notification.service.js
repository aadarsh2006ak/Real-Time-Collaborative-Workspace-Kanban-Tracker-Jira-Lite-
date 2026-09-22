// server/src/modules/notifications/notification.service.js
const Notification = require('./notification.model');
const { AppError } = require('../../utils/AppError');

/**
 * Creates a notification in DB and emits real-time event to user's personal room
 */
async function createNotification(
  { user, type, refType, refId, title, message },
  io = null
) {
  const notification = await Notification.create({
    user,
    type,
    refType,
    refId,
    title,
    message,
    readAt: null,
  });

  if (io) {
    io.to(`user:${user}`).emit('notification:new', { notification });
  }

  return notification;
}

/**
 * Fetch list of notifications for the authenticated user
 */
async function getUserNotifications(userId, { unreadOnly = false, limit = 50, page = 1 } = {}) {
  const query = { user: userId };
  if (unreadOnly) {
    query.readAt = null;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Notification.countDocuments(query),
    Notification.countDocuments({ user: userId, readAt: null }),
  ]);

  return {
    notifications,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)) || 1,
    },
    unreadCount,
  };
}

/**
 * Mark a specific notification as read
 */
async function markAsRead(notificationId, userId) {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { $set: { readAt: new Date() } },
    { new: true }
  );

  if (!notification) {
    throw new AppError(404, 'Notification not found', 'NOT_FOUND');
  }

  return notification;
}

/**
 * Mark all unread notifications for a user as read
 */
async function markAllAsRead(userId) {
  await Notification.updateMany(
    { user: userId, readAt: null },
    { $set: { readAt: new Date() } }
  );

  return { message: 'All notifications marked as read' };
}

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
};
