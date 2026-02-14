/**
 * Learning Models
 * MongoDB schemas for self-learning AI agent infrastructure
 */

import mongoose from 'mongoose';

/**
 * Training History - tracks each model fine-tuning run
 */
const trainingHistorySchema = new mongoose.Schema(
  {
    version: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['running', 'completed', 'failed'],
      default: 'running',
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: Date,
    datasetSize: {
      total: Number,
      real: Number,
      fake: Number,
    },
    metrics: {
      accuracy: Number,
      loss: Number,
      valAccuracy: Number,
      valLoss: Number,
      epochs: Number,
      learningRate: Number,
    },
    previousVersion: String,
    modelPath: String,
    error: String,
  },
  {
    timestamps: true,
    collection: 'training_history',
  }
);

/**
 * Learning Params - stores learned parameters for each agent
 */
const learningParamsSchema = new mongoose.Schema(
  {
    agent: {
      type: String,
      required: true,
      enum: ['perception', 'compression', 'cognitive', 'detection'],
      unique: true,
      index: true,
    },
    params: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    feedbackCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: 'learning_params',
  }
);

/**
 * Learning Cycle Log - records each full learning cycle execution
 */
const learningCycleLogSchema = new mongoose.Schema(
  {
    triggeredBy: {
      type: String,
      enum: ['scheduler', 'manual'],
      required: true,
    },
    status: {
      type: String,
      enum: ['running', 'completed', 'partial', 'failed'],
      default: 'running',
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: Date,
    feedbackCount: {
      type: Number,
      default: 0,
    },
    agents: {
      perception: {
        status: { type: String, enum: ['pending', 'running', 'completed', 'failed', 'skipped'], default: 'pending' },
        error: String,
        paramsUpdated: Boolean,
      },
      compression: {
        status: { type: String, enum: ['pending', 'running', 'completed', 'failed', 'skipped'], default: 'pending' },
        error: String,
        paramsUpdated: Boolean,
      },
      cognitive: {
        status: { type: String, enum: ['pending', 'running', 'completed', 'failed', 'skipped'], default: 'pending' },
        error: String,
        paramsUpdated: Boolean,
      },
      detection: {
        status: { type: String, enum: ['pending', 'running', 'completed', 'failed', 'skipped'], default: 'pending' },
        error: String,
        trainingTriggered: Boolean,
      },
    },
    error: String,
  },
  {
    timestamps: true,
    collection: 'learning_cycle_logs',
  }
);

learningCycleLogSchema.index({ startedAt: -1 });
learningCycleLogSchema.index({ status: 1 });

export const TrainingHistory = mongoose.model('TrainingHistory', trainingHistorySchema);
export const LearningParams = mongoose.model('LearningParams', learningParamsSchema);
export const LearningCycleLog = mongoose.model('LearningCycleLog', learningCycleLogSchema);
