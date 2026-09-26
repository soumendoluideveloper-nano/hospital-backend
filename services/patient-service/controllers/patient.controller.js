/**
 * Patient Controller
 * Profile management for the logged-in patient.
 */

const bcrypt = require("bcryptjs");
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
    const allowed = ["name","email","gender","dob","blood_group","address","city","state","country","push_token"];
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
// POST /api/patient/push-token
// ------------------------------------------------------------------
exports.savePushToken = async (req, res) => {
  try {
    const { push_token } = req.body;
    if (!push_token) {
      return error(res, "push_token is required", 400);
    }

    await db.Patient.update({ push_token }, { where: { id: req.user.id } });
    return success(res, "Push token registered successfully", { push_token });
  } catch (err) {
    console.error("[patient.savePushToken]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// GET /api/patient/notifications
// Fetches the latest 10 notifications to keep DB load minimal
// ------------------------------------------------------------------
exports.getNotifications = async (req, res) => {
  try {
    const rawLimit = Number(req.query.limit) || 10;
    const limit = Math.min(Math.max(rawLimit, 1), 10); // capped at 10 to optimize DB load

    const { count, rows } = await db.Notification.findAndCountAll({
      where:  { receiver_type: "Patient", receiver_id: req.user.id },
      limit:  limit,
      order:  [["created_at", "DESC"]]
    });

    // Auto mark retrieved notifications as read in the background
    db.Notification.update(
      { is_read: true },
      { where: { receiver_type: "Patient", receiver_id: req.user.id, is_read: false } }
    ).catch(e => console.error("Notification mark read error:", e.message));

    return success(res, "Notifications fetched", rows, 200, {
      total: count,
      limit
    });
  } catch (err) {
    console.error("[patient.getNotifications]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// GET /api/patient/notifications/unread-count
// Lightweight query to check if there are unread notifications
// ------------------------------------------------------------------
exports.getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await db.Notification.count({
      where: {
        receiver_type: "Patient",
        receiver_id: req.user.id,
        is_read: false
      }
    });

    return success(res, "Unread count fetched", { unread_count: unreadCount });
  } catch (err) {
    console.error("[patient.getUnreadCount]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// PUT /api/patient/notifications/read-all
// ------------------------------------------------------------------
exports.markNotificationsRead = async (req, res) => {
  try {
    await db.Notification.update(
      { is_read: true },
      { where: { receiver_type: "Patient", receiver_id: req.user.id, is_read: false } }
    );
    return success(res, "All notifications marked as read");
  } catch (err) {
    console.error("[patient.markNotificationsRead]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// DELETE /api/patient/notifications (Clear all)
// ------------------------------------------------------------------
exports.clearNotifications = async (req, res) => {
  try {
    await db.Notification.destroy({
      where: { receiver_type: "Patient", receiver_id: req.user.id }
    });
    return success(res, "Notifications cleared successfully");
  } catch (err) {
    console.error("[patient.clearNotifications]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// PUT /api/patient/change-password  (patient — protected)
// ------------------------------------------------------------------
exports.changePassword = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { current_password, new_password, confirm_password } = req.body;

    if (!current_password || !new_password) {
      return error(res, "Current password and new password are required", 400);
    }
    if (confirm_password && new_password !== confirm_password) {
      return error(res, "New password and confirm password do not match", 400);
    }
    if (new_password.length < 6) {
      return error(res, "New password must be at least 6 characters", 400);
    }

    const patient = await db.Patient.findByPk(patientId);
    if (!patient) return error(res, "Patient not found", 404);

    const isMatch = await bcrypt.compare(current_password, patient.password);
    if (!isMatch) {
      return error(res, "Current password is incorrect", 401);
    }

    const hashed = await bcrypt.hash(new_password, 10);
    await db.Patient.update({ password: hashed }, { where: { id: patientId } });

    return success(res, "Password changed successfully");
  } catch (err) {
    console.error("[patient.changePassword]", err);
    return error(res, "Internal server error", 500);
  }
};
