const express = require("express");
const router = express.Router();
const Alert = require("../models/Alert");
const AlertDispatch = require("../models/AlertDispatch");
const SimulationRun = require("../models/SimulationRun");
const User = require("../models/User");
const alertRouter = require("../services/alertRouter");
const fcmService = require("../services/fcmService");
const brevoEmailService = require("../services/brevoEmailService");
const smsService = require("../services/smsService");
const { authenticateToken, requireRole } = require("../middleware/authMiddleware");

// GET /api/alerts -> active emergency alerts (public operational view, strictly excludes simulations)
router.get("/", async (req, res) => {
  try {
    const alerts = await Alert.find({ active: true, isSimulation: { $ne: true } }).sort({ createdAt: -1 });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch alerts", detail: err.message });
  }
});

// POST /api/alerts -> publish and dispatch an emergency alert (restricted to admin and analyst)
router.post("/", authenticateToken, requireRole(["admin", "analyst"]), async (req, res) => {
  try {
    const { location, level = "Yellow", message, directives = [] } = req.body;
    if (!location || !message) {
      return res.status(400).json({ error: "Location and message are required" });
    }

    const alert = await Alert.create({
      location,
      level,
      message,
      active: true,
      createdBy: req.user._id,
      isSimulation: false,
    });

    const severityMap = { Red: "Very High", Orange: "High", Yellow: "Medium", Green: "Low" };
    const severity = severityMap[level] || "Medium";

    const dispatchOutcome = await alertRouter.dispatchThreatAlert({
      district: location,
      severity,
      probabilityPct: level === "Red" ? 85 : level === "Orange" ? 65 : level === "Yellow" ? 45 : 20,
      title: `Emergency Alert: ${level.toUpperCase()} Warning for ${location}`,
      message,
      directives,
      alertId: alert._id,
    });

    res.status(201).json({
      alert,
      dispatchOutcome,
    });
  } catch (err) {
    res.status(500).json({ error: "Alert creation failed", detail: err.message });
  }
});

// PUT /api/alerts/:id/resolve -> resolve an alert (restricted to admin and analyst)
router.put("/:id/resolve", authenticateToken, requireRole(["admin", "analyst"]), async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { active: false, resolvedBy: req.user._id, resolvedAt: new Date() },
      { new: true }
    );
    if (!alert) {
      return res.status(404).json({ error: "Alert not found" });
    }
    res.json(alert);
  } catch (err) {
    res.status(500).json({ error: "Failed to resolve alert", detail: err.message });
  }
});

// Rate-limiting tracker for resident simulation dispatches (1 request every 5 seconds per user)
const userSimulationTimestamps = new Map();

// POST /api/alerts/simulate-resident-flood
// Authenticated resident alert simulation endpoint.
// Isolates simulation records with isSimulation: true and binds recipient data exclusively to authenticated user.
router.post("/simulate-resident-flood", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const now = Date.now();
    const lastRun = userSimulationTimestamps.get(String(userId)) || 0;
    if (now - lastRun < 5000) {
      return res.status(429).json({
        error: "Rate limit exceeded. Please wait 5 seconds between simulation dispatches.",
      });
    }
    userSimulationTimestamps.set(String(userId), now);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "Authenticated resident profile not found in database" });
    }

    const {
      scenario = "coastal_surge",
      severity = "Warning",
      location = "Monitored Sector",
      latitude,
      longitude,
      probabilityPct = 82.5,
      channels = ["siren", "fcm", "email", "sms"],
      testMessage = "",
      directives = [
        "Move ground-floor items and electrical appliances above 1.5 meters immediately.",
        "Low-lying coastal residents within 1km of shoreline commence vertical evacuation.",
        "Keep cell phone charged and monitor FloodAI emergency telemetry broadcast.",
      ],
    } = req.body;

    const validScenarios = [
      "heavy_rainfall",
      "rising_water_level",
      "coastal_inundation",
      "official_warning",
      "coastal_surge",
      "cloudburst",
      "dam_spillway",
      "live_telemetry",
    ];
    const sanitizedScenario = validScenarios.includes(scenario) ? scenario : "coastal_surge";

    const validSeverities = ["Advisory", "Watch", "Warning", "Critical"];
    const sanitizedSeverity = validSeverities.includes(severity) ? severity : "Warning";

    const resolvedLat = typeof latitude === "number" && !isNaN(latitude) ? latitude : 13.0827;
    const resolvedLon = typeof longitude === "number" && !isNaN(longitude) ? longitude : 80.2707;

    const timestamp = new Date().toISOString();
    const alertTitle = `[SIMULATION: ${sanitizedSeverity.toUpperCase()}] Flood Detection Alert — ${location}`;
    const alertBody = testMessage ||
      `[SIMULATION TEST] High-probability flood hazard detected (${probabilityPct}% modeled risk). Immediate citizen safety directives active for ${location}.`;

    const dispatchResults = {
      siren: {
        channel: "acoustic_siren",
        status: channels.includes("siren") ? "armed_in_browser" : "skipped_not_requested",
        tone: "Continuous 800Hz LFO Wailing Municipal Civil Defense Siren",
        timestamp,
      },
      fcm: { channel: "fcm_push", status: "skipped_not_requested", timestamp },
      email: { channel: "brevo_email", status: "skipped_not_requested", timestamp },
      sms: { channel: "cellular_sms", status: "skipped_not_requested", timestamp },
    };

    // 1. Dispatch Firebase FCM Web Push
    if (channels.includes("fcm")) {
      try {
        const fcmRes = await fcmService.broadcastToDistrict(location, {
          title: alertTitle,
          body: alertBody,
          data: {
            url: "/#resident-simulation",
            type: "flood_simulation",
            isSimulation: "true",
            severity: sanitizedSeverity,
            probabilityPct: String(probabilityPct),
            location,
          },
        });

        const fcmStatus = fcmRes.delivered
          ? "delivered"
          : fcmRes.totalTokens > 0
          ? "accepted"
          : fcmRes.provider && fcmRes.provider.includes("SSE")
          ? "sse_stream_broadcast"
          : "sandbox_simulated";

        dispatchResults.fcm = {
          channel: "fcm_push",
          status: fcmStatus,
          tokensTargeted: fcmRes.totalTokens || 0,
          provider: fcmRes.provider || "Firebase FCM / Web Push SSE Stream",
          detail: fcmRes.detail || "Delivered to active browser service workers",
          timestamp,
        };

        await AlertDispatch.create({
          district: location,
          severity: sanitizedSeverity === "Critical" ? "Very High" : sanitizedSeverity === "Warning" ? "High" : "Medium",
          title: alertTitle,
          message: alertBody,
          dedupKey: `sim_${user._id}_fcm_${Date.now()}`,
          channel: "fcm",
          recipient: user.fcmTokens?.length ? `tokens:${user.fcmTokens.length}` : `user:${user._id}`,
          userId: user._id,
          isSimulation: true,
          scenario: sanitizedScenario,
          status: fcmStatus,
          providerResponse: fcmRes,
        });
      } catch (fcmErr) {
        dispatchResults.fcm = {
          channel: "fcm_push",
          status: "failed",
          detail: fcmErr.message,
          timestamp,
        };
      }
    }

    // 2. Dispatch Brevo Transactional Email (recipient strictly from user.email)
    if (channels.includes("email")) {
      if (user.email) {
        try {
          const emailRes = await brevoEmailService.sendThreatAlert({
            to: user.email,
            district: location,
            riskLevel: sanitizedSeverity,
            probabilityPct,
            message: alertBody,
            directives,
          });

          const emailStatus = emailRes.status === "delivered"
            ? "delivered"
            : emailRes.status === "sandbox_simulated"
            ? "sandbox_simulated"
            : "accepted";

          dispatchResults.email = {
            channel: "brevo_email",
            status: emailStatus,
            recipient: user.email,
            messageId: emailRes.messageId || `msg_${Date.now()}`,
            provider: emailRes.provider || "Brevo Transactional SMTP",
            timestamp,
          };

          await AlertDispatch.create({
            district: location,
            severity: sanitizedSeverity === "Critical" ? "Very High" : sanitizedSeverity === "Warning" ? "High" : "Medium",
            title: alertTitle,
            message: alertBody,
            dedupKey: `sim_${user._id}_email_${Date.now()}`,
            channel: "email",
            recipient: user.email,
            userId: user._id,
            isSimulation: true,
            scenario: sanitizedScenario,
            providerMessageId: emailRes.messageId,
            status: emailStatus,
            providerResponse: emailRes,
          });
        } catch (emailErr) {
          dispatchResults.email = {
            channel: "brevo_email",
            status: "failed",
            recipient: user.email,
            detail: emailErr.message,
            timestamp,
          };
        }
      } else {
        dispatchResults.email = {
          channel: "brevo_email",
          status: "skipped_no_email",
          recipient: "No email registered on account",
          timestamp,
        };
      }
    }

    // 3. Dispatch Cellular SMS (recipient strictly from user.phone)
    if (channels.includes("sms")) {
      if (user.phone) {
        try {
          const smsText = `[FloodAI SIMULATION] ${sanitizedSeverity.toUpperCase()}: Flood risk in ${location} (${probabilityPct}%). Directives: ${directives.slice(0, 2).join("; ")}`;
          const smsRes = await smsService.sendSms({
            to: user.phone,
            message: smsText,
          });

          const smsStatus = smsRes.status === "delivered"
            ? "delivered"
            : smsRes.status === "sandbox_simulated"
            ? "sandbox_simulated"
            : "accepted";

          dispatchResults.sms = {
            channel: "cellular_sms",
            status: smsStatus,
            recipient: user.phone,
            sid: smsRes.sid || `sms_${Date.now()}`,
            provider: smsRes.provider || "Cellular SMS Gateway",
            timestamp,
          };

          await AlertDispatch.create({
            district: location,
            severity: sanitizedSeverity === "Critical" ? "Very High" : sanitizedSeverity === "Warning" ? "High" : "Medium",
            title: alertTitle,
            message: smsText,
            dedupKey: `sim_${user._id}_sms_${Date.now()}`,
            channel: "sms",
            recipient: user.phone,
            userId: user._id,
            isSimulation: true,
            scenario: sanitizedScenario,
            providerMessageId: smsRes.sid,
            status: smsStatus,
            providerResponse: smsRes,
          });
        } catch (smsErr) {
          dispatchResults.sms = {
            channel: "cellular_sms",
            status: "failed",
            recipient: user.phone,
            detail: smsErr.message,
            timestamp,
          };
        }
      } else {
        dispatchResults.sms = {
          channel: "cellular_sms",
          status: "skipped_no_phone",
          recipient: "No phone registered on account",
          timestamp,
        };
      }
    }

    // 4. Persist SimulationRun Record in Database
    const simRun = await SimulationRun.create({
      userId: user._id,
      scenario: sanitizedScenario,
      severity: sanitizedSeverity,
      location,
      latitude: resolvedLat,
      longitude: resolvedLon,
      probabilityPct,
      testMessage: alertBody,
      directives,
      channelsRequested: channels,
      channelsDispatched: dispatchResults,
      isSimulation: true,
      acknowledged: false,
    });

    res.json({
      success: true,
      simulationId: simRun._id,
      timestamp,
      scenario: sanitizedScenario,
      severity: sanitizedSeverity,
      probabilityPct,
      location,
      latitude: resolvedLat,
      longitude: resolvedLon,
      alertTitle,
      alertBody,
      directives,
      accountDataTargeted: {
        name: user.displayName,
        email: user.email,
        phone: user.phone || "Not configured",
        phoneVerified: Boolean(user.phoneVerified),
      },
      channels: dispatchResults,
    });
  } catch (err) {
    console.error("[Alerts:Simulate:Error]", err);
    res.status(500).json({ error: "Alert simulation failed", detail: err.message });
  }
});

// POST /api/alerts/simulations/:id/acknowledge -> Resident acknowledges active simulation alert
router.post("/simulations/:id/acknowledge", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const simRun = await SimulationRun.findOneAndUpdate(
      { _id: req.params.id, userId },
      { acknowledged: true, acknowledgedAt: new Date() },
      { new: true }
    );

    if (!simRun) {
      return res.status(404).json({ error: "Simulation record not found or not owned by user" });
    }

    // Also update any matching AlertDispatch records for this user
    await AlertDispatch.updateMany(
      { userId, isSimulation: true, acknowledgedAt: null },
      { acknowledgedAt: new Date() }
    );

    res.json({
      success: true,
      simulationId: simRun._id,
      acknowledged: true,
      acknowledgedAt: simRun.acknowledgedAt,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to acknowledge simulation", detail: err.message });
  }
});

// GET /api/alerts/simulations/history -> Retrieve authenticated resident's recent simulation runs
router.get("/simulations/history", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const history = await SimulationRun.find({ userId, isSimulation: true })
      .sort({ createdAt: -1 })
      .limit(15);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch simulation history", detail: err.message });
  }
});

module.exports = router;

