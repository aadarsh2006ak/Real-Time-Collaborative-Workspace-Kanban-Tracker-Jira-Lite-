// server/src/config/db.js
const mongoose = require('mongoose');
const env = require('./env');
const logger = require('./logger');

async function connectDB(uri = env.MONGO_URI) {
  try {
    const conn = await mongoose.connect(uri, {
      autoIndex: true,
    });
    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error('❌ MongoDB Connection Error: %s', error.message);
    if (env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw error;
  }
}

async function disconnectDB() {
  await mongoose.disconnect();
}

module.exports = { connectDB, disconnectDB };
