/**
 * alertRouter.js
 * Multi-channel Alert Dispatch Engine with deduplication keys,
 * cooldown windows, preference filtering, and persistent dispatch logs.
 */

const Alert = require("../models/Alert");
const AlertDispatch = require("../models/AlertDispatch");
const User = require("../models/User");
const fcmService = require("./fcmService");
const brevoEmailService = require("./brevoEmailService");
const smsService = require("./smsService");

const SEVERITY_RANK = {
  Low: 1,
  Medium: 2,
  High: 3,
  "Very High": 4,
};

const COOLDOWN_MINUTES = 60;

class AlertRouter {
  /**
   * Generates a unique deduplication key for a district, severity, and time window.
   */
  generateDedupKey(district, severity) {
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const hourBlock = Math.floor(now.getHours() / (COOLDOWN_MINUTES / 60));
    return `${district.toLowerCase()}_${severity.toLowerCase()}_${dateStr}_h${hourBlock}`;
  }

  /**
   * Checks whether an alert has already been dispatched within the cooldown window.
   */
  async isSuppressedByCooldown(district, severity) {
    const dedupKey = this.generateDedupKey(district, severity);
    const recent = await AlertDispatch.findOne({
      dedupKey,
      status: { $in: ["sent", "delivered", "queued"] },
      createdAt: { $gte: new Date(Date.now() - COOLDOWN_MINUTES * 60 * 1000) },
    });
    return Boolean(recent);
  }

  /**
   * Dispatches a validated threat assessment alert across all qualifying channels.
   */
  async dispatchThreatAlert({
    district,
    severity,
    probabilityPct,
    title,
    message,
    directives = [],
    alertId = null,
  }) {
    const dedupKey = this.generateDedupKey(district, severity);

    // 1. Check Deduplication / Cooldown
    const suppressed = await this.isSuppressedByCooldown(district, severity);
    if (suppressed) {
      console.log(`[AlertRouter] Suppressed duplicate alert for ${district} (${severity}) - dedupKey: ${dedupKey}`);
      return {
        status: "suppressed_cooldown",
        dedupKey,
        district,
        severity,
      };
    }

    // 2. Persist active Alert if not provided
    let alertDoc = null;
    if (alertId) {
      alertDoc = await Alert.findById(alertId);
    } else {
      alertDoc = await Alert.create({
        location: district,
        level: severity === "Very High" ? "Red" : severity === "High" ? "Orange" : severity === "Medium" ? "Yellow" : "Green",
        message: `${title}: ${message}`,
        active: true,
      });
    }

    // 3. Find target users subscribed to this district and matching severity threshold
    const targetSeverityRank = SEVERITY_RANK[severity] || 2;
    const users = await User.find();

    const dispatchRecords = [];

    // Web Push / FCM Broadcast to District
    try {
      const fcmRes = await fcmService.broadcastToDistrict(district, {
        title: `[${severity.toUpperCase()} RISK] ${district} Flood Threat`,
        body: message,
        data: {
          url: "/#alerts",
          district,
          severity,
          probabilityPct: String(probabilityPct),
          alertId: String(alertDoc._id),
        },
      });

      const fcmRecord = await AlertDispatch.create({
        alertId: alertDoc._id,
        district,
        severity,
        title,
        message,
        dedupKey,
        channel: "fcm",
        recipient: `district:${district}`,
        status: "sent",
        providerResponse: fcmRes,
      });
      dispatchRecords.push(fcmRecord);
    } catch (e) {
      console.error("[AlertRouter:FCM:Failed]", e.message);
      await AlertDispatch.create({
        alertId: alertDoc._id,
        district,
        severity,
        title,
        message,
        dedupKey,
        channel: "fcm",
        recipient: `district:${district}`,
        status: "failed",
        errorDetail: e.message,
      });
    }

    // User-specific dispatch for Email and SMS
    for (const user of users) {
      const userMinRank = SEVERITY_RANK[user.preferences?.severityThreshold || "Medium"] || 2;
      const isSubscribed =
        !user.preferences?.subscribedDistricts?.length ||
        user.preferences.subscribedDistricts.includes(district);

      if (!isSubscribed || targetSeverityRank < userMinRank) {
        continue;
      }

      // Email Dispatch
      if (user.preferences?.channels?.email && user.email) {
        try {
          const emailRes = await brevoEmailService.sendThreatAlert({
            to: user.email,
            district,
            riskLevel: severity,
            probabilityPct,
            message,
            directives,
          });

          dispatchRecords.push(
            await AlertDispatch.create({
              alertId: alertDoc._id,
              userId: user._id,
              district,
              severity,
              title,
              message,
              dedupKey: `${dedupKey}_email_${user._id}`,
              channel: "email",
              recipient: user.email,
              status: emailRes.status === "delivered" ? "delivered" : "sent",
              providerResponse: emailRes,
            })
          );
        } catch (e) {
          console.error(`[AlertRouter:Email:Failed] ${user.email}:`, e.message);
        }
      }

      // SMS Dispatch (for High / Very High)
      if (user.preferences?.channels?.sms && user.phone && user.phoneVerified && targetSeverityRank >= 3) {
        try {
          const smsText = `[FloodAI EMERGENCY] ${severity.toUpperCase()} Flood Risk in ${district} (${probabilityPct}%). Avoid low-lying areas. Directives: ${directives.slice(0, 2).join("; ")}`;
          const smsRes = await smsService.sendSms({
            to: user.phone,
            message: smsText,
          });

          dispatchRecords.push(
            await AlertDispatch.create({
              alertId: alertDoc._id,
              userId: user._id,
              district,
              severity,
              title,
              message,
              dedupKey: `${dedupKey}_sms_${user._id}`,
              channel: "sms",
              recipient: user.phone,
              status: smsRes.status === "delivered" ? "delivered" : "sent",
              providerResponse: smsRes,
            })
          );
        } catch (e) {
          console.error(`[AlertRouter:SMS:Failed] ${user.phone}:`, e.message);
        }
      }
    }

    return {
      status: "dispatched",
      dedupKey,
      totalDispatched: dispatchRecords.length,
      alertId: alertDoc._id,
    };
  }
}

module.exports = new AlertRouter();
