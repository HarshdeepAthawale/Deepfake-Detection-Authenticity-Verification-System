-- =============================================================================
-- SENTINEL: Deepfake Detection & Authenticity Verification System
-- UCS310 - Database Management System
-- File: 08_transactions.sql  |  Transaction Management — COMMIT/ROLLBACK/SAVEPOINT
-- =============================================================================

USE sentinel_db;

-- =============================================================================
-- PRE-CLEANUP: Remove any leftover data from previous demo runs (safe re-run)
-- =============================================================================
DELETE FROM Scans WHERE FileHash IN (
    'txn1aabbccddeeff00112233445566778899aabbccddeeff0011223344556677',
    'concurrent112233aabbccddeeff00112233445566778899aabbccddeeff0011'
);
DELETE FROM EvidenceVault WHERE FilePath LIKE '%additional_frame%' OR SHA256Hash LIKE 'txn3%';
DELETE FROM Users WHERE Email = 'test.operative@sentinel.io';

-- =============================================================================
-- TRANSACTION SCENARIO 1: Full scan submission workflow
-- Demonstrates: START TRANSACTION, SAVEPOINT, COMMIT, ROLLBACK on error
-- Steps: insert scan → insert audit log → insert notification
--        If any step fails, rollback to appropriate savepoint or full rollback
-- =============================================================================

START TRANSACTION;

    -- SAVEPOINT before first write
    SAVEPOINT sp_start;

    -- Step 1: Insert scan record
    INSERT INTO Scans (UserID, FileHash, MediaType, Status, ModelVersion)
    VALUES (
        2,
        'txn1aabbccddeeff00112233445566778899aabbccddeeff0011223344556677',
        'VIDEO',
        'PENDING',
        'v4'
    );

    SAVEPOINT sp_scan_inserted;

    -- Step 2: Insert audit log
    INSERT INTO AuditLogs (UserID, Action, Resource)
    VALUES (2, 'SCAN_SUBMITTED', CONCAT('scans/', LAST_INSERT_ID()));

    SAVEPOINT sp_audit_inserted;

    -- Step 3: Insert notification
    INSERT INTO Notifications (UserID, Type, Message)
    VALUES (2, 'system', 'Your scan has been queued for processing.');

COMMIT;
-- All three inserts succeed atomically — either all commit or none do.


-- =============================================================================
-- TRANSACTION SCENARIO 2: Verdict update with partial rollback using SAVEPOINT
-- Demonstrates: ROLLBACK TO SAVEPOINT when notification step fails (e.g.,
--               invalid NotifType) while keeping the scan update committed.
--               Note: In real MySQL, only full ROLLBACK is possible within
--               a single transaction; SAVEPOINT allows partial undo.
-- =============================================================================

START TRANSACTION;

    SAVEPOINT sp_before_verdict_update;

    -- Step 1: Update scan with verdict result
    UPDATE Scans
    SET Status       = 'COMPLETED',
        RiskScore    = 82.50,
        Confidence   = 91.00,
        ModelVersion = 'v4'
    WHERE ScanID = 9;
    -- trg_set_verdict_on_risk_update trigger auto-sets VerdictID here

    SAVEPOINT sp_after_verdict_update;

    -- Step 2: Audit log
    INSERT INTO AuditLogs (UserID, Action, Resource)
    VALUES (2, 'VERDICT_ASSIGNED', 'scans/9');

    SAVEPOINT sp_after_audit;

    -- Step 3: Notification (simulate partial failure — rollback only this step)
    -- In a real scenario, if this INSERT fails due to a constraint violation:
    -- ROLLBACK TO sp_after_audit;  -- undo only the notification, keep the rest
    INSERT INTO Notifications (UserID, Type, Message)
    VALUES (2, 'deepfake_detected', 'ALERT: Scan #9 returned a DEEPFAKE verdict. Risk: 82.5%');

COMMIT;


-- =============================================================================
-- TRANSACTION SCENARIO 3: Evidence storage with duplicate hash detection
-- Demonstrates: ROLLBACK on constraint violation (duplicate SHA256Hash)
-- =============================================================================

START TRANSACTION;

    SAVEPOINT sp_before_evidence;

    -- This WILL succeed (new unique hash)
    INSERT INTO EvidenceVault (ScanID, FilePath, SHA256Hash)
    VALUES (
        4,
        '/vault/evidence/scan_004_additional_frame.jpg',
        'txn3ccddeeff0011223344556677889900aabbccddeeff001122334455667788'
    );

    SAVEPOINT sp_evidence_stored;

COMMIT;

-- Demonstrate ROLLBACK: attempt to insert duplicate SHA256Hash
-- Wrapped in a stored procedure so the trigger error is caught and ROLLBACK executes gracefully
DROP PROCEDURE IF EXISTS demo_rollback_duplicate_evidence;
DELIMITER //
CREATE PROCEDURE demo_rollback_duplicate_evidence()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'ROLLBACK executed: Duplicate evidence hash blocked by trigger. Transaction rolled back successfully.' AS TransactionResult;
    END;

    START TRANSACTION;
        SAVEPOINT sp_dup_attempt;
        -- trg_prevent_duplicate_evidence fires here and raises SQLSTATE 45004
        INSERT INTO EvidenceVault (ScanID, FilePath, SHA256Hash)
        VALUES (
            4,
            '/vault/evidence/scan_004_duplicate.jpg',
            'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2'  -- already exists (from seed)
        );
    COMMIT;
END //
DELIMITER ;
CALL demo_rollback_duplicate_evidence();


-- =============================================================================
-- TRANSACTION SCENARIO 4: Concurrent scan submission isolation
-- Demonstrates: Setting isolation level + two users submitting same file
-- =============================================================================

-- Set READ COMMITTED isolation level for this session
SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;

START TRANSACTION;

    -- User 2 submits a file
    SAVEPOINT sp_user2_scan;

    INSERT INTO Scans (UserID, FileHash, MediaType, Status, ModelVersion)
    VALUES (
        2,
        'concurrent112233aabbccddeeff00112233445566778899aabbccddeeff0011',
        'IMAGE',
        'PENDING',
        'v4'
    );

    -- User 3 tries to submit the SAME file hash in another session
    -- (In a real concurrent scenario, session 2 would be blocked until session 1 commits)
    -- The UNIQUE constraint + trigger ensures one will fail:
    -- INSERT INTO Scans (UserID, FileHash, MediaType, Status, ModelVersion)
    -- VALUES (3, 'concurrent_hash_112233...', 'IMAGE', 'PENDING', 'v4');
    -- ^ This would raise: TRIGGER ERROR: Duplicate file hash.

COMMIT;


-- =============================================================================
-- TRANSACTION SCENARIO 5: Atomic user creation + initial audit log
-- Demonstrates: Creating a user and logging the action atomically
-- =============================================================================

START TRANSACTION;

    SAVEPOINT sp_new_user;

    INSERT INTO Users (Name, Email, Role, PasswordHash, OperativeID)
    VALUES (
        'Test Operative',
        'test.operative@sentinel.io',
        'operative',
        '$2b$12$samplehash_test_operative_txn5',
        'OPR-FIELD-006'
    );

    SET @new_user_id = LAST_INSERT_ID();
    SAVEPOINT sp_user_created;

    -- Admin (UserID=1) logs the creation action
    INSERT INTO AuditLogs (UserID, Action, Resource)
    VALUES (1, 'USER_CREATED', CONCAT('users/', @new_user_id));

    SAVEPOINT sp_audit_done;

    -- Send welcome notification to new user
    INSERT INTO Notifications (UserID, Type, Message)
    VALUES (
        @new_user_id,
        'system',
        'Welcome to SENTINEL. Your operative account is now active.'
    );

COMMIT;

-- Verify the transaction result
SELECT u.Name, u.Email, u.Role, u.OperativeID
FROM Users u
WHERE u.Email = 'test.operative@sentinel.io';


-- =============================================================================
-- CLEANUP: Remove test data inserted by transaction demos
-- (Run this section after reviewing transaction results)
-- =============================================================================
/*
DELETE FROM Scans WHERE FileHash LIKE 'txn%' OR FileHash LIKE 'concurrent%';
DELETE FROM Users WHERE Email = 'test.operative@sentinel.io';
DELETE FROM EvidenceVault WHERE FilePath LIKE '%additional_frame%' OR FilePath LIKE '%txn3%';
*/

-- =============================================================================
-- Reset isolation level to default
-- =============================================================================
SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ;
