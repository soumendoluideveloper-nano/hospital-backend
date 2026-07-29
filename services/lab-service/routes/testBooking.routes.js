/**
 * Test Booking Routes
 * Base prefix: /api/lab
 */
const router     = require("express").Router();
const controller = require("../controllers/testBooking.controller");
const auth       = require("../../../common/middleware/auth.middleware");

// Patient
router.post ("/bookings",        auth({ roles: ["patient"] }), controller.bookTest);
router.get  ("/bookings/my",     auth({ roles: ["patient"] }), controller.myBookings);

// Clinic admin
router.get  ("/bookings",        auth({ roles: ["clinic"] }), controller.clinicBookings);
router.patch("/bookings/:id/status", auth({ roles: ["clinic"] }), controller.updateStatus);

module.exports = router;
