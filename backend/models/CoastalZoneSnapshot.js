/**
 * backend/models/CoastalZoneSnapshot.js
 * Persists dynamically discovered coastal monitoring zones, real-time observations,
 * evidence-based risk scores, and propagation graph relationships.
 */

const mongoose = require("mongoose");

const CoastalZoneSnapshotSchema = new mongoose.Schema(
  {
    zoneId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    region: String,
    country: String,
    coordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    distanceFromUserKm: Number,
    elevationMsl: Number,
    coastalFeatureType: {
      type: String,
      enum: ["estuary_delta", "tidal_bay", "river_mouth", "barrier_island", "coastal_lagoon", "port_basin", "open_coast"],
      default: "open_coast",
    },
    drainageBasin: String,
    observations: {
      temperatureC: Number,
      surfacePressureHpa: Number,
      humidityPct: Number,
      windSpeedKmh: Number,
      windGustKmh: Number,
      windBearingDeg: Number,
      rainfall1hMm: Number,
      rainfall24hMm: Number,
      waveHeightM: Number,
      swellHeightM: Number,
      soilMoisturePct: Number,
      weatherDescription: String,
      weatherIcon: String,
      officialWarningSeverity: {
        type: String,
        enum: ["None", "Advisory", "Watch", "Warning", "Critical"],
        default: "None",
      },
    },
    baselineChanges: {
      rainfallDeviationMm: Number,
      pressureAnomalyHpa: Number,
      waveHeightAnomalyM: Number,
      windSpeedAnomalyKmh: Number,
      soilSaturationStatus: String,
      hasSufficientBaseline: { type: Boolean, default: true },
    },
    riskAssessment: {
      riskScore: { type: Number, required: true, min: 0, max: 100 },
      riskCategory: {
        type: String,
        enum: ["Normal", "Elevated", "High", "Critical"],
        required: true,
      },
      confidencePct: { type: Number, min: 0, max: 100 },
      primaryDrivers: [String],
      civilianDirectives: [String],
      recommendedNextAction: String,
    },
    propagationContext: {
      originatingHazard: { type: Boolean, default: false },
      connectedZoneIds: [String],
      pathwayType: String,
      estimatedArrivalWindow: String,
      propagationLimitations: String,
    },
    dataProvenance: {
      weatherProvider: String,
      marineProvider: String,
      elevationProvider: String,
      geometrySource: String,
      qualityStatus: {
        type: String,
        enum: ["verified_live", "cached_live", "fallback_telemetry", "insufficient"],
        default: "verified_live",
      },
      observedAt: Date,
      retrievedAt: { type: Date, default: Date.now },
    },
    searchQueryContext: {
      centerLat: Number,
      centerLon: Number,
      radiusKm: Number,
    },
  },
  { timestamps: true }
);

CoastalZoneSnapshotSchema.index({ "coordinates.latitude": 1, "coordinates.longitude": 1 });
CoastalZoneSnapshotSchema.index({ createdAt: -1 });

module.exports = mongoose.model("CoastalZoneSnapshot", CoastalZoneSnapshotSchema);
