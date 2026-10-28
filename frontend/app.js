/**
 * =====================================================================
 * FLOODAI — DISASTER THREAT INTELLIGENCE PLATFORM
 * =====================================================================
 * 
 * ARCHITECTURE NOTICE:
 * This monolithic file has been refactored and modularized into dedicated,
 * single-responsibility modules under `/frontend/js/` for maintainability,
 * clear separation of concerns, and cleaner debugging.
 * 
 * Directory Structure:
 * ---------------------------------------------------------------------
 * frontend/
 * ├── index.html                    # SPA Entry HTML with liquid glass theme
 * ├── app.js                        # Modular architecture index (this file)
 * └── js/
 *     ├── config.js                 # API endpoints, VAPID, Firebase & route policies
 *     ├── state.js                  # Global reactive stores (DISTRICTS, YEARLY, state)
 *     ├── utils.js                  # Formatters, skeletons, icons, radar gauge SVGs
 *     ├── api.js                    # API client with JWT injection & dynamic bootstrap
 *     ├── shell.js                  # Topbar, footer, modals (SOS, sector, permissions)
 *     ├── app.js                    # SPA bootstrap & orchestrator
 *     ├── services/
 *     │   ├── audioService.js       # Web Audio API multi-voice acoustic synthesizer siren
 *     │   ├── locationService.js    # Centralized GPS geolocation & sector resolution
 *     │   ├── notificationService.js# Firebase Cloud Messaging & Web Push triggers
 *     │   └── authService.js        # JWT auth, user registration, role RBAC, OTP verify
 *     └── views/
 *         ├── homeView.js           # Public situational overview & scrolltelling narrative
 *         ├── portalView.js         # Resident telemetry, flood risk & shelter routing
 *         ├── commandView.js        # Civil defense ops, cross-district matrix, dispatches
 *         ├── predictView.js        # XGBoost & Random Forest 14-feature sliders & SHAP
 *         ├── mapView.js            # Leaflet GIS, GeoJSON district polygons & radar tiles
 *         ├── dashboardView.js      # MLOps comparison, confusion matrices & global SHAP
 *         ├── analyticsView.js      # 24-year climate trends (2000–2023) from MongoDB
 *         ├── weatherView.js        # Live Open-Meteo & OpenWeather satellite feeds
 *         └── recordsView.js        # Dynamic MongoDB Atlas 10k ground-truth catalog
 * =====================================================================
 */

console.log('[FloodAI] Modular frontend architecture loaded from /frontend/js/');
