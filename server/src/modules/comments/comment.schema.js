// server/src/modules/comments/comment.schema.js
const { z } = require('zod');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const createCommentSchema = z.object({
  body: z.object({
    body: z
      .string()
      .trim()
      .min(1, 'Comment body cannot be empty')
      .max(5000, 'Comment cannot exceed 5000 characters'),
    parentId: z
      .string()
      .regex(objectIdRegex, 'Invalid parent comment ID')
      .optional()
      .nullable(),
    mentions: z
      .array(z.string().regex(objectIdRegex, 'Invalid mentioned user ID'))
      .optional()
      .default([]),
  }),
});

const updateCommentSchema = z.object({
  body: z.object({
    body: z
      .string()
      .trim()
      .min(1, 'Comment body cannot be empty')
      .max(5000, 'Comment cannot exceed 5000 characters'),
  }),
});

module.exports = {
  createCommentSchema,
  updateCommentSchema,
};
