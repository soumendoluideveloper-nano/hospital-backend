/**
 * Appointment Controller (Patient View)
 * Patients book, list, and cancel their appointments.
 */

const db     = require("../../../common/models");
const { success, error, paginated } = require("../../../common/helpers/response.helper");

// ------------------------------------------------------------------
// POST /api/patient/appointments  (patient)
// Body: { clinic_id, doctor_id, appointment_date, appointment_time, reason }
// ------------------------------------------------------------------
exports.bookAppointment = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { clinic_id, doctor_id, appointment_date, appointment_time, reason } = req.body;

    if (!clinic_id || !doctor_id || !appointment_date || !appointment_time) {
      return error(res, "clinic_id, doctor_id, appointment_date, and appointment_time are required");
    }

    // Check doctor is valid and active
    const doctor = await db.Doctor.findOne({ where: { id: doctor_id, clinic_id, status: "Active" } });
    if (!doctor) return error(res, "Doctor not found or inactive", 404);

    // Prevent double-booking the same slot
    const clash = await db.Appointment.findOne({
      where: {
        doctor_id,
        appointment_date,
        appointment_time,
        status: ["Pending","Confirmed"]
      }
    });
    if (clash) return error(res, "This time slot is already booked. Please choose another.", 409);

    const appt = await db.Appointment.create({
      patient_id: patientId,
      clinic_id, doctor_id,
      appointment_date, appointment_time, reason
    });

    // Notify clinic
    await db.Notification.create({
      receiver_type: "Clinic",
      receiver_id:   clinic_id,
      title:         "New Appointment Request",
      message:       `Patient #${patientId} has booked an appointment with Dr. ${doctor.name} on ${appointment_date} at ${appointment_time}.`
    });

    return success(res, "Appointment booked successfully", appt, 201);
  } catch (err) {
    console.error("[appointment.bookAppointment]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// GET /api/patient/appointments
// ------------------------------------------------------------------
exports.listAppointments = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = { patient_id: req.user.id };
    if (status) where.status = status;

    const { count, rows } = await db.Appointment.findAndCountAll({
      where,
      include: [
        { model: db.Clinic, as: "clinic", attributes: ["id","name","logo","phone","address","city"] },
        { model: db.Doctor, as: "doctor", attributes: ["id","name","specialization","profile_image","consultation_fee"] }
      ],
      limit:  Number(limit),
      offset: Number(offset),
      order:  [["appointment_date","DESC"]]
    });

    return paginated(res, "Appointments fetched", rows, count, page, limit);
  } catch (err) {
    console.error("[appointment.listAppointments]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// GET /api/patient/appointments/:id
// ------------------------------------------------------------------
exports.getAppointmentById = async (req, res) => {
  try {
    const appt = await db.Appointment.findOne({
      where:   { id: req.params.id, patient_id: req.user.id },
      include: [
        { model: db.Clinic, as: "clinic" },
        { model: db.Doctor, as: "doctor" }
      ]
    });
    if (!appt) return error(res, "Appointment not found", 404);
    return success(res, "Appointment details", appt);
  } catch (err) {
    console.error("[appointment.getAppointmentById]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// PATCH /api/patient/appointments/:id/cancel
// ------------------------------------------------------------------
exports.cancelAppointment = async (req, res) => {
  try {
    const appt = await db.Appointment.findOne({
      where: { id: req.params.id, patient_id: req.user.id }
    });
    if (!appt) return error(res, "Appointment not found", 404);
    if (!["Pending","Confirmed"].includes(appt.status)) {
      return error(res, "Only pending or confirmed appointments can be cancelled");
    }

    await appt.update({ status: "Cancelled" });

    // Notify clinic
    await db.Notification.create({
      receiver_type: "Clinic",
      receiver_id:   appt.clinic_id,
      title:         "Appointment Cancelled",
      message:       `Patient has cancelled appointment #${appt.id} on ${appt.appointment_date}.`
    });

    return success(res, "Appointment cancelled");
  } catch (err) {
    console.error("[appointment.cancelAppointment]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// POST /api/patient/enquiries  (patient sends enquiry)
// ------------------------------------------------------------------
exports.sendEnquiry = async (req, res) => {
  try {
    const { clinic_id, doctor_id, message } = req.body;
    if (!clinic_id || !message) return error(res, "clinic_id and message are required");

    const enquiry = await db.Enquiry.create({
      patient_id: req.user.id,
      clinic_id,
      doctor_id:  doctor_id || null,
      message
    });

    // Notify clinic
    await db.Notification.create({
      receiver_type: "Clinic",
      receiver_id:   clinic_id,
      title:         "New Enquiry",
      message:       `Patient #${req.user.id} has sent a new enquiry.`
    });

    return success(res, "Enquiry submitted", enquiry, 201);
  } catch (err) {
    console.error("[appointment.sendEnquiry]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// GET /api/patient/enquiries
// ------------------------------------------------------------------
exports.listEnquiries = async (req, res) => {
  try {
    const rows = await db.Enquiry.findAll({
      where:   { patient_id: req.user.id },
      include: [
        { model: db.Clinic, as: "clinic", attributes: ["id","name","logo"] },
        { model: db.Doctor, as: "doctor", attributes: ["id","name","specialization"], required: false }
      ],
      order: [["created_at","DESC"]]
    });
    return success(res, "Enquiries fetched", rows);
  } catch (err) {
    console.error("[appointment.listEnquiries]", err);
    return error(res, "Internal server error", 500);
  }
};
