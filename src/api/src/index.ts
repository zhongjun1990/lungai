// AI Medical Imaging Analysis SaaS - Backend API
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { randomUUID } from 'crypto';

import { config } from './config';
import { logger } from './utils/logger';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import { patientsRouter } from './routes/patients';
import { studiesRouter } from './routes/studies';
import { analysisRouter } from './routes/analysis';
import { reportsRouter } from './routes/reports';
import { billingRouter } from './routes/billing';
import { systemRouter } from './routes/system';
import { connectMongoDB } from './database/mongodb';
import { connectRedis } from './database/redis';

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
}));

// Request middleware
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging middleware
const morganFormat = config.server.nodeEnv === 'production'
  ? 'combined'
  : 'dev';
app.use(morgan(morganFormat, {
  stream: {
    write: (message: string) => logger.info(message.trim()),
  },
}));

// Request ID middleware
app.use((req, res, next) => {
  res.setHeader('X-Request-ID', req.headers['x-request-id'] || randomUUID());
  next();
});

// Swagger/OpenAPI documentation
const swaggerPath = path.join(__dirname, '../../../docs/api/openapi.yml');
try {
  const swaggerDocument = YAML.load(swaggerPath);
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'AI Medical Imaging API - Documentation',
  }));
  logger.info('Swagger documentation available at /docs');
} catch (err) {
  logger.warn('Could not load Swagger documentation:', err);
}

// Health check endpoint (no auth required)
app.use('/health', healthRouter);

// API routes
app.use('/v1/auth', authRouter);
app.use('/v1/users', usersRouter);
app.use('/v1/patients', patientsRouter);
app.use('/v1/studies', studiesRouter);
app.use('/v1/analysis-tasks', analysisRouter);
app.use('/v1/reports', reportsRouter);
app.use('/v1/billing', billingRouter);
app.use('/v1/system', systemRouter);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      code: 'resource_not_found',
      message: 'The requested resource was not found',
      requestId: res.getHeader('X-Request-ID') || randomUUID(),
    },
  });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', err);

  const requestId = res.getHeader('X-Request-ID') || randomUUID();

  res.status(500).json({
    error: {
      code: 'server_error',
      message: config.server.nodeEnv === 'production'
        ? 'Internal server error'
        : err.message,
      requestId,
    },
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to databases
    if (config.server.nodeEnv !== 'test') {
      logger.info('Connecting to databases...');
      try {
        await connectMongoDB();
        logger.info('MongoDB connection successful');
      } catch (err) {
        logger.warn('MongoDB connection failed:', err);
      }

      try {
        await connectRedis();
        logger.info('Redis connection successful');
      } catch (err) {
        logger.warn('Redis connection failed:', err);
      }
    }

    const { port, host } = config.server;

    app.listen(port, host, () => {
      logger.info(`AI Medical Imaging API Server started on http://${host}:${port}`);
      logger.info(`Environment: ${config.server.nodeEnv}`);
      logger.info(`API Documentation: http://${host}:${port}/docs`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
