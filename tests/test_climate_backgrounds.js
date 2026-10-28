/**
 * test_climate_backgrounds.js
 * Verification suite for ClimateBackgroundService & 12 Atmospheric Background Assets
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");

// Mock browser window & document
global.window = {};
global.document = {
  getElementById: (id) => null,
  createElement: (tag) => ({
    appendChild: () => {},
    setAttribute: () => {},
    classList: { add: () => {}, remove: () => {} },
    style: {}
  }),
  body: {
    prepend: () => {}
  },
  readyState: 'complete'
};
global.Image = class {
  constructor() {
    this.complete = true;
  }
};

// Require or evaluate service
const serviceCode = fs.readFileSync(path.join(__dirname, "frontend/js/services/climateBackgroundService.js"), "utf8");
eval(serviceCode);
const ClimateBg = global.window.ClimateBackgroundService;

console.log("==================================================================");
console.log("TESTING CLIMATE BACKGROUND SERVICE & 12 ATMOSPHERIC ASSETS");
console.log("==================================================================");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (e) {
    console.error(`[FAIL] ${name}:`, e.message);
    failed++;
  }
}

// 1. Verify all 12 assets exist on filesystem
const expectedProfiles = [
  'climate_clear', 'climate_cloudy', 'climate_drizzle', 'climate_rain',
  'climate_thunderstorm', 'climate_snow', 'climate_fog', 'climate_windy',
  'climate_night', 'climate_sunrise', 'climate_sunset', 'climate_hot'
];

expectedProfiles.forEach(id => {
  test(`Asset exists on disk for profile: ${id}`, () => {
    const profile = ClimateBg.registry[id];
    assert(profile, `Profile ${id} should be registered in ClimateBackgroundService`);
    const fullPath = path.join(__dirname, "frontend", profile.imagePath);
    assert(fs.existsSync(fullPath), `Image file must exist at ${fullPath}`);
    const stats = fs.statSync(fullPath);
    assert(stats.size > 100000, `Image file size (${stats.size} bytes) should be a valid high-res photo`);
  });
});

// 2. Weather code resolution tests
test("Code 202 (Heavy Thunderstorm) resolves to climate_thunderstorm", () => {
  const bg = ClimateBg.resolveBackgroundId({ weatherCode: 202, temperature: 26, windSpeed: 5 });
  assert.strictEqual(bg, "climate_thunderstorm");
});

test("Code 600 (Snow) resolves to climate_snow", () => {
  const bg = ClimateBg.resolveBackgroundId({ weatherCode: 600, temperature: -2, windSpeed: 3 });
  assert.strictEqual(bg, "climate_snow");
});

test("Code 721 (Haze/Fog) resolves to climate_fog", () => {
  const bg = ClimateBg.resolveBackgroundId({ weatherCode: 721, temperature: 20, windSpeed: 2 });
  assert.strictEqual(bg, "climate_fog");
});

test("Code 501 (Moderate Rain) resolves to climate_rain", () => {
  const bg = ClimateBg.resolveBackgroundId({ weatherCode: 501, temperature: 22, windSpeed: 4 });
  assert.strictEqual(bg, "climate_rain");
});

test("Code 310 (Drizzle) resolves to climate_drizzle", () => {
  const bg = ClimateBg.resolveBackgroundId({ weatherCode: 310, temperature: 21, windSpeed: 3 });
  assert.strictEqual(bg, "climate_drizzle");
});

test("High wind speed (13 m/s) resolves to climate_windy", () => {
  const bg = ClimateBg.resolveBackgroundId({ weatherCode: 801, temperature: 27, windSpeed: 13 });
  assert.strictEqual(bg, "climate_windy");
});

test("Extreme heat (38°C) resolves to climate_hot", () => {
  const bg = ClimateBg.resolveBackgroundId({ weatherCode: 800, temperature: 38, windSpeed: 4 });
  assert.strictEqual(bg, "climate_hot");
});

test("Manual override 'snow' forces climate_snow regardless of live weather", () => {
  ClimateBg.setManualOverride("snow");
  const bg = ClimateBg.resolveBackgroundId({ weatherCode: 800, temperature: 35, windSpeed: 2 });
  assert.strictEqual(bg, "climate_snow");
  ClimateBg.setManualOverride(null); // clear
});

console.log("==================================================================");
console.log(`CLIMATE BACKGROUND TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("==================================================================");
if (failed > 0) process.exit(1);
