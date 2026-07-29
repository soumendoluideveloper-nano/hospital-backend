/**
 * Patient Service  –  Port 4002
 * ============================================================
 * Manages patient-side operations:
 *   • Patient profile update & image upload
 *   • Appointment booking, listing, cancellation
 *   • Enquiry submission
 *   • Doctor & Clinic reviews
 *   • Notification listing
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
const PORT = process.env.PATIENT_SERVICE_PORT || 4002;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "*", credentials: true }));
app.use("/uploads", express.static("public/uploads"));

app.use("/api/patient", routes);

app.get("/health", (_req, res) =>
  res.json({ status: "ok", service: "patient-service", port: PORT })
);

(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅  Patient Service — DB connected");
    app.listen(PORT, () =>
      console.log(`🚀  Patient Service running on http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error("❌  Patient Service — DB error:", err.message);
    process.exit(1);
  }
})();
