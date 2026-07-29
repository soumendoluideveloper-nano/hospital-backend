-- =============================================================
-- Migration: Add OTP Verifications table
-- Run: C:\xampp\mysql\bin\mysql.exe -u root < scripts/migrate_otp.sql
-- =============================================================

USE clinic_management;

CREATE TABLE IF NOT EXISTS otp_verifications (
    id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    phone      VARCHAR(20) NOT NULL,
    password   VARCHAR(255) NOT NULL        COMMENT 'Bcrypt-hashed password stored temporarily',
    otp        VARCHAR(6) NOT NULL          COMMENT '6-digit OTP code',
    type       ENUM('patient','clinic') NOT NULL COMMENT 'Which actor is registering',
    is_used    BOOLEAN DEFAULT FALSE        COMMENT 'Marked true once verified',
    expires_at DATETIME NOT NULL            COMMENT 'OTP validity window (10 minutes)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_verifications(phone, type);

SELECT 'OTP verifications table created.' AS status;
