/**
 * Enquiry Controller (Clinic View)
 * Clinics receive, reply to, and close patient enquiries.
 */

const db     = require("../../../common/models");
const { success, error, paginated } = require("../../../common/helpers/response.helper");

// ------------------------------------------------------------------
// GET /api/clinic/enquiries  (clinic admin)
// ------------------------------------------------------------------
exports.listEnquiries = async (req, res) => {
  try {
    const clinicId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = { clinic_id: clinicId };
    if (status) where.status = status;

    const { count, rows } = await db.Enquiry.findAndCountAll({
      where,
      include: [
        { model: db.Patient, as: "patient", attributes: ["id","name","phone","email","profile_image"] },
        { model: db.Doctor,  as: "doctor",  attributes: ["id","name","specialization"], required: false }
      ],
      limit:  Number(limit),
      offset: Number(offset),
      order:  [["created_at","DESC"]]
    });

    return paginated(res, "Enquiries fetched", rows, count, page, limit);
  } catch (err) {
    console.error("[enquiry.listEnquiries]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// PATCH /api/clinic/enquiries/:id/reply  (clinic admin)
// Body: { reply, status }
// ------------------------------------------------------------------
exports.replyEnquiry = async (req, res) => {
  try {
    const enquiry = await db.Enquiry.findOne({
      where: { id: req.params.id, clinic_id: req.user.id }
    });
    if (!enquiry) return error(res, "Enquiry not found", 404);

    const { reply, status = "Answered" } = req.body;
    if (!reply) return error(res, "Reply message is required");

    await enquiry.update({ reply, status });

    // Notify patient
    await db.Notification.create({
      receiver_type: "Patient",
      receiver_id:   enquiry.patient_id,
      title:         "Your enquiry has been answered",
      message:       reply
    });

    return success(res, "Reply sent", enquiry);
  } catch (err) {
    console.error("[enquiry.replyEnquiry]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// PATCH /api/clinic/enquiries/:id/close  (clinic admin)
// ------------------------------------------------------------------
exports.closeEnquiry = async (req, res) => {
  try {
    const enquiry = await db.Enquiry.findOne({
      where: { id: req.params.id, clinic_id: req.user.id }
    });
    if (!enquiry) return error(res, "Enquiry not found", 404);
    await enquiry.update({ status: "Closed" });
    return success(res, "Enquiry closed");
  } catch (err) {
    console.error("[enquiry.closeEnquiry]", err);
    return error(res, "Internal server error", 500);
  }
};
