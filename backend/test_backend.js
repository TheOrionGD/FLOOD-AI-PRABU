/**
 * test_backend.js
 * Comprehensive integration tests for FloodAI backend API:
 * - Health Check
 * - Registration & JWT Authentication
 * - Protected /me & Preferences
 * - Geospatial Districts GeoJSON
 * - Inundation Layers
 * - Notification Token Registration
 * - Threat Assessment & Personal Intelligence
 */

const app = require("./server");
const http = require("http");

async function runTests() {
  console.log("==================================================");
  console.log("STARTING FLOODAI BACKEND INTEGRATION TESTS");
  console.log("==================================================");

  if (app.readyPromise) {
    await app.readyPromise;
  }

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5099, resolve));
  const baseUrl = "http://127.0.0.1:5099";

  async function request(path, options = {}) {
    const url = `${baseUrl}${path}`;
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    const res = await fetch(url, {
      method: options.method || "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
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

  try {
    // 1. Health check
    const health = await request("/api/health");
    assert(health.status === 200, "GET /api/health returns 200");
    assert(health.data.status === "healthy", "System status is healthy");

    // 2. Geospatial Districts GeoJSON
    const geo = await request("/api/geospatial/districts");
    assert(geo.status === 200, "GET /api/geospatial/districts returns 200");
    assert(geo.data.type === "FeatureCollection", "Districts returns valid GeoJSON FeatureCollection");
    assert(geo.data.features.length === 10, "10 monitored district polygons present in GeoJSON");

    // 3. Inundation Layers
    const inun = await request("/api/geospatial/inundation-layers");
    assert(inun.status === 200, "GET /api/geospatial/inundation-layers returns 200");
    assert(inun.data.zones.length === 10, "Inundation zones available with depth estimates");

    // 3b. Hyper-Local Climatic & Geospatial Intelligence
    const climatic = await request("/api/geospatial/climatic-intelligence?lat=10.874&lon=78.727");
    assert(climatic.status === 200, "GET /api/geospatial/climatic-intelligence returns 200");
    assert(climatic.data.openstreetmap && climatic.data.openstreetmap.provider.includes("OpenStreetMap"), "OpenStreetMap GIS data resolved");
    assert(climatic.data.weather && climatic.data.weather.provider.includes("OpenWeatherMap"), "OpenWeather telemetry data available");
    assert(climatic.data.catchment_threat && typeof climatic.data.catchment_threat.flood_probability_pct === "number", "Catchment flood threat modeled");

    // 4. Registration
    const testEmail = `operator_${Date.now()}@floodai.org`;
    const reg = await request("/api/auth/register", {
      method: "POST",
      body: {
        email: testEmail,
        password: "securePassword123!",
        displayName: "Disaster Operations Analyst",
        phone: "+919876543210",
      },
    });
    assert(reg.status === 201, "POST /api/auth/register creates user account", `(Status: ${reg.status})`);
    const authToken = reg.data.token;
    assert(Boolean(authToken), "Registration returns JWT token");

    // 5. Protected Profile (/api/auth/me)
    const profile = await request("/api/auth/me", {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert(profile.status === 200, "GET /api/auth/me accepts Bearer token");
    assert(profile.data.user.email === testEmail, "Profile matches authenticated user");

    // 6. User Preferences
    const pref = await request("/api/auth/preferences", {
      method: "PUT",
      headers: { Authorization: `Bearer ${authToken}` },
      body: { alertRadiusKm: 75, severityThreshold: "High" },
    });
    assert(pref.status === 200, "PUT /api/auth/preferences updates preferences");
    assert(pref.data.preferences.alertRadiusKm === 75, "Alert radius updated to 75 km");

    // 7. Notification Token Registration
    const tokenReg = await request("/api/notifications/register-token", {
      method: "POST",
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        token: "fcm_test_device_token_web_push_982174",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
    });
    assert(tokenReg.status === 200, "POST /api/notifications/register-token registers browser token");

    // 8. Test Push Dispatch
    const pushTest = await request("/api/notifications/test-push", {
      method: "POST",
      body: {
        token: "fcm_test_device_token_web_push_982174",
        title: "Flood Alert Test",
        body: "Web Push notification operational check",
      },
    });
    assert(pushTest.status === 200, "POST /api/notifications/test-push delivers Web Push payload");

    // 9. Personal Location Intelligence
    const pers = await request("/api/threats/personal-intelligence?lat=13.08&lon=80.27", {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert(pers.status === 200, "GET /api/threats/personal-intelligence calculates proximity");
    assert(pers.data.nearest_district === "Chennai", "Resolves coordinates 13.08, 80.27 to Chennai");
    assert(pers.data.distance_km <= 5, "Calculated distance to Chennai center is accurate");

    // 10. Notification History
    const history = await request("/api/notifications/history", {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert(history.status === 200, "GET /api/notifications/history returns user notifications");

    // 10. Google Auth: Check unregistered account
    const unregGoogleEmail = `unregistered_${Date.now()}@gmail.com`;
    const gCheck1 = await request("/api/auth/google/check", {
      method: "POST",
      body: { email: unregGoogleEmail },
    });
    assert(gCheck1.status === 200, "POST /api/auth/google/check returns 200");
    assert(gCheck1.data.exists === false, "Unregistered Google account reports exists: false");

    // 11. Google Auth: Restrict login on unregistered account (404)
    const gLoginFail = await request("/api/auth/google/login", {
      method: "POST",
      body: { email: unregGoogleEmail, googleUid: "g_test_unreg_123" },
    });
    assert(gLoginFail.status === 404, "POST /api/auth/google/login restricts unregistered account with 404");
    assert(gLoginFail.data.notFound === true, "Unregistered login returns notFound: true");

    // 12. Google Auth: Register account with immediate user-created password & user role
    const gReg = await request("/api/auth/google/register", {
      method: "POST",
      body: {
        email: unregGoogleEmail,
        displayName: "Google Resident User",
        password: "immediateUserPassword456!",
        phone: "+919876500000",
        googleUid: "g_test_uid_789",
      },
    });
    assert(gReg.status === 201, "POST /api/auth/google/register creates account with 201");
    assert(Boolean(gReg.data.token), "Google registration returns JWT token");
    assert(gReg.data.user.role === "user", "Newly registered Google user has 'user' role");
    assert(gReg.data.user.displayName === "Google Resident User", "User displayName matches Google name");

    // 13. Google Auth: Check now-registered account & Login
    const gCheck2 = await request("/api/auth/google/check", {
      method: "POST",
      body: { email: unregGoogleEmail },
    });
    assert(gCheck2.status === 200 && gCheck2.data.exists === true, "Registered Google account reports exists: true");

    const gLoginSuccess = await request("/api/auth/google/login", {
      method: "POST",
      body: { email: unregGoogleEmail, googleUid: "g_test_uid_789" },
    });
    assert(gLoginSuccess.status === 200, "POST /api/auth/google/login succeeds for registered user");
    assert(Boolean(gLoginSuccess.data.token), "Google login returns valid JWT token");
    assert(gLoginSuccess.data.user.role === "user", "Authenticated Google user retains 'user' role");

    console.log("==================================================");
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("==================================================");
  } catch (e) {
    console.error("Test execution exception:", e);
    failed++;
  } finally {
    server.close();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
