/**
 * Lab Report Routes
 * Base prefix: /api/lab
 */
const router     = require("express").Router();
const controller = require("../controllers/labReport.controller");
const auth       = require("../../../common/middleware/auth.middleware");
const { setFolder, upload } = require("../../../common/middleware/upload.middleware");

// Clinic uploads report
router.post("/reports/:bookingId",
  auth({ roles: ["clinic"] }),
  setFolder("reports"),
  upload.single("report_file"),
  controller.uploadReport
);

// Patient downloads report
router.get("/reports/:bookingId",
  auth({ roles: ["patient"] }),
  controller.getReport
);

module.exports = router;
