/**
 * Lab Service  –  Port 4003
 * ============================================================
 * Manages all lab-related operations:
 *   • Lab test catalogue (clinic manages tests)
 *   • Test bookings (patients book)
 *   • Lab reports (clinic uploads)
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
const PORT = process.env.LAB_SERVICE_PORT || 4003;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "*", credentials: true }));
app.use("/uploads", express.static("public/uploads"));

app.use("/api/lab", routes);

app.get("/health", (_req, res) =>
  res.json({ status: "ok", service: "lab-service", port: PORT })
);

(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅  Lab Service — DB connected");
    app.listen(PORT, () =>
      console.log(`🚀  Lab Service running on http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error("❌  Lab Service — DB error:", err.message);
    process.exit(1);
  }
})();
