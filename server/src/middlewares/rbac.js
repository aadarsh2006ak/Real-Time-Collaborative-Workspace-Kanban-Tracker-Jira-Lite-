// server/src/middlewares/rbac.js
const Project = require('../modules/projects/project.model');
const { AppError } = require('../utils/AppError');

const RANK = {
  viewer: 1,
  member: 2,
  admin: 3,
  owner: 4,
};

/**
 * Role-Based Access Control middleware for Project resources
 * @param {'viewer' | 'member' | 'admin' | 'owner'} minRole
 */
const requireRole = (minRole) => async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.body.project || req.query.projectId;
    if (!projectId) {
      return next(new AppError(400, 'Project ID is required for access verification', 'BAD_REQUEST'));
    }

    const project = await Project.findById(projectId).select('owner members columns');
    if (!project) {
      return next(new AppError(404, 'Project not found', 'NOT_FOUND'));
    }

    const userId = req.user.id;
    let role = null;

    if (String(project.owner) === userId) {
      role = 'owner';
    } else {
      const member = project.members.find((m) => String(m.user) === userId);
      if (member) {
        role = member.role;
      }
    }

    if (!role || RANK[role] < RANK[minRole]) {
      return next(
        new AppError(
          403,
          `Forbidden: You require '${minRole}' privileges or higher for this operation`,
          'FORBIDDEN'
        )
      );
    }

    req.project = project;
    req.role = role;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { requireRole, RANK };
