/**
 * Admin Routes
 * Defines admin-specific API endpoints
 */

import express from 'express';
import { getAdminStats } from './admin.controller.js';
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

export default router;

