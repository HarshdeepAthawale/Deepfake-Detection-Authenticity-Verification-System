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
 * @desc    Export single scan as PDF report
 * @access  Private (requires report:generate permission)
 */
router.get(
  '/scans/:id/pdf',
  requirePermission(PERMISSIONS.REPORT_GENERATE),
  exportScanPDF
);

/**
 * @route   GET /api/reports/scans/:id/json
 * @desc    Export single scan as JSON report
 * @access  Private (requires report:generate permission)
 */
router.get(
  '/scans/:id/json',
  requirePermission(PERMISSIONS.REPORT_GENERATE),
  exportScanJSON
);

/**
 * @route   GET /api/reports/scans/csv
 * @desc    Export multiple scans as CSV (bulk export)
 * @access  Private (requires scan:export permission)
 */
router.get(
  '/scans/csv',
  requirePermission(PERMISSIONS.SCAN_EXPORT),
  exportScansCSV
);

export default router;
