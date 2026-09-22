// server/src/app.js
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const pinoHttp = require('pino-http');
const swaggerUi = require('swagger-ui-express');
const swaggerDoc = require('./docs/swagger.json');
const env = require('./config/env');
const logger = require('./config/logger');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/error');

const app = express();

// Security, Compression and Parsing Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(compression());

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (
    origin === env.CLIENT_URL ||
    origin.endsWith('.onrender.com') ||
    origin.includes('localhost') ||
    origin.includes('127.0.0.1')
  ) {
    return true;
  }
  return true;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, origin || true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-socket-id', 'x-requested-with'],
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Request logging (skip in test environment to keep logs clean)
if (env.NODE_ENV !== 'test') {
  app.use(pinoHttp({ logger }));
}

// Health Check Endpoint
app.get('/healthz', (req, res) => {
  res.status(200).json({
    ok: true,
    env: env.NODE_ENV,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Swagger / OpenAPI 3.0 Documentation Endpoint
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

// API Routes
app.use('/api/v1', routes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
