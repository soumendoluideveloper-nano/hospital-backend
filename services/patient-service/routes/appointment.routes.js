/**
 * Appointment Routes (Patient-facing)
 * Base prefix: /api/patient
 */
const router     = require("express").Router();
const controller = require("../controllers/appointment.controller");
const auth       = require("../../../common/middleware/auth.middleware");

router.post  ("/appointments",             auth({ roles: ["patient"] }), controller.bookAppointment);
router.get   ("/appointments",             auth({ roles: ["patient"] }), controller.listAppointments);
router.get   ("/appointments/:id",         auth({ roles: ["patient"] }), controller.getAppointmentById);
router.patch ("/appointments/:id/cancel",  auth({ roles: ["patient"] }), controller.cancelAppointment);

router.post("/enquiries",  auth({ roles: ["patient"] }), controller.sendEnquiry);
router.get ("/enquiries",  auth({ roles: ["patient"] }), controller.listEnquiries);

module.exports = router;
