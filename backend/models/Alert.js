const mongoose = require("mongoose");

const AlertSchema = new mongoose.Schema({
  location: String,
  level: { type: String, enum: ["Green", "Yellow", "Orange", "Red"], default: "Green" },
  message: String,
  active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("Alert", AlertSchema);
