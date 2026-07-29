/**
 * Call Log Routes (Clinic-side)
 */
const router     = require("express").Router();
const controller = require("../controllers/callLog.controller");
const auth       = require("../../../common/middleware/auth.middleware");

router.get ("/call-logs", auth({ roles: ["clinic"] }),  controller.listCallLogs);
router.post("/call-logs", auth({ roles: ["patient"] }), controller.createCallLog);

module.exports = router;
