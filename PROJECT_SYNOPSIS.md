# PROJECT SYNOPSIS

# SENTINEL – Deepfake Detection & Authenticity Verification System

**Project Title:** SENTINEL – Deepfake Detection & Authenticity Verification System  
**Course Name & Code:** UCS310 – Database Management Systems  
**Degree & Year:** B.Tech (2nd Year)  
**Department / Institute Name:** Computer Engineering, Thapar Institute of Engineering and Technology  
**Group Members with Roll Numbers:** Harshdeep Athawale (1024031062), Aakriti Chauhan (1024031055), Sehaj Dhillon (1024030620)  
**Lab Instructor Name:** Abhishelly Sharma  
**Academic Year:** [2024-2028]

---

## 2. Introduction

**Application Domain:** The application domain is deepfake detection and media authenticity verification. With the rapid proliferation of AI-generated and manipulated media, the threat of deepfakes has become increasingly prevalent across social media, news, and digital communications. Deepfakes—synthetically generated or altered images, videos, and audio—pose significant risks to trust, privacy, and security.

**Motivation:** The motivation behind selecting this problem is to understand how real-world media verification systems rely heavily on well-structured databases for reliability and scalability. SENTINEL is designed as a centralized database-driven system that stores and manages users, scans, audit logs, evidence records, and verification results.

**Importance of DBMS vs File-Based System:** Using a DBMS instead of a file-based system ensures data integrity, fast retrieval, concurrent access, and secure storage. Managing media verification manually or using scattered files leads to data inconsistency, redundancy, and inefficiency; a relational database addresses these issues through proper schema design, constraints, and transaction management.

---

## 3. Problem Statement

**Clear Definition:** The real-world problem addressed is the need for a reliable, centralized system to manage deepfake detection and media authenticity verification. As AI-generated media proliferates, organizations and users require structured storage and retrieval of scan results, user data, audit trails, and evidence records.

**Limitations of Existing/Manual System:**

- Duplicate or inconsistent scan records
- Lack of centralized data storage for evidence and audit trails
- Difficulty tracking scan history and user activity
- Poor transaction handling during batch uploads
- Absence of automated validation (e.g., duplicate file hash checks)
- High chances of human error in manual verification
- Commercial tools operate as closed systems and do not expose database design or PL/SQL logic for academic study

**Scope of Database Usage:** SENTINEL uses a relational database to store and manage users (with roles), scans (with verdicts and metadata), audit logs (for compliance), notifications, and evidence vault records. The database enforces integrity through constraints, automates validation via triggers, and ensures consistency through transactions.

---

## 4. Objectives of the Project

- The primary goal of **SENTINEL** is to develop a backend-driven deepfake detection and authenticity verification system that efficiently manages users, scans, and evidence through a centralized database. The project focuses on building a structured database that stores all information related to users, media scans, verdicts, audit logs, and evidence vault in an organized manner.

- The system is designed to allow operatives to upload media for scanning and analysts to generate reports and export data. Duplicate submissions are automatically prevented using database constraints and triggers. The project also implements automated scan submission and evidence storage using stored procedures and functions.

- **SENTINEL** ensures data accuracy by eliminating redundancy through proper table structuring and normalization. Relationships between users, scans, and audit logs are maintained using primary and foreign keys. Transaction control mechanisms are applied during scan creation and evidence storage operations to guarantee consistency.

- Additionally, the system generates reports such as scan history and analytics summaries using SQL queries and cursors, helping administrators analyze system activity.

- Overall, the project demonstrates how a real-world media verification platform can be implemented using relational databases, SQL queries, and PL/SQL programming for automation and integrity enforcement.

---

## 5. Scope of the Project

**Functional Boundaries:** The system covers database design and implementation for user management, scan records, verdict storage, audit logging, notifications, and evidence vault. It does not cover the ML inference pipeline implementation, frontend UI development, or file storage systems beyond metadata in the database.

**Types of Users:**

- **Admin**: Responsible for overall system operations including user management, monitoring scans and transactions, and generating reports.
- **Operative**: Can upload media for scanning, view scan history, and track verification results.
- **Analyst**: Can view all scans, generate reports, export data, and access the evidence vault.

**Modules Covered (Backend Focus):**

- **User Management Module**: User registration, authentication, role-based access (Admin/Operative/Analyst).
- **Scan Management Module**: Scan details, media type, status, verdict, risk score, model version.
- **Evidence Vault Module**: Evidence records linked to completed scans with SHA-256 integrity.
- **Audit Log Module**: User actions and system events for compliance.
- **Report Generation Module**: Scan summaries and analytics using SQL queries and cursors.
- **Validation Module**: Duplicate submission prevention and audit trail maintenance via triggers and constraints.

---

## 6. Proposed System Description

**Overall Working:** SENTINEL is a centralized relational database system where Admin manages users and audit logs; Operatives upload media for scanning and view their own scan history; Analysts view all scans, generate reports, and access the evidence vault. Scan status is updated as verification progresses; triggers validate duplicate submissions (same file hash) and maintain audit trails; procedures manage scan submission and evidence storage; transactions ensure atomicity during multi-table operations.

**Key Features and Functionalities:**

- Role-based user management (Admin, Operative, Analyst)
- Scan records with verdict classification: DEEPFAKE (≥75% risk), SUSPICIOUS (40–74%), AUTHENTIC (<40%)
- Triggers for duplicate prevention and automatic audit logging
- Stored procedures for scan submission and report generation
- Evidence vault with SHA-256 integrity metadata
- Views and cursors for analytics and report export

**AI/ML Features (System Context):** SENTINEL includes an AI/ML detection pipeline that analyzes uploaded media (images, video, audio) for deepfakes. The pipeline uses a SiglIP-based classifier with **94.44% accuracy** and produces risk scores and verdicts (DEEPFAKE / SUSPICIOUS / AUTHENTIC). All detection outputs—risk score, confidence, verdict, and model version—are persisted in the database (Scans and VerdictTypes tables).

**4-Agent Pipeline:** Media passes through four agents in sequence: (1) **Perception Agent**—extracts frames, metadata, and file hash; (2) **Detection Agent**—invokes the ML model and aggregates risk scores; (3) **Compression Agent**—analyzes quality and compression artifacts to adjust scores; (4) **Cognitive Agent**—produces the final verdict and human-readable explanation.

**Analytics:** The database enables analytics via SQL queries and views—scan counts by verdict, average risk score, trends by date/media type, and analyst dashboards. Stored procedures and cursors support report generation (PDF, JSON, CSV) for forensic and compliance use. The DBMS layer thus supports the AI/ML workflow by storing and querying verification results reliably.

---

## 7. Database Design

### 7.1 Entity–Relationship (ER) Diagram

*ER diagram to be attached separately.*

### 7.2 Relational Schema

The ER model is converted into the following relational tables with primary keys (PK) and foreign keys (FK):

- **Users** (UserID PK, Name, Email, Role, PasswordHash, OperativeID FK → Users.UserID, CreatedAt)
- **Scans** (ScanID PK, UserID FK → Users.UserID, FileHash, MediaType, Status, RiskScore, Confidence, VerdictID FK → VerdictTypes.VerdictID, ModelVersion, CreatedAt)
- **AuditLogs** (AuditID PK, UserID FK → Users.UserID, Action, Resource, Timestamp)
- **Notifications** (NotificationID PK, UserID FK → Users.UserID, Type, Message, IsRead, Timestamp)
- **EvidenceVault** (EvidenceID PK, ScanID FK → Scans.ScanID, FilePath, SHA256Hash, CreatedAt)
- **VerdictTypes** (VerdictID PK, VerdictName, RiskMin, RiskMax)

---

## 8. Normalization

**Functional Dependencies (key FDs):**

- UserID → Name, Email, Role, PasswordHash, OperativeID, CreatedAt
- ScanID → UserID, FileHash, MediaType, Status, RiskScore, Confidence, VerdictID, ModelVersion, CreatedAt
- AuditID → UserID, Action, Resource, Timestamp
- NotificationID → UserID, Type, Message, IsRead, Timestamp
- EvidenceID → ScanID, FilePath, SHA256Hash, CreatedAt
- VerdictID → VerdictName, RiskMin, RiskMax

**Normalization Process:**

- **1NF**: All attributes contain atomic values; no repeating groups. Each table has a primary key.
- **2NF**: No partial dependencies. Non-key attributes (e.g., Name, Email, Role) depend fully on UserID; scan attributes depend fully on ScanID.
- **3NF**: No transitive dependencies. VerdictType is a reference table; role names are not duplicated.
- **BCNF (if applicable)**: Determinants are candidate keys. Applied where determinants (e.g., VerdictID) are unique identifiers.

**Final Normalized Table Structure:** The tables Users, Scans, AuditLogs, Notifications, EvidenceVault, and VerdictTypes (as defined in Section 7.2) constitute the final normalized schema.

---

## 9. Database Implementation

### 9.1 SQL Implementation

**DDL Commands:** CREATE, ALTER, DROP — used to define and modify tables (Users, Scans, AuditLogs, Notifications, EvidenceVault, VerdictTypes), indexes, and constraints.

**DML Commands:** INSERT, UPDATE, DELETE — used to add scan records, update status and verdict, insert audit entries, and delete records per retention policy.

**SELECT Queries:**

- **Joins**: Retrieve users with their scan history (Users ⋈ Scans), scans with verdict details (Scans ⋈ VerdictTypes)
- **Subqueries**: Nested queries for filtering (e.g., scans by user role, scans above a risk threshold)
- **Aggregate Functions**: COUNT, SUM, AVG for analytics (e.g., scan counts by verdict, average risk score)
- **GROUP BY, HAVING**: Group scans by verdict, media type, or date; filter groups with HAVING
- **Views**: `vw_scan_summary`, `vw_analyst_dashboard` for simplified querying and reporting

### 9.2 PL/SQL Components

- **Stored Procedures**: For scan submission (validate user, create scan, log audit) and evidence storage
- **Functions**: For upload quota check (`fn_can_user_upload`), scan status retrieval (`fn_get_scan_status`)
- **Triggers**: To prevent duplicate submissions (same file hash), automatically append to AuditLogs on insert/update
- **Cursors**: For report generation — iterate over scans with filters (date range, verdict) to build summaries
- **Exception Handling**: Custom handlers for constraint violations, deadlocks, invalid state transitions

---

## 10. Transaction Management & Concurrency

**Use of Transactions:**

- **COMMIT**: Persist changes after successful scan creation, evidence storage, or audit log insertion
- **ROLLBACK**: Undo all changes in the transaction on failure (e.g., constraint violation, storage error)
- **SAVEPOINT**: Create intermediate savepoints before multi-step operations; ROLLBACK TO SAVEPOINT on partial failure

**Ensuring ACID Properties:**

- **Atomicity**: Either all operations in a scan submission (insert scan, insert audit, update status) succeed or none do
- **Consistency**: Constraints (PK, FK, CHECK) ensure valid state before and after each transaction
- **Isolation**: Concurrent scan submissions do not see uncommitted data from other transactions
- **Durability**: Committed data persists despite system failure

**Concurrency Control (Optional):** Locks (row-level or table-level) prevent conflicting updates during concurrent scan status changes. Consistent read isolation avoids dirty reads when generating reports.

---

## 11. Tools & Technologies Used

- **DBMS Software**: Oracle / MySQL / PostgreSQL for implementing the relational schema and executing SQL queries
- **SQL**: For DDL, DML, DQL, stored procedures, triggers, cursors, and exception handling
- **Interface Tool**: SQL Developer / MySQL Workbench for schema design and query testing

---

## 12. Expected Outcomes

- Successful creation of a normalized database
- Efficient data retrieval using SQL queries
- Automation using triggers and procedures
- Improved data consistency and integrity

---



*End of Synopsis*
