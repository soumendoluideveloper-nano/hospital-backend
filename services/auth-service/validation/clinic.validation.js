const Joi = require("joi");

// ── Step 1 ──────────────────────────────────────────────────────────
/**
 * Send OTP — clinic provides 10-digit Indian phone
 */
exports.sendOtpSchema = Joi.object({
  phone: Joi.string()
    .trim()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      "string.empty": "Mobile number is required",
      "string.pattern.base": "Enter a valid 10-digit mobile number",
      "any.required": "Mobile number is required"
    })
});

// ── Step 2 ──────────────────────────────────────────────────────────
/**
 * Verify OTP
 */
exports.verifyOtpSchema = Joi.object({
  phone: Joi.string()
    .trim()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      "string.empty": "Mobile number is required",
      "string.pattern.base": "Enter a valid 10-digit mobile number",
      "any.required": "Mobile number is required"
    }),
  otp: Joi.string().length(6).required().messages({
    "string.length": "OTP must be exactly 6 digits",
    "any.required": "OTP is required"
  })
});

// ── Step 3 ──────────────────────────────────────────────────────────
/**
 * Complete Clinic Profile — all details as JSON body
 */
exports.completeClinicSchema = Joi.object({
  phone: Joi.string()
    .trim()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      "string.pattern.base": "Enter a valid 10-digit mobile number"
    }),
 
  name: Joi.string().trim().min(3).max(100).required().messages({
    "string.min": "Clinic name must be at least 3 characters",
    "string.max": "Clinic name must not exceed 100 characters",
    "any.required": "Clinic name is required"
  }),
  owner_name: Joi.string().trim().min(2).max(100).required().messages({
    "string.min": "Owner name must be at least 2 characters",
    "any.required": "Owner name is required"
  }),
  email: Joi.string().trim().email().required().messages({
    "string.email": "Enter a valid email address",
    "any.required": "Email is required"
  }),
  registration_no: Joi.string().optional().allow("", null),
  address: Joi.string().trim().min(3).required().messages({
    "any.required": "Address is required"
  }),
  city: Joi.string().trim().min(2).required().messages({
    "any.required": "City is required"
  }),
  state: Joi.string().trim().min(2).required().messages({
    "any.required": "State is required"
  }),
  country: Joi.string().optional().allow("", null),
  has_lab: Joi.boolean().optional().allow("", null),
  latitude: Joi.number().optional(),
  longitude: Joi.number().optional(),
  description: Joi.string().optional().allow("", null),
  pincode: Joi.string().regex(/^\d{6}$/).optional().allow("", null).messages({
    "string.pattern.base": "Enter a valid 6-digit PIN code"
  }),
  password: Joi.string().min(8).required().messages({
    "string.min": "Password must contain at least 8 characters",
    "any.required": "Password is required"
  }),
  referral_code: Joi.string().optional().allow("", null)
}).options({ allowUnknown: true });

// ── Login (phone or email) ──────────────────────────────────────────
exports.clinicLoginSchema = Joi.object({
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
  password: Joi.string().required()
}).or("email", "phone");

