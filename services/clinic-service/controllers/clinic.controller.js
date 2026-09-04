/**
 * Clinic Controller
 * Handles clinic profile management and public browsing endpoints.
 */

const { Op }     = require("sequelize");
const bcrypt     = require("bcryptjs");
const db         = require("../../../common/models");
const { success, error, paginated } = require("../../../common/helpers/response.helper");
const { updateProfileSchema, changePasswordSchema } = require("../validation/clinic.validation");

// ------------------------------------------------------------------
// GET /api/clinic/list  (public — patient-facing)
// Query: city, state, country, has_lab, search, latitude, longitude, radius_km, page, limit
// ------------------------------------------------------------------
exports.listClinics = async (req, res) => {
  try {
    const { city, state, country, has_lab, search, latitude, longitude, radius_km, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = { status: "Active" };
    if (city)    where.city    = { [Op.like]: `%${city}%` };
    if (state)   where.state   = { [Op.like]: `%${state}%` };
    if (country) where.country = { [Op.like]: `%${country}%` };
    if (has_lab !== undefined) where.has_lab = has_lab === "true";
    if (search)  where.name    = { [Op.like]: `%${search}%` };

    let attributes = { exclude: ["password", "token"] };
    let order = [["created_at", "DESC"]];

    if (latitude && longitude && !isNaN(Number(latitude)) && !isNaN(Number(longitude))) {
      const userLat = Number(latitude);
      const userLng = Number(longitude);

      // Haversine formula in kilometers
      const distanceFormula = `(6371 * acos(least(1.0, greatest(-1.0, cos(radians(${userLat})) * cos(radians(latitude)) * cos(radians(longitude) - radians(${userLng})) + sin(radians(${userLat})) * sin(radians(latitude))))))`;

      attributes = {
        include: [
          [db.sequelize.literal(distanceFormula), "distance_km"]
        ],
        exclude: ["password", "token"]
      };

      if (radius_km && !isNaN(Number(radius_km))) {
        where[Op.and] = db.sequelize.literal(`${distanceFormula} <= ${Number(radius_km)}`);
      }

      order = [
        [db.sequelize.literal("(distance_km IS NULL)"), "ASC"],
        [db.sequelize.literal("distance_km"), "ASC"]
      ];
    }

    const { count, rows } = await db.Clinic.findAndCountAll({
      where,
      attributes,
      limit: Number(limit),
      offset: Number(offset),
      order
    });

    return paginated(res, "Clinics fetched", rows, count, page, limit);
  } catch (err) {
    console.error("[clinic.listClinics]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// GET /api/clinic/:id  (public)
// ------------------------------------------------------------------
exports.getClinicById = async (req, res) => {
  try {
    const clinic = await db.Clinic.findOne({
      where:      { id: req.params.id, status: "Active" },
      attributes: { exclude: ["password", "token"] },
      include: [
        {
          model:      db.Doctor,
          as:         "doctors",
          where:      { status: "Active" },
          required:   false,
          attributes: ["id","name","specialization","qualification","experience","consultation_fee","profile_image","about"]
        }
      ]
    });
    if (!clinic) return error(res, "Clinic not found1", 404);

    // Increment profile views asynchronously without slowing response
    db.Clinic.increment("profile_views", { by: 1, where: { id: clinic.id } }).catch(err => {
      console.error("[clinic.getClinicById] Failed to increment profile_views:", err.message);
    });

    return success(res, "Clinic fetched", clinic);
  } catch (err) {
    console.error("[clinic.getClinicById]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// PUT /api/clinic/profile  (clinic admin — protected)
// ------------------------------------------------------------------
exports.updateProfile = async (req, res) => {
  try {
    const clinicId = req.user.id;
    console.log(req.body);
    const { error: validErr, value: validated } = updateProfileSchema.validate(req.body, {
      abortEarly: true,
      convert:    true
    });
    if (validErr) return error(res, validErr.details[0].message, 422);

    const allowedFields = [
      "name", "owner_name", "email",
      "registration_no", "address", "city",
      "state", "country", "pincode", "latitude", "longitude",
      "description", "has_lab"
    ];

    const updates = {};
    allowedFields.forEach(field => {
      if (validated[field] !== undefined) {
        updates[field] = validated[field];
      }
    });

    if (req.file) {
      updates.logo = "uploads/" + req.file.path.replace(/\\/g, "/").split("uploads/")[1];
    }

    if (Object.keys(updates).length === 0) {
      const current = await db.Clinic.findByPk(clinicId, {
        attributes: { exclude: ["password", "token"] }
      });
      return success(res, "No changes provided — profile unchanged", current);
    }

    await db.Clinic.update(updates, { where: { id: clinicId } });

    const updated = await db.Clinic.findByPk(clinicId, {
      attributes: { exclude: ["password", "token"] }
    });
    return success(res, "Profile updated successfully", updated);
  } catch (err) {
    console.error("[clinic.updateProfile]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// GET /api/clinic/dashboard  (clinic admin — protected)
// Summary counts for the clinic dashboard
// ------------------------------------------------------------------
exports.getDashboard = async (req, res) => {
  try {
    const clinicId = req.user.id;

    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const now = new Date();
    const todayDayName = daysOfWeek[now.getDay()];
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const todayDateStr = `${year}-${month}-${day}`;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [doctorsCount, schedulesCount, apptPatients, acceptedEnquiries, clinic] = await Promise.all([
      // 1. Total Active Doctors
      db.Doctor.count({
        where: { clinic_id: clinicId, status: "Active" }
      }),

      // 2. Today's active Doctor Schedule sessions
      db.DoctorSchedule.count({
        where: { day: todayDayName, is_available: true },
        include: [{
          model: db.Doctor,
          as: "doctor",
          where: { clinic_id: clinicId, status: "Active" },
          required: true
        }]
      }),

      // 3a. Appointments today
      db.Appointment.findAll({
        attributes: ["patient_id"],
        where: {
          clinic_id: clinicId,
          appointment_date: todayDateStr,
          status: { [Op.notIn]: ["Cancelled", "Rejected"] }
        },
        raw: true
      }),

      // 3b. Accepted / Confirmed Enquiries for today
      db.Enquiry.findAll({
        attributes: ["patient_id"],
        where: {
          clinic_id: clinicId,
          status: { [Op.in]: ["Accepted", "Confirmed"] },
          appointment_date: todayDateStr
        },
        raw: true
      }),

      // 4. Authenticated clinic details
      db.Clinic.findByPk(clinicId, {
        attributes: ["id", "profile_views", "has_lab"]
      })
    ]);

    // Calculate unique today's patients count
    const uniquePatientIds = new Set([
      ...(apptPatients || []).map(p => String(p.patient_id)),
      ...(acceptedEnquiries || []).map(p => String(p.patient_id))
    ]);

    return success(res, "Dashboard fetched", {
      total_doctors:    doctorsCount,
      todays_schedule:  schedulesCount,
      todays_patients:  uniquePatientIds.size,
      profile_views:    clinic ? (clinic.profile_views || 0) : 0,
      has_lab:          clinic ? Boolean(clinic.has_lab) : false
    });
  } catch (err) {
    console.error("[clinic.getDashboard]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// PUT /api/clinic/change-password  (clinic admin — protected)
// ------------------------------------------------------------------
exports.changePassword = async (req, res) => {
  try {
    const clinicId = req.user.id;

    const { error: validErr, value } = changePasswordSchema.validate(req.body, {
      abortEarly: true
    });
    if (validErr) return error(res, validErr.details[0].message, 422);

    const { current_password, new_password } = value;

    const clinic = await db.Clinic.findByPk(clinicId);
    if (!clinic) return error(res, "Clinic not found2", 404);

    const isMatch = await bcrypt.compare(current_password, clinic.password);
    if (!isMatch) {
      return error(res, "Current password is incorrect", 401);
    }

    const hashed = await bcrypt.hash(new_password, 10);
    await db.Clinic.update({ password: hashed }, { where: { id: clinicId } });

    return success(res, "Password changed successfully");
  } catch (err) {
    console.error("[clinic.changePassword]", err);
    return error(res, "Internal server error", 500);
  }
};
