// server/src/modules/projects/project.controller.js
const projectService = require('./project.service');

exports.createProject = async (req, res, next) => {
  try {
    const project = await projectService.createProject(req.valid.body, req.user.id);
    res.status(201).json({
      success: true,
      data: { project },
    });
  } catch (err) {
    next(err);
  }
};

exports.getUserProjects = async (req, res, next) => {
  try {
    const projects = await projectService.getUserProjects(req.user.id);
    res.status(200).json({
      success: true,
      data: { projects },
    });
  } catch (err) {
    next(err);
  }
};

exports.getProject = async (req, res, next) => {
  try {
    const project = await projectService.getProjectById(req.params.projectId);
    res.status(200).json({
      success: true,
      data: {
        project,
        currentUserRole: req.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.updateProject = async (req, res, next) => {
  try {
    const project = await projectService.updateProject(req.params.projectId, req.valid.body);
    res.status(200).json({
      success: true,
      data: { project },
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteProject = async (req, res, next) => {
  try {
    const result = await projectService.deleteProject(req.params.projectId);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

exports.addMember = async (req, res, next) => {
  try {
    const project = await projectService.addMember(req.params.projectId, req.valid.body);
    res.status(200).json({
      success: true,
      data: {
        members: project.members,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.updateMemberRole = async (req, res, next) => {
  try {
    const project = await projectService.updateMemberRole(
      req.params.projectId,
      req.params.userId,
      req.valid.body.role
    );
    res.status(200).json({
      success: true,
      data: {
        members: project.members,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.removeMember = async (req, res, next) => {
  try {
    const project = await projectService.removeMember(req.params.projectId, req.params.userId);
    res.status(200).json({
      success: true,
      data: {
        members: project.members,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.addColumn = async (req, res, next) => {
  try {
    const column = await projectService.addColumn(req.params.projectId, req.valid.body);
    res.status(201).json({
      success: true,
      data: { column },
    });
  } catch (err) {
    next(err);
  }
};

exports.updateColumn = async (req, res, next) => {
  try {
    const column = await projectService.updateColumn(
      req.params.projectId,
      req.params.columnId,
      req.valid.body
    );
    res.status(200).json({
      success: true,
      data: { column },
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteColumn = async (req, res, next) => {
  try {
    const result = await projectService.deleteColumn(req.params.projectId, req.params.columnId);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};
