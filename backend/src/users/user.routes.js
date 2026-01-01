/**
 * User Routes
 * Defines user management API endpoints (admin only)
 */

import express from 'express';
import {
  getUsers,
  getUser,
  createUserHandler,
  updateUserHandler,
  deleteUserHandler,
  getStats,
} from './user.controller.js';
import { authenticate } from '../auth/auth.middleware.js';
import { requirePermission, PERMISSIONS } from '../security/rbac.js';

const router = express.Router();

// All user routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Private (requires user:view permission)
 */
router.get(
  '/stats',
  requirePermission(PERMISSIONS.USER_VIEW),
  getStats
);

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination
 * @access  Private (requires user:view permission)
 */
router.get(
  '/',
  requirePermission(PERMISSIONS.USER_VIEW),
  getUsers
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (requires user:view permission)
 */
router.get(
  '/:id',
  requirePermission(PERMISSIONS.USER_VIEW),
  getUser
);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Private (requires user:create permission)
 */
router.post(
  '/',
  requirePermission(PERMISSIONS.USER_CREATE),
  createUserHandler
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (requires user:edit permission)
 */
router.put(
  '/:id',
  requirePermission(PERMISSIONS.USER_EDIT),
  updateUserHandler
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private (requires user:delete permission)
 */
router.delete(
  '/:id',
  requirePermission(PERMISSIONS.USER_DELETE),
  deleteUserHandler
);

export default router;

