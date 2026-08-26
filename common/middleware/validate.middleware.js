/**
 * Validate Middleware
 * Generic Joi schema validation middleware factory.
 *
 * Usage:
 *   const validate = require("../../../common/middleware/validate.middleware");
 *   router.post("/doctors", auth(...), validate(addDoctorSchema), controller.addDoctor);
 *
 * On validation failure it returns:
 *   HTTP 422  { success: false, message: "<first error message>" }
 */

const { error } = require("../helpers/response.helper");

/**
 * @param {import("joi").ObjectSchema} schema  - Joi schema to validate req.body against
 * @returns {import("express").RequestHandler}
 */
module.exports = (schema) => (req, res, next) => {
  const { error: validationError, value } = schema.validate(req.body, {
    abortEarly: true,   // Stop at the first error for clean single-message responses
    stripUnknown: true, // Remove extra keys before reaching the controller
  });

  if (validationError) {
    const message = validationError.details[0].message;
    return error(res, message, 422);
  }

  // Replace req.body with the sanitised / coerced value
  req.body = value;
  next();
};
