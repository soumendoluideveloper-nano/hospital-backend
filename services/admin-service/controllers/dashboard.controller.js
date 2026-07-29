/**
 * Dashboard Controller (Super Admin)
 * Platform-wide aggregate statistics.
 */

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
