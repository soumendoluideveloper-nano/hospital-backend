/**
 * Admin Service  –  Port 4004
 * ============================================================
 * Super Admin operations:
 *   • Platform dashboard (summary stats)
 *   • Clinic management (list, activate/deactivate)
 *   • Patient management (list, activate/deactivate)
 *   • Banner management (CRUD)
 *   • Global notifications (broadcast)
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
const PORT = process.env.ADMIN_SERVICE_PORT || 4004;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "*", credentials: true }));
app.use("/uploads", express.static("public/uploads"));

app.use("/api/admin", routes);

app.get("/health", (_req, res) =>
  res.json({ status: "ok", service: "admin-service", port: PORT })
);

(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅  Admin Service — DB connected");
    app.listen(PORT, () =>
      console.log(`🚀  Admin Service running on http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error("❌  Admin Service — DB error:", err.message);
    process.exit(1);
  }
})();
