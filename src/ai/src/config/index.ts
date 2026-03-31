import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  server: {
    port: parseInt(process.env.AI_SERVER_PORT || '9000', 10),
    host: process.env.AI_SERVER_HOST || '0.0.0.0',
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  // Database
  database: {
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/medical_metadata?authSource=admin',
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0', 10),
    },
  },

  // Message Queue
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://admin:password123@localhost:5672/',
    exchange: 'analysis_tasks',
    taskQueue: 'analysis_tasks',
    resultQueue: 'analysis_results',
  },

  // Object Storage
  storage: {
    minio: {
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000', 10),
      useSSL: process.env.MINIO_SECURE === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
      bucket: process.env.MINIO_BUCKET || 'dicom-storage',
    },
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  // Model Configuration
  models: {
    lungNoduleDetector: {
      path: process.env.LUNG_NODULE_MODEL_PATH || './models/lung-nodule-detector',
      version: process.env.LUNG_NODULE_MODEL_VERSION || 'v1.0.0',
      threshold: parseFloat(process.env.LUNG_NODULE_THRESHOLD || '0.7'),
    },
    chestXrayClassifier: {
      path: process.env.CHEST_XRAY_MODEL_PATH || './models/chest-xray-classifier',
      version: process.env.CHEST_XRAY_MODEL_VERSION || 'v1.0.0',
      threshold: parseFloat(process.env.CHEST_XRAY_THRESHOLD || '0.6'),
    },
  },
};
