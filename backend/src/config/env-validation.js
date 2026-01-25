/**
 * Environment Variable Validation
 * Validates all required environment variables on startup
 */

import Joi from 'joi';
import logger from '../utils/logger.js';

const envSchema = Joi.object({
    // Server Configuration
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .default('development'),
    PORT: Joi.number()
        .integer()
        .min(1024)
        .max(65535)
        .default(3001),

    // Database
    MONGODB_URI: Joi.string()
        .uri()
        .required()
        .description('MongoDB connection string'),
    DB_NAME: Joi.string()
        .default('deepfake-detection'),

    // JWT Authentication
    JWT_SECRET: Joi.string()
        .min(32)
        .required()
        .description('JWT secret key (minimum 32 characters)'),
    JWT_EXPIRES_IN: Joi.string()
        .default('24h'),
    JWT_REFRESH_EXPIRES_IN: Joi.string()
        .default('7d'),

    // File Upload
    MAX_FILE_SIZE: Joi.number()
        .integer()
        .min(1000000) // 1MB minimum
        .default(500000000), // 500MB default
    UPLOAD_PATH: Joi.string()
        .default('./uploads'),
    ALLOWED_MIME_TYPES: Joi.string()
        .default('video/mp4,video/avi,video/mov,video/webm,audio/mpeg,audio/wav,audio/mp3,image/jpeg,image/png'),

    // Security
    BCRYPT_ROUNDS: Joi.number()
        .integer()
        .min(10)
        .max(15)
        .default(12),
    ENCRYPTION_KEY: Joi.string()
        .length(32)
        .required()
        .description('Encryption key (exactly 32 characters)'),
    ENCRYPTION_IV: Joi.string()
        .length(16)
        .required()
        .description('Encryption IV (exactly 16 characters)'),

    // Logging
    LOG_LEVEL: Joi.string()
        .valid('error', 'warn', 'info', 'debug')
        .default('info'),
    LOG_FILE_PATH: Joi.string()
        .default('./logs/app.log'),

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: Joi.number()
        .integer()
        .default(900000), // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: Joi.number()
        .integer()
        .default(100),

    // CORS
    FRONTEND_URL: Joi.string()
        .uri()
        .default('http://localhost:3000'),

    // Google OAuth
    GOOGLE_CLIENT_ID: Joi.string()
        .optional()
        .description('Google OAuth Client ID'),

    // ML Service
    ML_SERVICE_URL: Joi.string()
        .uri()
        .default('http://localhost:5000'),
    ML_SERVICE_ENABLED: Joi.string()
        .valid('true', 'false')
        .default('true'),

    // Email (Optional)
    EMAIL_HOST: Joi.string().optional(),
    EMAIL_PORT: Joi.number().integer().optional(),
    EMAIL_USER: Joi.string().optional(),
    EMAIL_PASSWORD: Joi.string().optional(),
    EMAIL_FROM: Joi.string().email().optional(),
}).unknown(true); // Allow other environment variables

/**
 * Validate environment variables
 * @throws {Error} If validation fails
 */
export const validateEnv = () => {
    const { error, value } = envSchema.validate(process.env, {
        abortEarly: false,
        stripUnknown: false,
    });

    if (error) {
        const errors = error.details.map(detail => ({
            key: detail.path.join('.'),
            message: detail.message,
        }));

        logger.error('Environment variable validation failed:');
        errors.forEach(err => {
            logger.error(`  - ${err.key}: ${err.message}`);
        });

        throw new Error('Invalid environment configuration. Please check your .env file.');
    }

    // Log successful validation (without sensitive data)
    logger.info('Environment variables validated successfully');
    logger.info(`Environment: ${value.NODE_ENV}`);
    logger.info(`Port: ${value.PORT}`);
    logger.info(`ML Service: ${value.ML_SERVICE_ENABLED === 'true' ? 'Enabled' : 'Disabled'}`);

    return value;
};

/**
 * Get validated environment variable
 * @param {string} key - Environment variable key
 * @param {*} defaultValue - Default value if not set
 * @returns {*} Environment variable value
 */
export const getEnv = (key, defaultValue = undefined) => {
    return process.env[key] || defaultValue;
};

export default {
    validateEnv,
    getEnv,
};
