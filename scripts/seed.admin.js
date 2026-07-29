/**
 * =============================================================
 * Seed Script — Create Default Super Admin
 * =============================================================
 * Run once after database setup:
 *   node scripts/seed.admin.js
 *
 * Default credentials:
 *   Email:    admin@clinic.com
 *   Password: Admin@1234
 * =============================================================
 */

require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env")
});

const bcrypt = require("bcryptjs");
const db     = require("../common/models");

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log("✅  DB connected");

    const email    = "admin@clinic.com";
    const password = "Admin@1234";

    const exists = await db.SuperAdmin.findOne({ where: { email } });
    if (exists) {
      console.log("⚠️  Super admin already exists:", email);
      process.exit(0);
    }

    const hashed = await bcrypt.hash(password, 10);
    await db.SuperAdmin.create({
      name:   "Super Admin",
      email,
      password: hashed,
      phone:  "9000000000",
      status: "Active"
    });

    console.log("🎉  Super Admin created successfully!");
    console.log("     Email   :", email);
    console.log("     Password:", password);
    process.exit(0);
  } catch (err) {
    console.error("❌  Seed failed:", err.message);
    process.exit(1);
  }
})();
