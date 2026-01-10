/**
 * Scan Queue Processor
 * Processes queued scan jobs from the Bull queue
 */

import { processScan } from './scan.service.js';
import logger from '../utils/logger.js';

/**
 * Setup scan queue processor
 * This should be called once when the server starts
 * @param {Queue} queue - Bull queue instance
 */
export const setupScanProcessor = (queue) => {
  if (!queue) {
    logger.warn('[SCAN_PROCESSOR] Queue not initialized, processor not started');
    return;
  }

  // Process scan jobs
  queue.process('process-scan', async (job) => {
    const { scanId, filePath, userId, batchId } = job.data;
    
    logger.info(`[SCAN_PROCESSOR] Processing job ${job.id} for scan: ${scanId}`);
    
    try {
      // Update job progress
      await job.progress(10);
      
      // Process the scan through the agentic pipeline
      const result = await processScan(scanId, filePath, userId);
      
      // Update job progress to 100%
      await job.progress(100);
      
      logger.info(`[SCAN_PROCESSOR] Job ${job.id} completed for scan: ${scanId}`);
      
      return {
        scanId: result.scanId,
        status: result.status,
        verdict: result.result?.verdict,
        batchId,
      };
    } catch (error) {
      logger.error(`[SCAN_PROCESSOR] Job ${job.id} failed for scan: ${scanId}`, error);
      throw error; // Re-throw to mark job as failed
    }
  });

  logger.info('[SCAN_PROCESSOR] Scan queue processor started');
};

export default {
  setupScanProcessor,
};
