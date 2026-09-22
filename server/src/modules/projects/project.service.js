// server/src/modules/projects/project.service.js
const Project = require('./project.model');
const User = require('../users/user.model');
const Task = require('../tasks/task.model');
const { AppError } = require('../../utils/AppError');

/**
 * Create a new project with default workflow columns
 */
async function createProject({ name, key, description }, userId) {
  const existingKey = await Project.findOne({ key: key.toUpperCase() });
  if (existingKey) {
    throw new AppError(409, `Project key '${key.toUpperCase()}' is already taken`, 'KEY_TAKEN');
  }

  const project = await Project.create({
    name,
    key: key.toUpperCase(),
    description: description || '',
    owner: userId,
    members: [],
    columns: [
      { name: 'To Do', order: 0, wipLimit: 0 },
      { name: 'In Progress', order: 1, wipLimit: 0 },
      { name: 'In Review', order: 2, wipLimit: 0 },
      { name: 'Done', order: 3, wipLimit: 0 },
    ],
    taskCounter: 0,
  });

  return project.populate('owner', 'name email avatarUrl');
}

/**
 * Get all projects where the user is an owner or member
 */
async function getUserProjects(userId) {
  const projects = await Project.find({
    $or: [{ owner: userId }, { 'members.user': userId }],
  })
    .sort({ updatedAt: -1 })
    .populate('owner', 'name email avatarUrl')
    .populate('members.user', 'name email avatarUrl');

  return projects;
}

/**
 * Get single project by ID with populated members and columns
 */
async function getProjectById(projectId) {
  const project = await Project.findById(projectId)
    .populate('owner', 'name email avatarUrl')
    .populate('members.user', 'name email avatarUrl');

  if (!project) {
    throw new AppError(404, 'Project not found', 'NOT_FOUND');
  }

  return project;
}

/**
 * Update project metadata (name, description)
 */
async function updateProject(projectId, updateData) {
  const project = await Project.findByIdAndUpdate(
    projectId,
    { $set: updateData },
    { new: true, runValidators: true }
  )
    .populate('owner', 'name email avatarUrl')
    .populate('members.user', 'name email avatarUrl');

  if (!project) {
    throw new AppError(404, 'Project not found', 'NOT_FOUND');
  }

  return project;
}

/**
 * Delete a project and cascade delete tasks
 */
async function deleteProject(projectId) {
  const project = await Project.findByIdAndDelete(projectId);
  if (!project) {
    throw new AppError(404, 'Project not found', 'NOT_FOUND');
  }

  // Cleanup tasks in background
  await Task.deleteMany({ project: projectId });

  return { message: 'Project deleted successfully' };
}

/**
 * Add a member to a project by email
 */
async function addMember(projectId, { email, role }) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new AppError(404, `No user found with email '${email}'`, 'USER_NOT_FOUND');
  }

  const project = await Project.findById(projectId);
  if (!project) {
    throw new AppError(404, 'Project not found', 'NOT_FOUND');
  }

  if (String(project.owner) === String(user._id)) {
    throw new AppError(409, 'User is the owner of this project', 'MEMBER_EXISTS');
  }

  const isAlreadyMember = project.members.some((m) => String(m.user) === String(user._id));
  if (isAlreadyMember) {
    throw new AppError(409, 'User is already a member of this project', 'MEMBER_EXISTS');
  }

  project.members.push({
    user: user._id,
    role: role || 'member',
  });

  await project.save();
  await project.populate('members.user', 'name email avatarUrl');

  return project;
}

/**
 * Update a member's role in a project
 */
async function updateMemberRole(projectId, targetUserId, newRole) {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new AppError(404, 'Project not found', 'NOT_FOUND');
  }

  if (String(project.owner) === String(targetUserId)) {
    throw new AppError(400, 'Cannot change the project owner role', 'CANNOT_MODIFY_OWNER');
  }

  const member = project.members.find((m) => String(m.user) === String(targetUserId));
  if (!member) {
    throw new AppError(404, 'Member not found in project', 'NOT_FOUND');
  }

  member.role = newRole;
  await project.save();
  await project.populate('members.user', 'name email avatarUrl');

  return project;
}

/**
 * Remove a member from a project
 */
async function removeMember(projectId, targetUserId) {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new AppError(404, 'Project not found', 'NOT_FOUND');
  }

  if (String(project.owner) === String(targetUserId)) {
    throw new AppError(400, 'Cannot remove the project owner from project', 'CANNOT_REMOVE_OWNER');
  }

  project.members = project.members.filter((m) => String(m.user) !== String(targetUserId));
  await project.save();
  await project.populate('members.user', 'name email avatarUrl');

  return project;
}

/**
 * Add a new workflow column
 */
async function addColumn(projectId, { name, wipLimit }) {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new AppError(404, 'Project not found', 'NOT_FOUND');
  }

  const order = project.columns.length;
  project.columns.push({
    name,
    order,
    wipLimit: wipLimit || 0,
  });

  await project.save();
  return project.columns[project.columns.length - 1];
}

/**
 * Update an existing column
 */
async function updateColumn(projectId, columnId, updateData) {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new AppError(404, 'Project not found', 'NOT_FOUND');
  }

  const column = project.columns.id(columnId);
  if (!column) {
    throw new AppError(404, 'Column not found', 'NOT_FOUND');
  }

  if (updateData.name !== undefined) column.name = updateData.name;
  if (updateData.wipLimit !== undefined) column.wipLimit = updateData.wipLimit;
  if (updateData.order !== undefined) column.order = updateData.order;

  await project.save();
  return column;
}

/**
 * Delete a column (only if empty)
 */
async function deleteColumn(projectId, columnId) {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new AppError(404, 'Project not found', 'NOT_FOUND');
  }

  const column = project.columns.id(columnId);
  if (!column) {
    throw new AppError(404, 'Column not found', 'NOT_FOUND');
  }

  // Check if active tasks exist in this column
  const taskCount = await Task.countDocuments({
    project: projectId,
    columnId,
    deletedAt: null,
  });

  if (taskCount > 0) {
    throw new AppError(
      400,
      `Cannot delete column containing ${taskCount} active task(s). Move or delete tasks first.`,
      'COLUMN_NOT_EMPTY'
    );
  }

  project.columns.pull({ _id: columnId });
  await project.save();

  return { message: 'Column deleted successfully' };
}

/**
 * Calculates board health metrics, WIP adherence, cycle time, and workload distribution
 */
async function getProjectAnalytics(projectId) {
  const project = await Project.findById(projectId)
    .populate('members.user', 'name email avatarUrl')
    .lean();

  if (!project) {
    throw new AppError(404, 'Project not found', 'NOT_FOUND');
  }

  const tasks = await Task.find({ project: projectId, deletedAt: null })
    .populate('assignees', 'name email avatarUrl')
    .lean();

  const totalTasks = tasks.length;
  const lastCol = project.columns[project.columns.length - 1];
  const doneColId = lastCol ? String(lastCol._id) : null;

  // 1. Column Health & WIP Compliance
  const columnHealth = project.columns.map((col) => {
    const colTaskCount = tasks.filter((t) => String(t.columnId) === String(col._id)).length;
    const isExceeded = col.wipLimit > 0 && colTaskCount > col.wipLimit;
    const isAtLimit = col.wipLimit > 0 && colTaskCount === col.wipLimit;
    const utilization = col.wipLimit > 0 ? Math.round((colTaskCount / col.wipLimit) * 100) : null;

    return {
      columnId: col._id,
      name: col.name,
      wipLimit: col.wipLimit,
      taskCount: colTaskCount,
      isExceeded,
      isAtLimit,
      utilization,
    };
  });

  // 2. Completed vs Active Tasks
  const completedTasks = doneColId
    ? tasks.filter((t) => String(t.columnId) === doneColId).length
    : 0;
  const activeTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // 3. Overdue Tasks
  const now = new Date();
  const overdueTasks = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < now && String(t.columnId) !== doneColId
  ).length;

  // 4. Priority Breakdown
  const priorityBreakdown = {
    urgent: 0,
    high: 0,
    medium: 0,
    low: 0,
  };
  tasks.forEach((t) => {
    if (priorityBreakdown[t.priority] !== undefined) {
      priorityBreakdown[t.priority] += 1;
    }
  });

  // 5. Assignee Workload Distribution
  const workloadMap = new Map();
  let unassignedCount = 0;

  // Initialize with all project members
  (project.members || []).forEach((m) => {
    if (m.user) {
      workloadMap.set(String(m.user._id), {
        userId: m.user._id,
        name: m.user.name,
        email: m.user.email,
        taskCount: 0,
      });
    }
  });

  tasks.forEach((t) => {
    if (!t.assignees || t.assignees.length === 0) {
      unassignedCount += 1;
    } else {
      t.assignees.forEach((a) => {
        const key = String(a._id || a);
        if (workloadMap.has(key)) {
          workloadMap.get(key).taskCount += 1;
        } else {
          workloadMap.set(key, {
            userId: a._id || a,
            name: a.name || 'Member',
            email: a.email || '',
            taskCount: 1,
          });
        }
      });
    }
  });

  const assigneeWorkload = Array.from(workloadMap.values());

  return {
    projectId,
    projectName: project.name,
    totalTasks,
    activeTasks,
    completedTasks,
    completionRate,
    overdueTasks,
    columnHealth,
    priorityBreakdown,
    assigneeWorkload,
    unassignedCount,
  };
}

module.exports = {
  createProject,
  getUserProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  updateMemberRole,
  removeMember,
  addColumn,
  updateColumn,
  deleteColumn,
  getProjectAnalytics,
};
