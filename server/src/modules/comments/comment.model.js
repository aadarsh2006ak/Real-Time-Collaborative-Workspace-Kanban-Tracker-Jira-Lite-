// server/src/modules/comments/comment.model.js
const { Schema, model, Types } = require('mongoose');

const commentSchema = new Schema(
  {
    task: { type: Types.ObjectId, ref: 'Task', required: true },
    project: { type: Types.ObjectId, ref: 'Project', required: true },
    author: { type: Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, trim: true, maxlength: 5000 },
    parentId: { type: Types.ObjectId, ref: 'Comment', default: null }, // 1-level nested replies
    mentions: [{ type: Types.ObjectId, ref: 'User' }],
    editedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null }, // Soft delete: "This message was deleted"
  },
  { timestamps: true }
);

// Indexes
commentSchema.index({ task: 1, createdAt: 1 });
commentSchema.index({ project: 1, createdAt: -1 });

module.exports = model('Comment', commentSchema);
