/**
 * Learning Controller
 * REST endpoints: status, manual trigger, training-complete callback, history
 */

import logger from '../utils/logger.js';
import {
  getLearningStatus,
  runLearningCycle,
  handleTrainingComplete,
  getLearningHistory,
} from './learning.service.js';

/**
 * Get learning system status including all agent params
 * GET /api/admin/learning/status
 */
export const getStatus = async (req, res) => {
  try {
    const status = await getLearningStatus();
    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    logger.error('[LEARNING] Get status error:', error);
    res.status(500).json({
      error: 'Failed to fetch learning status',
      message: error.message,
    });
  }
};

/**
 * Manually trigger a learning cycle
 * POST /api/admin/learning/trigger
 */
export const triggerLearning = async (req, res) => {
  try {
    const result = await runLearningCycle('manual');
    res.status(200).json({
      success: true,
      data: result,
      message: 'Learning cycle completed',
    });
  } catch (error) {
    logger.error('[LEARNING] Trigger error:', error);
    res.status(500).json({
      error: 'Learning cycle failed',
      message: error.message,
    });
  }
};

/**
 * Optional middleware: verify TRAINING_CALLBACK_SECRET if set
 * Protects training-complete from unauthorized callers when env var is configured
 */
const optionalCallbackAuth = (req, res, next) => {
  const secret = process.env.TRAINING_CALLBACK_SECRET;
  if (!secret) return next();

  const provided = req.headers['x-training-callback-secret'] || req.body?.callbackSecret;
  if (provided !== secret) {
    logger.warn('[LEARNING] Training callback rejected: invalid or missing secret');
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid callback secret' });
  }
  next();
};

/**
 * Callback from ML service after training completes (no auth - internal)
 * POST /api/admin/learning/training-complete
 * Optional: Set TRAINING_CALLBACK_SECRET and X-Training-Callback-Secret header for auth
 */
export const trainingCompleteCallback = [
  optionalCallbackAuth,
  async (req, res) => {
    try {
      const { version, status, metrics, datasetSize, error } = req.body || {};
      const history = await handleTrainingComplete({
      version: version || 'unknown',
      status: status || 'unknown',
      metrics: metrics || {},
      datasetSize: datasetSize || {},
      error: error || null,
    });
    res.status(200).json({
      success: true,
      data: { id: history._id, version },
      message: 'Training completion recorded',
    });
    } catch (err) {
      logger.error('[LEARNING] Training callback error:', err);
      res.status(500).json({
        error: 'Failed to record training completion',
        message: err.message,
      });
    }
  },
];

/**
 * Get paginated learning cycle history
 * GET /api/admin/learning/history
 */
export const getHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const result = await getLearningHistory(page, limit);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('[LEARNING] Get history error:', error);
    res.status(500).json({
      error: 'Failed to fetch learning history',
      message: error.message,
    });
  }
};
