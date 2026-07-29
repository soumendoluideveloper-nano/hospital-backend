/**
 * Patient Auth Routes
 * Base: /api/auth/patient
 *
 * Registration (3 steps):
 *   1. POST /patient/send-otp         → { phone, password }
 *   2. POST /patient/verify-otp       → { phone, otp }  → temp_token
 *   3. POST /patient/complete-profile → JSON body + Bearer temp_token
 *
 * Login:
 *   POST /patient/login               → { phone | email, password }
 *
 * Profile:
 *   GET  /patient/profile             → Bearer full_token
 */
const router     = require("express").Router();
const controller = require("../controllers/patient.auth.controller");
const auth       = require("../../../common/middleware/auth.middleware");

// ── Registration flow (all public, step 3 uses temp token) ──────────
router.post("/patient/send-otp",         controller.sendOtp);
router.post("/patient/verify-otp",       controller.verifyOtp);
router.post("/patient/complete-profile",
  auth({ roles: ["pending_patient"] }),
  controller.completeProfile
);

// ── Login ────────────────────────────────────────────────────────────
router.post("/patient/login", controller.login);

// ── Profile (fully registered patient) ──────────────────────────────
router.get("/patient/profile", auth({ roles: ["patient"] }), controller.getProfile);

module.exports = router;
