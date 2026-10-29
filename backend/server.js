/**
 * server.js
 * Production Express Entry Point for the FloodAI Threat Intelligence Platform.
 */

const fs = require("fs");
const path = require("path");
const dns = require("dns");

// Configure public DNS resolvers to handle SRV lookups reliably across all Windows networks
try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch (e) {
  console.warn("[DNS] Using system DNS resolvers");
}

// Centralized environment configuration loader (strict, validated, fail-fast)
const config = require("./config/env");

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const floodRoutes = require("./routes/floodRoutes");
const predictRoutes = require("./routes/predictRoutes");
const alertRoutes = require("./routes/alertRoutes");
const weatherRoutes = require("./routes/weatherRoutes");
const authRoutes = require("./routes/authRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const geospatialRoutes = require("./routes/geospatialRoutes");
const threatRoutes = require("./routes/threatRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false, // allow map tiles and embedded assets
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration
const allowedOrigins = config.corsOrigin;

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id", "X-Internal-Service-Key"],
  })
);

app.use(express.json({ limit: "2mb" }));

// Request ID & Structured Logging Middleware
app.use((req, res, next) => {
  req.id = req.headers["x-request-id"] || uuidv4();
  res.setHeader("X-Request-Id", req.id);
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path !== "/api/health") {
      console.log(`[${new Date().toISOString()}] [${req.id.substring(0, 8)}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    }
  });
  next();
});

// Rate limiters for public endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { error: "Too many authentication requests, please try again later." },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// Health Check & Dependency Readiness
app.get("/api/health", async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };

  res.json({
    status: "healthy",
    service: "FloodAI Backend API",
    version: "2.0.0",
    uptime: Math.floor(process.uptime()),
    database: {
      status: dbStatusMap[dbState] || "unknown",
      host: mongoose.connection.host || "none",
    },
    integrations: {
      ml_microservice: process.env.ML_API_URL || "http://localhost:8000",
      groq_ai: "configured",
      firebase_fcm: "ready",
      brevo_email: "ready",
      sms_provider: "ready",
    },
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/predict", predictRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/floods", floodRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/geospatial", geospatialRoutes);
app.use("/api/threats", threatRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.json({
    status: "FloodAI Threat Intelligence API running",
    endpoints: [
      "/api/health",
      "/api/auth",
      "/api/predict",
      "/api/threats/current",
      "/api/threats/personal-intelligence",
      "/api/geospatial/districts",
      "/api/geospatial/inundation-layers",
      "/api/geospatial/radar-source",
      "/api/notifications/register-token",
      "/api/alerts",
      "/api/floods",
    ],
  });
});

// Favicon Handler (Prevent 404 logs from browser requests)
app.get("/favicon.ico", (req, res) => {
  const iconPath = path.join(__dirname, "..", "frontend", "favicon.ico");
  if (fs.existsSync(iconPath)) {
    return res.sendFile(iconPath);
  }
  res.status(204).end();
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found", path: req.originalUrl });
});

// Centralized Error Handler
app.use((err, req, res, next) => {
  console.error(`[ERROR] [${req.id || "SYS"}]`, err.stack || err.message);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    requestId: req.id,
  });
});

const PORT = config.port;
let MONGO_URI = config.mongodbUri;

// Ensure database name is included in Mongo URI
if (MONGO_URI && !MONGO_URI.includes("/flood_prediction") && !MONGO_URI.includes("?")) {
  MONGO_URI = `${MONGO_URI.replace(/\/$/, "")}/flood_prediction`;
} else if (MONGO_URI && !MONGO_URI.includes("/flood_prediction") && MONGO_URI.includes("?")) {
  MONGO_URI = MONGO_URI.replace("?", "/flood_prediction?");
}
if (!MONGO_URI) {
  MONGO_URI = "mongodb://127.0.0.1:27017/flood_prediction";
}

const connectDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 12000,
      connectTimeoutMS: 15000,
    });
    console.log(`[MongoDB] Connected successfully to: ${mongoose.connection.host || "Atlas"}`);
    // Ground-truth dataset seeding guarded by explicit opt-in environment flag
    if (process.env.ENABLE_DATASET_SEED === "true") {
      try {
        const seedDatabase = require("./scripts/seed_database");
        await seedDatabase();
      } catch (sErr) {
        console.warn("[MongoDB:Seed:Note]", sErr.message);
      }
    }
  } catch (err) {
    console.warn(`[MongoDB:Warning] Atlas/Local connection failed (${err.message}). Running in resilient standalone mode.`);
  }
};

const readyPromise = connectDatabase();
app.readyPromise = readyPromise;

if (require.main === module) {
  readyPromise.finally(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[FloodAI] Threat Intelligence Backend running on port ${PORT} (0.0.0.0)`);
    });
  });
}

module.exports = app;
