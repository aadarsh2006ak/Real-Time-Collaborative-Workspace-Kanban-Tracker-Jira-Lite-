// server/src/modules/activity/activity.model.js
const { Schema, model, Types } = require('mongoose');

const activitySchema = new Schema(
  {
    project: { type: Types.ObjectId, ref: 'Project', required: true },
    task: { type: Types.ObjectId, ref: 'Task', default: null },
    actor: { type: Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      required: true,
      enum: [
        'TASK_CREATED',
        'TASK_UPDATED',
        'TASK_MOVED',
        'TASK_ASSIGNED',
        'TASK_UNASSIGNED',
        'TASK_DELETED',
        'TASK_RESTORED',
        'COMMENT_ADDED',
        'MEMBER_INVITED',
        'MEMBER_ROLE_CHANGED',
        'MEMBER_REMOVED',
      ],
    },
    meta: { type: Schema.Types.Mixed, default: {} }, // Diffs, from/to column, or changed attributes
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Append-only immutable log
  }
);

// High-performance indexes for activity streams
activitySchema.index({ project: 1, createdAt: -1 });
activitySchema.index({ task: 1, createdAt: -1 });

module.exports = model('Activity', activitySchema);
