-- =============================================================
-- Clinic Management System — Complete Database Setup
-- MySQL 8.0
-- Run this file once to create all tables.
-- =============================================================

CREATE DATABASE IF NOT EXISTS clinic_management;
USE clinic_management;

SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================
-- 1. SUPER ADMINS
-- =============================================================
CREATE TABLE IF NOT EXISTS super_admins (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(150) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    phone       VARCHAR(20),
    token       TEXT,
    status      ENUM('Active','Inactive') DEFAULT 'Active',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================================
-- 2. CLINICS
-- =============================================================
CREATE TABLE IF NOT EXISTS clinics (
    id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name             VARCHAR(150) NOT NULL,
    owner_name       VARCHAR(100) NOT NULL,
    email            VARCHAR(150) NOT NULL UNIQUE,
    phone            VARCHAR(20),
    password         VARCHAR(255) NOT NULL,
    token            TEXT,
    logo             VARCHAR(255),
    registration_no  VARCHAR(100),
    address          TEXT,
    city             VARCHAR(100),
    state            VARCHAR(100),
    country          VARCHAR(100),
    latitude         DECIMAL(10,8),
    longitude        DECIMAL(11,8),
    description      TEXT,
    has_lab          BOOLEAN DEFAULT FALSE,
    profile_views    INT UNSIGNED DEFAULT 0,
    status           ENUM('Active','Inactive') DEFAULT 'Active',
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================================
-- 3. PATIENTS
-- =============================================================
CREATE TABLE IF NOT EXISTS patients (
    id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(150) UNIQUE,
    phone         VARCHAR(20) UNIQUE,
    password      VARCHAR(255) NOT NULL,
    token         TEXT,
    gender        ENUM('Male','Female','Other'),
    dob           DATE,
    blood_group   VARCHAR(5),
    address       TEXT,
    city          VARCHAR(100),
    state         VARCHAR(100),
    country       VARCHAR(100),
    profile_image VARCHAR(255),
    status        ENUM('Active','Inactive') DEFAULT 'Active',
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================================
-- 4. DOCTORS
-- =============================================================
CREATE TABLE IF NOT EXISTS doctors (
    id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    clinic_id        BIGINT UNSIGNED NOT NULL,
    name             VARCHAR(100) NOT NULL,
    email            VARCHAR(150),
    phone            VARCHAR(20),
    specialization   VARCHAR(150),
    qualification    VARCHAR(255),
    experience       INT DEFAULT 0,
    consultation_fee DECIMAL(10,2),
    profile_image    VARCHAR(255),
    about            TEXT,
    status           ENUM('Active','Inactive') DEFAULT 'Active',
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_doctor_clinic
        FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
);

-- =============================================================
-- 5. DOCTOR SCHEDULE
-- =============================================================
CREATE TABLE IF NOT EXISTS doctor_schedule (
    id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    doctor_id     BIGINT UNSIGNED NOT NULL,
    day           ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'),
    start_time    TIME NOT NULL,
    end_time      TIME NOT NULL,
    slot_duration INT NOT NULL COMMENT 'Minutes per appointment slot',
    is_available  BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_schedule_doctor
        FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);

-- =============================================================
-- 6. APPOINTMENTS
-- =============================================================
CREATE TABLE IF NOT EXISTS appointments (
    id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    patient_id       BIGINT UNSIGNED NOT NULL,
    clinic_id        BIGINT UNSIGNED NOT NULL,
    doctor_id        BIGINT UNSIGNED NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status           ENUM('Pending','Confirmed','Completed','Cancelled','Rejected') DEFAULT 'Pending',
    reason           TEXT,
    notes            TEXT,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (clinic_id)  REFERENCES clinics(id)  ON DELETE CASCADE,
    FOREIGN KEY (doctor_id)  REFERENCES doctors(id)  ON DELETE CASCADE
);

-- =============================================================
-- 7. ENQUIRIES
-- =============================================================
CREATE TABLE IF NOT EXISTS enquiries (
    id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT UNSIGNED NOT NULL,
    clinic_id  BIGINT UNSIGNED NOT NULL,
    doctor_id  BIGINT UNSIGNED NULL,
    message    TEXT NOT NULL,
    reply      TEXT,
    status     ENUM('Pending','Answered','Closed') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (clinic_id)  REFERENCES clinics(id)  ON DELETE CASCADE,
    FOREIGN KEY (doctor_id)  REFERENCES doctors(id)  ON DELETE SET NULL
);

-- =============================================================
-- 8. CALL LOGS
-- =============================================================
CREATE TABLE IF NOT EXISTS call_logs (
    id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT UNSIGNED NOT NULL,
    clinic_id  BIGINT UNSIGNED NOT NULL,
    doctor_id  BIGINT UNSIGNED NOT NULL,
    call_type  ENUM('Audio','Video') DEFAULT 'Audio',
    duration   INT DEFAULT 0 COMMENT 'Seconds',
    status     ENUM('Missed','Completed','Rejected') DEFAULT 'Completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (clinic_id)  REFERENCES clinics(id)  ON DELETE CASCADE,
    FOREIGN KEY (doctor_id)  REFERENCES doctors(id)  ON DELETE CASCADE
);

-- =============================================================
-- 9. LAB TESTS
-- =============================================================
CREATE TABLE IF NOT EXISTS lab_tests (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    clinic_id       BIGINT UNSIGNED NOT NULL,
    test_name       VARCHAR(150) NOT NULL,
    description     TEXT,
    price           DECIMAL(10,2),
    report_duration VARCHAR(100),
    status          ENUM('Active','Inactive') DEFAULT 'Active',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
);

-- =============================================================
-- 10. TEST BOOKINGS
-- =============================================================
CREATE TABLE IF NOT EXISTS test_bookings (
    id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    patient_id   BIGINT UNSIGNED NOT NULL,
    clinic_id    BIGINT UNSIGNED NOT NULL,
    lab_test_id  BIGINT UNSIGNED NOT NULL,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    status       ENUM('Pending','Collected','Processing','Completed','Cancelled') DEFAULT 'Pending',
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (patient_id)  REFERENCES patients(id)  ON DELETE CASCADE,
    FOREIGN KEY (clinic_id)   REFERENCES clinics(id)   ON DELETE CASCADE,
    FOREIGN KEY (lab_test_id) REFERENCES lab_tests(id) ON DELETE CASCADE
);

-- =============================================================
-- 11. LAB REPORTS
-- =============================================================
CREATE TABLE IF NOT EXISTS lab_reports (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    booking_id  BIGINT UNSIGNED NOT NULL UNIQUE,
    report_file VARCHAR(255),
    remarks     TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (booking_id) REFERENCES test_bookings(id) ON DELETE CASCADE
);

-- =============================================================
-- 12. DOCTOR REVIEWS
-- =============================================================
CREATE TABLE IF NOT EXISTS doctor_reviews (
    id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    doctor_id  BIGINT UNSIGNED NOT NULL,
    patient_id BIGINT UNSIGNED NOT NULL,
    rating     TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review     TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (doctor_id)  REFERENCES doctors(id)  ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- =============================================================
-- 13. CLINIC REVIEWS
-- =============================================================
CREATE TABLE IF NOT EXISTS clinic_reviews (
    id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    clinic_id  BIGINT UNSIGNED NOT NULL,
    patient_id BIGINT UNSIGNED NOT NULL,
    rating     TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review     TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (clinic_id)  REFERENCES clinics(id)  ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- =============================================================
-- 14. NOTIFICATIONS
-- =============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    receiver_type ENUM('Patient','Clinic','SuperAdmin') NOT NULL,
    receiver_id   BIGINT UNSIGNED NOT NULL,
    title         VARCHAR(255),
    message       TEXT,
    is_read       BOOLEAN DEFAULT FALSE,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================
-- 15. BANNERS
-- =============================================================
CREATE TABLE IF NOT EXISTS banners (
    id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title        VARCHAR(255),
    image        VARCHAR(255),
    redirect_url VARCHAR(255),
    status       ENUM('Active','Inactive') DEFAULT 'Active',
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

-- =============================================================
-- INDEXES
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_doctors_clinic       ON doctors(clinic_id);
CREATE INDEX IF NOT EXISTS idx_schedule_doctor      ON doctor_schedule(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointment_patient  ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointment_doctor   ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_labtest_clinic       ON lab_tests(clinic_id);
CREATE INDEX IF NOT EXISTS idx_booking_patient      ON test_bookings(patient_id);
CREATE INDEX IF NOT EXISTS idx_booking_labtest      ON test_bookings(lab_test_id);
CREATE INDEX IF NOT EXISTS idx_notification_receiver ON notifications(receiver_type, receiver_id);
CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_verifications(phone, type);

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Database setup complete! All 15 tables created.' AS status;
