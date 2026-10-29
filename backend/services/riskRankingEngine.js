/**
 * backend/services/riskRankingEngine.js
 * Environmental Change Detection and Evidence-Based Flood Risk Ranking Engine.
 *
 * Implements:
 * 1. Physical baseline change analysis (Rainfall deviation, pressure drops, wave surge anomalies, soil saturation)
 * 2. Documented, calibrated multi-criteria scoring method:
 *    - Official Warning Severity (30%)
 *    - Rainfall Intensity & 24h Accumulation (25%)
 *    - Coastal Wave Swell & Storm Surge (20%)
 *    - Topographic Elevation Vulnerability (15%)
 *    - Soil Moisture Saturation (10%)
 * 3. Strict decoupling of Hazard Risk Score from Prediction Confidence
 * 4. Priority-ranked zone hierarchy with contextual civil defense directives
 */

const RiskRankingEngine = {
  // Configurable baseline constants
  BASELINES: {
    STANDARD_PRESSURE_HPA: 1013.25,
    STANDARD_24H_RAIN_MM: 15.0,
    STANDARD_WAVE_HEIGHT_M: 0.8,
    STANDARD_WIND_SPEED_KMH: 15.0,
    SOIL_SATURATION_CRITICAL_PCT: 80.0,
  },

  /**
   * Evaluates environmental change from validated baselines for a monitoring zone.
   * @param {object} obs Environmental observations
   * @returns {object} Baseline deviation metrics
   */
  detectBaselineChanges(obs = {}) {
    if (!obs || obs.dataProvenance?.qualityStatus === "insufficient") {
      return {
        hasSufficientBaseline: false,
        rainfallDeviationMm: 0.0,
        pressureAnomalyHpa: 0.0,
        waveHeightAnomalyM: 0.0,
        windSpeedAnomalyKmh: 0.0,
        soilSaturationStatus: "Insufficient Baseline Telemetry",
        rateOfChangeNotice: "Baseline observations insufficient for longitudinal change rate analysis.",
      };
    }

    const rain24h = typeof obs.rainfall24hMm === "number" ? obs.rainfall24hMm : (obs.rainfall1hMm || 0) * 3;
    const rainDev = Math.round((rain24h - this.BASELINES.STANDARD_24H_RAIN_MM) * 10) / 10;

    const pressure = typeof obs.surfacePressureHpa === "number" ? obs.surfacePressureHpa : 1013.25;
    const pressDev = Math.round((pressure - this.BASELINES.STANDARD_PRESSURE_HPA) * 10) / 10;

    const wave = typeof obs.waveHeightM === "number" ? obs.waveHeightM : 0.8;
    const waveDev = Math.round((wave - this.BASELINES.STANDARD_WAVE_HEIGHT_M) * 10) / 10;

    const wind = typeof obs.windSpeedKmh === "number" ? obs.windSpeedKmh : 15.0;
    const windDev = Math.round((wind - this.BASELINES.STANDARD_WIND_SPEED_KMH) * 10) / 10;

    const sm = typeof obs.soilMoisturePct === "number" ? obs.soilMoisturePct : 45;
    let soilStatus = "Normal Absorption Capacity";
    if (sm >= 80) {
      soilStatus = "Waterlogged / Near 100% Runoff Potential";
    } else if (sm >= 65) {
      soilStatus = "High Saturation (Reduced Permeability)";
    } else if (sm >= 50) {
      soilStatus = "Moderate Soil Moisture Absorption";
    }

    return {
      hasSufficientBaseline: true,
      rainfallDeviationMm: rainDev,
      pressureAnomalyHpa: pressDev,
      waveHeightAnomalyM: waveDev,
      windSpeedAnomalyKmh: windDev,
      soilSaturationStatus: soilStatus,
      rateOfChangeNotice: pressDev < -10
        ? "Rapid barometric pressure plunge: steep convective or cyclonic squall formation."
        : (rainDev > 40 ? "Substantial 24h precipitation surplus exceeding basin infiltration capacity." : "Within typical regional seasonal variations."),
    };
  },

  /**
   * Calculates evidence-based flood risk score (0-100) using normalized physical factors.
   *
   * Formula:
   * RiskScore = WarningScore(0-30) + RainfallScore(0-25) + SurgeScore(0-20) + ElevationScore(0-15) + SoilMoistureScore(0-10)
   *
   * @param {object} zone Discovered zone with coordinates and elevation
   * @param {object} obs Environmental observations
   * @param {object} changes Baseline deviations
   * @returns {object} Calculated risk score, category, confidence, and directives
   */
  calculateRiskAssessment(zone, obs = {}, changes = {}) {
    // 1. Official Warning Factor (0 to 30 points)
    const warningSev = obs.officialWarningSeverity || "None";
    let warningScore = 0;
    if (warningSev === "Critical") warningScore = 30;
    else if (warningSev === "Warning") warningScore = 20;
    else if (warningSev === "Watch") warningScore = 12;
    else if (warningSev === "Advisory") warningScore = 6;

    // 2. Rainfall Intensity & Accumulation Factor (0 to 25 points)
    const rain1h = typeof obs.rainfall1hMm === "number" ? obs.rainfall1hMm : 0;
    const rain24h = typeof obs.rainfall24hMm === "number" ? obs.rainfall24hMm : rain1h * 3;
    // 1h rain weighted heavily for flash flood + 24h for catchment saturation
    const rawRainScore = (rain1h * 1.8) + (rain24h * 0.12);
    const rainfallScore = Math.min(25, Math.max(0, Math.round(rawRainScore * 10) / 10));

    // 3. Coastal Wave Swell & Storm Surge Factor (0 to 20 points)
    const wave = typeof obs.waveHeightM === "number" ? obs.waveHeightM : 0.8;
    const wind = typeof obs.windSpeedKmh === "number" ? obs.windSpeedKmh : 15;
    const isCyclonic = wind > 55 || (obs.surfacePressureHpa && obs.surfacePressureHpa < 1000);
    const rawSurgeScore = ((wave - 0.5) * 3.8) + (isCyclonic ? 7.5 : (wind > 35 ? 3.0 : 0));
    const surgeScore = Math.min(20, Math.max(0, Math.round(rawSurgeScore * 10) / 10));

    // 4. Topographic Elevation Vulnerability (0 to 15 points)
    const elev = typeof zone.elevationMsl === "number" ? zone.elevationMsl : 12.0;
    let elevationScore = 0;
    if (elev < 3.0) elevationScore = 15;
    else if (elev < 6.0) elevationScore = 12;
    else if (elev < 10.0) elevationScore = 9;
    else if (elev < 18.0) elevationScore = 5;
    else if (elev < 30.0) elevationScore = 2;
    else elevationScore = 0;

    // 5. Soil Moisture Saturation Factor (0 to 10 points)
    const sm = typeof obs.soilMoisturePct === "number" ? obs.soilMoisturePct : 45;
    let soilScore = 0;
    if (sm >= 80) soilScore = 10;
    else if (sm >= 65) soilScore = 7;
    else if (sm >= 50) soilScore = 4;
    else soilScore = 1;

    // Combine normalized scores (Sum: 0 to 100)
    const totalScore = Math.min(99.5, Math.max(5.0, Math.round((warningScore + rainfallScore + surgeScore + elevationScore + soilScore) * 10) / 10));

    // Determine Risk Category
    let riskCategory = "Normal";
    if (totalScore >= 75.0) {
      riskCategory = "Critical";
    } else if (totalScore >= 55.0) {
      riskCategory = "High";
    } else if (totalScore >= 30.0) {
      riskCategory = "Elevated";
    }

    // Prediction Confidence Calculation (Explicitly decoupled from hazard score)
    let confidence = 85.0;
    const qStatus = obs.dataProvenance?.qualityStatus || "verified_live";
    if (qStatus === "verified_live") confidence += 10.0;
    else if (qStatus === "cached_live") confidence += 5.0;
    else if (qStatus === "insufficient") confidence -= 30.0;
    if (changes.hasSufficientBaseline) confidence += 4.0;
    const confidencePct = Math.min(98.0, Math.max(45.0, Math.round(confidence * 10) / 10));

    // Compile Primary Drivers
    const drivers = [];
    if (warningScore >= 12) drivers.push(`Official Disaster Authority ${warningSev} Warning`);
    if (rainfallScore >= 12) drivers.push(`Intense Precipitation (${rain1h} mm/h, ${rain24h} mm/24h)`);
    if (surgeScore >= 10) drivers.push(`Coastal Wave Swell (${wave}m MSL with ${wind} km/h onshore wind)`);
    if (elevationScore >= 9) drivers.push(`Low-Lying Coastal Plain (${elev.toFixed(1)}m MSL elevation)`);
    if (soilScore >= 7) drivers.push(`High Soil Waterlogging (${sm}% saturation)`);
    if (drivers.length === 0) drivers.push("Baseline hydrometric conditions within nominal limits");

    // Formulate Contextual Directives & Next Action
    const directives = [];
    let nextAction = "Continue standard automated meteorological surveillance.";

    if (riskCategory === "Critical") {
      directives.push("Tier-1 Civil Defense Alert: Immediate vertical evacuation for low-lying coastal tracts.");
      directives.push("Avoid all shoreline highways, estuaries, and river causeways.");
      directives.push("Disconnect ground-level electrical breakers and secure drinking water supply.");
      nextAction = "Activate emergency notification broadcast and prepare emergency refuge centers.";
    } else if (riskCategory === "High") {
      directives.push("Tier-2 Precautionary Advisory: Relocate valuables and essential supplies above 1.5 meters.");
      directives.push("Monitor tidal lock gates; localized storm sewer backwater pooling expected.");
      directives.push("Clear surface drainage conduits and secure rooftop stormwater drains.");
      nextAction = "Inspect local sluice-gates and notify neighborhood civil defense coordinators.";
    } else if (riskCategory === "Elevated") {
      directives.push("Hydrological Watch Active: Verify that push alerts and mobile sirens remain unmuted.");
      directives.push("Exercise caution along tidal creeks during astronomical high tide crests.");
      nextAction = "Monitor incoming precipitation bands and check drainage pump stations.";
    } else {
      directives.push("Hydrometric and oceanic parameters stable. Drainage channels flowing freely.");
      directives.push("Standard multi-channel civil defense listener active.");
      nextAction = "Standard scheduled multi-basin polling every 10 minutes.";
    }

    return {
      riskScore: totalScore,
      riskCategory,
      confidencePct,
      scoreBreakdown: {
        warningComponent: warningScore,
        rainfallComponent: rainfallScore,
        surgeComponent: surgeScore,
        elevationComponent: elevationScore,
        soilComponent: soilScore,
      },
      primaryDrivers: drivers,
      civilianDirectives: directives,
      recommendedNextAction: nextAction,
    };
  },

  /**
   * Processes a list of enriched zones: computes baseline changes, evaluates risk,
   * and ranks from highest risk to lowest priority.
   *
   * @param {Array<object>} zones Enriched coastal zones
   * @returns {Array<object>} Ranked coastal zones
   */
  rankCoastalZones(zones = []) {
    const assessed = zones.map((zone) => {
      const changes = this.detectBaselineChanges(zone.observations);
      const assessment = this.calculateRiskAssessment(zone, zone.observations, changes);

      return {
        ...zone,
        baselineChanges: changes,
        riskAssessment: assessment,
      };
    });

    // Rank from highest risk score to lowest
    assessed.sort((a, b) => {
      // Primary: Risk Score descending
      if (b.riskAssessment.riskScore !== a.riskAssessment.riskScore) {
        return b.riskAssessment.riskScore - a.riskAssessment.riskScore;
      }
      // Secondary: Distance ascending
      return a.distanceFromUserKm - b.distanceFromUserKm;
    });

    return assessed;
  },
};

module.exports = RiskRankingEngine;
