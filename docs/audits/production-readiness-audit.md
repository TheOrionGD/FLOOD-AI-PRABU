# FloodAI Production-Readiness & Security Audit Inventory

**Date of Audit:** October 27, 2026  
**Auditor:** Full-Stack Architect & Application Security Engineer  
**Status:** In Progress / Remediations Defined

---

## 1. Issue Inventory by Severity and Category

| Category | High | Medium | Low | Total |
|---|---|---|---|---|
| **UI and Styling** | 0 | 2 | 2 | **4** |
| **Dataset Quality & Provenance** | 0 | 1 | 2 | **3** |
| **Mock & Hardcoded Data** | 1 | 2 | 1 | **4** |
| **Authentication & Authorization** | 3 | 2 | 1 | **6** |
| **User Data Isolation** | 2 | 1 | 0 | **3** |
| **Geolocation & Location Intelligence** | 1 | 2 | 1 | **4** |
| **API & Database Reliability** | 2 | 2 | 1 | **5** |
| **SOS & Emergency Workflow** | 2 | 1 | 1 | **4** |
| **Deployment Configuration** | 2 | 2 | 0 | **4** |
| **TOTALS** | **13** | **15** | **9** | **37** |

---

## 2. Detailed Findings & Remediation Plan

### 2.1 UI & Styling
- **ISS-UI-01 (Medium):** Fragmented CSS Tokens. Styling rules in `frontend/index.html` duplicate tokens across light/dark themes and lack centralized Liquid Glass CSS custom properties.  
  *Remediation:* Create `frontend/styles/tokens.css` with unified variables for surfaces, border highlights, blur levels, shadows, and semantic risk states.
- **ISS-UI-02 (Medium):** Missing High-Resolution Liquid Glass Background Asset. The interface previously used generic radial gradients without depth or bathymetric contours.  
  *Remediation:* Generated and saved high-definition bathymetric background asset at `frontend/assets/backgrounds/floodai-liquid-glass.jpg`. Link through `--flood-bg-image`.
- **ISS-UI-03 (Low):** Backdrop filter degradation on low-power devices. Blur effects on nested cards can cause GPU lag without explicit fallback rules.  
  *Remediation:* Add `@supports not (backdrop-filter: blur(10px))` solid low-opacity fallbacks.
- **ISS-UI-04 (Low):** Touch target sizing on mobile tab controls.  
  *Remediation:* Ensure touch targets satisfy minimum 44x44px guidelines.

### 2.2 Dataset Quality & Provenance
- **ISS-DATA-01 (Medium):** Lack of Deterministic Schema & Boundary Validation. `flood_dataset.csv` had no automated integrity test script to catch anomalous values.  
  *Remediation:* Create `dataset/validate_dataset.py` to verify columns, types, ranges, null count, and distributions.
- **ISS-DATA-02 (Low):** Missing Documentation on Synthetic Hydrological Distributions.  
  *Remediation:* Author comprehensive `dataset/README.md` documenting parameters, formulas, and real-world mapping.
- **ISS-DATA-03 (Low):** Duplicate generator script in `ml_model/` and `dataset/`.  
  *Remediation:* Consolidate to `dataset/generate_dataset.py` and document single source of truth.

### 2.3 Mock & Hardcoded Data
- **ISS-MOCK-01 (High):** Client-Side Fake Prediction Scoring in Default State. Default `runPrediction()` in `app.js` used a weighted heuristic formula instead of strictly requiring backend ML service responses.  
  *Remediation:* Wire `runPrediction()` directly to authenticated Express backend `/api/predict` with transparent loading, error, and offline status indicators.
- **ISS-MOCK-02 (Medium):** Hardcoded Admin Credentials in Login Form. Demo credentials (`admin@floodai.org` / `admin123`) were pre-filled in production login form inputs.  
  *Remediation:* Remove hardcoded values from input attributes; require explicit user credential entry.
- **ISS-MOCK-03 (Medium):** Static Sample Incident Rows. Fallback table in `index.html` contained static rows that could mask API connectivity failures.  
  *Remediation:* Clearly flag static fallback data with freshness badge and timestamp; attempt live `/api/floods` fetch first.
- **ISS-MOCK-04 (Low):** Default District Selection. Automatically defaulted to Chennai without user geolocation prompt.  
  *Remediation:* Implement reactive geolocation service that prompts user and provides clear manual selection state.

### 2.4 Authentication & Authorization
- **ISS-AUTH-01 (High):** Unguarded Client-Side Navigation. Switching `state.page` in `app.js` did not verify JWT authentication or user role, permitting unauthenticated visitors to toggle into `portal`, `command`, `predict`, or `dashboard`.  
  *Remediation:* Implement centralized route-level guard (`ROUTE_POLICIES`) that validates session and redirects to sign-in modal with redirect retention.
- **ISS-AUTH-02 (High):** Public Mutation on Emergency Assessment Route. `POST /api/threats/assess-district` allowed unauthenticated callers to trigger external weather calls and insert assessments.  
  *Remediation:* Apply `authenticateToken` and `requireRole(["admin", "analyst"])`.
- **ISS-AUTH-03 (High):** Public Mutation on Emergency Alert Broadcast. `POST /api/alerts` did not require role verification before triggering multi-channel SMS/Email dispatch.  
  *Remediation:* Enforce `authenticateToken` and `requireRole(["admin", "analyst"])` on `/api/alerts`.
- **ISS-AUTH-04 (Medium):** Unauthenticated Flask ML Microservice Endpoints. Direct calls to `http://localhost:8000/predict` and `/threat-intel` lacked a service authentication secret.  
  *Remediation:* Introduce `INTERNAL_SERVICE_SECRET` verified via `X-Internal-Service-Key` header between Node and Flask.
- **ISS-AUTH-05 (Medium):** Plain JWT in LocalStorage without Expiration Check. Client did not validate token expiration before submitting requests, resulting in generic 403 errors.  
  *Remediation:* Implement proactive JWT payload expiration check and automatic logout upon expiration.
- **ISS-AUTH-06 (Low):** Password Strength Policy. Passwords allowed minimum 6 characters without complexity enforcement.  
  *Remediation:* Add validation requiring min 8 characters including letter and number.

### 2.5 User Data Isolation
- **ISS-ISO-01 (High):** Potential IDOR on Notification Preferences. User could theoretically update other users' preferences if user ID was modified in request body.  
  *Remediation:* Derive user ID strictly from verified `req.user._id` in JWT middleware; ignore client-supplied IDs.
- **ISS-ISO-02 (High):** History Query Filtering Leakage. `GET /api/predict/history` allowed non-admin users to see predictions where `userId: null`.  
  *Remediation:* Strictly scope non-admin prediction history queries to `{ userId: req.user._id }`.
- **ISS-ISO-03 (Medium):** Persistence of Multi-User State in LocalStorage. Logging out did not fully clear cached notifications or user-specific telemetry filters.  
  *Remediation:* Implement atomic `logout()` procedure that wipes `localStorage` tokens, aborts pending requests, and resets application state.

### 2.6 Geolocation & Location Intelligence
- **ISS-GEO-01 (High):** Silent Defaulting to Hardcoded Coordinates. When browser GPS failed or was denied, application silently simulated coordinates without user notification.  
  *Remediation:* Implement 7-state geolocation lifecycle (`idle`, `requesting`, `located`, `permission_denied`, `unavailable`, `timeout`, `error`). Display explicit fallback with manual district selector.
- **ISS-GEO-02 (Medium):** Coordinate Validation Deficiencies. Coordinate queries (`lat`, `lon`) were not bounded by standard geographic ranges (-90 to +90, -180 to +180).  
  *Remediation:* Validate numeric and geographic bounds on all coordinate inputs on both client and backend.
- **ISS-GEO-03 (Medium):** Distance Calculation on Stale Fixes. Haversine distance calculations did not verify fix freshness.  
  *Remediation:* Attach timestamp and accuracy radius to location state and UI badges.
- **ISS-GEO-04 (Low):** Missing "Locate Me" button on GIS Map toolbar.  
  *Remediation:* Add dedicated GPS locate button on map interface.

### 2.7 API & Database Reliability
- **ISS-REL-01 (High):** Node Process Port Collision during Testing (`EADDRINUSE`). `server.js` initiated `app.listen(PORT)` unconditionally during MongoDB connection, crashing test runners that import the server file.  
  *Remediation:* Guard `app.listen()` with `if (require.main === module)`.
- **ISS-REL-02 (High):** External Weather Timeout Cascades. Failures or delays on OpenWeatherMap could block threat assessment pipeline.  
  *Remediation:* Configure strict 3500ms timeout with automated failover to Open-Meteo API.
- **ISS-REL-03 (Medium):** Missing Database Indexes. Queries on `FloodRecord` and `Prediction` by date, district, and userId lacked compound indexes.  
  *Remediation:* Add Mongoose schema indexes for high-frequency queries.
- **ISS-REL-04 (Medium):** Error Leaking Stack Traces. Centralized error handler in `server.js` logged full stack traces and returned unformatted error strings.  
  *Remediation:* Sanitize error responses in production mode; return structured error codes and request IDs.
- **ISS-REL-05 (Low):** Rate Limit Window Configuration. Rate limit applied globally rather than targeted per IP.  
  *Remediation:* Configure standard IP-based rate limiting with trust-proxy awareness for Render.

### 2.8 SOS & Emergency Workflow
- **ISS-SOS-01 (High):** Rapid Repeated SOS Submissions. Users clicking SOS repeatedly could trigger duplicate SMS and Email alerts.  
  *Remediation:* Add client-side submission lock, debouncing, and a server-side idempotency token window.
- **ISS-SOS-02 (High):** Unconfirmed Emergency Dispatch State. Client reported "Alert Sent" before backend dispatch confirmation was returned from SMS/FCM services.  
  *Remediation:* Display explicit loading state ("Dispatching..."), followed by verified confirmation ("Dispatched to X contacts") or actionable error state.
- **ISS-SOS-03 (Medium):** Accidental Activation Risk. SOS button was easily clicked without confirmation modal or press-and-hold safety delay.  
  *Remediation:* Implement deliberate confirmation step with visual warning indicator.
- **ISS-SOS-04 (Low):** Alert Siren Control Usability. Siren sound could not be easily silenced once triggered without refreshing page.  
  *Remediation:* Add prominent floating "Mute Siren" button during active emergency state.

### 2.9 Deployment Configuration
- **ISS-DEP-01 (High):** Missing Render Blueprint (`render.yaml`). Repository lacked Render configuration for orchestrating Node API, Flask AI microservice, and frontend.  
  *Remediation:* Create production-ready `render.yaml` defining web services, static sites, build/start commands, and environment variable bindings.
- **ISS-DEP-02 (High):** Plaintext Secrets in `.env` committed or unstandardized.  
  *Remediation:* Create clean `.env.example` with sanitized placeholders; document all secrets in deployment guide.
- **ISS-DEP-03 (Medium):** Missing CORS Origin Configuration for Render Domains. Backend `server.js` configured `origin: "*"` which prevents secure cookie sharing if needed.  
  *Remediation:* Support configurable `CORS_ORIGIN` environment variable.
- **ISS-DEP-04 (Medium):** Ephemeral Storage Assumptions for ML Artifacts. Deployment must verify that `flood_model.pkl` and `xgboost_model.json` are committed and bundled in build context.  
  *Remediation:* Verify model files are within build directory and accessible in read-only container filesystem.
