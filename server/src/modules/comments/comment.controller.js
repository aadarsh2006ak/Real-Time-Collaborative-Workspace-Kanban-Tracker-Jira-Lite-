// server/src/modules/comments/comment.controller.js
const commentService = require('./comment.service');

exports.createComment = async (req, res, next) => {
  try {
    const comment = await commentService.createComment(
      req.params.taskId,
      req.user.id,
      req.valid.body,
      req
    );
    res.status(201).json({
      success: true,
      data: { comment },
    });
  } catch (err) {
    next(err);
  }
};

exports.getTaskComments = async (req, res, next) => {
  try {
    const comments = await commentService.getTaskComments(req.params.taskId);
    res.status(200).json({
      success: true,
      data: { comments },
    });
  } catch (err) {
    next(err);
  }
};

exports.updateComment = async (req, res, next) => {
  try {
    const comment = await commentService.updateComment(
      req.params.commentId,
      req.user.id,
      req.valid.body,
      req
    );
    res.status(200).json({
      success: true,
      data: { comment },
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteComment = async (req, res, next) => {
  try {
    const result = await commentService.deleteComment(
      req.params.commentId,
      req.user.id,
      req
    );
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};
