/**
 * Admin Auth Routes
 * Base: /api/auth/admin
 */
const router     = require("express").Router();
const controller = require("../controllers/admin.auth.controller");
const auth       = require("../../../common/middleware/auth.middleware");

// Public
router.post("/admin/login", controller.login);

// Protected
router.get("/admin/profile", auth({ roles: ["superadmin"] }), controller.getProfile);

module.exports = router;
