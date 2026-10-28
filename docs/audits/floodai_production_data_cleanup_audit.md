# FloodAI Production-Readiness System Audit Report

**Date:** October 28, 2026  
**Audited Subsystems:** Frontend Pages, Express Backend APIs, Flask ML Microservice, MongoDB Atlas Collections, Authentication & RBAC, Geolocation Pipeline, Notification Channels (Brevo Email, SMS, Firebase Web Push, In-Browser Siren), and Alert Simulation.

---

## 1. Executive Summary

This audit identifies all occurrences of mock, sample, demo, seed, dummy, and placeholder data across the FloodAI platform. It establishes the baseline for:
1. Safely cleaning test accounts and orphaned dispatch records without impacting legitimate registered residents.
2. Replacing hardcoded and artificially inflated hydrological values with authentic real-time sensor observations and official disaster warning sources.
3. Upgrading resident geolocation to adhere to explicit user consent, eliminating silent fallback coordinates, and computing proximity-based risk from true GPS coordinates.
4. Implementing a secure, isolated resident flood alert simulation workspace with verified multi-channel delivery tracking (Siren, Email, SMS, FCM Web Push).

---

## 2. Identified Occurrences & Remediation Matrix

### 2.1 Database & Stored Records

| # | Collection / Table | Location | Identified Occurrence | Impact | Remediation |
|---|---|---|---|---|---|
| **DB-01** | `alertdispatches` | MongoDB Atlas (`flood_prediction`) | 69 orphaned test dispatches addressed to dummy emails (`operator_...`, `qa_officer_...`) and test FCM tokens. | Clutters audit history; exposes test artifacts in administrative consoles. | Safely prune orphaned test dispatch records; preserve real user records; implement referential integrity check. |
| **DB-02** | `alerts` | MongoDB Atlas (`alerts`) | 7 alerts created with artificial 90%+ risk scores caused by hardcoded river gauge levels (6.2m) during automated tests. | Public and resident alert views display active emergencies for test runs. | Archive test alerts or mark resolved; ensure simulation/test events never contaminate the production `Alert` collection. |
| **DB-03** | `threatassessments` | MongoDB Atlas (`threatassessments`) | 10 threat assessments created with inflated baseline rainfall (`>= 15mm-25mm`) and static water levels. | Falsely elevates risk baseline across monitored districts. | Clean test assessments; enforce genuine sensor ingestion and status indicators when gauge data is missing. |
| **DB-04** | `users` | MongoDB Atlas (`users`) | 1 verified user account (`godfreytr.prof@gmail.com`). | Verified legitimate resident account. | **PRESERVE.** Never delete or modify legitimate resident data. |

---

### 2.2 Backend APIs & Processing Pipeline

| # | Service / Route | File & Line | Identified Occurrence | Impact | Remediation |
|---|---|---|---|---|---|
| **BE-01** | Threat Assessment Pipeline | `backend/routes/threatRoutes.js`: L83, L97, L290, L325 | Artificial rainfall floors: `rainfall_mm = Math.max(rain1h * 10, 25.0);` and `Math.max(rainCurrent * 8, 15.0)`. | Even on sunny/zero-rain days, rainfall is forced to 15–25 mm, skewing ML predictions. | Use true observed precipitation (e.g., `0.0 mm`). When rain is absent, report 0.0 mm. |
| **BE-02** | Hydrological River & Tide Gauges | `backend/routes/threatRoutes.js`: L110-111, L355 | Hardcoded river level: `target.coastal ? 6.2 : 4.8` and `sea_level_m: target.coastal ? 1.8 : 0.8`. | Declares active river flooding based solely on whether district is coastal. | Retrieve actual hydrological telemetry or mark river gauge status as "Gauge station unavailable / model baseline". |
| **BE-03** | Authentication Verification OTP | `backend/routes/authRoutes.js`: L54, L245 | Hardcoded verification code `"748092"`. | Insecure static OTP code. | Generate dynamic, cryptographically secure 6-digit OTP with 10-minute expiry stored on user model. |
| **BE-04** | Simulation Route Authorization | `backend/routes/alertRoutes.js`: L80 | Public unauthenticated `POST /api/alerts/simulate-resident-flood`. | Anyone can trigger external alerts to arbitrary email/phone numbers without login. | Enforce `authenticateToken`; bind recipient strictly to authenticated resident's database record; require confirmation. |
| **BE-05** | Notification Channel Statuses | `backend/services/brevoEmailService.js`: L123 & `smsService.js`: L119 | Sandbox modes return `status: "delivered"`. | Fabricates confirmed delivery when only queued/sandbox simulated. | Return `status: "accepted"` or `"sandbox_simulated"`; distinguish external provider delivery receipts from local acceptance. |
| **BE-06** | Startup Auto-Seed Script | `backend/server.js`: L175-181 | Unconditional check on startup invoking `seed_database.js`. | Potential risk of recreating test records during production restarts. | Guard seed script with strict environment check (`ENABLE_DATASET_SEED=true`) and verify it only inserts historical ground-truth CSV records. |

---

### 2.3 Frontend Views & Services

| # | View / Component | File & Line | Identified Occurrence | Impact | Remediation |
|---|---|---|---|---|---|
| **FE-01** | Resident Alert Simulator | `frontend/js/views/residentSimulationView.js`: L92-96, L414-419 | Hardcoded fallback email `godfreytr.prof@gmail.com`, fake phone `+919876543210`, fallback location `Lalgudi`, and coords `[10.8739, 78.726715]`. | Simulates alerts using arbitrary fallback values rather than verified account data. | Load recipient contact data strictly from `state.user` (authenticated database record); enforce honest unconfigured state if phone/email missing. |
| **FE-02** | High-Probability Risk Areas | `frontend/js/views/residentRiskView.js`: L9-230 | Static catalog `HIGH_PROB_DISTRICTS_DATA` with hardcoded probabilities (`93.03%`, `83.78%`, etc.) and static rain/river numbers. | Displays stale, fabricated risk levels across the 10 monitored districts. | Fetch live district threat assessments and official IMD/CWC advisories from backend `/api/threats/current` and `/api/floods/analytics`. |
| **FE-03** | Silent Geolocation Fallback | `frontend/js/views/residentRiskView.js`: L532 & `residentWeatherView.js`: L37 | Silently defaults coordinates to Chennai `[13.08, 80.27]` when GPS permission is denied or location is not set. | User is evaluated for Chennai without knowing GPS was denied or inactive. | Show explicit "Location Required" state with interactive "Allow GPS" and "Manual District Selector" controls; never silently substitute. |
| **FE-04** | 1,000km Synoptic Radar | `frontend/js/views/residentRadarView.js`: L18-89 | Static `RADAR_THREATS_1000KM` list with hardcoded Chennai-centric hazard blips (Adyar, Chembarambakkam, Bay of Bengal depression) for all users. | Falsely displays Bay of Bengal storms to users in Mumbai or Delhi. | Dynamically project real regional monitoring basins, live coastal storm tracks, and active official alert zones relative to resident's actual coordinates. |
| **FE-05** | Resident Saved Locations | `frontend/js/views/residentActivityView.js`: L86-91 | Fabricates demo locations ("Primary Residence", "Family Home") when user has 0 saved bookmarks. | Fabricates data where honest empty state is required. | Render clean empty state ("No saved locations bookmarked yet") with "Add Location" action. |
| **FE-06** | Weather Coordinate Property Mismatch | `frontend/js/views/residentWeatherView.js`: L39 | Checks `state.userLocation.latitude` (which is `undefined`, as `locationService` sets `lat`). | Always falls back to Chennai coordinates. | Correct property access to `state.userLocation.lat || state.userLocation.latitude`. |

---

## 3. Implementation Plan by Phase

1. **Phase 2 (Safe Data Cleanup):**
   - Create automated database cleanup script with backup safety.
   - Remove orphaned test dispatches and inactive test alerts.
   - Preserve real user `godfreytr.prof@gmail.com` and ground-truth 10,000 CSV flood records.
   - Fix backend startup seeding guard.
2. **Phase 3 (Live Geolocation & Flood Detection):**
   - Eliminate artificial rainfall floors (0.0mm stays 0.0mm).
   - Ingest true live telemetry from Open-Meteo & OpenWeatherMap with transparent attribution and timestamps.
   - Enforce explicit permission lifecycle in frontend: prompt → locate → manual selector fallback (no silent substitution).
   - Dynamically calculate real distance to coastline using geodesic polyline and digital elevation model (DEM).
3. **Phase 4 (Resident Flood Alert Simulation):**
   - Upgrade `/resident/alert-simulation` route and view (`residentSimulationView.js`).
   - Secure backend route `POST /api/alerts/simulate-resident-flood` with `authenticateToken`.
   - Use authenticated resident's database profile (verified email, verified phone, registered FCM tokens).
   - Clearly label simulation banner, isolate simulation records from production incidents (`isSimulation: true`).
   - Require explicit user confirmation before external dispatches.
4. **Phase 5 (Notification Channels):**
   - In-browser Acoustic Siren with Web Audio API, user gesture handling, and mute control.
   - Brevo Email dispatch with accurate status reporting (`accepted`, `sent`, `delivered`, `failed`).
   - SMS dispatch via provider abstraction with phone verification requirement.
   - Firebase Web Push notifications via service worker and SSE stream fallback.
   - Per-channel status tracking and idempotency safeguards.
5. **Phase 6 & 7 (Data Models & Security):**
   - Extend Mongoose models: `AlertDispatch` (simulation flag, timestamps, delivery receipts), `User` (location consent metadata, verified contacts), `ThreatAssessment` (provenance, live indicators).
   - Secure routes with RBAC, input validation, rate limiting.
6. **Phase 8 & 9 (Frontend Integration & Verification):**
   - Update resident views (`residentRiskView`, `residentWeatherView`, `residentRadarView`, `residentActivityView`, `residentSimulationView`).
   - Execute automated end-to-end tests and verify all channels and cleanup.
