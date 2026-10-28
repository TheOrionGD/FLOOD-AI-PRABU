# FloodAI Codebase Architecture & Technical Audit

**Date of Audit:** October 27, 2026  
**Auditor:** Senior Full-Stack Software Architect & Systems Engineer  
**Workspace:** `o:/flood-ai-project`  
**Classification:** Production Engineering Baseline

---

## 1. Executive Summary

This document establishes the verified baseline technical audit of the **FloodAI** disaster intelligence platform. The application comprises a single-page client interface, a Node.js/Express production REST API, a Python/Flask machine learning microservice (XGBoost + Random Forest + SHAP + Groq LLM), and MongoDB Atlas persistence.

The baseline audit was conducted by inspecting actual file contents, analyzing active service dependencies, inspecting runtime ports, running test suites, and identifying architecture and security gaps.

---

## 2. Technology Stack & Runtime Baseline

| Subsystem | Core Technologies | Version / Specification | Entry Points |
|---|---|---|---|
| **Frontend** | Vanilla JS (ES2022), HTML5, CSS3 Custom Properties | Leaflet 1.9.4, Chart.js 4.4.3 (bundled locally) | `frontend/index.html`, `frontend/app.js` |
| **Backend API** | Node.js, Express, Mongoose, Helmet, JWT, Rate-Limit | Node v24.16.0, Express 4.19.2, Mongoose 8.5.0 | `backend/server.js` (Port 5000) |
| **AI / ML Service** | Python, Flask, XGBoost, Scikit-learn, SHAP, Groq API | Python 3.14, Flask, XGBoost 2.1+, SHAP 0.45+ | `ml_model/predict_api.py` (Port 8000) |
| **Database** | MongoDB Atlas (Production Cluster) | MongoDB 7.0+ Replica Set via SRV | Cluster: `hellotheoriongd.rbxbuxe.mongodb.net` |
| **Datasets** | CSV Historical Records (10,000 rows, 22 features) | Physical hydrological simulation | `dataset/flood_dataset.csv` |
| **Integrations** | OpenWeatherMap, Open-Meteo, Firebase FCM, Brevo SMTP | RESTful / Web Push / SMTP TLS | `backend/services/` |

---

## 3. Frontend Architecture Audit

### 3.1 Application Shell & Routing
The frontend is structured as a high-performance Single Page Application (SPA) with zero external build step dependencies, enabling zero-latency rendering, local deployment resilience, and offline-capable operation:
- **Mount Point:** `<div id="app"></div>` inside `frontend/index.html`.
- **Global Controller:** `frontend/app.js` maintaining unified reactive state (`let state = { ... }`).
- **Seven Primary Pages:**
  1. `home` — **Overview:** Environmental intelligence hero, signature animated radar gauge, live alert ticker, district summary cards, scrolltelling narrative with dynamic stage scenes.
  2. `portal` — **Resident Portal:** Personalized localized threat advisory, distance-to-threat calculation, personal alert thresholds, emergency SMS/Email preferences, nearest emergency evacuation shelters.
  3. `command` — **Threat Command:** Multi-district threat matrix, automated district assessment pipeline, Groq LLM tactical directive synthesis, emergency SOS broadcast control, and dispatch audit logs.
  4. `map` — **Geospatial GIS:** Interactive Leaflet map with 10 verified district GeoJSON polygon boundaries, inundation depth contours, live weather radar layer, shelter pins, and risk heatmaps.
  5. `predict` — **AI Risk Lab:** Interactive hydrological parameter input sliders, dual engine selector (XGBoost vs Random Forest vs Calibrated Ensemble), real-time SHAP feature attribution waterfall.
  6. `weather` — **Live Telemetry:** Ingests live telemetry from OpenWeatherMap with automatic failover to Open-Meteo API; 5-day predictive forecast and atmospheric barometrics.
  7. `dashboard` — **MLOps Benchmarks:** Comprehensive model comparison matrix (Accuracy, Precision, Recall, F1, ROC-AUC, PR-AUC), confusion matrix, global SHAP rankings, historical dataset table with CSV export.

### 3.2 Visual Design & Tokens
- Fonts: Google Fonts (`Space Grotesk`, `Inter`, `JetBrains Mono`).
- Colors: Deep navy background (`--bg-0: #060B18`), translucent panels (`--panel: rgba(255,255,255,0.045)`), cyber cyan (`--cyber: #33C7FF`), ocean aqua (`--ocean: #1FE0A8`), semantic risk levels (`--red: #FF4D6A`, `--amber: #FFB84D`).
- Identified Gaps:
  - Tokens were split across multiple inline style rules in `index.html`. Needs centralization into a dedicated tokens style sheet with complete Liquid Glass specifications.
  - Background previously relied on synthetic CSS gradients. A verified high-resolution Liquid Glass bathymetric background asset has been generated and stored at `frontend/assets/backgrounds/floodai-liquid-glass.jpg`.

---

## 4. Backend & API Services Audit

### 4.1 Route & Controller Inventory
- `/api/health` — Readiness and liveness check returning uptime, MongoDB status, and integration flags.
- `/api/auth` — User registration, bcrypt password hashing, JWT generation, protected profile (`/me`), user preferences (`/preferences`), and SMS phone OTP verification.
- `/api/threats` — District threat monitoring, automated assessment pipeline (`/assess-district`), and personalized location intelligence (`/personal-intelligence`).
- `/api/predict` — Proxies requests to Flask ML service, attaches user ID when authenticated, persists prediction history in MongoDB, exposes `/comparison` and `/explain`.
- `/api/alerts` — Emergency alert broadcasting, Multi-channel dispatch (FCM Web Push, Brevo email, SMS), alert resolution.
- `/api/notifications` — Browser FCM token registration, device management, and test push dispatch.
- `/api/geospatial` — Verified GeoJSON district polygons for 10 monitored districts, inundation zones, and live radar provider tile URLs.
- `/api/weather` — Weather proxy endpoint for OpenWeatherMap with query parameters `lat`, `lon`, and `q`.
- `/api/floods` — Paginated historical flood records and aggregate dashboard statistics.

### 4.2 Identified Backend Deficiencies
1. **Module Lifecycle Bug in `server.js`:** `app.listen(PORT)` was called unconditionally when MongoDB connected, breaking test runners that import `app` (`EADDRINUSE: port 5000 already in use`). Needs `if (require.main === module)` guard.
2. **Missing Service-to-Service Secret:** Requests between Express and the Flask AI service were unauthenticated, allowing direct external calls if Flask port 8000 was exposed.
3. **Emergency Alert Authorization:** Mutation routes on `/api/alerts` and `/api/threats/assess-district` lacked explicit role checks (`requireRole(["admin", "analyst"])`).
4. **User Isolation Enforcement:** Personal notification preferences and prediction history required stricter scoping to `req.user._id` to prevent IDOR vulnerabilities.

---

## 5. Machine Learning Microservice Audit

### 5.1 Model Architecture & Artifacts
- **Random Forest Classifier:** 300 estimators, max depth 12, balanced class weight, trained on 8,000 records. Stored in `ml_model/flood_model.pkl` (19.8 MB).
- **XGBoost Classifier:** 250 trees, max depth 6, learning rate 0.08. Stored in `ml_model/xgboost_model.json` (1.3 MB).
- **SHAP TreeExplainer:** Pre-computed on XGBoost model for sub-second feature importance attribution (`shap.TreeExplainer(xgb_model)`).
- **Groq LLM Integration:** Uses `qwen/qwen3.8-27b` via Groq API for tactical threat intelligence and civil defense directives.
- **Microservice Status:** Verified operational on port 8000. All 4 unit tests in `test_ml_service.py` pass cleanly.

---

## 6. Dataset Audit & Provenance

- **Location:** `dataset/flood_dataset.csv` (1.42 MB, 10,000 records, 22 columns).
- **Generator:** `dataset/generate_dataset.py` using physical hydrological distributions (gamma distributions for monsoon rainfall, normal distributions for river/sea levels, exponential distributions for coastal distances).
- **Districts Represented:** Chennai, Mumbai, Kolkata, Kochi, Bhubaneswar, Guwahati, Patna, Surat, Visakhapatnam, Hosur.
- **Target Variables:** `flood_occurred` (binary classification target), `flood_severity` (Low, Medium, High, Very High).
- **Identified Gaps:** Dataset lacked a standalone schema validation script and formal data dictionary documentation.

---

## 7. Baseline Verification Commands & Status

| Verification Action | Command | Result | Notes |
|---|---|---|---|
| ML Service Tests | `python test_ml_service.py` | **PASS (4/4)** | 4.29s execution, SHAP & Groq verified |
| Backend Integration | `node backend/test_backend.js` | **PARTIAL** | Health and Geospatial passed; halted by `EADDRINUSE` |
| Full System Pipeline | `node test_full_system.js` | **READY** | Requires clean port management and service lifecycle fix |
| Static Frontend | Open `frontend/index.html` | **OPERATIONAL** | Loads Leaflet, local charts, and fallback JSON |

---

## 8. Summary of Implementation Priorities

1. Fix `server.js` server listener guard (`require.main === module`) and port handling.
2. Centralize Liquid Glass tokens and integrate the newly generated `floodai-liquid-glass.jpg` asset.
3. Secure page-level navigation and backend routes with role-based authorization.
4. Implement reliable geolocation service with real fallback and manual district picker.
5. Harden emergency SOS workflows with debouncing, server confirmation, and audit logs.
6. Create `render.yaml` and `.env.example` for zero-friction Render deployment.
