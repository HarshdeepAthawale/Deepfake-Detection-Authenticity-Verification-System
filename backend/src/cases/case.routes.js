/**
 * Case Routes
 * Defines case management API endpoints
 */

import express from 'express';
import {
  createCaseHandler,
  getCaseHandler,
  getCasesHandler,
  updateCaseHandler,
  deleteCaseHandler,
} from './case.controller.js';
import { authenticate } from '../auth/auth.middleware.js';
import { requirePermission, PERMISSIONS } from '../security/rbac.js';

const router = express.Router();

// All case routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/cases
 * @desc    Create a new case
 * @access  Private (requires case:create permission)
 */
router.post('/', requirePermission(PERMISSIONS.CASE_CREATE), createCaseHandler);

/**
 * @route   GET /api/cases
 * @desc    Get cases with filtering
 * @access  Private (requires case:view permission)
 */
router.get('/', requirePermission(PERMISSIONS.CASE_VIEW), getCasesHandler);

/**
 * @route   GET /api/cases/:id
 * @desc    Get case by ID
 * @access  Private (requires case:view permission)
 */
router.get('/:id', requirePermission(PERMISSIONS.CASE_VIEW), getCaseHandler);

/**
 * @route   PUT /api/cases/:id
 * @desc    Update case
 * @access  Private (requires case:edit permission)
 */
router.put('/:id', requirePermission(PERMISSIONS.CASE_EDIT), updateCaseHandler);

/**
 * @route   DELETE /api/cases/:id
 * @desc    Delete case
 * @access  Private (requires case:delete permission)
 */
router.delete('/:id', requirePermission(PERMISSIONS.CASE_DELETE), deleteCaseHandler);

export default router;
