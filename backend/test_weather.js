/**
 * test_weather.js
 * Verification test for OpenWeather backend endpoints:
 * - Current weather with coordinates and city query
 * - Forecast endpoint
 * - Reverse geocoding
 * - Direct geocoding search
 * - Cache verification
 * - Error handling for invalid parameters
 */

const http = require("http");
const app = require("./server");

async function runTests() {
  console.log("==================================================");
  console.log("STARTING FLOODAI WEATHER API INTEGRATION TESTS");
  console.log("==================================================");

  if (app.readyPromise) {
    await app.readyPromise;
  }

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5098, resolve));
  const baseUrl = "http://127.0.0.1:5098";

  async function request(path) {
    const res = await fetch(`${baseUrl}${path}`);
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  }

  let passed = 0;
  let failed = 0;

  function assert(condition, name, detail = "") {
    if (condition) {
      console.log(`[PASS] ${name} ${detail}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name} ${detail}`);
      failed++;
    }
  }

  try {
    // 1. Current Weather by Lat/Lon
    const w1 = await request("/api/weather?lat=13.0827&lon=80.2707");
    assert(w1.status === 200, "GET /api/weather with lat/lon returns 200");
    assert(w1.data.success === true, "Weather response has success=true");
    assert(w1.data.data && typeof w1.data.data.main?.temp === "number", "Weather contains temperature number");
    assert(Array.isArray(w1.data.data.weather) && w1.data.data.weather.length > 0, "Weather array has conditions");

    // 2. Weather Cache Hit
    const w2 = await request("/api/weather?lat=13.0827&lon=80.2707");
    assert(w2.status === 200, "GET /api/weather cache test returns 200");
    assert(w2.data.cached === true, "Repeated request is served from cache");

    // 3. Current Weather by City Name
    const wCity = await request("/api/weather?q=Chennai");
    assert(wCity.status === 200, "GET /api/weather?q=Chennai returns 200");
    assert(wCity.data.data.name.toLowerCase().includes("chennai"), "City weather returns Chennai data");

    // 4. Reverse Geocoding
    const rev = await request("/api/weather/reverse-geocode?lat=13.0827&lon=80.2707");
    assert(rev.status === 200, "GET /api/weather/reverse-geocode returns 200");
    assert(rev.data.data && rev.data.data.name, `Reverse geocoding resolves city name: ${rev.data.data?.name}`);

    // 5. Direct Geocoding City Search
    const geo = await request("/api/weather/geosearch?q=Madurai");
    assert(geo.status === 200, "GET /api/weather/geosearch returns 200");
    assert(Array.isArray(geo.data.data) && geo.data.data.length > 0, "City search returns array of candidates");
    assert(geo.data.data[0].name.toLowerCase().includes("madurai"), "First result matches search query");

    // 6. Invalid Coordinate Validation
    const inv = await request("/api/weather?lat=999&lon=999");
    assert(inv.status === 400, "Invalid coordinates return HTTP 400");
    assert(inv.data.success === false, "Invalid coordinate response success=false");

    // 7. Short Query Validation
    const shortQ = await request("/api/weather/geosearch?q=a");
    assert(shortQ.status === 400, "Short search query returns HTTP 400");

    console.log("==================================================");
    console.log(`WEATHER TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("==================================================");
  } catch (err) {
    console.error("Test execution failed:", err);
    failed++;
  } finally {
    server.close();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
