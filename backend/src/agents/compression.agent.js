/**
 * Compression-Aware Agent (Enhanced)
 * Analyzes recompression artifacts, quality metrics, and adjusts risk scores
 */

import logger from '../utils/logger.js';
import { getCompressionParams } from '../learning/adaptive-compression.js';

// Default bitrate thresholds (Mbps) - used when no learned params
const DEFAULT_BITRATE_THRESHOLDS = { veryLow: 1, low: 3, moderate: 5 };
// Default quality-score deductions per tier
const DEFAULT_QUALITY_DEDUCTIONS = { veryLow: 30, low: 15, moderate: 5, bitsPerPixel: 20 };
// Default confidence reductions by quality score tier
const DEFAULT_CONFIDENCE_REDUCTIONS = [
  { threshold: 40, reduction: 25 },
  { threshold: 60, reduction: 15 },
  { threshold: 80, reduction: 5 },
];

/**
 * Assess media quality based on metadata
 * @param {Object} metadata - Media metadata
 * @param {Object} [learnedParams] - Learned qualityThresholds and confidenceReductions (optional)
 * @returns {Object} Quality assessment
 */
const assessMediaQuality = (metadata, learnedParams = null) => {
  const bitrate = metadata.bitrate || 0;
  const width = metadata.width || 0;
  const height = metadata.height || 0;

  const thresholds = learnedParams?.qualityThresholds || DEFAULT_BITRATE_THRESHOLDS;
  const veryLowMbps = thresholds.veryLowBitrateMbps ?? thresholds.veryLow ?? 1;
  const lowMbps = thresholds.lowBitrateMbps ?? thresholds.low ?? 3;
  const moderateMbps = thresholds.moderateBitrateMbps ?? thresholds.moderate ?? 5;

  let qualityScore = 100;
  const qualityIssues = [];

  // Bitrate assessment (uses learned thresholds)
  if (bitrate > 0) {
    const bitrateMbps = bitrate / 1000000;
    const pixels = width * height;
    const bitsPerPixel = pixels > 0 ? bitrate / pixels : 0;

    if (bitrateMbps < veryLowMbps) {
      qualityScore -= DEFAULT_QUALITY_DEDUCTIONS.veryLow;
      qualityIssues.push('Very low bitrate - heavy compression');
    } else if (bitrateMbps < lowMbps) {
      qualityScore -= DEFAULT_QUALITY_DEDUCTIONS.low;
      qualityIssues.push('Low bitrate - moderate compression');
    } else if (bitrateMbps < moderateMbps) {
      qualityScore -= DEFAULT_QUALITY_DEDUCTIONS.moderate;
      qualityIssues.push('Moderate bitrate');
    }

    if (bitsPerPixel > 0 && bitsPerPixel < 0.1) {
      qualityScore -= DEFAULT_QUALITY_DEDUCTIONS.bitsPerPixel;
      qualityIssues.push('Extremely low bits-per-pixel ratio');
    }
  }

  // Resolution assessment
  if (width > 0 && height > 0) {
    const pixels = width * height;
    if (pixels < 640 * 480) {
      qualityScore -= 20;
      qualityIssues.push('Low resolution');
    } else if (pixels < 1280 * 720) {
      qualityScore -= 10;
      qualityIssues.push('Below HD resolution');
    }
  }

  return {
    qualityScore: Math.max(0, qualityScore),
    qualityIssues,
    bitsPerPixel: bitrate > 0 && width > 0 && height > 0 ? (bitrate / (width * height)).toFixed(3) : 0,
  };
};

/**
 * Analyze codec and compression patterns
 * @param {Object} metadata - Media metadata
 * @param {Object} [learnedSuspicion] - Learned codec suspicion scores (optional)
 * @returns {Object} Codec analysis
 */
const analyzeCodec = (metadata, learnedSuspicion = null) => {
  const codec = (metadata.codec || 'unknown').toLowerCase();
  let suspicionScore = 0;
  const codecFindings = [];

  // Use learned scores if available, otherwise hardcoded defaults
  const scores = learnedSuspicion || {
    'h265': 2, 'hevc': 2, 'vp9': 3, 'av1': 4, 'h264': 0, 'avc': 0, 'mjpeg': 10, 'motion jpeg': 10,
  };

  // Check codec against suspicion map
  for (const [key, score] of Object.entries(scores)) {
    if (codec.includes(key)) {
      const label = key.toUpperCase().replace('H265', 'H.265/HEVC').replace('H264', 'H.264/AVC').replace('VP9', 'VP9').replace('AV1', 'AV1');
      codecFindings.push(`${label} codec detected`);
      suspicionScore += score;
      break; // Only match first codec
    }
  }

  return {
    suspicionScore,
    codecFindings,
  };
};

/**
 * Analyze compression artifacts and adjust detection scores
 * @param {Object} perceptionData - Data from perception agent
 * @param {Object} detectionScores - Scores from detection agent
 * @returns {Promise<Object>} Adjusted scores with compression analysis
 */
export const analyzeCompression = async (perceptionData, detectionScores) => {
  try {
    logger.info(`[COMPRESSION_AGENT] Analyzing compression artifacts`);

    const metadata = perceptionData.metadata || {};

    // Load learned params (fallback to defaults on failure)
    let learnedParams;
    try {
      learnedParams = await getCompressionParams();
    } catch {
      learnedParams = null;
    }

    // Assess media quality (uses learned qualityThresholds if available)
    const qualityAssessment = assessMediaQuality(metadata, learnedParams);

    // Analyze codec with learned suspicion scores
    const codecAnalysis = analyzeCodec(metadata, learnedParams?.codecSuspicion || null);

    // Combine all compression-related findings
    const compressionArtifacts = [
      ...qualityAssessment.qualityIssues,
      ...codecAnalysis.codecFindings,
    ];

    // Calculate compression impact
    const compressionRiskImpact = codecAnalysis.suspicionScore;
    const adjustedRiskScore = Math.min(100, detectionScores.riskScore + compressionRiskImpact);

    // Reduce confidence if quality is poor - use learned confidenceReductions if available
    const confReductions = learnedParams?.confidenceReductions || DEFAULT_CONFIDENCE_REDUCTIONS;
    const tiers = Array.isArray(confReductions)
      ? confReductions
      : [
          { threshold: confReductions.veryPoor?.threshold ?? 40, reduction: confReductions.veryPoor?.reduction ?? 25 },
          { threshold: confReductions.poor?.threshold ?? 60, reduction: confReductions.poor?.reduction ?? 15 },
          { threshold: confReductions.moderate?.threshold ?? 80, reduction: confReductions.moderate?.reduction ?? 5 },
        ].sort((a, b) => a.threshold - b.threshold);

    let confidenceReduction = 0;
    for (const { threshold, reduction } of tiers) {
      if (qualityAssessment.qualityScore < threshold) {
        confidenceReduction = reduction;
        break;
      }
    }

    const adjustedConfidence = Math.max(0, detectionScores.confidence - confidenceReduction);

    const compressionResults = {
      ...detectionScores,
      riskScore: Math.round(adjustedRiskScore),
      confidence: Math.round(adjustedConfidence),
      compressionAnalysis: {
        bitrate: metadata.bitrate || 0,
        codec: metadata.codec || 'unknown',
        compressionImpact: compressionRiskImpact,
        qualityScore: qualityAssessment.qualityScore,
        bitsPerPixel: qualityAssessment.bitsPerPixel,
        artifacts: compressionArtifacts,
      },
    };

    logger.info(`[COMPRESSION_AGENT] Compression analysis complete`);
    logger.info(`[COMPRESSION_AGENT] Quality Score: ${qualityAssessment.qualityScore}, Impact: +${compressionRiskImpact} risk`);
    logger.info(`[COMPRESSION_AGENT] Adjusted Risk: ${compressionResults.riskScore}, Confidence: ${compressionResults.confidence}%`);

    return compressionResults;
  } catch (error) {
    logger.error(`[COMPRESSION_AGENT] Compression analysis error: ${error.message}`);
    // Return original scores if compression analysis fails
    return detectionScores;
  }
};

export default {
  analyzeCompression,
  assessMediaQuality, // Export for testing
};
