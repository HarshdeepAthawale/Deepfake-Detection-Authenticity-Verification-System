/**
 * Learning Routes
 * REST API for self-learning system - mounted at /api/admin/learning
 */

import express from 'express';
import { authenticate } from '../auth/auth.middleware.js';
import { requirePermission, PERMISSIONS } from '../security/rbac.js';
import {
  getStatus,
  triggerLearning,
  trainingCompleteCallback,
  getHistory,
} from './learning.controller.js';

const router = express.Router();

// Internal callback from ML service - NO AUTH (called by ml-service container)
router.post('/training-complete', trainingCompleteCallback);

// All other routes require admin authentication
router.use(authenticate);
router.use(requirePermission(PERMISSIONS.SYSTEM_ADMIN));

/**
 * @route   GET /api/admin/learning/status
 * @desc    Get learning system status + all agent params
 * @access  Private (requires system:admin permission)
 */
router.get('/status', getStatus);

/**
 * @route   POST /api/admin/learning/trigger
 * @desc    Manually trigger learning cycle
 * @access  Private (requires system:admin permission)
 */
router.post('/trigger', triggerLearning);

/**
 * @route   GET /api/admin/learning/history
 * @desc    Paginated learning cycle history
 * @access  Private (requires system:admin permission)
 */
router.get('/history', getHistory);

export default router;
