const mongoose = require("mongoose");

const PredictionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  location: String,
  latitude: Number,
  longitude: Number,
  inputs: { type: Object },
  flood_probability_pct: Number,
  risk_level: { type: String, enum: ["Low", "Medium", "High", "Very High"] },
  model_confidence_pct: Number,
  engine: { type: String, default: "XGBoost Classifier" },
  shap_explanation: { type: Object, default: null },
}, { timestamps: true });

module.exports = mongoose.model("Prediction", PredictionSchema);
