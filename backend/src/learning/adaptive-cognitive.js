/**
 * Adaptive Cognitive Agent Learning
 * Bayesian threshold adaptation from false-positive/false-negative analysis
 */

import { LearningParams } from './learning.model.js';
import Scan from '../scans/scan.model.js';
import logger from '../utils/logger.js';

// Default thresholds (matches cognitive.agent.js hardcoded values)
const DEFAULT_PARAMS = {
  deepfakeThreshold: 75,
  suspiciousThreshold: 40,
  // Adjustment values for context modifiers
  adjustments: {
    lowBitrateIncrease: 5,
    highUncertaintyDeepfake: 10,
    highUncertaintySuspicious: 5,
    imageDecrease: 5,
    multiFrameDecrease: 5,
  },
  // Clamp ranges
  clamps: {
    deepfake: { min: 55, max: 90 },
    suspicious: { min: 25, max: 55 },
  },
};

const LEARNING_RATE = 0.1;

/**
 * Get learned cognitive parameters (with fallback to defaults)
 */
export const getCognitiveParams = async () => {
  try {
    const learned = await LearningParams.findOne({ agent: 'cognitive' }).lean();
    if (learned?.params) {
      logger.info('[ADAPTIVE_COGNITIVE] Using learned cognitive params');
      return {
        deepfakeThreshold: learned.params.deepfakeThreshold ?? DEFAULT_PARAMS.deepfakeThreshold,
        suspiciousThreshold: learned.params.suspiciousThreshold ?? DEFAULT_PARAMS.suspiciousThreshold,
        adjustments: learned.params.adjustments ?? DEFAULT_PARAMS.adjustments,
        clamps: learned.params.clamps ?? DEFAULT_PARAMS.clamps,
      };
    }
  } catch (error) {
    logger.warn(`[ADAPTIVE_COGNITIVE] Failed to load params: ${error.message}`);
  }

  return { ...DEFAULT_PARAMS };
};

/**
 * Learn optimal thresholds from feedback patterns using Bayesian-style adaptation.
 *
 * Logic:
 * - Collect false-positive risk scores (system said deepfake, was authentic)
 * - Collect false-negative risk scores (system said authentic, was deepfake)
 * - Nudge deepfakeThreshold toward optimal boundary using learning rate
 * - Adjust suspiciousThreshold proportionally
 * - Clamp to safe ranges
 */
export const learnCognitiveParams = async () => {
  try {
    // Get all scans with feedback
    const scans = await Scan.find({
      status: 'COMPLETED',
      'feedback.correctedVerdict': { $exists: true },
      'result.riskScore': { $exists: true },
    }).select('result.verdict result.riskScore feedback.correctedVerdict').lean();

    if (scans.length < 10) {
      logger.info(`[ADAPTIVE_COGNITIVE] Not enough feedback scans (${scans.length}) to learn from`);
      return null;
    }

    const current = await getCognitiveParams();

    // Collect risk scores for false positives and false negatives
    const falsePositiveScores = []; // System said DEEPFAKE, was AUTHENTIC
    const falseNegativeScores = []; // System said AUTHENTIC, was DEEPFAKE

    for (const scan of scans) {
      const originalVerdict = scan.result?.verdict;
      const correctedVerdict = scan.feedback?.correctedVerdict;
      const riskScore = scan.result?.riskScore;

      if (!originalVerdict || !correctedVerdict || originalVerdict === correctedVerdict) continue;
      if (riskScore === undefined || riskScore === null) continue;

      if (originalVerdict === 'DEEPFAKE' && correctedVerdict === 'AUTHENTIC') {
        falsePositiveScores.push(riskScore);
      } else if (originalVerdict === 'AUTHENTIC' && (correctedVerdict === 'DEEPFAKE' || correctedVerdict === 'SUSPICIOUS')) {
        falseNegativeScores.push(riskScore);
      }
    }

    if (falsePositiveScores.length === 0 && falseNegativeScores.length === 0) {
      logger.info('[ADAPTIVE_COGNITIVE] No false positives or negatives to learn from');
      return null;
    }

    let newDeepfake = current.deepfakeThreshold;
    let newSuspicious = current.suspiciousThreshold;

    // If we have false positives, the threshold is too low (raising it would reduce FPs)
    if (falsePositiveScores.length > 0) {
      const avgFPScore = falsePositiveScores.reduce((a, b) => a + b, 0) / falsePositiveScores.length;
      // Nudge threshold up toward the average FP score
      const fpNudge = (avgFPScore - newDeepfake) * LEARNING_RATE * (falsePositiveScores.length / scans.length);
      newDeepfake += Math.max(0, fpNudge); // Only increase to reduce FPs
      logger.info(
        `[ADAPTIVE_COGNITIVE] FP analysis: ${falsePositiveScores.length} FPs, avg score=${avgFPScore.toFixed(1)}, nudge=+${fpNudge.toFixed(2)}`
      );
    }

    // If we have false negatives, the threshold is too high (lowering it would reduce FNs)
    if (falseNegativeScores.length > 0) {
      const avgFNScore = falseNegativeScores.reduce((a, b) => a + b, 0) / falseNegativeScores.length;
      // Nudge threshold down toward the average FN score
      const fnNudge = (newDeepfake - avgFNScore) * LEARNING_RATE * (falseNegativeScores.length / scans.length);
      newDeepfake -= Math.max(0, fnNudge); // Only decrease to reduce FNs
      logger.info(
        `[ADAPTIVE_COGNITIVE] FN analysis: ${falseNegativeScores.length} FNs, avg score=${avgFNScore.toFixed(1)}, nudge=-${fnNudge.toFixed(2)}`
      );
    }

    // Clamp deepfake threshold
    const clamps = current.clamps || DEFAULT_PARAMS.clamps;
    newDeepfake = Math.max(clamps.deepfake.min, Math.min(clamps.deepfake.max, newDeepfake));

    // Adjust suspicious threshold proportionally
    const ratio = current.suspiciousThreshold / current.deepfakeThreshold;
    newSuspicious = Math.round(newDeepfake * ratio);
    newSuspicious = Math.max(clamps.suspicious.min, Math.min(clamps.suspicious.max, newSuspicious));

    newDeepfake = Math.round(newDeepfake * 10) / 10; // Round to 1 decimal

    const changed = Math.abs(newDeepfake - current.deepfakeThreshold) > 0.1 ||
                    Math.abs(newSuspicious - current.suspiciousThreshold) > 0.1;

    if (!changed) {
      logger.info('[ADAPTIVE_COGNITIVE] No significant threshold changes');
      return null;
    }

    logger.info(
      `[ADAPTIVE_COGNITIVE] Thresholds: deepfake ${current.deepfakeThreshold} → ${newDeepfake}, ` +
      `suspicious ${current.suspiciousThreshold} → ${newSuspicious}`
    );

    // Save learned params
    const result = await LearningParams.findOneAndUpdate(
      { agent: 'cognitive' },
      {
        $set: {
          params: {
            deepfakeThreshold: newDeepfake,
            suspiciousThreshold: newSuspicious,
            adjustments: current.adjustments,
            clamps: current.clamps,
          },
          lastUpdated: new Date(),
        },
        $inc: { version: 1, feedbackCount: scans.length },
      },
      { upsert: true, new: true }
    );

    logger.info(`[ADAPTIVE_COGNITIVE] Params updated (version ${result.version})`);
    return result.params;
  } catch (error) {
    logger.error(`[ADAPTIVE_COGNITIVE] Learning failed: ${error.message}`);
    throw error;
  }
};
