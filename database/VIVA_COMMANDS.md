# SENTINEL — Viva Commands Cheatsheet
## UCS310 - Database Management System | Ms. Chinu Dhir

Connect first: `sudo mariadb -u root sentinel_db`

---

## 1. Show Tables & Schema

```sql
SHOW TABLES;
DESC Users;
DESC Scans;
DESC VerdictTypes;
```

---

## 2. View All Data

```sql
SELECT * FROM Users;
SELECT * FROM VerdictTypes;
SELECT * FROM Scans;
SELECT * FROM AuditLogs;
SELECT * FROM Notifications;
SELECT * FROM EvidenceVault;
```

---

## 3. INNER JOIN — Scans with User + Verdict

```sql
SELECT u.Name, s.MediaType, s.RiskScore, vt.VerdictName
FROM Scans s
INNER JOIN Users u ON s.UserID = u.UserID
INNER JOIN VerdictTypes vt ON s.VerdictID = vt.VerdictID
WHERE s.Status = 'COMPLETED';
```

---

## 4. LEFT JOIN — All Users with Scan Count

```sql
SELECT u.Name, u.Role, COUNT(s.ScanID) AS TotalScans
FROM Users u
LEFT JOIN Scans s ON u.UserID = s.UserID
GROUP BY u.UserID, u.Name, u.Role;
```

---

## 5. GROUP BY + HAVING

```sql
SELECT u.Name, COUNT(s.ScanID) AS TotalScans
FROM Users u
INNER JOIN Scans s ON u.UserID = s.UserID
GROUP BY u.UserID, u.Name
HAVING COUNT(s.ScanID) > 2;
```

---

## 6. Aggregate — Risk Score Stats per Verdict

```sql
SELECT vt.VerdictName,
       COUNT(s.ScanID) AS Total,
       ROUND(AVG(s.RiskScore), 2) AS AvgRisk,
       MAX(s.RiskScore) AS MaxRisk,
       MIN(s.RiskScore) AS MinRisk
FROM Scans s
INNER JOIN VerdictTypes vt ON s.VerdictID = vt.VerdictID
WHERE s.Status = 'COMPLETED'
GROUP BY vt.VerdictID, vt.VerdictName;
```

---

## 7. Subquery — WHERE IN

```sql
SELECT Name FROM Users
WHERE UserID IN (SELECT UserID FROM Scans WHERE Status = 'COMPLETED');
```

---

## 8. Subquery — EXISTS

```sql
SELECT u.Name FROM Users u
WHERE EXISTS (
    SELECT 1 FROM Scans s
    INNER JOIN VerdictTypes vt ON s.VerdictID = vt.VerdictID
    WHERE s.UserID = u.UserID AND vt.VerdictName = 'DEEPFAKE'
);
```

---

## 9. Trigger Proof — Duplicate Hash

Run this — it will throw an error on purpose to prove the trigger works:

```sql
INSERT INTO Scans (UserID, FileHash, MediaType, Status, ModelVersion)
VALUES (2, 'a3f1c2d4e5b6789012345678901234567890abcdef1234567890abcdef123456', 'VIDEO', 'PENDING', 'v4');
```

Expected output: `TRIGGER ERROR: Duplicate file hash. This media has already been submitted.`

---

## 10. Show Triggers

```sql
SHOW TRIGGERS;
```

---

## 11. Stored Procedure — Submit New Scan

```sql
CALL sp_submit_scan(2, 'brandnewhash1234567890abcdef1234567890abcdef1234567890abcdef12', 'VIDEO', 'v4', @id);
SELECT @id;
```

---

## 12. Stored Procedure — User Report

```sql
CALL sp_generate_user_report(2);
CALL sp_generate_user_report(3);
```

---

## 13. Stored Procedure — Update Verdict

```sql
CALL sp_update_scan_verdict(10, 65.00, 88.00, 'v4');
```

---

## 14. Show All Procedures & Functions

```sql
SHOW PROCEDURE STATUS WHERE Db = 'sentinel_db';
SHOW FUNCTION STATUS WHERE Db = 'sentinel_db';
```

---

## 15. Functions

```sql
SELECT fn_get_verdict_label(87.5);
SELECT fn_get_verdict_label(55.0);
SELECT fn_get_verdict_label(20.0);
SELECT fn_validate_upload('totallybrandhash1234567890abcdef1234567890abcdef1234567890ab12', 2);
SELECT fn_user_threat_level(2);
SELECT fn_count_user_scans(2, 'DEEPFAKE');
SELECT fn_count_user_scans(2, 'ALL');
```

---

## 16. Views

```sql
SELECT * FROM v_scan_summary;
SELECT * FROM v_user_risk_stats;
SELECT * FROM v_evidence_vault;
SELECT * FROM v_unread_notifications;
SELECT * FROM v_audit_trail LIMIT 10;
```

---

## 17. Cursor Reports

```sql
CALL proc_deepfake_threat_report();
```

```sql
CALL proc_scan_summary_report('2024-01-01', '2026-12-31');
```

```sql
CALL proc_risk_analytics_report();
```

---

## 18. Transaction — ROLLBACK Demo

```sql
START TRANSACTION;
INSERT INTO AuditLogs (UserID, Action, Resource) VALUES (1, 'TEST_ACTION', 'test');
ROLLBACK;
SELECT * FROM AuditLogs WHERE Action = 'TEST_ACTION';
```

Last SELECT returns empty — ROLLBACK worked.

---

## 19. Transaction — SAVEPOINT Demo

```sql
START TRANSACTION;
SAVEPOINT sp1;
INSERT INTO Notifications (UserID, Type, Message) VALUES (1, 'system', 'Test notification');
ROLLBACK TO sp1;
COMMIT;
SELECT * FROM Notifications WHERE Message = 'Test notification';
```

Returns empty — rolled back to savepoint successfully.

---

## 20. Normalization — Show Reference Table

```sql
SELECT * FROM VerdictTypes;
```

Say: "VerdictTypes is a separate reference table to remove the transitive dependency RiskScore → VerdictName from Scans. This achieves 3NF."

---

## Key Points to Say

| Concept | What to say |
|---------|-------------|
| Trigger | Fires BEFORE INSERT on Scans — blocks duplicate file hash at DB level |
| 3NF | VerdictTypes extracted to remove transitive dep: RiskScore → VerdictName |
| Stored Procedure | sp_submit_scan validates user, checks hash, inserts scan + audit log atomically |
| Cursor | proc_deepfake_threat_report iterates all DEEPFAKE verdicts row by row |
| SAVEPOINT | Allows partial rollback — undo only one step without losing the whole transaction |
| View | v_scan_summary joins Users + Scans + VerdictTypes for the analytics dashboard |
