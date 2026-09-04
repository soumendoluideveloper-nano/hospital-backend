/**
 * Clinic Routes
 * Base prefix: /api/clinic
 */
const router     = require("express").Router();
const controller = require("../controllers/clinic.controller");
const auth       = require("../../../common/middleware/auth.middleware");
const { setFolder, upload } = require("../../../common/middleware/upload.middleware");

// ---- Public (patient-facing browsing) ----
router.get("/list",      controller.listClinics);
// router.get("/:id",       controller.getClinicById);

// ---- Clinic admin protected ----
router.get ("/dashboard",  auth({ roles: ["clinic"] }), controller.getDashboard);
router.put ("/profile",
  auth({ roles: ["clinic"] }),
  setFolder("logos"),
  upload.single("logo"),
  controller.updateProfile
);
router.put("/change-password",
  auth({ roles: ["clinic"] }),
  controller.changePassword
);

// Public clinic details (restricted to numeric IDs so it does not intercept /doctors, /enquiries, etc.)
router.get("/:id(\\d+)", controller.getClinicById);

module.exports = router;

