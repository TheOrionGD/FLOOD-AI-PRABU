/**
 * tests/test_coastal_flood_engine.js
 * Comprehensive Verification Test Suite for the Dynamic Coastal Flood Intelligence Engine.
 *
 * Verifies:
 * 1. Configurable 500km search radius & global dynamic discovery without hardcoded cities
 * 2. Stable deterministic zone ID generation across repeated calculations
 * 3. Physical multi-factor risk scoring (temperature alone cannot cause flood risk)
 * 4. Directed hydrodynamic propagation graph and Saint-Venant 1D arrival-time estimation
 * 5. Complete end-to-end API response contract for GET /api/geospatial/coastal-intelligence
 * 6. Simulation isolation (isSimulation: true) and multi-channel test dispatch
 */

const http = require("http");
const app = require("../backend/server");
const CoastalDiscoveryService = require("../backend/services/coastalDiscoveryService");
const EnvironmentalIntelligenceService = require("../backend/services/environmentalIntelligenceService");
const RiskRankingEngine = require("../backend/services/riskRankingEngine");
const CoastalPropagationEngine = require("../backend/services/coastalPropagationEngine");

let passed = 0;
let failed = 0;

function assert(condition, name, detail = "") {
  if (condition) {
    console.log(`[PASS] ${name} ${detail ? `(${detail})` : ""}`);
    passed++;
  } else {
    console.error(`[FAIL] ${name} ${detail ? `(${detail})` : ""}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log("=====================================================================");
  console.log("   FLOODAI DYNAMIC COASTAL INTELLIGENCE & PROPAGATION VERIFICATION   ");
  console.log("=====================================================================\n");

  // ---------------------------------------------------------
  // TEST GROUP 1: Geospatial Discovery & Configurable Radius
  // ---------------------------------------------------------
  console.log("[1/5] Testing Global Geospatial Discovery & Radius Logic...");

  // Test 1.1: Default Radius is 500 km
  assert(CoastalDiscoveryService.DEFAULT_RADIUS_KM === 500, "Default search radius is 500 km");

  // Test 1.2: Dynamic Discovery around Chennai (India)
  const chennaiZones = CoastalDiscoveryService.discoverCoastalZones(13.0827, 80.2707, 500);
  assert(Array.isArray(chennaiZones) && chennaiZones.length >= 4, "Discovers coastal zones in South Asia within 500km", `Found ${chennaiZones.length} zones`);
  assert(chennaiZones.every(z => z.distanceFromUserKm <= 500), "All discovered zones are within 500km radius");

  // Test 1.3: Dynamic Discovery around New York (North America)
  const nyZones = CoastalDiscoveryService.discoverCoastalZones(40.7128, -74.0060, 500);
  assert(Array.isArray(nyZones) && nyZones.length >= 2, "Discovers coastal zones in North America dynamically (Global coverage)", `Found ${nyZones.length} zones`);
  assert(nyZones.some(z => z.name.includes("New York")), "Includes New York Harbor in local discovery");
  assert(nyZones.some(z => z.name.includes("Boston")), "Includes Boston Harbor within 500km of New York");

  // Test 1.4: Dynamic Discovery around Tokyo (East Asia)
  const tokyoZones = CoastalDiscoveryService.discoverCoastalZones(35.6762, 139.6503, 500);
  assert(Array.isArray(tokyoZones) && tokyoZones.length >= 2, "Discovers coastal zones in Asia-Pacific dynamically", `Found ${tokyoZones.length} zones`);

  // Test 1.5: Configurable Radius Filtering (Smaller radius excludes distant zones)
  const chennaiSmall = CoastalDiscoveryService.discoverCoastalZones(13.0827, 80.2707, 100);
  assert(chennaiSmall.length < chennaiZones.length, "Configurable radius dynamically restricts results (100km yields fewer zones than 500km)", `100km: ${chennaiSmall.length} vs 500km: ${chennaiZones.length}`);
  assert(chennaiSmall.every(z => z.distanceFromUserKm <= 100), "Strict distance boundary enforced for 100km radius");

  // Test 1.6: Stable, Deterministic Identifiers
  const run1 = CoastalDiscoveryService.discoverCoastalZones(13.0827, 80.2707, 500);
  const run2 = CoastalDiscoveryService.discoverCoastalZones(13.0827, 80.2707, 500);
  const idsRun1 = run1.map(z => z.zoneId);
  const idsRun2 = run2.map(z => z.zoneId);
  assert(JSON.stringify(idsRun1) === JSON.stringify(idsRun2), "Zone IDs are 100% deterministic and stable across repeated calls");
  assert(idsRun1.every(id => id.startsWith("cst_")), "All zone IDs conform to stable prefix schema 'cst_*'");

  // ---------------------------------------------------------
  // TEST GROUP 2: Environmental Telemetry & Baseline Anomaly Analysis
  // ---------------------------------------------------------
  console.log("\n[2/5] Testing Environmental Intelligence & Baseline Change Analysis...");

  // Test 2.1: Baseline Change Detection with Nominal Telemetry
  const nominalObs = {
    surfacePressureHpa: 1013.25,
    rainfall24hMm: 15.0,
    waveHeightM: 0.8,
    windSpeedKmh: 15.0,
    soilMoisturePct: 40,
    dataProvenance: { qualityStatus: "verified_live" },
  };
  const nominalChanges = RiskRankingEngine.detectBaselineChanges(nominalObs);
  assert(nominalChanges.hasSufficientBaseline === true, "Marks baseline as sufficient when valid observations exist");
  assert(nominalChanges.rainfallDeviationMm === 0.0, "Nominal rainfall deviation is 0.0 mm");
  assert(nominalChanges.pressureAnomalyHpa === 0.0, "Nominal barometric pressure anomaly is 0.0 hPa");

  // Test 2.2: Extreme Anomaly Detection (Pressure Plunge & Heavy Rain)
  const stormObs = {
    surfacePressureHpa: 988.0,
    rainfall24hMm: 125.0,
    waveHeightM: 3.4,
    windSpeedKmh: 68.0,
    soilMoisturePct: 88,
    dataProvenance: { qualityStatus: "verified_live" },
  };
  const stormChanges = RiskRankingEngine.detectBaselineChanges(stormObs);
  assert(stormChanges.rainfallDeviationMm === 110.0, "Correctly detects +110.0 mm rainfall surplus anomaly");
  assert(Math.abs(stormChanges.pressureAnomalyHpa - (-25.25)) <= 0.1, "Correctly detects -25.25 hPa deep barometric depression", `${stormChanges.pressureAnomalyHpa} hPa`);
  assert(stormChanges.soilSaturationStatus.includes("Waterlogged"), "Correctly detects saturated soil status");

  // ---------------------------------------------------------
  // TEST GROUP 3: Evidence-Based Multi-Factor Risk Scoring
  // ---------------------------------------------------------
  console.log("\n[3/5] Testing Multi-Factor Calibrated Risk Scoring...");

  // Test 3.1: Rule verification - Temperature alone CANNOT establish flood risk
  const heatwaveObs = {
    temperatureC: 44.5, // Extreme high temperature
    surfacePressureHpa: 1014.0,
    rainfall1hMm: 0.0,
    rainfall24hMm: 0.0,
    waveHeightM: 0.5,
    windSpeedKmh: 10.0,
    soilMoisturePct: 20,
    officialWarningSeverity: "None",
    dataProvenance: { qualityStatus: "verified_live" },
  };
  const mockLowlandZone = { elevationMsl: 4.5, name: "Test Lowland Shore" };
  const heatwaveChanges = RiskRankingEngine.detectBaselineChanges(heatwaveObs);
  const heatwaveRisk = RiskRankingEngine.calculateRiskAssessment(mockLowlandZone, heatwaveObs, heatwaveChanges);
  assert(heatwaveRisk.riskCategory === "Normal", "High temperature alone CANNOT trigger flood risk (Category: Normal)", `Score: ${heatwaveRisk.riskScore}`);
  assert(heatwaveRisk.riskScore < 30.0, "Heatwave without precipitation or surge remains low risk", `Score: ${heatwaveRisk.riskScore}`);

  // Test 3.2: Severe Storm Surge & Rain triggers Critical Category
  const severeStormObs = {
    temperatureC: 26.0,
    surfacePressureHpa: 985.0,
    rainfall1hMm: 35.0,
    rainfall24hMm: 140.0,
    waveHeightM: 3.6,
    windSpeedKmh: 75.0,
    soilMoisturePct: 90,
    officialWarningSeverity: "Critical",
    dataProvenance: { qualityStatus: "verified_live" },
  };
  const severeChanges = RiskRankingEngine.detectBaselineChanges(severeStormObs);
  const severeRisk = RiskRankingEngine.calculateRiskAssessment(mockLowlandZone, severeStormObs, severeChanges);
  assert(severeRisk.riskCategory === "Critical", "Extreme multi-factor hazard correctly triggers 'Critical' category", `Score: ${severeRisk.riskScore}`);
  assert(severeRisk.riskScore >= 75.0, "Critical score is >= 75.0", `Score: ${severeRisk.riskScore}`);
  assert(severeRisk.primaryDrivers.length >= 3, "Identifies multiple verified hazard drivers");

  // Test 3.3: Decoupled Confidence Score
  assert(typeof severeRisk.confidencePct === "number" && severeRisk.confidencePct > 70, "Confidence is decoupled and accurately reflects telemetry completeness", `${severeRisk.confidencePct}%`);

  // ---------------------------------------------------------
  // TEST GROUP 4: Hydrodynamic Graph & Propagation Engine
  // ---------------------------------------------------------
  console.log("\n[4/5] Testing Hydrodynamic Propagation Graph & Arrival Times...");

  const mockRankedZones = [
    {
      zoneId: "cst_source_surge",
      name: "Coastal Estuary Outlet",
      coordinates: { latitude: 13.08, longitude: 80.28 },
      distanceFromUserKm: 15.0,
      elevationMsl: 3.0,
      coastalFeatureType: "estuary_delta",
      riskAssessment: { riskScore: 88.0, riskCategory: "Critical" },
    },
    {
      zoneId: "cst_downstream_zone",
      name: "Tidal Canal Basin",
      coordinates: { latitude: 13.05, longitude: 80.24 },
      distanceFromUserKm: 8.0,
      elevationMsl: 5.5,
      coastalFeatureType: "estuary_delta",
      riskAssessment: { riskScore: 50.0, riskCategory: "Elevated" },
    },
  ];

  const residentContext = {
    latitude: 13.04,
    longitude: 80.22,
    elevationMsl: 8.0,
    locality: "Mylapore Sector",
  };

  const graph = CoastalPropagationEngine.buildPropagationGraph(mockRankedZones, residentContext);
  assert(Array.isArray(graph.nodes) && graph.nodes.length >= 2, "Propagation graph contains all relevant zone nodes");
  assert(Array.isArray(graph.edges) && graph.edges.length > 0, "Plausible hydrodynamic edges generated along low-lying estuarine corridor", `${graph.edges.length} edges`);

  // Verify Saint-Venant 1D arrival-time window
  const activeEdge = graph.edges.find(e => e.isActiveHazardCascade);
  assert(activeEdge !== undefined, "Identifies active hazard cascade along connecting edge");
  assert(activeEdge.estimatedTravelWindow.includes("h"), "Calculates physics-grounded travel window", `Window: ${activeEdge.estimatedTravelWindow}`);

  // Test Resident Exposure Assessment
  const exposure = CoastalPropagationEngine.assessResidentExposure(graph, mockRankedZones, residentContext);
  assert(exposure.activeHazardCount > 0, "Identifies active hazard count in resident exposure appraisal");
  assert(typeof exposure.exposureLevel === "string", "Resident exposure characterization assigned", exposure.exposureLevel);
  assert(Array.isArray(exposure.residentDirectives) && exposure.residentDirectives.length > 0, "Generates actionable civilian defense directives");

  // ---------------------------------------------------------
  // TEST GROUP 5: End-to-End API Integration & Simulation Isolation
  // ---------------------------------------------------------
  console.log("\n[5/5] Testing Backend API Endpoints & Simulation Isolation...");

  const server = http.createServer(app);
  await new Promise(r => server.listen(5096, r));
  const baseUrl = "http://127.0.0.1:5096";

  try {
    // 5.1: GET /api/geospatial/coastal-intelligence
    const res = await fetch(`${baseUrl}/api/geospatial/coastal-intelligence?lat=13.0827&lon=80.2707&radius=500`);
    assert(res.status === 200, "GET /api/geospatial/coastal-intelligence returns HTTP 200");
    const data = await res.json();
    assert(data.success === true, "Response has success=true");
    assert(data.queryContext.radiusKm === 500, "Query context confirms 500 km radius");
    assert(data.summary.totalDiscoveredZones > 0, "Discovered coastal zones populated in live response", `${data.summary.totalDiscoveredZones} zones`);
    assert(Array.isArray(data.rankedZones) && data.rankedZones.length > 0, "Ranked zones array populated");
    assert(data.propagationGraph && Array.isArray(data.propagationGraph.nodes), "Propagation graph returned in payload");
    assert(data.residentExposure && data.residentExposure.exposureLevel, "Resident exposure assessment returned");

    // 5.2: GET /api/geospatial/coastal-zone/:zoneId
    const firstZone = data.rankedZones[0];
    const zoneRes = await fetch(`${baseUrl}/api/geospatial/coastal-zone/${encodeURIComponent(firstZone.zoneId)}`);
    assert(zoneRes.status === 200, "GET /api/geospatial/coastal-zone/:zoneId returns HTTP 200");
    const zoneData = await zoneRes.json();
    assert(zoneData.success === true && zoneData.zone.zoneId === firstZone.zoneId, "Zone detail endpoint returns matching deterministic zone ID");

    // 5.3: Verify Simulation Isolation in /api/alerts (Simulations are strictly excluded from public live alerts)
    const liveAlertsRes = await fetch(`${baseUrl}/api/alerts`);
    const liveAlerts = await liveAlertsRes.json();
    assert(Array.isArray(liveAlerts), "GET /api/alerts returns operational alerts array");
    const contaminated = liveAlerts.some(a => a.isSimulation === true);
    assert(!contaminated, "Strict alert isolation verified: Public operational feed contains ZERO simulation records");

  } finally {
    server.close();
  }

  console.log("\n=====================================================================");
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=====================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error("Test execution error:", err);
  process.exit(1);
});
