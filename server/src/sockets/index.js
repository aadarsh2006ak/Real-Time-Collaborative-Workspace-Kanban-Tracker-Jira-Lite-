// server/src/sockets/index.js
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const logger = require('../config/logger');
const Project = require('../modules/projects/project.model');

/**
 * Checks if a user is an owner or member of a project
 */
async function isProjectMember(projectId, userId) {
  const project = await Project.findById(projectId).select('owner members');
  if (!project) return false;
  if (String(project.owner) === userId) return true;
  return project.members.some((m) => String(m.user) === userId);
}

/**
 * Calculates distinct online user IDs active in a project room
 */
async function getOnlineUsers(io, projectId) {
  const sockets = await io.in(`project:${projectId}`).fetchSockets();
  return [...new Set(sockets.map((s) => s.data.userId).filter(Boolean))];
}

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
    transports: ['websocket', 'polling'],
  });

  // 1. Handshake Authentication Guard
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('UNAUTHORIZED'));
      }
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
      socket.data.userId = payload.sub;
      next();
    } catch {
      next(new Error('UNAUTHORIZED'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    logger.debug(`🔌 Socket connected: ${socket.id} (user: ${userId})`);

    // Join personal user room for direct in-app notifications
    socket.join(`user:${userId}`);

    // 2. Project Room Join with RBAC Authorization
    socket.on('project:join', async ({ projectId }, ack) => {
      try {
        if (!projectId) return ack?.({ ok: false, error: 'BAD_REQUEST' });

        const hasAccess = await isProjectMember(projectId, socket.data.userId);
        if (!hasAccess) {
          return ack?.({ ok: false, error: 'FORBIDDEN' });
        }

        await socket.join(`project:${projectId}`);
        const online = await getOnlineUsers(io, projectId);

        // Broadcast presence to all users in the room
        io.to(`project:${projectId}`).emit('presence:update', { online });
        ack?.({ ok: true, online });
      } catch (err) {
        logger.error('Error joining project room: %s', err.message);
        ack?.({ ok: false, error: 'INTERNAL_ERROR' });
      }
    });

    // 3. Project Room Leave
    socket.on('project:leave', async ({ projectId }) => {
      if (projectId) {
        socket.leave(`project:${projectId}`);
        const online = await getOnlineUsers(io, projectId);
        socket.to(`project:${projectId}`).emit('presence:update', { online });
      }
    });

    // 4. Real-Time Typing Indicators
    socket.on('typing', ({ projectId, taskId, isTyping }) => {
      if (!socket.rooms.has(`project:${projectId}`)) return;
      socket.to(`project:${projectId}`).emit('typing', {
        taskId,
        userId: socket.data.userId,
        isTyping,
      });
    });

    // 5. Disconnect Lifecycle & Presence Cleanup
    socket.on('disconnecting', () => {
      for (const room of socket.rooms) {
        if (room.startsWith('project:')) {
          socket.to(room).emit('presence:left', { userId: socket.data.userId });
        }
      }
    });

    socket.on('disconnect', () => {
      logger.debug(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

module.exports = { initSocket, isProjectMember, getOnlineUsers };
