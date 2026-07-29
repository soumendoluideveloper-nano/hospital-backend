const Joi = require("joi");

/**
 * Super Admin login schema
 * (Registration is seeded / done directly in DB — no public endpoint)
 */
exports.adminLoginSchema = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().required()
});
