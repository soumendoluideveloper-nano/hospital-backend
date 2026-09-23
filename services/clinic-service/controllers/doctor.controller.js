/**
 * Doctor Controller
 * Full CRUD for doctors, managed by clinic admins.
 * Patients can list and view doctor profiles, multi-clinic associations, and schedule slots.
 */

const { Op } = require("sequelize");
const db     = require("../../../common/models");
const { success, error, paginated } = require("../../../common/helpers/response.helper");

/**
 * Calculates Haversine distance in KM between two lat/long points.
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (
    lat1 === null || lat1 === undefined ||
    lon1 === null || lon1 === undefined ||
    lat2 === null || lat2 === undefined ||
    lon2 === null || lon2 === undefined ||
    isNaN(Number(lat1)) || isNaN(Number(lon1)) ||
    isNaN(Number(lat2)) || isNaN(Number(lon2))
  ) {
    return null;
  }
  const R = 6371; // Earth's radius in km
  const dLat = (Number(lat2) - Number(lat1)) * Math.PI / 180;
  const dLon = (Number(lon2) - Number(lon1)) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(Number(lat1) * Math.PI / 180) * Math.cos(Number(lat2) * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10;
}

/**
 * Format 24h or HH:MM:SS time string to 12h format (e.g. "10:30 AM").
 */
function formatTime12h(timeStr) {
  if (!timeStr) return "";
  const parts = String(timeStr).split(":");
  if (parts.length >= 2) {
    let h = parseInt(parts[0], 10);
    const m = parts[1];
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
  }
  return timeStr;
}

// ------------------------------------------------------------------
// POST /api/clinic/doctors  (clinic admin)
// ------------------------------------------------------------------
exports.addDoctor = async (req, res) => {
  try {
    const clinicId = req.user.id;
    const {
      name, email, phone, specialization, qualification,
      experience, consultation_fee, about, profile_image, registration_no
    } = req.body;

    const doctor = await db.Doctor.create({
      clinic_id: clinicId,
      name, email, phone, specialization, qualification,
      experience, consultation_fee, about, profile_image, registration_no
    });

    // Also register in doctor_clinics junction table
    if (db.DoctorClinic) {
      await db.DoctorClinic.findOrCreate({
        where: { doctor_id: doctor.id, clinic_id: clinicId },
        defaults: { doctor_id: doctor.id, clinic_id: clinicId, status: "Active" }
      }).catch(err => console.log("[DoctorClinic create error non-fatal]", err.message));
    }

    return success(res, "Doctor added successfully", doctor, 201);
  } catch (err) {
    console.error("[doctor.addDoctor]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// GET /api/clinic/doctors  (clinic admin — own doctors)
// ------------------------------------------------------------------
exports.listDoctors = async (req, res) => {
  try {
    const clinicId = req.user.id;
    const { search, status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = { clinic_id: clinicId };
    if (status) where.status = status;
    if (search) where.name   = { [Op.like]: `%${search}%` };

    const { count, rows } = await db.Doctor.findAndCountAll({
      where,
      include: [{ model: db.DoctorSchedule, as: "schedules" }],
      limit:  Number(limit),
      offset: Number(offset),
      order:  [["created_at", "DESC"]]
    });
    return paginated(res, "Doctors fetched", rows, count, page, limit);
  } catch (err) {
    console.error("[doctor.listDoctors]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// GET /api/clinic/doctors/public  (public — patient view all doctors)
// ------------------------------------------------------------------
exports.listAllPublicDoctors = async (req, res) => {
  try {
    const { specialization, search, city, latitude, longitude, page = 1, limit = 30 } = req.query;
    const offset = (page - 1) * limit;

    const userLat = latitude !== undefined && latitude !== null && !isNaN(Number(latitude)) ? Number(latitude) : null;
    const userLng = longitude !== undefined && longitude !== null && !isNaN(Number(longitude)) ? Number(longitude) : null;

    const where = { status: "Active" };
    if (specialization && specialization !== "All") {
      where.specialization = { [Op.like]: `%${specialization.trim()}%` };
    }

    if (search && search.trim()) {
      const s = `%${search.trim()}%`;
      where[Op.or] = [
        { name: { [Op.like]: s } },
        { specialization: { [Op.like]: s } },
        { qualification: { [Op.like]: s } }
      ];
    }

    const clinicAttributes = ["id", "name", "city", "state", "address", "phone", "latitude", "longitude", "logo", "has_lab"];

    const includeModels = [
      {
        model:      db.Clinic,
        as:         "clinic",
        attributes: clinicAttributes,
        required:   false
      },
      {
        model:      db.DoctorSchedule,
        as:         "schedules",
        where:      { is_available: true },
        required:   false
      }
    ];

    if (db.Clinic && db.DoctorClinic) {
      includeModels.push({
        model:      db.Clinic,
        as:         "affiliated_clinics",
        attributes: clinicAttributes,
        through:    { attributes: ["status"] },
        required:   false
      });
    }

    const doctors = await db.Doctor.findAll({
      where,
      attributes: { exclude: ["phone", "email", "created_at", "updated_at"] },
      include: includeModels,
      distinct: true,
      order: [["id", "DESC"]]
    });

    // Map each doctor, gather all unique clinics and calculate distances
    const formattedDoctors = doctors.map(doc => {
      const docJson = doc.toJSON();
      const clinicMap = new Map();

      // Primary clinic
      if (docJson.clinic && docJson.clinic.id) {
        clinicMap.set(Number(docJson.clinic.id), docJson.clinic);
      }

      // Affiliated clinics
      if (Array.isArray(docJson.affiliated_clinics)) {
        docJson.affiliated_clinics.forEach(c => {
          if (c && c.id && !clinicMap.has(Number(c.id))) {
            clinicMap.set(Number(c.id), c);
          }
        });
      }

      // Calculate distance for all clinics
      const allClinics = Array.from(clinicMap.values()).map(clinicItem => {
        const dist = calculateHaversineDistance(userLat, userLng, clinicItem.latitude, clinicItem.longitude);
        return {
          ...clinicItem,
          distance_km: dist !== null ? dist : null
        };
      });

      // Sort clinics by distance ascending (null distances at the end)
      allClinics.sort((a, b) => {
        if (a.distance_km === null && b.distance_km === null) return 0;
        if (a.distance_km === null) return 1;
        if (b.distance_km === null) return -1;
        return a.distance_km - b.distance_km;
      });

      if (allClinics.length > 0) {
        allClinics[0].is_nearest = true;
      }

      const nearestClinic = allClinics.length > 0 ? allClinics[0] : (docJson.clinic || null);

      return {
        ...docJson,
        clinic: nearestClinic,
        clinics: allClinics,
        nearest_distance_km: nearestClinic?.distance_km !== undefined ? nearestClinic.distance_km : null
      };
    });

    // Sort doctors by nearest clinic distance
    if (userLat !== null && userLng !== null) {
      formattedDoctors.sort((a, b) => {
        if (a.nearest_distance_km === null && b.nearest_distance_km === null) return 0;
        if (a.nearest_distance_km === null) return 1;
        if (b.nearest_distance_km === null) return -1;
        return a.nearest_distance_km - b.nearest_distance_km;
      });
    }

    const totalCount = formattedDoctors.length;
    const paginatedList = formattedDoctors.slice(offset, offset + Number(limit));

    return paginated(res, "Doctors fetched", paginatedList, totalCount, page, limit);
  } catch (err) {
    console.error("[doctor.listAllPublicDoctors]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// GET /api/clinic/doctors/public/:clinicId  (public — clinic specific)
// ------------------------------------------------------------------
exports.listPublicDoctors = async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { specialization, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const where = { clinic_id: clinicId, status: "Active" };
    if (specialization && specialization !== "All") where.specialization = { [Op.like]: `%${specialization}%` };

    const { count, rows } = await db.Doctor.findAndCountAll({
      where,
      attributes: { exclude: ["phone", "email", "created_at", "updated_at"] },
      include: [
        {
          model:      db.Clinic,
          as:         "clinic",
          attributes: ["id", "name", "city", "state", "address", "phone", "latitude", "longitude", "logo", "has_lab"],
          required:   false
        },
        {
          model:      db.DoctorSchedule,
          as:         "schedules",
          where:      { is_available: true },
          required:   false
        }
      ],
      distinct: true,
      limit:  Number(limit),
      offset: Number(offset),
      order: [["id", "DESC"]]
    });
    return paginated(res, "Doctors fetched", rows, count, page, limit);
  } catch (err) {
    console.error("[doctor.listPublicDoctors]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// GET /api/clinic/doctors/:id  (public — doctor profile & all clinics)
// ------------------------------------------------------------------
exports.getDoctorById = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;
    const userLat = latitude !== undefined && latitude !== null && !isNaN(Number(latitude)) ? Number(latitude) : null;
    const userLng = longitude !== undefined && longitude !== null && !isNaN(Number(longitude)) ? Number(longitude) : null;

    const clinicAttributes = ["id", "name", "city", "state", "address", "phone", "latitude", "longitude", "logo", "has_lab"];

    const includeModels = [
      {
        model:      db.Clinic,
        as:         "clinic",
        attributes: clinicAttributes,
        required:   false
      },
      {
        model:      db.DoctorSchedule,
        as:         "schedules",
        where:      { is_available: true },
        required:   false
      },
      {
        model:    db.DoctorReview,
        as:       "reviews",
        include:  [{ model: db.Patient, as: "patient", attributes: ["id", "name", "profile_image"] }],
        required: false
      }
    ];

    if (db.Clinic && db.DoctorClinic) {
      includeModels.push({
        model:      db.Clinic,
        as:         "affiliated_clinics",
        attributes: clinicAttributes,
        through:    { attributes: ["status"] },
        required:   false
      });
    }

    const doctor = await db.Doctor.findByPk(req.params.id, {
      attributes: { exclude: ["phone", "email", "created_at", "updated_at"] },
      include: includeModels
    });

    if (!doctor) return error(res, "Doctor not found", 404);

    const docJson = doctor.toJSON();
    const clinicMap = new Map();

    // Primary clinic
    if (docJson.clinic && docJson.clinic.id) {
      clinicMap.set(Number(docJson.clinic.id), docJson.clinic);
    }

    // Affiliated clinics
    if (Array.isArray(docJson.affiliated_clinics)) {
      docJson.affiliated_clinics.forEach(c => {
        if (c && c.id && !clinicMap.has(Number(c.id))) {
          clinicMap.set(Number(c.id), c);
        }
      });
    }

    // Calculate distance for all clinics
    const allClinics = Array.from(clinicMap.values()).map(clinicItem => {
      const dist = calculateHaversineDistance(userLat, userLng, clinicItem.latitude, clinicItem.longitude);
      return {
        ...clinicItem,
        distance_km: dist !== null ? dist : null
      };
    });

    // Sort clinics nearest first
    allClinics.sort((a, b) => {
      if (a.distance_km === null && b.distance_km === null) return 0;
      if (a.distance_km === null) return 1;
      if (b.distance_km === null) return -1;
      return a.distance_km - b.distance_km;
    });

    if (allClinics.length > 0) {
      allClinics[0].is_nearest = true;
    }

    const responseData = {
      ...docJson,
      clinic: allClinics[0] || docJson.clinic || null,
      clinics: allClinics
    };

    return success(res, "Doctor profile fetched", responseData);
  } catch (err) {
    console.error("[doctor.getDoctorById]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// GET /api/clinic/doctors/:doctorId/clinics/:clinicId/schedule
// Returns schedule timings and available slots for a specific date
// ------------------------------------------------------------------
exports.getDoctorClinicScheduleAndSlots = async (req, res) => {
  try {
    const { doctorId, clinicId } = req.params;
    const { date } = req.query;

    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    let formattedDate = "";
    let dayName = "";

    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [y, m, d] = date.split("-").map(Number);
      const parsedDate = new Date(y, m - 1, d, 12, 0, 0); // Noon avoids UTC timezone shifts
      formattedDate = date;
      dayName = daysOfWeek[parsedDate.getDay()];
    } else {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const dayOfMonth = String(now.getDate()).padStart(2, "0");
      formattedDate = `${year}-${month}-${dayOfMonth}`;
      dayName = daysOfWeek[now.getDay()];
    }

    // 1. Fetch schedules for this doctor on this day of the week
    let schedules = await db.DoctorSchedule.findAll({
      where: {
        doctor_id: doctorId,
        day: dayName,
        is_available: true
      },
      order: [["start_time", "ASC"]]
    });

    // Also fetch all active schedule days for this doctor
    const allDoctorSchedules = await db.DoctorSchedule.findAll({
      where: {
        doctor_id: doctorId,
        is_available: true
      },
      attributes: ["day"]
    });
    const availableDays = Array.from(new Set(allDoctorSchedules.map(s => s.day)));

    // If no custom schedule configured for this day, provide standard fallback practice sessions
    if (schedules.length === 0) {
      if (dayName !== "Sunday") {
        schedules = [
          { id: `def_m_${doctorId}`, doctor_id: Number(doctorId), day: dayName, start_time: "09:00:00", end_time: "13:00:00", slot_duration: 30, is_available: true },
          { id: `def_e_${doctorId}`, doctor_id: Number(doctorId), day: dayName, start_time: "17:00:00", end_time: "20:00:00", slot_duration: 30, is_available: true }
        ];
      } else {
        schedules = [
          { id: `def_sun_${doctorId}`, doctor_id: Number(doctorId), day: dayName, start_time: "10:00:00", end_time: "13:00:00", slot_duration: 30, is_available: true }
        ];
      }
    }

    // 2. Fetch existing appointments and enquiries for this doctor & clinic on this date
    const [existingAppointments, existingEnquiries] = await Promise.all([
      db.Appointment.findAll({
        where: {
          doctor_id: doctorId,
          clinic_id: clinicId,
          appointment_date: formattedDate,
          status: { [Op.notIn]: ["Cancelled", "Rejected"] }
        },
        attributes: ["appointment_time"]
      }),
      db.Enquiry.findAll({
        where: {
          doctor_id: doctorId,
          clinic_id: clinicId,
          appointment_date: formattedDate,
          status: { [Op.notIn]: ["Cancelled", "Closed"] }
        },
        attributes: ["appointment_time"]
      })
    ]);

    const bookedTimes = new Set();
    existingAppointments.forEach(a => {
      if (a.appointment_time) {
        bookedTimes.add(formatTime12h(a.appointment_time));
      }
    });
    existingEnquiries.forEach(e => {
      if (e.appointment_time) {
        bookedTimes.add(formatTime12h(e.appointment_time));
      }
    });

    // 3. Generate slots for each schedule session
    const generatedSlots = [];
    const sessionCards = schedules.map((sched, index) => {
      const slotDuration = sched.slot_duration > 0 ? Number(sched.slot_duration) : 30; // default 30 mins
      const [startH, startM] = String(sched.start_time).split(":").map(Number);
      const [endH, endM] = String(sched.end_time).split(":").map(Number);

      let currentMinutes = startH * 60 + (startM || 0);
      const endMinutes = endH * 60 + (endM || 0);
      const sessionSlots = [];

      while (currentMinutes + slotDuration <= endMinutes) {
        const slotH = Math.floor(currentMinutes / 60);
        const slotM = currentMinutes % 60;
        const time24 = `${String(slotH).padStart(2, "0")}:${String(slotM).padStart(2, "0")}:00`;
        const time12 = formatTime12h(time24);

        const endMinutesSlot = currentMinutes + slotDuration;
        const endSlotH = Math.floor(endMinutesSlot / 60);
        const endSlotM = endMinutesSlot % 60;
        const endTime24 = `${String(endSlotH).padStart(2, "0")}:${String(endSlotM).padStart(2, "0")}:00`;
        const endTime12 = formatTime12h(endTime24);
        const slotRange = `${time12} - ${endTime12}`;

        const isBooked = bookedTimes.has(time12) || bookedTimes.has(slotRange);

        const slotItem = {
          id: `${sched.id}_${time24}`,
          raw_time: time24,
          time: time12,
          end_time_raw: endTime24,
          end_time: endTime12,
          slot_range: slotRange,
          duration_minutes: slotDuration,
          available: !isBooked,
          booked: isBooked,
          schedule_id: sched.id,
          session_index: index + 1
        };

        generatedSlots.push(slotItem);
        sessionSlots.push(slotItem);

        currentMinutes += slotDuration;
      }

      const start12 = formatTime12h(sched.start_time);
      const end12 = formatTime12h(sched.end_time);

      return {
        id: sched.id,
        session_index: index + 1,
        session_name: `Session ${index + 1}`,
        start_time: sched.start_time,
        end_time: sched.end_time,
        start_formatted: start12,
        end_formatted: end12,
        timing_range: `${start12} - ${end12}`,
        slot_duration: slotDuration,
        slots: sessionSlots
      };
    });

    // 4. Build 7-day weekly schedule summary (Monday - Sunday) matching clinic app
    const allSchedules = await db.DoctorSchedule.findAll({
      where: { doctor_id: doctorId },
      order: [["start_time", "ASC"]]
    });

    const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const weeklySummary = dayOrder.map(d => {
      const dayScheds = allSchedules.filter(s => s.day === d && s.is_available);
      if (dayScheds.length > 0) {
        const timings = dayScheds.map(s => `${formatTime12h(s.start_time)} - ${formatTime12h(s.end_time)}`).join(", ");
        return {
          day: d,
          enabled: true,
          sessions_count: dayScheds.length,
          timings: timings,
          slot_duration: dayScheds[0].slot_duration || 30
        };
      } else {
        return {
          day: d,
          enabled: false,
          sessions_count: 0,
          timings: "Closed / Off",
          slot_duration: 30
        };
      }
    });

    return success(res, "Schedule and slots fetched successfully", {
      doctor_id: Number(doctorId),
      clinic_id: Number(clinicId),
      date: formattedDate,
      day: dayName,
      available_days: availableDays.length > 0 ? availableDays : daysOfWeek,
      schedules,
      sessions: sessionCards,
      weekly_schedule: weeklySummary,
      slots: generatedSlots
    });
  } catch (err) {
    console.error("[doctor.getDoctorClinicScheduleAndSlots]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// PUT /api/clinic/doctors/:id  (clinic admin)
// ------------------------------------------------------------------
exports.updateDoctor = async (req, res) => {
  try {
    const clinicId = req.user.id;
    const doctor   = await db.Doctor.findOne({ where: { id: req.params.id, clinic_id: clinicId } });
    if (!doctor) return error(res, "Doctor not found or not under your clinic", 404);

    const allowed = ["name","email","phone","specialization","qualification",
                     "experience","consultation_fee","about","status","profile_image","registration_no"];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    await doctor.update(updates);
    return success(res, "Doctor updated", doctor);
  } catch (err) {
    console.error("[doctor.updateDoctor]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// DELETE /api/clinic/doctors/:id  (clinic admin)
// ------------------------------------------------------------------
exports.removeDoctor = async (req, res) => {
  try {
    const clinicId = req.user.id;
    const doctor   = await db.Doctor.findOne({ where: { id: req.params.id, clinic_id: clinicId } });
    if (!doctor) return error(res, "Doctor not found or not under your clinic", 404);

    await doctor.update({ status: "Inactive" }); // Soft delete
    return success(res, "Doctor removed successfully");
  } catch (err) {
    console.error("[doctor.removeDoctor]", err);
    return error(res, "Internal server error", 500);
  }
};
