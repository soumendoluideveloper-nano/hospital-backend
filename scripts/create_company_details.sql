-- =============================================================
-- Company Details Master Table
-- =============================================================

USE clinic_management;

CREATE TABLE IF NOT EXISTS company_details (
    id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_name      VARCHAR(255) NOT NULL DEFAULT 'Health Spot Clinic',
    tagline           VARCHAR(255) DEFAULT 'Your Trusted Healthcare Partner',
    email             VARCHAR(150) DEFAULT 'contact@healthspot.com',
    phone             VARCHAR(50) DEFAULT '+91 9876543210',
    alternate_phone   VARCHAR(50) DEFAULT NULL,
    address           TEXT,
    city              VARCHAR(100) DEFAULT 'Kolkata',
    state             VARCHAR(100) DEFAULT 'West Bengal',
    country           VARCHAR(100) DEFAULT 'India',
    pincode           VARCHAR(20) DEFAULT '700001',
    website_url       VARCHAR(255) DEFAULT 'https://healthspot.com',
    map_link          TEXT,
    facebook_url      VARCHAR(255) DEFAULT NULL,
    twitter_url       VARCHAR(255) DEFAULT NULL,
    instagram_url     VARCHAR(255) DEFAULT NULL,
    linkedin_url      VARCHAR(255) DEFAULT NULL,
    youtube_url       VARCHAR(255) DEFAULT NULL,
    whatsapp_no       VARCHAR(50) DEFAULT NULL,
    logo              VARCHAR(255) DEFAULT NULL,
    favicon           VARCHAR(255) DEFAULT NULL,
    footer_text       TEXT,
    about_us          TEXT,
    privacy_policy    LONGTEXT,
    terms_and_conditions LONGTEXT,
    status            ENUM('Active','Inactive') DEFAULT 'Active',
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
