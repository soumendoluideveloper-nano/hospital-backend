/**
 * Dashboard Controller (Super Admin)
 * Platform-wide aggregate statistics.
 */

const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const db     = require("../../../common/models");
const { success, error } = require("../../../common/helpers/response.helper");

// ------------------------------------------------------------------
// GET /api/admin/dashboard
// ------------------------------------------------------------------
exports.getDashboard = async (req, res) => {
  try {
    const [
      total_clinics,
      active_clinics,
      total_patients,
      active_patients,
      total_doctors,
      total_appointments,
      pending_appointments,
      total_test_bookings,
      total_enquiries
    ] = await Promise.all([
      db.Clinic.count(),
      db.Clinic.count({ where: { status: "Active" } }),
      db.Patient.count(),
      db.Patient.count({ where: { status: "Active" } }),
      db.Doctor.count({ where: { status: "Active" } }),
      db.Appointment.count(),
      db.Appointment.count({ where: { status: "Pending" } }),
      db.TestBooking.count(),
      db.Enquiry.count({ where: { status: "Pending" } })
    ]);

    return success(res, "Dashboard stats fetched", {
      clinics:      { total: total_clinics,   active: active_clinics   },
      patients:     { total: total_patients,  active: active_patients  },
      doctors:      { active: total_doctors                             },
      appointments: { total: total_appointments, pending: pending_appointments },
      lab_bookings: { total: total_test_bookings                       },
      enquiries:    { pending: total_enquiries                          }
    });
  } catch (err) {
    console.error("[dashboard.getDashboard]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// GET /api/admin/clinics  (paginated list with filters)
// ------------------------------------------------------------------
exports.listClinics = async (req, res) => {
  try {
    const { status, has_lab, city, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const where  = {};
    if (status)  where.status  = status;
    if (has_lab) where.has_lab = has_lab === "true";
    if (city)    where.city    = city;

    const { count, rows } = await db.Clinic.findAndCountAll({
      where,
      attributes: { exclude: ["password","token"] },
      limit:  Number(limit),
      offset: Number(offset),
      order:  [["created_at","DESC"]]
    });

    return success(res, "Clinics fetched", rows, 200, {
      total: count, page: Number(page), limit: Number(limit)
    });
  } catch (err) {
    console.error("[dashboard.listClinics]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// PATCH /api/admin/clinics/:id/status
// Body: { status: "Active" | "Inactive" }
// ------------------------------------------------------------------
exports.updateClinicStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Active","Inactive"].includes(status)) {
      return error(res, "Status must be Active or Inactive");
    }

    const clinic = await db.Clinic.findByPk(req.params.id);
    if (!clinic) return error(res, "Clinic not found", 404);

    await clinic.update({ status });

    await db.Notification.create({
      receiver_type: "Clinic",
      receiver_id:   clinic.id,
      title:         `Account ${status}`,
      message:       `Your clinic account has been ${status.toLowerCase()} by the admin.`
    });

    return success(res, `Clinic status updated to ${status}`);
  } catch (err) {
    console.error("[dashboard.updateClinicStatus]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// POST /api/admin/clinics (Create Clinic)
// ------------------------------------------------------------------
exports.createClinic = async (req, res) => {
  try {
    const {
      name,
      owner_name,
      email,
      phone,
      password,
      registration_no,
      address,
      city,
      state,
      country,
      latitude,
      longitude,
      description,
      has_lab,
      status,
    } = req.body;

    if (!name || !owner_name || !email || !phone) {
      return error(res, "Name, Owner Name, Email and Phone are required");
    }

    const existingEmail = await db.Clinic.findOne({ where: { email } });
    if (existingEmail) return error(res, "Email already registered", 409);

    const existingPhone = await db.Clinic.findOne({ where: { phone } });
    if (existingPhone) return error(res, "Phone already registered", 409);

    const defaultPwd = password || "Clinic@123";
    const hashedPassword = await bcrypt.hash(defaultPwd, 10);

    const clinic = await db.Clinic.create({
      name,
      owner_name,
      email,
      phone,
      password: hashedPassword,
      registration_no: registration_no || null,
      address: address || null,
      city: city || null,
      state: state || null,
      country: country || null,
      latitude: latitude || null,
      longitude: longitude || null,
      description: description || null,
      has_lab: has_lab === true || has_lab === "true",
      status: status || "Active",
    });

    clinic.password = undefined;
    clinic.token = undefined;

    return success(res, "Clinic created successfully", clinic, 201);
  } catch (err) {
    console.error("[dashboard.createClinic]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// PUT /api/admin/clinics/:id (Update Clinic)
// ------------------------------------------------------------------
exports.updateClinic = async (req, res) => {
  try {
    const clinic = await db.Clinic.findByPk(req.params.id);
    if (!clinic) return error(res, "Clinic not found", 404);

    const {
      name,
      owner_name,
      email,
      phone,
      password,
      registration_no,
      address,
      city,
      state,
      country,
      latitude,
      longitude,
      description,
      has_lab,
      status,
    } = req.body;

    if (email && email !== clinic.email) {
      const existingEmail = await db.Clinic.findOne({
        where: { email, id: { [Op.ne]: clinic.id } },
      });
      if (existingEmail) return error(res, "Email already registered to another clinic", 409);
    }

    if (phone && phone !== clinic.phone) {
      const existingPhone = await db.Clinic.findOne({
        where: { phone, id: { [Op.ne]: clinic.id } },
      });
      if (existingPhone) return error(res, "Phone already registered to another clinic", 409);
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (owner_name !== undefined) updates.owner_name = owner_name;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (registration_no !== undefined) updates.registration_no = registration_no;
    if (address !== undefined) updates.address = address;
    if (city !== undefined) updates.city = city;
    if (state !== undefined) updates.state = state;
    if (country !== undefined) updates.country = country;
    if (latitude !== undefined) updates.latitude = latitude;
    if (longitude !== undefined) updates.longitude = longitude;
    if (description !== undefined) updates.description = description;
    if (has_lab !== undefined) updates.has_lab = has_lab === true || has_lab === "true";
    if (status !== undefined) updates.status = status;

    if (password) {
      updates.password = await bcrypt.hash(password, 10);
    }

    await clinic.update(updates);

    const updated = await db.Clinic.findByPk(clinic.id, {
      attributes: { exclude: ["password", "token"] },
    });

    return success(res, "Clinic updated successfully", updated);
  } catch (err) {
    console.error("[dashboard.updateClinic]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// DELETE /api/admin/clinics/:id (Delete Clinic)
// ------------------------------------------------------------------
exports.deleteClinic = async (req, res) => {
  try {
    const clinic = await db.Clinic.findByPk(req.params.id);
    if (!clinic) return error(res, "Clinic not found", 404);

    await clinic.destroy();
    return success(res, "Clinic deleted successfully");
  } catch (err) {
    console.error("[dashboard.deleteClinic]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// GET /api/admin/patients  (paginated list)
// ------------------------------------------------------------------
exports.listPatients = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const where  = {};
    if (status) where.status = status;

    const { count, rows } = await db.Patient.findAndCountAll({
      where,
      attributes: { exclude: ["password","token"] },
      limit:  Number(limit),
      offset: Number(offset),
      order:  [["created_at","DESC"]]
    });

    return success(res, "Patients fetched", rows, 200, {
      total: count, page: Number(page), limit: Number(limit)
    });
  } catch (err) {
    console.error("[dashboard.listPatients]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// PATCH /api/admin/patients/:id/status
// ------------------------------------------------------------------
exports.updatePatientStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Active","Inactive"].includes(status)) {
      return error(res, "Status must be Active or Inactive");
    }

    const patient = await db.Patient.findByPk(req.params.id);
    if (!patient) return error(res, "Patient not found", 404);

    await patient.update({ status });
    return success(res, `Patient status updated to ${status}`);
  } catch (err) {
    console.error("[dashboard.updatePatientStatus]", err);
    return error(res, "Internal server error", 500);
  }
};
