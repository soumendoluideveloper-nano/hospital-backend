/**
 * SMS Helper
 * ============================================================
 * Sends OTP / transactional SMS via a configurable gateway.
 *
 * Supported providers (set SMS_PROVIDER in .env):
 *   • msg91      — MSG91 (https://msg91.com) — default
 *   • fast2sms   — Fast2SMS (https://www.fast2sms.com)
 *   • twilio     — Twilio (https://www.twilio.com)
 *   • textlocal  — Text Local (https://www.textlocal.in)
 *   • console    — Development only (prints OTP to console)
 *
 * .env keys needed per provider — see .env.example for full list.
 * ============================================================
 */

const https = require("https");
const http  = require("http");

// ─── Utility: make an HTTP/HTTPS POST or GET request ──────────────
function httpRequest(options, postBody = null) {
  return new Promise((resolve, reject) => {
    const lib = options.protocol === "http:" ? http : https;
    const req = lib.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try { resolve({ statusCode: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ statusCode: res.statusCode, body: data }); }
      });
    });
    req.on("error", reject);
    if (postBody) req.write(postBody);
    req.end();
  });
}

// ─── MSG91 ────────────────────────────────────────────────────────
// Docs: https://docs.msg91.com/send-otp
// ENV:  SMS_MSG91_AUTHKEY, SMS_MSG91_TEMPLATE_ID, SMS_MSG91_SENDER_ID
async function sendViaMSG91(phone, otp) {
  const authkey    = process.env.SMS_MSG91_AUTHKEY;
  const templateId = process.env.SMS_MSG91_TEMPLATE_ID;
  const senderId   = process.env.SMS_MSG91_SENDER_ID || "CLINIC";

  if (!authkey || !templateId) {
    throw new Error("MSG91: SMS_MSG91_AUTHKEY and SMS_MSG91_TEMPLATE_ID are required in .env");
  }

  // Format phone: MSG91 expects country code prefix (91 for India)
  const mobile = phone.startsWith("91") ? phone : `91${phone}`;

  const payload = JSON.stringify({
    template_id: templateId,
    mobile,
    authkey,
    otp
  });

  const options = {
    hostname: "control.msg91.com",
    path:     "/api/v5/otp",
    method:   "POST",
    headers:  {
      "Content-Type":   "application/json",
      "Content-Length": Buffer.byteLength(payload)
    }
  };

  const response = await httpRequest(options, payload);

  if (response.statusCode !== 200 || response.body?.type === "error") {
    throw new Error(`MSG91 error: ${JSON.stringify(response.body)}`);
  }

  console.log(`[SMS-MSG91] OTP sent to ${mobile}:`, response.body);
  return response.body;
}

// ─── Fast2SMS ─────────────────────────────────────────────────────
// Docs: https://docs.fast2sms.com
// ENV:  SMS_FAST2SMS_APIKEY, SMS_FAST2SMS_SENDER_ID, SMS_FAST2SMS_MESSAGE
async function sendViaFast2SMS(phone, otp) {
  const apiKey    = process.env.SMS_FAST2SMS_APIKEY;
  const senderId  = process.env.SMS_FAST2SMS_SENDER_ID || "CLINIC";
  const msgTemplate = process.env.SMS_FAST2SMS_MESSAGE ||
    "Your OTP for Clinic Management registration is {otp}. Valid for 10 minutes. Do not share.";

  if (!apiKey) {
    throw new Error("Fast2SMS: SMS_FAST2SMS_APIKEY is required in .env");
  }

  const message = msgTemplate.replace("{otp}", otp);

  // Fast2SMS DLT (Template-based) route
  const params = new URLSearchParams({
    authorization: apiKey,
    sender_id:     senderId,
    message,
    route:         "dlt",
    numbers:       phone
  }).toString();

  const options = {
    hostname: "www.fast2sms.com",
    path:     `/dev/bulkV2?${params}`,
    method:   "GET",
    headers:  { "cache-control": "no-cache" }
  };

  const response = await httpRequest(options);

  if (!response.body?.return) {
    throw new Error(`Fast2SMS error: ${JSON.stringify(response.body)}`);
  }

  console.log(`[SMS-Fast2SMS] OTP sent to ${phone}:`, response.body);
  return response.body;
}

// ─── Twilio ───────────────────────────────────────────────────────
// Docs: https://www.twilio.com/docs/sms/api
// ENV:  SMS_TWILIO_SID, SMS_TWILIO_AUTH_TOKEN, SMS_TWILIO_FROM
async function sendViaTwilio(phone, otp) {
  const accountSid = process.env.SMS_TWILIO_SID;
  const authToken  = process.env.SMS_TWILIO_AUTH_TOKEN;
  const from       = process.env.SMS_TWILIO_FROM;

  if (!accountSid || !authToken || !from) {
    throw new Error("Twilio: SMS_TWILIO_SID, SMS_TWILIO_AUTH_TOKEN, and SMS_TWILIO_FROM are required in .env");
  }

  const toNumber = phone.startsWith("+") ? phone : `+91${phone}`;
  const body     = process.env.SMS_MESSAGE_TEMPLATE
    ? process.env.SMS_MESSAGE_TEMPLATE.replace("{otp}", otp)
    : `Your OTP is ${otp}. Valid for 10 minutes. Do not share with anyone.`;

  const payload = new URLSearchParams({ To: toNumber, From: from, Body: body }).toString();

  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const options = {
    hostname: "api.twilio.com",
    path:     `/2010-04-01/Accounts/${accountSid}/Messages.json`,
    method:   "POST",
    headers:  {
      "Authorization": `Basic ${credentials}`,
      "Content-Type":  "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(payload)
    }
  };

  const response = await httpRequest(options, payload);

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(`Twilio error (${response.statusCode}): ${JSON.stringify(response.body)}`);
  }

  console.log(`[SMS-Twilio] OTP sent to ${toNumber}, SID:`, response.body?.sid);
  return response.body;
}

// ─── Text Local ───────────────────────────────────────────────────
// Docs: https://api.textlocal.in/docs
// ENV:  SMS_TEXTLOCAL_APIKEY, SMS_TEXTLOCAL_SENDER
async function sendViaTextLocal(phone, otp) {
  const apiKey = process.env.SMS_TEXTLOCAL_APIKEY;
  const sender = process.env.SMS_TEXTLOCAL_SENDER || "CLINIC";

  if (!apiKey) {
    throw new Error("TextLocal: SMS_TEXTLOCAL_APIKEY is required in .env");
  }

  const message = encodeURIComponent(
    (process.env.SMS_MESSAGE_TEMPLATE || "Your OTP is {otp}. Valid for 10 minutes.")
      .replace("{otp}", otp)
  );
  const numbers = phone.startsWith("91") ? phone : `91${phone}`;

  const options = {
    hostname: "api.textlocal.in",
    path:     `/send/?apikey=${apiKey}&numbers=${numbers}&message=${message}&sender=${sender}`,
    method:   "GET"
  };

  const response = await httpRequest(options);

  if (response.body?.status === "failure") {
    throw new Error(`TextLocal error: ${JSON.stringify(response.body?.errors)}`);
  }

  console.log(`[SMS-TextLocal] OTP sent to ${numbers}:`, response.body);
  return response.body;
}

// ─── Console (Development fallback) ───────────────────────────────
function sendViaConsole(phone, otp) {
  console.log("\n=======================================================");
  console.log(`📲  [DEV] OTP for ${phone} : ${otp}`);
  console.log("=======================================================\n");
  return Promise.resolve({ success: true, mode: "console" });
}

// ═══════════════════════════════════════════════════════════════════
// MAIN EXPORT — sendOtp(phone, otp)
// ═══════════════════════════════════════════════════════════════════
/**
 * Send OTP SMS to a phone number.
 *
 * @param {string} phone - 10-digit mobile number (with or without country code)
 * @param {string} otp   - 6-digit OTP string
 * @returns {Promise<object>} Gateway response
 */
async function sendOtp(phone, otp) {
  const provider = (process.env.SMS_PROVIDER || "console").toLowerCase();

  switch (provider) {
    case "msg91":
      return sendViaMSG91(phone, otp);

    case "fast2sms":
      return sendViaFast2SMS(phone, otp);

    case "twilio":
      return sendViaTwilio(phone, otp);

    case "textlocal":
      return sendViaTextLocal(phone, otp);

    case "console":
    default:
      return sendViaConsole(phone, otp);
  }
}

module.exports = { sendOtp };
