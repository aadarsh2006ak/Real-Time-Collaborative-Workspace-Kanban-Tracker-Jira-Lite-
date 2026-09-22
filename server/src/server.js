// server/src/server.js
const http = require('http');
const app = require('./app');
const env = require('./config/env');
const logger = require('./config/logger');
const { connectDB, disconnectDB } = require('./config/db');
const { initSocket } = require('./sockets');

(async () => {
  try {
    // 1. Connect Database & Seed Demo Data if Database is Empty
    await connectDB();
    const { autoSeedIfEmpty } = require('./seed');
    await autoSeedIfEmpty();

    // 2. Create HTTP Server
    const server = http.createServer(app);

    // 3. Initialize WebSocket Layer
    const io = initSocket(server);
    app.set('io', io);

    // 4. Start Server Listener
    server.listen(env.PORT, () => {
      logger.info(`🚀 Jira-Lite API server running on port ${env.PORT} [${env.NODE_ENV}]`);
      logger.info(`🌐 Health check available at: http://localhost:${env.PORT}/healthz`);
    });

    // Graceful Shutdown
    const shutdown = async (signal) => {
      logger.info(`🛑 Received ${signal}. Gracefully shutting down server...`);
      server.close(async () => {
        logger.info('🔌 HTTP server closed.');
        await disconnectDB();
        logger.info('💾 Database connection terminated.');
        process.exit(0);
      });

      // Force exit if hanging
      setTimeout(() => {
        logger.error('⚠️ Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('💥 Fatal Server Startup Error: %s', error.message);
    process.exit(1);
  }
})();
