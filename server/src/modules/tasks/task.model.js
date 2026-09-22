// server/src/modules/tasks/task.model.js
const { Schema, model, Types } = require('mongoose');

const taskSchema = new Schema(
  {
    project: { type: Types.ObjectId, ref: 'Project', required: true },
    key: { type: String, required: true }, // e.g. "JIRA-42"
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '', maxlength: 10000 },
    columnId: { type: Types.ObjectId, required: true },
    position: { type: Number, required: true }, // Fractional index for O(1) reordering
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    labels: { type: [String], default: [] },
    assignees: [{ type: Types.ObjectId, ref: 'User' }],
    reporter: { type: Types.ObjectId, ref: 'User', required: true },
    dueDate: { type: Date, default: null },
    version: { type: Number, default: 0 }, // Optimistic Concurrency Control
    deletedAt: { type: Date, default: null }, // Soft delete support
  },
  { timestamps: true }
);

// Compound and text indexes for rapid retrieval & searching
taskSchema.index({ project: 1, columnId: 1, position: 1 });
taskSchema.index({ project: 1, key: 1 });
taskSchema.index({ title: 'text', description: 'text' });
taskSchema.index({ assignees: 1 });
taskSchema.index({ project: 1, deletedAt: 1 });

module.exports = model('Task', taskSchema);
