// server/src/modules/tasks/task.controller.js
const taskService = require('./task.service');

exports.createTask = async (req, res, next) => {
  try {
    const task = await taskService.createTask(
      req.params.projectId,
      req.valid.body,
      req.user.id,
      req
    );

    res.status(201).json({
      success: true,
      data: { task },
    });
  } catch (err) {
    next(err);
  }
};

exports.getProjectTasks = async (req, res, next) => {
  try {
    const tasks = await taskService.getProjectTasks(req.params.projectId, req.query);
    res.status(200).json({
      success: true,
      data: { tasks },
    });
  } catch (err) {
    next(err);
  }
};

exports.getTask = async (req, res, next) => {
  try {
    const task = await taskService.getTaskById(req.params.taskId);
    res.status(200).json({
      success: true,
      data: { task },
    });
  } catch (err) {
    next(err);
  }
};

exports.updateTask = async (req, res, next) => {
  try {
    const task = await taskService.updateTask(
      req.params.taskId,
      req.valid.body,
      req.user.id,
      req
    );

    res.status(200).json({
      success: true,
      data: { task },
    });
  } catch (err) {
    next(err);
  }
};

exports.moveTask = async (req, res, next) => {
  try {
    const task = await taskService.moveTask(
      {
        taskId: req.params.taskId,
        ...req.valid.body,
        actorId: req.user.id,
      },
      req
    );

    res.status(200).json({
      success: true,
      data: { task },
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteTask = async (req, res, next) => {
  try {
    const result = await taskService.deleteTask(req.params.taskId, req.user.id, req);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

exports.exportTasks = async (req, res, next) => {
  try {
    const format = req.query.format === 'csv' ? 'csv' : 'json';
    const result = await taskService.exportProjectTasks(req.params.projectId, format);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      return res.status(200).send(result.data);
    }

    res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};

exports.importTasks = async (req, res, next) => {
  try {
    const payload = Array.isArray(req.body) ? req.body : req.body.tasks || [];
    const result = await taskService.importProjectTasks(
      req.params.projectId,
      payload,
      req.user.id,
      req
    );

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

exports.bulkMoveTasks = async (req, res, next) => {
  try {
    const result = await taskService.bulkMoveTasks(
      req.params.projectId,
      req.body,
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

exports.bulkDeleteTasks = async (req, res, next) => {
  try {
    const result = await taskService.bulkDeleteTasks(
      req.params.projectId,
      req.body,
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

exports.bulkUpdateTasks = async (req, res, next) => {
  try {
    const result = await taskService.bulkUpdateTasks(
      req.params.projectId,
      req.body,
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
