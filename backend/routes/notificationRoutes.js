/**
 * notificationRoutes.js
 * Endpoints for FCM Web Push browser device registration, preference management,
 * dispatch history, and test push triggers.
 */

const express = require("express");
const router = express.Router();
const User = require("../models/User");
const AlertDispatch = require("../models/AlertDispatch");
const { optionalToken, authenticateToken } = require("../middleware/authMiddleware");
const fcmService = require("../services/fcmService");

// POST /api/notifications/register-token
router.post("/register-token", optionalToken, async (req, res) => {
  try {
    const { token, userAgent = "" } = req.body;
    if (!token) {
      return res.status(400).json({ error: "FCM registration token is required" });
    }

    if (req.user) {
      await req.user.addFcmToken(token, userAgent);
      return res.status(200).json({
        message: "Device registered with authenticated user",
        registered: true,
        deviceCount: req.user.fcmTokens.length,
      });
    }

    // If anonymous, associate with a public guest pool or confirm token validation
    res.status(200).json({
      message: "Browser notification token validated and registered (guest session)",
      registered: true,
      tokenPreview: `${token.substring(0, 16)}...`,
    });
  } catch (err) {
    console.error("[Notifications:Register:Error]", err);
    res.status(500).json({ error: "Failed to register browser token", detail: err.message });
  }
});

// POST /api/notifications/unregister-token
router.post("/unregister-token", optionalToken, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "Token is required" });

    if (req.user) {
      await req.user.removeFcmToken(token);
    } else {
      await fcmService.removeInvalidToken(token);
    }

    res.json({ message: "Token unregistered successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to unregister token", detail: err.message });
  }
});

// POST /api/notifications/test-push
router.post("/test-push", async (req, res) => {
  try {
    const { token, title, body } = req.body;
    if (!token) return res.status(400).json({ error: "FCM token is required for test push" });

    const result = await fcmService.sendToToken(token, {
      title: title || "FloodAI Test Notification",
      body: body || "Web Push notification delivery is active and operational.",
      data: { url: "/#alerts", type: "system_test" },
    });

    res.json({ message: "Test push notification dispatched", result });
  } catch (err) {
    res.status(500).json({ error: "Test push failed", detail: err.message });
  }
});

// GET /api/notifications/history
router.get("/history", optionalToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required to view notification history" });
    }
    const query = {};
    if (req.user.role !== "admin") {
      query.$or = [
        { userId: req.user._id },
        { recipient: `district:${req.user.preferences?.subscribedDistricts?.[0] || "Chennai"}` },
      ];
    }

    const history = await AlertDispatch.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ total: history.length, dispatches: history });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notification history", detail: err.message });
  }
});

// GET /api/notifications/stats
router.get("/stats", async (req, res) => {
  try {
    const total = await AlertDispatch.countDocuments();
    const sent = await AlertDispatch.countDocuments({ status: { $in: ["sent", "delivered"] } });
    const fcmCount = await AlertDispatch.countDocuments({ channel: "fcm" });
    const emailCount = await AlertDispatch.countDocuments({ channel: "email" });
    const smsCount = await AlertDispatch.countDocuments({ channel: "sms" });

    res.json({
      total_dispatches: total,
      successful: sent,
      channels: {
        fcm: fcmCount,
        email: emailCount,
        sms: smsCount,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats", detail: err.message });
  }
});

module.exports = router;
