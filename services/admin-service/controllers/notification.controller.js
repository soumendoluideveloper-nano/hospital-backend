/**
 * Notification Controller (Super Admin)
 * Broadcast targeted or global notifications.
 */

const db     = require("../../../common/models");
const { success, error } = require("../../../common/helpers/response.helper");

// ------------------------------------------------------------------
// POST /api/admin/notifications/send
// Body: { receiver_type, receiver_id (optional), title, message }
// If receiver_id omitted → broadcast to ALL of receiver_type
// ------------------------------------------------------------------
exports.sendNotification = async (req, res) => {
  try {
    const { receiver_type, receiver_id, title, message } = req.body;
    const allowed = ["Patient","Clinic","SuperAdmin"];
    if (!allowed.includes(receiver_type)) {
      return error(res, `receiver_type must be one of: ${allowed.join(", ")}`);
    }
    if (!title || !message) return error(res, "title and message are required");

    if (receiver_id) {
      // Targeted
      const notif = await db.Notification.create({ receiver_type, receiver_id, title, message });
      return success(res, "Notification sent", notif, 201);
    }

    // Broadcast — get all IDs from the target table
    let Model;
    if (receiver_type === "Patient")    Model = db.Patient;
    if (receiver_type === "Clinic")     Model = db.Clinic;
    if (receiver_type === "SuperAdmin") Model = db.SuperAdmin;

    const records = await Model.findAll({ attributes: ["id"], where: { status: "Active" } });
    const bulkData = records.map(r => ({ receiver_type, receiver_id: r.id, title, message }));
    await db.Notification.bulkCreate(bulkData);

    return success(res, `Broadcast sent to ${bulkData.length} ${receiver_type}(s)`, {
      count: bulkData.length
    }, 201);
  } catch (err) {
    console.error("[notification.sendNotification]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// GET /api/admin/notifications
// ------------------------------------------------------------------
exports.listNotifications = async (req, res) => {
  try {
    const { receiver_type, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const where  = {};
    if (receiver_type) where.receiver_type = receiver_type;

    const { count, rows } = await db.Notification.findAndCountAll({
      where,
      limit:  Number(limit),
      offset: Number(offset),
      order:  [["created_at","DESC"]]
    });

    return success(res, "Notifications fetched", rows, 200, {
      total: count, page: Number(page), limit: Number(limit)
    });
  } catch (err) {
    console.error("[notification.listNotifications]", err);
    return error(res, "Internal server error", 500);
  }
};
