const express = require("express");
const router = express.Router();
const Alert = require("../models/Alert");
const alertRouter = require("../services/alertRouter");
const { optionalToken, authenticateToken, requireRole } = require("../middleware/authMiddleware");

// GET /api/alerts -> active emergency alerts (public operational view)
router.get("/", async (req, res) => {
  try {
    const alerts = await Alert.find({ active: true }).sort({ createdAt: -1 });
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
    });

    // Map level to severity
    const severityMap = { Red: "Very High", Orange: "High", Yellow: "Medium", Green: "Low" };
    const severity = severityMap[level] || "Medium";

    // Trigger multi-channel dispatch (FCM Web Push, Brevo email, SMS) with deduplication
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

module.exports = router;
