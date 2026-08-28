/**
 * Doctor Controller
 * Full CRUD for doctors, managed by clinic admins.
 * Patients can list and view doctor profiles.
 */

const { Op } = require("sequelize");
const db     = require("../../../common/models");
const { success, error, paginated } = require("../../../common/helpers/response.helper");

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

    // Input is already validated + sanitised by validate(addDoctorSchema) middleware
    const doctor = await db.Doctor.create({
      clinic_id: clinicId,
      name, email, phone, specialization, qualification,
      experience, consultation_fee, about, profile_image, registration_no
    });

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
    console.log(search, clinicId);
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
    const { specialization, search, city, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = { status: "Active" };
    if (specialization) where.specialization = { [Op.like]: `%${specialization}%` };
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { specialization: { [Op.like]: `%${search}%` } },
        { qualification: { [Op.like]: `%${search}%` } }
      ];
    }

    const clinicWhere = { status: "Active" };
    if (city) clinicWhere.city = { [Op.like]: `%${city}%` };

    const { count, rows } = await db.Doctor.findAndCountAll({
      where,
      attributes: { exclude: ["created_at","updated_at"] },
      include: [
        {
          model:      db.Clinic,
          as:         "clinic",
          where:      clinicWhere,
          attributes: ["id","name","city","state","address","phone"],
          required:   false
        },
        {
          model:      db.DoctorSchedule,
          as:         "schedules",
          where:      { is_available: true },
          required:   false
        }
      ],
      limit:  Number(limit),
      offset: Number(offset),
      order:  [["id", "DESC"]]
    });
    return paginated(res, "Doctors fetched", rows, count, page, limit);
  } catch (err) {
    console.error("[doctor.listAllPublicDoctors]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// GET /api/clinic/doctors/public/:clinicId  (public — patient view)
// ------------------------------------------------------------------
exports.listPublicDoctors = async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { specialization, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = { clinic_id: clinicId, status: "Active" };
    if (specialization) where.specialization = { [Op.like]: `%${specialization}%` };

    const { count, rows } = await db.Doctor.findAndCountAll({
      where,
      attributes: { exclude: ["created_at","updated_at"] },
      include: [
        {
          model:      db.DoctorSchedule,
          as:         "schedules",
          where:      { is_available: true },
          required:   false
        }
      ],
      limit:  Number(limit),
      offset: Number(offset)
    });
    return paginated(res, "Doctors fetched", rows, count, page, limit);
  } catch (err) {
    console.error("[doctor.listPublicDoctors]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// GET /api/clinic/doctors/:id  (public — doctor profile)
// ------------------------------------------------------------------
exports.getDoctorById = async (req, res) => {
  try {
    const doctor = await db.Doctor.findByPk(req.params.id, {
      include: [
        { model: db.Clinic,         as: "clinic",    attributes: ["id","name","city","state"] },
        { model: db.DoctorSchedule, as: "schedules", where: { is_available: true }, required: false },
        {
          model:    db.DoctorReview,
          as:       "reviews",
          include:  [{ model: db.Patient, as: "patient", attributes: ["id","name","profile_image"] }],
          required: false
        }
      ]
    });
    if (!doctor) return error(res, "Doctor not found", 404);
    return success(res, "Doctor profile fetched", doctor);
  } catch (err) {
    console.error("[doctor.getDoctorById]", err);
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
