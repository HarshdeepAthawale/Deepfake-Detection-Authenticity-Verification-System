-- =============================================================================
-- SENTINEL: Deepfake Detection & Authenticity Verification System
-- UCS310 - Database Management System
-- File: 06_triggers.sql  |  PL/SQL - Database Triggers
-- =============================================================================

USE sentinel_db;

DELIMITER $$

-- =============================================================================
-- TRIGGER 1: trg_prevent_duplicate_hash
-- Event   : BEFORE INSERT ON Scans
-- Purpose : Enforces duplicate file hash prevention at the database level.
--           Even if application-layer check is bypassed, the DB blocks it.
-- Result  : Raises SQLSTATE '45001' if FileHash already exists in Scans.
-- =============================================================================
DROP TRIGGER IF EXISTS trg_prevent_duplicate_hash $$

CREATE TRIGGER trg_prevent_duplicate_hash
BEFORE INSERT ON Scans
FOR EACH ROW
BEGIN
    DECLARE v_hash_count INT DEFAULT 0;

    SELECT COUNT(*) INTO v_hash_count
    FROM Scans
    WHERE FileHash = NEW.FileHash;

    IF v_hash_count > 0 THEN
        SIGNAL SQLSTATE '45001'
            SET MESSAGE_TEXT = 'TRIGGER ERROR: Duplicate file hash. This media has already been submitted.';
    END IF;
END $$


-- =============================================================================
-- TRIGGER 2: trg_auto_audit_on_scan_insert
-- Event   : AFTER INSERT ON Scans
-- Purpose : Automatically creates an AuditLog entry every time a scan is
--           submitted, ensuring no scan submission goes unlogged.
-- =============================================================================
DROP TRIGGER IF EXISTS trg_auto_audit_on_scan_insert $$

CREATE TRIGGER trg_auto_audit_on_scan_insert
AFTER INSERT ON Scans
FOR EACH ROW
BEGIN
    INSERT INTO AuditLogs (UserID, Action, Resource, Timestamp)
    VALUES (
        NEW.UserID,
        'SCAN_SUBMITTED',
        CONCAT('scans/', NEW.ScanID),
        NOW()
    );
END $$


-- =============================================================================
-- TRIGGER 3: trg_auto_notify_on_verdict
-- Event   : AFTER UPDATE ON Scans
-- Purpose : Fires when a scan's Status changes to 'COMPLETED'.
--           If verdict is DEEPFAKE, sends a 'deepfake_detected' alert.
--           For all completions, sends a 'scan_complete' notification.
-- =============================================================================
DROP TRIGGER IF EXISTS trg_auto_notify_on_verdict $$

CREATE TRIGGER trg_auto_notify_on_verdict
AFTER UPDATE ON Scans
FOR EACH ROW
BEGIN
    DECLARE v_verdict_name VARCHAR(20) DEFAULT NULL;
    DECLARE v_message      VARCHAR(300);
    DECLARE v_notif_type   VARCHAR(30);

    -- Only fire when status transitions to COMPLETED
    IF OLD.Status != 'COMPLETED' AND NEW.Status = 'COMPLETED' THEN

        -- Resolve verdict label
        IF NEW.VerdictID IS NOT NULL THEN
            SELECT VerdictName INTO v_verdict_name
            FROM VerdictTypes
            WHERE VerdictID = NEW.VerdictID;
        END IF;

        -- Build notification type and message
        IF v_verdict_name = 'DEEPFAKE' THEN
            SET v_notif_type = 'deepfake_detected';
            SET v_message = CONCAT(
                'ALERT: Deepfake detected in scan #', NEW.ScanID,
                '. Risk Score: ', NEW.RiskScore, '% | Confidence: ', NEW.Confidence, '%'
            );
        ELSE
            SET v_notif_type = 'scan_complete';
            SET v_message = CONCAT(
                'Scan #', NEW.ScanID, ' complete. Verdict: ', IFNULL(v_verdict_name, 'PENDING'),
                '. Risk Score: ', IFNULL(NEW.RiskScore, 'N/A'), '%'
            );
        END IF;

        INSERT INTO Notifications (UserID, Type, Message, IsRead)
        VALUES (NEW.UserID, v_notif_type, v_message, FALSE);

    END IF;
END $$


-- =============================================================================
-- TRIGGER 4: trg_set_verdict_on_risk_update
-- Event   : BEFORE UPDATE ON Scans
-- Purpose : When RiskScore is updated, automatically resolves and sets
--           VerdictID from VerdictTypes — no application code needed.
--           Ensures verdict is always consistent with the risk score stored.
-- =============================================================================
DROP TRIGGER IF EXISTS trg_set_verdict_on_risk_update $$

CREATE TRIGGER trg_set_verdict_on_risk_update
BEFORE UPDATE ON Scans
FOR EACH ROW
BEGIN
    DECLARE v_resolved_verdict_id INT DEFAULT NULL;

    -- Only resolve if RiskScore is being set and is non-null
    IF NEW.RiskScore IS NOT NULL AND (OLD.RiskScore IS NULL OR OLD.RiskScore != NEW.RiskScore) THEN
        SELECT VerdictID INTO v_resolved_verdict_id
        FROM VerdictTypes
        WHERE NEW.RiskScore BETWEEN RiskMin AND RiskMax
        LIMIT 1;

        SET NEW.VerdictID = v_resolved_verdict_id;
    END IF;
END $$


-- =============================================================================
-- TRIGGER 5: trg_prevent_duplicate_evidence
-- Event   : BEFORE INSERT ON EvidenceVault
-- Purpose : Blocks duplicate SHA-256 evidence hashes at DB level.
-- =============================================================================
DROP TRIGGER IF EXISTS trg_prevent_duplicate_evidence $$

CREATE TRIGGER trg_prevent_duplicate_evidence
BEFORE INSERT ON EvidenceVault
FOR EACH ROW
BEGIN
    DECLARE v_hash_count INT DEFAULT 0;

    SELECT COUNT(*) INTO v_hash_count
    FROM EvidenceVault
    WHERE SHA256Hash = NEW.SHA256Hash;

    IF v_hash_count > 0 THEN
        SIGNAL SQLSTATE '45004'
            SET MESSAGE_TEXT = 'TRIGGER ERROR: Duplicate evidence hash. This evidence has already been stored.';
    END IF;
END $$


-- =============================================================================
-- TRIGGER 6: trg_audit_on_evidence_insert
-- Event   : AFTER INSERT ON EvidenceVault
-- Purpose : Logs every evidence storage action automatically.
-- =============================================================================
DROP TRIGGER IF EXISTS trg_audit_on_evidence_insert $$

CREATE TRIGGER trg_audit_on_evidence_insert
AFTER INSERT ON EvidenceVault
FOR EACH ROW
BEGIN
    DECLARE v_scan_user_id INT;

    SELECT UserID INTO v_scan_user_id
    FROM Scans WHERE ScanID = NEW.ScanID;

    INSERT INTO AuditLogs (UserID, Action, Resource, Timestamp)
    VALUES (
        v_scan_user_id,
        'EVIDENCE_STORED',
        CONCAT('evidence_vault/', NEW.EvidenceID, '/scan/', NEW.ScanID),
        NOW()
    );
END $$

DELIMITER ;

-- =============================================================================
-- Verify triggers are registered
-- =============================================================================
SHOW TRIGGERS FROM sentinel_db;
