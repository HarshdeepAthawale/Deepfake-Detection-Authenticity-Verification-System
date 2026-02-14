/**
 * Learning Service
 * Orchestrates full learning cycle across all 4 agents
 */

import config from '../config/env.js';
import logger from '../utils/logger.js';
import Scan from '../scans/scan.model.js';
import { TrainingHistory, LearningParams, LearningCycleLog } from './learning.model.js';
import { learnPerceptionParams } from './adaptive-perception.js';
import { learnCompressionParams } from './adaptive-compression.js';
import { learnCognitiveParams } from './adaptive-cognitive.js';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || config.ml?.serviceUrl || 'http://ml-service:5000';
const MIN_FEEDBACK_COUNT = parseInt(process.env.LEARNING_MIN_FEEDBACK || '50', 10);

/**
 * Get count of feedback submissions since last learning cycle
 */
export const getFeedbackCountSinceLastCycle = async () => {
  const lastCycle = await LearningCycleLog.findOne(
    { status: { $in: ['completed', 'partial'] } },
    { startedAt: 1 }
  ).sort({ startedAt: -1 }).lean();

  const query = {
    'feedback.correctedVerdict': { $exists: true },
  };

  if (lastCycle) {
    query['feedback.correctedAt'] = { $gte: lastCycle.startedAt };
  }

  return Scan.countDocuments(query);
};

/**
 * Get total feedback count
 */
export const getTotalFeedbackCount = async () => {
  return Scan.countDocuments({ 'feedback.correctedVerdict': { $exists: true } });
};

/**
 * Run a full learning cycle across all agents
 * @param {string} triggeredBy - 'scheduler' or 'manual'
 * @returns {Object} Cycle results
 */
export const runLearningCycle = async (triggeredBy = 'manual') => {
  const feedbackCount = await getTotalFeedbackCount();

  logger.info(`[LEARNING] Starting learning cycle (triggered by: ${triggeredBy}, feedback count: ${feedbackCount})`);

  // Create cycle log
  const cycleLog = await LearningCycleLog.create({
    triggeredBy,
    status: 'running',
    feedbackCount,
  });

  const results = {};

  // 1. Detection Agent - trigger ML service retraining
  try {
    cycleLog.agents.detection.status = 'running';
    await cycleLog.save();
    logger.info(`[LEARNING] Calling ML service: ${ML_SERVICE_URL}/api/v1/retrain`);

    const controller = new AbortController();
    const timeoutMs = 30000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let response;
    try {
      response = await fetch(`${ML_SERVICE_URL}/api/v1/retrain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        signal: controller.signal,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      const errMsg = fetchError.name === 'AbortError'
        ? `Request timed out after ${timeoutMs}ms`
        : fetchError.message || 'Network error';
      throw new Error(`ML service unreachable: ${errMsg}`);
    }
    clearTimeout(timeoutId);

    const data = await response.json().catch(() => ({ error: 'Invalid JSON response', message: 'Could not parse response' }));

    if (response.status === 202) {
      cycleLog.agents.detection.status = 'completed';
      cycleLog.agents.detection.trainingTriggered = true;
      results.detection = { status: 'training_started', version: data.version };
      logger.info(`[LEARNING] Detection agent: training started (version=${data.version})`);
    } else if (response.status === 400 || response.status === 409) {
      cycleLog.agents.detection.status = 'skipped';
      results.detection = { status: 'skipped', reason: data.message || data.error || `HTTP ${response.status}` };
      logger.info(`[LEARNING] Detection agent: skipped - ${results.detection.reason}`);
    } else {
      cycleLog.agents.detection.status = 'failed';
      const errMsg = data.message || data.error || `HTTP ${response.status}`;
      cycleLog.agents.detection.error = errMsg;
      results.detection = { status: 'failed', error: errMsg };
      logger.warn(`[LEARNING] Detection agent: failed - ${errMsg}`);
    }
  } catch (error) {
    const msg = error.message || 'Unknown error';
    cycleLog.agents.detection.status = 'failed';
    cycleLog.agents.detection.error = msg;
    results.detection = { status: 'failed', error: msg };
    logger.warn(`[LEARNING] Detection agent learning failed: ${msg}`);
  }

  // 2. Compression Agent - learn codec suspicion scores
  try {
    cycleLog.agents.compression.status = 'running';
    await cycleLog.save();

    const params = await learnCompressionParams();
    cycleLog.agents.compression.status = 'completed';
    cycleLog.agents.compression.paramsUpdated = params !== null;
    results.compression = { status: 'completed', updated: params !== null };
  } catch (error) {
    cycleLog.agents.compression.status = 'failed';
    cycleLog.agents.compression.error = error.message;
    results.compression = { status: 'failed', error: error.message };
    logger.warn(`[LEARNING] Compression agent learning failed: ${error.message}`);
  }

  // 3. Cognitive Agent - Bayesian threshold adaptation
  try {
    cycleLog.agents.cognitive.status = 'running';
    await cycleLog.save();

    const params = await learnCognitiveParams();
    cycleLog.agents.cognitive.status = 'completed';
    cycleLog.agents.cognitive.paramsUpdated = params !== null;
    results.cognitive = { status: 'completed', updated: params !== null };
  } catch (error) {
    cycleLog.agents.cognitive.status = 'failed';
    cycleLog.agents.cognitive.error = error.message;
    results.cognitive = { status: 'failed', error: error.message };
    logger.warn(`[LEARNING] Cognitive agent learning failed: ${error.message}`);
  }

  // 4. Perception Agent - frame extraction optimization
  try {
    cycleLog.agents.perception.status = 'running';
    await cycleLog.save();

    const params = await learnPerceptionParams();
    cycleLog.agents.perception.status = 'completed';
    cycleLog.agents.perception.paramsUpdated = params !== null;
    results.perception = { status: 'completed', updated: params !== null };
  } catch (error) {
    cycleLog.agents.perception.status = 'failed';
    cycleLog.agents.perception.error = error.message;
    results.perception = { status: 'failed', error: error.message };
    logger.warn(`[LEARNING] Perception agent learning failed: ${error.message}`);
  }

  // Determine overall status
  const agentStatuses = Object.values(cycleLog.agents).map(a => a.status);
  const allCompleted = agentStatuses.every(s => s === 'completed');
  const allFailed = agentStatuses.every(s => s === 'failed');

  cycleLog.status = allCompleted ? 'completed' : allFailed ? 'failed' : 'partial';
  cycleLog.completedAt = new Date();
  await cycleLog.save();

  logger.info(`[LEARNING] Learning cycle ${cycleLog.status}: ${JSON.stringify(results)}`);

  return {
    cycleId: cycleLog._id,
    status: cycleLog.status,
    feedbackCount,
    results,
  };
};

/**
 * Handle training completion callback from ML service
 */
export const handleTrainingComplete = async (data) => {
  const { version, status, metrics, datasetSize, error } = data;

  logger.info(`[LEARNING] Training callback received: version=${version}, status=${status}`, {
    metrics: metrics ? Object.keys(metrics).join(',') : 'none',
    datasetSize: datasetSize?.total ?? 'unknown',
  });

  // Save to training history
  const history = await TrainingHistory.create({
    version,
    status,
    completedAt: new Date(),
    datasetSize,
    metrics,
    error,
  });

  return history;
};

/**
 * Get learning system status including all agent params
 */
export const getLearningStatus = async () => {
  const [
    feedbackSinceLastCycle,
    totalFeedback,
    lastCycle,
    allParams,
    lastTraining,
  ] = await Promise.all([
    getFeedbackCountSinceLastCycle(),
    getTotalFeedbackCount(),
    LearningCycleLog.findOne().sort({ startedAt: -1 }).lean(),
    LearningParams.find().lean(),
    TrainingHistory.findOne().sort({ createdAt: -1 }).lean(),
  ]);

  const params = {};
  for (const p of allParams) {
    params[p.agent] = {
      params: p.params,
      version: p.version,
      lastUpdated: p.lastUpdated,
    };
  }

  return {
    feedbackSinceLastCycle,
    totalFeedback,
    minFeedbackThreshold: MIN_FEEDBACK_COUNT,
    readyForCycle: feedbackSinceLastCycle >= MIN_FEEDBACK_COUNT,
    lastCycle: lastCycle ? {
      id: lastCycle._id,
      status: lastCycle.status,
      triggeredBy: lastCycle.triggeredBy,
      startedAt: lastCycle.startedAt,
      completedAt: lastCycle.completedAt,
      agents: lastCycle.agents,
    } : null,
    lastTraining: lastTraining ? {
      version: lastTraining.version,
      status: lastTraining.status,
      metrics: lastTraining.metrics,
      completedAt: lastTraining.completedAt,
    } : null,
    agentParams: params,
  };
};

/**
 * Get paginated learning cycle history
 */
export const getLearningHistory = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [cycles, total] = await Promise.all([
    LearningCycleLog.find().sort({ startedAt: -1 }).skip(skip).limit(limit).lean(),
    LearningCycleLog.countDocuments(),
  ]);

  return {
    cycles,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};
