const mongoose = require("mongoose");

const FloodRecordSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  district: { type: String, required: true },
  state: { type: String, required: true },
  latitude: Number,
  longitude: Number,
  rainfall_mm: Number,
  river_level_m: Number,
  sea_level_m: Number,
  temperature_c: Number,
  humidity_pct: Number,
  wind_speed_kmh: Number,
  soil_moisture_pct: Number,
  reservoir_level_pct: Number,
  elevation_m: Number,
  distance_from_coast_km: Number,
  population_density: Number,
  forest_cover_pct: Number,
  cyclone: { type: Boolean, default: false },
  drainage_score: Number,
  flood_occurred: { type: Boolean, default: false },
  flood_severity: { type: String, enum: ["Low", "Medium", "High", "Very High"] },
  damage_cost_inr: Number,
  affected_population: Number,
  deaths: Number,
  rescue_time_hrs: Number,
  flood_probability_pct: Number,
}, { timestamps: true });

module.exports = mongoose.model("FloodRecord", FloodRecordSchema);
