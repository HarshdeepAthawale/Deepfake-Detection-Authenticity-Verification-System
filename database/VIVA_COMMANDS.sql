-- ================================================
-- SENTINEL VIVA COMMANDS  |  UCS310  |  Ms. Chinu Dhir
-- Connect: sudo mariadb -u root sentinel_db
-- ================================================


-- 1. SHOW TABLES
SHOW TABLES;


-- 2. DESCRIBE TABLES
DESC Users;
DESC Scans;
DESC VerdictTypes;


-- 3. VIEW ALL DATA
SELECT * FROM Users;
SELECT * FROM VerdictTypes;
SELECT * FROM Scans;
SELECT * FROM AuditLogs;
SELECT * FROM Notifications;
SELECT * FROM EvidenceVault;


-- 4. INNER JOIN - Scans with User + Verdict
SELECT u.Name, s.MediaType, s.RiskScore, vt.VerdictName
FROM Scans s
INNER JOIN Users u ON s.UserID = u.UserID
INNER JOIN VerdictTypes vt ON s.VerdictID = vt.VerdictID
WHERE s.Status = 'COMPLETED';


-- 5. LEFT JOIN - All users with scan count
SELECT u.Name, u.Role, COUNT(s.ScanID) AS TotalScans
FROM Users u
LEFT JOIN Scans s ON u.UserID = s.UserID
GROUP BY u.UserID, u.Name, u.Role;


-- 6. GROUP BY + HAVING - Users with more than 2 scans
SELECT u.Name, COUNT(s.ScanID) AS TotalScans
FROM Users u
INNER JOIN Scans s ON u.UserID = s.UserID
GROUP BY u.UserID, u.Name
HAVING COUNT(s.ScanID) > 2;


-- 7. AGGREGATE - Risk score stats per verdict
SELECT vt.VerdictName,
       COUNT(s.ScanID) AS Total,
       ROUND(AVG(s.RiskScore), 2) AS AvgRisk,
       MAX(s.RiskScore) AS MaxRisk,
       MIN(s.RiskScore) AS MinRisk
FROM Scans s
INNER JOIN VerdictTypes vt ON s.VerdictID = vt.VerdictID
WHERE s.Status = 'COMPLETED'
GROUP BY vt.VerdictID, vt.VerdictName;


-- 8. SUBQUERY - WHERE IN
SELECT Name FROM Users
WHERE UserID IN (SELECT UserID FROM Scans WHERE Status = 'COMPLETED');


-- 9. SUBQUERY - EXISTS
SELECT u.Name FROM Users u
WHERE EXISTS (
    SELECT 1 FROM Scans s
    INNER JOIN VerdictTypes vt ON s.VerdictID = vt.VerdictID
    WHERE s.UserID = u.UserID AND vt.VerdictName = 'DEEPFAKE'
);


-- 10. TRIGGER DEMO - Try inserting duplicate hash (will throw error on purpose)
INSERT INTO Scans (UserID, FileHash, MediaType, Status, ModelVersion)
VALUES (2, 'a3f1c2d4e5b6789012345678901234567890abcdef1234567890abcdef123456', 'VIDEO', 'PENDING', 'v4');
-- Expected output: TRIGGER ERROR: Duplicate file hash. This media has already been submitted.


-- 11. SHOW TRIGGERS
SHOW TRIGGERS;


-- 12. STORED PROCEDURE - Submit new scan
CALL sp_submit_scan(2, 'brandnewhash1234567890abcdef1234567890abcdef1234567890abcdef12', 'VIDEO', 'v4', @id);
SELECT @id;


-- 13. STORED PROCEDURE - Generate user report
CALL sp_generate_user_report(2);


-- 14. STORED PROCEDURE - Update verdict
CALL sp_update_scan_verdict(10, 65.00, 88.00, 'v4');


-- 15. STORED PROCEDURE - Store evidence
CALL sp_store_evidence(10, '/vault/evidence/scan_010_new.mp4', 'newevidence123456789abcdef1234567890abcdef1234567890abcdef123456');


-- 16. FUNCTIONS
SELECT fn_get_verdict_label(87.5);
SELECT fn_get_verdict_label(55.0);
SELECT fn_get_verdict_label(20.0);
SELECT fn_validate_upload('totallybrandhash1234567890abcdef1234567890abcdef1234567890ab12', 2);
SELECT fn_user_threat_level(2);
SELECT fn_count_user_scans(2, 'DEEPFAKE');
SELECT fn_count_user_scans(2, 'ALL');


-- 17. VIEWS
SELECT * FROM v_scan_summary;
SELECT * FROM v_user_risk_stats;
SELECT * FROM v_evidence_vault;
SELECT * FROM v_unread_notifications;
SELECT * FROM v_audit_trail LIMIT 10;


-- 18. CURSOR REPORT - Deepfake threat report
CALL proc_deepfake_threat_report();


-- 19. CURSOR REPORT - Scan summary by date
CALL proc_scan_summary_report('2024-01-01', '2026-12-31');


-- 20. CURSOR REPORT - Risk analytics per user
CALL proc_risk_analytics_report();


-- 21. TRANSACTION - ROLLBACK demo
START TRANSACTION;
INSERT INTO AuditLogs (UserID, Action, Resource) VALUES (1, 'TEST_ACTION', 'test');
ROLLBACK;
SELECT * FROM AuditLogs WHERE Action = 'TEST_ACTION';
-- Returns empty - ROLLBACK worked


-- 22. TRANSACTION - SAVEPOINT demo
START TRANSACTION;
SAVEPOINT sp1;
INSERT INTO Notifications (UserID, Type, Message) VALUES (1, 'system', 'Test notification');
ROLLBACK TO sp1;
COMMIT;
SELECT * FROM Notifications WHERE Message = 'Test notification';
-- Returns empty - rolled back to savepoint


-- 23. SHOW ALL PROCEDURES
SHOW PROCEDURE STATUS WHERE Db = 'sentinel_db';


-- 24. SHOW ALL FUNCTIONS
SHOW FUNCTION STATUS WHERE Db = 'sentinel_db';


-- 25. NORMALIZATION - Show VerdictTypes reference table
SELECT * FROM VerdictTypes;
-- Say: VerdictTypes is extracted to remove transitive dependency
-- RiskScore -> VerdictName was in Scans before, now it is a FK -> 3NF achieved
