/**
 * Appointment Controller (Patient View)
 * Patients book, list, and cancel their appointments.
 */

const { Op } = require("sequelize");
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
    const { status, page = 1, limit = 50, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where = { patient_id: req.user.id };
    if (status && status.toUpperCase() !== "ALL") where.status = status;

    if (search && search.trim()) {
      const s = `%${search.trim()}%`;
      where[Op.or] = [
        { reason: { [Op.like]: s } },
        { "$clinic.name$": { [Op.like]: s } },
        { "$doctor.name$": { [Op.like]: s } },
        { "$doctor.specialization$": { [Op.like]: s } }
      ];
    }

    const { count, rows } = await db.Appointment.findAndCountAll({
      where,
      include: [
        {
          model: db.Clinic,
          as: "clinic",
          attributes: ["id","name","logo","phone","address","city","state","latitude","longitude","has_lab"]
        },
        {
          model: db.Doctor,
          as: "doctor",
          attributes: ["id","name","specialization","profile_image","qualification","experience","consultation_fee"]
        }
      ],
      limit:  Number(limit),
      offset: Number(offset),
      order:  [["appointment_date","DESC"], ["appointment_time","DESC"]]
    });

    return paginated(res, "Appointments fetched", rows, count, Number(page), Number(limit));
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
        {
          model: db.Clinic,
          as: "clinic",
          attributes: ["id","name","logo","phone","address","city","state","latitude","longitude","has_lab"]
        },
        {
          model: db.Doctor,
          as: "doctor",
          attributes: ["id","name","specialization","profile_image","qualification","experience","about","consultation_fee"]
        }
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

/**
 * Normalizes time inputs to 24-hour HH:MM:SS format ("10:30 AM" -> "10:30:00")
 */
function normalizeTimeTo24h(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return null;
  const trimmed = timeStr.trim();

  // 12-hour format: "09:00 AM", "9:30 pm"
  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/i);
  if (match12) {
    let hour = parseInt(match12[1], 10);
    const min = match12[2];
    const period = match12[3].toUpperCase();
    if (hour < 1 || hour > 12) return null;
    if (period === "AM" && hour === 12) hour = 0;
    if (period === "PM" && hour < 12) hour += 12;
    return `${String(hour).padStart(2, "0")}:${min}:00`;
  }

  // 24-hour format: "09:00", "09:00:00", "9:00"
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (match24) {
    const hour = parseInt(match24[1], 10);
    const min = parseInt(match24[2], 10);
    if (hour < 0 || hour > 23 || min < 0 || min > 59) return null;
    const sec = match24[3] ? String(parseInt(match24[3], 10)).padStart(2, "0") : "00";
    return `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}:${sec}`;
  }

  return timeStr;
}

/**
 * Formats slot to time range format ("10:30 AM - 11:00 AM")
 */
function formatSlotAsRange(slotStr, apptTimeStr, durationMins = 30) {
  if (slotStr && typeof slotStr === "string" && slotStr.includes("-")) {
    return slotStr.trim();
  }

  let candidate = slotStr || apptTimeStr;
  if (!candidate || typeof candidate !== "string") return slotStr || null;

  let timeOnly = candidate.trim();
  const parenMatch = timeOnly.match(/\(([^)]+)\)/);
  if (parenMatch) {
    timeOnly = parenMatch[1].trim();
  }

  let startHour = 0;
  let startMin = 0;
  let valid = false;

  const match12 = timeOnly.match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/i);
  if (match12) {
    let hour = parseInt(match12[1], 10);
    const min = parseInt(match12[2], 10);
    const period = match12[3].toUpperCase();
    if (hour >= 1 && hour <= 12 && min >= 0 && min <= 59) {
      if (period === "AM" && hour === 12) hour = 0;
      if (period === "PM" && hour < 12) hour += 12;
      startHour = hour;
      startMin = min;
      valid = true;
    }
  }

  if (!valid) {
    const match24 = timeOnly.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (match24) {
      const hour = parseInt(match24[1], 10);
      const min = parseInt(match24[2], 10);
      if (hour >= 0 && hour <= 23 && min >= 0 && min <= 59) {
        startHour = hour;
        startMin = min;
        valid = true;
      }
    }
  }

  if (!valid) {
    return slotStr || null;
  }

  const startPeriod = startHour >= 12 ? "PM" : "AM";
  const startDisp = startHour % 12 || 12;
  const start12 = `${String(startDisp).padStart(2, "0")}:${String(startMin).padStart(2, "0")} ${startPeriod}`;

  const totalMins = startHour * 60 + startMin + durationMins;
  const endHour = Math.floor(totalMins / 60) % 24;
  const endMin = totalMins % 60;
  const endPeriod = endHour >= 12 ? "PM" : "AM";
  const endDisp = endHour % 12 || 12;
  const end12 = `${String(endDisp).padStart(2, "0")}:${String(endMin).padStart(2, "0")} ${endPeriod}`;

  return `${start12} - ${end12}`;
}

// ------------------------------------------------------------------
// POST /api/patient/enquiries  (patient sends enquiry)
// ------------------------------------------------------------------
exports.sendEnquiry = async (req, res) => {
  try {
    const { clinic_id, doctor_id, appointment_date, appointment_time, slot, message } = req.body;
    if (!clinic_id || !message) return error(res, "clinic_id and message are required");

    // Format appointment_time to standard 24h format e.g. "10:30:00"
    const formattedApptTime = appointment_time ? normalizeTimeTo24h(appointment_time) : null;

    // Ensure slot range e.g. "10:30 AM - 11:00 AM"
    const formattedSlot = formatSlotAsRange(slot, appointment_time);

    const enquiry = await db.Enquiry.create({
      patient_id: req.user.id,
      clinic_id,
      doctor_id:  doctor_id || null,
      appointment_date: appointment_date || null,
      appointment_time: formattedApptTime || appointment_time || null,
      slot: formattedSlot,
      message
    });

    // Notify clinic
    await db.Notification.create({
      receiver_type: "Clinic",
      receiver_id:   clinic_id,
      title:         "New Consultation Enquiry",
      message:       `Patient #${req.user.id} has sent an enquiry${formattedSlot ? ` for ${formattedSlot}` : ""}.`
    });

    return success(res, "Enquiry submitted successfully", enquiry, 201);
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
    const { status, search } = req.query;
    const where = { patient_id: req.user.id };

    if (status && status.toUpperCase() !== "ALL") {
      where.status = status;
    }

    if (search && search.trim()) {
      const s = `%${search.trim()}%`;
      where[Op.or] = [
        { message: { [Op.like]: s } },
        { slot: { [Op.like]: s } },
        { "$clinic.name$": { [Op.like]: s } },
        { "$doctor.name$": { [Op.like]: s } },
        { "$doctor.specialization$": { [Op.like]: s } }
      ];
    }

    const rows = await db.Enquiry.findAll({
      where,
      include: [
        {
          model: db.Clinic,
          as: "clinic",
          attributes: ["id","name","logo","phone","address","city","state","latitude","longitude","has_lab"]
        },
        {
          model: db.Doctor,
          as: "doctor",
          attributes: ["id","name","specialization","profile_image","qualification","experience"],
          required: false
        }
      ],
      order: [["appointment_date","DESC"], ["created_at","DESC"]]
    });
    return success(res, "Enquiries fetched", rows);
  } catch (err) {
    console.error("[appointment.listEnquiries]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// GET /api/patient/enquiries/:id
// ------------------------------------------------------------------
exports.getEnquiryById = async (req, res) => {
  try {
    const row = await db.Enquiry.findOne({
      where: { id: req.params.id, patient_id: req.user.id },
      include: [
        {
          model: db.Clinic,
          as: "clinic",
          attributes: ["id","name","logo","phone","address","city","state","latitude","longitude","has_lab"]
        },
        {
          model: db.Doctor,
          as: "doctor",
          attributes: ["id","name","specialization","profile_image","qualification","experience","about"],
          required: false
        }
      ]
    });
    if (!row) return error(res, "Enquiry not found", 404);
    return success(res, "Enquiry details", row);
  } catch (err) {
    console.error("[appointment.getEnquiryById]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// PATCH /api/patient/enquiries/:id/cancel
// ------------------------------------------------------------------
exports.cancelEnquiry = async (req, res) => {
  try {
    const row = await db.Enquiry.findOne({
      where: { id: req.params.id, patient_id: req.user.id }
    });
    if (!row) return error(res, "Enquiry not found", 404);
    if (["Cancelled", "Closed"].includes(row.status)) {
      return error(res, "Enquiry is already cancelled or closed");
    }

    const cancelReason = req.body?.reason ? `Cancelled by patient: ${req.body.reason}` : "Cancelled by patient";
    await row.update({
      status: "Cancelled",
      reply: cancelReason
    });

    // Notify clinic
    await db.Notification.create({
      receiver_type: "Clinic",
      receiver_id:   row.clinic_id,
      title:         "Appointment Request Cancelled",
      message:       `Patient #${req.user.id} has cancelled consultation request #${row.id}.`
    }).catch(e => console.error("Notification error:", e.message));

    return success(res, "Enquiry cancelled successfully", row);
  } catch (err) {
    console.error("[appointment.cancelEnquiry]", err);
    return error(res, "Internal server error", 500);
  }
};
