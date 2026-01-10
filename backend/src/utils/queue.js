/**
 * Queue System
 * Manages job queue for batch processing using Bull
 * Note: Requires Redis server to be running
 */

import Queue from 'bull';
import config from '../config/env.js';
import logger from './logger.js';

// Queue configuration
const REDIS_URL = process.env.REDIS_URL || config.redis?.url || 'redis://localhost:6379';

/**
 * Create a scan processing queue
 * @returns {Queue} Bull queue instance
 */
export const createScanQueue = () => {
  try {
    const scanQueue = new Queue('scan-processing', REDIS_URL, {
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          age: 24 * 3600, // Keep completed jobs for 24 hours
          count: 1000, // Keep max 1000 completed jobs
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // Keep failed jobs for 7 days
        },
      },
      settings: {
        maxStalledCount: 1,
        retryProcessDelay: 5000,
      },
    });

    // Queue event handlers
    scanQueue.on('completed', (job) => {
      logger.info(`[QUEUE] Job ${job.id} completed: ${job.data.scanId}`);
    });

    scanQueue.on('failed', (job, err) => {
      logger.error(`[QUEUE] Job ${job.id} failed: ${job.data.scanId}`, err);
    });

    scanQueue.on('stalled', (job) => {
      logger.warn(`[QUEUE] Job ${job.id} stalled: ${job.data.scanId}`);
    });

    scanQueue.on('error', (error) => {
      logger.error('[QUEUE] Queue error:', error);
    });

    logger.info('[QUEUE] Scan processing queue created');

    return scanQueue;
  } catch (error) {
    logger.error('[QUEUE] Failed to create queue:', error);
    // Return null if queue creation fails (graceful degradation)
    return null;
  }
};

/**
 * Add scan job to queue
 * @param {Queue} queue - Bull queue instance
 * @param {Object} jobData - Job data (scanId, filePath, userId)
 * @returns {Promise<Object>} Job object
 */
export const addScanJob = async (queue, jobData) => {
  if (!queue) {
    throw new Error('Queue not initialized. Redis server may not be running.');
  }

  try {
    const job = await queue.add('process-scan', jobData, {
      priority: jobData.priority || 0, // Higher priority = higher number
      delay: jobData.delay || 0, // Delay in milliseconds
    });

    logger.info(`[QUEUE] Job added to queue: ${job.id} for scan ${jobData.scanId}`);
    return job;
  } catch (error) {
    logger.error('[QUEUE] Failed to add job to queue:', error);
    throw error;
  }
};

/**
 * Get job status
 * @param {Queue} queue - Bull queue instance
 * @param {string} jobId - Job ID
 * @returns {Promise<Object>} Job state
 */
export const getJobStatus = async (queue, jobId) => {
  if (!queue) {
    throw new Error('Queue not initialized');
  }

  try {
    const job = await queue.getJob(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    const state = await job.getState();
    const progress = job.progress();

    return {
      id: job.id,
      scanId: job.data.scanId,
      state,
      progress,
      data: job.data,
      result: job.returnvalue,
      failedReason: job.failedReason,
      createdAt: new Date(job.timestamp),
      processedAt: job.processedOn ? new Date(job.processedOn) : null,
      finishedAt: job.finishedOn ? new Date(job.finishedOn) : null,
    };
  } catch (error) {
    logger.error('[QUEUE] Failed to get job status:', error);
    throw error;
  }
};

/**
 * Get all jobs for a batch
 * @param {Queue} queue - Bull queue instance
 * @param {string} batchId - Batch ID
 * @returns {Promise<Array>} Array of job states
 */
export const getBatchJobs = async (queue, batchId) => {
  if (!queue) {
    throw new Error('Queue not initialized');
  }

  try {
    // Get all jobs and filter by batchId
    const jobs = await queue.getJobs(['waiting', 'active', 'completed', 'failed'], 0, -1);
    const batchJobs = jobs.filter(job => job.data.batchId === batchId);

    const jobStates = await Promise.all(
      batchJobs.map(async (job) => {
        const state = await job.getState();
        return {
          id: job.id,
          scanId: job.data.scanId,
          state,
          progress: job.progress(),
        };
      })
    );

    return jobStates;
  } catch (error) {
    logger.error('[QUEUE] Failed to get batch jobs:', error);
    throw error;
  }
};

/**
 * Get queue statistics
 * @param {Queue} queue - Bull queue instance
 * @returns {Promise<Object>} Queue stats
 */
export const getQueueStats = async (queue) => {
  if (!queue) {
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
    };
  }

  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  } catch (error) {
    logger.error('[QUEUE] Failed to get queue stats:', error);
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
    };
  }
};

export default {
  createScanQueue,
  addScanJob,
  getJobStatus,
  getBatchJobs,
  getQueueStats,
};
