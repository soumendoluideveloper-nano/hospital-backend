/**
 * Clinic Auth Routes
 * Base: /api/auth/clinic
 *
 * Registration (3 steps):
 *   1. POST /clinic/send-otp         → { phone, password }
 *   2. POST /clinic/verify-otp       → { phone, otp }  → temp_token
 *   3. POST /clinic/complete-profile → JSON body + Bearer temp_token
 *
 * Login:
 *   POST /clinic/login               → { phone | email, password }
 *
 * Profile:
 *   GET  /clinic/profile             → Bearer full_token
 */
const router     = require("express").Router();
const controller = require("../controllers/clinic.auth.controller");
const auth       = require("../../../common/middleware/auth.middleware");

// ── Registration flow ────────────────────────────────────────────────
router.post("/clinic/send-otp",         controller.sendOtp);
router.post("/clinic/verify-otp",       controller.verifyOtp);
router.post("/clinic/complete-profile",
  // auth({ roles: ["pending_clinic"] }),
  controller.completeProfile
);

// ── Login ────────────────────────────────────────────────────────────
router.post("/clinic/login", controller.login);

// ── Profile ──────────────────────────────────────────────────────────
router.get("/clinic/profile", auth({ roles: ["clinic"] }), controller.getProfile);

module.exports = router;
