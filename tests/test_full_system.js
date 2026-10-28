/**
 * test_full_system.js
 * End-to-End System Test verifying all services and workflows:
 * - Python ML Microservice (XGBoost, SHAP, Groq Threat Intel)
 * - Node.js Express Backend (Atlas MongoDB, JWT Auth, SMS/Brevo, FCM Web Push, GeoJSON)
 * - Full Cross-Service Integration Pipeline
 */

const { spawn } = require("child_process");
const path = require("path");

const ML_PORT = 8000;
const API_PORT = 5000;

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function request(url, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const res = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

let passed = 0;
let failed = 0;

function assert(condition, testName, extra = "") {
  if (condition) {
    console.log(`[PASS] ${testName} ${extra}`);
    passed++;
  } else {
    console.error(`[FAIL] ${testName} ${extra}`);
    failed++;
  }
}

async function run() {
  console.log("=====================================================================");
  console.log("       FLOODAI PLATFORM - FULL END-TO-END VERIFICATION    ");
  console.log("=====================================================================");

  // 1. Launch Python ML Microservice
  console.log("\n[1/4] Starting Python ML Microservice...");
  const mlProcess = spawn("python", ["predict_api.py"], {
    cwd: path.join(__dirname, "..", "ml_model"),
    shell: true,
    stdio: "pipe",
  });

  mlProcess.stdout.on("data", (d) => console.log("[ML:Out]", d.toString().trim()));
  mlProcess.stderr.on("data", (d) => console.log("[ML:Err]", d.toString().trim()));

  // Wait for ML service to become healthy
  let mlReady = false;
  for (let i = 0; i < 25; i++) {
    await sleep(1000);
    try {
      const h = await request(`http://127.0.0.1:${ML_PORT}/health`);
      if (h.status === 200 && h.data.status === "healthy") {
        mlReady = true;
        break;
      }
    } catch (e) {}
  }
  assert(mlReady, "Python ML Microservice running & healthy on port 8000");

  // 2. Launch Node.js Backend API
  console.log("\n[2/4] Starting Node.js Express Backend API...");
  const backendProcess = spawn("node", ["server.js"], {
    cwd: path.join(__dirname, "..", "backend"),
    shell: true,
    stdio: "pipe",
  });

  backendProcess.stdout.on("data", (d) => console.log("[Node:Out]", d.toString().trim()));
  backendProcess.stderr.on("data", (d) => console.log("[Node:Err]", d.toString().trim()));

  // Wait for Backend API to become healthy
  let backendReady = false;
  for (let i = 0; i < 25; i++) {
    await sleep(1000);
    try {
      const h = await request(`http://127.0.0.1:${API_PORT}/api/health`);
      if (h.status === 200 && h.data.status === "healthy") {
        backendReady = true;
        break;
      }
    } catch (e) {}
  }
  assert(backendReady, "Node.js Express Backend running & healthy on port 5000");

  try {
    console.log("\n[3/4] Running Comprehensive Cross-Service Workflows...");

    // Workflow A: ML Model Comparison
    const comp = await request(`http://127.0.0.1:${API_PORT}/api/predict/comparison`);
    assert(comp.status === 200, "Node.js successfully proxies ML model comparison");
    assert(comp.data.models.xgboost.metrics.accuracy > 0.8, "XGBoost accuracy exceeds 80%");
    assert(comp.data.models.random_forest.metrics.accuracy > 0.8, "Random Forest baseline accuracy exceeds 80%");
    assert(comp.data.shap_analysis.global_importance.length >= 8, "Global SHAP feature rankings available");

    // Workflow B: Cross-Service Prediction with SHAP Explainability
    const predPayload = {
      location: "Chennai",
      rainfall_mm: 260.0,
      river_level_m: 8.4,
      sea_level_m: 2.2,
      temperature_c: 28.0,
      humidity_pct: 88.0,
      wind_speed_kmh: 55.0,
      soil_moisture_pct: 80.0,
      reservoir_level_pct: 92.0,
      elevation_m: 6.1,
      distance_from_coast_km: 12.0,
      population_density: 2750.0,
      forest_cover_pct: 12.0,
      cyclone: 1,
      drainage_score: 35.0,
      engine: "xgboost",
    };

    const predRes = await request(`http://127.0.0.1:${API_PORT}/api/predict`, {
      method: "POST",
      body: predPayload,
    });
    assert(predRes.status === 200, "Cross-service prediction request succeeds");
    assert(predRes.data.risk_level === "Very High" || predRes.data.risk_level === "High", "Calculated risk severity matches extreme weather conditions");
    assert(predRes.data.flood_probability_pct > 60, `High flood probability returned (${predRes.data.flood_probability_pct}%)`);
    assert(Boolean(predRes.data.shap_explanation), "Local SHAP explanation returned with prediction");
    assert(predRes.data.shap_explanation.top_positive.length > 0, "Top positive risk contributors identified");

    // Workflow C: Automated Threat Pipeline & Groq Threat Intelligence
    const assessRes = await request(`http://127.0.0.1:${API_PORT}/api/threats/assess-district`, {
      method: "POST",
      body: { district: "Mumbai" },
    });
    assert(assessRes.status === 200, "Automated district threat assessment executes");
    assert(Boolean(assessRes.data.assessment), "Threat assessment stored in MongoDB Atlas");
    const aiIntel = assessRes.data.assessment?.aiThreatIntel;
    assert(Boolean(aiIntel), "Groq AI Threat Intelligence directives synthesized");
    console.log(`      -> Headline: "${aiIntel?.threat_title}"`);
    console.log(`      -> Model: "${aiIntel?.source_ai_model}"`);

    // Workflow D: User Registration, JWT & Isolation
    const uniqueEmail = `qa_officer_${Date.now()}@floodai.org`;
    const regRes = await request(`http://127.0.0.1:${API_PORT}/api/auth/register`, {
      method: "POST",
      body: {
        email: uniqueEmail,
        password: "PassWord999!",
        displayName: "QA Field Officer",
        phone: "+919811223344",
      },
    });
    assert(regRes.status === 201, "User registration succeeds with MongoDB Atlas");
    const token = regRes.data.token;

    const meRes = await request(`http://127.0.0.1:${API_PORT}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(meRes.status === 200, "Protected user profile endpoint accepts JWT");
    assert(meRes.data.user.email === uniqueEmail, "Profile data matches registered user");

    // Workflow E: Phone OTP Verification Flow
    const otpReq = await request(`http://127.0.0.1:${API_PORT}/api/auth/request-phone-otp`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: { phone: "+919811223344" },
    });
    assert(otpReq.status === 200, "Phone verification OTP dispatched via SMS provider abstraction");

    // Workflow F: Firebase Web Push Token Registration & Dispatch
    const testFcmToken = `fcm_web_token_e2e_${Date.now()}`;
    const fcmReg = await request(`http://127.0.0.1:${API_PORT}/api/notifications/register-token`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: { token: testFcmToken, userAgent: "Chrome/124.0 Headless" },
    });
    assert(fcmReg.status === 200, "Browser Web Push FCM token registered to user");

    const pushRes = await request(`http://127.0.0.1:${API_PORT}/api/notifications/test-push`, {
      method: "POST",
      body: { token: testFcmToken, title: "E2E Test", body: "Operational verification" },
    });
    assert(pushRes.status === 200, "FCM Web Push test dispatch verified");

    // Workflow G: Geospatial Intelligence & Proximity
    const geoDistricts = await request(`http://127.0.0.1:${API_PORT}/api/geospatial/districts`);
    assert(geoDistricts.status === 200, "GeoJSON district boundaries retrieved");
    assert(geoDistricts.data.features.length === 10, "All 10 monitored districts rendered as valid polygon boundaries");

    // Workflow H: Resident Flood Alert Simulation & Isolation
    const simRes = await request(`http://127.0.0.1:${API_PORT}/api/alerts/simulate-resident-flood`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: {
        scenario: "coastal_surge",
        severity: "Critical",
        location: "Mumbai Gateway Sector",
        latitude: 18.9220,
        longitude: 72.8347,
        channels: ["siren", "email", "sms", "fcm"],
        probabilityPct: 91.2
      }
    });
    assert(simRes.status === 200, "Resident alert simulation dispatches across requested channels");
    assert(simRes.data.success === true, "Simulation confirmed with success status");
    assert(simRes.data.accountDataTargeted.email === uniqueEmail, "Simulation targets authenticated user email");
    assert(Boolean(simRes.data.simulationId), "Simulation run stored with unique ID");

    // Acknowledge simulation
    const ackRes = await request(`http://127.0.0.1:${API_PORT}/api/alerts/simulations/${simRes.data.simulationId}/acknowledge`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    assert(ackRes.status === 200, "Simulation acknowledgment recorded in database");

    // Verify isolation from public alerts
    const alertsRes = await request(`http://127.0.0.1:${API_PORT}/api/alerts`);
    assert(alertsRes.status === 200, "Operational public alerts retrieved");
    const leakCheck = alertsRes.data.some(a => a.isSimulation === true);
    assert(!leakCheck, "Simulation is completely isolated and excluded from public alert feed");

    // Database cleanup: remove test user and dispatches
    const mongoose = require("mongoose");
    if (mongoose.connection.readyState === 1) {
      const User = mongoose.model("User");
      const SimulationRun = mongoose.model("SimulationRun");
      const AlertDispatch = mongoose.model("AlertDispatch");
      await User.deleteOne({ email: uniqueEmail });
      await SimulationRun.deleteMany({ userId: regRes.data.user?._id });
      await AlertDispatch.deleteMany({ userId: regRes.data.user?._id });
      console.log("[CLEANUP] Purged E2E test account and simulation records.");
    }

    console.log("\n=====================================================================");
    console.log(`FULL SYSTEM INTEGRATION RESULT: ${passed} PASSED, ${failed} FAILED`);
    console.log("=====================================================================");
  } catch (err) {
    console.error("Test execution error:", err);
    failed++;
  } finally {
    // Terminate spawned services
    mlProcess.kill();
    backendProcess.kill();
    await sleep(500);
    process.exit(failed > 0 ? 1 : 0);
  }
}

run();
