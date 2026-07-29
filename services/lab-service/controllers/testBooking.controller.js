/**
 * Test Booking Controller
 * Patients book lab tests; clinic updates booking status.
 */

const db     = require("../../../common/models");
const { success, error, paginated } = require("../../../common/helpers/response.helper");

// ------------------------------------------------------------------
// POST /api/lab/bookings  (patient)
// Body: { clinic_id, lab_test_id, booking_date, booking_time }
// ------------------------------------------------------------------
exports.bookTest = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { clinic_id, lab_test_id, booking_date, booking_time } = req.body;

    if (!clinic_id || !lab_test_id || !booking_date || !booking_time) {
      return error(res, "clinic_id, lab_test_id, booking_date, and booking_time are required");
    }

    const test = await db.LabTest.findOne({ where: { id: lab_test_id, clinic_id, status: "Active" } });
    if (!test) return error(res, "Lab test not found or inactive", 404);

    const booking = await db.TestBooking.create({
      patient_id: patientId, clinic_id, lab_test_id, booking_date, booking_time
    });

    // Notify clinic
    await db.Notification.create({
      receiver_type: "Clinic",
      receiver_id:   clinic_id,
      title:         "New Lab Test Booking",
      message:       `Patient #${patientId} has booked the test "${test.test_name}" on ${booking_date} at ${booking_time}.`
    });

    return success(res, "Test booked successfully", booking, 201);
  } catch (err) {
    console.error("[testBooking.bookTest]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// GET /api/lab/bookings/my  (patient — own bookings)
// ------------------------------------------------------------------
exports.myBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = { patient_id: req.user.id };
    if (status) where.status = status;

    const { count, rows } = await db.TestBooking.findAndCountAll({
      where,
      include: [
        { model: db.Clinic,   as: "clinic",   attributes: ["id","name","logo","phone","address"] },
        { model: db.LabTest,  as: "lab_test", attributes: ["id","test_name","price","report_duration"] },
        { model: db.LabReport,as: "report",   required: false }
      ],
      limit:  Number(limit),
      offset: Number(offset),
      order:  [["booking_date","DESC"]]
    });

    return paginated(res, "Bookings fetched", rows, count, page, limit);
  } catch (err) {
    console.error("[testBooking.myBookings]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// GET /api/lab/bookings  (clinic admin — all bookings for their clinic)
// ------------------------------------------------------------------
exports.clinicBookings = async (req, res) => {
  try {
    const clinicId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = { clinic_id: clinicId };
    if (status) where.status = status;

    const { count, rows } = await db.TestBooking.findAndCountAll({
      where,
      include: [
        { model: db.Patient,  as: "patient",  attributes: ["id","name","phone","email","profile_image"] },
        { model: db.LabTest,  as: "lab_test", attributes: ["id","test_name","price"] },
        { model: db.LabReport,as: "report",   required: false }
      ],
      limit:  Number(limit),
      offset: Number(offset),
      order:  [["booking_date","ASC"]]
    });

    return paginated(res, "Bookings fetched", rows, count, page, limit);
  } catch (err) {
    console.error("[testBooking.clinicBookings]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// PATCH /api/lab/bookings/:id/status  (clinic admin)
// Body: { status: "Collected" | "Processing" | "Completed" | "Cancelled" }
// ------------------------------------------------------------------
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["Collected","Processing","Completed","Cancelled"];
    if (!allowed.includes(status)) {
      return error(res, `Status must be one of: ${allowed.join(", ")}`);
    }

    const booking = await db.TestBooking.findOne({
      where: { id: req.params.id, clinic_id: req.user.id }
    });
    if (!booking) return error(res, "Booking not found", 404);

    await booking.update({ status });

    // Notify patient
    await db.Notification.create({
      receiver_type: "Patient",
      receiver_id:   booking.patient_id,
      title:         `Lab Test ${status}`,
      message:       `Your lab test booking #${booking.id} status is now: ${status}.`
    });

    return success(res, `Booking status updated to ${status}`, booking);
  } catch (err) {
    console.error("[testBooking.updateStatus]", err);
    return error(res, "Internal server error", 500);
  }
};
