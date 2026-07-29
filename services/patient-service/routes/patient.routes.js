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
router.get("/notifications", auth({ roles: ["patient"] }), controller.getNotifications);

module.exports = router;
