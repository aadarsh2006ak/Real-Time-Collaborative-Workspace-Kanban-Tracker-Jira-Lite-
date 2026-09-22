// server/src/utils/emit.js
/**
 * Emits an event to a project room, skipping the sender if x-socket-id header is provided
 */
exports.emitToProject = (req, projectId, event, payload) => {
  const io = req.app.get('io');
  if (!io) return;

  let target = io.to(`project:${projectId}`);
  const senderSocketId = req.headers['x-socket-id'];

  if (senderSocketId) {
    target = target.except(senderSocketId);
  }

  target.emit(event, payload);
};
