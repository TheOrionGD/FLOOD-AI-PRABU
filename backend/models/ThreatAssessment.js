const mongoose = require("mongoose");

const ThreatAssessmentSchema = new mongoose.Schema({
  district: {
    type: String,
    required: true,
    index: true,
  },
  state: {
    type: String,
    required: true,
  },
  latitude: Number,
  longitude: Number,
  floodProbabilityPct: {
    type: Number,
    required: true,
  },
  riskLevel: {
    type: String,
    enum: ["Low", "Medium", "High", "Very High"],
    required: true,
  },
  confidencePct: Number,
  primaryDrivers: [String],
  meteorology: {
    rainfall_mm: Number,
    river_level_m: Number,
    soil_moisture_pct: Number,
    cyclone: Boolean,
    temperature_c: Number,
    wind_speed_kmh: Number,
  },
  aiThreatIntel: {
    threat_title: String,
    threat_summary: String,
    civil_defense_status: String,
    vulnerability_analysis: String,
    civilian_directives: [String],
    infrastructure_guidance: mongoose.Schema.Types.Mixed,
    source_ai_model: String,
  },
  active: {
    type: Boolean,
    default: true,
    index: true,
  },
  assessedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model("ThreatAssessment", ThreatAssessmentSchema);
