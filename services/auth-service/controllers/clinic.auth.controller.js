/**
 * Clinic Auth Controller
 * =============================================================
 * Registration — 3-step flow:
 *
 *   Step 1  POST /api/auth/clinic/send-otp
 *           Body: { phone, password }
 *
 *   Step 2  POST /api/auth/clinic/verify-otp
 *           Body: { phone, otp }
 *           → Returns temp_token (30 min)
 *
 *   Step 3  POST /api/auth/clinic/complete-profile
 *           Headers: Authorization: Bearer <temp_token>
 *           Body (JSON): { name, owner_name, email, city, ... }
 *           → Creates the Clinic record, returns full JWT
 *
 * Login     POST /api/auth/clinic/login
 *           Body: { phone | email, password }
 * =============================================================
 */

const bcrypt = require("bcryptjs");
const db = require("../../../common/models");
const { signToken } = require("../../../common/helpers/jwt.helper");
const { success, error } = require("../../../common/helpers/response.helper");
const { sendOtp: sendSMS } = require("../../../common/helpers/sms.helper");
const {
  sendOtpSchema,
  verifyOtpSchema,
  completeClinicSchema,
  clinicLoginSchema
} = require("../validation/clinic.validation");

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));
const otpExpiry = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() + 10);
  return d;
};

// ════════════════════════════════════════════════════════════════════
// STEP 1 — POST /api/auth/clinic/send-otp
// ════════════════════════════════════════════════════════════════════
exports.sendOtp = async (req, res) => {
  try {
    console.log("[clinic.sendOtp]");
    const { error: validErr } = sendOtpSchema.validate(req.body);
    if (validErr) return error(res, validErr.details[0].message);

    const { phone, password } = req.body;

    const existing = await db.Clinic.findOne({ where: { phone } });
    if (existing) return error(res, "This phone number is already registered. Please login.", 409);

    await db.OtpVerification.destroy({ where: { phone, type: "clinic", is_used: false } });

    // const hashed = await bcrypt.hash(password, 10);
    const otp = generateOtp();

    await db.OtpVerification.create({
      phone,
      password: "",
      otp,
      type: "clinic",
      expires_at: otpExpiry()
    });

    // Send OTP via configured SMS gateway
    try {
      // await sendSMS(phone, otp);
      // ⚠️  Production: send OTP via SMS
      console.log(`[OTP] Clinic ${phone} → ${otp}`);
    } catch (smsErr) {
      console.error("[SMS] Failed to send OTP:", smsErr.message);
      // Still return error so the user knows — don't silently fail
      return error(res, "Failed to send OTP. Please try again.", 503);
    }

    return success(res, "OTP sent successfully to your mobile number.", { phone });
  } catch (err) {
    console.error("[clinic.sendOtp]", err);
    return error(res, "Internal server error", 500);
  }
};

// ════════════════════════════════════════════════════════════════════
// STEP 2 — POST /api/auth/clinic/verify-otp
// ════════════════════════════════════════════════════════════════════
exports.verifyOtp = async (req, res) => {
  try {
    const { error: validErr } = verifyOtpSchema.validate(req.body);
    if (validErr) return error(res, validErr.details[0].message);

    const { phone, otp } = req.body;

    const record = await db.OtpVerification.findOne({
      where: { phone, type: "clinic", is_used: false },
      order: [["created_at", "DESC"]]
    });

    if (!record) return error(res, "No pending OTP found. Please request a new OTP.", 404);
    if (record.otp !== otp) return error(res, "Invalid OTP. Please try again.", 400);
    if (new Date() > new Date(record.expires_at)) {
      return error(res, "OTP has expired. Please request a new OTP.", 400);
    }

    await record.update({ is_used: true });

    const temp_token = signToken(
      { phone, role: "pending_clinic", otp_record_id: record.id },
      "30m"
    );

    return success(res, "OTP verified successfully. Please complete your clinic profile.", { temp_token });
  } catch (err) {
    console.error("[clinic.verifyOtp]", err);
    return error(res, "Internal server error", 500);
  }
};

// ════════════════════════════════════════════════════════════════════
// STEP 3 — POST /api/auth/clinic/complete-profile
// Headers: Authorization: Bearer <temp_token>
// Body (JSON): clinic details
// ════════════════════════════════════════════════════════════════════
exports.completeProfile = async (req, res) => {
  try {
    // const { phone, otp_record_id } = req.user;

    const { error: validErr } = completeClinicSchema.validate(req.body);
    if (validErr) return error(res, validErr.details[0].message);

    const record = await db.OtpVerification.findOne({
      where: { phone: req.body.phone, type: "clinic", is_used: true }
    });
    if (!record) return error(res, "Session invalid or expired. Please start registration again.", 400);

    const existing = await db.Clinic.findOne({ where: { phone: req.body.phone } });
    if (existing) return error(res, "This phone number is already registered.", 409);

    const {phone,
      name, owner_name, email,
      registration_no, address, city, state, country,
      latitude, longitude, description, has_lab, pincode,password
    } = req.body;
 const hashed = await bcrypt.hash(password, 10);
    const clinic = await db.Clinic.create({
      name, owner_name,
      email: email || null,
      phone,
      password: hashed, // hashed from Step 1
      registration_no, address, city, state, country,
      latitude, longitude, description,
      has_lab: has_lab === true || has_lab === "true",
      pincode
    });

    await record.destroy();

    const token = signToken({ id: clinic.id, role: "clinic", phone: clinic.phone });
    await db.Clinic.update({ token }, { where: { id: clinic.id } });

    clinic.password = undefined;
    clinic.token = token;

    return success(res, "Clinic registered successfully!", { token, clinic }, 201);
  } catch (err) {
    console.error("[clinic.completeProfile]", err);
    return error(res, "Internal server error", 500);
  }
};

// ════════════════════════════════════════════════════════════════════
// LOGIN — POST /api/auth/clinic/login
// ════════════════════════════════════════════════════════════════════
exports.login = async (req, res) => {
  try {
   
    const { error: validErr } = clinicLoginSchema.validate(req.body);
    if (validErr) return error(res, validErr.details[0].message);

    const { email, phone, password } = req.body;
    console.log("[clinic.login] phone:", phone, "email:", password ? "******" : "N/A");
    const clinic = await db.Clinic.findOne({
      where: email ? { email } : { phone }
    });
    
    // console.log("[clinic.login] clinic:", clinic);
    if (!clinic) return error(res, "Invalid credentials", 201);
    if (clinic.status === "Inactive") return error(res, "Clinic account is deactivated", 403);

    const match = await bcrypt.compare(password, clinic.password);
    if (!match) return error(res, "Invalid credentials", 201);

    const token = signToken({ id: clinic.id, role: "clinic", phone: clinic.phone });
    await db.Clinic.update({ token }, { where: { id: clinic.id } });

    clinic.password = undefined;
    clinic.token = token;

    return success(res, "Login successful", { token, clinic });
  } catch (err) {
    console.error("[clinic.login]", err);
    return error(res, "Internal server error", 500);
  }
};

// ════════════════════════════════════════════════════════════════════
// GET PROFILE — GET /api/auth/clinic/profile  (protected)
// ════════════════════════════════════════════════════════════════════
exports.getProfile = async (req, res) => {
  try {
    const clinic = await db.Clinic.findByPk(req.user.id, {
      attributes: { exclude: ["password", "token"] },
      include: [
        { model: db.Doctor, as: "doctors", attributes: ["id", "name", "specialization", "status"] }
      ]
    });
    if (!clinic) return error(res, "Clinic not found", 404);
    return success(res, "Profile fetched", clinic);
  } catch (err) {
    console.error("[clinic.getProfile]", err);
    return error(res, "Internal server error", 500);
  }
};
