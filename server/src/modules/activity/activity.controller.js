// server/src/modules/activity/activity.controller.js
const activityService = require('./activity.service');

exports.getProjectActivities = async (req, res, next) => {
  try {
    const data = await activityService.getProjectActivities(
      req.params.projectId,
      req.query
    );
    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

exports.getTaskActivities = async (req, res, next) => {
  try {
    const data = await activityService.getTaskActivities(
      req.params.taskId,
      req.query
    );
    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};
