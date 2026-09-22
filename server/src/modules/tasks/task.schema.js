// server/src/modules/tasks/task.schema.js
const { z } = require('zod');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const createTaskSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1, 'Task title is required').max(200),
    description: z.string().trim().max(10000).optional(),
    columnId: z.string().regex(objectIdRegex, 'Invalid column ID format'),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    labels: z.array(z.string().trim().max(30)).optional().default([]),
    assignees: z.array(z.string().regex(objectIdRegex)).optional().default([]),
    dueDate: z.coerce.date().nullable().optional(),
  }),
});

const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(10000).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    labels: z.array(z.string().trim().max(30)).optional(),
    assignees: z.array(z.string().regex(objectIdRegex)).optional(),
    dueDate: z.coerce.date().nullable().optional(),
    version: z.number().int({ message: 'Version number is required for concurrency control' }),
  }),
});

const moveTaskSchema = z.object({
  body: z.object({
    toColumnId: z.string().regex(objectIdRegex, 'Invalid target column ID'),
    beforeId: z.string().regex(objectIdRegex).nullable().optional(),
    afterId: z.string().regex(objectIdRegex).nullable().optional(),
  }),
});

const getTasksFilterSchema = z.object({
  query: z.object({
    assignee: z.string().regex(objectIdRegex).optional(),
    label: z.string().trim().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    columnId: z.string().regex(objectIdRegex).optional(),
    q: z.string().trim().optional(),
  }),
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  moveTaskSchema,
  getTasksFilterSchema,
};
