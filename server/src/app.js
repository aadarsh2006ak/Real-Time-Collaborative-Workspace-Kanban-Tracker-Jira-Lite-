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
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  })
);
app.use(compression());

// Explicit Cross-Origin Resource Sharing (CORS) Middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-socket-id, Cache-Control, Pragma'
  );
  res.setHeader('Access-Control-Expose-Headers', 'Authorization, Set-Cookie, x-socket-id');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

app.use(
  cors({
    origin: (origin, callback) => callback(null, origin || true),
    credentials: true,
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

// API Routes (supports /api/v1, /api, and root /)
app.use('/api/v1', routes);
app.use('/api', routes);
app.use('/', routes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
