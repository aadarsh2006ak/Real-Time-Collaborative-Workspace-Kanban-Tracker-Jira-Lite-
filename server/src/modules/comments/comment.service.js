// server/src/modules/comments/comment.service.js
const Comment = require('./comment.model');
const Task = require('../tasks/task.model');
const Project = require('../projects/project.model');
const { logActivity } = require('../activity/activity.service');
const { createNotification } = require('../notifications/notification.service');
const { emitToProject } = require('../../utils/emit');
const { AppError } = require('../../utils/AppError');

/**
 * Creates a comment on a task, logs activity, creates notifications, and broadcasts via WebSocket
 */
async function createComment(taskId, actorId, { body, parentId = null, mentions = [] }, req = null) {
  const task = await Task.findOne({ _id: taskId, deletedAt: null });
  if (!task) {
    throw new AppError(404, 'Task not found', 'NOT_FOUND');
  }

  if (parentId) {
    const parentComment = await Comment.findOne({
      _id: parentId,
      task: taskId,
      deletedAt: null,
    });
    if (!parentComment) {
      throw new AppError(404, 'Parent comment not found', 'NOT_FOUND');
    }
  }

  const comment = await Comment.create({
    task: taskId,
    project: task.project,
    author: actorId,
    body,
    parentId: parentId || null,
    mentions: mentions || [],
    editedAt: null,
    deletedAt: null,
  });

  await comment.populate('author', 'name email avatarUrl');

  // Log Activity
  await logActivity(
    {
      project: task.project,
      task: task._id,
      actor: actorId,
      type: 'COMMENT_ADDED',
      meta: {
        taskKey: task.key,
        commentId: comment._id,
        preview: body.slice(0, 100),
      },
    },
    req
  );

  // Real-Time Project Broadcast
  if (req) {
    emitToProject(req, task.project, 'comment:created', {
      comment,
      taskId: task._id,
    });
  }

  // Create notifications for assignees & mentioned users
  const io = req?.app?.get('io');
  const notifyUserIds = new Set();

  // 1. Task Assignees
  (task.assignees || []).forEach((uid) => {
    const stringId = uid.toString();
    if (stringId !== actorId.toString()) {
      notifyUserIds.add(stringId);
    }
  });

  // 2. Mentioned Users
  (mentions || []).forEach((uid) => {
    const stringId = uid.toString();
    if (stringId !== actorId.toString()) {
      notifyUserIds.add(stringId);
    }
  });

  const actorName = req?.user?.name || 'A team member';

  for (const userId of notifyUserIds) {
    const isMention = mentions.some((m) => m.toString() === userId);
    await createNotification(
      {
        user: userId,
        type: isMention ? 'MENTION' : 'COMMENT',
        refType: 'Task',
        refId: task._id,
        title: isMention
          ? `${actorName} mentioned you on ${task.key}`
          : `New comment on ${task.key}`,
        message: body.length > 80 ? `${body.slice(0, 77)}...` : body,
      },
      io
    );
  }

  return comment;
}

/**
 * Get all active comments for a task
 */
async function getTaskComments(taskId) {
  const task = await Task.findOne({ _id: taskId, deletedAt: null });
  if (!task) {
    throw new AppError(404, 'Task not found', 'NOT_FOUND');
  }

  const comments = await Comment.find({ task: taskId })
    .sort({ createdAt: 1 })
    .populate('author', 'name email avatarUrl');

  // Return comments with placeholder body if deleted
  return comments.map((c) => {
    if (c.deletedAt) {
      return {
        _id: c._id,
        task: c.task,
        project: c.project,
        author: c.author,
        body: 'This comment was deleted.',
        parentId: c.parentId,
        isDeleted: true,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      };
    }
    return c;
  });
}

/**
 * Update comment content
 */
async function updateComment(commentId, actorId, { body }, req = null) {
  const comment = await Comment.findOne({ _id: commentId, deletedAt: null });
  if (!comment) {
    throw new AppError(404, 'Comment not found', 'NOT_FOUND');
  }

  // Only author can update comment
  if (comment.author.toString() !== actorId.toString()) {
    throw new AppError(403, 'You are not authorized to edit this comment', 'FORBIDDEN');
  }

  comment.body = body;
  comment.editedAt = new Date();
  await comment.save();
  await comment.populate('author', 'name email avatarUrl');

  if (req) {
    emitToProject(req, comment.project, 'comment:updated', {
      comment,
      taskId: comment.task,
    });
  }

  return comment;
}

/**
 * Soft delete a comment
 */
async function deleteComment(commentId, actorId, req = null) {
  const comment = await Comment.findOne({ _id: commentId, deletedAt: null });
  if (!comment) {
    throw new AppError(404, 'Comment not found', 'NOT_FOUND');
  }

  const project = await Project.findById(comment.project);
  const isAuthor = comment.author.toString() === actorId.toString();
  const isOwner = project && project.owner.toString() === actorId.toString();
  const member = project?.members?.find((m) => m.user.toString() === actorId.toString());
  const isAdmin = member && (member.role === 'admin' || member.role === 'owner');

  if (!isAuthor && !isOwner && !isAdmin) {
    throw new AppError(403, 'You are not authorized to delete this comment', 'FORBIDDEN');
  }

  comment.deletedAt = new Date();
  await comment.save();

  if (req) {
    emitToProject(req, comment.project, 'comment:deleted', {
      commentId: comment._id,
      taskId: comment.task,
    });
  }

  return { message: 'Comment deleted successfully' };
}

module.exports = {
  createComment,
  getTaskComments,
  updateComment,
  deleteComment,
};
