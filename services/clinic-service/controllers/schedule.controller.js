/**
 * Schedule Controller
 * Manage weekly availability slots for doctors.
 * Only the owning clinic can manage schedules.
 */

const db     = require("../../../common/models");
const { success, error } = require("../../../common/helpers/response.helper");

// ------------------------------------------------------------------
// POST /api/clinic/doctors/:doctorId/schedules  (clinic admin)
// ------------------------------------------------------------------
exports.addSchedule = async (req, res) => {
  try {
    const clinicId = req.user.id;
    const { doctorId } = req.params;

    // Ownership check
    const doctor = await db.Doctor.findOne({ where: { id: doctorId, clinic_id: clinicId } });
    if (!doctor) return error(res, "Doctor not found under your clinic", 404);

    // Input is already validated by validate(addScheduleSchema) middleware
    const { day, start_time, end_time, slot_duration, is_available } = req.body;

    // Business logic: end_time must be after start_time
    if (end_time <= start_time) {
      return error(res, "end_time must be after start_time", 422);
    }

    const schedule = await db.DoctorSchedule.create({
      doctor_id: doctorId, day, start_time, end_time, slot_duration,
      ...(is_available !== undefined && { is_available })
    });

    return success(res, "Schedule added", schedule, 201);
  } catch (err) {
    console.error("[schedule.addSchedule]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// GET /api/clinic/doctors/:doctorId/schedules  (public)
// ------------------------------------------------------------------
exports.getSchedules = async (req, res) => {
  try {
    const schedules = await db.DoctorSchedule.findAll({
      where: { doctor_id: req.params.doctorId, is_available: true },
      order: [["day", "ASC"], ["start_time", "ASC"]]
    });
    return success(res, "Schedules fetched", schedules);
  } catch (err) {
    console.error("[schedule.getSchedules]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// PUT /api/clinic/schedules/:id  (clinic admin)
// ------------------------------------------------------------------
exports.updateSchedule = async (req, res) => {
  try {
    const clinicId = req.user.id;
    const schedule = await db.DoctorSchedule.findByPk(req.params.id, {
      include: [{ model: db.Doctor, as: "doctor" }]
    });
    if (!schedule || schedule.doctor.clinic_id !== clinicId) {
      return error(res, "Schedule not found or not under your clinic", 404);
    }

    // Input is already validated by validate(updateScheduleSchema) middleware
    const allowed = ["day","start_time","end_time","slot_duration","is_available"];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    // Business logic: if both times are present (new or existing), end must be after start
    const effectiveStart = updates.start_time || schedule.start_time;
    const effectiveEnd   = updates.end_time   || schedule.end_time;
    if (effectiveEnd <= effectiveStart) {
      return error(res, "end_time must be after start_time", 422);
    }

    await schedule.update(updates);
    return success(res, "Schedule updated", schedule);
  } catch (err) {
    console.error("[schedule.updateSchedule]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// DELETE /api/clinic/schedules/:id  (clinic admin)
// ------------------------------------------------------------------
exports.deleteSchedule = async (req, res) => {
  try {
    const clinicId = req.user.id;
    const schedule = await db.DoctorSchedule.findByPk(req.params.id, {
      include: [{ model: db.Doctor, as: "doctor" }]
    });
    if (!schedule || schedule.doctor.clinic_id !== clinicId) {
      return error(res, "Schedule not found or not under your clinic", 404);
    }
    await schedule.destroy();
    return success(res, "Schedule deleted");
  } catch (err) {
    console.error("[schedule.deleteSchedule]", err);
    return error(res, "Internal server error", 500);
  }
};
