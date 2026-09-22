// server/src/modules/notifications/notification.model.js
const { Schema, model, Types } = require('mongoose');

const notificationSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      required: true,
      enum: ['ASSIGNMENT', 'MENTION', 'COMMENT', 'ROLE_CHANGE', 'DUE_DATE'],
    },
    refType: { type: String, enum: ['Task', 'Comment', 'Project'], required: true },
    refId: { type: Types.ObjectId, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Indexes
notificationSchema.index({ user: 1, readAt: 1, createdAt: -1 });

module.exports = model('Notification', notificationSchema);
