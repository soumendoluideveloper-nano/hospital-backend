/**
 * Clinic Controller
 * Handles clinic profile management and public browsing endpoints.
 */

const { Op }     = require("sequelize");
const db         = require("../../../common/models");
const { success, error, paginated } = require("../../../common/helpers/response.helper");

// ------------------------------------------------------------------
// GET /api/clinic/list  (public — patient-facing)
// Query: city, state, country, has_lab, search, page, limit
// ------------------------------------------------------------------
exports.listClinics = async (req, res) => {
  try {
    const { city, state, country, has_lab, search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = { status: "Active" };
    if (city)    where.city    = { [Op.like]: `%${city}%` };
    if (state)   where.state   = { [Op.like]: `%${state}%` };
    if (country) where.country = { [Op.like]: `%${country}%` };
    if (has_lab !== undefined) where.has_lab = has_lab === "true";
    if (search)  where.name    = { [Op.like]: `%${search}%` };

    const { count, rows } = await db.Clinic.findAndCountAll({
      where,
      attributes: { exclude: ["password", "token"] },
      limit: Number(limit),
      offset: Number(offset),
      order: [["created_at", "DESC"]]
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
    if (!clinic) return error(res, "Clinic not found", 404);
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
    const allowed  = ["name","owner_name","phone","registration_no","address","city",
                      "state","country","latitude","longitude","description","has_lab"];

    const updates = {};
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (req.file) updates.logo = req.file.path.replace(/\\/g, "/");

    await db.Clinic.update(updates, { where: { id: clinicId } });

    const updated = await db.Clinic.findByPk(clinicId, {
      attributes: { exclude: ["password","token"] }
    });
    return success(res, "Profile updated", updated);
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
    const [doctors, appointments, enquiries, calls] = await Promise.all([
      db.Doctor.count({ where: { clinic_id: clinicId, status: "Active" } }),
      db.Appointment.count({ where: { clinic_id: clinicId } }),
      db.Enquiry.count({ where: { clinic_id: clinicId, status: "Pending" } }),
      db.CallLog.count({ where: { clinic_id: clinicId } })
    ]);

    return success(res, "Dashboard fetched", {
      total_doctors:              doctors,
      total_appointments:         appointments,
      pending_enquiries:          enquiries,
      total_calls:                calls
    });
  } catch (err) {
    console.error("[clinic.getDashboard]", err);
    return error(res, "Internal server error", 500);
  }
};
