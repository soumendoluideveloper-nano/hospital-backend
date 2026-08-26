const Joi = require("joi");

/**
 * ============================================================
 * Add Doctor Validation Schema
 * ============================================================
 *
 * Used by:
 * POST /api/clinic/doctors
 *
 * Rules:
 * - name, email, phone, specialization are required.
 * - email must be a valid email address.
 * - phone must be 10-15 digits.
 * - experience must be a non-negative number (years).
 * - consultation_fee must be a non-negative number.
 * - registration_no must be alphanumeric and at most 50 chars.
 * - status defaults to "Active" when not provided.
 */
exports.addDoctorSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(150)
    .required()
    .messages({
      "string.empty":   "Doctor name cannot be empty",
      "string.min":     "Doctor name must be at least 2 characters",
      "string.max":     "Doctor name must not exceed 150 characters",
      "any.required":   "Doctor name is required",
    }),

  email: Joi.string()
    .trim()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      "string.empty":   "Email cannot be empty",
      "string.email":   "Please enter a valid email address",
      "any.required":   "Email is required",
    }),

  phone: Joi.string()
    .trim()
    .pattern(/^\d{10,15}$/)
    .required()
    .messages({
      "string.empty":        "Phone number cannot be empty",
      "string.pattern.base": "Phone must be 10-15 digits with no spaces or symbols",
      "any.required":        "Phone number is required",
    }),

  specialization: Joi.string()
    .trim()
    .min(2)
    .max(150)
    .required()
    .messages({
      "string.empty":   "Specialization cannot be empty",
      "string.min":     "Specialization must be at least 2 characters",
      "string.max":     "Specialization must not exceed 150 characters",
      "any.required":   "Specialization is required",
    }),

  qualification: Joi.string()
    .trim()
    .max(200)
    .messages({
      "string.empty":   "Qualification cannot be empty",
      "string.max":     "Qualification must not exceed 200 characters",
    }),

  experience: Joi.number()
    .min(0)
    .max(80)
    .messages({
      "number.base":    "Experience must be a valid number (years)",
      "number.min":     "Experience cannot be negative",
      "number.max":     "Experience cannot exceed 80 years",
    }),

  consultation_fee: Joi.number()
    .min(0)
    .messages({
      "number.base":    "Consultation fee must be a valid number",
      "number.min":     "Consultation fee cannot be negative",
    }),

  about: Joi.string()
    .trim()
    .max(2000)
    .allow(null, "")
    .messages({
      "string.max":     "About section must not exceed 2000 characters",
    }),

  profile_image: Joi.string()
    .trim()
    .uri()
    .allow(null, "")
    .messages({
      "string.uri":     "Profile image must be a valid URL",
    }),

  registration_no: Joi.string()
    .trim()
    .alphanum()
    .max(50)
    .allow(null, "")
    .messages({
      "string.alphanum": "Registration number must contain only letters and numbers",
      "string.max":      "Registration number must not exceed 50 characters",
    }),
}).options({ allowUnknown: false });


/**
 * ============================================================
 * Update Doctor Validation Schema
 * ============================================================
 *
 * Used by:
 * PUT /api/clinic/doctors/:id
 *
 * Rules:
 * - All fields are optional (partial update).
 * - At least one field must be provided.
 * - Same field-level rules as addDoctorSchema apply.
 * - status must be one of: Active, Inactive.
 */
exports.updateDoctorSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(150)
    .messages({
      "string.empty":   "Doctor name cannot be empty",
      "string.min":     "Doctor name must be at least 2 characters",
      "string.max":     "Doctor name must not exceed 150 characters",
    }),

  email: Joi.string()
    .trim()
    .email({ tlds: { allow: false } })
    .messages({
      "string.empty":   "Email cannot be empty",
      "string.email":   "Please enter a valid email address",
    }),

  phone: Joi.string()
    .trim()
    .pattern(/^\d{10,15}$/)
    .messages({
      "string.empty":        "Phone number cannot be empty",
      "string.pattern.base": "Phone must be 10-15 digits with no spaces or symbols",
    }),

  specialization: Joi.string()
    .trim()
    .min(2)
    .max(150)
    .messages({
      "string.empty":   "Specialization cannot be empty",
      "string.min":     "Specialization must be at least 2 characters",
      "string.max":     "Specialization must not exceed 150 characters",
    }),

  qualification: Joi.string()
    .trim()
    .max(200)
    .messages({
      "string.empty":   "Qualification cannot be empty",
      "string.max":     "Qualification must not exceed 200 characters",
    }),

  experience: Joi.number()
    .min(0)
    .max(80)
    .messages({
      "number.base":    "Experience must be a valid number (years)",
      "number.min":     "Experience cannot be negative",
      "number.max":     "Experience cannot exceed 80 years",
    }),

  consultation_fee: Joi.number()
    .min(0)
    .messages({
      "number.base":    "Consultation fee must be a valid number",
      "number.min":     "Consultation fee cannot be negative",
    }),

  about: Joi.string()
    .trim()
    .max(2000)
    .allow(null, "")
    .messages({
      "string.max":     "About section must not exceed 2000 characters",
    }),

  profile_image: Joi.string()
    .trim()
    .uri()
    .allow(null, "")
    .messages({
      "string.uri":     "Profile image must be a valid URL",
    }),

  registration_no: Joi.string()
    .trim()
    .alphanum()
    .max(50)
    .allow(null, "")
    .messages({
      "string.alphanum": "Registration number must contain only letters and numbers",
      "string.max":      "Registration number must not exceed 50 characters",
    }),

  status: Joi.string()
    .valid("Active", "Inactive")
    .messages({
      "string.empty":   "Status cannot be empty",
      "any.only":       "Status must be either 'Active' or 'Inactive'",
    }),
})
  .min(1)
  .options({ allowUnknown: false })
  .messages({
    "object.min": "At least one field must be provided for update",
  });


/**
 * ============================================================
 * Add Schedule Validation Schema
 * ============================================================
 *
 * Used by:
 * POST /api/clinic/doctors/:doctorId/schedules
 *
 * Rules:
 * - day, start_time, end_time, slot_duration are required.
 * - day must be a valid weekday name.
 * - start_time and end_time must be in HH:mm (24-hour) format.
 * - end_time must be after start_time (logical check done in controller).
 * - slot_duration must be a positive integer (minutes).
 */
exports.addScheduleSchema = Joi.object({
  day: Joi.string()
    .trim()
    .valid("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")
    .required()
    .messages({
      "string.empty":   "Day cannot be empty",
      "any.only":       "Day must be a valid weekday: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, or Sunday",
      "any.required":   "Day is required",
    }),

  start_time: Joi.string()
    .trim()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .required()
    .messages({
      "string.empty":        "Start time cannot be empty",
      "string.pattern.base": "Start time must be in HH:mm format (e.g., 09:00)",
      "any.required":        "Start time is required",
    }),

  end_time: Joi.string()
    .trim()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .required()
    .messages({
      "string.empty":        "End time cannot be empty",
      "string.pattern.base": "End time must be in HH:mm format (e.g., 17:00)",
      "any.required":        "End time is required",
    }),

  slot_duration: Joi.number()
    .integer()
    .min(5)
    .max(480)
    .required()
    .messages({
      "number.base":    "Slot duration must be a valid number (minutes)",
      "number.integer": "Slot duration must be a whole number",
      "number.min":     "Slot duration must be at least 5 minutes",
      "number.max":     "Slot duration cannot exceed 480 minutes (8 hours)",
      "any.required":   "Slot duration is required",
    }),

  is_available: Joi.boolean()
    .messages({
      "boolean.base":   "is_available must be true or false",
    }),
}).options({ allowUnknown: false });


/**
 * ============================================================
 * Update Schedule Validation Schema
 * ============================================================
 *
 * Used by:
 * PUT /api/clinic/schedules/:id
 *
 * Rules:
 * - All fields optional; at least one must be provided.
 * - Same field-level rules as addScheduleSchema apply.
 */
exports.updateScheduleSchema = Joi.object({
  day: Joi.string()
    .trim()
    .valid("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")
    .messages({
      "string.empty":   "Day cannot be empty",
      "any.only":       "Day must be a valid weekday: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, or Sunday",
    }),

  start_time: Joi.string()
    .trim()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .messages({
      "string.empty":        "Start time cannot be empty",
      "string.pattern.base": "Start time must be in HH:mm format (e.g., 09:00)",
    }),

  end_time: Joi.string()
    .trim()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .messages({
      "string.empty":        "End time cannot be empty",
      "string.pattern.base": "End time must be in HH:mm format (e.g., 17:00)",
    }),

  slot_duration: Joi.number()
    .integer()
    .min(5)
    .max(480)
    .messages({
      "number.base":    "Slot duration must be a valid number (minutes)",
      "number.integer": "Slot duration must be a whole number",
      "number.min":     "Slot duration must be at least 5 minutes",
      "number.max":     "Slot duration cannot exceed 480 minutes (8 hours)",
    }),

  is_available: Joi.boolean()
    .messages({
      "boolean.base":   "is_available must be true or false",
    }),
})
  .min(1)
  .options({ allowUnknown: false })
  .messages({
    "object.min": "At least one field must be provided for update",
  });
