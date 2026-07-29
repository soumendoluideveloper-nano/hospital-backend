/**
 * Appointment Routes (Clinic-side)
 * Base prefix: /api/clinic/appointments
 */
const router     = require("express").Router();
const controller = require("../controllers/appointment.controller");
const auth       = require("../../../common/middleware/auth.middleware");

router.get  ("/appointments",               auth({ roles: ["clinic"] }), controller.listAppointments);
router.get  ("/appointments/:id",           auth({ roles: ["clinic"] }), controller.getAppointmentById);
router.patch("/appointments/:id/status",    auth({ roles: ["clinic"] }), controller.updateStatus);

module.exports = router;
