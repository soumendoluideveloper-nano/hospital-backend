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
// Body (JSON): any subset of { name, owner_name, email,
//   registration_no, address, city, state, country, pincode,
//   latitude, longitude, description, has_lab }
// Rules:
//   • Only fields present in the body are updated.
//   • Empty strings are rejected — omit the key to keep the current value.
//   • A multipart upload with field name "logo" replaces the clinic logo.
// ------------------------------------------------------------------
exports.updateProfile = async (req, res) => {
  try {
    const clinicId = req.user.id;
    console.log(req.body);
    // ── 1. Validate incoming body ──────────────────────────────────
    const { error: validErr, value: validated } = updateProfileSchema.validate(req.body, {
      abortEarly: true,   // stop at first error for a clear message
      convert:    true    // coerce "true"/"false" strings → booleans, etc.
    });
    if (validErr) return error(res, validErr.details[0].message, 422);

    // ── 2. Build updates object — only fields explicitly provided ──
    //   Fields the client did not send are left untouched in the DB.
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

    // ── 3. Handle optional logo upload ────────────────────────────
    if (req.file) {
      updates.logo = "uploads/" + req.file.path.replace(/\\/g, "/").split("uploads/")[1];
    }

    // ── 4. Nothing to update? Return current profile as-is ────────
    if (Object.keys(updates).length === 0) {
      const current = await db.Clinic.findByPk(clinicId, {
        attributes: { exclude: ["password", "token"] }
      });
      return success(res, "No changes provided — profile unchanged", current);
    }

    // ── 5. Persist & return updated record ────────────────────────
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
    const todayDayName = daysOfWeek[new Date().getDay()];
    const todayDateStr = new Date().toISOString().split("T")[0];

    const [doctorsCount, schedulesCount, patientsCount, clinic] = await Promise.all([
      // 1. Total Active Doctors belonging to authenticated clinic
      db.Doctor.count({
        where: { clinic_id: clinicId, status: "Active" }
      }),

      // 2. Today's active Doctor Schedule sessions for active doctors in this clinic
      db.DoctorSchedule.count({
        where: { day: todayDayName, is_available: true },
        include: [{
          model: db.Doctor,
          as: "doctor",
          where: { clinic_id: clinicId, status: "Active" },
          required: true
        }]
      }),

      // 3. Today's Unique Patients with appointments today for this clinic
      db.Appointment.count({
        distinct: true,
        col: "patient_id",
        where: {
          clinic_id: clinicId,
          appointment_date: todayDateStr,
          status: { [Op.notIn]: ["Cancelled", "Rejected"] }
        }
      }),

      // 4. Authenticated clinic details for profile_views and has_lab permission
      db.Clinic.findByPk(clinicId, {
        attributes: ["id", "profile_views", "has_lab"]
      })
    ]);

    return success(res, "Dashboard fetched", {
      total_doctors:    doctorsCount,
      todays_schedule:  schedulesCount,
      todays_patients:  patientsCount,
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
// Body: { current_password, new_password, confirm_password }
// ------------------------------------------------------------------
exports.changePassword = async (req, res) => {
  try {
    const clinicId = req.user.id;

    // ── 1. Validate request body ───────────────────────────────────
    const { error: validErr, value } = changePasswordSchema.validate(req.body, {
      abortEarly: true
    });
    if (validErr) return error(res, validErr.details[0].message, 422);

    const { current_password, new_password } = value;

    // ── 2. Fetch clinic WITH password field ───────────────────────
    const clinic = await db.Clinic.findByPk(clinicId);
    if (!clinic) return error(res, "Clinic not found2", 404);

    // ── 3. Verify current password ────────────────────────────────
    const isMatch = await bcrypt.compare(current_password, clinic.password);
    if (!isMatch) {
      return error(res, "Current password is incorrect", 401);
    }

    // ── 4. Hash & save new password ───────────────────────────────
    const hashed = await bcrypt.hash(new_password, 10);
    await db.Clinic.update({ password: hashed }, { where: { id: clinicId } });

    return success(res, "Password changed successfully");
  } catch (err) {
    console.error("[clinic.changePassword]", err);
    return error(res, "Internal server error", 500);
  }
};
