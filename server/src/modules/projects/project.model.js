// server/src/modules/projects/project.model.js
const { Schema, model, Types } = require('mongoose');

const columnSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    order: { type: Number, required: true },
    wipLimit: { type: Number, default: 0 }, // 0 = no limit
  },
  { _id: true }
);

const memberSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User', required: true },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member', 'viewer'],
      default: 'member',
    },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const projectSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    key: { type: String, required: true, uppercase: true, trim: true, unique: true, maxlength: 10 },
    description: { type: String, default: '', maxlength: 1000 },
    owner: { type: Types.ObjectId, ref: 'User', required: true },
    members: { type: [memberSchema], default: [] },
    columns: {
      type: [columnSchema],
      default: () => [
        { name: 'To Do', order: 0, wipLimit: 0 },
        { name: 'In Progress', order: 1, wipLimit: 0 },
        { name: 'In Review', order: 2, wipLimit: 0 },
        { name: 'Done', order: 3, wipLimit: 0 },
      ],
    },
    taskCounter: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Indexes
projectSchema.index({ key: 1 });
projectSchema.index({ 'members.user': 1 });
projectSchema.index({ owner: 1 });

module.exports = model('Project', projectSchema);
