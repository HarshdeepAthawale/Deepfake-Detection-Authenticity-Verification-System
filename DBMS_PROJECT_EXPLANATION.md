# 🔐 SENTINEL: Deepfake Detection & Authenticity Verification System
## Comprehensive DBMS Project Documentation

**Course:** UCS310 - Database Management System  
**Team Members:** Harshdeep, Aakriti, Sehaj  
**Project Submission Date:** April 2024

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Database Architecture](#database-architecture)
3. [Normalization & Database Design](#normalization--database-design)
4. [Schema Description](#schema-description)
5. [Key DBMS Concepts Implemented](#key-dbms-concepts-implemented)
6. [Detailed Implementation Guide](#detailed-implementation-guide)
7. [Query Examples & Use Cases](#query-examples--use-cases)
8. [Viva Questions & Answers](#viva-questions--answers)

---

## 🎯 Project Overview

### What is SENTINEL?

SENTINEL is a database-driven system for **detecting deepfakes and verifying media authenticity**. It uses:

- **Machine Learning** to analyze uploaded media (video, audio, images)
- **Database Management** to store scan results, evidence, and user activity
- **Role-Based Access Control (RBAC)** for admin/analyst/operative users
- **Audit Logging** for compliance and forensic investigation
- **Evidence Vault** for storing forensic artifacts

### Core Objectives

1. ✅ Accept media uploads from users
2. ✅ Process media through ML models
3. ✅ Store scan results with risk scores and verdicts
4. ✅ Track evidence for forensic analysis
5. ✅ Log all user actions for audit trails
6. ✅ Send notifications to users
7. ✅ Generate reports for analysts

### Technology Stack

| Layer | Technology |
|-------|-----------|
| **Database** | MySQL 8.0 with InnoDB |
| **Backend** | Node.js / Express |
| **Frontend** | Next.js + React |
| **ML Service** | Python (FastAPI) |
| **Deployment** | Docker & Docker Compose |

---

## 🏗️ Database Architecture

### Database Design Philosophy

The database follows **ACID principles** and **3NF normalization**:

- **Atomicity:** Transactions ensure all-or-nothing operations
- **Consistency:** Constraints enforce data integrity
- **Isolation:** Transactions don't interfere with each other
- **Durability:** MySQL persistence ensures data survives crashes

### ER Diagram Overview

```
┌─────────────┐
│   Users     │ (Operatives, Analysts, Admins)
└──────┬──────┘
       │ (1:N)
       ├─────────────────────┬─────────────────────┐
       │                     │                     │
    ┌──▼──────┐    ┌────────▼──────┐   ┌─────────▼──┐
    │  Scans  │◄───│VerdictTypes   │   │Notifications
    └──┬──────┘    └───────────────┘   └────────────┘
       │ (1:N)
       └─────────────────────┬──────────────────────┐
       │                     │
    ┌──▼──────────┐   ┌──────▼────────┐
    │AuditLogs    │   │EvidenceVault  │
    └─────────────┘   └───────────────┘
```

---

## 🔐 Normalization & Database Design

### 1st Normal Form (1NF)
✅ **All attributes are atomic (single-valued, indivisible)**

**Satisfied because:**
- No repeating groups in any table
- Name is stored as single VARCHAR (not split into first/last)
- Each column contains single values, never lists or nested data

### 2nd Normal Form (2NF)
✅ **All non-key attributes fully depend on the primary key**

**Why it's satisfied:**
- We use **single-column PRIMARY KEYs** (surrogate keys)
- No composite PKs exist, so 2NF is trivially satisfied
- All attributes depend entirely on the PK, not partial dependencies

### 3rd Normal Form (3NF)
✅ **No transitive dependencies**

**Critical Design Decision:**
```
BEFORE (❌ Violated 3NF):
Scans Table had:
  - ScanID (PK)
  - RiskScore
  - VerdictName       ← Depends on RiskScore, not directly on ScanID
  - RiskMin, RiskMax  ← Depends on RiskScore, not directly on ScanID

This created: ScanID → RiskScore → VerdictName (TRANSITIVE DEPENDENCY)

AFTER (✅ Satisfies 3NF):
```

**Solution implemented:**
- Extracted `VerdictTypes` as a separate reference table
- `Scans` now has FK to `VerdictTypes` (VerdictID)
- Verdict resolution happens through FK, not transitive dependency
- Result: `ScanID → VerdictID → VerdictName` (FK relationship, not transitive dep)

### BCNF (Boyce-Codd Normal Form)
✅ **Every determinant is a candidate key**

**Verification:**

| Table | Determinants | Candidate Keys | BCNF Status |
|-------|-------------|----------------|------------|
| **VerdictTypes** | VerdictID, VerdictName | Both → all attrs | ✅ BCNF |
| **Users** | UserID, Email, OperativeID | All → all attrs | ✅ BCNF |
| **Scans** | ScanID | ScanID → all attrs | ✅ BCNF |
| **AuditLogs** | AuditID | AuditID → all attrs | ✅ BCNF |
| **EvidenceVault** | EvidenceID, SHA256Hash | Both → all attrs | ✅ BCNF |

---

## 📊 Schema Description

### Table 1: `Users`

**Purpose:** Store user accounts with roles (admin, analyst, operative)

```sql
CREATE TABLE Users (
    UserID        INT           PRIMARY KEY AUTO_INCREMENT,
    Name          VARCHAR(100)  NOT NULL,
    Email         VARCHAR(255)  NOT NULL UNIQUE,
    Role          VARCHAR(20)   DEFAULT 'operative',
    PasswordHash  VARCHAR(255)  NOT NULL,
    OperativeID   VARCHAR(20)   NOT NULL UNIQUE,
    CreatedAt     DATETIME      DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_Role CHECK (Role IN ('admin', 'operative', 'analyst'))
);
```

**Key Constraints:**
- `Email` → Unique (no duplicate accounts)
- `OperativeID` → Unique badge/ID
- `Role` → CHECK constraint validates three roles only

### Table 2: `VerdictTypes` (Reference/Lookup)

**Purpose:** Defines verdict categories by risk score range

```sql
CREATE TABLE VerdictTypes (
    VerdictID    INT         PRIMARY KEY AUTO_INCREMENT,
    VerdictName  VARCHAR(20) NOT NULL UNIQUE,
    RiskMin      DECIMAL(5,2) NOT NULL,
    RiskMax      DECIMAL(5,2) NOT NULL,
    
    CONSTRAINT chk_ValidVerdict CHECK (VerdictName IN ('DEEPFAKE', 'SUSPICIOUS', 'AUTHENTIC')),
    CONSTRAINT chk_RiskRange    CHECK (RiskMin < RiskMax AND RiskMin >= 0 AND RiskMax <= 100)
);
```

**Sample Data:**
| VerdictID | VerdictName | RiskMin | RiskMax |
|-----------|-----------|---------|---------|
| 1 | DEEPFAKE | 75.00 | 100.00 |
| 2 | SUSPICIOUS | 25.00 | 74.99 |
| 3 | AUTHENTIC | 0.00 | 24.99 |

**Why a reference table?**
- Eliminates transitive dependency (ensures 3NF)
- Risk ranges centralized for admin control
- Can modify verdict ranges without touching Scans table

### Table 3: `Scans`

**Purpose:** Store media scan results and verdicts

```sql
CREATE TABLE Scans (
    ScanID        INT         PRIMARY KEY AUTO_INCREMENT,
    UserID        INT         NOT NULL,
    FileHash      VARCHAR(64) NOT NULL UNIQUE,
    MediaType     VARCHAR(10) NOT NULL,
    Status        VARCHAR(15) DEFAULT 'PENDING',
    RiskScore     DECIMAL(5,2),
    Confidence    DECIMAL(5,2),
    VerdictID     INT,
    ModelVersion  VARCHAR(20),
    CreatedAt     DATETIME    DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (VerdictID) REFERENCES VerdictTypes(VerdictID) ON DELETE SET NULL,
    CONSTRAINT chk_MediaType CHECK (MediaType IN ('VIDEO', 'AUDIO', 'IMAGE', 'UNKNOWN')),
    CONSTRAINT chk_Status    CHECK (Status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    CONSTRAINT chk_RiskScore CHECK (RiskScore IS NULL OR (RiskScore >= 0 AND RiskScore <= 100)),
    CONSTRAINT chk_Confidence CHECK (Confidence IS NULL OR (Confidence >= 0 AND Confidence <= 100))
);
```

**Key Features:**
- `FileHash` → UNIQUE (prevents re-scanning same file)
- `Status` → State machine: PENDING → PROCESSING → COMPLETED/FAILED
- `VerdictID` → FK to VerdictTypes (resolves verdict automatically)
- Cascading delete on user deletion (cleanup)
- Indexes on `UserID`, `Status`, `CreatedAt` for fast queries

**Scan Lifecycle:**
```
User uploads file
        ↓
INSERT (Status='PENDING')
        ↓
ML service processes
        ↓
UPDATE (Status='PROCESSING')
        ↓
Results come back
        ↓
CALL sp_update_scan_verdict (Status='COMPLETED', RiskScore, Confidence)
        ↓
VerdictID resolved by trigger
        ↓
Notification sent automatically
```

### Table 4: `AuditLogs`

**Purpose:** Immutable audit trail for compliance

```sql
CREATE TABLE AuditLogs (
    AuditID    INT          PRIMARY KEY AUTO_INCREMENT,
    UserID     INT          NOT NULL,
    Action     VARCHAR(100) NOT NULL,
    Resource   VARCHAR(100) NOT NULL,
    Timestamp  DATETIME     DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);
```

**Logged Actions:**
- `SCAN_SUBMITTED` - User uploaded media
- `VERDICT_ASSIGNED` - Scan completed
- `EVIDENCE_STORED` - Evidence archived
- `REPORT_GENERATED` - User ran report

**Why immutable?**
- Never updated/deleted after creation
- Forensic investigations require pristine logs
- Indexes on `UserID` and `Timestamp` for fast audits

### Table 5: `Notifications`

**Purpose:** User notification queue

```sql
CREATE TABLE Notifications (
    NotificationID INT       PRIMARY KEY AUTO_INCREMENT,
    UserID         INT       NOT NULL,
    Type           VARCHAR(50) NOT NULL,
    Message        TEXT      NOT NULL,
    IsRead         BOOLEAN   DEFAULT FALSE,
    Timestamp      DATETIME  DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    CONSTRAINT chk_NotifType CHECK (Type IN (
        'scan_complete', 'scan_failed', 'deepfake_detected', 'user_mention'
    ))
);
```

**Notification Types:**
- `deepfake_detected` - Alert for high-risk scans
- `scan_complete` - Routine completion
- `scan_failed` - Processing errors
- `system` - Admin announcements

### Table 6: `EvidenceVault`

**Purpose:** Store forensic artifacts from scans

```sql
CREATE TABLE EvidenceVault (
    EvidenceID  INT         PRIMARY KEY AUTO_INCREMENT,
    ScanID      INT         NOT NULL,
    FilePath    VARCHAR(500) NOT NULL,
    SHA256Hash  VARCHAR(64) NOT NULL UNIQUE,
    CreatedAt   DATETIME    DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (ScanID) REFERENCES Scans(ScanID) ON DELETE CASCADE,
    CONSTRAINT chk_HashFormat CHECK (LENGTH(SHA256Hash) = 64)
);
```

**Evidence Types:**
- Extracted frames from video
- Audio spectrograms
- Metadata artifacts
- Model activation maps

**Why SHA256Hash is unique?**
- Prevents storing same evidence twice
- Enables deduplication across scans
- Cryptographically verified integrity

---

## 🔧 Key DBMS Concepts Implemented

### 1️⃣ STORED PROCEDURES

#### What are Stored Procedures?

**Definition:** Pre-compiled SQL code stored in the database that executes business logic on the server.

**Advantages:**
- ✅ **Reduced Network Traffic** - Logic runs server-side
- ✅ **Better Security** - Hide sensitive operations from clients
- ✅ **Transactions** - All-or-nothing atomicity
- ✅ **Code Reuse** - Called from backend multiple times

#### Procedures Implemented

##### **Procedure 1: `sp_submit_scan`**

**Purpose:** Atomically submit a scan with validation and audit

```sql
CALL sp_submit_scan(
    p_user_id      = 2,
    p_file_hash    = 'abc123...def456',
    p_media_type   = 'VIDEO',
    p_model_version = 'v4',
    @scan_id       -- OUTPUT parameter
);
```

**Logic Flow:**
```
1. Validate user exists (throws error if not)
2. Check for duplicate file hash (prevents re-scan)
3. [SAVEPOINT] Insert scan record
4. [SAVEPOINT] Auto-create audit log
5. COMMIT all changes
```

**Error Handling:**
```sql
DECLARE EXIT HANDLER FOR SQLEXCEPTION
BEGIN
    ROLLBACK;           -- Undo everything
    RESIGNAL;          -- Re-raise error to client
END;
```

**SAVEPOINT Usage:** If step 4 fails, we can rollback just that part without losing step 3.

---

##### **Procedure 2: `sp_update_scan_verdict`**

**Purpose:** Update scan results and auto-notify user

```sql
CALL sp_update_scan_verdict(
    p_scan_id       = 5,
    p_risk_score    = 87.50,
    p_confidence    = 92.10,
    p_model_version = 'v4'
);
```

**What happens:**
1. **Resolve Verdict** - Query VerdictTypes to find matching risk range
   ```sql
   SELECT VerdictID FROM VerdictTypes
   WHERE 87.50 BETWEEN RiskMin AND RiskMax
   ```
2. **Update Scan** - Set Status='COMPLETED', store score, assign verdict
3. **Create Notification** - Send alert to scan owner
4. **Log Action** - Create audit record

**BEFORE/AFTER:**

❌ **Without procedure (old way):**
```
Client 1: SELECT VerdictID FROM VerdictTypes WHERE risk BETWEEN...
Client 1: UPDATE Scans...
Client 1: INSERT INTO Notifications...
Client 1: INSERT INTO AuditLogs...
(4 round-trips, potential inconsistencies)
```

✅ **With procedure:**
```
Client: CALL sp_update_scan_verdict(...)
(1 atomic transaction, server-side logic)
```

---

##### **Procedure 3: `sp_store_evidence`**

**Purpose:** Store forensic evidence safely with validation

```sql
CALL sp_store_evidence(
    p_scan_id   = 5,
    p_file_path = '/vault/evidence/scan_005.mp4',
    p_sha256    = 'evidence_sha256_hash...'
);
```

**Validation:**
- Scan must be in 'COMPLETED' status (can't store evidence for pending scans)
- SHA256 hash must be unique (no duplicate evidence)

**Why important for viva?**
- Shows understanding of **business rules enforcement in DB**
- Evidence validation prevents forensic integrity issues
- Demonstrates **BEFORE INSERT validation pattern**

---

##### **Procedure 4: `sp_generate_user_report`**

**Purpose:** Generate aggregate statistics for a user

```sql
CALL sp_generate_user_report(p_user_id = 2);
```

**Output:**
```
UserName            | harshdeep
TotalCompletedScans | 45
DeepfakeCount       | 12
SuspiciousCount     | 18
AuthenticCount      | 15
AverageRiskScore    | 52.34
```

**Implementation Pattern:**
```sql
SELECT
    COUNT(*),                                    -- Total
    COUNT(CASE WHEN vt.VerdictName = 'DEEPFAKE' THEN 1 END),
    COUNT(CASE WHEN vt.VerdictName = 'SUSPICIOUS' THEN 1 END),
    COUNT(CASE WHEN vt.VerdictName = 'AUTHENTIC' THEN 1 END),
    ROUND(AVG(s.RiskScore), 2)
FROM Scans s
LEFT JOIN VerdictTypes vt ON s.VerdictID = vt.VerdictID
WHERE s.UserID = p_user_id AND s.Status = 'COMPLETED';
```

**Why use LEFT JOIN?**
- Some scans may not have a verdict assigned yet
- Ensures we count all scans, not just those with verdicts

---

### 2️⃣ TRIGGERS

#### What are Triggers?

**Definition:** Automatic procedures that execute when data changes (INSERT, UPDATE, DELETE).

**When to use:**
- ✅ Enforce business rules at DB level
- ✅ Maintain referential integrity beyond FKs
- ✅ Auto-audit or auto-notify
- ✅ Prevent invalid state transitions

**Be careful:** Can hide logic, make debugging hard. Use only when necessary.

#### Triggers Implemented

##### **Trigger 1: `trg_prevent_duplicate_hash`**

```sql
BEFORE INSERT ON Scans
FOR EACH ROW
BEGIN
    IF (SELECT COUNT(*) FROM Scans WHERE FileHash = NEW.FileHash) > 0 THEN
        SIGNAL SQLSTATE '45001' SET MESSAGE_TEXT = 'Duplicate file hash';
    END IF;
END;
```

**Why?**
- Prevents application bypass (if frontend validation is skipped)
- Enforces at DB level (single source of truth)
- Combined with UNIQUE(FileHash) constraint for defense-in-depth

**Scenario:**
```
Attacker bypasses app validation
    ↓
Tries to INSERT duplicate hash
    ↓
BEFORE INSERT trigger fires
    ↓
SIGNAL SQLSTATE raises error
    ↓
INSERT fails, database stays clean
```

---

##### **Trigger 2: `trg_auto_audit_on_scan_insert`**

```sql
AFTER INSERT ON Scans
FOR EACH ROW
BEGIN
    INSERT INTO AuditLogs (UserID, Action, Resource, Timestamp)
    VALUES (NEW.UserID, 'SCAN_SUBMITTED', CONCAT('scans/', NEW.ScanID), NOW());
END;
```

**Why AFTER INSERT?**
- `NEW.ScanID` is only available AFTER insert completes
- BEFORE INSERT: ScanID is NULL (not yet assigned)
- AFTER INSERT: ScanID is auto-generated, can be logged

**Flow:**
```
sp_submit_scan calls INSERT INTO Scans
    ↓
Insert completes, ScanID = 42 assigned
    ↓
AFTER INSERT trigger fires automatically
    ↓
AuditLogs row created with ScanID=42
    ↓
No manual code needed, auto-logged
```

---

##### **Trigger 3: `trg_auto_notify_on_verdict`**

```sql
AFTER UPDATE ON Scans
FOR EACH ROW
BEGIN
    IF OLD.Status != 'COMPLETED' AND NEW.Status = 'COMPLETED' THEN
        -- Get verdict name
        SELECT VerdictName INTO v_verdict_name
        FROM VerdictTypes WHERE VerdictID = NEW.VerdictID;
        
        -- Create appropriate notification
        IF v_verdict_name = 'DEEPFAKE' THEN
            INSERT INTO Notifications (UserID, Type, Message)
            VALUES (NEW.UserID, 'deepfake_detected', 'ALERT: Deepfake detected...');
        ELSE
            INSERT INTO Notifications (UserID, Type, Message)
            VALUES (NEW.UserID, 'scan_complete', 'Scan completed...');
        END IF;
    END IF;
END;
```

**State Transition Logic:**
```
PENDING → PROCESSING → COMPLETED (trigger fires)
                       ↓
                    Notification created
                    User gets alerted
```

**Why check OLD.Status?**
- Prevents duplicate notifications if UPDATE runs multiple times
- Only fires on COMPLETED transition, not on other updates

---

##### **Trigger 4: `trg_set_verdict_on_risk_update`**

```sql
BEFORE UPDATE ON Scans
FOR EACH ROW
BEGIN
    IF NEW.RiskScore IS NOT NULL THEN
        SELECT VerdictID INTO v_resolved_verdict_id
        FROM VerdictTypes
        WHERE NEW.RiskScore BETWEEN RiskMin AND RiskMax
        LIMIT 1;
        
        SET NEW.VerdictID = v_resolved_verdict_id;
    END IF;
END;
```

**Purpose:** Auto-resolve verdict from risk score

**Benefit:** No manual code to find verdict; database does it automatically

**Example:**
```
UPDATE Scans SET RiskScore = 87.50 WHERE ScanID = 5;
    ↓
BEFORE UPDATE trigger intercepts
    ↓
Queries: VerdictID WHERE 87.50 BETWEEN RiskMin AND RiskMax
    ↓
Finds VerdictID = 1 (DEEPFAKE)
    ↓
Sets NEW.VerdictID = 1
    ↓
Update completes with both RiskScore and VerdictID
```

---

##### **Trigger 5 & 6: Evidence Triggers**

```sql
-- TRIGGER 5: Prevent duplicate evidence hashes
BEFORE INSERT ON EvidenceVault
FOR EACH ROW
BEGIN
    IF (SELECT COUNT(*) FROM EvidenceVault WHERE SHA256Hash = NEW.SHA256Hash) > 0 THEN
        SIGNAL SQLSTATE '45004' SET MESSAGE_TEXT = 'Duplicate evidence hash';
    END IF;
END;

-- TRIGGER 6: Auto-audit evidence storage
AFTER INSERT ON EvidenceVault
FOR EACH ROW
BEGIN
    SELECT UserID INTO v_user_id FROM Scans WHERE ScanID = NEW.ScanID;
    INSERT INTO AuditLogs (UserID, Action, Resource)
    VALUES (v_user_id, 'EVIDENCE_STORED', CONCAT('evidence_vault/', NEW.EvidenceID));
END;
```

---

### 3️⃣ USER-DEFINED FUNCTIONS

#### What are Functions?

**Definition:** Reusable code that returns a **single value** (unlike procedures which return result sets).

**Procedures vs Functions:**

| Feature | Procedure | Function |
|---------|-----------|----------|
| Returns | Multiple rows/columns | Single scalar value |
| Can use | INSERT, UPDATE, DELETE | SELECT queries, expressions |
| Use case | Complex business logic | Calculations, validations |
| Example | `CALL sp_submit_scan()` | `SELECT fn_count_user_scans()` |

#### Functions Implemented

##### **Function 1: `fn_validate_upload`**

```sql
SELECT fn_validate_upload('file_hash_xyz', 2) AS IsValid;
-- Returns: 1 (true) or 0 (false)
```

**Logic:**
```sql
CREATE FUNCTION fn_validate_upload(p_file_hash VARCHAR(64), p_user_id INT)
RETURNS TINYINT
BEGIN
    -- Check user exists
    IF (SELECT COUNT(*) FROM Users WHERE UserID = p_user_id) = 0
        RETURN 0;
    
    -- Check hash not already scanned
    IF (SELECT COUNT(*) FROM Scans WHERE FileHash = p_file_hash) > 0
        RETURN 0;
    
    RETURN 1;
END;
```

**Used in:**
```sql
IF fn_validate_upload(NEW.FileHash, NEW.UserID) = 0
    THEN ... raise error
END IF;
```

---

##### **Function 2: `fn_get_verdict_label`**

```sql
SELECT fn_get_verdict_label(87.5) AS Verdict;
-- Returns: 'DEEPFAKE'
```

**Implementation:**
```sql
SELECT VerdictName INTO v_label
FROM VerdictTypes
WHERE 87.5 BETWEEN RiskMin AND RiskMax;
RETURN v_label;
```

**Usage in queries:**
```sql
SELECT 
    ScanID,
    RiskScore,
    fn_get_verdict_label(RiskScore) AS Verdict
FROM Scans
WHERE Status = 'COMPLETED';
```

---

##### **Function 3: `fn_count_user_scans`**

```sql
SELECT fn_count_user_scans(2, 'DEEPFAKE') AS DeepfakeCount;
SELECT fn_count_user_scans(2, 'ALL') AS TotalScans;
```

**Conditional Logic:**
```sql
IF p_verdict = 'ALL' THEN
    SELECT COUNT(*) FROM Scans WHERE UserID = p_user_id;
ELSE
    SELECT COUNT(*) FROM Scans s
    JOIN VerdictTypes vt ON s.VerdictID = vt.VerdictID
    WHERE s.UserID = p_user_id AND vt.VerdictName = p_verdict;
END IF;
```

---

##### **Function 4: `fn_user_threat_level`**

```sql
SELECT fn_user_threat_level(2) AS ThreatLevel;
-- Returns: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT_DATA'
```

**Business Logic:**
```
Total scans < 3 → 'INSUFFICIENT_DATA'
Deepfake ratio >= 60% → 'HIGH'
Deepfake ratio >= 30% → 'MEDIUM'
Deepfake ratio < 30% → 'LOW'
```

**Real-world use:**
```sql
-- Admin dashboard showing high-threat users
SELECT 
    u.Name,
    fn_count_user_scans(u.UserID, 'ALL') AS TotalScans,
    fn_user_threat_level(u.UserID) AS ThreatLevel
FROM Users u
WHERE fn_user_threat_level(u.UserID) = 'HIGH';
```

---

### 4️⃣ CURSORS

#### What are Cursors?

**Definition:** Pointers to result sets that allow row-by-row processing.

**Use case:** When you need to:
- Loop through each row
- Perform calculations on each row
- Generate formatted reports

**Syntax:**
```sql
DECLARE cursor_name CURSOR FOR <SELECT statement>;
DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

OPEN cursor_name;
read_loop: LOOP
    FETCH cursor_name INTO var1, var2, ...;
    IF v_done THEN LEAVE read_loop; END IF;
    
    -- Process row
    ...
END LOOP;
CLOSE cursor_name;
```

#### Cursor Implementation: `proc_scan_summary_report`

**Purpose:** Generate detailed scan report for a date range

```sql
CALL proc_scan_summary_report('2024-04-01', '2024-04-30');
```

**Output:**
```
ScanID | UserName | OperativeID | MediaType | Verdict | RiskScore | Confidence | ScannedAt
-------|----------|-------------|-----------|---------|-----------|-----------|----------
  42   | Harshdeep|  OP-2024-001 |  VIDEO    | DEEPFAKE|   87.50   |   92.10    | 2024-04-15
  43   | Aakriti  |  OP-2024-002 |  IMAGE    | AUTHENTIC| 15.30   |   88.45    | 2024-04-16
  44   | Sehaj    |  OP-2024-003 |  AUDIO    | SUSPICIOUS| 52.10  |   85.67    | 2024-04-16

=== SUMMARY ===
Total: 3 | Deepfakes: 1 | Suspicious: 1 | Authentic: 1
```

**Cursor Definition:**
```sql
DECLARE cur_scan_summary CURSOR FOR
    SELECT
        s.ScanID, u.Name, u.OperativeID, s.MediaType,
        vt.VerdictName, s.RiskScore, s.Confidence, s.CreatedAt
    FROM Scans s
    INNER JOIN Users u ON s.UserID = u.UserID
    INNER JOIN VerdictTypes vt ON s.VerdictID = vt.VerdictID
    WHERE s.Status = 'COMPLETED'
      AND DATE(s.CreatedAt) BETWEEN p_start_date AND p_end_date
    ORDER BY s.RiskScore DESC;
```

**Loop Logic:**
```sql
OPEN cur_scan_summary;
read_loop: LOOP
    FETCH cur_scan_summary INTO
        v_scan_id, v_user_name, v_operative_id, v_media_type,
        v_verdict, v_risk_score, v_confidence, v_created_at;
    
    IF v_done THEN LEAVE read_loop; END IF;
    
    -- Insert into temp table
    INSERT INTO tmp_scan_report VALUES (...);
    
    -- Accumulate counters
    SET v_total_count = v_total_count + 1;
    IF v_verdict = 'DEEPFAKE' THEN
        SET v_deepfake_count = v_deepfake_count + 1;
    END IF;
    ...
END LOOP;
CLOSE cur_scan_summary;
```

**Why use a temporary table?**
- Stores formatted report data
- Can be queried/exported later
- Separates logic from output formatting

---

### 5️⃣ TRANSACTIONS & SAVEPOINTS

#### What are Transactions?

**Definition:** A sequence of SQL operations that must all succeed or all fail (ACID guarantee).

**ACID Properties:**

| Property | Meaning |
|----------|---------|
| **Atomicity** | All-or-nothing: either everything commits or everything rolls back |
| **Consistency** | Database constraints satisfied before and after |
| **Isolation** | Concurrent transactions don't interfere |
| **Durability** | Committed data survives crashes |

#### Savepoint Pattern

**Problem:** If we have 4 operations and operation 3 fails, we lose operations 1-2

**Solution:** Use SAVEPOINTs to rollback selectively

```sql
START TRANSACTION;

SAVEPOINT sp1;
INSERT INTO Scans (...);  -- Operation 1

SAVEPOINT sp2;
INSERT INTO AuditLogs (...);  -- Operation 2

SAVEPOINT sp3;
INSERT INTO EvidenceVault (...);  -- Operation 3 (fails)
-- ERROR: Duplicate SHA256

-- Only rollback operation 3, keep 1-2
ROLLBACK TO SAVEPOINT sp3;

-- Operation 4 can still proceed
INSERT INTO Notifications (...);

COMMIT;  -- 1, 2, 4 committed; 3 rolled back
```

#### Transaction in `sp_submit_scan`

```sql
START TRANSACTION;

    -- Step 1: Validate user exists
    SELECT COUNT(*) INTO v_user_exists FROM Users WHERE UserID = p_user_id;
    IF v_user_exists = 0 THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User does not exist';
    END IF;

    -- Step 2: Check for duplicate file hash
    SELECT COUNT(*) INTO v_hash_exists FROM Scans WHERE FileHash = p_file_hash;
    IF v_hash_exists > 0 THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45001' SET MESSAGE_TEXT = 'Duplicate file hash';
    END IF;

    -- Step 3: Insert scan record
    SAVEPOINT sp_scan_inserted;
    INSERT INTO Scans (UserID, FileHash, MediaType, Status, ModelVersion)
    VALUES (p_user_id, p_file_hash, p_media_type, 'PENDING', p_model_version);
    SET v_new_scan_id = LAST_INSERT_ID();

    -- Step 4: Auto-create audit log
    SAVEPOINT sp_audit_inserted;
    INSERT INTO AuditLogs (UserID, Action, Resource)
    VALUES (p_user_id, 'SCAN_SUBMITTED', CONCAT('scans/', v_new_scan_id));

COMMIT;  -- All succeed or all fail
```

**Key Points for Viva:**
- ✅ If user doesn't exist → ROLLBACK before INSERT (early validation)
- ✅ If hash exists → ROLLBACK before INSERT (prevent duplicates)
- ✅ If audit insert fails → Only rollback audit, keep scan (SAVEPOINT)
- ✅ COMMIT at end ensures all-or-nothing atomicity

---

## 📚 Detailed Implementation Guide

### Setup & Execution

#### 1. Create the Database

```bash
mysql -u root -p < database/01_schema.sql
```

#### 2. Seed Initial Data

```bash
mysql -u root -p sentinel_db < database/02_seed.sql
```

#### 3. Create Stored Procedures

```bash
mysql -u root -p sentinel_db < database/04_procedures.sql
```

#### 4. Create Triggers

```bash
mysql -u root -p sentinel_db < database/06_triggers.sql
```

#### 5. Create Functions

```bash
mysql -u root -p sentinel_db < database/05_functions.sql
```

#### 6. Verify Everything

```sql
-- Check tables
SHOW TABLES FROM sentinel_db;

-- Check procedures
SHOW PROCEDURE STATUS WHERE Db = 'sentinel_db';

-- Check triggers
SHOW TRIGGERS FROM sentinel_db;

-- Check functions
SHOW FUNCTION STATUS WHERE Db = 'sentinel_db';
```

---

### Workflow: From Upload to Verdict

#### Scenario: User uploads a deepfake video

```
1. USER SUBMITS SCAN
   ├─ Frontend: Select video file
   ├─ API POST /scans with file_hash, media_type
   └─ Backend calls stored procedure

2. DATABASE: sp_submit_scan()
   ├─ Validates user exists
   ├─ Validates hash uniqueness
   ├─ Inserts Scans row (Status='PENDING')
   ├─ Trigger: Auto-logs in AuditLogs
   └─ Returns ScanID to backend

3. ML SERVICE PROCESSES
   ├─ Backend sends video to ML service
   ├─ ML model analyzes (takes 30-60 seconds)
   ├─ Returns risk_score=87.50, confidence=92.10
   └─ Backend receives results

4. DATABASE: sp_update_scan_verdict()
   ├─ Receives ScanID, risk_score, confidence
   ├─ Triggers: trg_set_verdict_on_risk_update
   │  └─ Automatically resolves VerdictID from VerdictTypes
   ├─ Updates Scans (Status='COMPLETED', RiskScore, VerdictID)
   ├─ Triggers: trg_auto_notify_on_verdict
   │  └─ Automatically creates notification with type='deepfake_detected'
   ├─ Inserts AuditLogs entry
   └─ Returns verdict name + scores to backend

5. USER GETS RESULT
   ├─ Frontend displays: "DEEPFAKE detected! Risk: 87.50%"
   ├─ Notification badge appears
   └─ Evidence can now be stored
```

**Key Insight:** Most logic automated by triggers and procedures — minimal backend code needed!

---

## 🔍 Query Examples & Use Cases

### Query 1: Get all deepfake detections by risk score

```sql
SELECT
    s.ScanID,
    u.Name AS UserName,
    s.MediaType,
    s.RiskScore,
    s.Confidence,
    s.CreatedAt
FROM Scans s
INNER JOIN Users u ON s.UserID = u.UserID
INNER JOIN VerdictTypes vt ON s.VerdictID = vt.VerdictID
WHERE vt.VerdictName = 'DEEPFAKE'
ORDER BY s.RiskScore DESC;
```

### Query 2: Users with HIGH threat level

```sql
SELECT
    u.UserID,
    u.Name,
    fn_count_user_scans(u.UserID, 'ALL') AS TotalScans,
    fn_count_user_scans(u.UserID, 'DEEPFAKE') AS DeepfakeCount,
    fn_user_threat_level(u.UserID) AS ThreatLevel
FROM Users u
WHERE fn_user_threat_level(u.UserID) = 'HIGH';
```

### Query 3: Audit trail for a specific user

```sql
SELECT
    a.AuditID,
    a.Action,
    a.Resource,
    a.Timestamp
FROM AuditLogs a
WHERE a.UserID = 2
ORDER BY a.Timestamp DESC
LIMIT 20;
```

### Query 4: Evidence stored for deepfake scans

```sql
SELECT
    e.EvidenceID,
    e.FilePath,
    s.ScanID,
    vt.VerdictName,
    s.RiskScore,
    e.CreatedAt
FROM EvidenceVault e
INNER JOIN Scans s ON e.ScanID = s.ScanID
INNER JOIN VerdictTypes vt ON s.VerdictID = vt.VerdictID
WHERE vt.VerdictName = 'DEEPFAKE'
ORDER BY e.CreatedAt DESC;
```

### Query 5: Scan statistics by media type

```sql
SELECT
    s.MediaType,
    COUNT(*) AS TotalScans,
    COUNT(CASE WHEN vt.VerdictName = 'DEEPFAKE' THEN 1 END) AS DeepfakeCount,
    ROUND(AVG(s.RiskScore), 2) AS AvgRiskScore,
    ROUND(AVG(s.Confidence), 2) AS AvgConfidence
FROM Scans s
LEFT JOIN VerdictTypes vt ON s.VerdictID = vt.VerdictID
WHERE s.Status = 'COMPLETED'
GROUP BY s.MediaType
ORDER BY TotalScans DESC;
```

---

## 🎓 Viva Questions & Answers

### Question 1: Why is VerdictTypes a separate table?

**Answer:** To satisfy **3rd Normal Form (3NF)** and eliminate transitive dependencies.

**Explanation:**
- ❌ **Before:** Scans had columns `RiskScore`, `VerdictName`, `RiskMin`, `RiskMax`
  - Transitive dependency: `ScanID → RiskScore → VerdictName`
  - Non-key attributes depend on other non-key attributes
- ✅ **After:** VerdictTypes extracted as lookup table
  - Scans has FK to VerdictTypes
  - Dependency is now: `ScanID → VerdictID → VerdictName` (FK relationship, not transitive)

**Viva Tip:** Show the normalization proof document (in 01_schema.sql comments).

---

### Question 2: How are duplicates prevented at the database level?

**Answer:** Multiple defense layers:

1. **UNIQUE Constraint:**
   ```sql
   CONSTRAINT uq_FileHash UNIQUE (FileHash)
   CONSTRAINT uq_SHA256Hash UNIQUE (SHA256Hash)
   ```

2. **BEFORE INSERT Triggers:**
   ```sql
   TRIGGER trg_prevent_duplicate_hash
   TRIGGER trg_prevent_duplicate_evidence
   ```

3. **Application-level checks** in stored procedures

**Viva Tip:** Explain why all three are needed:
- Constraints enforce at disk level (can't bypass)
- Triggers prevent malformed data
- Application validates business rules

---

### Question 3: Explain the transaction flow in sp_submit_scan

**Answer:**

```
START TRANSACTION
    │
    ├─ Validate user exists
    │  └─ If not: ROLLBACK, raise error → Stop here
    │
    ├─ Check for duplicate hash
    │  └─ If exists: ROLLBACK, raise error → Stop here
    │
    ├─ SAVEPOINT sp_scan_inserted
    │  └─ INSERT Scans
    │
    ├─ SAVEPOINT sp_audit_inserted
    │  └─ INSERT AuditLogs
    │     └─ If fails: ROLLBACK to sp_audit, keep scan
    │
    └─ COMMIT (all changes persisted)
```

**Key Points:**
- Early validation prevents unnecessary INSERT
- SAVEPOINTs allow partial rollback
- COMMIT ensures atomicity

---

### Question 4: How do triggers maintain data consistency automatically?

**Answer:** Triggers enforce **database-level business rules** without app code:

| Trigger | Enforces |
|---------|----------|
| `trg_prevent_duplicate_hash` | No file scanned twice |
| `trg_auto_audit_on_scan_insert` | Every scan logged |
| `trg_auto_notify_on_verdict` | Users notified on completion |
| `trg_set_verdict_on_risk_update` | Verdict always matches risk score |
| `trg_prevent_duplicate_evidence` | Evidence not stored twice |

**Viva Tip:** Emphasize that triggers ensure consistency even if application code is buggy or bypassed.

---

### Question 5: What's the difference between functions and procedures?

**Answer:**

| Aspect | Procedure | Function |
|--------|-----------|----------|
| **Returns** | Multiple rows/sets | Single scalar value |
| **IN/OUT params** | Both | Only IN |
| **DML (INSERT/UPDATE)** | ✅ Allowed | ❌ Not in SELECT |
| **Called as** | `CALL sp_name()` | Used in SELECT |
| **Example** | `sp_submit_scan` | `fn_get_verdict_label` |

**Viva Example:**
- **Procedure:** `CALL sp_submit_scan(...)` → Does complex validation, inserts 2 tables
- **Function:** `SELECT fn_user_threat_level(2)` → Returns single value 'HIGH'

---

### Question 6: Explain cursor usage in report generation

**Answer:** Cursors allow **row-by-row processing** for complex reports:

```
Open cursor → LOOP
    ├─ Fetch next row
    ├─ Process (accumulate counters, format data)
    ├─ Insert into temp table
    └─ Repeat until no more rows
Close cursor → Return report
```

**Why not just SELECT?**
- ❌ Simple SELECT returns all rows at once, can't process each individually
- ✅ Cursor loops through, allowing calculations like "sum deepfakes per verdict"

---

### Question 7: What's the purpose of AuditLogs table?

**Answer:** Immutable forensic trail for compliance and security:

- **Compliance:** Prove who did what and when
- **Security:** Detect unauthorized access patterns
- **Forensics:** Trace data lineage (which user scanned which media)
- **Accountability:** Link user identity to actions

**Sample audit entry:**
```
AuditID | UserID | Action             | Resource              | Timestamp
--------|--------|-------------------|----------------------|-------------------
   142  |   2    | SCAN_SUBMITTED    | scans/42              | 2024-04-15 14:30:00
   143  |   2    | VERDICT_ASSIGNED  | scans/42              | 2024-04-15 14:35:00
   144  |   2    | EVIDENCE_STORED   | evidence_vault/2/42   | 2024-04-15 14:36:00
```

**Viva Tip:** Explain why we auto-log via triggers (never rely on app to log).

---

### Question 8: What are the advantages of using stored procedures over app-level queries?

**Answer:**

| Advantage | Benefit |
|-----------|---------|
| **Server-side execution** | Reduced network traffic, faster |
| **Reduced code duplication** | Logic in one place (DB) |
| **Security** | Sensitive operations hidden from client |
| **Transactions** | Atomic operations, automatic rollback on error |
| **Pre-compiled** | Slightly faster execution |
| **Centralized logic** | Easy to maintain and modify |

**Example:** If frontend and mobile app both need to submit scans, write once in `sp_submit_scan`, call from anywhere.

---

### Question 9: How does the system ensure a scan verdict matches its risk score?

**Answer:** **Two-layer enforcement:**

1. **Trigger:** `trg_set_verdict_on_risk_update`
   ```sql
   BEFORE UPDATE ON Scans
   BEGIN
       SELECT VerdictID INTO v_verdict_id
       FROM VerdictTypes
       WHERE NEW.RiskScore BETWEEN RiskMin AND RiskMax;
       SET NEW.VerdictID = v_verdict_id;
   END;
   ```

2. **Check constraint:** 
   ```sql
   CONSTRAINT chk_RiskScore CHECK (RiskScore BETWEEN 0 AND 100)
   ```

**Result:** It's impossible to have mismatched risk score + verdict.

---

### Question 10: Explain normalization up to BCNF for this schema

**Answer:**

**1st Normal Form (1NF):** ✅ All attributes atomic
- Name is not split (first/last)
- No repeating groups
- Every column has single value

**2nd Normal Form (2NF):** ✅ No partial dependencies
- All tables use single-column PKs
- 2NF trivially satisfied

**3rd Normal Form (3NF):** ✅ No transitive dependencies
- Before: `ScanID → RiskScore → VerdictName` (BAD)
- After: VerdictTypes extracted, `ScanID → VerdictID → VerdictName` (FK, OK)

**BCNF:** ✅ Every determinant is candidate key
- VerdictID → all attributes (VerdictID is PK) ✅
- VerdictName → all attributes (VerdictName is UNIQUE) ✅
- UserID → all attributes (UserID is PK) ✅

---

## 📞 Appendix: Quick Command Reference

### Verify Database Setup

```sql
-- Count all tables
SELECT COUNT(*) AS TableCount FROM information_schema.tables 
WHERE table_schema = 'sentinel_db';

-- List all procedures
SHOW PROCEDURE STATUS WHERE Db = 'sentinel_db';

-- List all triggers
SHOW TRIGGERS FROM sentinel_db;

-- List all functions
SHOW FUNCTION STATUS WHERE Db = 'sentinel_db';
```

### Test Stored Procedures

```sql
-- Submit a scan
CALL sp_submit_scan(2, 'hashABC123DEF456', 'VIDEO', 'v4', @scan_id);
SELECT @scan_id AS NewScanID;

-- Update verdict
CALL sp_update_scan_verdict(1, 87.50, 92.10, 'v4');

-- Store evidence
CALL sp_store_evidence(1, '/vault/evidence/scan_001.mp4', 'evidence_hash_xyz');

-- Generate report
CALL sp_generate_user_report(2);
```

### Test Functions

```sql
-- Validate upload
SELECT fn_validate_upload('hash_xyz', 2) AS IsValid;

-- Get verdict label
SELECT fn_get_verdict_label(87.5) AS Verdict;

-- Count user scans
SELECT fn_count_user_scans(2, 'DEEPFAKE') AS DeepfakeCount;

-- Get threat level
SELECT fn_user_threat_level(2) AS ThreatLevel;
```

---

## ✅ Summary: DBMS Concepts Implemented

| Concept | Purpose | Example |
|---------|---------|---------|
| **Normalization (3NF/BCNF)** | Eliminate redundancy, transitive deps | VerdictTypes table for lookup |
| **Constraints** | Enforce data validity | UNIQUE, CHECK, FK |
| **Indexes** | Speed up queries | idx_Scans_Status, idx_AuditLogs_UserID |
| **Transactions** | Atomic operations | sp_submit_scan with rollback |
| **Savepoints** | Partial rollback | sp_store_evidence |
| **Stored Procedures** | Server-side business logic | sp_submit_scan, sp_update_scan_verdict |
| **Triggers** | Auto-enforce rules | trg_prevent_duplicate_hash, trg_auto_notify_on_verdict |
| **Functions** | Reusable calculations | fn_count_user_scans, fn_user_threat_level |
| **Cursors** | Row-by-row processing | proc_scan_summary_report |
| **Foreign Keys** | Maintain referential integrity | Users ← Scans, Scans ← VerdictTypes |
| **Audit Logging** | Immutable action trail | AuditLogs table + triggers |

---

## 📚 References & Files

- **01_schema.sql** - DDL (CREATE TABLE, constraints, indexes)
- **02_seed.sql** - Initial test data
- **03_queries.sql** - Complex SELECT examples
- **04_procedures.sql** - 4 stored procedures
- **05_functions.sql** - 4 user-defined functions
- **06_triggers.sql** - 6 database triggers
- **07_cursors.sql** - Report generation with cursors
- **08_transactions.sql** - Transaction examples
- **09_er_diagram.md** - Visual ER diagram

---

## 🎯 For Viva Preparation

**Must Know:**
1. Why VerdictTypes is separate (3NF)
2. How sp_submit_scan works (transactions, validation)
3. Trigger firing order (BEFORE vs AFTER)
4. Difference between procedures and functions
5. Cursor purpose and loop structure
6. ACID properties in transactions
7. How duplicates are prevented
8. Audit logging strategy

**Practice:**
- Create a test database and run all procedures
- Execute each trigger scenario
- Write queries combining functions
- Explain the scan submission workflow

---

**Made with ❤️ by Team SENTINEL**

---

# 🤖 AI AGENTS ARCHITECTURE

## Overview: The 4-Agent Pipeline

SENTINEL uses a **multi-agent orchestration system** to analyze media comprehensively:

```
User Upload
    ↓
[1] PERCEPTION AGENT → Media preprocessing, frame extraction
    ↓
[2] DETECTION AGENT → ML model inference (via ml-service)
    ↓
[3] COMPRESSION AGENT → Quality/compression analysis
    ↓
[4] COGNITIVE AGENT → Human-readable verdicts & explanations
    ↓
Database Results Storage + WebSocket Update
```

---

## 🔍 Agent 1: PERCEPTION AGENT

**File:** `backend/src/agents/perception.agent.js`

### Purpose
Handles **media pre-processing** and **feature extraction**:
- Extract frames from videos
- Extract audio tracks
- Get metadata (bitrate, codec, duration)
- Detect media type intelligently
- Extract GPS/EXIF from images

### Key Functions

#### `processMedia(filePath, scanId)`

**Inputs:**
- `filePath` - Path to uploaded media file
- `scanId` - Unique scan identifier

**Outputs:**
```javascript
{
  hash: "abc123...",           // File hash for dedup
  mediaType: "VIDEO|AUDIO|IMAGE",
  duration: 120.5,             // In seconds
  size: 5000000,               // Bytes
  maxFrames: 45,               // Frames to process
  metadata: {
    format: "mp4",
    bitrate: 5000000,          // bits/sec
    codec: "h264",
    width: 1920,
    height: 1080,
    sampleRate: 48000,         // Audio sample rate
    channels: 2
  },
  extractedFrames: ["/path/frame_0.jpg", ...],
  extractedAudio: "/path/audio.wav",
  gpsCoordinates: { latitude, longitude }
}
```

### Intelligent Frame Sampling

**Adaptive Strategy:**

```
For SHORT videos (≤10 sec):
  └─ Sample at 4 fps, max 40 frames
  
For MEDIUM videos (11-30 sec):
  └─ Sample at 3 fps, max 90 frames
  
For LONG videos (31-60 sec):
  └─ Use scene-change detection (picks diverse frames)
  └─ Falls back to 2 fps if too few scenes found
  
For VERY LONG videos (>60 sec):
  └─ Scene-change detection (most visually distinct frames)
  └─ Fallback: 1 fps, max 120 frames
```

**Why?**
- Short videos need dense sampling (less content, more detail)
- Long videos need smart sampling (scene detection avoids redundancy)
- Reduces ML inference time while maintaining accuracy

### Scene-Change Detection

**Algorithm:**
```
1. Process video frame-by-frame
2. Calculate histogram difference between consecutive frames
3. If difference > 30% threshold → New scene detected
4. Select up to maxFrames most different scenes
5. Fallback to uniform sampling if detection fails
```

**Real-world example:**
```
Video: "talk_show_deepfake.mp4" (5 minutes)
Raw frames possible: 7200 (at 24fps)

Without scene detection:
  └─ Uniform 1fps → 300 frames → Lots of redundancy

With scene detection:
  └─ Scene changes at: intro, cut to speaker 1, cut to speaker 2, transition, outro
  └─ Select: 5 frames per scene × 10 scenes = 50 diverse frames
  └─ More efficient + better coverage of visual content
```

### GPS/EXIF Extraction

**For images:**
- Extracts GPS coordinates from EXIF metadata
- Returns: `{ latitude, longitude, altitude }`
- Use case: Forensic geolocation verification

---

## 🧠 Agent 2: DETECTION AGENT (ML Inference)

**File:** `backend/src/agents/detection.agent.js` / `ml-service/app.py`

### Purpose
Runs **machine learning models** on processed media:
- Image deepfake detection (94.44% accuracy)
- Audio deepfake detection (92.86% accuracy)
- Combines results into single risk score

### Models Used

#### Image Model: SiglIP-based Deepfake Detector
```
Model: deepfake-detector-model-v1
Accuracy: 94.44%
Architecture: Vision Transformer (ViT) with SiglIP pre-training
Training: Trained on merged deepfake datasets
Inference: ~100ms per frame on GPU, ~500ms on CPU
```

**What it detects:**
- Facial swaps (Deepfacelab, Faceswap)
- Face reenactment (Neural Textures, First-Order Motion)
- Generated faces (StyleGAN, DALL-E artifacts)
- AI-enhanced photos (inpainting, super-resolution)

#### Audio Model: Wav2Vec2 for Audio Deepfakes
```
Model: wav2vec2-large-xlsr-deepfake-audio-classification
Accuracy: 92.86%
Architecture: Self-supervised audio transformer
Training: Deepfake audio classification task
Inference: ~200ms per audio chunk
```

**What it detects:**
- AI-generated speech (TTS models, voice cloning)
- Spliced audio segments
- Unusual phonetic patterns
- Synthetic artifacts in frequency domain

### Inference Configuration

**Environment-driven thresholds:**
```bash
ML_MAX_FRAMES=120                    # Max frames to process
ML_VIDEO_WEIGHT=0.60                 # Video model importance
ML_AUDIO_WEIGHT=0.40                 # Audio model importance
ML_FACE_PENALTY_VERY_LOW=0.20        # Penalty if <30% faces detected
ML_PEAK_BLEND_FRACTION=0.30          # Blend peak risk into score
```

### Score Fusion Algorithm

```
Step 1: Run inference on all extracted frames
  └─ For each frame: videoScore = model(frame)
  └─ Calculate: max, mean, std of scores

Step 2: Run inference on audio track (if video with audio)
  └─ For each audio chunk: audioScore = audio_model(chunk)
  └─ Calculate: max, mean of audio scores

Step 3: Fuse scores with weighted average
  └─ combined = (videoScore × VIDEO_WEIGHT) + (audioScore × AUDIO_WEIGHT)

Step 4: Apply confidence penalties
  └─ If face_detection_rate < 30% → penalty = 0.20
  └─ If face_detection_rate < 50% → penalty = 0.10
  └─ final_confidence = confidence - (penalty × 100)

Step 5: Blend peak risk if significantly higher
  └─ If peak_score > mean_score + 10 → blend peak into final score
  └─ final_score = (score × 0.70) + (peak_score × 0.30)

Result:
  ├─ riskScore: 0-100 (final combined score)
  ├─ confidence: 0-100 (model certainty)
  ├─ videoScore: 0-100 (image/video component)
  ├─ audioScore: 0-100 (audio component)
  ├─ temporalConsistency: 0-100 (frame coherence)
  ├─ ganFingerprint: 0-100 (GAN artifact probability)
  └─ frameCount: number of frames analyzed
```

---

## 📊 Agent 3: COMPRESSION AGENT

**Purpose:** Analyze media quality and compression artifacts

**Detections:**
- Video codec and bitrate analysis
- Compression artifacts (JPEG/H.264 blocking)
- Unusual encoding patterns
- Re-compression artifacts (sign of tampered media)

**Output:**
```javascript
{
  codec: "h264",
  bitrate: 5000000,
  artifacts: [
    "Possible re-encoding detected",
    "Unusual DCT pattern in motion regions",
    "JPEG quality inconsistency"
  ],
  compressionLevel: "normal" | "aggressive" | "suspicious"
}
```

---

## 🎯 Agent 4: COGNITIVE AGENT

**File:** `backend/src/agents/cognitive.agent.js`

### Purpose
Transform **raw ML scores** into **human-readable intelligence**:
- Dynamic threshold calculation
- Context-aware explanations
- Uncertainty quantification
- Actionable recommendations

### Function: `generateExplanations(detectionResults, perceptionData)`

**Inputs:**
```javascript
detectionResults = {
  riskScore: 87.50,
  confidence: 92.10,
  videoScore: 88.0,
  audioScore: 72.0,
  ganFingerprint: 85.0,
  temporalConsistency: 45.0,  // Low = unstable frames
  uncertainty: 12.5,
  peakRisk: 95.0,
  meanRisk: 82.0,
  frameCount: 45
}

perceptionData = {
  mediaType: "VIDEO",
  duration: 120.5,
  metadata: { bitrate, codec, width, height, ... }
}
```

**Outputs:**
```javascript
{
  verdict: "DEEPFAKE" | "SUSPICIOUS" | "AUTHENTIC",
  riskScore: 87.50,
  confidence: 92,
  explanations: [
    "Strong facial manipulation indicators detected",
    "Synthetic voice patterns identified",
    "Severe temporal inconsistencies across frames"
  ],
  detailedExplanations: [
    {
      type: "critical",
      message: "Strong facial manipulation indicators detected",
      confidence: "high",
      details: "Model detected 88% probability of synthetic facial features"
    },
    ...
  ],
  metadata: {
    facialMatch: 12,              // 100 - videoScore
    audioMatch: 28,               // 100 - audioScore
    ganFingerprint: 85,
    temporalConsistency: 45,
    uncertainty: 12.5,
    frameCount: 45,
    thresholds: {
      deepfakeThreshold: 78,      // Context-aware
      suspiciousThreshold: 42     // Context-aware
    }
  }
}
```

### Dynamic Threshold Calculation

**Base thresholds** adjusted for context:

```javascript
// Base hardcoded defaults
baseDeepfake = 75
baseSuspicious = 40

// Adjustments
if (bitrate < 2 Mbps) {
  deepfakeThreshold += 5        // Low-quality → raise threshold
  suspiciousThreshold += 5
}

if (uncertainty > 20%) {
  deepfakeThreshold += 10       // High uncertainty → need higher score to call deepfake
  suspiciousThreshold += 5
}

if (mediaType === 'IMAGE') {
  deepfakeThreshold -= 5        // Images easier to detect
}

if (mediaType === 'VIDEO' && frameCount > 10) {
  deepfakeThreshold -= 5        // Multiple frames more reliable
}

// Final clamping
deepfakeThreshold = max(55, min(90, deepfakeThreshold))
```

### Rich Explanation Generation

**Multi-layered analysis:**

```
1. VIDEO ANALYSIS
   ├─ If videoScore > 75: "Strong facial manipulation indicators"
   ├─ Else if > 60: "Significant facial inconsistencies observed"
   └─ Else: "Minor facial discrepancies noted"

2. AUDIO ANALYSIS
   ├─ If audioScore > 70: "Synthetic voice patterns identified"
   ├─ Else if > 50: "Audio-phonetic misalignment detected"
   └─ No message otherwise

3. GAN FINGERPRINT
   ├─ If ganFingerprint > 75: "GAN-generated artifacts identified"
   ├─ Else if > 55: "Potential AI-generated signatures detected"
   └─ No message otherwise

4. TEMPORAL ANALYSIS (Video only)
   ├─ If temporalConsistency < 50: "SEVERE temporal inconsistencies"
   ├─ Else if < 70: "Temporal inconsistencies detected"
   └─ Else if >= 90: "High temporal consistency observed"

5. LOCALIZED DEEPFAKES
   ├─ If peakRisk > videoScore + 15: "Deepfake segments detected"
   │  Meaning: Some frames are MUCH more suspicious than average
   └─ Useful for: Identifying spliced/edited sections

6. COMPRESSION ARTIFACTS
   └─ Surface each artifact as separate explanation

7. UNCERTAINTY WARNING
   └─ If uncertainty > 25%: "High prediction uncertainty — manual review recommended"

8. ML SERVICE WARNINGS
   └─ If no faces detected: "Consider uploading media with clearly visible faces"
```

**Example output for 87.50% risk score:**
```
verdict: DEEPFAKE
confidence: 92%

Explanations:
1. "Strong facial manipulation indicators detected"
   └─ 88% probability of synthetic facial features

2. "Severe temporal inconsistencies across frames"
   └─ Frame-to-frame analysis shows 55% inconsistency

3. "GAN-generated artifacts identified"
   └─ High-frequency patterns consistent with generative AI

4. "Localized deepfake segments detected"
   └─ Frames 12-15 show 95% risk despite lower average
```

---

## 🏗️ CORE INFRASTRUCTURE

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                              │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │   Frontend (Next.js)  [Port 3002]                             │  │
│  │   - React 19 + TypeScript + Tailwind CSS                      │  │
│  │   - Real-time WebSocket updates (Socket.IO)                   │  │
│  │   - JWT authentication + RBAC                                  │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                          ↕ HTTP REST + WebSocket
┌─────────────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                               │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │   Backend API (Express.js)  [Port 3001]                       │  │
│  │   - REST endpoints for auth, scans, evidence                  │  │
│  │   - WebSocket server for real-time progress                   │  │
│  │   - Request validation + error handling                        │  │
│  ├───────────────────────────────────────────────────────────────┤  │
│  │   4-AGENT AI PIPELINE                                         │  │
│  │   ┌─────────┐  ┌──────────┐  ┌─────────────┐  ┌──────────┐   │  │
│  │   │Perception│→ │Detection │→ │Compression │→ │Cognitive │   │  │
│  │   │(frames) │  │(ML model)│  │ (quality)  │  │(explain) │   │  │
│  │   └─────────┘  └──────────┘  └─────────────┘  └──────────┘   │  │
│  │                    ↓                                           │  │
│  │            MongoDB Results Store                              │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                          ↕ HTTP REST
┌─────────────────────────────────────────────────────────────────────┐
│                     ML LAYER                                        │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │   ML Service (Flask)  [Port 5000]                             │  │
│  │   - SiglIP Deepfake Detector (94.44% accuracy)                │  │
│  │   - Wav2Vec2 Audio Detector (92.86% accuracy)                 │  │
│  │   - Model hot-swap for fine-tuning                            │  │
│  │   - Optional GPU acceleration (CUDA)                          │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                       │
│  ┌─────────────┐  ┌──────────┐  ┌──────────────┐  ┌────────────┐   │
│  │  MongoDB    │  │  Redis   │  │ File Storage │  │  MySQL DB  │   │
│  │  Port 27017 │  │ Port 6379│  │  /uploads    │  │ Port 3306  │   │
│  │             │  │          │  │              │  │            │   │
│  │ Collections:│  │ Cache:   │  │ Frames,      │  │ SENTINEL DB│   │
│  │ - users     │  │ sessions │  │ Audio files, │  │ - Users    │   │
│  │ - scans     │  │ results  │  │ Evidence     │  │ - Scans    │   │
│  │ - audit_log │  │ job_queue│  │              │  │ - Verdicts │   │
│  │ - evidence  │  │          │  │              │  │ - Audits   │   │
│  └─────────────┘  └──────────┘  └──────────────┘  └────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Docker Compose Services

#### Service 1: **MongoDB** (Port 27019:27017)

**Purpose:** NoSQL database for users, scans, audit logs

```yaml
mongodb:
  image: mongo:7.0
  container_name: deepfake-mongodb
  ports:
    - "27019:27017"
  volumes:
    - mongo-data:/data/db
  healthcheck:
    test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
```

**Collections:**
```javascript
db.users              // User accounts + roles
db.scans              // Scan submissions + results
db.audit_logs         // Action trail
db.evidence_vault     // Forensic artifacts
db.notifications      // User notifications
```

**Why MongoDB?**
- Flexible schema (ML results are varied JSON)
- Horizontal scaling (sharding-ready)
- Fast indexing on UserID, ScanID, Status

#### Service 2: **Redis** (Port 6380:6379)

**Purpose:** In-memory cache + job queue

```yaml
redis:
  image: redis:7-alpine
  container_name: deepfake-redis
  ports:
    - "6380:6379"
  volumes:
    - redis-data:/data
```

**Uses:**
```
1. Session Cache
   └─ Store JWT tokens, user sessions
   └─ Expire after 24h

2. Result Cache
   └─ Cache scan results (10 min TTL)
   └─ Avoid re-processing identical files

3. Job Queue (Bull)
   └─ Enqueue scan jobs
   └─ Track processing status
   └─ Retry failed jobs

4. Real-time Updates
   └─ Pub/sub for WebSocket events
   └─ Progress notifications
```

**Example job:**
```javascript
const scanJob = {
  id: "scan_123",
  status: "processing",
  progress: 45,  // 45% complete
  userId: 2,
  scanId: 5,
  createdAt: "2024-04-15T14:30:00Z"
}
```

#### Service 3: **ML Service** (Port 5001:5000)

**Purpose:** TensorFlow/PyTorch inference server

```yaml
ml-service:
  build:
    context: ./ml-service
    dockerfile: Dockerfile
  ports:
    - "5001:5000"
  environment:
    CHECKPOINT_DIR: /app/checkpoints
    TRAINING_CALLBACK_URL: http://backend:3001/api/admin/learning/training-complete
  volumes:
    - uploads:/app/uploads
    - ml-checkpoints:/app/checkpoints
```

**Endpoints:**
```
POST /infer
  ├─ Input: { frames: [...paths], audio: path, maxFrames }
  └─ Output: { videoScore, audioScore, ganFingerprint, temporalConsistency, warning }

POST /train
  ├─ Input: { training_dataset_path, epochs, batch_size }
  └─ Output: { status, checkpoint_id }

GET /health
  └─ Returns: { status, models_loaded, gpu_available }
```

#### Service 4: **Backend** (Port 3001:3001)

**Purpose:** REST API + Agent Orchestrator

```yaml
backend:
  build:
    context: ./backend
    dockerfile: Dockerfile
  ports:
    - "3001:3001"
  environment:
    MONGODB_URI: mongodb://mongodb:27017/deepfake-detection
    ML_SERVICE_URL: http://ml-service:5000
    REDIS_URL: redis://redis:6379
    JWT_SECRET: ${JWT_SECRET}
  depends_on:
    mongodb:
      condition: service_healthy
    redis:
      condition: service_healthy
    ml-service:
      condition: service_started
```

**Key Routes:**
```
POST /api/auth/register          → Register user
POST /api/auth/login             → JWT authentication
POST /api/scans                  → Submit scan
GET  /api/scans/:id              → Get scan results
GET  /api/evidence/:scanId       → Retrieve evidence
POST /api/reports/generate       → Create PDF report
GET  /api/audit-logs             → Audit trail
WS   /socket.io                  → WebSocket for real-time
```

#### Service 5: **Frontend** (Port 3002:3000)

**Purpose:** User interface

```yaml
frontend:
  build:
    context: .
    dockerfile: Dockerfile
  ports:
    - "3002:3000"
  environment:
    NEXT_PUBLIC_API_URL: http://localhost:3001/api
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: ${NEXT_PUBLIC_GOOGLE_CLIENT_ID}
  depends_on:
    backend:
      condition: service_healthy
```

**Key Pages:**
```
/                     → Dashboard
/auth/login           → Login
/auth/register        → Registration
/scan                 → Submit scan
/results/:scanId      → View results
/evidence             → Evidence vault
/admin/dashboard      → Admin panel
/admin/users          → User management
/reports              → Export reports
```

---

### Data Flow: Complete Scan Lifecycle

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. USER SUBMITS SCAN                                               │
├─────────────────────────────────────────────────────────────────────┤
│  Frontend: 
│    - User selects video file
│    - Computes SHA256 hash (browser)
│    - Validates file size < 500MB
│    - Shows upload progress bar
│    
│  Request: POST /api/scans
│    {
│      fileName: "deepfake_video.mp4",
│      fileHash: "abc123...",
│      mediaType: "VIDEO",
│      fileSize: 50000000,
│      file: <binary data>
│    }
│
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 2. BACKEND RECEIVES & VALIDATES                                    │
├─────────────────────────────────────────────────────────────────────┤
│  Express Route Handler:
│    - Verify JWT token (user authenticated)
│    - Check file hash not duplicate (Redis cache)
│    - Check file size < 500MB
│    - Store file in /uploads/
│    
│  Database (MySQL sp_submit_scan):
│    START TRANSACTION
│    - Validate user exists
│    - Check UNIQUE(FileHash)
│    - INSERT Scans (Status='PENDING')
│    - Trigger: trg_auto_audit_on_scan_insert
│    COMMIT
│    
│  Result: ScanID = 42, Status = 'PENDING'
│
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 3. PERCEPTION AGENT PROCESSES MEDIA                                │
├─────────────────────────────────────────────────────────────────────┤
│  processMedia(filePath, scanId):
│    - Generate file hash
│    - Get metadata (duration, bitrate, codec, etc.)
│    - Determine media type (VIDEO/AUDIO/IMAGE)
│    - Extract frames (adaptive sampling)
│      ├─ For short video: 4 fps, max 40 frames
│      ├─ For long video: scene-change detection
│      └─ Store frames in /uploads/processing/scan_42/frames/
│    - Extract audio track (if video)
│      └─ Store in /uploads/processing/scan_42/audio.wav
│    - Extract GPS/EXIF (if image)
│    
│  Return: {
│    extractedFrames: [path1, path2, ...],
│    extractedAudio: path,
│    metadata: { ... },
│    maxFrames: 45
│  }
│
│  Database UPDATE Scans: Status = 'PROCESSING'
│  WebSocket: Emit "perception_complete" to user
│
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 4. DETECTION AGENT RUNS ML INFERENCE                               │
├─────────────────────────────────────────────────────────────────────┤
│  POST http://ml-service:5000/infer
│  {
│    frames: [...45 frame paths],
│    audio: audio.wav,
│    maxFrames: 45
│  }
│  
│  ML Service:
│    - Load models (SiglIP + Wav2Vec2)
│    - For each frame: videoScore = model(frame)
│    - For audio: audioScore = audio_model(audio)
│    - Calculate: max, mean, std
│    - Detect face locations + counts
│    - Calculate temporal consistency (frame coherence)
│    - Detect GAN fingerprints
│    
│  Return: {
│    videoScore: 88.0,
│    audioScore: 72.0,
│    ganFingerprint: 85.0,
│    temporalConsistency: 45.0,
│    frameCount: 45,
│    peakRisk: 95.0,
│    meanRisk: 82.0,
│    faceDetectionRate: 0.92,
│    warning: null
│  }
│
│  WebSocket: Emit "detection_complete" with progress
│
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 5. COMPRESSION AGENT ANALYZES QUALITY                              │
├─────────────────────────────────────────────────────────────────────┤
│  Analyze codec, bitrate, artifacts:
│    - Check for re-encoding signatures
│    - Detect DCT blocking patterns
│    - Scan for JPEG quality inconsistencies
│    
│  Return: {
│    codec: "h264",
│    bitrate: 5000000,
│    artifacts: ["Unusual DCT pattern"],
│    compressionLevel: "normal"
│  }
│
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 6. COGNITIVE AGENT GENERATES VERDICT                               │
├─────────────────────────────────────────────────────────────────────┤
│  generateExplanations(allResults, perceptionData):
│    
│    - Calculate dynamic thresholds:
│      ├─ Base deepfake = 75, suspicious = 40
│      ├─ Adjust for bitrate (low bitrate → raise threshold)
│      ├─ Adjust for uncertainty
│      ├─ Adjust for media type (images easier → lower threshold)
│      └─ Result: deepfake=78, suspicious=42
│    
│    - Fuse scores:
│      ├─ riskScore = (88 × 0.6) + (72 × 0.4) = 81.6
│      ├─ Apply face-detection penalties (none, 92% face rate)
│      ├─ Blend peak risk: 81.6 + (95-81.6)*0.3 = 85.6 → rounds to 87.50
│      └─ confidence = 92
│    
│    - Compare with thresholds:
│      ├─ riskScore (87.50) >= deepfakeThreshold (78)?
│      └─ YES → verdict = 'DEEPFAKE'
│    
│    - Generate explanations:
│      ├─ "Strong facial manipulation indicators detected"
│      ├─ "Severe temporal inconsistencies across frames"
│      └─ "GAN-generated artifacts identified"
│    
│  Return: {
│    verdict: "DEEPFAKE",
│    riskScore: 87.50,
│    confidence: 92,
│    explanations: [...],
│    metadata: { ... }
│  }
│
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 7. SAVE RESULTS TO DATABASE                                        │
├─────────────────────────────────────────────────────────────────────┤
│  Database: sp_update_scan_verdict()
│    START TRANSACTION
│    
│    - Resolve VerdictID from VerdictTypes:
│      └─ SELECT VerdictID WHERE 87.50 BETWEEN RiskMin AND RiskMax
│      └─ VerdictID = 1 (DEEPFAKE)
│    
│    - UPDATE Scans:
│      ├─ Status = 'COMPLETED'
│      ├─ RiskScore = 87.50
│      ├─ Confidence = 92
│      ├─ VerdictID = 1
│      ├─ CreatedAt updated
│      
│      └─ Trigger: trg_auto_notify_on_verdict
│         └─ INSERT Notifications (type='deepfake_detected', message='...')
│    
│    - INSERT AuditLogs (action='VERDICT_ASSIGNED')
│    
│    COMMIT
│    
│  Result: Scan now has complete verdict + auto-notification
│  Redis: Cache result (10 min TTL)
│
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 8. NOTIFY USER & RETURN RESULTS                                    │
├─────────────────────────────────────────────────────────────────────┤
│  WebSocket: Emit "scan_complete"
│    {
│      scanId: 42,
│      verdict: "DEEPFAKE",
│      riskScore: 87.50,
│      confidence: 92,
│      explanations: [...],
│      completedAt: "2024-04-15T14:35:00Z"
│    }
│    
│  Frontend:
│    - Update UI with results
│    - Show risk score visualization
│    - Display explanations
│    - Enable "Store Evidence" button
│    - Show notification badge
│    
│  Database:
│    - Notifications table has new entry
│    - User sees badge in UI
│    - Can click to view scan details
│
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 9. OPTIONAL: STORE EVIDENCE                                        │
├─────────────────────────────────────────────────────────────────────┤
│  User clicks: "Store Evidence for Forensics"
│    
│  Database: sp_store_evidence()
│    START TRANSACTION
│    
│    - Validate ScanID exists and Status = 'COMPLETED'
│    - Check SHA256Hash not duplicate
│    - INSERT EvidenceVault:
│      ├─ ScanID = 42
│      ├─ FilePath = /vault/evidence/scan_42_frame_12.jpg
│      ├─ SHA256Hash = unique_hash_xyz
│      
│      └─ Trigger: trg_audit_on_evidence_insert
│         └─ INSERT AuditLogs (action='EVIDENCE_STORED')
│    
│    COMMIT
│    
│  Evidence now archived for forensic investigation
│  Immutable audit trail created
│
└─────────────────────────────────────────────────────────────────────┘
```

---

### Deployment Scenarios

#### Scenario 1: Local Development
```bash
docker compose up
# All services run locally
# Frontend:    http://localhost:3002
# Backend:     http://localhost:3001/api
# ML Service:  http://localhost:5001/health
# MongoDB:     mongodb://localhost:27019
# Redis:       redis://localhost:6380
```

#### Scenario 2: Production with GPU
```yaml
# Use ml-service-gpu container with NVIDIA CUDA support
# Comment out ml-service, uncomment ml-service-gpu
# 10-50x faster inference on GPU

deploy:
  resources:
    reservations:
      devices:
        - driver: nvidia
          count: 1
          capabilities: [gpu]
```

#### Scenario 3: Kubernetes Deployment
```yaml
# Split services into separate pods
# - Frontend pod (Nginx reverse proxy)
# - Backend pod (replicated, load-balanced)
# - ML Service pod (GPU resources)
# - MongoDB StatefulSet
# - Redis StatefulSet

# Benefits:
# - Horizontal scaling (multiple ML service replicas)
# - High availability
# - Automatic failover
# - Rolling updates
```

---

### Health Checks & Monitoring

**Service Health Endpoints:**
```
GET http://localhost:3001/health
  └─ Returns: { status: "ok", database: "connected", redis: "ok" }

GET http://localhost:5001/health
  └─ Returns: { status: "ok", models_loaded: true, gpu_available: false }

GET http://localhost:3002/
  └─ Returns: 200 OK (frontend accessible)
```

**Docker Compose Health Checks:**
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
  interval: 30s
  timeout: 3s
  retries: 3
  start_period: 40s
```

**Monitoring Stack (Optional):**
```
- Prometheus (metrics collection)
- Grafana (visualization)
- ELK Stack (centralized logging)
- New Relic / Datadog (APM)
```

---

## 🎓 Summary: Agents + Infrastructure

| Component | Purpose | Technology |
|-----------|---------|-----------|
| **Perception Agent** | Media preprocessing, frame extraction | FFmpeg, Node.js |
| **Detection Agent** | ML inference, score calculation | SiglIP, Wav2Vec2, Flask |
| **Compression Agent** | Quality analysis, artifact detection | FFprobe, NumPy |
| **Cognitive Agent** | Threshold calculation, explanations | Node.js logic |
| **Frontend** | User interface | Next.js, React, Socket.IO |
| **Backend API** | REST + orchestration | Express.js, MongoDB |
| **ML Service** | Model inference | Flask, PyTorch, CUDA (optional) |
| **MongoDB** | Document store | NoSQL, transactions |
| **MySQL** | Relational store | ACID, procedures, triggers |
| **Redis** | Cache + queue | Bull, Pub/Sub |

---

**Next Steps for Viva:**
1. Run the complete system: `docker compose up`
2. Submit a test video
3. Watch the agent pipeline execute in logs
4. Query the MySQL database to verify DBMS concepts
5. Check evidence stored in `/uploads/`
6. Review audit logs in MongoDB

**Key Points:**
- ✅ Agents are stateless (can be scaled horizontally)
- ✅ Database ensures ACID compliance
- ✅ WebSocket provides real-time updates
- ✅ Both MySQL and MongoDB used for different purposes
- ✅ Redis caching reduces database load
- ✅ Triggers auto-enforce business rules

---

**Made with ❤️ by Team SENTINEL**
