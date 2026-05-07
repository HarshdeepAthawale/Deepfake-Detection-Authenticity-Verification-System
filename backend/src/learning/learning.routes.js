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

// Middleware to verify internal ML service requests
const verifyMLServiceSecret = (req, res, next) => {
  const mlSecret = process.env.ML_SERVICE_SECRET || 'ml-service-internal-secret';
  const providedSecret = req.headers['x-ml-service-secret'];

  if (providedSecret !== mlSecret) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing ML service secret',
    });
  }

  next();
};

// Internal callback from ML service - requires ML service secret header
router.post('/training-complete', verifyMLServiceSecret, trainingCompleteCallback);

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
