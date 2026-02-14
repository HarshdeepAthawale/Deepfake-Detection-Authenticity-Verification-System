/**
 * Adaptive Compression Agent Learning
 * Learns codec suspicion scores + quality thresholds from feedback patterns
 */

import { LearningParams } from './learning.model.js';
import Scan from '../scans/scan.model.js';
import logger from '../utils/logger.js';

// Default codec suspicion scores (matches compression.agent.js hardcoded values)
const DEFAULT_CODEC_SUSPICION = {
  'h265': 2, 'hevc': 2,
  'vp9': 3,
  'av1': 4,
  'h264': 0, 'avc': 0,
  'mjpeg': 10, 'motion jpeg': 10,
};

// Default quality thresholds
const DEFAULT_QUALITY_THRESHOLDS = {
  veryLowBitrateMbps: 1,
  lowBitrateMbps: 3,
  moderateBitrateMbps: 5,
};

// Default confidence reductions based on quality score
const DEFAULT_CONFIDENCE_REDUCTIONS = {
  veryPoor: { threshold: 40, reduction: 25 },
  poor: { threshold: 60, reduction: 15 },
  moderate: { threshold: 80, reduction: 5 },
};

/**
 * Get learned compression parameters (with fallback to defaults)
 */
export const getCompressionParams = async () => {
  try {
    const learned = await LearningParams.findOne({ agent: 'compression' }).lean();
    if (learned?.params) {
      logger.info('[ADAPTIVE_COMPRESSION] Using learned compression params');
      return {
        codecSuspicion: learned.params.codecSuspicion || DEFAULT_CODEC_SUSPICION,
        qualityThresholds: learned.params.qualityThresholds || DEFAULT_QUALITY_THRESHOLDS,
        confidenceReductions: learned.params.confidenceReductions || DEFAULT_CONFIDENCE_REDUCTIONS,
      };
    }
  } catch (error) {
    logger.warn(`[ADAPTIVE_COMPRESSION] Failed to load params: ${error.message}`);
  }

  return {
    codecSuspicion: { ...DEFAULT_CODEC_SUSPICION },
    qualityThresholds: { ...DEFAULT_QUALITY_THRESHOLDS },
    confidenceReductions: { ...DEFAULT_CONFIDENCE_REDUCTIONS },
  };
};

/**
 * Learn codec suspicion scores from feedback patterns.
 *
 * Logic:
 * - Analyze all feedback: if codec X caused false positives → reduce its suspicion score
 * - If codec X caused false negatives → increase suspicion score
 * - Scores clamped to [0, 20]
 */
export const learnCompressionParams = async () => {
  try {
    // Get scans with feedback that have compression data
    const scans = await Scan.find({
      status: 'COMPLETED',
      'feedback.correctedVerdict': { $exists: true },
      'processingData.compression': { $exists: true },
    }).select('result.verdict feedback.correctedVerdict processingData.compression processingData.perception.metadata').lean();

    if (scans.length < 10) {
      logger.info(`[ADAPTIVE_COMPRESSION] Not enough feedback scans (${scans.length}) to learn from`);
      return null;
    }

    // Start from current params
    const current = await getCompressionParams();
    const codecSuspicion = { ...current.codecSuspicion };

    // Track codec adjustments
    const codecAdjustments = {};

    for (const scan of scans) {
      const codec = (scan.processingData?.perception?.metadata?.codec || '').toLowerCase();
      if (!codec) continue;

      const originalVerdict = scan.result?.verdict;
      const correctedVerdict = scan.feedback?.correctedVerdict;

      if (!originalVerdict || !correctedVerdict || originalVerdict === correctedVerdict) continue;

      // Find matching codec key
      const codecKey = Object.keys(codecSuspicion).find(k => codec.includes(k));
      if (!codecKey) continue;

      if (!codecAdjustments[codecKey]) {
        codecAdjustments[codecKey] = { fp: 0, fn: 0 };
      }

      // False positive: system said DEEPFAKE/SUSPICIOUS but was actually AUTHENTIC
      if ((originalVerdict === 'DEEPFAKE' || originalVerdict === 'SUSPICIOUS') && correctedVerdict === 'AUTHENTIC') {
        codecAdjustments[codecKey].fp++;
      }

      // False negative: system said AUTHENTIC but was actually DEEPFAKE
      if (originalVerdict === 'AUTHENTIC' && (correctedVerdict === 'DEEPFAKE' || correctedVerdict === 'SUSPICIOUS')) {
        codecAdjustments[codecKey].fn++;
      }
    }

    // Apply adjustments
    let updated = false;
    for (const [codec, adj] of Object.entries(codecAdjustments)) {
      const netAdjustment = (adj.fn - adj.fp) * 1; // +1 per net FN, -1 per net FP
      if (netAdjustment === 0) continue;

      const oldScore = codecSuspicion[codec] || 0;
      codecSuspicion[codec] = Math.max(0, Math.min(20, oldScore + netAdjustment));
      updated = true;

      logger.info(
        `[ADAPTIVE_COMPRESSION] Codec "${codec}": FP=${adj.fp}, FN=${adj.fn}, ` +
        `suspicion ${oldScore} → ${codecSuspicion[codec]}`
      );
    }

    if (!updated) {
      logger.info('[ADAPTIVE_COMPRESSION] No adjustments needed');
      return null;
    }

    // Save learned params
    const result = await LearningParams.findOneAndUpdate(
      { agent: 'compression' },
      {
        $set: {
          params: {
            codecSuspicion,
            qualityThresholds: current.qualityThresholds,
            confidenceReductions: current.confidenceReductions,
          },
          lastUpdated: new Date(),
        },
        $inc: { version: 1, feedbackCount: scans.length },
      },
      { upsert: true, new: true }
    );

    logger.info(`[ADAPTIVE_COMPRESSION] Params updated (version ${result.version})`);
    return result.params;
  } catch (error) {
    logger.error(`[ADAPTIVE_COMPRESSION] Learning failed: ${error.message}`);
    throw error;
  }
};
