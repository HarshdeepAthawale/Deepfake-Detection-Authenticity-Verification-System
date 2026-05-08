# PROJECT SYNOPSIS

## SENTINEL – Deepfake Detection & Authenticity Verification System

---

**Submitted for**
UCS310 – Database Management System

**Submitted By**

Harshdeep Athawale (1024031062)

Aakriti Chauhan (1024031055)

Sehaj Dhillon (1024030620)

B.Tech (2nd Year)

**Lab Instructor**
Ms. Chinu Dhir

---

## 1. Introduction

With the rapid advancement of Artificial Intelligence and Generative Models, manipulated digital media such as deepfake videos, synthetic audio, and AI-generated images have become increasingly common. While such technologies have creative and entertainment applications, they also pose serious risks to privacy, security, misinformation, and public trust.

Managing verification records manually or through scattered systems leads to inconsistency, redundancy, and difficulty in tracking authenticity results.

SENTINEL is designed as a centralized database-driven Deepfake Detection and Authenticity Verification System that stores and manages users, scan records, verdict classifications, audit logs, and evidence vault data.

The motivation behind selecting this problem is to understand how real-world media verification platforms rely heavily on structured relational databases for reliability, traceability, and scalability.

Using a DBMS instead of file-based systems ensures:

- Data integrity
- Fast retrieval
- Secure storage
- Concurrent multi-user access
- Proper transaction management

---

## 2. Problem Statement

In the current digital ecosystem, organizations and individuals lack a structured, transparent system to store and manage deepfake detection results.

Existing approaches suffer from:

- Duplicate scan records
- Lack of centralized evidence storage
- Poor tracking of scan history
- Absence of structured audit trails
- Weak transaction handling
- High possibility of human error

Although commercial deepfake detection tools exist, they operate as closed systems and do not provide visibility into:

- Database schema design
- ER modeling
- Normalization
- Trigger implementation
- Transaction control
- PL/SQL automation

Therefore, there is a need for an academic database-centric system that demonstrates how a deepfake verification platform can be implemented using relational modeling, SQL queries, constraints, and procedural logic.

SENTINEL aims to solve this by providing a structured DBMS solution that manages verification data efficiently while emphasizing backend implementation.

---

## 3. Objectives of the Project

- The primary goal of SENTINEL is to develop a backend-driven deepfake detection and authenticity verification system that efficiently manages users, scan records, and evidence data through a centralized relational database.

- The system allows operatives to upload media for scanning, while analysts can review verification results and generate reports.

- Duplicate media submissions are automatically prevented using database constraints and triggers (based on file hash validation).

- Stored procedures are implemented for scan submission, evidence storage, and automated audit logging.

- The system ensures data accuracy by eliminating redundancy through normalization up to 3NF/BCNF.

- Relationships between users, scans, verdicts, and audit logs are maintained using primary and foreign keys.

- Transaction control mechanisms are applied during scan creation and evidence storage to ensure consistency.

- Reports such as scan summaries and risk analytics are generated using SQL queries and cursors.

Overall, the project demonstrates how a real-world media verification platform can be implemented using structured database design principles and PL/SQL automation.

---

## 4. Scope of the Project

### Users of the System

- **Admin:** Manages system operations, user accounts, monitoring, and report generation.
- **Operative:** Uploads media for scanning and views personal scan history.
- **Analyst:** Reviews all scans, generates reports, and accesses the evidence vault.

### Modules Covered

- User Management Module
- Scan Management Module
- Evidence Vault Module
- Audit Log Module
- Notification Module
- Report & Analytics Module
- Validation Module

The project focuses purely on backend database design and implementation. The machine learning model implementation and frontend UI are outside the scope of this DBMS project.

---

## 5. Proposed System Description

SENTINEL is a centralized relational database system where:

- Admin manages users and monitors activity
- Operatives submit media for scanning
- Analysts review verification results
- Scan status is updated automatically
- Triggers prevent duplicate submissions
- Procedures manage scan and evidence workflows
- Transactions ensure ACID properties

### Verdict Classification

| Verdict | Risk Score Range |
|---|---|
| **DEEPFAKE** | Risk Score >= 75% |
| **SUSPICIOUS** | Risk Score between 40% – 74% |
| **AUTHENTIC** | Risk Score < 40% |

### AI/ML Context

The system integrates with an AI-based detection pipeline that analyzes images, videos, and audio files.

The 4-Agent pipeline includes:

1. Perception Agent – Extracts metadata and file hash
2. Detection Agent – Runs ML classifier and calculates risk score
3. Compression Agent – Evaluates compression artifacts
4. Cognitive Agent – Produces final verdict and explanation

All detection outputs such as risk score, confidence, verdict, and model version are stored in the database.

---

## 6. Database Design

### Major Entities

- Users
- Scans
- VerdictTypes
- AuditLogs
- Notifications
- EvidenceVault

Each entity is connected using primary and foreign key constraints.

### Entity Relationships

| Relationship | Cardinality |
|---|---|
| Users → Scans | One user submits many scans (1:M) |
| Users → AuditLogs | One user generates many audit events (1:M) |
| Users → Notifications | One user receives many notifications (1:M) |
| Scans → EvidenceVault | One scan has many evidence files (1:M) |
| VerdictTypes → Scans | One verdict type classifies many scans (1:M) |

---

## 7. Relational Schema

- **Users** (UserID PK, Name, Email, Role, PasswordHash, **OperativeID**, CreatedAt)

- **Scans** (ScanID PK, UserID FK → Users.UserID, FileHash, MediaType, Status, RiskScore, Confidence, VerdictID FK → VerdictTypes.VerdictID, ModelVersion, CreatedAt)

- **AuditLogs** (AuditID PK, UserID FK → Users.UserID, Action, Resource, Timestamp)

- **Notifications** (NotificationID PK, UserID FK → Users.UserID, Type, Message, IsRead, Timestamp)

- **EvidenceVault** (EvidenceID PK, ScanID FK → Scans.ScanID, FilePath, SHA256Hash, CreatedAt)

- **VerdictTypes** (VerdictID PK, VerdictName, RiskMin, RiskMax)

### Constraints Applied

| Table | Constraint | Purpose |
|---|---|---|
| Users | UNIQUE (Email) | No duplicate accounts |
| Users | UNIQUE (OperativeID) | Unique operative identifier |
| Users | CHECK (Role) | Only admin / operative / analyst |
| Scans | UNIQUE (FileHash) | Prevents duplicate media submissions |
| Scans | CHECK (MediaType) | Only VIDEO / AUDIO / IMAGE / UNKNOWN |
| Scans | CHECK (Status) | Only PENDING / PROCESSING / COMPLETED / FAILED |
| Scans | CHECK (RiskScore) | Value between 0 and 100 |
| EvidenceVault | UNIQUE (SHA256Hash) | Prevents duplicate evidence storage |
| VerdictTypes | CHECK (VerdictName) | Only DEEPFAKE / SUSPICIOUS / AUTHENTIC |

---

## 8. Normalization

- **1NF:** All attributes are atomic; no repeating groups. Each column holds a single value.

- **2NF:** No partial dependencies; all non-key attributes fully depend on the primary key. All tables use single-column primary keys, so 2NF is trivially satisfied.

- **3NF:** No transitive dependencies. The VerdictTypes reference table was extracted from Scans to eliminate the transitive dependency: RiskScore → VerdictName → RiskMin, RiskMax. Scans now stores only VerdictID as a foreign key.

- **BCNF:** All determinants are candidate keys. In VerdictTypes, both VerdictID (PK) and VerdictName (UNIQUE) are candidate keys. In Users, UserID (PK), Email (UNIQUE), and OperativeID (UNIQUE) are all candidate keys. All tables satisfy BCNF.

Final normalized tables eliminate redundancy and ensure consistency.

### Normalization Example

**Before (Unnormalized Scans):**

ScanID, UserID, FileHash, MediaType, Status, RiskScore, **VerdictName, RiskMin, RiskMax**, ModelVersion

**After 3NF (Scans + VerdictTypes):**

Scans: ScanID, UserID, FileHash, MediaType, Status, RiskScore, Confidence, **VerdictID FK**, ModelVersion

VerdictTypes: VerdictID, VerdictName, RiskMin, RiskMax

---

## 9. Database Implementation

### SQL

- CREATE, ALTER, DROP
- INSERT, UPDATE, DELETE
- SELECT with JOIN, GROUP BY, HAVING
- Subqueries (WHERE IN, WHERE EXISTS, Correlated)
- Views for analytics dashboards

### Implemented Views

| View | Purpose |
|---|---|
| v_scan_summary | All scans joined with user name and verdict |
| v_user_risk_stats | Per-user deepfake/suspicious/authentic counts and avg risk score |
| v_audit_trail | Complete audit log with user context |
| v_evidence_vault | Evidence vault with scan and user details |
| v_unread_notifications | Pending notifications across all users |

### PL/SQL

#### Stored Procedures

| Procedure | Purpose |
|---|---|
| sp_submit_scan | Validates user, checks duplicate hash, inserts scan and audit log atomically |
| sp_store_evidence | Validates scan is COMPLETED, stores evidence, logs action |
| sp_update_scan_verdict | Resolves VerdictID from VerdictTypes, updates scan, creates notification |
| sp_generate_user_report | Aggregates scan statistics per user, logs report action |
| proc_scan_summary_report | Cursor-based report: iterates completed scans in a date range |
| proc_deepfake_threat_report | Cursor-based report: iterates all DEEPFAKE verdicts for threat intelligence |
| proc_risk_analytics_report | Cursor-based report: per-user aggregate risk statistics |
| proc_user_activity_log | Parameterized cursor: full audit trail for a specific user |

#### User-Defined Functions

| Function | Purpose |
|---|---|
| fn_validate_upload | Returns TRUE if file hash is unique and user is valid |
| fn_get_verdict_label | Returns verdict label (DEEPFAKE/SUSPICIOUS/AUTHENTIC) for a given risk score |
| fn_count_user_scans | Returns count of completed scans for a user filtered by verdict |
| fn_user_threat_level | Computes threat level (HIGH/MEDIUM/LOW) based on user's deepfake ratio |

#### Triggers

| Trigger | Event | Purpose |
|---|---|---|
| trg_prevent_duplicate_hash | BEFORE INSERT ON Scans | Blocks duplicate FileHash at database level |
| trg_auto_audit_on_scan_insert | AFTER INSERT ON Scans | Automatically creates AuditLog entry on every scan submission |
| trg_set_verdict_on_risk_update | BEFORE UPDATE ON Scans | Auto-resolves VerdictID from VerdictTypes when RiskScore is set |
| trg_auto_notify_on_verdict | AFTER UPDATE ON Scans | Sends notification when scan status changes to COMPLETED |
| trg_prevent_duplicate_evidence | BEFORE INSERT ON EvidenceVault | Blocks duplicate SHA256Hash in evidence |
| trg_audit_on_evidence_insert | AFTER INSERT ON EvidenceVault | Automatically logs every evidence storage action |

#### Cursors

- Explicit cursor iterating completed scans in a date range (proc_scan_summary_report)
- Explicit cursor iterating all DEEPFAKE verdicts (proc_deepfake_threat_report)
- Cursor FOR LOOP for per-user risk analytics (proc_risk_analytics_report)
- Parameterized cursor for individual user activity (proc_user_activity_log)

#### Exception Handling

- DECLARE EXIT HANDLER FOR SQLEXCEPTION with ROLLBACK and RESIGNAL in all stored procedures
- SIGNAL SQLSTATE used in triggers to raise custom error messages
- Graceful rollback on duplicate hash, invalid user, and constraint violations

---

## 10. Transaction Management

Transactions use:

- COMMIT
- ROLLBACK
- SAVEPOINT

To ensure:

- **Atomicity** – Scan submission, audit logging, and notification are committed as one unit or rolled back entirely
- **Consistency** – VerdictID is always resolved from VerdictTypes before commit
- **Isolation** – READ COMMITTED isolation level used for concurrent scan submissions
- **Durability** – All committed transactions persist across system failures

### Transaction Scenarios Implemented

1. Full scan submission: INSERT scan → INSERT audit log → INSERT notification → COMMIT
2. Verdict update with SAVEPOINT: UPDATE scan → SAVEPOINT → INSERT notification (ROLLBACK TO SAVEPOINT on failure)
3. Evidence storage with duplicate detection: INSERT evidence → trigger fires → ROLLBACK on duplicate hash
4. Concurrent scan submission: Two users submitting same file hash — one transaction blocked by UNIQUE constraint
5. Atomic user creation: INSERT user → INSERT audit log → INSERT welcome notification → COMMIT

Concurrent scan submissions are handled using proper locking and isolation mechanisms.

---

## 11. Tools & Technologies

| Category | Technology |
|---|---|
| DBMS Software | MariaDB 12.2.2 (MySQL-compatible) |
| SQL | DDL, DML, DQL operations |
| PL/SQL | Stored procedures, functions, triggers, cursors |
| Development Tool | MySQL Workbench / MariaDB CLI |
| Operating System | Linux (Arch) |

---

## 12. Expected Outcomes

The following outcomes have been achieved through implementation:

- Fully normalized relational database (3NF/BCNF) with 6 tables
- Efficient and structured storage of scan data with proper indexing
- Automated duplicate prevention via database-level triggers (not just application-level)
- Secure audit logging — every scan submission and evidence storage auto-logged by triggers
- Improved data integrity and consistency through FK constraints, CHECK constraints, and UNIQUE constraints
- Practical implementation of DBMS concepts in a real-world deepfake verification scenario
- 9 stored procedures, 4 user-defined functions, 6 triggers, 5 analytics views, and 4 cursor-based reports fully implemented and verified in MariaDB

---

## 13. ER Diagram Description

### Entities and Attributes

**Users**
UserID (PK), Name, Email, Role, PasswordHash, OperativeID, CreatedAt

**Scans**
ScanID (PK), UserID (FK), FileHash, MediaType, Status, RiskScore, Confidence, VerdictID (FK), ModelVersion, CreatedAt

**VerdictTypes**
VerdictID (PK), VerdictName, RiskMin, RiskMax

**AuditLogs**
AuditID (PK), UserID (FK), Action, Resource, Timestamp

**Notifications**
NotificationID (PK), UserID (FK), Type, Message, IsRead, Timestamp

**EvidenceVault**
EvidenceID (PK), ScanID (FK), FilePath, SHA256Hash, CreatedAt

### Relationships

```
Users (1) ────────────< Scans (M)          [submits]
Users (1) ────────────< AuditLogs (M)      [generates]
Users (1) ────────────< Notifications (M)  [receives]
Scans (1) ────────────< EvidenceVault (M)  [has evidence]
VerdictTypes (1) ─────< Scans (M)          [classifies]
```

---

## 14. Database Statistics (After Implementation)

| Item | Count |
|---|---|
| Tables | 6 |
| Total Rows (all tables) | 83+ |
| Stored Procedures | 9 |
| User-Defined Functions | 4 |
| Triggers | 6 |
| Analytics Views | 5 |
| Cursor-based Reports | 4 |
| Indexes | 14 |
| Foreign Key Constraints | 5 |
| Transaction Scenarios | 5 |
