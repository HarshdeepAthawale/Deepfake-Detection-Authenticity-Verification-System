-- =============================================================================
-- SENTINEL: Deepfake Detection & Authenticity Verification System
-- UCS310 - Database Management System
-- File: 07_cursors.sql  |  PL/SQL - Explicit Cursors for Report Generation
-- =============================================================================

USE sentinel_db;

DELIMITER $$

-- =============================================================================
-- CURSOR BLOCK 1: cur_scan_summary
-- Purpose : Iterates all COMPLETED scans in a date range and prints a
--           tabular scan report (simulates analytics dashboard query).
-- Params  : p_start_date DATE, p_end_date DATE
-- =============================================================================
DROP PROCEDURE IF EXISTS proc_scan_summary_report $$

CREATE PROCEDURE proc_scan_summary_report(
    IN p_start_date DATE,
    IN p_end_date   DATE
)
BEGIN
    -- Cursor variables
    DECLARE v_scan_id      INT;
    DECLARE v_user_name    VARCHAR(100);
    DECLARE v_operative_id VARCHAR(20);
    DECLARE v_media_type   VARCHAR(10);
    DECLARE v_verdict      VARCHAR(20);
    DECLARE v_risk_score   DECIMAL(5,2);
    DECLARE v_confidence   DECIMAL(5,2);
    DECLARE v_created_at   DATETIME;
    DECLARE v_done         BOOLEAN DEFAULT FALSE;

    -- Totals for summary footer
    DECLARE v_total_count     INT DEFAULT 0;
    DECLARE v_deepfake_count  INT DEFAULT 0;
    DECLARE v_suspicious_count INT DEFAULT 0;
    DECLARE v_authentic_count INT DEFAULT 0;

    -- Declare cursor
    DECLARE cur_scan_summary CURSOR FOR
        SELECT
            s.ScanID,
            u.Name,
            u.OperativeID,
            s.MediaType,
            vt.VerdictName,
            s.RiskScore,
            s.Confidence,
            s.CreatedAt
        FROM Scans s
        INNER JOIN Users u         ON s.UserID    = u.UserID
        INNER JOIN VerdictTypes vt ON s.VerdictID = vt.VerdictID
        WHERE s.Status = 'COMPLETED'
          AND DATE(s.CreatedAt) BETWEEN p_start_date AND p_end_date
        ORDER BY s.RiskScore DESC;

    -- NOT FOUND handler sets v_done = TRUE to exit loop
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

    -- Create temp table to hold report rows
    DROP TEMPORARY TABLE IF EXISTS tmp_scan_report;
    CREATE TEMPORARY TABLE tmp_scan_report (
        ScanID      INT,
        UserName    VARCHAR(100),
        OperativeID VARCHAR(20),
        MediaType   VARCHAR(10),
        Verdict     VARCHAR(20),
        RiskScore   DECIMAL(5,2),
        Confidence  DECIMAL(5,2),
        ScannedAt   DATETIME
    );

    OPEN cur_scan_summary;

    read_loop: LOOP
        FETCH cur_scan_summary INTO
            v_scan_id, v_user_name, v_operative_id,
            v_media_type, v_verdict, v_risk_score,
            v_confidence, v_created_at;

        IF v_done THEN
            LEAVE read_loop;
        END IF;

        -- Insert into temp table
        INSERT INTO tmp_scan_report VALUES (
            v_scan_id, v_user_name, v_operative_id,
            v_media_type, v_verdict, v_risk_score,
            v_confidence, v_created_at
        );

        -- Accumulate counters
        SET v_total_count = v_total_count + 1;

        CASE v_verdict
            WHEN 'DEEPFAKE'   THEN SET v_deepfake_count   = v_deepfake_count   + 1;
            WHEN 'SUSPICIOUS' THEN SET v_suspicious_count = v_suspicious_count + 1;
            WHEN 'AUTHENTIC'  THEN SET v_authentic_count  = v_authentic_count  + 1;
        END CASE;

    END LOOP;

    CLOSE cur_scan_summary;

    -- Output detailed rows
    SELECT * FROM tmp_scan_report ORDER BY RiskScore DESC;

    -- Output summary footer
    SELECT
        v_total_count      AS TotalScans,
        v_deepfake_count   AS Deepfakes,
        v_suspicious_count AS Suspicious,
        v_authentic_count  AS Authentic,
        p_start_date       AS PeriodStart,
        p_end_date         AS PeriodEnd;

    DROP TEMPORARY TABLE IF EXISTS tmp_scan_report;
END $$


-- =============================================================================
-- CURSOR BLOCK 2: cur_deepfake_report
-- Purpose : Generates a threat intelligence report of all DEEPFAKE verdicts
--           with user details — used by Analyst role for investigations.
-- =============================================================================
DROP PROCEDURE IF EXISTS proc_deepfake_threat_report $$

CREATE PROCEDURE proc_deepfake_threat_report()
BEGIN
    DECLARE v_scan_id    INT;
    DECLARE v_user_name  VARCHAR(100);
    DECLARE v_op_id      VARCHAR(20);
    DECLARE v_role       VARCHAR(20);
    DECLARE v_media      VARCHAR(10);
    DECLARE v_risk       DECIMAL(5,2);
    DECLARE v_conf       DECIMAL(5,2);
    DECLARE v_model      VARCHAR(20);
    DECLARE v_ts         DATETIME;
    DECLARE v_done       BOOLEAN DEFAULT FALSE;
    DECLARE v_row_num    INT DEFAULT 0;

    DECLARE cur_deepfake_report CURSOR FOR
        SELECT
            s.ScanID,
            u.Name,
            u.OperativeID,
            u.Role,
            s.MediaType,
            s.RiskScore,
            s.Confidence,
            s.ModelVersion,
            s.CreatedAt
        FROM Scans s
        INNER JOIN Users u         ON s.UserID    = u.UserID
        INNER JOIN VerdictTypes vt ON s.VerdictID = vt.VerdictID
        WHERE vt.VerdictName = 'DEEPFAKE'
          AND s.Status = 'COMPLETED'
        ORDER BY s.CreatedAt DESC;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

    DROP TEMPORARY TABLE IF EXISTS tmp_deepfake_report;
    CREATE TEMPORARY TABLE tmp_deepfake_report (
        RowNum      INT,
        ScanID      INT,
        UserName    VARCHAR(100),
        OperativeID VARCHAR(20),
        Role        VARCHAR(20),
        MediaType   VARCHAR(10),
        RiskScore   DECIMAL(5,2),
        Confidence  DECIMAL(5,2),
        ModelVersion VARCHAR(20),
        DetectedAt  DATETIME
    );

    OPEN cur_deepfake_report;

    df_loop: LOOP
        FETCH cur_deepfake_report INTO
            v_scan_id, v_user_name, v_op_id, v_role,
            v_media, v_risk, v_conf, v_model, v_ts;

        IF v_done THEN LEAVE df_loop; END IF;

        SET v_row_num = v_row_num + 1;

        INSERT INTO tmp_deepfake_report VALUES (
            v_row_num, v_scan_id, v_user_name, v_op_id,
            v_role, v_media, v_risk, v_conf, v_model, v_ts
        );
    END LOOP;

    CLOSE cur_deepfake_report;

    SELECT * FROM tmp_deepfake_report;
    SELECT v_row_num AS TotalDeepfakesDetected;

    DROP TEMPORARY TABLE IF EXISTS tmp_deepfake_report;
END $$


-- =============================================================================
-- CURSOR BLOCK 3: cur_risk_analytics (Cursor FOR LOOP pattern)
-- Purpose : Per-user aggregate statistics: total scans, avg risk score,
--           deepfake count — simulates the analytics dashboard backend.
-- =============================================================================
DROP PROCEDURE IF EXISTS proc_risk_analytics_report $$

CREATE PROCEDURE proc_risk_analytics_report()
BEGIN
    DECLARE v_user_id      INT;
    DECLARE v_name         VARCHAR(100);
    DECLARE v_op_id        VARCHAR(20);
    DECLARE v_total        INT;
    DECLARE v_deepfake     INT;
    DECLARE v_avg_risk     DECIMAL(5,2);
    DECLARE v_threat_level VARCHAR(20);
    DECLARE v_done         BOOLEAN DEFAULT FALSE;

    DECLARE cur_risk_analytics CURSOR FOR
        SELECT
            u.UserID,
            u.Name,
            u.OperativeID,
            COUNT(s.ScanID)                                          AS TotalScans,
            COUNT(CASE WHEN vt.VerdictName = 'DEEPFAKE' THEN 1 END) AS DeepfakeCount,
            ROUND(AVG(s.RiskScore), 2)                               AS AvgRisk
        FROM Users u
        LEFT JOIN Scans s         ON u.UserID    = s.UserID AND s.Status = 'COMPLETED'
        LEFT JOIN VerdictTypes vt ON s.VerdictID = vt.VerdictID
        GROUP BY u.UserID, u.Name, u.OperativeID;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

    DROP TEMPORARY TABLE IF EXISTS tmp_risk_analytics;
    CREATE TEMPORARY TABLE tmp_risk_analytics (
        UserID      INT,
        UserName    VARCHAR(100),
        OperativeID VARCHAR(20),
        TotalScans  INT,
        Deepfakes   INT,
        AvgRiskScore DECIMAL(5,2),
        ThreatLevel VARCHAR(20)
    );

    OPEN cur_risk_analytics;

    ra_loop: LOOP
        FETCH cur_risk_analytics INTO
            v_user_id, v_name, v_op_id, v_total, v_deepfake, v_avg_risk;

        IF v_done THEN LEAVE ra_loop; END IF;

        -- Compute threat level inline
        IF v_total < 3 THEN
            SET v_threat_level = 'INSUFFICIENT_DATA';
        ELSEIF (v_deepfake * 100.0 / v_total) >= 60 THEN
            SET v_threat_level = 'HIGH';
        ELSEIF (v_deepfake * 100.0 / v_total) >= 30 THEN
            SET v_threat_level = 'MEDIUM';
        ELSE
            SET v_threat_level = 'LOW';
        END IF;

        INSERT INTO tmp_risk_analytics VALUES (
            v_user_id, v_name, v_op_id,
            v_total, v_deepfake, v_avg_risk, v_threat_level
        );
    END LOOP;

    CLOSE cur_risk_analytics;

    SELECT * FROM tmp_risk_analytics ORDER BY AvgRiskScore DESC;

    DROP TEMPORARY TABLE IF EXISTS tmp_risk_analytics;
END $$


-- =============================================================================
-- CURSOR BLOCK 4: Parameterized cursor — user activity audit trail
-- Purpose : Retrieves all audit log entries for a specific user, ordered
--           by timestamp DESC — used by admin to review user activity.
-- =============================================================================
DROP PROCEDURE IF EXISTS proc_user_activity_log $$

CREATE PROCEDURE proc_user_activity_log(
    IN p_user_id INT
)
BEGIN
    DECLARE v_audit_id INT;
    DECLARE v_action   VARCHAR(100);
    DECLARE v_resource VARCHAR(100);
    DECLARE v_ts       DATETIME;
    DECLARE v_done     BOOLEAN DEFAULT FALSE;
    DECLARE v_count    INT DEFAULT 0;

    -- Parameterized cursor using WHERE clause with IN parameter
    DECLARE cur_user_activity CURSOR FOR
        SELECT AuditID, Action, Resource, Timestamp
        FROM AuditLogs
        WHERE UserID = p_user_id
        ORDER BY Timestamp DESC;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

    DROP TEMPORARY TABLE IF EXISTS tmp_activity;
    CREATE TEMPORARY TABLE tmp_activity (
        AuditID   INT,
        Action    VARCHAR(100),
        Resource  VARCHAR(100),
        Timestamp DATETIME
    );

    OPEN cur_user_activity;

    act_loop: LOOP
        FETCH cur_user_activity INTO v_audit_id, v_action, v_resource, v_ts;
        IF v_done THEN LEAVE act_loop; END IF;

        SET v_count = v_count + 1;
        INSERT INTO tmp_activity VALUES (v_audit_id, v_action, v_resource, v_ts);
    END LOOP;

    CLOSE cur_user_activity;

    -- Output user name
    SELECT Name, Role, OperativeID FROM Users WHERE UserID = p_user_id;

    -- Output activity log
    SELECT * FROM tmp_activity;

    SELECT v_count AS TotalActions;

    DROP TEMPORARY TABLE IF EXISTS tmp_activity;
END $$

DELIMITER ;

-- =============================================================================
-- Test cursor procedures
-- =============================================================================
-- CALL proc_scan_summary_report('2024-01-01', '2026-12-31');
-- CALL proc_deepfake_threat_report();
-- CALL proc_risk_analytics_report();
-- CALL proc_user_activity_log(2);
