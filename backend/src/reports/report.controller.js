/**
 * Report Controller
 * Handles export-related HTTP requests
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  generatePDFReport,
  generateJSONExport,
  generateCSVExport,
  getScanForExport,
} from './report.service.js';
import { getScanHistory } from '../scans/scan.service.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Temporary directory for exports
const exportDir = path.join(__dirname, '../../exports');

/**
 * Export scan as PDF
 * GET /api/scans/:id/export/pdf
 */
export const exportScanPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Get scan
    const scan = await getScanForExport(id, user.id, user.role);

    // Generate PDF
    const timestamp = Date.now();
    const filename = `scan_${scan.scanId}_${timestamp}.pdf`;
    const outputPath = path.join(exportDir, filename);

    await generatePDFReport(scan, outputPath);

    // Send PDF file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    const fileStream = fs.createReadStream(outputPath);
    fileStream.pipe(res);

    // Clean up file after sending
    fileStream.on('end', () => {
      setTimeout(() => {
        if (fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
        }
      }, 5000); // Delete after 5 seconds
    });

    fileStream.on('error', (error) => {
      logger.error('PDF export stream error:', error);
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
      res.status(500).json({
        error: 'Export failed',
        message: 'Failed to stream PDF file',
      });
    });
  } catch (error) {
    logger.error('Export PDF error:', error);
    res.status(error.message === 'Scan not found or access denied' ? 404 : 500).json({
      error: 'Export failed',
      message: error.message,
    });
  }
};

/**
 * Export scan as JSON
 * GET /api/scans/:id/export/json
 */
export const exportScanJSON = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Get scan
    const scan = await getScanForExport(id, user.id, user.role);

    // Generate JSON
    const jsonData = generateJSONExport(scan);

    // Send JSON file
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="scan_${scan.scanId}.json"`);
    res.status(200).json(jsonData);
  } catch (error) {
    logger.error('Export JSON error:', error);
    res.status(error.message === 'Scan not found or access denied' ? 404 : 500).json({
      error: 'Export failed',
      message: error.message,
    });
  }
};

/**
 * Export scans as CSV (bulk export)
 * GET /api/scans/export/csv
 */
export const exportScansCSV = async (req, res) => {
  try {
    const user = req.user;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '1000', 10); // Max 1000 for CSV export
    
    // Parse filters from query
    const filters = {
      search: req.query.search,
      status: req.query.status,
      mediaType: req.query.mediaType,
      verdict: req.query.verdict,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      tags: req.query.tags ? (Array.isArray(req.query.tags) ? req.query.tags : req.query.tags.split(',')) : undefined,
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    // Get scans (limit to 1000 for CSV export)
    const maxLimit = Math.min(limit, 1000);
    const result = await getScanHistory(filters, user.id, user.role, page, maxLimit);

    // Generate CSV
    const csvContent = generateCSVExport(result.scans);

    // Send CSV file
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="scans_export_${Date.now()}.csv"`);
    res.status(200).send(csvContent);
  } catch (error) {
    logger.error('Export CSV error:', error);
    res.status(500).json({
      error: 'Export failed',
      message: error.message,
    });
  }
};

export default {
  exportScanPDF,
  exportScanJSON,
  exportScansCSV,
};
