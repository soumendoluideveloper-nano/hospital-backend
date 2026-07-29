/**
 * Schedule Routes
 * Base prefix: /api/clinic
 */
const router     = require("express").Router();
const controller = require("../controllers/schedule.controller");
const auth       = require("../../../common/middleware/auth.middleware");

// Public — patients can read available slots
router.get ("/doctors/:doctorId/schedules", controller.getSchedules);

// Clinic admin
router.post  ("/doctors/:doctorId/schedules", auth({ roles: ["clinic"] }), controller.addSchedule);
router.put   ("/schedules/:id",              auth({ roles: ["clinic"] }), controller.updateSchedule);
router.delete("/schedules/:id",              auth({ roles: ["clinic"] }), controller.deleteSchedule);

module.exports = router;
