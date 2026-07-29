/**
 * Clinic Service  –  Port 4001
 * ============================================================
 * Manages all clinic-side operations:
 *   • Clinic profile management (for clinic admins)
 *   • Doctor CRUD
 *   • Doctor Schedule management
 *   • Appointment management (clinic view)
 *   • Enquiry management
 *   • Call Logs (clinic view)
 *   • Doctor & Clinic Reviews (read)
 *   • Public browsing endpoints (for patients — list clinics, doctors)
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
const PORT = process.env.CLINIC_SERVICE_PORT || 4001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "*", credentials: true }));
app.use("/uploads", express.static("public/uploads"));

// Mount routes
app.use("/api/clinic", routes);

// Health check
app.get("/health", (_req, res) =>
  res.json({ status: "ok", service: "clinic-service", port: PORT })
);

(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅  Clinic Service — DB connected");
    app.listen(PORT, () =>
      console.log(`🚀  Clinic Service running on http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error("❌  Clinic Service — DB error:", err.message);
    process.exit(1);
  }
})();
