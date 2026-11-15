require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env")
});
const db = require("../common/models");

const createTableSql = `
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
`;

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log("DB connected");
    await db.sequelize.query(createTableSql);
    console.log("✅ company_details table created successfully!");

    // Check existing columns and alter if needed
    const [columns] = await db.sequelize.query("SHOW COLUMNS FROM company_details");
    const columnNames = columns.map(c => c.Field);

    if (!columnNames.includes("privacy_policy")) {
      await db.sequelize.query("ALTER TABLE company_details ADD COLUMN privacy_policy LONGTEXT DEFAULT NULL AFTER about_us");
      console.log("✅ Added privacy_policy column to company_details");
    }

    if (!columnNames.includes("terms_and_conditions")) {
      await db.sequelize.query("ALTER TABLE company_details ADD COLUMN terms_and_conditions LONGTEXT DEFAULT NULL AFTER privacy_policy");
      console.log("✅ Added terms_and_conditions column to company_details");
    }

    // Check if a row exists, if not create default
    const [rows] = await db.sequelize.query("SELECT * FROM company_details LIMIT 1");
    if (!rows || rows.length === 0) {
      await db.sequelize.query(`
        INSERT INTO company_details (company_name, tagline, email, phone, city, state, country, pincode, website_url, about_us, footer_text, privacy_policy, terms_and_conditions)
        VALUES ('Health Spot Clinic', 'Your Trusted Healthcare Partner', 'contact@healthspot.com', '+91 9876543210', 'Kolkata', 'West Bengal', 'India', '700001', 'https://healthspot.com', 'Leading healthcare and multi-speciality clinic management system providing quality patient care and diagnostics.', '© 2026 Health Spot. All rights reserved.', '<p>Welcome to Health Spot. We are committed to protecting your privacy and confidential healthcare information.</p>', '<p>By accessing or using Health Spot platform and clinic services, you agree to these Terms and Conditions.</p>')
      `);
      console.log("✅ Default company details seeded!");
    } else {
      console.log("ℹ️ Company details record already exists.");
    }
    process.exit(0);
  } catch (err) {
    console.error("❌ Error initializing company_details:", err);
    process.exit(1);
  }
})();
