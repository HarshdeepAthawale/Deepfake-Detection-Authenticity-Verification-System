# SENTINEL — Database Layer

## UCS310 — Database Management System | Lab Submission

**Course:** UCS310 — Database Management System  
**Submitted by:** Harshdeep Athawale (1024031062), Aakriti Chauhan (1024031055), Sehaj Dhillon (1024030620)  
**Instructor:** Ms. Chinu Dhir  

---

## Overview

This `database/` directory contains the complete **relational database implementation** of SENTINEL.  
It is evaluated as the DBMS course deliverable. The full-stack production app (Express + MongoDB + Next.js) exists separately in the project root.

---

## Files & DBMS Concepts Covered

| File | Concepts Demonstrated |
|------|----------------------|
| `01_schema.sql` | DDL — CREATE TABLE, PRIMARY KEY, FOREIGN KEY, UNIQUE, CHECK constraints, indexes, 3NF/BCNF normalization |
| `02_seed.sql` | DML INSERT — populates all 6 tables with realistic test data |
| `03_queries.sql` | DQL — INNER JOIN, LEFT JOIN, GROUP BY, HAVING, subqueries, EXISTS, correlated subqueries, CREATE VIEW |
| `04_procedures.sql` | PL/SQL — Stored procedures with TRANSACTION, SAVEPOINT, COMMIT, ROLLBACK, exception handling |
| `05_functions.sql` | PL/SQL — User-defined functions, DETERMINISTIC, READS SQL DATA |
| `06_triggers.sql` | PL/SQL — BEFORE/AFTER triggers for duplicate prevention, auto-audit, auto-notification, auto-verdict |
| `07_cursors.sql` | PL/SQL — Explicit cursors, FETCH loop, parameterized cursors, temp tables for report generation |
| `08_transactions.sql` | Transaction control — START TRANSACTION, SAVEPOINT, COMMIT, ROLLBACK, isolation levels |
| `09_er_diagram.md` | ER diagram, cardinalities, normalization proof (1NF → BCNF) |

---

## Setup Instructions

### Prerequisites
- MySQL 8.0+ or MariaDB 10.6+
- MySQL Workbench or CLI

### Run in Order

```bash
# Option 1: MySQL CLI
mysql -u root -p < 01_schema.sql
mysql -u root -p sentinel_db < 02_seed.sql
mysql -u root -p sentinel_db < 03_queries.sql
mysql -u root -p sentinel_db < 05_functions.sql
mysql -u root -p sentinel_db < 06_triggers.sql
mysql -u root -p sentinel_db < 04_procedures.sql
mysql -u root -p sentinel_db < 07_cursors.sql
mysql -u root -p sentinel_db < 08_transactions.sql

# Option 2: MySQL Workbench
# File → Open SQL Script → run each file in the numbered order above
```

> **Note:** `01_schema.sql` creates the `sentinel_db` database and all tables.  
> Always run `01_schema.sql` first — it includes `DROP TABLE IF EXISTS` for safe re-runs.

---

## Database Schema Quick Reference

```
VerdictTypes    (VerdictID PK, VerdictName, RiskMin, RiskMax)
Users           (UserID PK, Name, Email, Role, PasswordHash, OperativeID, CreatedAt)
Scans           (ScanID PK, UserID FK, FileHash UNIQUE, MediaType, Status,
                 RiskScore, Confidence, VerdictID FK, ModelVersion, CreatedAt)
AuditLogs       (AuditID PK, UserID FK, Action, Resource, Timestamp)
Notifications   (NotificationID PK, UserID FK, Type, Message, IsRead, Timestamp)
EvidenceVault   (EvidenceID PK, ScanID FK, FilePath, SHA256Hash UNIQUE, CreatedAt)
```

---

## Key Design Decisions

### VerdictTypes as Reference Table (3NF)
The verdict classification (DEEPFAKE ≥75%, SUSPICIOUS 40–74%, AUTHENTIC <40%) is stored in a separate lookup table. This eliminates the transitive dependency `RiskScore → VerdictName` that would exist if verdict data were embedded in `Scans`.

### Triggers for Duplicate Prevention
`trg_prevent_duplicate_hash` (BEFORE INSERT on Scans) enforces uniqueness at the database level — not just at the application layer. This ensures data integrity even if the application check is bypassed.

### Auto-Audit via Triggers
`trg_auto_audit_on_scan_insert` and `trg_audit_on_evidence_insert` fire automatically, ensuring every scan submission and evidence storage action is logged without application code having to remember to do it.

### Auto-Verdict via Trigger
`trg_set_verdict_on_risk_update` (BEFORE UPDATE on Scans) automatically resolves `VerdictID` from the `VerdictTypes` table whenever `RiskScore` is set — keeping the FK always consistent.

---

## Stored Procedures

| Procedure | Purpose |
|-----------|---------|
| `sp_submit_scan(user_id, hash, media_type, model_ver, OUT scan_id)` | Validates user, checks duplicate hash, inserts scan + audit log atomically |
| `sp_store_evidence(scan_id, file_path, sha256)` | Validates scan is COMPLETED, stores evidence, logs action |
| `sp_update_scan_verdict(scan_id, risk, confidence, model_ver)` | Resolves verdict FK, updates scan, creates notification |
| `sp_generate_user_report(user_id)` | Aggregates scan statistics for a user, logs report action |

---

## Cursors (Report Generation)

| Procedure | Cursor Used For |
|-----------|----------------|
| `proc_scan_summary_report(start_date, end_date)` | Iterates completed scans in date range |
| `proc_deepfake_threat_report()` | Iterates all DEEPFAKE verdicts for threat intelligence |
| `proc_risk_analytics_report()` | Per-user aggregate risk statistics |
| `proc_user_activity_log(user_id)` | Parameterized cursor for individual user audit trail |

---

## Analytics Views

| View | Description |
|------|-------------|
| `v_scan_summary` | All scans with user name, verdict, risk score |
| `v_user_risk_stats` | Per-user deepfake/suspicious/authentic counts + avg risk |
| `v_audit_trail` | All audit logs with user context |
| `v_evidence_vault` | Evidence vault with scan and user details |
| `v_unread_notifications` | Pending notifications for all users |

---

## Verdict Classification

| Verdict | Risk Score Range |
|---------|----------------|
| AUTHENTIC | 0% – 39.99% |
| SUSPICIOUS | 40% – 74.99% |
| DEEPFAKE | 75% – 100% |
