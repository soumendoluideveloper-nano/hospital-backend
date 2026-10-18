/**
 * Enquiry Routes (Clinic-side)
 */
const router     = require("express").Router();
const controller = require("../controllers/enquiry.controller");
const auth       = require("../../../common/middleware/auth.middleware");

// Clinic authenticated routes
router.get   ("/enquiries",            auth({ roles: ["clinic"] }), controller.listEnquiries);
router.get   ("/enquiries/:id",        auth({ roles: ["clinic"] }), controller.getEnquiryById);
router.post  ("/enquiries/:id/accept", auth({ roles: ["clinic"] }), controller.acceptEnquiry);
router.post  ("/enquiries/:id/cancel", auth({ roles: ["clinic"] }), controller.cancelEnquiry);
router.patch ("/enquiries/:id/status", auth({ roles: ["clinic"] }), controller.updateStatus);

// Public / Patient lead logging
router.post  ("/enquiries/log-call", controller.logCallEnquiry);

module.exports = router;
