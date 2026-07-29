/**
 * Enquiry Routes (Clinic-side)
 */
const router     = require("express").Router();
const controller = require("../controllers/enquiry.controller");
const auth       = require("../../../common/middleware/auth.middleware");

router.get  ("/enquiries",           auth({ roles: ["clinic"] }), controller.listEnquiries);
router.patch("/enquiries/:id/reply", auth({ roles: ["clinic"] }), controller.replyEnquiry);
router.patch("/enquiries/:id/close", auth({ roles: ["clinic"] }), controller.closeEnquiry);

module.exports = router;
