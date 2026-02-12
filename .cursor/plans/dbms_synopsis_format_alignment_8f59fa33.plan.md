---
name: DBMS Synopsis Format Alignment
overview: Restructure the SENTINEL synopsis to match the official UCS310 DBMS Project Synopsis Format, emphasizing backend SQL/PL/SQL implementation and conforming to the 12-section structure with Title Page, ER Diagram placeholder, explicit objectives, and expanded Database Implementation subsections.
todos: []
isProject: false
---

# DBMS Project Synopsis Format Alignment Plan

## Current vs Required Structure


| Required (UCS310)                                 | Current SENTINEL | Action                               |
| ------------------------------------------------- | ---------------- | ------------------------------------ |
| 1. Title Page                                     | Different format | Replace entirely                     |
| 2. Introduction                                   | Section 1        | Adjust wording                       |
| 3. Problem Statement                              | Section 2        | Simplify, add "scope of DB usage"    |
| 4. Objectives                                     | Section 3        | Rewrite as 4–6 "To..." bullets       |
| 5. Scope                                          | Section 4        | Keep, add functional boundaries      |
| 6. Proposed System                                | Section 5        | Expand with key features, efficiency |
| 7. Database Design (7.1 ER + 7.2 Relational)      | Sections 6 + 7   | Merge, add 7.1/7.2 structure         |
| 8. Normalization                                  | Section 10       | Add functional dependencies          |
| 9. Database Implementation (9.1 SQL + 9.2 PL/SQL) | Section 11       | Expand with explicit sub-items       |
| 10. Transaction Management                        | Section 12       | Add ACID, concurrency (optional)     |
| 11. Tools & Technologies                          | Section 14       | Minor alignment                      |
| 12. Expected Outcomes                             | Section 15       | Match format wording                 |


Sections 8 (System Architecture), 9 (Key Components), 13 (Verdict Classification) are not in the official format. They will be removed or condensed since the format emphasizes backend only.

---

## 1. Title Page

Replace the current submission block with the required format:

```
- Project Title: SENTINEL – Deepfake Detection & Authenticity Verification System
- Course Name & Code: UCS310 – Database Management Systems
- Degree & Year: B.Tech (2nd Year)
- Department / Institute Name: [To be filled]
- Group Members (2–3 students) with Roll Numbers: [To be filled]
- Lab Instructor Name: [To be filled]
- Academic Year: [To be filled]
```

---

## 2. Introduction

Adjust to explicitly cover:

- **Application domain**: Deepfake detection and media authenticity verification (brief)
- **Motivation**: Why this problem; how DBMS fits (keep current motivation, tighten)
- **Importance of DBMS vs file-based**: Data integrity, fast retrieval, concurrent access, secure storage (already present; ensure it is clearly stated)

Minimal edits; current content already aligns.

---

## 3. Problem Statement

Restructure to match format:

- **Clear definition**: Deepfake verification as a real-world problem
- **Limitations of existing/manual system**: Duplicate records, no central storage, poor transactions, no validation, human error
- **Scope of database usage**: How SENTINEL uses relational DB for users, scans, audit logs, evidence

Remove or shorten "Real-World Solution Contradiction" to avoid overlap with Objectives/Scope.

---

## 4. Objectives of the Project

Replace paragraph-style content with 4–6 explicit objectives:

- To design a database using E–R data modeling for the deepfake verification domain
- To convert the ER model into relational tables with primary and foreign keys
- To apply normalization (up to 3NF/BCNF) to eliminate redundancy
- To implement the database using SQL (DDL, DML, DQL)
- To use PL/SQL constructs: stored procedures, functions, triggers, and cursors
- To ensure data consistency using constraints and transactions

---

## 5. Scope of the Project

Add **functional boundaries** at the top (what the system does and does not cover). Keep users (Admin, Operative, Analyst) and modules. Emphasize backend focus in module descriptions.

---

## 6. Proposed System Description

Expand slightly:

- Overall working of the proposed database system (who does what)
- Key features and functionalities (triggers, procedures, audit trail, evidence storage)
- How the system improves efficiency, consistency, and data integrity

---

## 7. Database Design

**7.1 Entity–Relationship (ER) Diagram**

Add subsection with:

- **Entities**: User, Scan, AuditLog, Notification, EvidenceVault, VerdictType
- **Attributes** for each entity
- **Relationships**: User–Scan (1:N), Scan–EvidenceVault (1:1), User–AuditLog (1:N), etc.
- **Cardinality & constraints**
- Note: "ER diagram to be attached in final report"

**7.2 Relational Schema**

Keep existing schema (Users, Scans, AuditLogs, Notifications, EvidenceVault, VerdictTypes) under this subsection. Mention conversion from ER, PKs, FKs, and table relationships.

---

## 8. Normalization

Add **functional dependencies** before the normalization steps, e.g.:

- UserID → Name, Email, Role
- ScanID → UserID, FileHash, MediaType, Status, RiskScore, VerdictID, ModelVersion
- etc.

Then keep 1NF, 2NF, 3NF, BCNF with a short explanation each. End with final normalized table structure.

---

## 9. Database Implementation

**9.1 SQL Implementation** — expand to match format:

- DDL: CREATE, ALTER, DROP
- DML: INSERT, UPDATE, DELETE
- SELECT queries:
  - Joins
  - Subqueries
  - Aggregate functions
  - GROUP BY, HAVING
  - Views

**9.2 PL/SQL Components** — keep/align:

- Stored Procedures
- Functions
- Triggers
- Cursors
- Exception handling

---

## 10. Transaction Management & Concurrency

Expand current section:

- Use of COMMIT, ROLLBACK, SAVEPOINT
- Ensuring ACID properties
- Brief mention of concurrency control (locks, consistency) — optional but recommended

---

## 11. Tools & Technologies Used

Align with required format:

- DBMS Software (Oracle / MySQL)
- SQL / PL-SQL
- Interface tool: SQL Developer / MySQL Workbench

---

## 12. Expected Outcomes

Match format wording:

- Successful creation of a normalized database
- Efficient data retrieval using SQL queries
- Automation using triggers and procedures
- Improved data consistency and integrity

---

## Sections to Remove or Condense


| Section                                                          | Action                                                                   |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **8. System Architecture** (layers, 4-agent pipeline, data flow) | Remove—not part of DBMS format; backend emphasis only                    |
| **9. Key Components & Design** (Frontend, Backend, ML tables)    | Remove—application-layer; not required by format                         |
| **13. Verdict Classification**                                   | Move into Proposed System or Scope as a short table; no separate section |
| **16. References**                                               | Optional; can keep at end if allowed by format                           |


---

## File to Modify

- [PROJECT_SYNOPSIS.md](PROJECT_SYNOPSIS.md)

---

## Summary of Edits

1. Replace Title Page with UCS310 format.
2. Slight edits to Introduction, Problem Statement, Scope, Proposed System.
3. Replace Objectives with 4–6 "To..." bullets.
4. Split Database Design into 7.1 ER Diagram and 7.2 Relational Schema; add ER content and placeholder.
5. Add functional dependencies to Normalization.
6. Expand Database Implementation into 9.1 SQL and 9.2 PL/SQL with explicit sub-items.
7. Expand Transaction Management with ACID and concurrency.
8. Remove Sections 8, 9, 13 (or merge Verdict Classification elsewhere).
9. Align Tools, Expected Outcomes with format wording.
10. Renumber all sections 1–12.

