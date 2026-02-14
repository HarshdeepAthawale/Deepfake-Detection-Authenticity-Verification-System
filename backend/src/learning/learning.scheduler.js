/**
 * Learning Scheduler
 * Bull repeatable cron job - checks hourly, auto-triggers when feedback >= threshold
 */

import Queue from 'bull';
import logger from '../utils/logger.js';
import { getFeedbackCountSinceLastCycle, runLearningCycle } from './learning.service.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const MIN_FEEDBACK = parseInt(process.env.LEARNING_MIN_FEEDBACK || '50', 10);
const CRON_SCHEDULE = process.env.LEARNING_CRON || '0 * * * *'; // Every hour

let _learningQueue = null;

/**
 * Initialize the learning scheduler
 * Creates a Bull queue with an hourly repeatable job
 */
export const initializeLearningScheduler = () => {
  try {
    _learningQueue = new Queue('learning-cycle', REDIS_URL, {
      defaultJobOptions: {
        attempts: 1,
        removeOnComplete: { age: 7 * 24 * 3600, count: 100 },
        removeOnFail: { age: 7 * 24 * 3600 },
      },
    });

    // Process learning check jobs
    _learningQueue.process('check-and-learn', async (job) => {
      logger.info('[LEARNING_SCHEDULER] Hourly check triggered');

      const feedbackCount = await getFeedbackCountSinceLastCycle();
      logger.info(`[LEARNING_SCHEDULER] Feedback since last cycle: ${feedbackCount} (threshold: ${MIN_FEEDBACK})`);

      if (feedbackCount >= MIN_FEEDBACK) {
        logger.info('[LEARNING_SCHEDULER] Threshold met - starting learning cycle');
        const result = await runLearningCycle('scheduler');
        return result;
      }

      return { skipped: true, feedbackCount, threshold: MIN_FEEDBACK };
    });

    // Add repeatable job (hourly) - no jobId for repeatable (each cron run creates new job)
    _learningQueue.add('check-and-learn', {}, {
      repeat: { cron: CRON_SCHEDULE },
    });

    // Event handlers
    _learningQueue.on('completed', (job, result) => {
      if (result?.skipped) {
        logger.info(`[LEARNING_SCHEDULER] Check completed - skipped (${result.feedbackCount}/${result.threshold} feedback)`);
      } else {
        logger.info(`[LEARNING_SCHEDULER] Learning cycle completed: ${result?.status}`);
      }
    });

    _learningQueue.on('failed', (job, err) => {
      logger.error(`[LEARNING_SCHEDULER] Job failed: ${err.message}`);
    });

    _learningQueue.on('error', (error) => {
      logger.error(`[LEARNING_SCHEDULER] Queue error: ${error.message}`);
    });

    logger.info(`[LEARNING_SCHEDULER] Initialized (cron: ${CRON_SCHEDULE}, threshold: ${MIN_FEEDBACK} feedback)`);

    return _learningQueue;
  } catch (error) {
    logger.error(`[LEARNING_SCHEDULER] Failed to initialize: ${error.message}`);
    return null;
  }
};

/**
 * Get the learning queue instance
 */
export const getLearningQueue = () => _learningQueue;
