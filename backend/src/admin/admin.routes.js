/**
 * Admin Routes
 * Defines admin-specific API endpoints
 */

import express from 'express';
import { getAdminStats, getMLHealth, getMLConfigEndpoint, getFeedbackStats } from './admin.controller.js';
import {
  getAnalyticsOverview,
  getAnalyticsTrends,
  getAnalyticsUsers,
  getAnalyticsScans,
} from './analytics.controller.js';
import { authenticate } from '../auth/auth.middleware.js';
import { requirePermission, PERMISSIONS } from '../security/rbac.js';

const router = express.Router();

// All admin routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/admin/stats
 * @desc    Get system-wide statistics
 * @access  Private (requires system:admin permission)
 */
router.get(
  '/stats',
  requirePermission(PERMISSIONS.SYSTEM_ADMIN),
  getAdminStats
);

/**
 * @route   GET /api/admin/ml/health
 * @desc    Get ML service health status
 * @access  Private (requires system:admin permission)
 */
router.get(
  '/ml/health',
  requirePermission(PERMISSIONS.SYSTEM_ADMIN),
  getMLHealth
);

/**
 * @route   GET /api/admin/ml/config
 * @desc    Get ML service configuration
 * @access  Private (requires system:admin permission)
 */
router.get(
  '/ml/config',
  requirePermission(PERMISSIONS.SYSTEM_ADMIN),
  getMLConfigEndpoint
);

/**
 * @route   GET /api/admin/feedback/stats
 * @desc    Get feedback count for self-learning retraining
 * @access  Private (requires system:admin permission)
 */
router.get(
  '/feedback/stats',
  requirePermission(PERMISSIONS.SYSTEM_ADMIN),
  getFeedbackStats
);

/**
 * Analytics routes
 */

/**
 * @route   GET /api/admin/analytics/overview
 * @desc    Get analytics overview
 * @access  Private (requires system:admin or view:analytics permission)
 */
router.get(
  '/analytics/overview',
  requirePermission(PERMISSIONS.VIEW_ANALYTICS),
  getAnalyticsOverview
);

/**
 * @route   GET /api/admin/analytics/trends
 * @desc    Get scan trends
 * @access  Private (requires system:admin or view:analytics permission)
 */
router.get(
  '/analytics/trends',
  requirePermission(PERMISSIONS.VIEW_ANALYTICS),
  getAnalyticsTrends
);

/**
 * @route   GET /api/admin/analytics/users
 * @desc    Get user activity analytics
 * @access  Private (requires system:admin or view:analytics permission)
 */
router.get(
  '/analytics/users',
  requirePermission(PERMISSIONS.VIEW_ANALYTICS),
  getAnalyticsUsers
);

/**
 * @route   GET /api/admin/analytics/scans
 * @desc    Get scan analytics
 * @access  Private (requires system:admin or view:analytics permission)
 */
router.get(
  '/analytics/scans',
  requirePermission(PERMISSIONS.VIEW_ANALYTICS),
  getAnalyticsScans
);

/**
 * Session management routes
 */

/**
 * @route   GET /api/admin/sessions
 * @desc    Get active user sessions
 * @access  Private (requires session:manage permission)
 */
router.get(
  '/sessions',
  requirePermission(PERMISSIONS.SESSION_MANAGE),
  (req, res) => {
    res.json({
      success: true,
      message: 'Session management endpoint',
      data: { sessions: [] },
    });
  }
);

/**
 * @route   DELETE /api/admin/sessions/:userId
 * @desc    Terminate user session
 * @access  Private (requires session:manage permission)
 */
router.delete(
  '/sessions/:userId',
  requirePermission(PERMISSIONS.SESSION_MANAGE),
  (req, res) => {
    res.json({
      success: true,
      message: `Session terminated for user ${req.params.userId}`,
    });
  }
);

/**
 * System configuration routes
 */

/**
 * @route   GET /api/admin/config
 * @desc    Get system configuration
 * @access  Private (requires system:config permission)
 */
router.get(
  '/config',
  requirePermission(PERMISSIONS.SYSTEM_CONFIG),
  (req, res) => {
    res.json({
      success: true,
      message: 'System configuration',
      data: {
        mlConfidenceThreshold: 0.75,
        rateLimitWindow: 900000,
        rateLimitRequests: 100,
        selfLearningThreshold: 50,
      },
    });
  }
);

/**
 * @route   PUT /api/admin/config
 * @desc    Update system configuration
 * @access  Private (requires system:config permission)
 */
router.put(
  '/config',
  requirePermission(PERMISSIONS.SYSTEM_CONFIG),
  (req, res) => {
    res.json({
      success: true,
      message: 'System configuration updated',
      data: req.body,
    });
  }
);

export default router;

