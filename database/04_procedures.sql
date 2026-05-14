-- =============================================================================
-- SENTINEL: Deepfake Detection & Authenticity Verification System
-- UCS310 - Database Management System
-- File: 04_procedures.sql  |  PL/SQL - Stored Procedures
-- =============================================================================

USE sentinel_db;

DELIMITER $$

-- =============================================================================
-- PROCEDURE 1: sp_submit_scan
-- Purpose : Validates user, checks hash uniqueness, inserts scan record,
--           auto-creates audit log entry — all within a single transaction.
-- Params  : p_user_id      INT      — ID of submitting user
--           p_file_hash    VARCHAR  — SHA-256 hash of uploaded file
--           p_media_type   VARCHAR  — VIDEO / AUDIO / IMAGE / UNKNOWN
--           p_model_version VARCHAR — ML model version tag (e.g., 'v4')
--           OUT p_scan_id  INT      — Returns the new ScanID on success
-- =============================================================================
DROP PROCEDURE IF EXISTS sp_submit_scan $$

CREATE PROCEDURE sp_submit_scan(
    IN  p_user_id      INT,
    IN  p_file_hash    VARCHAR(64),
    IN  p_media_type   VARCHAR(10),
    IN  p_model_version VARCHAR(20),
    OUT p_scan_id      INT
)
BEGIN
    DECLARE v_user_exists  INT DEFAULT 0;
    DECLARE v_hash_exists  INT DEFAULT 0;
    DECLARE v_new_scan_id  INT DEFAULT 0;

    -- Exception handler: rolls back and re-raises on any SQL error
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Step 1: Validate user exists
    SELECT COUNT(*) INTO v_user_exists
    FROM Users WHERE UserID = p_user_id;

    IF v_user_exists = 0 THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'ERROR: User does not exist. Scan submission aborted.';
    END IF;

    -- Step 2: Check for duplicate file hash
    SELECT COUNT(*) INTO v_hash_exists
    FROM Scans WHERE FileHash = p_file_hash;

    IF v_hash_exists > 0 THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45001'
            SET MESSAGE_TEXT = 'ERROR: Duplicate file hash detected. This file has already been scanned.';
    END IF;

    -- Step 3: Insert scan record
    SAVEPOINT sp_scan_inserted;
    INSERT INTO Scans (UserID, FileHash, MediaType, Status, ModelVersion)
    VALUES (p_user_id, p_file_hash, p_media_type, 'PENDING', p_model_version);

    SET v_new_scan_id = LAST_INSERT_ID();
    SET p_scan_id = v_new_scan_id;

    -- Step 4: Auto-create audit log entry
    SAVEPOINT sp_audit_inserted;
    INSERT INTO AuditLogs (UserID, Action, Resource)
    VALUES (p_user_id, 'SCAN_SUBMITTED', CONCAT('scans/', v_new_scan_id));

    COMMIT;

    SELECT CONCAT('Scan submitted successfully. ScanID: ', v_new_scan_id) AS Result;
END $$


-- =============================================================================
-- PROCEDURE 2: sp_store_evidence
-- Purpose : Validates scan is COMPLETED, stores evidence in EvidenceVault,
--           logs the action — with SAVEPOINT for partial rollback safety.
-- Params  : p_scan_id    INT      — ScanID to attach evidence to
--           p_file_path  VARCHAR  — Storage path of evidence file
--           p_sha256     VARCHAR  — SHA-256 hash of evidence file
-- =============================================================================
DROP PROCEDURE IF EXISTS sp_store_evidence $$

CREATE PROCEDURE sp_store_evidence(
    IN p_scan_id   INT,
    IN p_file_path VARCHAR(500),
    IN p_sha256    VARCHAR(64)
)
BEGIN
    DECLARE v_scan_status  VARCHAR(15);
    DECLARE v_scan_userid  INT;
    DECLARE v_hash_exists  INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Step 1: Validate scan exists and is COMPLETED
    SELECT Status, UserID INTO v_scan_status, v_scan_userid
    FROM Scans WHERE ScanID = p_scan_id;

    IF v_scan_status IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45002'
            SET MESSAGE_TEXT = 'ERROR: Scan not found.';
    END IF;

    IF v_scan_status != 'COMPLETED' THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45003'
            SET MESSAGE_TEXT = 'ERROR: Evidence can only be stored for COMPLETED scans.';
    END IF;

    -- Step 2: Prevent duplicate evidence hash
    SELECT COUNT(*) INTO v_hash_exists
    FROM EvidenceVault WHERE SHA256Hash = p_sha256;

    IF v_hash_exists > 0 THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45004'
            SET MESSAGE_TEXT = 'ERROR: Duplicate SHA-256 hash. Evidence already stored.';
    END IF;

    -- Step 3: Insert into EvidenceVault
    SAVEPOINT sp_evidence_inserted;
    INSERT INTO EvidenceVault (ScanID, FilePath, SHA256Hash)
    VALUES (p_scan_id, p_file_path, p_sha256);

    -- Step 4: Audit log entry
    SAVEPOINT sp_audit_inserted;
    INSERT INTO AuditLogs (UserID, Action, Resource)
    VALUES (v_scan_userid, 'EVIDENCE_STORED', CONCAT('evidence_vault/scan/', p_scan_id));

    COMMIT;

    SELECT CONCAT('Evidence stored successfully for ScanID: ', p_scan_id) AS Result;
END $$


-- =============================================================================
-- PROCEDURE 3: sp_update_scan_verdict
-- Purpose : Resolves VerdictID from VerdictTypes based on risk score,
--           updates Scan record, notifies the scan owner.
-- Params  : p_scan_id      INT     — ScanID to update
--           p_risk_score   DECIMAL — Calculated risk score (0–100)
--           p_confidence   DECIMAL — Model confidence (0–100)
--           p_model_version VARCHAR — ML model version used
-- =============================================================================
DROP PROCEDURE IF EXISTS sp_update_scan_verdict $$

CREATE PROCEDURE sp_update_scan_verdict(
    IN p_scan_id       INT,
    IN p_risk_score    DECIMAL(5,2),
    IN p_confidence    DECIMAL(5,2),
    IN p_model_version VARCHAR(20)
)
BEGIN
    DECLARE v_verdict_id   INT;
    DECLARE v_verdict_name VARCHAR(20);
    DECLARE v_user_id      INT;
    DECLARE v_notif_msg    VARCHAR(300);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Step 1: Resolve VerdictID from VerdictTypes by risk score range
    SELECT VerdictID, VerdictName INTO v_verdict_id, v_verdict_name
    FROM VerdictTypes
    WHERE p_risk_score BETWEEN RiskMin AND RiskMax
    LIMIT 1;

    IF v_verdict_id IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45005'
            SET MESSAGE_TEXT = 'ERROR: No matching verdict type for given risk score.';
    END IF;

    -- Step 2: Get scan owner
    SELECT UserID INTO v_user_id
    FROM Scans WHERE ScanID = p_scan_id;

    -- Step 3: Update the Scan record
    SAVEPOINT sp_scan_updated;
    UPDATE Scans
    SET Status       = 'COMPLETED',
        RiskScore    = p_risk_score,
        Confidence   = p_confidence,
        VerdictID    = v_verdict_id,
        ModelVersion = p_model_version
    WHERE ScanID = p_scan_id;

    -- Step 4: Create notification for scan owner
    SAVEPOINT sp_notification_sent;
    SET v_notif_msg = CONCAT(
        'Scan #', p_scan_id, ' complete. Verdict: ', v_verdict_name,
        ' | Risk: ', p_risk_score, '% | Confidence: ', p_confidence, '%'
    );

    INSERT INTO Notifications (UserID, Type, Message)
    VALUES (
        v_user_id,
        CASE WHEN v_verdict_name = 'DEEPFAKE' THEN 'deepfake_detected' ELSE 'scan_complete' END,
        v_notif_msg
    );

    -- Step 5: Audit log
    INSERT INTO AuditLogs (UserID, Action, Resource)
    VALUES (v_user_id, 'VERDICT_ASSIGNED', CONCAT('scans/', p_scan_id));

    COMMIT;

    SELECT v_verdict_name AS Verdict, p_risk_score AS RiskScore, p_confidence AS Confidence;
END $$


-- =============================================================================
-- PROCEDURE 4: sp_generate_user_report
-- Purpose : Prints a scan summary report for a given user using a cursor.
--           (Cursor logic is in 07_cursors.sql; this is the report entry point)
-- =============================================================================
DROP PROCEDURE IF EXISTS sp_generate_user_report $$

CREATE PROCEDURE sp_generate_user_report(
    IN p_user_id INT
)
BEGIN
    DECLARE v_user_name   VARCHAR(100);
    DECLARE v_total       INT DEFAULT 0;
    DECLARE v_deepfake    INT DEFAULT 0;
    DECLARE v_suspicious  INT DEFAULT 0;
    DECLARE v_authentic   INT DEFAULT 0;
    DECLARE v_avg_risk    DECIMAL(5,2);

    -- Validate user
    SELECT Name INTO v_user_name FROM Users WHERE UserID = p_user_id;

    IF v_user_name IS NULL THEN
        SIGNAL SQLSTATE '45006'
            SET MESSAGE_TEXT = 'ERROR: User not found for report generation.';
    END IF;

    -- Aggregate statistics
    SELECT
        COUNT(*),
        COUNT(CASE WHEN vt.VerdictName = 'DEEPFAKE'   THEN 1 END),
        COUNT(CASE WHEN vt.VerdictName = 'SUSPICIOUS' THEN 1 END),
        COUNT(CASE WHEN vt.VerdictName = 'AUTHENTIC'  THEN 1 END),
        ROUND(AVG(s.RiskScore), 2)
    INTO v_total, v_deepfake, v_suspicious, v_authentic, v_avg_risk
    FROM Scans s
    LEFT JOIN VerdictTypes vt ON s.VerdictID = vt.VerdictID
    WHERE s.UserID = p_user_id AND s.Status = 'COMPLETED';

    -- Return report
    SELECT
        v_user_name    AS UserName,
        v_total        AS TotalCompletedScans,
        v_deepfake     AS DeepfakeCount,
        v_suspicious   AS SuspiciousCount,
        v_authentic    AS AuthenticCount,
        v_avg_risk     AS AverageRiskScore;

    -- Audit the report generation
    INSERT INTO AuditLogs (UserID, Action, Resource)
    VALUES (p_user_id, 'REPORT_GENERATED', CONCAT('reports/user/', p_user_id));
END $$

DELIMITER ;

-- =============================================================================
-- Test procedure calls
-- =============================================================================
-- CALL sp_submit_scan(2, 'newhash_aabbccddeeff00112233445566778899aabbccddeeff0011223344', 'VIDEO', 'v4', @new_id);
-- SELECT @new_id;

-- CALL sp_update_scan_verdict(1, 87.50, 92.10, 'v4');

-- CALL sp_store_evidence(1, '/vault/evidence/scan_001.mp4', 'newevidence_sha256_112233445566778899aabbccddeeff00112233445566778899aa');

-- CALL sp_generate_user_report(2);
