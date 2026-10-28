const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    enum: ["user", "analyst", "admin"],
    default: "user",
  },
  googleId: {
    type: String,
    default: null,
  },
  authProvider: {
    type: String,
    enum: ["local", "google"],
    default: "local",
  },
  phone: {
    type: String,
    trim: true,
    default: null,
  },
  phoneVerified: {
    type: Boolean,
    default: false,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  phoneOtp: {
    code: String,
    expiresAt: Date,
  },
  fcmTokens: [
    {
      token: { type: String, required: true },
      deviceType: { type: String, default: "web" },
      userAgent: { type: String, default: "" },
      lastSeenAt: { type: Date, default: Date.now },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  preferences: {
    alertRadiusKm: { type: Number, default: 50 },
    severityThreshold: {
      type: String,
      enum: ["Low", "Medium", "High", "Very High"],
      default: "Medium",
    },
    channels: {
      fcm: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
    },
    savedLocations: [
      {
        name: String,
        latitude: Number,
        longitude: Number,
        district: String,
      },
    ],
    subscribedDistricts: {
      type: [String],
      default: ["Chennai", "Mumbai", "Kolkata", "Guwahati", "Kochi"],
    },
  },
  lastLoginAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

// Prevent duplicate tokens in the user's array
UserSchema.methods.addFcmToken = function (token, userAgent = "") {
  this.fcmTokens = this.fcmTokens.filter((t) => t.token !== token);
  this.fcmTokens.push({
    token,
    deviceType: "web",
    userAgent,
    lastSeenAt: new Date(),
    createdAt: new Date(),
  });
  return this.save();
};

UserSchema.methods.removeFcmToken = function (token) {
  this.fcmTokens = this.fcmTokens.filter((t) => t.token !== token);
  return this.save();
};

module.exports = mongoose.model("User", UserSchema);
