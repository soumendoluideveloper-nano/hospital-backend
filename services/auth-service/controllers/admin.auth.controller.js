/**
 * Super Admin Auth Controller
 * Login-only (registration is seeded directly in the DB).
 */

const bcrypt   = require("bcryptjs");
const db       = require("../../../common/models");
const { signToken }  = require("../../../common/helpers/jwt.helper");
const { success, error } = require("../../../common/helpers/response.helper");
const { adminLoginSchema } = require("../validation/admin.validation");

// ------------------------------------------------------------------
// POST /api/auth/admin/login
// ------------------------------------------------------------------
exports.login = async (req, res) => {
  try {
    const { error: validErr } = adminLoginSchema.validate(req.body);
    if (validErr) return error(res, validErr.details[0].message);

    const { email, password } = req.body;

    const admin = await db.SuperAdmin.findOne({ where: { email } });
    if (!admin) return error(res, "Invalid credentials", 401);
    if (admin.status === "Inactive") return error(res, "Admin account is deactivated", 403);

    const match = await bcrypt.compare(password, admin.password);
    if (!match) return error(res, "Invalid credentials", 401);

    const token = signToken({ id: admin.id, role: "superadmin", email: admin.email });
    await db.SuperAdmin.update({ token }, { where: { id: admin.id } });

    admin.password = undefined;
    admin.token    = token;

    return success(res, "Login successful", { token, admin });
  } catch (err) {
    console.error("[admin.login]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// GET /api/auth/admin/profile  (protected)
// ------------------------------------------------------------------
exports.getProfile = async (req, res) => {
  try {
    const admin = await db.SuperAdmin.findByPk(req.user.id, {
      attributes: { exclude: ["password", "token"] }
    });
    if (!admin) return error(res, "Admin not found", 404);
    return success(res, "Profile fetched", admin);
  } catch (err) {
    console.error("[admin.getProfile]", err);
    return error(res, "Internal server error", 500);
  }
};
