-- =============================================================================
-- SENTINEL: Deepfake Detection & Authenticity Verification System
-- UCS310 - Database Management System
-- File: 01_schema.sql  |  DDL - Table Definitions & Constraints
-- =============================================================================

-- Use a fresh database
CREATE DATABASE IF NOT EXISTS sentinel_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sentinel_db;

-- Drop tables in reverse FK order (safe re-run)
DROP TABLE IF EXISTS EvidenceVault;
DROP TABLE IF EXISTS Notifications;
DROP TABLE IF EXISTS AuditLogs;
DROP TABLE IF EXISTS Scans;
DROP TABLE IF EXISTS VerdictTypes;
DROP TABLE IF EXISTS Users;

-- =============================================================================
-- TABLE 1: VerdictTypes  (lookup / reference table — satisfies 3NF)
-- Extracted to eliminate transitive dependency:
--   Scans.RiskScore → VerdictName  (was a transitive dep; now FK resolves it)
-- =============================================================================
CREATE TABLE VerdictTypes (
    VerdictID    INT           NOT NULL AUTO_INCREMENT,
    VerdictName  VARCHAR(20)   NOT NULL,
    RiskMin      DECIMAL(5,2)  NOT NULL,
    RiskMax      DECIMAL(5,2)  NOT NULL,

    CONSTRAINT pk_VerdictTypes    PRIMARY KEY (VerdictID),
    CONSTRAINT uq_VerdictName     UNIQUE (VerdictName),
    CONSTRAINT chk_RiskRange      CHECK (RiskMin >= 0 AND RiskMax <= 100 AND RiskMin < RiskMax),
    CONSTRAINT chk_ValidVerdict   CHECK (VerdictName IN ('DEEPFAKE', 'SUSPICIOUS', 'AUTHENTIC'))
);

-- =============================================================================
-- TABLE 2: Users
-- 1NF: All attributes atomic (Name kept as single field per synopsis schema)
-- No partial or transitive dependencies (single-column PK)
-- =============================================================================
CREATE TABLE Users (
    UserID        INT           NOT NULL AUTO_INCREMENT,
    Name          VARCHAR(100)  NOT NULL,
    Email         VARCHAR(255)  NOT NULL,
    Role          VARCHAR(20)   NOT NULL DEFAULT 'operative',
    PasswordHash  VARCHAR(255)  NOT NULL,
    OperativeID   VARCHAR(20)   NOT NULL,
    CreatedAt     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_Users         PRIMARY KEY (UserID),
    CONSTRAINT uq_Email         UNIQUE (Email),
    CONSTRAINT uq_OperativeID   UNIQUE (OperativeID),
    CONSTRAINT chk_Role         CHECK (Role IN ('admin', 'operative', 'analyst'))
);

-- =============================================================================
-- TABLE 3: Scans
-- VerdictID FK → VerdictTypes eliminates transitive dep RiskScore→VerdictName
-- UNIQUE(FileHash) enforces duplicate prevention at DB level (trigger backs this)
-- =============================================================================
CREATE TABLE Scans (
    ScanID        INT            NOT NULL AUTO_INCREMENT,
    UserID        INT            NOT NULL,
    FileHash      VARCHAR(64)    NOT NULL,
    MediaType     VARCHAR(10)    NOT NULL,
    Status        VARCHAR(15)    NOT NULL DEFAULT 'PENDING',
    RiskScore     DECIMAL(5,2)   NULL,
    Confidence    DECIMAL(5,2)   NULL,
    VerdictID     INT            NULL,
    ModelVersion  VARCHAR(20)    NULL,
    CreatedAt     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_Scans           PRIMARY KEY (ScanID),
    CONSTRAINT uq_FileHash        UNIQUE (FileHash),
    CONSTRAINT fk_Scans_User      FOREIGN KEY (UserID)    REFERENCES Users(UserID)        ON DELETE CASCADE,
    CONSTRAINT fk_Scans_Verdict   FOREIGN KEY (VerdictID) REFERENCES VerdictTypes(VerdictID) ON DELETE SET NULL,
    CONSTRAINT chk_MediaType      CHECK (MediaType IN ('VIDEO', 'AUDIO', 'IMAGE', 'UNKNOWN')),
    CONSTRAINT chk_Status         CHECK (Status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    CONSTRAINT chk_RiskScore      CHECK (RiskScore IS NULL OR (RiskScore >= 0 AND RiskScore <= 100)),
    CONSTRAINT chk_Confidence     CHECK (Confidence IS NULL OR (Confidence >= 0 AND Confidence <= 100))
);

-- =============================================================================
-- TABLE 4: AuditLogs
-- Records every significant user action for compliance and traceability
-- =============================================================================
CREATE TABLE AuditLogs (
    AuditID    INT           NOT NULL AUTO_INCREMENT,
    UserID     INT           NOT NULL,
    Action     VARCHAR(100)  NOT NULL,
    Resource   VARCHAR(100)  NOT NULL,
    Timestamp  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_AuditLogs       PRIMARY KEY (AuditID),
    CONSTRAINT fk_AuditLogs_User  FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);

-- =============================================================================
-- TABLE 5: Notifications
-- IsRead defaults to FALSE; Timestamp auto-set on insert
-- =============================================================================
CREATE TABLE Notifications (
    NotificationID  INT           NOT NULL AUTO_INCREMENT,
    UserID          INT           NOT NULL,
    Type            VARCHAR(50)   NOT NULL,
    Message         TEXT          NOT NULL,
    IsRead          BOOLEAN       NOT NULL DEFAULT FALSE,
    Timestamp       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_Notifications       PRIMARY KEY (NotificationID),
    CONSTRAINT fk_Notifications_User  FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    CONSTRAINT chk_NotifType          CHECK (Type IN (
        'scan_complete', 'scan_failed', 'deepfake_detected',
        'user_mention', 'comment', 'share', 'system'
    ))
);

-- =============================================================================
-- TABLE 6: EvidenceVault
-- Separate entity per synopsis (not embedded in Scans)
-- SHA256Hash unique — prevents duplicate evidence storage
-- =============================================================================
CREATE TABLE EvidenceVault (
    EvidenceID   INT           NOT NULL AUTO_INCREMENT,
    ScanID       INT           NOT NULL,
    FilePath     VARCHAR(500)  NOT NULL,
    SHA256Hash   VARCHAR(64)   NOT NULL,
    CreatedAt    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_EvidenceVault        PRIMARY KEY (EvidenceID),
    CONSTRAINT uq_SHA256Hash           UNIQUE (SHA256Hash),
    CONSTRAINT fk_EvidenceVault_Scan   FOREIGN KEY (ScanID) REFERENCES Scans(ScanID) ON DELETE CASCADE
);

-- =============================================================================
-- INDEXES (performance for common query patterns)
-- =============================================================================
CREATE INDEX idx_Scans_UserID    ON Scans(UserID);
CREATE INDEX idx_Scans_VerdictID ON Scans(VerdictID);
CREATE INDEX idx_Scans_Status    ON Scans(Status);
CREATE INDEX idx_Scans_CreatedAt ON Scans(CreatedAt);
CREATE INDEX idx_AuditLogs_UserID    ON AuditLogs(UserID);
CREATE INDEX idx_AuditLogs_Timestamp ON AuditLogs(Timestamp);
CREATE INDEX idx_Notifications_UserID ON Notifications(UserID);
CREATE INDEX idx_Notifications_IsRead ON Notifications(IsRead);
CREATE INDEX idx_EvidenceVault_ScanID ON EvidenceVault(ScanID);

-- =============================================================================
-- NORMALIZATION PROOF SUMMARY
-- -----------------------------------------------------------------------------
-- 1NF: All columns hold atomic, single-valued data. No repeating groups.
--      (Name is one field; verdict info is in VerdictTypes, not repeated strings)
--
-- 2NF: All non-key attributes fully depend on the single-column PK.
--      (No composite PKs exist, so 2NF is trivially satisfied)
--
-- 3NF: No transitive dependencies.
--      BEFORE: Scans had VerdictName, RiskMin, RiskMax → transitive on RiskScore
--      AFTER:  VerdictTypes table holds these; Scans.VerdictID is just a FK
--              Thus: ScanID → VerdictID → VerdictName (via FK, not transitive dep)
--
-- BCNF: Every determinant is a candidate key.
--       VerdictTypes: VerdictID → all attributes (PK); VerdictName → all (unique)
--       Users: UserID → all; Email → all (unique); OperativeID → all (unique)
--       All tables satisfy BCNF.
-- =============================================================================
