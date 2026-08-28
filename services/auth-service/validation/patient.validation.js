const Joi = require("joi");

// ── Step 1 ──────────────────────────────────────────────────────────
/**
 * Send OTP — patient provides phone (password optional at step 1)
 */
exports.sendOtpSchema = Joi.object({
  phone:    Joi.string().min(7).max(20).required(),
  password: Joi.string().min(6).optional().allow("", null)
});

// ── Step 2 ──────────────────────────────────────────────────────────
/**
 * Verify OTP — patient submits the 6-digit code
 */
exports.verifyOtpSchema = Joi.object({
  phone: Joi.string().min(7).max(20).required(),
  otp:   Joi.string().length(6).required()
});

// ── Step 3 ──────────────────────────────────────────────────────────
/**
 * Complete Profile — patient details + password (if not provided in step 1)
 */
exports.completePatientSchema = Joi.object({
  name:        Joi.string().min(2).max(100).required(),
  password:    Joi.string().min(6).optional().allow("", null),
  email:       Joi.string().email().optional().allow("", null),
  gender:      Joi.string().valid("Male", "Female", "Other").optional(),
  dob:         Joi.date().iso().optional(),
  blood_group: Joi.string().max(5).optional(),
  address:     Joi.string().optional().allow("", null),
  city:        Joi.string().optional().allow("", null),
  state:       Joi.string().optional().allow("", null),
  country:     Joi.string().optional().allow("", null)
});

// ── Login (unchanged) ────────────────────────────────────────────────
exports.patientLoginSchema = Joi.object({
  email:    Joi.string().email().optional(),
  phone:    Joi.string().optional(),
  password: Joi.string().required()
}).or("email", "phone");
