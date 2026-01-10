/**
 * Admin Routes
 * Defines admin-specific API endpoints
 */

import express from 'express';
import { getAdminStats, getMLHealth, getMLConfigEndpoint } from './admin.controller.js';
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

export default router;

