const Joi = require("joi");

/**
 * ============================================================
 * Update Profile Validation Schema
 * ============================================================
 *
 * Used by:
 * PUT /api/clinic/profile
 *
 * Rules:
 * - All fields are optional (partial update allowed).
 * - Empty strings are NOT allowed.
 * - Client should omit the field to keep existing value.
 * - Email must be valid when provided.
 * - Latitude / longitude must be numeric when provided.
 * - has_lab must be boolean when provided.
 */

exports.updateProfileSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(150)
    .messages({
      "string.empty":
        "Clinic name cannot be empty",

      "string.min":
        "Clinic name must be at least 2 characters",

      "string.max":
        "Clinic name must not exceed 150 characters",
    }),

  owner_name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .messages({
      "string.empty":
        "Owner name cannot be empty",

      "string.min":
        "Owner name must be at least 2 characters",

      "string.max":
        "Owner name must not exceed 100 characters",
    }),

  email: Joi.string()
    .trim()
    .email()
    .messages({
      "string.empty":
        "Email cannot be empty",

      "string.email":
        "Please enter a valid email address",
    }),

  registration_no: Joi.string()
    .trim()
    .max(100)
    .messages({
      "string.empty":
        "Registration number cannot be empty",

      "string.max":
        "Registration number must not exceed 100 characters",
    }),

  address: Joi.string()
    .trim()
    .messages({
      "string.empty":
        "Address cannot be empty",
    }),

  city: Joi.string()
    .trim()
    .max(100)
    .messages({
      "string.empty":
        "City cannot be empty",

      "string.max":
        "City must not exceed 100 characters",
    }),

  state: Joi.string()
    .trim()
    .max(100)
    .messages({
      "string.empty":
        "State cannot be empty",

      "string.max":
        "State must not exceed 100 characters",
    }),

  country: Joi.string()
    .trim()
    .max(100)
    .messages({
      "string.empty":
        "Country cannot be empty",

      "string.max":
        "Country must not exceed 100 characters",
    }),

  latitude: Joi.number()
    .messages({
      "number.base":
        "Latitude must be a valid number",
    }),

  longitude: Joi.number()
    .messages({
      "number.base":
        "Longitude must be a valid number",
    }),

  description: Joi.string()
    .trim()
    .allow(null)
    .messages({
      "string.empty":
        "Description cannot be empty. Omit this field to keep the existing value",
    }),

  has_lab: Joi.boolean()
    .messages({
      "boolean.base":
        "Laboratory availability must be true or false",
    }),
}).options({
  allowUnknown: false,
});


/**
 * ============================================================
 * Change Password Validation Schema
 * ============================================================
 *
 * Used by:
 * PUT /api/clinic/change-password
 *
 * Rules:
 * - Current password is required.
 * - New password is required.
 * - New password must be at least 8 characters.
 * - New password must contain at least one uppercase letter.
 * - New password must contain at least one number.
 * - New password must differ from current password.
 * - Confirm password must match new password.
 */

exports.changePasswordSchema = Joi.object({
  current_password: Joi.string()
    .required()
    .messages({
      "string.empty":
        "Current password cannot be empty",

      "any.required":
        "Current password is required",
    }),

  new_password: Joi.string()
    .min(8)
    .pattern(/[A-Z]/)
    .pattern(/[0-9]/)
    .required()
    .invalid(
      Joi.ref("current_password")
    )
    .messages({
      "string.empty":
        "New password cannot be empty",

      "string.min":
        "New password must be at least 8 characters",

      "string.pattern.base":
        "New password must contain at least one uppercase letter and one number",

      "any.required":
        "New password is required",

      "any.invalid":
        "New password must be different from your current password",
    }),

  confirm_password: Joi.string()
    .valid(
      Joi.ref("new_password")
    )
    .required()
    .messages({
      "string.empty":
        "Confirm password cannot be empty",

      "any.only":
        "Confirm password does not match the new password",

      "any.required":
        "Confirm password is required",
    }),
}).options({
  allowUnknown: false,
});