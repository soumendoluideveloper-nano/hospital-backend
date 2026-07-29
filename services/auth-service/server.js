/**
 * Auth Service  –  Port 4000
 * ============================================================
 * Handles registration and login for all three actor types:
 *
 *   Patient Registration (3-step OTP flow):
 *     POST /api/auth/patient/send-otp
 *     POST /api/auth/patient/verify-otp
 *     POST /api/auth/patient/complete-profile
 *   Patient Login:
 *     POST /api/auth/patient/login
 *
 *   Clinic Registration (3-step OTP flow):
 *     POST /api/auth/clinic/send-otp
 *     POST /api/auth/clinic/verify-otp
 *     POST /api/auth/clinic/complete-profile
 *   Clinic Login:
 *     POST /api/auth/clinic/login
 *
 *   Super Admin:
 *     POST /api/auth/admin/login
 * ============================================================
 */

require("dotenv").config({
  path: require("path").resolve(__dirname, "../../.env")
});

const express    = require("express");
const cors       = require("cors");
const { sequelize } = require("../../common/models");
const routes     = require("./routes");

const app  = express();
const PORT = process.env.AUTH_SERVICE_PORT || 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "*", credentials: true }));

// Static file serving for uploads
app.use("/uploads", express.static("public/uploads"));

// Mount all auth routes
app.use("/api/auth", routes);

// Health check
app.get("/health", (_req, res) =>
  res.json({ status: "ok", service: "auth-service", port: PORT })
);

// Boot
(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅  Auth Service — DB connected");
    app.listen(PORT, () =>
      console.log(`🚀  Auth Service running on http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error("❌  Auth Service — DB error:", err.message);
    process.exit(1);
  }
})();
