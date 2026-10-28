# FloodAI Master Implementation Plan

**Project:** FloodAI — Disaster Management & Flood Intelligence Platform  
**Architecture:** Modernized Vanilla JS SPA + Node.js/Express REST API + Python/Flask ML Microservice (XGBoost, Random Forest, SHAP, Groq LLM) + MongoDB Atlas  
**Target Deployment:** Render Cloud Platform  
**Execution Order:** Audit → Inventory → Architecture → Implementation → Integration → Testing → Deployment Preparation → Final Verification

---

## Phase Execution Checklist

### Phase 1: Baseline Audit & Documentation (Completed)
- [x] Comprehensive codebase inspection (Frontend, Backend, ML models, Datasets, Scripts, Configs).
- [x] Record active services and port baseline (Node 5000, Python ML 8000, HTTP 3000).
- [x] Author `docs/architecture/codebase-audit.md`.
- [x] Author `docs/audits/production-readiness-audit.md`.
- [x] Author `docs/implementation/implementation-plan.md`.

---

### Phase 2: Repository Organization & Maintainable Structure (Completed)
- [x] Establish clean, deployment-ready directory structure matching target architecture without breaking legacy scripts:
  - `frontend/`: Static SPA client, assets, vendor libraries, design tokens, styles, components.
  - `backend/`: Express application, controllers, middleware, models, routes, services, tests.
  - `ml_model/`: Flask microservice, trained models (`flood_model.pkl`, `xgboost_model.json`), metrics, tests.
  - `dataset/`: CSV records, generator script, validation script, README.
  - `docs/`: Architecture, audits, implementation, notes, testing, deployment guides.
  - `tests/`: Automated unit and cross-service verification test suites.
- [x] Preserve existing entry points (`run_system.bat`, `stop_system.bat`, `tests/test_full_system.js`).
- [x] Maintain root `package.json` with standard orchestration scripts (`npm test`, `npm run audit:secrets`).
- [x] Add `.gitignore` ensuring secrets, cache, and node_modules are excluded.

---

### Phase 3: FloodAI Liquid Glass Design System
- [x] Generate verified high-resolution Liquid Glass background asset:
  - Asset: `frontend/assets/backgrounds/floodai-liquid-glass.jpg` (bathymetric depth contours, deep ocean blues, cyan refractions, expansive dark center negative space).
- [ ] Implement centralized CSS design tokens in `frontend/styles/tokens.css` (and embedded in `index.html` for zero-build static compatibility):
  - Theme variables for surfaces, borders, text contrast, semantic risk colors (`--risk-low`, `--risk-moderate`, `--risk-high`, `--risk-critical`), blur scales, shadows, focus rings.
- [ ] Implement reusable Liquid Glass primitives:
  - `.glass-surface`, `.glass-card`, `.glass-panel`, `.glass-header`, `.glass-nav`, `.glass-btn`, `.glass-input`, `.glass-badge`, `.glass-modal`, `.glass-drawer`, `.glass-tooltip`.
- [ ] Apply design system consistently across all 7 pages:
  - Overview (`home`)
  - Resident Portal (`portal`)
  - Threat Command (`command`)
  - Geospatial GIS (`map`)
  - AI Risk Lab (`predict`)
  - Live Telemetry (`weather`)
  - MLOps Benchmarks (`dashboard`)
- [ ] Protect GIS map and canvas charts:
  - Ensure zero overlay blocking Leaflet tiles, pan/zoom, popups, or Chart.js interactive legends.
- [ ] Ensure full accessibility (`prefers-reduced-motion`, visible focus indicators, WCAG AA text contrast).

---

### Phase 4: Flood Alerts, Emergency SOS & Notification Workflows
- [ ] Audit & upgrade client-side alert presentation system:
  - Distinct severity tiers: Critical Warnings (Red), High Risk (Orange), Moderate Advisories (Yellow), Informational (Green).
  - Explicit metadata: title, description, district scope, issuance timestamp, source, recommended action.
- [ ] Harden SOS emergency interaction:
  - Deliberate confirmation dialog preventing accidental trigger.
  - Client-side debouncing and request locking to prevent duplicate submissions.
  - Server-confirmed dispatch states: `sending` → `dispatched` (recipient count) or `failed` with retry option.
  - Distinct high-visibility red styling separate from standard buttons.
  - Floating "Silence Siren" control during active Web Audio siren playback.
- [ ] Persist and isolate alert records:
  - Store dispatches in MongoDB `AlertDispatch` collection with authenticated user identity.
  - Role-based authorization for alert resolution and administrative broadcasts.

---

### Phase 5: Dataset Audit & Database-First Architecture
- [ ] Author `dataset/README.md` documenting schema, columns, units, distributions, and physical motivation.
- [ ] Author `dataset/validate_dataset.py` with automated assertions for:
  - 10,000 row count, 22 columns, zero null values, coordinate bounds, realistic feature ranges, label balance.
- [ ] Author `docs/audits/dataset-audit.md`.
- [ ] Eliminate invalid mock data & fake-success fallbacks:
  - Remove heuristic client-side calculation from `runPrediction()` in default production mode; wire directly to authenticated `/api/predict`.
  - Provide explicit loading, empty, stale (with timestamp), and error states.
- [ ] Enforce database-first persistence:
  - User profiles, saved monitoring locations, notification subscriptions, prediction history, threat assessments.
- [ ] Clean up browser storage on logout (`localStorage` token cleanup, request cancellation).

---

### Phase 6: Authentication & Page-Level Authorization
- [ ] Preserve seven page identifiers: `home`, `portal`, `command`, `map`, `predict`, `weather`, `dashboard`.
- [ ] Define centralized `ROUTE_POLICIES`:
  - `home`: Public
  - `portal`: Authenticated (`user`, `analyst`, `admin`)
  - `command`: Authenticated (`analyst`, `admin`)
  - `map`: Public base, protected layers for authenticated users
  - `predict`: Authenticated (`user`, `analyst`, `admin`)
  - `weather`: Authenticated
  - `dashboard`: Authenticated (`analyst`, `admin`)
- [ ] Enforce client-side page guards:
  - Check JWT validity and expiration before rendering protected page roots.
  - Open sign-in modal with return destination if unauthenticated.
  - Clear user state and redirect safely on logout.
- [ ] Secure backend Express endpoints:
  - Apply `authenticateToken` and `requireRole(["admin", "analyst"])` to mutation routes (`POST /api/alerts`, `POST /api/threats/assess-district`).
  - Scope `GET /api/predict/history` and `GET /api/notifications/history` to authenticated `req.user._id`.
  - Fix `server.js` listener guard (`if (require.main === module)`).
- [ ] Secure Flask AI microservice:
  - Implement `INTERNAL_SERVICE_SECRET` verification (`X-Internal-Service-Key`).

---

### Phase 7: Automatic Geolocation & Location-Aware Intelligence
- [ ] Implement centralized `GeoLocationService` with 7 lifecycle states:
  - `idle`, `requesting`, `located`, `permission_denied`, `unavailable`, `timeout`, `error`.
- [ ] Track real attributes: `latitude`, `longitude`, `accuracyMeters`, `timestamp`, `source` (`gps`, `manual`, `saved`).
- [ ] Provide clear fallback UI with manual district selector — never silently substitute fake coordinates.
- [ ] Integrate location across all 7 pages:
  - Overview: Local district threat summary badge.
  - Resident Portal: Distance to nearest danger zone and personal shelter routing.
  - Threat Command: Geographic filtering of threats.
  - Geospatial GIS: "Locate Me" button and current position marker.
  - AI Risk Lab: Auto-populate elevation and coastal distance for detected district.
  - Live Telemetry: Fetch weather for exact coordinates.

---

### Phase 8: API, Database & Integration Reliability
- [ ] Standardize API client in `frontend/app.js` with auth headers, error propagation, and freshness indicators.
- [ ] Add Mongoose compound indexes to `Prediction`, `AlertDispatch`, `ThreatAssessment`, and `FloodRecord`.
- [ ] Ensure resilient handling of external APIs (OpenWeatherMap timeout with Open-Meteo fallback).
- [ ] Structured error logging with request IDs in backend.

---

### Phase 9: Automated Testing & Verification
- [ ] Run and expand unit and integration tests:
  - Dataset validation test (`dataset/validate_dataset.py`).
  - Flask ML tests (`ml_model/test_ml_service.py`).
  - Backend integration tests (`backend/test_backend.js` with port fix).
  - Full end-to-end integration test (`test_full_system.js`).
- [ ] Document test commands, pass/fail counts, and outputs in `docs/testing/test-results.md`.

---

### Phase 10: Render Production Deployment
- [ ] Create `render.yaml` blueprint configuring:
  - Backend Web Service (Node.js runtime, build/start commands, environment variables, health check `/api/health`).
  - AI Web Service (Python runtime, requirements.txt, start command `python predict_api.py`, health check `/health`).
  - Frontend Static Site (or unified server).
- [ ] Create sanitized `.env.example`.
- [ ] Author `docs/deployment/render-deployment.md` with complete step-by-step setup, Atlas network configuration, environment variable reference, and troubleshooting.

---

### Phase 11: Root README & Developer Experience
- [ ] Update root `README.md` with comprehensive documentation reflecting the real upgraded architecture, setup instructions, testing commands, and Render deployment procedures.

---

### Phase 12: Final Verification & Implementation Report
- [ ] Execute complete end-to-end smoke test.
- [ ] Compile evidence-based final implementation and verification report.
