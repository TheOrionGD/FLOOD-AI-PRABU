/**
 * authRoutes.js
 * Production user authentication, registration, profile, and phone verification endpoints.
 */

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { authenticateToken, JWT_SECRET } = require("../middleware/authMiddleware");
const smsService = require("../services/smsService");
const brevoEmailService = require("../services/brevoEmailService");

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { email, password, displayName, phone } = req.body;

    if (!email || !password || !displayName) {
      return res.status(400).json({ error: "Email, password, and display name are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const user = await User.create({
      email: normalizedEmail,
      passwordHash,
      displayName: displayName.trim(),
      phone: phone ? phone.trim() : null,
      role: "user",
      emailVerified: false,
    });

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    // Send welcome / verification email asynchronously with dynamic OTP
    const welcomeOtp = Math.floor(100000 + Math.random() * 900000).toString();
    brevoEmailService
      .sendVerificationCode({ to: user.email, code: welcomeOtp })
      .catch((e) => console.warn("[Auth:Email:Warn]", e.message));

    res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        phone: user.phone,
        phoneVerified: user.phoneVerified,
        preferences: user.preferences,
      },
    });
  } catch (err) {
    console.error("[Auth:Register:Error]", err);
    res.status(500).json({ error: "Registration failed", detail: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const validPassword = bcrypt.compareSync(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        phone: user.phone,
        phoneVerified: user.phoneVerified,
        preferences: user.preferences,
        deviceCount: user.fcmTokens?.length || 0,
      },
    });
  } catch (err) {
    console.error("[Auth:Login:Error]", err);
    res.status(500).json({ error: "Login failed", detail: err.message });
  }
});

// POST /api/auth/google/check - Check if Google account is already registered in DB
router.post("/google/check", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.json({ exists: false });
    }
    return res.json({
      exists: true,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        hasPassword: !!user.passwordHash,
      },
    });
  } catch (err) {
    console.error("[Auth:GoogleCheck:Error]", err);
    res.status(500).json({ error: "Verification check failed", detail: err.message });
  }
});

// POST /api/auth/google/login - Authenticate registered Google user
router.post("/google/login", async (req, res) => {
  try {
    const { email, googleUid } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    // Restrict activity if account is not registered in the database
    if (!user) {
      return res.status(404).json({
        error: "No registered FloodAI account found for this Google email. You need to first create an account.",
        notFound: true,
      });
    }

    if (googleUid && !user.googleId) {
      user.googleId = googleUid;
    }
    user.lastLoginAt = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      message: "Google sign-in successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        phone: user.phone,
        phoneVerified: user.phoneVerified,
        preferences: user.preferences,
        deviceCount: user.fcmTokens?.length || 0,
      },
    });
  } catch (err) {
    console.error("[Auth:GoogleLogin:Error]", err);
    res.status(500).json({ error: "Google sign-in failed", detail: err.message });
  }
});

// POST /api/auth/google/register - Register Google user with immediate password creation
router.post("/google/register", async (req, res) => {
  try {
    const { email, password, displayName, phone, googleUid } = req.body;

    if (!email || !password || !displayName) {
      return res.status(400).json({ error: "Email, password, and display name are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists. Please sign in." });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // All newly registered accounts are under the "user" role
    const user = await User.create({
      email: normalizedEmail,
      passwordHash,
      displayName: displayName.trim(),
      phone: phone ? phone.trim() : null,
      role: "user",
      googleId: googleUid || null,
      authProvider: "google",
      emailVerified: true,
    });

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    const googleWelcomeOtp = Math.floor(100000 + Math.random() * 900000).toString();
    brevoEmailService
      .sendVerificationCode({ to: user.email, code: googleWelcomeOtp })
      .catch((e) => console.warn("[Auth:Email:Warn]", e.message));

    res.status(201).json({
      message: "Google account registration successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        phone: user.phone,
        phoneVerified: user.phoneVerified,
        preferences: user.preferences,
      },
    });
  } catch (err) {
    console.error("[Auth:GoogleRegister:Error]", err);
    res.status(500).json({ error: "Google account registration failed", detail: err.message });
  }
});

// GET /api/auth/me
router.get("/me", authenticateToken, async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      email: req.user.email,
      displayName: req.user.displayName,
      role: req.user.role,
      phone: req.user.phone,
      phoneVerified: req.user.phoneVerified,
      emailVerified: req.user.emailVerified,
      preferences: req.user.preferences,
      deviceCount: req.user.fcmTokens?.length || 0,
      createdAt: req.user.createdAt,
    },
  });
});

// PUT /api/auth/preferences
router.put("/preferences", authenticateToken, async (req, res) => {
  try {
    const { alertRadiusKm, severityThreshold, channels, subscribedDistricts, savedLocations } = req.body;
    const user = req.user;

    if (alertRadiusKm !== undefined) user.preferences.alertRadiusKm = Number(alertRadiusKm);
    if (severityThreshold) user.preferences.severityThreshold = severityThreshold;
    if (channels) user.preferences.channels = { ...user.preferences.channels, ...channels };
    if (subscribedDistricts) user.preferences.subscribedDistricts = subscribedDistricts;
    if (savedLocations) user.preferences.savedLocations = savedLocations;

    await user.save();
    res.json({ message: "Preferences updated", preferences: user.preferences });
  } catch (err) {
    res.status(500).json({ error: "Failed to update preferences", detail: err.message });
  }
});

// POST /api/auth/request-phone-otp
router.post("/request-phone-otp", authenticateToken, async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: "Phone number is required" });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    req.user.phone = phone.trim();
    req.user.phoneOtp = { code, expiresAt };
    await req.user.save();

    await smsService.sendOtp({ to: phone, code });

    res.json({
      message: `Verification OTP dispatched to ${phone}`,
      expiresInMinutes: 10,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to dispatch OTP", detail: err.message });
  }
});

// POST /api/auth/verify-phone-otp
router.post("/verify-phone-otp", authenticateToken, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "Verification code is required" });

    const user = req.user;
    if (!user.phoneOtp || !user.phoneOtp.code) {
      return res.status(400).json({ error: "No pending OTP found. Request a new code." });
    }

    if (new Date() > new Date(user.phoneOtp.expiresAt)) {
      return res.status(400).json({ error: "OTP has expired. Please request a new code." });
    }

    if (user.phoneOtp.code !== code.trim()) {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    user.phoneVerified = true;
    user.phoneOtp = undefined;
    await user.save();

    res.json({ message: "Phone number successfully verified", phoneVerified: true });
  } catch (err) {
    res.status(500).json({ error: "Phone verification failed", detail: err.message });
  }
});

// POST /api/auth/logout
router.post("/logout", authenticateToken, async (req, res) => {
  const { fcmToken } = req.body;
  if (fcmToken && req.user) {
    await req.user.removeFcmToken(fcmToken);
  }
  res.json({ message: "Logged out successfully" });
});

module.exports = router;
