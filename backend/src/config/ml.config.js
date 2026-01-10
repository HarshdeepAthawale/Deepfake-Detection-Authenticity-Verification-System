/**
 * ML Service Configuration
 * Configuration for external ML service integration
 */

import config from './env.js';
import logger from '../utils/logger.js';

const mlConfig = {
  // ML Service URL (Python Flask/FastAPI service)
  serviceUrl: process.env.ML_SERVICE_URL || 'http://localhost:5000',
  
  // ML Service Configuration
  enabled: process.env.ML_SERVICE_ENABLED !== 'false', // Default to enabled if env var not set
  timeout: parseInt(process.env.ML_SERVICE_TIMEOUT || '30000', 10), // 30 seconds default
  retries: parseInt(process.env.ML_SERVICE_RETRIES || '3', 10),
  retryDelay: parseInt(process.env.ML_SERVICE_RETRY_DELAY || '1000', 10), // 1 second

  // Model Configuration
  modelVersion: process.env.ML_MODEL_VERSION || 'v1',
  confidenceThreshold: parseFloat(process.env.ML_CONFIDENCE_THRESHOLD || '0.5'), // 0.5 = 50%

  // Health Check
  healthCheckInterval: parseInt(process.env.ML_HEALTH_CHECK_INTERVAL || '60000', 10), // 1 minute
  healthCheckTimeout: parseInt(process.env.ML_HEALTH_CHECK_TIMEOUT || '5000', 10), // 5 seconds
};

/**
 * Get ML service health check URL
 */
export const getHealthCheckUrl = () => {
  return `${mlConfig.serviceUrl}/health`;
};

/**
 * Get ML service inference URL
 */
export const getInferenceUrl = (modelVersion = mlConfig.modelVersion) => {
  return `${mlConfig.serviceUrl}/api/v1/inference`;
};

/**
 * Check if ML service is enabled
 */
export const isMLServiceEnabled = () => {
  return mlConfig.enabled;
};

/**
 * Get ML configuration
 */
export const getMLConfig = () => {
  return { ...mlConfig };
};

export default mlConfig;
