const mongoose = require("mongoose");

const AlertSchema = new mongoose.Schema({
  location: String,
  level: { type: String, enum: ["Green", "Yellow", "Orange", "Red"], default: "Green" },
  message: String,
  active: { type: Boolean, default: true },
  isSimulation: { type: Boolean, default: false, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

module.exports = mongoose.model("Alert", AlertSchema);
