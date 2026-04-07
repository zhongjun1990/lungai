// API Configuration
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  server: {
    port: parseInt(process.env.API_PORT || '8000', 10),
    host: process.env.API_HOST || '0.0.0.0',
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  // Database
  database: {
    postgres: {
      host: process.env.POSTGRES_HOST || '',
      port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
      database: process.env.POSTGRES_DB || 'medical_db',
      user: process.env.POSTGRES_USER || 'admin',
      password: process.env.POSTGRES_PASSWORD || 'password123',
    },
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

  // JWT Authentication
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
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

  // Rate Limiting
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    max: 1000, // limit each IP to 1000 requests per windowMs
    fileUploadMax: 100, // limit file uploads to 100 per windowMs
  },

  // Stripe Payment
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    priceIds: {
      free: process.env.STRIPE_PRICE_ID_FREE || '',
      pro: process.env.STRIPE_PRICE_ID_PRO || '',
      enterprise: process.env.STRIPE_PRICE_ID_ENTERPRISE || '',
    },
  },

  // Supabase
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },

  // Vercel Deployment
  vercel: {
    url: process.env.VERCEL_URL || '',
    apiUrl: process.env.API_URL || '',
  },

  // Email (SendGrid)
  email: {
    sendgridApiKey: process.env.SENDGRID_API_KEY || '',
    fromAddress: process.env.EMAIL_FROM_ADDRESS || 'noreply@lungai.com',
    fromName: process.env.EMAIL_FROM_NAME || 'LungAI',
    replyToAddress: process.env.EMAIL_REPLY_TO || 'contact@lungai.com',
  },
};
