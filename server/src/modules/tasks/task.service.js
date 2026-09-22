// server/src/modules/tasks/task.service.js
const Task = require('./task.model');
const Project = require('../projects/project.model');
const { computePosition, rebalance, GAP } = require('../../utils/position');
const { logActivity } = require('../activity/activity.service');
const { emitToProject } = require('../../utils/emit');
const { AppError } = require('../../utils/AppError');

/**
 * Create a new task with atomic sequence key and append-to-column position
 */
async function createTask(projectId, taskData, actorId, req = null) {
  // Atomically increment project's taskCounter
  const project = await Project.findOneAndUpdate(
    { _id: projectId },
    { $inc: { taskCounter: 1 } },
    { new: true }
  );

  if (!project) {
    throw new AppError(404, 'Project not found', 'NOT_FOUND');
  }

  const columnExists = project.columns.id(taskData.columnId);
  if (!columnExists) {
    throw new AppError(400, 'Invalid column ID for this project', 'BAD_COLUMN');
  }

  // Calculate position at the end of the column
  const lastTask = await Task.findOne({
    project: projectId,
    columnId: taskData.columnId,
    deletedAt: null,
  })
    .sort({ position: -1 })
    .select('position')
    .lean();

  const position = lastTask ? lastTask.position + GAP : GAP;
  const taskKey = `${project.key}-${project.taskCounter}`;

  const task = await Task.create({
    project: projectId,
    key: taskKey,
    title: taskData.title,
    description: taskData.description || '',
    columnId: taskData.columnId,
    position,
    priority: taskData.priority || 'medium',
    labels: taskData.labels || [],
    assignees: taskData.assignees || [],
    reporter: actorId,
    dueDate: taskData.dueDate || null,
    version: 0,
    deletedAt: null,
  });

  await task.populate('assignees reporter', 'name email avatarUrl');

  // Audit Log & Real-time Socket Broadcast
  await logActivity(
    {
      project: projectId,
      task: task._id,
      actor: actorId,
      type: 'TASK_CREATED',
      meta: { title: task.title, key: task.key },
    },
    req
  );

  if (req) {
    emitToProject(req, projectId, 'task:created', { task });
  }

  return task;
}

/**
 * Fetch all tasks for a project with advanced multi-filters and text search
 */
async function getProjectTasks(projectId, filters = {}) {
  const query = { project: projectId, deletedAt: null };

  // 1. Column Filter
  if (filters.columnId) query.columnId = filters.columnId;

  // 2. Priority Filter (Single or Array / Comma-separated)
  if (filters.priority) {
    const priorities = Array.isArray(filters.priority)
      ? filters.priority
      : filters.priority.split(',').map((p) => p.trim()).filter(Boolean);
    if (priorities.length === 1) {
      query.priority = priorities[0];
    } else if (priorities.length > 1) {
      query.priority = { $in: priorities };
    }
  }

  // 3. Assignees Filter (Single or Array / Comma-separated)
  const rawAssignees = filters.assignees || filters.assignee;
  if (rawAssignees) {
    const assigneeList = Array.isArray(rawAssignees)
      ? rawAssignees
      : rawAssignees.split(',').map((a) => a.trim()).filter(Boolean);
    if (assigneeList.length === 1) {
      query.assignees = assigneeList[0];
    } else if (assigneeList.length > 1) {
      query.assignees = { $in: assigneeList };
    }
  }

  // 4. Labels Filter (Single or Array / Comma-separated)
  const rawLabels = filters.labels || filters.label;
  if (rawLabels) {
    const labelList = Array.isArray(rawLabels)
      ? rawLabels
      : rawLabels.split(',').map((l) => l.trim()).filter(Boolean);
    if (labelList.length === 1) {
      query.labels = labelList[0];
    } else if (labelList.length > 1) {
      query.labels = { $in: labelList };
    }
  }

  // 5. Overdue and Date Range Filters
  if (filters.isOverdue === true || filters.isOverdue === 'true') {
    query.dueDate = { $lt: new Date() };
  } else if (filters.dueBefore || filters.dueAfter) {
    query.dueDate = {};
    if (filters.dueBefore) query.dueDate.$lte = new Date(filters.dueBefore);
    if (filters.dueAfter) query.dueDate.$gte = new Date(filters.dueAfter);
  }

  // 6. Text Search across Title, Description, and Key
  if (filters.q && filters.q.trim()) {
    const term = filters.q.trim();
    query.$or = [
      { title: { $regex: term, $options: 'i' } },
      { description: { $regex: term, $options: 'i' } },
      { key: { $regex: term, $options: 'i' } },
    ];
  }

  const tasks = await Task.find(query)
    .sort({ columnId: 1, position: 1 })
    .populate('assignees reporter', 'name email avatarUrl');

  return tasks;
}

/**
 * Get single task details
 */
async function getTaskById(taskId) {
  const task = await Task.findOne({ _id: taskId, deletedAt: null }).populate(
    'assignees reporter',
    'name email avatarUrl'
  );

  if (!task) {
    throw new AppError(404, 'Task not found', 'NOT_FOUND');
  }

  return task;
}

/**
 * Update task fields with Optimistic Concurrency Control (OCC)
 */
async function updateTask(taskId, updateData, actorId, req = null) {
  const { version, ...fields } = updateData;

  const taskBefore = await Task.findOne({ _id: taskId, deletedAt: null });
  if (!taskBefore) {
    throw new AppError(404, 'Task not found', 'NOT_FOUND');
  }

  // Atomic OCC Update: matches both _id and current version
  const updatedTask = await Task.findOneAndUpdate(
    { _id: taskId, version, deletedAt: null },
    { $set: fields, $inc: { version: 1 } },
    { new: true, runValidators: true }
  ).populate('assignees reporter', 'name email avatarUrl');

  if (!updatedTask) {
    throw new AppError(
      409,
      'Conflict: Task was modified by another user. Please reload the latest state.',
      'VERSION_CONFLICT'
    );
  }

  // Audit Log & Real-time Socket Broadcast
  await logActivity(
    {
      project: updatedTask.project,
      task: updatedTask._id,
      actor: actorId,
      type: 'TASK_UPDATED',
      meta: { changes: fields },
    },
    req
  );

  if (req) {
    emitToProject(req, updatedTask.project, 'task:updated', { task: updatedTask });
  }

  return updatedTask;
}

/**
 * Reorder task using fractional indexing
 */
async function moveTask({ taskId, toColumnId, beforeId, afterId, actorId }, req = null) {
  const task = await Task.findOne({ _id: taskId, deletedAt: null });
  if (!task) {
    throw new AppError(404, 'Task not found', 'NOT_FOUND');
  }

  const project = await Project.findById(task.project).select('columns');
  if (!project.columns.id(toColumnId)) {
    throw new AppError(400, 'Invalid destination column ID', 'BAD_COLUMN');
  }

  const fromColumnId = task.columnId;
  const newPosition = await computePosition(beforeId, afterId, Task);

  task.columnId = toColumnId;
  task.position = newPosition;
  task.version += 1;
  await task.save();

  // Trigger column rebalance if precision gap narrows below threshold
  const MIN_GAP = 1e-6;
  if (beforeId && afterId) {
    const [beforeTask, afterTask] = await Promise.all([
      Task.findById(beforeId).select('position').lean(),
      Task.findById(afterId).select('position').lean(),
    ]);
    if (beforeTask && afterTask && Math.abs(afterTask.position - beforeTask.position) < MIN_GAP) {
      await rebalance(task.project, toColumnId, Task);
    }
  }

  await task.populate('assignees reporter', 'name email avatarUrl');

  // Audit log & Real-time Socket Broadcast
  await logActivity(
    {
      project: task.project,
      task: task._id,
      actor: actorId,
      type: 'TASK_MOVED',
      meta: { from: fromColumnId, to: toColumnId, position: newPosition },
    },
    req
  );

  if (req) {
    emitToProject(req, task.project, 'task:moved', { task });
  }

  return task;
}

/**
 * Soft delete task
 */
async function deleteTask(taskId, actorId, req = null) {
  const task = await Task.findOneAndUpdate(
    { _id: taskId, deletedAt: null },
    { $set: { deletedAt: new Date() } },
    { new: true }
  );

  if (!task) {
    throw new AppError(404, 'Task not found', 'NOT_FOUND');
  }

  await logActivity(
    {
      project: task.project,
      task: task._id,
      actor: actorId,
      type: 'TASK_DELETED',
      meta: { title: task.title, key: task.key },
    },
    req
  );

  if (req) {
    emitToProject(req, task.project, 'task:deleted', { taskId: task._id });
  }

  return { message: 'Task deleted successfully' };
}

module.exports = {
  createTask,
  getProjectTasks,
  getTaskById,
  updateTask,
  moveTask,
  deleteTask,
};
