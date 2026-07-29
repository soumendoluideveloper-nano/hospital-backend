/**
 * Appointment Controller (Clinic View)
 * Clinic admins see and manage their clinic's appointments.
 */

const db     = require("../../../common/models");
const { success, error, paginated } = require("../../../common/helpers/response.helper");

// ------------------------------------------------------------------
// GET /api/clinic/appointments  (clinic admin)
// Query: status, doctor_id, date, page, limit
// ------------------------------------------------------------------
exports.listAppointments = async (req, res) => {
  try {
    const clinicId = req.user.id;
    const { status, doctor_id, date, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = { clinic_id: clinicId };
    if (status)    where.status           = status;
    if (doctor_id) where.doctor_id        = doctor_id;
    if (date)      where.appointment_date = date;

    const { count, rows } = await db.Appointment.findAndCountAll({
      where,
      include: [
        { model: db.Patient, as: "patient", attributes: ["id","name","phone","email","profile_image"] },
        { model: db.Doctor,  as: "doctor",  attributes: ["id","name","specialization"] }
      ],
      limit:  Number(limit),
      offset: Number(offset),
      order:  [["appointment_date","ASC"],["appointment_time","ASC"]]
    });

    return paginated(res, "Appointments fetched", rows, count, page, limit);
  } catch (err) {
    console.error("[appointment.listAppointments]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// GET /api/clinic/appointments/:id  (clinic admin)
// ------------------------------------------------------------------
exports.getAppointmentById = async (req, res) => {
  try {
    const appt = await db.Appointment.findOne({
      where:   { id: req.params.id, clinic_id: req.user.id },
      include: [
        { model: db.Patient, as: "patient" },
        { model: db.Doctor,  as: "doctor"  }
      ]
    });
    if (!appt) return error(res, "Appointment not found", 404);
    return success(res, "Appointment fetched", appt);
  } catch (err) {
    console.error("[appointment.getAppointmentById]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// PATCH /api/clinic/appointments/:id/status  (clinic admin)
// Body: { status: "Confirmed" | "Completed" | "Rejected" }
// ------------------------------------------------------------------
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["Confirmed","Completed","Rejected","Cancelled"];
    if (!allowed.includes(status)) {
      return error(res, `Status must be one of: ${allowed.join(", ")}`);
    }

    const appt = await db.Appointment.findOne({
      where: { id: req.params.id, clinic_id: req.user.id }
    });
    if (!appt) return error(res, "Appointment not found", 404);

    await appt.update({ status, notes: req.body.notes || appt.notes });

    // Notify patient
    await db.Notification.create({
      receiver_type: "Patient",
      receiver_id:   appt.patient_id,
      title:         `Appointment ${status}`,
      message:       `Your appointment on ${appt.appointment_date} has been ${status.toLowerCase()}.`
    });

    return success(res, `Appointment ${status.toLowerCase()} successfully`, appt);
  } catch (err) {
    console.error("[appointment.updateStatus]", err);
    return error(res, "Internal server error", 500);
  }
};
