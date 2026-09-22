// server/src/modules/activity/activity.service.js
const Activity = require('./activity.model');
const { emitToProject } = require('../../utils/emit');

/**
 * Logs an immutable activity audit trail item and emits a real-time event
 */
async function logActivity({ project, task, actor, type, meta = {} }, req = null) {
  const activity = await Activity.create({
    project,
    task: task || null,
    actor,
    type,
    meta,
  });

  await activity.populate('actor', 'name email avatarUrl');

  if (req) {
    emitToProject(req, project, 'activity:new', { activity });
  }

  return activity;
}

/**
 * Fetch activity stream for an entire project with pagination
 */
async function getProjectActivities(projectId, { limit = 50, page = 1 } = {}) {
  const query = { project: projectId };
  const skip = (Number(page) - 1) * Number(limit);

  const [activities, total] = await Promise.all([
    Activity.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('actor', 'name email avatarUrl')
      .populate('task', 'key title')
      .lean(),
    Activity.countDocuments(query),
  ]);

  return {
    activities,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)) || 1,
    },
  };
}

/**
 * Fetch activity history for a specific task
 */
async function getTaskActivities(taskId, { limit = 50, page = 1 } = {}) {
  const query = { task: taskId };
  const skip = (Number(page) - 1) * Number(limit);

  const [activities, total] = await Promise.all([
    Activity.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('actor', 'name email avatarUrl')
      .lean(),
    Activity.countDocuments(query),
  ]);

  return {
    activities,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)) || 1,
    },
  };
}

module.exports = {
  logActivity,
  getProjectActivities,
  getTaskActivities,
};
