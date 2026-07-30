const Joi = require("joi");

// ── Step 1 ──────────────────────────────────────────────────────────
/**
 * Send OTP — clinic provides phone + password only
 */
exports.sendOtpSchema = Joi.object({
  phone: Joi.string().min(7).max(20).required()
  // ,password: Joi.string().min(6).required()
});

// ── Step 2 ──────────────────────────────────────────────────────────
/**
 * Verify OTP
 */
exports.verifyOtpSchema = Joi.object({
  phone: Joi.string().min(7).max(20).required(),
  otp: Joi.string().length(6).required()
});

// ── Step 3 ──────────────────────────────────────────────────────────
/**
 * Complete Clinic Profile — all details as JSON body
 */
exports.completeClinicSchema = Joi.object({
  name: Joi.string().min(2).max(150).required(),
  owner_name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  registration_no: Joi.string().max(100).required(),
  address: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  country: Joi.string().required(),
  has_lab: Joi.boolean().required(),
  latitude: Joi.number().optional(),
  longitude: Joi.number().optional(),
  description: Joi.string().optional().allow("", null)
});

// ── Login (unchanged) ────────────────────────────────────────────────
exports.clinicLoginSchema = Joi.object({
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
  password: Joi.string().required()
}).or("email", "phone");
