import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import pinoHttp from 'pino-http';
import { config } from './config';
import { logger } from './utils/logger';
import { healthRouter, analysisRouter } from './routes';
import { connectMongoDB } from './database';
import { storageService } from './services';
import { messageQueueService } from './services/MessageQueueService';
import { AnalysisWorker } from './workers/AnalysisWorker';

const app = express();

app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
}));

app.use(pinoHttp({
  logger,
}));

app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim()),
  },
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/health', healthRouter);
app.use('/api/analysis', analysisRouter);

app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      code: 'resource_not_found',
      message: 'The requested resource was not found',
    },
  });
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: {
      code: 'server_error',
      message: config.server.nodeEnv === 'production'
        ? 'Internal server error'
        : err.message,
    },
  });
});

const startServer = async () => {
  try {
    logger.info('AI Medical Imaging Analysis Service starting...');
    logger.info(`Environment: ${config.server.nodeEnv}`);

    await connectMongoDB();
    logger.info('MongoDB connected');

    await storageService.bucketExists();
    logger.info('Storage service available');

    await messageQueueService.connect();
    logger.info('Message queue connected');

    const lungNoduleWorker = new AnalysisWorker('lung-nodule-detector');
    await lungNoduleWorker.start();
    logger.info('Lung nodule detector worker started');

    const chestXrayWorker = new AnalysisWorker('chest-xray-classifier');
    await chestXrayWorker.start();
    logger.info('Chest X-ray classifier worker started');

    app.listen(config.server.port, config.server.host, () => {
      logger.info(
        `AI Analysis Service listening on http://${config.server.host}:${config.server.port}`
      );
      logger.info('API endpoints available at /api');
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
