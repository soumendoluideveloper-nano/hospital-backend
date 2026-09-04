/**
 * Doctor Routes
 * Base prefix: /api/clinic/doctors
 */
const router     = require("express").Router();
const controller = require("../controllers/doctor.controller");
const auth       = require("../../../common/middleware/auth.middleware");
const validate   = require("../../../common/middleware/validate.middleware");
const { addDoctorSchema, updateDoctorSchema } = require("../validation/doctor.validation");

// ---- Clinic admin ----
router.get   ("/doctors",     auth({ roles: ["clinic"] }), controller.listDoctors);
router.post  ("/doctors",     auth({ roles: ["clinic"] }), validate(addDoctorSchema),    controller.addDoctor);
router.put   ("/doctors/:id(\\d+)", auth({ roles: ["clinic"] }), validate(updateDoctorSchema), controller.updateDoctor);
router.delete("/doctors/:id(\\d+)", auth({ roles: ["clinic"] }), controller.removeDoctor);

// ---- Public ----
router.get("/doctors/public",               controller.listAllPublicDoctors);
router.get("/doctors/public/:clinicId(\\d+)", controller.listPublicDoctors);
router.get("/doctors/:id(\\d+)",            controller.getDoctorById);

module.exports = router;
