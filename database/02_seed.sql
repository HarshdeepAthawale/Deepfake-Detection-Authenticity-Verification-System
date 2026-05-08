-- =============================================================================
-- SENTINEL: Deepfake Detection & Authenticity Verification System
-- UCS310 - Database Management System
-- File: 02_seed.sql  |  DML - Sample Data Population
-- =============================================================================

USE sentinel_db;

-- =============================================================================
-- VerdictTypes — 3 rows, covers full 0–100 risk range
-- =============================================================================
INSERT INTO VerdictTypes (VerdictName, RiskMin, RiskMax) VALUES
    ('AUTHENTIC',  0.00, 39.99),
    ('SUSPICIOUS', 40.00, 74.99),
    ('DEEPFAKE',   75.00, 100.00);

-- =============================================================================
-- Users — 5 users (1 admin, 2 operatives, 2 analysts)
-- PasswordHash values are bcrypt hashes of 'Password@123'
-- =============================================================================
INSERT INTO Users (Name, Email, Role, PasswordHash, OperativeID) VALUES
    ('Harshdeep Athawale', 'harshdeep@sentinel.io',  'admin',     '$2b$12$samplehash_admin_001',     'OPR-ADMIN-001'),
    ('Aakriti Chauhan',    'aakriti@sentinel.io',    'operative', '$2b$12$samplehash_operative_002', 'OPR-FIELD-002'),
    ('Sehaj Dhillon',      'sehaj@sentinel.io',      'operative', '$2b$12$samplehash_operative_003', 'OPR-FIELD-003'),
    ('Priya Sharma',       'priya@sentinel.io',      'analyst',   '$2b$12$samplehash_analyst_004',   'OPR-ANLYT-004'),
    ('Rahul Verma',        'rahul@sentinel.io',      'analyst',   '$2b$12$samplehash_analyst_005',   'OPR-ANLYT-005');

-- =============================================================================
-- Scans — 12 scan records with varied statuses and verdicts
-- Note: FileHash values are SHA-256 hex strings (64 chars)
-- =============================================================================
INSERT INTO Scans (UserID, FileHash, MediaType, Status, RiskScore, Confidence, VerdictID, ModelVersion) VALUES
    -- Completed scans with verdicts
    (2, 'a3f1c2d4e5b6789012345678901234567890abcdef1234567890abcdef123456', 'VIDEO', 'COMPLETED', 87.50, 92.10, 3, 'v4'),
    (2, 'b4e2d3c5f6a7890123456789012345678901bcdef2345678901bcdef234567ab', 'IMAGE', 'COMPLETED', 23.00, 88.50, 1, 'v4'),
    (3, 'c5f3e4d6a7b8901234567890123456789012cdef3456789012cdef345678abcd', 'AUDIO', 'COMPLETED', 61.75, 79.30, 2, 'v4'),
    (3, 'd6a4f5e7b8c9012345678901234567890123def4567890123def456789abcdef', 'VIDEO', 'COMPLETED', 91.20, 95.00, 3, 'v4'),
    (2, 'e7b5a6f8c9d0123456789012345678901234ef5678901234ef567890abcdef01', 'IMAGE', 'COMPLETED', 15.40, 76.80, 1, 'v4'),
    (3, 'f8c6b7a9d0e1234567890123456789012345f0678901235f067890abcdef0123', 'VIDEO', 'COMPLETED', 78.90, 89.60, 3, 'v4'),
    (2, '09d7c8b0e1f2345678901234567890123456012789012360127890abcdef0124', 'AUDIO', 'COMPLETED', 44.30, 82.10, 2, 'v4'),
    (3, '10e8d9c1f2a3456789012345678901234567123890123471238901bcdef01245', 'IMAGE', 'COMPLETED', 5.20,  95.50, 1, 'v4'),
    -- In-progress scans
    (2, '21f9e0d2a3b4567890123456789012345678234901234582349012cdef012456', 'VIDEO', 'PROCESSING', NULL, NULL, NULL, 'v4'),
    (3, '32a0f1e3b4c5678901234567890123456789345012345693450123def0123456', 'IMAGE', 'PENDING',    NULL, NULL, NULL, 'v4'),
    -- Failed scan
    (4, '43b1a2f4c5d6789012345678901234567890456123456704561234ef01234567', 'VIDEO', 'FAILED',     NULL, NULL, NULL, 'v4'),
    -- Analyst submitted scan
    (4, '54c2b3a5d6e7890123456789012345678901567234567815672345f012345678', 'AUDIO', 'COMPLETED', 55.00, 70.00, 2, 'v4');

-- =============================================================================
-- AuditLogs — 16 audit entries covering login, upload, and verdict events
-- =============================================================================
INSERT INTO AuditLogs (UserID, Action, Resource) VALUES
    (1, 'USER_LOGIN',       'auth'),
    (2, 'USER_LOGIN',       'auth'),
    (2, 'SCAN_SUBMITTED',   'scans'),
    (2, 'SCAN_SUBMITTED',   'scans'),
    (3, 'USER_LOGIN',       'auth'),
    (3, 'SCAN_SUBMITTED',   'scans'),
    (3, 'SCAN_SUBMITTED',   'scans'),
    (2, 'EVIDENCE_STORED',  'evidence_vault'),
    (3, 'EVIDENCE_STORED',  'evidence_vault'),
    (4, 'USER_LOGIN',       'auth'),
    (4, 'REPORT_GENERATED', 'reports'),
    (5, 'USER_LOGIN',       'auth'),
    (5, 'REPORT_GENERATED', 'reports'),
    (1, 'USER_CREATED',     'users'),
    (1, 'SYSTEM_CONFIG',    'system'),
    (2, 'SCAN_EXPORTED',    'scans');

-- =============================================================================
-- Notifications — 9 notifications for scan results and alerts
-- =============================================================================
INSERT INTO Notifications (UserID, Type, Message, IsRead) VALUES
    (2, 'scan_complete',    'Your scan (ScanID: 1) has been completed. Verdict: DEEPFAKE.',         TRUE),
    (2, 'deepfake_detected','ALERT: Deepfake detected in your submission with 87.5% risk score.',   TRUE),
    (2, 'scan_complete',    'Your scan (ScanID: 2) is complete. Verdict: AUTHENTIC.',               FALSE),
    (3, 'scan_complete',    'Scan (ScanID: 3) complete. Verdict: SUSPICIOUS — review recommended.', TRUE),
    (3, 'deepfake_detected','ALERT: Deepfake detected in scan ScanID: 4 with 91.2% risk score.',   FALSE),
    (3, 'scan_complete',    'Scan (ScanID: 6) complete. Verdict: DEEPFAKE.',                        FALSE),
    (4, 'scan_failed',      'Scan (ScanID: 11) failed due to unsupported codec. Please retry.',     FALSE),
    (5, 'system',           'System maintenance scheduled for 02:00 UTC. Expect 15 min downtime.',  TRUE),
    (2, 'scan_complete',    'Scan (ScanID: 9) is now being processed.',                             FALSE);

-- =============================================================================
-- EvidenceVault — 6 evidence entries for completed DEEPFAKE/SUSPICIOUS scans
-- =============================================================================
INSERT INTO EvidenceVault (ScanID, FilePath, SHA256Hash) VALUES
    (1, '/vault/evidence/scan_001_deepfake_video.mp4',   'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2'),
    (3, '/vault/evidence/scan_003_suspicious_audio.mp3', 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3'),
    (4, '/vault/evidence/scan_004_deepfake_video2.mp4',  'c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4'),
    (6, '/vault/evidence/scan_006_deepfake_video3.mp4',  'd4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5'),
    (7, '/vault/evidence/scan_007_suspicious_audio.mp3', 'e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6'),
    (12,'/vault/evidence/scan_012_suspicious_audio2.mp3','f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1');
