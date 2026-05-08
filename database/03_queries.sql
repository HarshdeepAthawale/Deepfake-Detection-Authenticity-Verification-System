-- =============================================================================
-- SENTINEL: Deepfake Detection & Authenticity Verification System
-- UCS310 - Database Management System
-- File: 03_queries.sql  |  DQL - SELECT Queries, JOINs, Aggregates, Views
-- =============================================================================

USE sentinel_db;

-- =============================================================================
-- SECTION A: INNER JOINs
-- =============================================================================

-- Q1: All completed scans with user name and verdict classification
SELECT
    s.ScanID,
    u.Name          AS SubmittedBy,
    u.OperativeID,
    s.MediaType,
    s.RiskScore,
    s.Confidence,
    vt.VerdictName  AS Verdict,
    s.ModelVersion,
    s.CreatedAt
FROM Scans s
INNER JOIN Users u          ON s.UserID    = u.UserID
INNER JOIN VerdictTypes vt  ON s.VerdictID = vt.VerdictID
WHERE s.Status = 'COMPLETED'
ORDER BY s.RiskScore DESC;

-- Q2: Evidence vault entries with scan details and submitting user
SELECT
    ev.EvidenceID,
    ev.FilePath,
    ev.SHA256Hash,
    s.ScanID,
    s.MediaType,
    s.RiskScore,
    vt.VerdictName AS Verdict,
    u.Name         AS SubmittedBy,
    ev.CreatedAt   AS StoredAt
FROM EvidenceVault ev
INNER JOIN Scans s         ON ev.ScanID   = s.ScanID
INNER JOIN Users u         ON s.UserID    = u.UserID
INNER JOIN VerdictTypes vt ON s.VerdictID = vt.VerdictID
ORDER BY ev.CreatedAt DESC;

-- Q3: Audit log with user name and role for all login events
SELECT
    al.AuditID,
    u.Name        AS UserName,
    u.Role,
    al.Action,
    al.Resource,
    al.Timestamp
FROM AuditLogs al
INNER JOIN Users u ON al.UserID = u.UserID
WHERE al.Action = 'USER_LOGIN'
ORDER BY al.Timestamp DESC;

-- =============================================================================
-- SECTION B: LEFT JOINs
-- =============================================================================

-- Q4: All users and their total scan count (include users with 0 scans)
SELECT
    u.UserID,
    u.Name,
    u.Role,
    u.OperativeID,
    COUNT(s.ScanID) AS TotalScans
FROM Users u
LEFT JOIN Scans s ON u.UserID = s.UserID
GROUP BY u.UserID, u.Name, u.Role, u.OperativeID
ORDER BY TotalScans DESC;

-- Q5: Users who have NEVER submitted a scan
SELECT
    u.UserID,
    u.Name,
    u.Email,
    u.Role
FROM Users u
LEFT JOIN Scans s ON u.UserID = s.UserID
WHERE s.ScanID IS NULL;

-- Q6: Scans with no evidence stored yet (potential oversight)
SELECT
    s.ScanID,
    u.Name    AS SubmittedBy,
    vt.VerdictName AS Verdict,
    s.RiskScore,
    s.CreatedAt
FROM Scans s
LEFT JOIN EvidenceVault ev  ON s.ScanID    = ev.ScanID
INNER JOIN Users u          ON s.UserID    = u.UserID
LEFT JOIN VerdictTypes vt   ON s.VerdictID = vt.VerdictID
WHERE s.Status = 'COMPLETED'
  AND ev.EvidenceID IS NULL;

-- =============================================================================
-- SECTION C: GROUP BY + HAVING + Aggregates
-- =============================================================================

-- Q7: Scan count per user grouped by role
SELECT
    u.Role,
    u.Name,
    COUNT(s.ScanID)       AS TotalScans,
    COUNT(CASE WHEN s.Status = 'COMPLETED' THEN 1 END) AS CompletedScans,
    COUNT(CASE WHEN s.Status = 'FAILED'    THEN 1 END) AS FailedScans
FROM Users u
LEFT JOIN Scans s ON u.UserID = s.UserID
GROUP BY u.UserID, u.Role, u.Name
ORDER BY TotalScans DESC;

-- Q8: Users with more than 2 completed scans (HAVING clause)
SELECT
    u.UserID,
    u.Name,
    u.OperativeID,
    COUNT(s.ScanID) AS CompletedScans
FROM Users u
INNER JOIN Scans s ON u.UserID = s.UserID
WHERE s.Status = 'COMPLETED'
GROUP BY u.UserID, u.Name, u.OperativeID
HAVING COUNT(s.ScanID) > 2
ORDER BY CompletedScans DESC;

-- Q9: Average, max, min risk score per verdict type
SELECT
    vt.VerdictName,
    COUNT(s.ScanID)         AS TotalScans,
    ROUND(AVG(s.RiskScore), 2) AS AvgRiskScore,
    MAX(s.RiskScore)           AS MaxRiskScore,
    MIN(s.RiskScore)           AS MinRiskScore,
    ROUND(AVG(s.Confidence), 2) AS AvgConfidence
FROM VerdictTypes vt
INNER JOIN Scans s ON vt.VerdictID = s.VerdictID
WHERE s.Status = 'COMPLETED'
GROUP BY vt.VerdictID, vt.VerdictName
ORDER BY vt.RiskMin DESC;

-- Q10: Verdict distribution as percentage (analytics dashboard)
SELECT
    vt.VerdictName,
    COUNT(s.ScanID)                                                AS Count,
    ROUND(COUNT(s.ScanID) * 100.0 / SUM(COUNT(s.ScanID)) OVER(), 1) AS Percentage
FROM Scans s
INNER JOIN VerdictTypes vt ON s.VerdictID = vt.VerdictID
WHERE s.Status = 'COMPLETED'
GROUP BY vt.VerdictID, vt.VerdictName;

-- Q11: Users with at least one DEEPFAKE result (HAVING with JOIN)
SELECT
    u.Name,
    u.OperativeID,
    u.Role,
    COUNT(s.ScanID) AS DeepfakeCount
FROM Users u
INNER JOIN Scans s         ON u.UserID    = s.UserID
INNER JOIN VerdictTypes vt ON s.VerdictID = vt.VerdictID
WHERE vt.VerdictName = 'DEEPFAKE'
  AND s.Status = 'COMPLETED'
GROUP BY u.UserID, u.Name, u.OperativeID, u.Role
HAVING COUNT(s.ScanID) >= 1
ORDER BY DeepfakeCount DESC;

-- =============================================================================
-- SECTION D: Subqueries
-- =============================================================================

-- Q12: Scans with above-average risk score (correlated subquery)
SELECT
    s.ScanID,
    u.Name       AS SubmittedBy,
    s.RiskScore,
    vt.VerdictName AS Verdict
FROM Scans s
INNER JOIN Users u         ON s.UserID    = u.UserID
INNER JOIN VerdictTypes vt ON s.VerdictID = vt.VerdictID
WHERE s.RiskScore > (
    SELECT AVG(RiskScore)
    FROM Scans
    WHERE Status = 'COMPLETED' AND RiskScore IS NOT NULL
)
ORDER BY s.RiskScore DESC;

-- Q13: Users who have submitted at least one scan (WHERE EXISTS)
SELECT u.UserID, u.Name, u.Role
FROM Users u
WHERE EXISTS (
    SELECT 1
    FROM Scans s
    WHERE s.UserID = u.UserID
);

-- Q14: Scans submitted by operative-role users only (WHERE IN subquery)
SELECT
    s.ScanID,
    s.MediaType,
    s.Status,
    s.RiskScore,
    s.CreatedAt
FROM Scans s
WHERE s.UserID IN (
    SELECT UserID FROM Users WHERE Role = 'operative'
)
ORDER BY s.CreatedAt DESC;

-- Q15: Latest scan per user (correlated subquery for max)
SELECT
    u.Name,
    u.OperativeID,
    s.ScanID,
    s.Status,
    s.CreatedAt AS LastScanDate
FROM Users u
INNER JOIN Scans s ON s.ScanID = (
    SELECT ScanID
    FROM Scans s2
    WHERE s2.UserID = u.UserID
    ORDER BY s2.CreatedAt DESC
    LIMIT 1
);

-- =============================================================================
-- SECTION E: Analytical Views (for dashboard)
-- =============================================================================

-- View 1: Full scan summary joining all 3 main tables
CREATE OR REPLACE VIEW v_scan_summary AS
SELECT
    s.ScanID,
    u.Name          AS UserName,
    u.OperativeID,
    u.Role,
    s.MediaType,
    s.FileHash,
    s.Status,
    s.RiskScore,
    s.Confidence,
    vt.VerdictName  AS Verdict,
    s.ModelVersion,
    s.CreatedAt
FROM Scans s
INNER JOIN Users u          ON s.UserID    = u.UserID
LEFT  JOIN VerdictTypes vt  ON s.VerdictID = vt.VerdictID;

-- View 2: Per-user risk statistics for the analytics dashboard
CREATE OR REPLACE VIEW v_user_risk_stats AS
SELECT
    u.UserID,
    u.Name,
    u.OperativeID,
    u.Role,
    COUNT(s.ScanID)                                                     AS TotalScans,
    COUNT(CASE WHEN s.Status = 'COMPLETED' THEN 1 END)                  AS CompletedScans,
    COUNT(CASE WHEN vt.VerdictName = 'DEEPFAKE'   THEN 1 END)           AS DeepfakeCount,
    COUNT(CASE WHEN vt.VerdictName = 'SUSPICIOUS' THEN 1 END)           AS SuspiciousCount,
    COUNT(CASE WHEN vt.VerdictName = 'AUTHENTIC'  THEN 1 END)           AS AuthenticCount,
    ROUND(AVG(CASE WHEN s.Status = 'COMPLETED' THEN s.RiskScore END), 2) AS AvgRiskScore,
    MAX(CASE WHEN s.Status = 'COMPLETED' THEN s.RiskScore END)           AS MaxRiskScore
FROM Users u
LEFT JOIN Scans s         ON u.UserID    = s.UserID
LEFT JOIN VerdictTypes vt ON s.VerdictID = vt.VerdictID
GROUP BY u.UserID, u.Name, u.OperativeID, u.Role;

-- View 3: Complete audit trail with user context
CREATE OR REPLACE VIEW v_audit_trail AS
SELECT
    al.AuditID,
    u.Name        AS UserName,
    u.Role,
    u.OperativeID,
    al.Action,
    al.Resource,
    al.Timestamp
FROM AuditLogs al
INNER JOIN Users u ON al.UserID = u.UserID
ORDER BY al.Timestamp DESC;

-- View 4: Evidence vault with full context
CREATE OR REPLACE VIEW v_evidence_vault AS
SELECT
    ev.EvidenceID,
    u.Name          AS SubmittedBy,
    u.OperativeID,
    s.ScanID,
    s.MediaType,
    vt.VerdictName  AS Verdict,
    s.RiskScore,
    ev.FilePath,
    ev.SHA256Hash,
    ev.CreatedAt    AS StoredAt
FROM EvidenceVault ev
INNER JOIN Scans s         ON ev.ScanID   = s.ScanID
INNER JOIN Users u         ON s.UserID    = u.UserID
INNER JOIN VerdictTypes vt ON s.VerdictID = vt.VerdictID;

-- View 5: Unread notification summary per user
CREATE OR REPLACE VIEW v_unread_notifications AS
SELECT
    u.Name,
    n.Type,
    n.Message,
    n.Timestamp
FROM Notifications n
INNER JOIN Users u ON n.UserID = u.UserID
WHERE n.IsRead = FALSE
ORDER BY n.Timestamp DESC;

-- Sample reads from views
SELECT * FROM v_scan_summary      ORDER BY CreatedAt DESC;
SELECT * FROM v_user_risk_stats   ORDER BY TotalScans DESC;
SELECT * FROM v_audit_trail       LIMIT 20;
SELECT * FROM v_evidence_vault;
SELECT * FROM v_unread_notifications;
