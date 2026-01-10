---
name: Phase 1 Core Enhancements Implementation
overview: "Implement Phase 1 high-priority features: WebSocket real-time updates, advanced search & filtering, export functionality, batch processing, and ML API integration infrastructure."
todos:
  - id: websocket-backend
    content: Implement WebSocket server in backend (Socket.IO integration, event emission in scan service)
    status: pending
  - id: websocket-frontend
    content: Implement WebSocket client in frontend (real-time updates in media scanner, notifications in tactical shell)
    status: pending
    dependencies:
      - websocket-backend
  - id: search-backend
    content: Add advanced search and filtering to backend (full-text search, filters, tags support)
    status: pending
  - id: search-frontend
    content: Implement advanced search UI in evidence vault (search input, filter panel, filter chips)
    status: pending
    dependencies:
      - search-backend
  - id: export-backend
    content: Implement export functionality in backend (PDF, JSON, CSV generation, export endpoints)
    status: pending
  - id: export-frontend
    content: Add export UI to frontend (export buttons, bulk export, export menu component)
    status: pending
    dependencies:
      - export-backend
  - id: batch-backend
    content: Implement batch processing in backend (queue system, batch upload endpoint, batch status tracking)
    status: completed
  - id: batch-frontend
    content: Add batch upload UI to frontend (multi-file selection, batch progress, file list display)
    status: completed
    dependencies:
      - batch-backend
  - id: ml-infrastructure
    content: Create ML API integration infrastructure (ML client, configuration, detection agent integration, admin ML config UI)
    status: in_progress
---

# Phase 1 Core Enhancements Implementation Plan

## Overview

Implement 5 high-priority features to enhance the deepfake detection system's core functionality with real-time updates, better search capabilities, export options, batch processing, and ML integration infrastructure.

## Phase 1 Features

### 1. WebSocket Real-Time Updates

Real-time scan status updates without polling, providing live progress tracking and instant notifications.

### 2. Advanced Search & Filtering

Enhanced evidence vault with full-text search, advanced filters, and improved UX for finding scans.

### 3. Export Functionality

PDF/JSON/CSV export capabilities for scan results and reports.

### 4. Batch Processing

Support for uploading and processing multiple files simultaneously with queue management.

### 5. ML API Integration Infrastructure

Framework for connecting to external ML services (Python Flask/FastAPI) for real deepfake detection models.

## Implementation Tasks

### Task 1: WebSocket Real-Time Updates

**Backend Changes:**

- Install Socket.IO: `npm install socket.io`
- Modify `backend/src/server.js` to integrate Socket.IO server
- Update `backend/src/scans/scan.service.js` to emit WebSocket events during scan processing
- Create `backend/src/scans/scan.socket.js` for Socket.IO event handlers

**Frontend Changes:**

- Install Socket.IO client: `npm install socket.io-client`
- Create `lib/socket.ts` for Socket.IO client initialization
- Update `components/media-scanner.tsx` to use WebSocket instead of polling
- Add real-time notification system to `components/tactical-shell.tsx`

**Files to Create/Modify:**

- `backend/src/server.js` (modify - add Socket.IO)
- `backend/src/scans/scan.service.js` (modify - emit events)
- `backend/src/scans/scan.socket.js` (new - Socket.IO handlers)
- `lib/socket.ts` (new - client initialization)
- `components/media-scanner.tsx` (modify - use WebSocket)
- `components/tactical-shell.tsx` (modify - add notifications)

### Task 2: Advanced Search & Filtering

**Backend Changes:**

- Update `backend/src/scans/scan.model.js` to add `tags` field
- Enhance `backend/src/scans/scan.service.js` with:
- Full-text search across fileName, explanations, metadata
- Advanced filter support (date range, GPS coordinates, verdict, media type, user, tags)
- Search query building logic
- Update `backend/src/scans/scan.controller.js` to handle search/filter parameters

**Frontend Changes:**

- Update `components/evidence-vault.tsx` with:
- Full-text search input
- Advanced filter panel (collapsible)
- Filter chips display
- Saved filter presets
- Tag input and display
- Add `components/search/filter-panel.tsx` (new component)
- Add `components/search/filter-chips.tsx` (new component)

**Files to Create/Modify:**

- `backend/src/scans/scan.model.js` (modify - add tags)
- `backend/src/scans/scan.service.js` (modify - add search/filter logic)
- `backend/src/scans/scan.controller.js` (modify - handle search params)
- `components/evidence-vault.tsx` (modify - enhanced UI)
- `components/search/filter-panel.tsx` (new)
- `components/search/filter-chips.tsx` (new)
- `lib/api.ts` (modify - add search/filter params)

### Task 3: Export Functionality

**Backend Changes:**

- Install PDF generation library: `npm install pdfkit` or `puppeteer`
- Create `backend/src/reports/report.service.js` for:
- PDF report generation with scan details, verdict, explanations, metadata
- JSON export (formatted scan data)
- CSV export (bulk scan data)
- Create `backend/src/reports/report.controller.js` for export endpoints
- Create `backend/src/reports/report.routes.js` for report routes
- Add export endpoints: `GET /api/scans/:id/export/pdf`, `GET /api/scans/export/csv`, `GET /api/scans/:id/export/json`

**Frontend Changes:**

- Update `components/evidence-vault.tsx` with export buttons (PDF, JSON, CSV)
- Update scan detail view with export options
- Add `components/reports/export-menu.tsx` (new component)
- Add bulk export functionality for selected scans

**Files to Create/Modify:**

- `backend/src/reports/report.service.js` (new)
- `backend/src/reports/report.controller.js` (new)
- `backend/src/reports/report.routes.js` (new)
- `backend/src/app.js` (modify - register report routes)
- `components/evidence-vault.tsx` (modify - add export UI)
- `components/reports/export-menu.tsx` (new)
- `lib/api.ts` (modify - add export methods)

### Task 4: Batch Processing

**Backend Changes:**

- Install queue library: `npm install bull` and `npm install redis` (for queue backend)
- Create `backend/src/utils/queue.js` for job queue management
- Update `backend/src/scans/scan.service.js` to support batch processing:
- `processBatchScan` function for multiple files
- Queue job creation for parallel processing
- Batch status tracking
- Update `backend/src/scans/scan.controller.js` to handle batch uploads:
- `POST /api/scans/batch` endpoint
- Accept multiple files or zip archive
- Create `backend/src/scans/batch.model.js` for batch tracking (optional)

**Frontend Changes:**

- Update `components/media-scanner.tsx` to support:
- Multiple file selection/drag-and-drop
- File list display with individual status
- Batch progress indicator
- Zip file upload support
- Add batch processing UI components

**Files to Create/Modify:**

- `backend/src/utils/queue.js` (new)
- `backend/src/scans/scan.service.js` (modify - batch processing)
- `backend/src/scans/scan.controller.js` (modify - batch endpoint)
- `backend/src/scans/batch.model.js` (new - optional)
- `components/media-scanner.tsx` (modify - multi-file UI)
- `components/batch/batch-upload.tsx` (new)
- `lib/api.ts` (modify - add batch upload method)

### Task 5: ML API Integration Infrastructure

**Backend Changes:**

- Create `backend/src/ml/ml-client.js` for ML service HTTP client:
- Connection to Python ML service
- Request/response handling
- Error handling and retries
- Timeout management
- Create `backend/src/config/ml.config.js` for ML service configuration
- Update `backend/src/agents/detection.agent.js` to:
- Check if ML service is available
- Call ML API for real detection
- Fallback to mock logic if ML service unavailable
- Support model versioning
- Add ML service health check endpoint: `GET /api/ml/health`

**ML Service (Python) - Optional:**

- Create `ml-service/app.py` (Flask/FastAPI skeleton)
- Create `ml-service/models/` directory structure
- Create `ml-service/README.md` with integration instructions

**Frontend Changes (Admin Panel):**

- Add ML service status to admin dashboard
- Add ML configuration page (model version selection, confidence thresholds)
- Create `app/admin/ml/page.tsx` (new)
- Create `components/admin/ml-config.tsx` (new)

**Files to Create/Modify:**

- `backend/src/ml/ml-client.js` (new)
- `backend/src/config/ml.config.js` (new)
- `backend/src/agents/detection.agent.js` (modify - ML integration)
- `backend/src/admin/admin.controller.js` (modify - add ML health check)
- `ml-service/app.py` (new - skeleton, optional)
- `app/admin/ml/page.tsx` (new)
- `components/admin/ml-config.tsx` (new)
- `.env.example` (modify - add ML service URL config)

## Implementation Order

1. **WebSocket Integration** (Foundational - enables real-time features)
2. **Advanced Search & Filtering** (High user value, improves UX immediately)
3. **Export Functionality** (Straightforward, high user value)
4. **Batch Processing** (Builds on existing scan infrastructure)
5. **ML API Integration** (Infrastructure for future ML model integration)

## Dependencies

- Socket.IO for WebSocket support
- Redis for queue backend (Bull) and optional caching
- PDF generation library (pdfkit or puppeteer)
- Bull for job queue management
- ML Service (optional Python Flask/FastAPI service)

## Testing Strategy

- Unit tests for new services (search, export, batch processing)
- Integration tests for WebSocket events
- E2E tests for batch upload flow
- Manual testing for export formats
- Mock ML service for testing ML integration

## Success Criteria

- Real-time scan updates work without polling
- Users can search and filter scans effectively
- All export formats (PDF, JSON, CSV) generate correctly
- Batch uploads process multiple files successfully
- ML API client can connect to external ML service (even if service is not deployed yet)