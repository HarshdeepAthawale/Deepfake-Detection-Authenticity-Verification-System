/**
 * Adaptive Perception Agent Learning
 * Learns optimal frameRate/maxFrames per video duration bucket from feedback accuracy
 */

import { LearningParams } from './learning.model.js';
import Scan from '../scans/scan.model.js';
import logger from '../utils/logger.js';

// Default duration buckets (matches perception.agent.js hardcoded values)
const DEFAULT_BUCKETS = [
  { maxDuration: 10, frameRate: 4, maxFrames: 40 },
  { maxDuration: 30, frameRate: 3, maxFrames: 90 },
  { maxDuration: 60, frameRate: 2, maxFrames: 120 },
  { maxDuration: Infinity, frameRate: 1, maxFrames: 120 },
];

/**
 * Get learned perception parameters (with fallback to defaults)
 */
export const getPerceptionParams = async () => {
  try {
    const learned = await LearningParams.findOne({ agent: 'perception' }).lean();
    if (learned?.params?.durationBuckets) {
      logger.info('[ADAPTIVE_PERCEPTION] Using learned duration buckets');
      return learned.params;
    }
  } catch (error) {
    logger.warn(`[ADAPTIVE_PERCEPTION] Failed to load params: ${error.message}`);
  }

  return { durationBuckets: DEFAULT_BUCKETS };
};

/**
 * Learn optimal frame extraction parameters from feedback patterns.
 *
 * Logic:
 * - Group completed video scans by duration bucket
 * - Track accuracy rate (correct = no feedback submitted) per bucket
 * - Low accuracy (<70%) → increase frameRate +1 and maxFrames +25%
 * - High accuracy (>95%) → decrease frameRate -1 and maxFrames -15%
 */
export const learnPerceptionParams = async () => {
  try {
    // Get all completed video scans
    const scans = await Scan.find({
      status: 'COMPLETED',
      mediaType: 'VIDEO',
      'processingData.perception.duration': { $gt: 0 },
    }).select('processingData.perception.duration feedback.correctedVerdict').lean();

    if (scans.length < 20) {
      logger.info(`[ADAPTIVE_PERCEPTION] Not enough video scans (${scans.length}) to learn from`);
      return null;
    }

    // Load current params as baseline
    const current = await getPerceptionParams();
    const buckets = current.durationBuckets.map(b => ({ ...b }));

    // Group scans by duration bucket
    const bucketStats = buckets.map(() => ({ total: 0, correct: 0 }));

    for (const scan of scans) {
      const duration = scan.processingData?.perception?.duration || 0;
      const hasFeedback = !!scan.feedback?.correctedVerdict;

      // Find matching bucket
      const bucketIdx = buckets.findIndex(b => duration <= b.maxDuration);
      if (bucketIdx === -1) continue;

      bucketStats[bucketIdx].total++;
      if (!hasFeedback) {
        bucketStats[bucketIdx].correct++;
      }
    }

    // Adjust buckets based on accuracy
    let updated = false;
    for (let i = 0; i < buckets.length; i++) {
      const stat = bucketStats[i];
      if (stat.total < 5) continue; // Need minimum samples

      const accuracy = stat.correct / stat.total;

      if (accuracy < 0.70) {
        // Low accuracy: increase extraction
        buckets[i].frameRate = Math.min(8, buckets[i].frameRate + 1);
        buckets[i].maxFrames = Math.min(200, Math.round(buckets[i].maxFrames * 1.25));
        updated = true;
        logger.info(
          `[ADAPTIVE_PERCEPTION] Bucket ≤${buckets[i].maxDuration}s: accuracy ${(accuracy * 100).toFixed(1)}% → increasing fps=${buckets[i].frameRate}, maxFrames=${buckets[i].maxFrames}`
        );
      } else if (accuracy > 0.95) {
        // High accuracy: decrease extraction for efficiency
        buckets[i].frameRate = Math.max(1, buckets[i].frameRate - 1);
        buckets[i].maxFrames = Math.max(20, Math.round(buckets[i].maxFrames * 0.85));
        updated = true;
        logger.info(
          `[ADAPTIVE_PERCEPTION] Bucket ≤${buckets[i].maxDuration}s: accuracy ${(accuracy * 100).toFixed(1)}% → decreasing fps=${buckets[i].frameRate}, maxFrames=${buckets[i].maxFrames}`
        );
      }
    }

    if (!updated) {
      logger.info('[ADAPTIVE_PERCEPTION] No adjustments needed');
      return null;
    }

    // Save learned params
    const result = await LearningParams.findOneAndUpdate(
      { agent: 'perception' },
      {
        $set: {
          params: { durationBuckets: buckets },
          lastUpdated: new Date(),
        },
        $inc: { version: 1, feedbackCount: scans.filter(s => s.feedback?.correctedVerdict).length },
      },
      { upsert: true, new: true }
    );

    logger.info(`[ADAPTIVE_PERCEPTION] Params updated (version ${result.version})`);
    return result.params;
  } catch (error) {
    logger.error(`[ADAPTIVE_PERCEPTION] Learning failed: ${error.message}`);
    throw error;
  }
};
