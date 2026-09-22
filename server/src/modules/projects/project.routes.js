// server/src/modules/projects/project.routes.js
const { Router } = require('express');
const projectController = require('./project.controller');
const {
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema,
  updateMemberRoleSchema,
  addColumnSchema,
  updateColumnSchema,
} = require('./project.schema');
const { validate } = require('../../middlewares/validate');
const { auth } = require('../../middlewares/auth');
const { requireRole } = require('../../middlewares/rbac');

const router = Router();

// Apply auth to all project routes
router.use(auth);

// Project Collection endpoints
router.get('/', projectController.getUserProjects);
router.post('/', validate(createProjectSchema), projectController.createProject);

// Project Item endpoints
router.get('/:projectId', requireRole('viewer'), projectController.getProject);
router.get('/:projectId/analytics', requireRole('viewer'), projectController.getProjectAnalytics);
router.patch('/:projectId', requireRole('admin'), validate(updateProjectSchema), projectController.updateProject);
router.delete('/:projectId', requireRole('owner'), projectController.deleteProject);

// Member Management endpoints
router.post('/:projectId/members', requireRole('admin'), validate(addMemberSchema), projectController.addMember);
router.patch(
  '/:projectId/members/:userId',
  requireRole('admin'),
  validate(updateMemberRoleSchema),
  projectController.updateMemberRole
);
router.delete('/:projectId/members/:userId', requireRole('admin'), projectController.removeMember);

// Column Management endpoints
router.post('/:projectId/columns', requireRole('admin'), validate(addColumnSchema), projectController.addColumn);
router.patch(
  '/:projectId/columns/:columnId',
  requireRole('admin'),
  validate(updateColumnSchema),
  projectController.updateColumn
);
router.delete('/:projectId/columns/:columnId', requireRole('admin'), projectController.deleteColumn);

module.exports = router;
