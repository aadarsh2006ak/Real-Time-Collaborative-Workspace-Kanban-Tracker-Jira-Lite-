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

module.exports = { logActivity };
