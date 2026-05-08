-- =============================================================================
-- SENTINEL: Deepfake Detection & Authenticity Verification System
-- UCS310 - Database Management System
-- File: 05_functions.sql  |  PL/SQL - User-Defined Functions
-- =============================================================================

USE sentinel_db;

DELIMITER $$

-- =============================================================================
-- FUNCTION 1: fn_validate_upload
-- Purpose : Returns TRUE if the file can be uploaded (no duplicate hash,
--           user exists and is valid). Returns FALSE with a reason otherwise.
-- Params  : p_file_hash VARCHAR — SHA-256 hash of file to validate
--           p_user_id   INT     — ID of the user attempting the upload
-- Returns : TINYINT (1 = valid, 0 = invalid)
-- =============================================================================
DROP FUNCTION IF EXISTS fn_validate_upload $$

CREATE FUNCTION fn_validate_upload(
    p_file_hash VARCHAR(64),
    p_user_id   INT
)
RETURNS TINYINT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_user_exists INT DEFAULT 0;
    DECLARE v_hash_exists INT DEFAULT 0;

    -- Check user exists
    SELECT COUNT(*) INTO v_user_exists
    FROM Users WHERE UserID = p_user_id;

    IF v_user_exists = 0 THEN
        RETURN 0;
    END IF;

    -- Check hash not already scanned
    SELECT COUNT(*) INTO v_hash_exists
    FROM Scans WHERE FileHash = p_file_hash;

    IF v_hash_exists > 0 THEN
        RETURN 0;
    END IF;

    RETURN 1;
END $$


-- =============================================================================
-- FUNCTION 2: fn_get_verdict_label
-- Purpose : Given a numeric risk score, returns the verdict label string
--           by querying the VerdictTypes reference table.
-- Params  : p_risk_score DECIMAL — Risk score between 0.00 and 100.00
-- Returns : VARCHAR (DEEPFAKE / SUSPICIOUS / AUTHENTIC / UNKNOWN)
-- =============================================================================
DROP FUNCTION IF EXISTS fn_get_verdict_label $$

CREATE FUNCTION fn_get_verdict_label(
    p_risk_score DECIMAL(5,2)
)
RETURNS VARCHAR(20)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_label VARCHAR(20) DEFAULT 'UNKNOWN';

    SELECT VerdictName INTO v_label
    FROM VerdictTypes
    WHERE p_risk_score BETWEEN RiskMin AND RiskMax
    LIMIT 1;

    RETURN v_label;
END $$


-- =============================================================================
-- FUNCTION 3: fn_count_user_scans
-- Purpose : Returns the count of completed scans for a user filtered by
--           a given verdict label (or 'ALL' to count all completed scans).
-- Params  : p_user_id INT      — User to query
--           p_verdict VARCHAR  — 'DEEPFAKE' | 'SUSPICIOUS' | 'AUTHENTIC' | 'ALL'
-- Returns : INT count
-- =============================================================================
DROP FUNCTION IF EXISTS fn_count_user_scans $$

CREATE FUNCTION fn_count_user_scans(
    p_user_id INT,
    p_verdict VARCHAR(20)
)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_count INT DEFAULT 0;

    IF p_verdict = 'ALL' THEN
        SELECT COUNT(*) INTO v_count
        FROM Scans
        WHERE UserID = p_user_id AND Status = 'COMPLETED';
    ELSE
        SELECT COUNT(*) INTO v_count
        FROM Scans s
        INNER JOIN VerdictTypes vt ON s.VerdictID = vt.VerdictID
        WHERE s.UserID = p_user_id
          AND s.Status = 'COMPLETED'
          AND vt.VerdictName = p_verdict;
    END IF;

    RETURN v_count;
END $$


-- =============================================================================
-- FUNCTION 4: fn_user_threat_level
-- Purpose : Computes an aggregated threat level for a user based on their
--           overall deepfake ratio. Returns 'HIGH' / 'MEDIUM' / 'LOW'.
--           Useful for admin risk dashboard.
-- Params  : p_user_id INT — User to evaluate
-- Returns : VARCHAR (HIGH / MEDIUM / LOW / INSUFFICIENT_DATA)
-- =============================================================================
DROP FUNCTION IF EXISTS fn_user_threat_level $$

CREATE FUNCTION fn_user_threat_level(
    p_user_id INT
)
RETURNS VARCHAR(20)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_total    INT DEFAULT 0;
    DECLARE v_deepfake INT DEFAULT 0;
    DECLARE v_ratio    DECIMAL(5,2) DEFAULT 0;

    SELECT COUNT(*) INTO v_total
    FROM Scans WHERE UserID = p_user_id AND Status = 'COMPLETED';

    IF v_total < 3 THEN
        RETURN 'INSUFFICIENT_DATA';
    END IF;

    SELECT COUNT(*) INTO v_deepfake
    FROM Scans s
    INNER JOIN VerdictTypes vt ON s.VerdictID = vt.VerdictID
    WHERE s.UserID = p_user_id
      AND s.Status = 'COMPLETED'
      AND vt.VerdictName = 'DEEPFAKE';

    SET v_ratio = (v_deepfake * 100.0) / v_total;

    IF v_ratio >= 60 THEN
        RETURN 'HIGH';
    ELSEIF v_ratio >= 30 THEN
        RETURN 'MEDIUM';
    ELSE
        RETURN 'LOW';
    END IF;
END $$

DELIMITER ;

-- =============================================================================
-- Function usage examples
-- =============================================================================
-- SELECT fn_validate_upload('a3f1c2d4e5b6789012345678901234567890abcdef1234567890abcdef123456', 2) AS IsValid;
-- SELECT fn_get_verdict_label(87.5)  AS Verdict;  -- Returns DEEPFAKE
-- SELECT fn_get_verdict_label(55.0)  AS Verdict;  -- Returns SUSPICIOUS
-- SELECT fn_get_verdict_label(20.0)  AS Verdict;  -- Returns AUTHENTIC
-- SELECT fn_count_user_scans(2, 'DEEPFAKE')  AS DeepfakeCount;
-- SELECT fn_count_user_scans(2, 'ALL')        AS TotalScans;
-- SELECT fn_user_threat_level(2)              AS ThreatLevel;
-- SELECT fn_user_threat_level(3)              AS ThreatLevel;

-- Use functions inline in queries
SELECT
    u.Name,
    fn_count_user_scans(u.UserID, 'ALL')       AS TotalScans,
    fn_count_user_scans(u.UserID, 'DEEPFAKE')  AS Deepfakes,
    fn_user_threat_level(u.UserID)             AS ThreatLevel
FROM Users u
WHERE u.Role = 'operative';
