/**
 * backend/models/SimulationRun.js
 * Tracks authorized resident alert simulations and test runs.
 * Explicitly isolated from live disaster records and public operational dashboards.
 */

const mongoose = require("mongoose");

const SimulationRunSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    scenario: {
      type: String,
      enum: [
        "heavy_rainfall",
        "rising_water_level",
        "coastal_inundation",
        "official_warning",
        "coastal_surge",
        "cloudburst",
        "dam_spillway",
        "live_telemetry",
        "flood_propagation",
        "resident_exposure",
        "rainfall_escalation",
        "water_level_rise"
      ],
      required: true,
    },
    severity: {
      type: String,
      enum: ["Advisory", "Watch", "Warning", "Critical"],
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    probabilityPct: {
      type: Number,
      default: 75.0,
    },
    testMessage: {
      type: String,
      default: "",
    },
    directives: {
      type: [String],
      default: [],
    },
    channelsRequested: {
      type: [String],
      default: ["siren", "fcm", "email", "sms"],
    },
    channelsDispatched: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isSimulation: {
      type: Boolean,
      default: true,
      immutable: true,
      index: true,
    },
    acknowledged: {
      type: Boolean,
      default: false,
    },
    acknowledgedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SimulationRun", SimulationRunSchema);
