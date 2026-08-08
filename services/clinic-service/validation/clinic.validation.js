const Joi = require("joi");

/**
 * Update Profile Validation Schema
 * -----------------------------------
 * Used by PUT /api/clinic/profile
 *
 * Rules:
 *  - All fields are optional (partial update allowed).
 *  - Empty strings ("") are NOT allowed for any field —
 *    the client must omit the key entirely to keep the existing value.
 *  - `email` must be a valid e-mail format when provided.
 *  - `latitude` / `longitude` must be numeric when provided.
 *  - `has_lab` must be boolean when provided.
 */
exports.updateProfileSchema = Joi.object({
  name:            Joi.string().trim().min(2).max(150)
                     .messages({ "string.empty": "\"name\" cannot be empty" }),

  owner_name:      Joi.string().trim().min(2).max(100)
                     .messages({ "string.empty": "\"owner_name\" cannot be empty" }),

  email:           Joi.string().trim().email()
                     .messages({
                       "string.empty": "\"email\" cannot be empty",
                       "string.email": "\"email\" must be a valid email address"
                     }),

  registration_no: Joi.string().trim().max(100)
                     .messages({ "string.empty": "\"registration_no\" cannot be empty" }),

  address:         Joi.string().trim()
                     .messages({ "string.empty": "\"address\" cannot be empty" }),

  city:            Joi.string().trim().max(100)
                     .messages({ "string.empty": "\"city\" cannot be empty" }),

  state:           Joi.string().trim().max(100)
                     .messages({ "string.empty": "\"state\" cannot be empty" }),

  country:         Joi.string().trim().max(100)
                     .messages({ "string.empty": "\"country\" cannot be empty" }),

  latitude:        Joi.number()
                     .messages({ "number.base": "\"latitude\" must be a valid number" }),

  longitude:       Joi.number()
                     .messages({ "number.base": "\"longitude\" must be a valid number" }),

  description:     Joi.string().trim().allow(null)
                     .messages({ "string.empty": "\"description\" cannot be empty — omit the field to keep existing value" }),

  has_lab:         Joi.boolean()
                     .messages({ "boolean.base": "\"has_lab\" must be true or false" })
}).options({ allowUnknown: false });

/**
 * Change Password Validation Schema
 * -----------------------------------
 * Used by PUT /api/clinic/change-password
 *
 * Rules:
 *  - `current_password` — required, must match the stored bcrypt hash.
 *  - `new_password`     — required, min 6 chars, must differ from current.
 *  - `confirm_password` — required, must exactly match new_password.
 */
exports.changePasswordSchema = Joi.object({
  current_password: Joi.string().required()
                      .messages({
                        "string.empty": "\"current_password\" cannot be empty",
                        "any.required": "\"current_password\" is required"
                      }),

  new_password:     Joi.string().min(6).required()
                      .invalid(Joi.ref("current_password"))
                      .messages({
                        "string.empty":   "\"new_password\" cannot be empty",
                        "string.min":     "\"new_password\" must be at least 6 characters",
                        "any.required":   "\"new_password\" is required",
                        "any.invalid":    "\"new_password\" must differ from your current password"
                      }),

  confirm_password: Joi.string().valid(Joi.ref("new_password")).required()
                      .messages({
                        "string.empty":  "\"confirm_password\" cannot be empty",
                        "any.only":      "\"confirm_password\" does not match \"new_password\"",
                        "any.required":  "\"confirm_password\" is required"
                      })
}).options({ allowUnknown: false });
