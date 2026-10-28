const mongoose = require("mongoose");

const AlertDispatchSchema = new mongoose.Schema({
  alertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Alert",
  },
  district: {
    type: String,
    required: true,
  },
  severity: {
    type: String,
    enum: ["Low", "Medium", "High", "Very High"],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  dedupKey: {
    type: String,
    required: true,
    index: true,
  },
  channel: {
    type: String,
    enum: ["fcm", "email", "sms", "broadcast"],
    required: true,
  },
  recipient: {
    type: String, // email, phone, fcm token or 'broadcast:all'
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  status: {
    type: String,
    enum: ["queued", "sent", "delivered", "failed"],
    default: "queued",
  },
  providerResponse: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  errorDetail: {
    type: String,
    default: null,
  },
  dispatchedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model("AlertDispatch", AlertDispatchSchema);
