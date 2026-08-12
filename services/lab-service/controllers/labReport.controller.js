/**
 * Lab Report Controller
 * Clinic uploads reports; patients download / view them.
 */

const db     = require("../../../common/models");
const { success, error } = require("../../../common/helpers/response.helper");

// ------------------------------------------------------------------
// POST /api/lab/reports/:bookingId  (clinic admin — upload report)
// ------------------------------------------------------------------
exports.uploadReport = async (req, res) => {
  try {
    const clinicId  = req.user.id;
    const { bookingId } = req.params;

    const booking = await db.TestBooking.findOne({ where: { id: bookingId, clinic_id: clinicId } });
    if (!booking) return error(res, "Booking not found under your clinic", 404);

    const report_file = req.file ? "uploads/" + req.file.path.replace(/\\/g, "/").split("uploads/")[1] : null;
    const { remarks }  = req.body;

    // Upsert (one report per booking)
    let report = await db.LabReport.findOne({ where: { booking_id: bookingId } });
    if (report) {
      await report.update({ report_file: report_file || report.report_file, remarks });
    } else {
      report = await db.LabReport.create({ booking_id: bookingId, report_file, remarks });
    }

    // Update booking status to Completed
    await booking.update({ status: "Completed" });

    // Notify patient
    await db.Notification.create({
      receiver_type: "Patient",
      receiver_id:   booking.patient_id,
      title:         "Your Lab Report is Ready",
      message:       `Your report for booking #${bookingId} has been uploaded. Please check your reports section.`
    });

    return success(res, "Report uploaded successfully", report);
  } catch (err) {
    console.error("[labReport.uploadReport]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// GET /api/lab/reports/:bookingId  (patient — download own report)
// ------------------------------------------------------------------
exports.getReport = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { bookingId } = req.params;

    // Verify booking belongs to patient
    const booking = await db.TestBooking.findOne({ where: { id: bookingId, patient_id: patientId } });
    if (!booking) return error(res, "Booking not found", 404);

    const report = await db.LabReport.findOne({ where: { booking_id: bookingId } });
    if (!report) return error(res, "Report not yet available", 404);

    return success(res, "Report fetched", report);
  } catch (err) {
    console.error("[labReport.getReport]", err);
    return error(res, "Internal server error", 500);
  }
};
