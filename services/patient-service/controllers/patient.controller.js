/**
 * Patient Controller
 * Profile management for the logged-in patient.
 */

const db     = require("../../../common/models");
const { success, error } = require("../../../common/helpers/response.helper");

// ------------------------------------------------------------------
// GET /api/patient/profile
// ------------------------------------------------------------------
exports.getProfile = async (req, res) => {
  try {
    const patient = await db.Patient.findByPk(req.user.id, {
      attributes: { exclude: ["password","token"] }
    });
    if (!patient) return error(res, "Patient not found", 404);
    return success(res, "Profile fetched", patient);
  } catch (err) {
    console.error("[patient.getProfile]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// PUT /api/patient/profile
// ------------------------------------------------------------------
exports.updateProfile = async (req, res) => {
  try {
    const allowed = ["name","gender","dob","blood_group","address","city","state","country"];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    if (req.file) updates.profile_image = "uploads/" + req.file.path.replace(/\\/g, "/").split("uploads/")[1];

    await db.Patient.update(updates, { where: { id: req.user.id } });

    const patient = await db.Patient.findByPk(req.user.id, {
      attributes: { exclude: ["password","token"] }
    });
    return success(res, "Profile updated", patient);
  } catch (err) {
    console.error("[patient.updateProfile]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// GET /api/patient/notifications
// ------------------------------------------------------------------
exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await db.Notification.findAndCountAll({
      where:  { receiver_type: "Patient", receiver_id: req.user.id },
      limit:  Number(limit),
      offset: Number(offset),
      order:  [["created_at","DESC"]]
    });

    // Auto mark all as read
    await db.Notification.update(
      { is_read: true },
      { where: { receiver_type: "Patient", receiver_id: req.user.id, is_read: false } }
    );

    return success(res, "Notifications fetched", rows, 200, {
      total: count, page: Number(page), limit: Number(limit)
    });
  } catch (err) {
    console.error("[patient.getNotifications]", err);
    return error(res, "Internal server error", 500);
  }
};
