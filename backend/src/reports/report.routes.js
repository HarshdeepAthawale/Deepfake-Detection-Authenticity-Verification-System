/**
 * Report Routes
 * Defines export-related API endpoints
 */

import express from 'express';
import { exportScanPDF, exportScanJSON, exportScansCSV } from './report.controller.js';
import { authenticate } from '../auth/auth.middleware.js';
import { requirePermission, PERMISSIONS } from '../security/rbac.js';

const router = express.Router();

// All export routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/reports/scans/:id/pdf
 * @desc    Export single scan as PDF
 * @access  Private (requires scan:view permission)
 */
router.get(
  '/scans/:id/pdf',
  requirePermission(PERMISSIONS.SCAN_VIEW),
  exportScanPDF
);

/**
 * @route   GET /api/reports/scans/:id/json
 * @desc    Export single scan as JSON
 * @access  Private (requires scan:view permission)
 */
router.get(
  '/scans/:id/json',
  requirePermission(PERMISSIONS.SCAN_VIEW),
  exportScanJSON
);

/**
 * @route   GET /api/reports/scans/csv
 * @desc    Export multiple scans as CSV
 * @access  Private (requires scan:view permission)
 */
router.get(
  '/scans/csv',
  requirePermission(PERMISSIONS.SCAN_VIEW),
  exportScansCSV
);

export default router;
