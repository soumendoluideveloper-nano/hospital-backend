/**
 * Notification Routes (Super Admin)
 */
const router     = require("express").Router();
const controller = require("../controllers/notification.controller");
const auth       = require("../../../common/middleware/auth.middleware");

const isAdmin = auth({ roles: ["superadmin"] });

router.post("/notifications/send", isAdmin, controller.sendNotification);
router.get ("/notifications",      isAdmin, controller.listNotifications);

module.exports = router;
