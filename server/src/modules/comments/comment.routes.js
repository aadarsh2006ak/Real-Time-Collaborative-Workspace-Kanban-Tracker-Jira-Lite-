// server/src/modules/comments/comment.routes.js
const { Router } = require('express');
const commentController = require('./comment.controller');
const { auth } = require('../../middlewares/auth');
const { validate } = require('../../middlewares/validate');
const { createCommentSchema, updateCommentSchema } = require('./comment.schema');

const router = Router();

// Task-nested comment routes
router.post(
  '/tasks/:taskId/comments',
  auth,
  validate(createCommentSchema),
  commentController.createComment
);

router.get(
  '/tasks/:taskId/comments',
  auth,
  commentController.getTaskComments
);

// Standalone comment item routes
router.patch(
  '/comments/:commentId',
  auth,
  validate(updateCommentSchema),
  commentController.updateComment
);

router.delete(
  '/comments/:commentId',
  auth,
  commentController.deleteComment
);

module.exports = router;
