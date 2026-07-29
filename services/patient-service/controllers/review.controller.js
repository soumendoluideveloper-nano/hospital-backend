/**
 * Review Controller (Patient)
 * Patients submit ratings and reviews for doctors and clinics.
 */

const db     = require("../../../common/models");
const { success, error } = require("../../../common/helpers/response.helper");

// ------------------------------------------------------------------
// POST /api/patient/reviews/doctor
// Body: { doctor_id, rating (1-5), review }
// ------------------------------------------------------------------
exports.reviewDoctor = async (req, res) => {
  try {
    const { doctor_id, rating, review } = req.body;
    if (!doctor_id || !rating) return error(res, "doctor_id and rating are required");
    if (rating < 1 || rating > 5) return error(res, "Rating must be between 1 and 5");

    // One review per doctor per patient
    const existing = await db.DoctorReview.findOne({
      where: { doctor_id, patient_id: req.user.id }
    });
    if (existing) {
      await existing.update({ rating, review });
      return success(res, "Review updated", existing);
    }

    const dr = await db.DoctorReview.create({
      doctor_id, patient_id: req.user.id, rating, review
    });
    return success(res, "Doctor reviewed successfully", dr, 201);
  } catch (err) {
    console.error("[review.reviewDoctor]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// POST /api/patient/reviews/clinic
// Body: { clinic_id, rating (1-5), review }
// ------------------------------------------------------------------
exports.reviewClinic = async (req, res) => {
  try {
    const { clinic_id, rating, review } = req.body;
    if (!clinic_id || !rating) return error(res, "clinic_id and rating are required");
    if (rating < 1 || rating > 5) return error(res, "Rating must be between 1 and 5");

    const existing = await db.ClinicReview.findOne({
      where: { clinic_id, patient_id: req.user.id }
    });
    if (existing) {
      await existing.update({ rating, review });
      return success(res, "Review updated", existing);
    }

    const cr = await db.ClinicReview.create({
      clinic_id, patient_id: req.user.id, rating, review
    });
    return success(res, "Clinic reviewed successfully", cr, 201);
  } catch (err) {
    console.error("[review.reviewClinic]", err);
    return error(res, "Internal server error", 500);
  }
};

// ------------------------------------------------------------------
// GET /api/patient/reviews/my
// ------------------------------------------------------------------
exports.myReviews = async (req, res) => {
  try {
    const [doctorReviews, clinicReviews] = await Promise.all([
      db.DoctorReview.findAll({
        where:   { patient_id: req.user.id },
        include: [{ model: db.Doctor, as: "doctor", attributes: ["id","name","specialization"] }]
      }),
      db.ClinicReview.findAll({
        where:   { patient_id: req.user.id },
        include: [{ model: db.Clinic, as: "clinic", attributes: ["id","name","logo"] }]
      })
    ]);

    return success(res, "My reviews fetched", { doctorReviews, clinicReviews });
  } catch (err) {
    console.error("[review.myReviews]", err);
    return error(res, "Internal server error", 500);
  }
};
