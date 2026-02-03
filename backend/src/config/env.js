/**
 * Environment Configuration Module
 * Centralized environment variable management with validation
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env') });

const config = {
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/deepfake-detection',
    name: process.env.DB_NAME || 'deepfake-detection',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'change-this-secret-key-in-production-min-32-chars',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '500000000', 10), // 500MB
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    allowedMimeTypes: (process.env.ALLOWED_MIME_TYPES || 'video/mp4,video/avi,video/mov,video/webm,audio/mpeg,audio/wav,audio/mp3,image/jpeg,image/png').split(','),
  },
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    encryptionKey: process.env.ENCRYPTION_KEY || 'change-this-32-char-key-in-production',
    encryptionIV: process.env.ENCRYPTION_IV || 'change-this-16-char-iv',
  },
  ffmpeg: {
    ffmpegPath: process.env.FFMPEG_PATH || 'ffmpeg',
    ffprobePath: process.env.FFPROBE_PATH || 'ffprobe',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs/app.log',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  },
  admin: {
    email: process.env.ADMIN_EMAIL || '',
  },
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3002',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  ml: {
    serviceUrl: process.env.ML_SERVICE_URL || 'http://localhost:5000',
    enabled: process.env.ML_SERVICE_ENABLED !== 'false',
    timeout: parseInt(process.env.ML_SERVICE_TIMEOUT || '30000', 10),
    retries: parseInt(process.env.ML_SERVICE_RETRIES || '3', 10),
    modelVersion: process.env.ML_MODEL_VERSION || 'v4',
  },
  email: {
    smtp: {
      host: process.env.SMTP_HOST || '',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER || '',
      password: process.env.SMTP_PASSWORD || '',
    },
    from: process.env.EMAIL_FROM || 'noreply@sentinel-x.com',
  },
};

// Validation
const isProduction = config.server.nodeEnv === 'production';

// Production security validation
if (isProduction) {
  if (!config.jwt.secret || config.jwt.secret.includes('change-this') || config.jwt.secret.length < 32) {
    throw new Error('CRITICAL: JWT_SECRET must be set to a secure value (min 32 chars) in production!');
  }
  if (!config.security.encryptionKey || config.security.encryptionKey.includes('change-this') || config.security.encryptionKey.length < 32) {
    throw new Error('CRITICAL: ENCRYPTION_KEY must be set to a secure value (32 chars) in production!');
  }
  if (!config.security.encryptionIV || config.security.encryptionIV.includes('change-this') || config.security.encryptionIV.length < 16) {
    throw new Error('CRITICAL: ENCRYPTION_IV must be set to a secure value (16 chars) in production!');
  }
}

// Development warnings
if (!isProduction) {
  if (!config.jwt.secret || config.jwt.secret.length < 32) {
    logger.warn('WARNING: JWT_SECRET should be at least 32 characters long');
  }

  if (!config.security.encryptionKey || config.security.encryptionKey.length < 32) {
    logger.warn('WARNING: ENCRYPTION_KEY should be at least 32 characters long');
  }
}

// Google OAuth validation
if (!config.google.clientId) {
  logger.warn('⚠️  WARNING: GOOGLE_CLIENT_ID is not set. Google OAuth will not work.');
  logger.warn('   Create backend/.env with: GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com');
}

if (config.google.clientId && !config.google.clientSecret) {
  logger.warn('⚠️  WARNING: GOOGLE_CLIENT_SECRET is not set. Token verification may fail.');
}

export default config;

