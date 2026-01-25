/**
 * Detection Agent (Enhanced)
 * Core ML inference for deepfake detection with advanced aggregation
 */

import logger from '../utils/logger.js';
import { callMLService, checkMLServiceHealth } from '../ml/ml-client.js';
import { isMLServiceEnabled } from '../config/ml.config.js';

/**
 * Calculate statistical aggregation of predictions
 * @param {Array} predictions - Array of prediction objects
 * @returns {Object} Aggregated statistics
 */
const aggregatePredictions = (predictions) => {
  if (!predictions || predictions.length === 0) {
    throw new Error('No predictions to aggregate');
  }

  // If single prediction, return it directly
  if (predictions.length === 1) {
    return {
      ...predictions[0],
      frameCount: 1,
      variance: 0,
      uncertainty: 0,
    };
  }

  // Extract scores
  const riskScores = predictions.map(p => p.riskScore || p.risk_score || 0);
  const confidences = predictions.map(p => p.confidence || 0);
  const videoScores = predictions.map(p => p.videoScore || p.video_score || 0);

  // Calculate statistics
  const mean = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr => {
    const m = mean(arr);
    return arr.reduce((sum, val) => sum + Math.pow(val - m, 2), 0) / arr.length;
  };
  const std = arr => Math.sqrt(variance(arr));

  // Weighted aggregation (higher confidence = more weight)
  const totalConfidence = confidences.reduce((a, b) => a + b, 0);
  const weightedRiskScore = predictions.reduce((sum, pred, idx) => {
    const weight = confidences[idx] / totalConfidence;
    return sum + (pred.riskScore || pred.risk_score || 0) * weight;
  }, 0);

  // Calculate uncertainty (higher variance = higher uncertainty)
  const riskVariance = variance(riskScores);
  const uncertainty = Math.min(100, riskVariance * 10); // Scale to 0-100

  return {
    riskScore: Math.round(weightedRiskScore),
    confidence: Math.round(mean(confidences)),
    videoScore: Math.round(mean(videoScores)),
    audioScore: predictions[0].audioScore || predictions[0].audio_score || 0,
    ganFingerprint: Math.round(mean(predictions.map(p => p.ganFingerprint || p.gan_fingerprint || 0))),
    temporalConsistency: Math.round(mean(predictions.map(p => p.temporalConsistency || p.temporal_consistency || 100))),
    frameCount: predictions.length,
    variance: Math.round(riskVariance * 100) / 100,
    uncertainty: Math.round(uncertainty),
    modelVersion: predictions[0].modelVersion || predictions[0].model_version || 'v1',
  };
};

/**
 * Deepfake detection inference with enhanced aggregation
 * @param {Object} perceptionData - Data from perception agent
 * @returns {Promise<Object>} Aggregated detection scores
 */
export const detectDeepfake = async (perceptionData) => {
  try {
    logger.info(`[DETECTION_AGENT] Starting deepfake detection analysis`);

    // Strictly require ML service
    if (!isMLServiceEnabled()) {
      throw new Error('ML service is disabled in configuration');
    }

    // Check if ML service is available
    const isHealthy = await checkMLServiceHealth();
    if (!isHealthy) {
      throw new Error('ML service is not healthy');
    }

    logger.info(`[DETECTION_AGENT] Using ML service for detection`);

    // Call ML service
    const mlResults = await callMLService(perceptionData);

    // Log detailed results
    logger.info(`[DETECTION_AGENT] ML service detection complete`);
    logger.info(`[DETECTION_AGENT] Risk Score: ${mlResults.riskScore}, Confidence: ${mlResults.confidence}%`);

    if (mlResults.frameCount && mlResults.frameCount > 1) {
      logger.info(`[DETECTION_AGENT] Analyzed ${mlResults.frameCount} frames, Variance: ${mlResults.variance}, Uncertainty: ${mlResults.uncertainty}%`);
    }

    return mlResults;

  } catch (error) {
    logger.error(`[DETECTION_AGENT] Detection error: ${error.message}`);
    throw new Error(`Detection agent failed: ${error.message}`);
  }
};

export default {
  detectDeepfake,
  aggregatePredictions, // Export for testing
};
