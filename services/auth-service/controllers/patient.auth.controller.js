/**
 * Patient Auth Controller
 * =============================================================
 * Registration — 3-step flow:
 *
 *   Step 1  POST /api/auth/patient/send-otp
 *           Body: { phone, password }
 *           → Stores hashed password + OTP in otp_verifications
 *           → (Dev) returns OTP in response; (Prod) send via SMS
 *
 *   Step 2  POST /api/auth/patient/verify-otp
 *           Body: { phone, otp }
 *           → Validates OTP, marks as used
 *           → Returns short-lived temp_token (30 min)
 *
 *   Step 3  POST /api/auth/patient/complete-profile
 *           Headers: Authorization: Bearer <temp_token>
 *           Body (JSON): { name, email, gender, dob, ... }
 *           → Creates the Patient record, returns full JWT
 *
 * Login     POST /api/auth/patient/login
 *           Body: { phone | email, password }
 * =============================================================
 */

const bcrypt = require("bcryptjs");
const db     = require("../../../common/models");
const { signToken }    = require("../../../common/helpers/jwt.helper");
const { success, error } = require("../../../common/helpers/response.helper");
const { sendOtp: sendSMS } = require("../../../common/helpers/sms.helper");
const {
  sendOtpSchema,
  verifyOtpSchema,
  completePatientSchema,
  patientLoginSchema
} = require("../validation/patient.validation");

// ── Utility: generate 6-digit OTP ────────────────────────────────────
const generateOtp = () =>
  String(Math.floor(100000 + Math.random() * 900000));

// ── Utility: OTP expiry (10 minutes from now) ─────────────────────────
const otpExpiry = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() + 10);
  return d;
};

// ════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════
// STEP 1 — POST /api/auth/patient/send-otp
// ════════════════════════════════════════════════════════════════════
exports.sendOtp = async (req, res) => {
  try {
    const { error: validErr } = sendOtpSchema.validate(req.body);
    if (validErr) return error(res, validErr.details[0].message);

    const { phone, password } = req.body;

    // Check if already a registered patient
    const existing = await db.Patient.findOne({ where: { phone } });
    if (existing) return error(res, "This phone number is already registered. Please login.", 409);

    // Delete any previous unused OTP for this phone
    await db.OtpVerification.destroy({ where: { phone, type: "patient", is_used: false } });

    const hashed = password ? await bcrypt.hash(password, 10) : "";
    const otp    = generateOtp();

    await db.OtpVerification.create({
      phone,
      password:   hashed,
      otp,
      type:       "patient",
      expires_at: otpExpiry()
    });

    // Send OTP via configured SMS gateway
    try {
      await sendSMS(phone, otp);
      console.log(`[OTP] Patient ${phone} → ${otp}`);
    } catch (smsErr) {
      console.error("[SMS] Failed to send OTP:", smsErr.message);
      return error(res, "Failed to send OTP. Please try again.", 503);
    }

    return success(res, "OTP sent successfully to your mobile number.", { phone });
  } catch (err) {
    console.error("[patient.sendOtp]", err);
    return error(res, "Internal server error", 500);
  }
};

// ════════════════════════════════════════════════════════════════════
// STEP 2 — POST /api/auth/patient/verify-otp
// ════════════════════════════════════════════════════════════════════
exports.verifyOtp = async (req, res) => {
  try {
    const { error: validErr } = verifyOtpSchema.validate(req.body);
    if (validErr) return error(res, validErr.details[0].message);

    const { phone, otp } = req.body;

    const record = await db.OtpVerification.findOne({
      where:  { phone, type: "patient", is_used: false },
      order:  [["created_at", "DESC"]]
    });

    if (!record)             return error(res, "No pending OTP found for this number. Please request a new OTP.", 404);
    if (record.otp !== otp)  return error(res, "Invalid OTP. Please try again.", 400);
    if (new Date() > new Date(record.expires_at)) {
      return error(res, "OTP has expired. Please request a new OTP.", 400);
    }

    // Mark OTP as used
    await record.update({ is_used: true });

    // Issue a short-lived temp token (30 min) so Step 3 is authenticated
    const temp_token = signToken(
      { phone, role: "pending_patient", otp_record_id: record.id },
      "30m"  // override expiry
    );

    return success(res, "OTP verified successfully. Please complete your profile.", { temp_token });
  } catch (err) {
    console.error("[patient.verifyOtp]", err);
    return error(res, "Internal server error", 500);
  }
};

// ════════════════════════════════════════════════════════════════════
// STEP 3 — POST /api/auth/patient/complete-profile
// Headers: Authorization: Bearer <temp_token>
// ════════════════════════════════════════════════════════════════════
exports.completeProfile = async (req, res) => {
  try {
    // req.user is set by auth middleware with role check "pending_patient"
    const { phone, otp_record_id } = req.user;

    const { error: validErr } = completePatientSchema.validate(req.body);
    if (validErr) return error(res, validErr.details[0].message);

    // Retrieve the verified OTP record to get the stored password
    const record = await db.OtpVerification.findOne({
      where: { id: otp_record_id, phone, type: "patient", is_used: true }
    });
    if (!record) return error(res, "Session invalid or expired. Please start registration again.", 400);

    // Final duplicate check
    const existing = await db.Patient.findOne({ where: { phone } });
    if (existing) return error(res, "This phone number is already registered.", 409);

    const { name, email, password: bodyPassword, gender, dob, blood_group, address, city, state, country } = req.body;

    let finalPassword = record.password;
    if (bodyPassword) {
      finalPassword = await bcrypt.hash(bodyPassword, 10);
    }

    if (!finalPassword) {
      return error(res, "Password is required to create an account.", 422);
    }

    const patient = await db.Patient.create({
      name, email: email || null,
      phone, password: finalPassword,
      gender: gender || null, dob: dob || null, blood_group: blood_group || null,
      address: address || null, city: city || null, state: state || null, country: country || null
    });

    // Clean up OTP record
    await record.destroy();

    // Issue full session token
    const token = signToken({ id: patient.id, role: "patient", phone: patient.phone });
    await db.Patient.update({ token }, { where: { id: patient.id } });

    patient.password = undefined;
    patient.token    = token;

    return success(res, "Registration completed successfully!", { token, patient }, 201);
  } catch (err) {
    console.error("[patient.completeProfile]", err);
    return error(res, "Internal server error", 500);
  }
};

// ════════════════════════════════════════════════════════════════════
// LOGIN — POST /api/auth/patient/login
// ════════════════════════════════════════════════════════════════════
exports.login = async (req, res) => {
  try {
    const { error: validErr } = patientLoginSchema.validate(req.body);
    if (validErr) return error(res, validErr.details[0].message);

    const { email, phone, password } = req.body;

    const patient = await db.Patient.findOne({
      where: email ? { email } : { phone }
    });
    if (!patient) return error(res, "Invalid credentials", 401);
    if (patient.status === "Inactive") return error(res, "Your account has been deactivated", 403);

    const match = await bcrypt.compare(password, patient.password);
    if (!match) return error(res, "Invalid credentials", 401);

    const token = signToken({ id: patient.id, role: "patient", phone: patient.phone });
    await db.Patient.update({ token }, { where: { id: patient.id } });

    patient.password = undefined;
    patient.token    = token;

    return success(res, "Login successful", { token, patient });
  } catch (err) {
    console.error("[patient.login]", err);
    return error(res, "Internal server error", 500);
  }
};

// ════════════════════════════════════════════════════════════════════
// GET PROFILE — GET /api/auth/patient/profile  (protected)
// ════════════════════════════════════════════════════════════════════
exports.getProfile = async (req, res) => {
  try {
    const patient = await db.Patient.findByPk(req.user.id, {
      attributes: { exclude: ["password", "token"] }
    });
    if (!patient) return error(res, "Patient not found", 404);
    return success(res, "Profile fetched", patient);
  } catch (err) {
    console.error("[patient.getProfile]", err);
    return error(res, "Internal server error", 500);
  }
};
