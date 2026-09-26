/**
 * Push Notification Helper (Expo Push API)
 * Sends real-time push notifications to mobile devices via Expo's push service.
 */

const db = require("../models");

/**
 * Check whether a string looks like a valid Expo push token
 * Format: ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx] or ExpoPushToken[xxxxxxxxxxxxxxxxxxxxxx]
 */
function isExpoPushToken(token) {
  return (
    typeof token === "string" &&
    (token.startsWith("ExponentPushToken[") ||
      token.startsWith("ExpoPushToken[") ||
      token.length > 20)
  );
}

/**
 * Send a push notification payload directly to Expo Push API
 * @param {Object} options
 * @param {string|string[]} options.to - Single Expo push token or array of tokens
 * @param {string} options.title - Notification title
 * @param {string} options.body - Notification body
 * @param {Object} [options.data] - Custom data payload
 * @param {string} [options.sound="default"] - Notification sound
 * @param {string} [options.channelId="default"] - Android notification channel ID
 */
async function sendExpoPushNotification({
  to,
  title,
  body,
  data = {},
  sound = "default",
  channelId = "default"
}) {
  try {
    const tokens = Array.isArray(to) ? to : [to];
    const validTokens = tokens.filter(isExpoPushToken);

    if (validTokens.length === 0) {
      console.log("[PushNotification] No valid Expo push tokens to send to:", to);
      return { success: false, reason: "No valid Expo push tokens" };
    }

    const messages = validTokens.map(token => ({
      to: token,
      sound,
      title: title || "CareSpot Notification",
      body: body || "",
      data: data || {},
      priority: "high",
      channelId
    }));

    console.log(`[PushNotification] Sending ${messages.length} push notification(s)...`);

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(messages)
    });

    const result = await response.json();
    console.log("[PushNotification] Expo Push response:", JSON.stringify(result));
    return { success: true, result };
  } catch (err) {
    console.error("[PushNotification] Failed to send push notification:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send push notification to a specific Patient by ID
 * @param {number|string} patientId
 * @param {Object} notificationDetails - { title, body, data, sound }
 */
async function sendPatientPushNotification(patientId, { title, body, data, sound = "default" }) {
  try {
    if (!patientId) return;

    const patient = await db.Patient.findByPk(patientId, {
      attributes: ["id", "name", "push_token"]
    });

    if (!patient) {
      console.log(`[PushNotification] Patient ${patientId} not found.`);
      return;
    }

    if (!patient.push_token) {
      console.log(`[PushNotification] Patient ${patient.name || patientId} (ID: ${patientId}) has no push_token registered.`);
      return;
    }

    return await sendExpoPushNotification({
      to: patient.push_token,
      title,
      body,
      data,
      sound
    });
  } catch (err) {
    console.error(`[PushNotification] Error sending to patient ${patientId}:`, err.message);
  }
}

/**
 * Send push notification to a specific Clinic by ID
 * @param {number|string} clinicId
 * @param {Object} notificationDetails - { title, body, data, sound }
 */
async function sendClinicPushNotification(clinicId, { title, body, data, sound = "default" }) {
  try {
    if (!clinicId) return;

    const clinic = await db.Clinic.findByPk(clinicId, {
      attributes: ["id", "name", "push_token"]
    });

    if (!clinic || !clinic.push_token) {
      return;
    }

    return await sendExpoPushNotification({
      to: clinic.push_token,
      title,
      body,
      data,
      sound
    });
  } catch (err) {
    console.error(`[PushNotification] Error sending to clinic ${clinicId}:`, err.message);
  }
}

module.exports = {
  isExpoPushToken,
  sendExpoPushNotification,
  sendPatientPushNotification,
  sendClinicPushNotification
};
