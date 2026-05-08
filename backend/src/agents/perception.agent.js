/**
 * Perception Agent
 * Handles media pre-processing, signal extraction, and normalization
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateFileHash } from '../security/encryption.js';
import { extractFrames, extractSceneChangeFrames, extractAudio, getMediaMetadata, normalizeMedia, extractGPSFromImage } from '../utils/ffmpeg.js';
import logger from '../utils/logger.js';
import { getPerceptionParams } from '../learning/adaptive-perception.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Process media file through perception agent
 * @param {string} filePath - Path to media file
 * @param {string} scanId - Unique scan ID
 * @returns {Promise<Object>} Perception results
 */
export const processMedia = async (filePath, scanId) => {
  try {
    logger.info(`[PERCEPTION_AGENT] Starting perception processing for scan: ${scanId}`);

    // Read file buffer for hashing
    const fileBuffer = fs.readFileSync(filePath);
    const hash = generateFileHash(fileBuffer);

    // Get media metadata
    let metadata;
    try {
      metadata = await getMediaMetadata(filePath);
    } catch (error) {
      logger.warn(`[PERCEPTION_AGENT] Could not extract metadata (may be audio/image): ${error.message}`);
      metadata = {
        format: {
          format_name: path.extname(filePath).slice(1),
          duration: 0,
          size: fileBuffer.length,
        },
      };
    }

    // Determine media type
    // Determine media type
    const ext = path.extname(filePath).toLowerCase();
    const formatName = metadata.format?.format_name?.toLowerCase() || '';

    // Robust type detection
    const isVideo = ['mp4', 'avi', 'mov', 'webm', 'mkv'].some(t => formatName.includes(t) || ext.includes(t));
    const isAudio = ['mp3', 'wav', 'mpeg', 'aac'].some(t => formatName.includes(t) || ext.includes(t));
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'tiff', 'image2'].some(t => formatName.includes(t) || ext.includes(t));

    logger.info(`[PERCEPTION_AGENT] Determined media type: Video=${isVideo}, Audio=${isAudio}, Image=${isImage} (Format: ${formatName}, Ext: ${ext})`);

    // Create processing directory
    const processingDir = path.join(__dirname, '../../uploads/processing', scanId);
    if (!fs.existsSync(processingDir)) {
      fs.mkdirSync(processingDir, { recursive: true });
    }

    const perceptionResults = {
      hash,
      mediaType: isVideo ? 'VIDEO' : isAudio ? 'AUDIO' : isImage ? 'IMAGE' : 'UNKNOWN',
      duration: metadata.format?.duration || 0,
      size: fileBuffer.length,
      maxFrames: null, // populated below for video — forwarded to ML service
      metadata: {
        format: metadata.format?.format_name,
        bitrate: metadata.format?.bit_rate,
        codec: metadata.streams?.[0]?.codec_name,
        width: metadata.streams?.find(s => s.width)?.width,
        height: metadata.streams?.find(s => s.height)?.height,
        sampleRate: metadata.streams?.find(s => s.sample_rate)?.sample_rate,
        channels: metadata.streams?.find(s => s.channels)?.channels,
      },
      extractedFrames: [],
      extractedAudio: null,
      normalizedPath: null,
      gpsCoordinates: null,
    };

    // Extract GPS coordinates if image
    if (isImage) {
      try {
        const gpsData = await extractGPSFromImage(filePath);
        if (gpsData) {
          perceptionResults.gpsCoordinates = gpsData;
          logger.info(`[PERCEPTION_AGENT] GPS coordinates extracted: ${gpsData.latitude}, ${gpsData.longitude}`);
        }
      } catch (error) {
        logger.warn(`[PERCEPTION_AGENT] GPS extraction failed: ${error.message}`);
      }
    }

    // Extract frames if video
    if (isVideo) {
      try {
        const framesDir = path.join(processingDir, 'frames');

        // Adaptive frame sampling based on video duration (uses learned params if available)
        const duration = perceptionResults.duration || 0;
        let frameRate = 4; // Default 4 fps
        let maxFrames = 60; // Default max 60 frames

        try {
          const learnedParams = await getPerceptionParams();
          const buckets = learnedParams.durationBuckets;
          const bucket = buckets.find(b => duration <= b.maxDuration);
          if (bucket) {
            frameRate = bucket.frameRate;
            maxFrames = bucket.maxFrames;
            logger.info(`[PERCEPTION_AGENT] Using learned sampling params for duration=${duration}s`);
          }
        } catch {
          // Fallback to adaptive defaults based on duration
          if (duration <= 10) {
            frameRate = 4; maxFrames = 40;
          } else if (duration <= 30) {
            frameRate = 3; maxFrames = 90;
          } else if (duration <= 60) {
            frameRate = 2; maxFrames = 120;
          } else {
            frameRate = 1; maxFrames = 120;
          }
        }

        logger.info(`[PERCEPTION_AGENT] Adaptive sampling: duration=${duration}s, fps=${frameRate}, maxFrames=${maxFrames}`);

        let frames;

        if (duration > 30) {
          // For longer videos, scene-change detection picks the most visually distinct frames,
          // giving the ML model diverse content rather than uniformly-sampled redundant frames.
          try {
            const sceneDir = path.join(processingDir, 'frames');
            frames = await extractSceneChangeFrames(filePath, sceneDir, 0.3, maxFrames);
            logger.info(`[PERCEPTION_AGENT] Scene-change extraction: ${frames.length} frames`);

            // Fall back to uniform sampling if too few scene-change frames were found
            if (frames.length < 5) {
              logger.warn(`[PERCEPTION_AGENT] Scene detection yielded only ${frames.length} frames — falling back to uniform sampling`);
              frames = await extractFrames(filePath, framesDir, frameRate, maxFrames);
            }
          } catch (sceneErr) {
            logger.warn(`[PERCEPTION_AGENT] Scene-change extraction failed (${sceneErr.message}) — falling back to uniform sampling`);
            frames = await extractFrames(filePath, framesDir, frameRate, maxFrames);
          }
        } else {
          // Short videos: uniform sampling is fine and faster
          frames = await extractFrames(filePath, framesDir, frameRate, maxFrames);
        }

        perceptionResults.extractedFrames = frames;
        perceptionResults.maxFrames = frames.length; // tell ML service exactly how many frames we extracted
        logger.info(`[PERCEPTION_AGENT] Extracted ${frames.length} frames`);
      } catch (error) {
        logger.warn(`[PERCEPTION_AGENT] Frame extraction failed: ${error.message}`);
      }
    } else if (isImage) {
      // For images, the "frame" is just the image file itself
      perceptionResults.extractedFrames = [filePath];
    }

    // Extract audio if video
    if (isVideo) {
      try {
        const audioPath = path.join(processingDir, 'audio.wav');
        await extractAudio(filePath, audioPath);
        perceptionResults.extractedAudio = audioPath;
        logger.info(`[PERCEPTION_AGENT] Audio extracted`);
      } catch (error) {
        logger.warn(`[PERCEPTION_AGENT] Audio extraction failed: ${error.message}`);
      }
    }

    // Normalize media (optional, for consistency)
    // In production, you might want to normalize all media to a standard format
    // For now, we'll skip normalization to preserve original quality

    logger.info(`[PERCEPTION_AGENT] Perception processing complete for scan: ${scanId}`);

    return perceptionResults;
  } catch (error) {
    logger.error(`[PERCEPTION_AGENT] Error processing media: ${error.message}`);
    throw new Error(`Perception agent failed: ${error.message}`);
  }
};

export default {
  processMedia,
};

