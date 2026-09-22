// server/src/modules/projects/project.schema.js
const { z } = require('zod');

const createProjectSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Project name must be at least 2 characters').max(100),
    key: z
      .string()
      .trim()
      .toUpperCase()
      .min(2, 'Key must be at least 2 characters')
      .max(10, 'Key must be at most 10 characters')
      .regex(/^[A-Z0-9]+$/, 'Project key must contain only uppercase alphanumeric characters'),
    description: z.string().trim().max(1000).optional(),
  }),
});

const updateProjectSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),
    description: z.string().trim().max(1000).optional(),
  }),
});

const addMemberSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Invalid email address').toLowerCase(),
    role: z.enum(['admin', 'member', 'viewer']).default('member'),
  }),
});

const updateMemberRoleSchema = z.object({
  body: z.object({
    role: z.enum(['admin', 'member', 'viewer']),
  }),
});

const addColumnSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Column name is required').max(50),
    wipLimit: z.number().int().min(0, 'WIP limit cannot be negative').default(0),
  }),
});

const updateColumnSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(50).optional(),
    wipLimit: z.number().int().min(0).optional(),
    order: z.number().int().min(0).optional(),
  }),
});

module.exports = {
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema,
  updateMemberRoleSchema,
  addColumnSchema,
  updateColumnSchema,
};
