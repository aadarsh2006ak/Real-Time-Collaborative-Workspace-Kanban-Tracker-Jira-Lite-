// server/src/sockets/index.js
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const logger = require('../config/logger');

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  // Socket Authentication Middleware
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

    // Join personal user room for targeted notifications
    socket.join(`user:${userId}`);

    // Project room handlers
    socket.on('project:join', async ({ projectId }, ack) => {
      try {
        if (!projectId) return ack?.({ ok: false, error: 'BAD_REQUEST' });
        await socket.join(`project:${projectId}`);
        const onlineSockets = await io.in(`project:${projectId}`).fetchSockets();
        const online = [...new Set(onlineSockets.map((s) => s.data.userId))];

        io.to(`project:${projectId}`).emit('presence:update', { online });
        ack?.({ ok: true, online });
      } catch (err) {
        logger.error('Error joining project room: %s', err.message);
        ack?.({ ok: false, error: 'INTERNAL_ERROR' });
      }
    });

    socket.on('project:leave', ({ projectId }) => {
      if (projectId) {
        socket.leave(`project:${projectId}`);
      }
    });

    socket.on('typing', ({ projectId, taskId, isTyping }) => {
      if (!socket.rooms.has(`project:${projectId}`)) return;
      socket.to(`project:${projectId}`).emit('typing', {
        taskId,
        userId: socket.data.userId,
        isTyping,
      });
    });

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

module.exports = { initSocket };
