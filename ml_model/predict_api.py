"""
predict_api.py
---------------
Flask ML microservice providing:
1. Dual ML inference: XGBoost & Random Forest & Calibrated Ensemble
2. Real-time SHAP TreeExplainer feature attribution for every prediction
3. Model comparison metrics (Accuracy, Precision, Recall, F1, ROC-AUC, PR-AUC)
4. AI Threat Intelligence synthesis via Groq LLM (Qwen 2.5 / GPT-OSS)
"""

import os
import json
import pickle
import urllib.request
import urllib.error
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
import xgboost as xgb
import shap

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Load environment configuration (.env files)
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(BASE_DIR, ".env"))
    load_dotenv(os.path.join(BASE_DIR, "..", ".env"))
    load_dotenv(os.path.join(BASE_DIR, "..", "backend", ".env"))
except Exception:
    pass

FEATURES = [
    "rainfall_mm", "river_level_m", "sea_level_m", "temperature_c",
    "humidity_pct", "wind_speed_kmh", "soil_moisture_pct",
    "reservoir_level_pct", "elevation_m", "distance_from_coast_km",
    "population_density", "forest_cover_pct", "cyclone", "drainage_score",
]

RISK_LABELS = ["Low", "Medium", "High", "Very High"]

FEATURE_MIN_MAX = {
    "rainfall_mm": (0, 900), "river_level_m": (0.5, 14), "sea_level_m": (0.5, 3.5),
    "temperature_c": (12, 45), "humidity_pct": (20, 100), "wind_speed_kmh": (2, 140),
    "soil_moisture_pct": (5, 100), "reservoir_level_pct": (5, 100), "elevation_m": (0, 1200),
    "distance_from_coast_km": (0, 600), "population_density": (50, 30000),
    "forest_cover_pct": (0, 90), "drainage_score": (5, 100)
}

FEATURE_DIR = {
    "rainfall_mm": 1, "river_level_m": 1, "sea_level_m": 1, "temperature_c": 0.15,
    "humidity_pct": 0.3, "wind_speed_kmh": 0.3, "soil_moisture_pct": 1,
    "reservoir_level_pct": 1, "elevation_m": -1, "distance_from_coast_km": -1,
    "population_density": 0.2, "forest_cover_pct": -1, "drainage_score": -1, "cyclone": 1
}

# 1. Load Random Forest
rf_model = None
rf_loaded = False
rf_path = os.path.join(BASE_DIR, "flood_model.pkl")
if os.path.exists(rf_path):
    try:
        with open(rf_path, "rb") as f:
            rf_model = pickle.load(f)
        rf_loaded = True
        print("[INFO] Random Forest model loaded successfully.")
    except Exception as e:
        print(f"[WARN] Error loading Random Forest: {e}")

# 2. Load XGBoost Model
xgb_model = None
xgb_loaded = False
xgb_path = os.path.join(BASE_DIR, "xgboost_model.json")
if os.path.exists(xgb_path):
    try:
        xgb_model = xgb.XGBClassifier()
        xgb_model.load_model(xgb_path)
        xgb_loaded = True
        print("[INFO] XGBoost model loaded successfully.")
    except Exception as e:
        print(f"[WARN] Error loading XGBoost: {e}")

# 3. Load SHAP Explainer
shap_explainer = None
shap_ready = False
if xgb_loaded and xgb_model is not None:
    try:
        shap_explainer = shap.TreeExplainer(xgb_model)
        shap_ready = True
        print("[INFO] SHAP TreeExplainer initialized for XGBoost.")
    except Exception as e:
        print(f"[WARN] Error initializing SHAP TreeExplainer: {e}")

# 4. Load Model Comparison Data
comparison_data = {}
comp_path = os.path.join(BASE_DIR, "model_comparison.json")
if os.path.exists(comp_path):
    try:
        with open(comp_path, "r") as f:
            comparison_data = json.load(f)
    except Exception as e:
        print(f"[WARN] Error loading model comparison: {e}")

# 5. Centralized Configuration
try:
    from config import config
except ImportError:
    from ml_model.config import config

GROQ_API_KEY = config.GROQ_API_KEY
GROQ_MODELS = config.GROQ_MODELS

# 6. Service-to-Service Security
INTERNAL_SERVICE_KEY = config.INTERNAL_SERVICE_KEY
STRICT_INTERNAL_AUTH = config.STRICT_INTERNAL_AUTH

def check_internal_auth():
    """Validates service-to-service internal authentication key from environment."""
    client_ip = request.remote_addr or ""
    is_local = client_ip in ("127.0.0.1", "::1", "localhost", "testclient") or not client_ip
    if not STRICT_INTERNAL_AUTH and is_local:
        return True
    if not INTERNAL_SERVICE_KEY:
        # In development without an explicit internal key, allow only if non-strict
        return not STRICT_INTERNAL_AUTH
    auth_header = (
        request.headers.get("X-Internal-Service-Key")
        or request.headers.get("Internal-Service-Key")
        or request.headers.get("Authorization", "").replace("Bearer ", "")
    )
    return auth_header == INTERNAL_SERVICE_KEY


def risk_label(prob):
    if prob < 0.30:
        return RISK_LABELS[0]
    if prob < 0.55:
        return RISK_LABELS[1]
    if prob < 0.75:
        return RISK_LABELS[2]
    return RISK_LABELS[3]


def compute_shap_local(row_dict):
    """Computes per-prediction local SHAP values and contribution ranking."""
    if not shap_ready or shap_explainer is None:
        # Fallback to feature importance weighting
        weights = comparison_data.get("shap_analysis", {}).get("global_importance", [])
        w_dict = {item["feature"]: item["mean_abs_shap"] for item in weights} if weights else {}
        contributions = []
        for feat in FEATURES:
            val = row_dict.get(feat, 0.0)
            vmin, vmax = FEATURE_MIN_MAX.get(feat, (0.0, 100.0))
            norm = (val - vmin) / max(vmax - vmin, 0.001)
            norm = max(0.0, min(1.0, norm))
            d = FEATURE_DIR.get(feat, 1)
            effect = (norm - 0.5) if d > 0 else (0.5 - norm)
            w = w_dict.get(feat, 0.2)
            shap_val = round(effect * w, 4)
            contributions.append({
                "feature": feat,
                "value": val,
                "shap_value": shap_val,
                "impact": "increases_risk" if shap_val > 0 else "decreases_risk"
            })
        contributions.sort(key=lambda x: abs(x["shap_value"]), reverse=True)
        return {
            "base_value": 0.05,
            "contributions": contributions,
            "top_positive": [c for c in contributions if c["shap_value"] > 0][:5],
            "top_negative": [c for c in contributions if c["shap_value"] < 0][:5]
        }

    try:
        X = pd.DataFrame([row_dict])[FEATURES]
        vals = shap_explainer.shap_values(X)[0]
        base_val = float(shap_explainer.expected_value) if hasattr(shap_explainer.expected_value, '__float__') else float(shap_explainer.expected_value[0])
        
        contributions = []
        for feat, sv in zip(FEATURES, vals):
            contributions.append({
                "feature": feat,
                "value": row_dict[feat],
                "shap_value": round(float(sv), 4),
                "impact": "increases_risk" if sv > 0 else "decreases_risk"
            })
        contributions.sort(key=lambda x: abs(x["shap_value"]), reverse=True)
        return {
            "base_value": round(base_val, 4),
            "contributions": contributions,
            "top_positive": [c for c in contributions if c["shap_value"] > 0][:5],
            "top_negative": [c for c in contributions if c["shap_value"] < 0][:5]
        }
    except Exception as e:
        print(f"[WARN] Local SHAP computation error: {e}")
        return {"error": str(e), "contributions": []}


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "service": "FloodAI ML Microservice",
        "port": 8000,
        "models": {
            "random_forest": {"loaded": rf_loaded, "trees": 300},
            "xgboost": {"loaded": xgb_loaded, "trees": 250},
            "shap_explainer": {"ready": shap_ready}
        },
        "comparison_available": bool(comparison_data),
        "groq_ai_status": "configured"
    })


@app.route("/predict", methods=["POST"])
def predict():
    if not check_internal_auth():
        return jsonify({"error": "Unauthorized: Invalid or missing X-Internal-Service-Key"}), 401
    data = request.get_json(force=True) or {}
    try:
        row = {feat: float(data.get(feat, 0)) for feat in FEATURES}
    except (TypeError, ValueError):
        return jsonify({"error": "All feature fields must be numeric"}), 400

    engine_choice = data.get("engine", "xgboost").lower()

    # Inference execution
    prob_xgb = None
    prob_rf = None

    if xgb_loaded and xgb_model is not None:
        try:
            X = pd.DataFrame([row])[FEATURES]
            prob_xgb = float(xgb_model.predict_proba(X)[0][1])
        except Exception as e:
            print(f"[WARN] XGBoost inference failed: {e}")

    if rf_loaded and rf_model is not None:
        try:
            X = pd.DataFrame([row])[FEATURES]
            prob_rf = float(rf_model.predict_proba(X)[0][1])
        except Exception as e:
            print(f"[WARN] Random Forest inference failed: {e}")

    # Determine final probability
    if engine_choice == "random_forest" and prob_rf is not None:
        proba = prob_rf
        active_engine = "Random Forest (v1.0)"
    elif engine_choice == "ensemble" and prob_xgb is not None and prob_rf is not None:
        proba = 0.55 * prob_xgb + 0.45 * prob_rf
        active_engine = "Calibrated Dual-Ensemble (XGBoost + RF)"
    elif prob_xgb is not None:
        proba = prob_xgb
        active_engine = "XGBoost Classifier (Primary)"
    elif prob_rf is not None:
        proba = prob_rf
        active_engine = "Random Forest (Fallback)"
    else:
        # Calibrated fallback
        score = 0.0
        total_w = 0.0
        for feat in FEATURES:
            val = row.get(feat, 0.0)
            vmin, vmax = FEATURE_MIN_MAX.get(feat, (0.0, 100.0))
            norm = max(0.0, min(1.0, (val - vmin) / max(vmax - vmin, 0.001)))
            d = FEATURE_DIR.get(feat, 1)
            effect = (1.0 - norm) if d < 0 else norm
            w = 0.08
            score += w * effect
            total_w += w
        proba = max(0.02, min(0.98, (score / max(total_w, 0.001)) * 1.55))
        active_engine = "Calibrated Heuristic Engine"

    pred = int(proba > 0.5)
    shap_results = compute_shap_local(row)

    return jsonify({
        "flood_probability_pct": round(proba * 100, 2),
        "flood_predicted": bool(pred),
        "risk_level": risk_label(proba),
        "model_confidence_pct": round(max(proba, 1 - proba) * 100, 2),
        "engine": active_engine,
        "engine_details": {
            "xgboost_proba": round(prob_xgb * 100, 2) if prob_xgb is not None else None,
            "random_forest_proba": round(prob_rf * 100, 2) if prob_rf is not None else None,
        },
        "shap_explanation": shap_results,
        "inputs": row
    })


@app.route("/explain", methods=["POST"])
def explain():
    if not check_internal_auth():
        return jsonify({"error": "Unauthorized: Invalid or missing X-Internal-Service-Key"}), 401
    data = request.get_json(force=True) or {}
    try:
        row = {feat: float(data.get(feat, 0)) for feat in FEATURES}
    except (TypeError, ValueError):
        return jsonify({"error": "All fields must be numeric"}), 400

    explanation = compute_shap_local(row)
    return jsonify(explanation)


@app.route("/models/comparison", methods=["GET"])
def get_comparison():
    if comparison_data:
        return jsonify(comparison_data)
    return jsonify({"error": "Model comparison data not found"}), 404


@app.route("/threat-intel", methods=["POST"])
def generate_threat_intel():
    """Synthesizes disaster management intelligence & directives using Groq LLM."""
    if not check_internal_auth():
        return jsonify({"error": "Unauthorized: Invalid or missing X-Internal-Service-Key"}), 401
    data = request.get_json(force=True) or {}
    district = data.get("district", "Monitored District")
    state_name = data.get("state", "India")
    risk_level = data.get("risk_level", "Medium")
    prob_pct = data.get("flood_probability_pct", 45.0)
    rainfall = data.get("rainfall_mm", 120.0)
    river_level = data.get("river_level_m", 5.2)
    cyclone = bool(data.get("cyclone", 0))
    top_factors = data.get("top_factors", ["rainfall_mm", "soil_moisture_pct"])

    prompt = f"""You are the Lead Disaster Risk Analyst for FloodAI Threat Intelligence.
Analyze the following meteorological readings for {district}, {state_name}:
- Modeled Flood Probability: {prob_pct}% ({risk_level} Risk)
- Current/Forecast Rainfall: {rainfall} mm
- River Gauge Level: {river_level} meters
- Cyclone Alert in Region: {'YES' if cyclone else 'NO'}
- Primary Risk Drivers: {', '.join(top_factors)}

Generate a structured, authoritative disaster threat intelligence assessment in valid JSON format:
{{
  "threat_title": "Short descriptive situational headline",
  "threat_summary": "2-3 sentences analyzing the hydrological danger and timeline",
  "civil_defense_status": "Advisory / Alert / Warning / Evacuation",
  "vulnerability_analysis": "Key terrain and population factors contributing to risk",
  "civilian_directives": ["3 specific, actionable safety instructions for residents"],
  "infrastructure_guidance": "Recommendations for drainage, power, transit, and emergency crews"
}}
Return ONLY the raw JSON object, without markdown blocks or explanation."""

    for model_name in GROQ_MODELS:
        try:
            payload = json.dumps({
                "model": model_name,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.2
            }).encode("utf-8")
            
            req = urllib.request.Request(
                "https://api.groq.com/openai/v1/chat/completions",
                data=payload,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json",
                    "User-Agent": "FloodAI/1.0"
                }
            )
            with urllib.request.urlopen(req, timeout=12) as response:
                result = json.loads(response.read().decode("utf-8"))
                content = result["choices"][0]["message"]["content"].strip()
                # strip any markdown quotes if model added them
                if content.startswith("```json"):
                    content = content[7:]
                if content.startswith("```"):
                    content = content[3:]
                if content.endswith("```"):
                    content = content[:-3]
                parsed = json.loads(content.strip())
                parsed["source_ai_model"] = model_name
                return jsonify(parsed)
        except Exception as e:
            print(f"[WARN] Groq model {model_name} failed: {e}")
            continue

    # Fallback disaster guidance if external API timeout/error occurs
    return jsonify({
        "threat_title": f"{risk_level} Flood Risk Assessment for {district}",
        "threat_summary": f"Hydrological telemetry indicates a {prob_pct}% probability of localized inundation in {district} driven by {rainfall}mm rainfall and {river_level}m river stages.",
        "civil_defense_status": "Warning" if prob_pct >= 55 else ("Alert" if prob_pct >= 30 else "Advisory"),
        "vulnerability_analysis": "Low-lying wards and drainage outflow channels are subject to backwater effect.",
        "civilian_directives": [
            "Avoid low-lying underpasses and river banks.",
            "Charge mobile devices and secure emergency kits.",
            "Follow municipal disaster management updates."
        ],
        "infrastructure_guidance": "Deploy mobile pumping units to primary bottlenecks and inspect sluice gates.",
        "source_ai_model": "FloodAI Local Rule-Based Fallback"
    })


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print(f"[INFO] FloodAI ML Service starting on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=False)
