/**
 * Schedule Controller
 * Manage weekly availability slots for doctors.
 * Only the owning clinic can manage schedules.
 */

const db     = require("../../../common/models");
const { success, error } = require("../../../common/helpers/response.helper");

/**
 * Normalizes various time inputs to 24-hour HH:MM:SS format.
 * Supports "09:00 AM", "05:30 pm", "09:00", "14:30:00", etc.
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

  return null;
}

/**
 * Converts HH:MM:SS to total minutes from midnight for interval comparisons.
 */
function timeToMinutes(t) {
  const parts = t.split(":");
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

// ------------------------------------------------------------------
// GET /api/clinic/doctors/:doctorId/schedules  (public / clinic)
// ------------------------------------------------------------------
exports.getSchedules = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const schedules = await db.DoctorSchedule.findAll({
      where: { doctor_id: doctorId },
      order: [
        ["day", "ASC"],
        ["start_time", "ASC"]
      ]
    });
    return success(res, "Schedules fetched", schedules);
  } catch (err) {
    console.error("[schedule.getSchedules]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// PUT /api/clinic/doctors/:doctorId/schedules  (clinic admin)
// Saves / syncs complete weekly schedule for a doctor
// ------------------------------------------------------------------
exports.saveWeeklySchedule = async (req, res) => {
  try {
    const clinicId = req.user.id;
    const { doctorId } = req.params;

    // 1. Verify doctor exists and belongs to authenticated clinic
    const doctor = await db.Doctor.findOne({ where: { id: doctorId, clinic_id: clinicId } });
    if (!doctor) {
      return error(res, "Doctor not found or not under your clinic", 404);
    }

    const { schedule } = req.body;
    if (!Array.isArray(schedule)) {
      return error(res, "Schedule array is required", 422);
    }

    const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const recordsToInsert = [];

    // 2. Validate day schedules and session overlaps
    for (const daySchedule of schedule) {
      const { day, enabled, sessions } = daySchedule;

      if (!validDays.includes(day)) {
        return error(res, `Invalid day name: '${day}'`, 422);
      }

      const dayIsAvailable = Boolean(enabled);
      const daySessions = Array.isArray(sessions) && sessions.length > 0
        ? sessions
        : [
            {
              start_time: "09:00:00",
              end_time: "13:00:00",
              slot_duration: 30,
              is_available: false,
            },
          ];

      const parsedDaySessions = [];

      for (const session of daySessions) {
        if (!session.start_time || !session.end_time) {
          return error(res, `Both start_time and end_time are required for each session on ${day}`, 422);
        }

        const normalizedStart = normalizeTimeTo24h(session.start_time);
        const normalizedEnd   = normalizeTimeTo24h(session.end_time);

        if (!normalizedStart || !normalizedEnd) {
          return error(res, `Invalid time format on ${day}: '${session.start_time}' - '${session.end_time}'`, 422);
        }

        const startMin = timeToMinutes(normalizedStart);
        const endMin   = timeToMinutes(normalizedEnd);

        if (startMin >= endMin) {
          return error(
            res,
            `Start time (${session.start_time}) must be earlier than end time (${session.end_time}) on ${day}`,
            422
          );
        }

        // is_available: false if the whole day is disabled, or if session.is_available is false
        const sessionAvailable = dayIsAvailable && (session.is_available !== undefined ? Boolean(session.is_available) : true);

        parsedDaySessions.push({
          doctor_id: doctorId,
          day,
          start_time: normalizedStart,
          end_time: normalizedEnd,
          slot_duration: session.slot_duration || 30,
          is_available: sessionAvailable,
          startMin,
          endMin,
          rawStart: session.start_time,
          rawEnd: session.end_time
        });
      }

      // Check for overlapping sessions on the same day
      parsedDaySessions.sort((a, b) => a.startMin - b.startMin);
      for (let i = 0; i < parsedDaySessions.length - 1; i++) {
        if (parsedDaySessions[i].endMin > parsedDaySessions[i + 1].startMin) {
          return error(
            res,
            `Overlapping sessions on ${day}: [${parsedDaySessions[i].rawStart} - ${parsedDaySessions[i].rawEnd}] overlaps with [${parsedDaySessions[i + 1].rawStart} - ${parsedDaySessions[i + 1].rawEnd}]`,
            422
          );
        }
      }

      // Add to batch insert list
      parsedDaySessions.forEach(({ doctor_id, day, start_time, end_time, slot_duration, is_available }) => {
        recordsToInsert.push({
          doctor_id,
          day,
          start_time,
          end_time,
          slot_duration,
          is_available
        });
      });
    }

    // 3. Atomically update database within a transaction
    await db.sequelize.transaction(async (t) => {
      // Delete old schedules for this specific doctor only
      await db.DoctorSchedule.destroy({
        where: { doctor_id: doctorId },
        transaction: t
      });

      // Insert new schedules if any
      if (recordsToInsert.length > 0) {
        await db.DoctorSchedule.bulkCreate(recordsToInsert, { transaction: t });
      }
    });

    // 4. Fetch and return updated schedules
    const updatedSchedules = await db.DoctorSchedule.findAll({
      where: { doctor_id: doctorId },
      order: [
        ["day", "ASC"],
        ["start_time", "ASC"]
      ]
    });

    return success(res, "Doctor weekly schedule saved successfully", updatedSchedules);
  } catch (err) {
    console.error("[schedule.saveWeeklySchedule]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// POST /api/clinic/doctors/:doctorId/schedules  (clinic admin - single slot)
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

// ------------------------------------------------------------------
// GET /api/clinic/schedules/today  (clinic admin)
// ------------------------------------------------------------------
exports.getTodaySchedules = async (req, res) => {
  try {
    const clinicId = req.user.id;
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayDayName = daysOfWeek[new Date().getDay()];

    const schedules = await db.DoctorSchedule.findAll({
      where: { day: todayDayName },
      include: [
        {
          model: db.Doctor,
          as: "doctor",
          where: { clinic_id: clinicId, status: "Active" },
          attributes: ["id", "name", "specialization", "profile_image", "status"]
        }
      ],
      order: [["start_time", "ASC"]]
    });

    return success(res, "Today's schedules fetched", schedules);
  } catch (err) {
    console.error("[schedule.getTodaySchedules]", err);
    return error(res, "Internal server error", 500);
  }
};

