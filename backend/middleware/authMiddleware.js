/**
 * authMiddleware.js
 * JWT verification and Role-Based Access Control middleware.
 */

const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "floodai_threat_intelligence_super_secret_key_2026";

async function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    return res.status(401).json({ error: "Authentication required", code: "TOKEN_MISSING" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-passwordHash -phoneOtp");
    if (!user) {
      return res.status(401).json({ error: "User session revoked or user not found", code: "USER_NOT_FOUND" });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token", code: "TOKEN_INVALID" });
  }
}

function optionalToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    User.findById(decoded.userId)
      .select("-passwordHash -phoneOtp")
      .then((user) => {
        req.user = user || null;
        next();
      })
      .catch(() => {
        req.user = null;
        next();
      });
  } catch (err) {
    req.user = null;
    next();
  }
}

function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Insufficient permissions",
        requiredRoles: allowedRoles,
        userRole: req.user.role,
      });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  optionalToken,
  requireRole,
  JWT_SECRET,
};
