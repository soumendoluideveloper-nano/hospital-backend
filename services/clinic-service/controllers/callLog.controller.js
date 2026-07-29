/**
 * Call Log Controller (Clinic View)
 * Clinic admins can view call logs for their doctors.
 */

const db     = require("../../../common/models");
const { success, error, paginated } = require("../../../common/helpers/response.helper");

// ------------------------------------------------------------------
// GET /api/clinic/call-logs  (clinic admin)
// Query: doctor_id, call_type, status, page, limit
// ------------------------------------------------------------------
exports.listCallLogs = async (req, res) => {
  try {
    const clinicId = req.user.id;
    const { doctor_id, call_type, status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = { clinic_id: clinicId };
    if (doctor_id) where.doctor_id = doctor_id;
    if (call_type) where.call_type = call_type;
    if (status)    where.status    = status;

    const { count, rows } = await db.CallLog.findAndCountAll({
      where,
      include: [
        { model: db.Patient, as: "patient", attributes: ["id","name","phone","profile_image"] },
        { model: db.Doctor,  as: "doctor",  attributes: ["id","name","specialization"] }
      ],
      limit:  Number(limit),
      offset: Number(offset),
      order:  [["created_at","DESC"]]
    });

    return paginated(res, "Call logs fetched", rows, count, page, limit);
  } catch (err) {
    console.error("[callLog.listCallLogs]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// POST /api/clinic/call-logs  (patient creates log via this route)
// Body: { patient_id, clinic_id, doctor_id, call_type, duration, status }
// ------------------------------------------------------------------
exports.createCallLog = async (req, res) => {
  try {
    const { patient_id, clinic_id, doctor_id, call_type, duration, status } = req.body;
    if (!patient_id || !clinic_id || !doctor_id) {
      return error(res, "patient_id, clinic_id, and doctor_id are required");
    }

    const log = await db.CallLog.create({ patient_id, clinic_id, doctor_id, call_type, duration, status });
    return success(res, "Call log recorded", log, 201);
  } catch (err) {
    console.error("[callLog.createCallLog]", err);
    return error(res, "Internal server error", 500);
  }
};
