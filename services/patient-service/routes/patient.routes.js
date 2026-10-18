/**
 * Patient Routes
 * Base prefix: /api/patient
 */
const router     = require("express").Router();
const controller = require("../controllers/patient.controller");
const auth       = require("../../../common/middleware/auth.middleware");
const { setFolder, upload } = require("../../../common/middleware/upload.middleware");

router.get("/profile",    auth({ roles: ["patient"] }), controller.getProfile);
router.put("/profile",
  auth({ roles: ["patient"] }),
  setFolder("profiles"),
  upload.single("profile_image"),
  controller.updateProfile
);
router.post("/push-token", auth({ roles: ["patient"] }), controller.savePushToken);
router.get("/notifications", auth({ roles: ["patient"] }), controller.getNotifications);
router.get("/notifications/unread-count", auth({ roles: ["patient"] }), controller.getUnreadCount);
router.put("/notifications/read-all", auth({ roles: ["patient"] }), controller.markNotificationsRead);
router.delete("/notifications", auth({ roles: ["patient"] }), controller.clearNotifications);

module.exports = router;
