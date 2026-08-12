/**
 * Doctor Routes
 * Base prefix: /api/clinic/doctors
 */
const router     = require("express").Router();
const controller = require("../controllers/doctor.controller");
const auth       = require("../../../common/middleware/auth.middleware");

// ---- Public ----
router.get("/doctors/public/:clinicId", controller.listPublicDoctors);
router.get("/doctors/:id",             controller.getDoctorById);

// ---- Clinic admin ----
router.post("/doctors",
  auth({ roles: ["clinic"] }),
  controller.addDoctor
);
router.get   ("/doctors",     auth({ roles: ["clinic"] }), controller.listDoctors);
router.put   ("/doctors/:id",
  auth({ roles: ["clinic"] }),
  controller.updateDoctor
);
router.delete("/doctors/:id", auth({ roles: ["clinic"] }), controller.removeDoctor);

module.exports = router;
