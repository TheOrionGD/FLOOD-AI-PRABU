/**
 * backend/config/env.js
 * Centralized, validated environment configuration loader for FloodAI backend.
 * Enforces strict validation, fails fast on critical misconfigurations,
 * and guarantees secret values are never printed in logs or stack traces.
 */

const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

// 1. Load .env file (check backend/.env, then root .env)
const backendEnvPath = path.resolve(__dirname, "..", ".env");
const rootEnvPath = path.resolve(__dirname, "..", "..", ".env");

if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
} else if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else {
  dotenv.config(); // fallback to default
}

const isProduction = process.env.NODE_ENV === "production";

// 2. Validate and assemble configuration
const config = {
  env: process.env.NODE_ENV || "development",
  isProduction,
  port: parseInt(process.env.PORT, 10) || 5000,
  
  // Database
  mongodbUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/floodai",
  
  // Security & Authentication
  jwtSecret: process.env.JWT_SECRET || (isProduction ? null : "dev_jwt_secret_floodai_local_key_32chars"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  internalServiceKey: process.env.INTERNAL_SERVICE_KEY || process.env.INTERNAL_SERVICE_SECRET || "",
  
  // External Telemetry & APIs
  openWeatherApiKey: process.env.OPENWEATHER_API_KEY || "",
  mlServiceUrl: process.env.ML_SERVICE_URL || "http://127.0.0.1:8000",
  
  // CORS Configuration
  corsOrigin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
    : "*",
    
  // Push Notifications / VAPID
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY || "",
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || "",
  vapidSubject: process.env.VAPID_SUBJECT || "mailto:admin@floodai.org",
  
  // Email / SMS Gateways
  brevoApiKey: process.env.BREVO_API_KEY || "",
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || "",
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || "",
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || ""
};

/**
 * Validate configuration integrity
 * Fails fast on missing required variables in production without leaking secrets.
 */
function validateConfig() {
  const missing = [];

  if (config.isProduction) {
    if (!process.env.MONGODB_URI) missing.push("MONGODB_URI");
    if (!process.env.JWT_SECRET) missing.push("JWT_SECRET");
  }

  if (missing.length > 0) {
    throw new Error(
      `[CRITICAL CONFIG ERROR] Missing required environment variables in production: ${missing.join(
        ", "
      )}. Check your environment configuration.`
    );
  }

  if (config.jwtSecret && config.jwtSecret.length < 16) {
    console.warn(
      "[SECURITY WARNING] JWT_SECRET is shorter than 16 characters. Use a strong 256-bit entropy secret in production."
    );
  }
}

// Execute validation
validateConfig();

module.exports = config;
