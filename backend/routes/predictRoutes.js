/**
 * predictRoutes.js
 * Endpoints for running ML inference, SHAP explanations, and model comparison.
 */

const express = require("express");
const router = express.Router();
const axios = require("axios");
const Prediction = require("../models/Prediction");
const { optionalToken } = require("../middleware/authMiddleware");

const ML_API_URL = process.env.ML_API_URL || "http://localhost:8000";
const INTERNAL_SERVICE_KEY =
  process.env.INTERNAL_SERVICE_SECRET ||
  process.env.INTERNAL_SERVICE_KEY ||
  "f9a8c7b6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8";

// POST /api/predict -> forwards to ML microservice with SHAP & engine selection
router.post("/", optionalToken, async (req, res) => {
  try {
    const { location, latitude, longitude, engine, ...features } = req.body;

    const mlResponse = await axios.post(
      `${ML_API_URL}/predict`,
      {
        ...features,
        engine: engine || "xgboost",
      },
      {
        headers: {
          "X-Internal-Service-Key": INTERNAL_SERVICE_KEY,
          "Internal-Service-Key": INTERNAL_SERVICE_KEY,
        },
        timeout: 8000,
      }
    );

    const result = mlResponse.data;

    let saved = null;
    try {
      saved = await Prediction.create({
        userId: req.user?._id || null,
        location: location || "Manual Input Coordinates",
        latitude: latitude || null,
        longitude: longitude || null,
        inputs: features,
        flood_probability_pct: result.flood_probability_pct,
        risk_level: result.risk_level,
        model_confidence_pct: result.model_confidence_pct,
        engine: result.engine,
        shap_explanation: result.shap_explanation,
      });
    } catch (dbErr) {
      console.warn("[Predict:Mongo:Warn] Could not persist prediction to DB:", dbErr.message);
    }

    res.json({
      ...(saved ? saved.toObject() : {}),
      ...result,
      id: saved?._id || `temp_${Date.now()}`,
    });
  } catch (err) {
    console.error("[Predict:Error]", err.message);
    res.status(500).json({ error: "Prediction failed", detail: err.response?.data || err.message });
  }
});

// POST /api/predict/explain -> SHAP explainability breakdown
router.post("/explain", async (req, res) => {
  try {
    const mlResponse = await axios.post(`${ML_API_URL}/explain`, req.body, {
      headers: {
        "X-Internal-Service-Key": INTERNAL_SERVICE_KEY,
        "Internal-Service-Key": INTERNAL_SERVICE_KEY,
      },
      timeout: 6000,
    });
    res.json(mlResponse.data);
  } catch (err) {
    res.status(500).json({ error: "Explainability computation failed", detail: err.message });
  }
});

// GET /api/predict/comparison -> Random Forest vs XGBoost metrics
router.get("/comparison", async (req, res) => {
  try {
    const mlResponse = await axios.get(`${ML_API_URL}/models/comparison`, {
      headers: {
        "X-Internal-Service-Key": INTERNAL_SERVICE_KEY,
        "Internal-Service-Key": INTERNAL_SERVICE_KEY,
      },
      timeout: 5000,
    });
    res.json(mlResponse.data);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch model comparison", detail: err.message });
  }
});

// GET /api/predict/history -> Past predictions with strict user isolation
router.get("/history", optionalToken, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required to view prediction history" });
    }
    const query = req.user.role === "admin" ? {} : { userId: req.user._id };
    const history = await Prediction.find(query).sort({ createdAt: -1 }).limit(50);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch history", detail: err.message });
  }
});

module.exports = router;
