-- =============================================================
-- Migration: Add missing 'token' columns to existing tables
-- Run this if you already had tables from the original schema.
-- =============================================================

USE clinic_management;

-- Add token to super_admins (if not exists)
SET @col = (SELECT COUNT(*) FROM information_schema.columns
            WHERE table_schema='clinic_management' AND table_name='super_admins' AND column_name='token');
SET @sql = IF(@col=0, 'ALTER TABLE super_admins ADD COLUMN token TEXT AFTER phone', 'SELECT "token already exists in super_admins"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add token to clinics (if not exists)
SET @col = (SELECT COUNT(*) FROM information_schema.columns
            WHERE table_schema='clinic_management' AND table_name='clinics' AND column_name='token');
SET @sql = IF(@col=0, 'ALTER TABLE clinics ADD COLUMN token TEXT AFTER phone', 'SELECT "token already exists in clinics"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add token to patients (if not exists)
SET @col = (SELECT COUNT(*) FROM information_schema.columns
            WHERE table_schema='clinic_management' AND table_name='patients' AND column_name='token');
SET @sql = IF(@col=0, 'ALTER TABLE patients ADD COLUMN token TEXT AFTER password', 'SELECT "token already exists in patients"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add notes to appointments (if not exists)
SET @col = (SELECT COUNT(*) FROM information_schema.columns
            WHERE table_schema='clinic_management' AND table_name='appointments' AND column_name='notes');
SET @sql = IF(@col=0, 'ALTER TABLE appointments ADD COLUMN notes TEXT AFTER reason', 'SELECT "notes already exists in appointments"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add reply to enquiries (if not exists)
SET @col = (SELECT COUNT(*) FROM information_schema.columns
            WHERE table_schema='clinic_management' AND table_name='enquiries' AND column_name='reply');
SET @sql = IF(@col=0, 'ALTER TABLE enquiries ADD COLUMN reply TEXT AFTER message', 'SELECT "reply already exists in enquiries"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT 'Migration complete! All columns added.' AS status;
