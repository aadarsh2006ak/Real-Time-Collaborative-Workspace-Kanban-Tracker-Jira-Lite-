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

/**
 * Export project tasks in JSON or RFC 4180 CSV format
 */
async function exportProjectTasks(projectId, format = 'json') {
  const project = await Project.findById(projectId).select('name key columns').lean();
  if (!project) {
    throw new AppError(404, 'Project not found', 'NOT_FOUND');
  }

  const tasks = await Task.find({ project: projectId, deletedAt: null })
    .sort({ columnId: 1, position: 1 })
    .populate('assignees reporter', 'name email avatarUrl')
    .lean();

  const columnsMap = {};
  (project.columns || []).forEach((c) => {
    columnsMap[String(c._id)] = c.name;
  });

  if (format === 'csv') {
    const { tasksToCsv } = require('./task.export');
    return {
      contentType: 'text/csv',
      filename: `${project.key}-export.csv`,
      data: tasksToCsv(tasks, columnsMap),
    };
  }

  return {
    contentType: 'application/json',
    filename: `${project.key}-export.json`,
    data: tasks.map((t) => ({
      key: t.key,
      title: t.title,
      description: t.description,
      column: columnsMap[String(t.columnId)] || 'Unknown',
      columnId: t.columnId,
      priority: t.priority,
      labels: t.labels,
      assignees: t.assignees,
      reporter: t.reporter,
      dueDate: t.dueDate,
      createdAt: t.createdAt,
    })),
  };
}

/**
 * Bulk import tasks with automatic sequence keys and column assignment
 */
async function importProjectTasks(projectId, items = [], actorId, req = null) {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new AppError(404, 'Project not found', 'NOT_FOUND');
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError(400, 'Import payload must be a non-empty array of task items', 'INVALID_PAYLOAD');
  }

  const columnsByName = {};
  (project.columns || []).forEach((c) => {
    columnsByName[c.name.toLowerCase().trim()] = c._id;
  });
  const defaultColId = project.columns[0]?._id;

  const createdTasks = [];

  for (const item of items) {
    if (!item.title || !String(item.title).trim()) continue;

    // Resolve column
    let targetColId = defaultColId;
    if (item.columnId && project.columns.id(item.columnId)) {
      targetColId = item.columnId;
    } else if (item.column && columnsByName[String(item.column).toLowerCase().trim()]) {
      targetColId = columnsByName[String(item.column).toLowerCase().trim()];
    }

    // Atomic counter increment
    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { $inc: { taskCounter: 1 } },
      { new: true }
    );

    const taskKey = `${project.key}-${updatedProject.taskCounter}`;

    const lastTask = await Task.findOne({
      project: projectId,
      columnId: targetColId,
      deletedAt: null,
    })
      .sort({ position: -1 })
      .select('position')
      .lean();

    const position = lastTask ? lastTask.position + GAP : GAP;

    const task = await Task.create({
      project: projectId,
      key: taskKey,
      title: String(item.title).trim(),
      description: item.description ? String(item.description).trim() : '',
      columnId: targetColId,
      position,
      priority: ['low', 'medium', 'high', 'urgent'].includes(item.priority)
        ? item.priority
        : 'medium',
      labels: Array.isArray(item.labels)
        ? item.labels
        : typeof item.labels === 'string'
        ? item.labels.split(';').map((l) => l.trim()).filter(Boolean)
        : [],
      assignees: [],
      reporter: actorId,
      dueDate: item.dueDate ? new Date(item.dueDate) : null,
      version: 0,
      deletedAt: null,
    });

    createdTasks.push(task);

    if (req) {
      emitToProject(req, projectId, 'task:created', { task });
    }
  }

  await logActivity(
    {
      project: projectId,
      actor: actorId,
      type: 'TASK_CREATED',
      meta: { bulk: true, count: createdTasks.length },
    },
    req
  );

  return {
    importedCount: createdTasks.length,
    tasks: createdTasks,
  };
}

/**
 * Bulk move tasks to a target column
 */
async function bulkMoveTasks(projectId, { taskIds, toColumnId }, actorId, req = null) {
  const project = await Project.findById(projectId);
  if (!project || !project.columns.id(toColumnId)) {
    throw new AppError(400, 'Invalid destination column ID', 'BAD_COLUMN');
  }

  const lastTask = await Task.findOne({
    project: projectId,
    columnId: toColumnId,
    deletedAt: null,
  })
    .sort({ position: -1 })
    .select('position')
    .lean();

  let startPos = lastTask ? lastTask.position : 0;

  const updatedTasks = [];
  for (let i = 0; i < taskIds.length; i++) {
    startPos += GAP;
    const task = await Task.findOneAndUpdate(
      { _id: taskIds[i], project: projectId, deletedAt: null },
      { $set: { columnId: toColumnId, position: startPos }, $inc: { version: 1 } },
      { new: true }
    ).populate('assignees reporter', 'name email avatarUrl');

    if (task) {
      updatedTasks.push(task);
      if (req) {
        emitToProject(req, projectId, 'task:moved', { task });
      }
    }
  }

  await logActivity(
    {
      project: projectId,
      actor: actorId,
      type: 'TASK_MOVED',
      meta: { bulk: true, count: updatedTasks.length, to: toColumnId },
    },
    req
  );

  return { updatedCount: updatedTasks.length, tasks: updatedTasks };
}

/**
 * Bulk soft delete tasks
 */
async function bulkDeleteTasks(projectId, { taskIds }, actorId, req = null) {
  await Task.updateMany(
    { _id: { $in: taskIds }, project: projectId, deletedAt: null },
    { $set: { deletedAt: new Date() } }
  );

  taskIds.forEach((taskId) => {
    if (req) {
      emitToProject(req, projectId, 'task:deleted', { taskId });
    }
  });

  await logActivity(
    {
      project: projectId,
      actor: actorId,
      type: 'TASK_DELETED',
      meta: { bulk: true, count: taskIds.length },
    },
    req
  );

  return { message: 'Tasks deleted successfully', deletedCount: taskIds.length };
}

/**
 * Bulk update priority or labels
 */
async function bulkUpdateTasks(projectId, { taskIds, updates }, actorId, req = null) {
  const allowed = {};
  if (updates.priority) allowed.priority = updates.priority;
  if (updates.labels) allowed.labels = updates.labels;

  await Task.updateMany(
    { _id: { $in: taskIds }, project: projectId, deletedAt: null },
    { $set: allowed, $inc: { version: 1 } }
  );

  return { message: 'Tasks updated successfully', updatedCount: taskIds.length };
}

module.exports = {
  createTask,
  getProjectTasks,
  getTaskById,
  updateTask,
  moveTask,
  deleteTask,
  exportProjectTasks,
  importProjectTasks,
  bulkMoveTasks,
  bulkDeleteTasks,
  bulkUpdateTasks,
};
