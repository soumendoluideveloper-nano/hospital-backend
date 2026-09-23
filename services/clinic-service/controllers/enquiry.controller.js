/**
 * Enquiry Controller (Clinic View)
 * Direct management: Receive calls for doctor/day/slot, Accept, Cancel, Call.
 */

const { Op } = require("sequelize");
const db = require("../../../common/models");
const { success, error, paginated } = require("../../../common/helpers/response.helper");

function getLocalDateString(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeTimeTo24h(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return null;
  const trimmed = timeStr.trim();
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
// GET /api/clinic/enquiries  (clinic admin)
// Query: status, search, page, limit
// ------------------------------------------------------------------
exports.listEnquiries = async (req, res) => {
  try {
    const clinicId = req.user.id;
    const {
      status,
      doctor_id,
      specialization,
      day,
      date,
      search,
      page = 1,
      limit = 50
    } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where = { clinic_id: clinicId };
    const todayDateStr = getLocalDateString();

    if (status === "TODAY") {
      // Strictly today's accepted patients (appointment_date is today)
      where.status = { [Op.in]: ["Accepted", "Confirmed"] };
      where.appointment_date = todayDateStr;
    } else if (status && status.toUpperCase() !== "ALL") {
      where.status = status;
    }

    if (doctor_id && doctor_id !== "ALL") {
      where.doctor_id = Number(doctor_id);
    }

    if (specialization && specialization !== "ALL") {
      where["$doctor.specialization$"] = { [Op.like]: `%${specialization.trim()}%` };
    }

    if (date) {
      where.appointment_date = date;
    } else if (day && day !== "ALL") {
      const lowerDay = day.toLowerCase();
      if (lowerDay === "today") {
        where.appointment_date = todayDateStr;
      } else if (lowerDay === "tomorrow") {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        where.appointment_date = getLocalDateString(tomorrow);
      } else {
        where[Op.or] = [
          { appointment_date: day },
          { slot: { [Op.like]: `%${day}%` } }
        ];
      }
    }

    if (search && search.trim()) {
      const s = `%${search.trim()}%`;
      where[Op.or] = [
        { message: { [Op.like]: s } },
        { "$patient.name$": { [Op.like]: s } },
        { "$patient.phone$": { [Op.like]: s } },
        { "$doctor.name$": { [Op.like]: s } }
      ];
    }

    const { count, rows } = await db.Enquiry.findAndCountAll({
      where,
      include: [
        {
          model: db.Patient,
          as: "patient",
          attributes: ["id", "name", "phone", "email", "gender", "dob", "blood_group", "city", "profile_image"],
          required: false
        },
        {
          model: db.Doctor,
          as: "doctor",
          attributes: ["id", "name", "specialization", "qualification", "consultation_fee", "profile_image"],
          include: [
            {
              model: db.DoctorSchedule,
              as: "schedules",
              attributes: ["id", "day", "start_time", "end_time", "slot_duration", "is_available"],
              required: false
            }
          ],
          required: false
        }
      ],
      subQuery: false,
      distinct: true,
      limit: Number(limit),
      offset: Number(offset),
      order: [["created_at", "DESC"]]
    });

    return paginated(res, "Enquiries fetched", rows, count, page, limit);
  } catch (err) {
    console.error("[enquiry.listEnquiries]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// GET /api/clinic/enquiries/:id  (clinic admin)
// ------------------------------------------------------------------
exports.getEnquiryById = async (req, res) => {
  try {
    const enquiry = await db.Enquiry.findOne({
      where: { id: req.params.id, clinic_id: req.user.id },
      include: [
        {
          model: db.Patient,
          as: "patient",
          attributes: ["id", "name", "phone", "email", "gender", "dob", "blood_group", "city", "address", "profile_image"]
        },
        {
          model: db.Doctor,
          as: "doctor",
          attributes: ["id", "name", "specialization", "qualification", "experience", "consultation_fee", "profile_image"],
          include: [
            {
              model: db.DoctorSchedule,
              as: "schedules",
              attributes: ["id", "day", "start_time", "end_time", "slot_duration", "is_available"],
              required: false
            }
          ]
        }
      ]
    });

    if (!enquiry) return error(res, "Enquiry not found", 404);

    return success(res, "Enquiry fetched", { enquiry });
  } catch (err) {
    console.error("[enquiry.getEnquiryById]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// POST /api/clinic/enquiries/:id/accept (Accept for day/slot)
// ------------------------------------------------------------------
exports.acceptEnquiry = async (req, res) => {
  try {
    const enquiry = await db.Enquiry.findOne({
      where: { id: req.params.id, clinic_id: req.user.id }
    });
    if (!enquiry) return error(res, "Enquiry not found", 404);

    const todayDateStr = getLocalDateString();
    const finalDate = enquiry.appointment_date || req.body.appointment_date || todayDateStr;
    const finalTime = enquiry.appointment_time || req.body.appointment_time || "10:30:00";
    const finalDoctorId = req.body.doctor_id || enquiry.doctor_id;

    let formattedTime = String(finalTime).trim();
    if (formattedTime.length === 5) formattedTime = `${formattedTime}:00`;

    // If doctor is present, create/link appointment
    let appointment = null;
    if (finalDoctorId) {
      appointment = await db.Appointment.create({
        patient_id: enquiry.patient_id,
        clinic_id: req.user.id,
        doctor_id: finalDoctorId,
        appointment_date: finalDate,
        appointment_time: formattedTime,
        reason: enquiry.message || "Accepted from Doctor Call Enquiry",
        notes: `Accepted for slot: ${enquiry.slot || "Consultation"}`,
        status: "Confirmed"
      }).catch(e => console.error("Appointment create note:", e.message));
    }

    await enquiry.update({
      status: "Accepted",
      appointment_date: finalDate,
      appointment_time: formattedTime,
      doctor_id: finalDoctorId || enquiry.doctor_id,
      reply: `Accepted for consultation on ${finalDate}${enquiry.slot ? ` (${enquiry.slot})` : ""}`
    });

    // Notify patient
    await db.Notification.create({
      receiver_type: "Patient",
      receiver_id: enquiry.patient_id,
      title: "Enquiry Accepted!",
      message: `Your doctor enquiry has been accepted for ${finalDate}${enquiry.slot ? ` (${enquiry.slot})` : ""}.`
    }).catch(e => console.error("Notification error:", e.message));

    return success(res, "Enquiry accepted successfully", { enquiry, appointment });
  } catch (err) {
    console.error("[enquiry.acceptEnquiry]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// POST /api/clinic/enquiries/:id/cancel (Cancel)
// ------------------------------------------------------------------
exports.cancelEnquiry = async (req, res) => {
  try {
    const enquiry = await db.Enquiry.findOne({
      where: { id: req.params.id, clinic_id: req.user.id }
    });
    if (!enquiry) return error(res, "Enquiry not found", 404);

    const cancelMsg = req.body.reason ? `Cancelled: ${req.body.reason}` : "Cancelled by clinic";

    await enquiry.update({
      status: "Cancelled",
      reply: cancelMsg
    });

    // Notify patient
    await db.Notification.create({
      receiver_type: "Patient",
      receiver_id: enquiry.patient_id,
      title: "Enquiry Cancelled",
      message: cancelMsg
    }).catch(e => console.error("Notification error:", e.message));

    return success(res, "Enquiry cancelled successfully", enquiry);
  } catch (err) {
    console.error("[enquiry.cancelEnquiry]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// PATCH /api/clinic/enquiries/:id/status (clinic admin)
// ------------------------------------------------------------------
exports.updateStatus = async (req, res) => {
  try {
    const enquiry = await db.Enquiry.findOne({
      where: { id: req.params.id, clinic_id: req.user.id }
    });
    if (!enquiry) return error(res, "Enquiry not found", 404);

    const { status, reply } = req.body;
    const updates = {};
    if (status) updates.status = status;
    if (reply !== undefined) updates.reply = reply;

    await enquiry.update(updates);
    return success(res, "Status updated successfully", enquiry);
  } catch (err) {
    console.error("[enquiry.updateStatus]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// POST /api/clinic/enquiries/log-call (public/patient lead logger)
// Body: { clinic_id, doctor_id, patient_id, patient_phone, patient_name, appointment_date, appointment_time, slot, message }
// ------------------------------------------------------------------
exports.logCallEnquiry = async (req, res) => {
  try {
    const {
      clinic_id,
      doctor_id,
      patient_id,
      patient_phone,
      patient_name,
      appointment_date,
      appointment_time,
      slot,
      message
    } = req.body;

    if (!clinic_id) return error(res, "clinic_id is required", 400);

    let finalPatientId = patient_id;
    if (!finalPatientId && patient_phone) {
      let patient = await db.Patient.findOne({ where: { phone: patient_phone } });
      if (!patient) {
        const bcrypt = require("bcryptjs");
        const defaultPassword = await bcrypt.hash("Patient@123", 10);
        patient = await db.Patient.create({
          name: patient_name || `Patient (${patient_phone.slice(-4)})`,
          phone: patient_phone,
          password: defaultPassword,
          status: "Active"
        });
      }
      finalPatientId = patient.id;
    }

    if (!finalPatientId) {
      return error(res, "Patient ID or phone number is required", 400);
    }

    const todayDateStr = getLocalDateString();
    const formattedApptTime = appointment_time ? normalizeTimeTo24h(appointment_time) : null;
    const formattedSlot = formatSlotAsRange(slot, appointment_time);

    const enquiry = await db.Enquiry.create({
      patient_id: finalPatientId,
      clinic_id,
      doctor_id: doctor_id || null,
      appointment_date: appointment_date || todayDateStr,
      appointment_time: formattedApptTime || appointment_time || null,
      slot: formattedSlot,
      message: message || "Patient requested doctor consultation call.",
      status: "Pending"
    });

    // Notify clinic
    await db.Notification.create({
      receiver_type: "Clinic",
      receiver_id: clinic_id,
      title: "New Doctor Call / Slot Request",
      message: `A patient requested consultation for Dr. on ${appointment_date || "Today"}.`
    }).catch(e => console.error("Notification error:", e.message));

    return success(res, "Call enquiry logged successfully", enquiry, 201);
  } catch (err) {
    console.error("[enquiry.logCallEnquiry]", err);
    return error(res, "Internal server error", 500);
  }
};
