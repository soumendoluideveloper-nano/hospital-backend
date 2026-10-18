/**
 * Schedule Routes
 * Base prefix: /api/clinic
 */
const router     = require("express").Router();
const controller = require("../controllers/schedule.controller");
const auth       = require("../../../common/middleware/auth.middleware");
const validate   = require("../../../common/middleware/validate.middleware");
const { addScheduleSchema, updateScheduleSchema, saveWeeklyScheduleSchema } = require("../validation/doctor.validation");

// Public — patients can read available slots
router.get ("/doctors/:doctorId/schedules", controller.getSchedules);

// Clinic admin
router.get   ("/schedules/today",              auth({ roles: ["clinic"] }), controller.getTodaySchedules);
router.post  ("/doctors/:doctorId/schedules", auth({ roles: ["clinic"] }), validate(addScheduleSchema),        controller.addSchedule);
router.put   ("/doctors/:doctorId/schedules", auth({ roles: ["clinic"] }), validate(saveWeeklyScheduleSchema), controller.saveWeeklySchedule);
router.put   ("/schedules/:id",               auth({ roles: ["clinic"] }), validate(updateScheduleSchema),     controller.updateSchedule);
router.delete("/schedules/:id",               auth({ roles: ["clinic"] }),                                      controller.deleteSchedule);

module.exports = router;
