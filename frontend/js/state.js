/* ===========================================================
   FloodAI — Global Reactive State & Data Stores
   =========================================================== */

// Ground-truth Monitored Disaster Districts default catalogue
const DEFAULT_MONITORED_DISTRICTS = [
  { district: "Chennai", state: "Tamil Nadu", latitude: 13.08, longitude: 80.27, avg_elevation: 6.09, avg_risk: 29.57 },
  { district: "Mumbai", state: "Maharashtra", latitude: 19.08, longitude: 72.88, avg_elevation: 7.93, avg_risk: 29.32 },
  { district: "Kolkata", state: "West Bengal", latitude: 22.57, longitude: 88.36, avg_elevation: 5.98, avg_risk: 29.55 },
  { district: "Bhubaneswar", state: "Odisha", latitude: 20.30, longitude: 85.82, avg_elevation: 45.31, avg_risk: 28.52 },
  { district: "Guwahati", state: "Assam", latitude: 26.14, longitude: 91.74, avg_elevation: 55.41, avg_risk: 28.53 },
  { district: "Patna", state: "Bihar", latitude: 25.59, longitude: 85.14, avg_elevation: 53.63, avg_risk: 28.63 },
  { district: "Surat", state: "Gujarat", latitude: 21.17, longitude: 72.83, avg_elevation: 13.01, avg_risk: 29.57 },
  { district: "Kochi", state: "Kerala", latitude: 9.93, longitude: 76.27, avg_elevation: 2.33, avg_risk: 29.70 },
  { district: "Visakhapatnam", state: "Andhra Pradesh", latitude: 17.69, longitude: 83.22, avg_elevation: 45.08, avg_risk: 28.36 },
  { district: "Hosur", state: "Tamil Nadu", latitude: 12.74, longitude: 77.83, avg_elevation: 886.30, avg_risk: 15.93 }
];

// Dynamic Data Stores Ingested from MongoDB Atlas & Active ML Microservice
let DISTRICTS = [...DEFAULT_MONITORED_DISTRICTS];
let YEARLY = [];
let FLOOD_STATS = null;
let MODEL_METRICS = null;
let isDataBootstrapped = false;
let dataBootstrapPromise = null;

let savedUser = null;
let savedToken = localStorage.getItem('floodai-token') || null;
try {
  savedUser = JSON.parse(localStorage.getItem('floodai-user') || 'null');
  // Strict Security: Purge any legacy dummy accounts, guest accounts, or unauthenticated sessions lacking valid JWT
  if (savedUser && (!savedToken || (savedUser.id && String(savedUser.id).startsWith('usr_') && !savedToken))) {
    savedUser = null;
    savedToken = null;
    localStorage.removeItem('floodai-user');
    localStorage.removeItem('floodai-token');
  }
} catch (_) {
  savedUser = null;
}

let defaultStartPage = 'splash';
if (savedToken && savedUser && savedUser.role) {
  defaultStartPage = (savedUser.role === 'admin') ? 'admin-ops' : ((savedUser.role === 'analyst') ? 'analyst-predict' : 'resident-risk');
}

// 1. Lightweight Event Bus for Reactive UI Component Synchronization
const AppEvents = {
  _listeners: {},

  EVENTS: {
    LOCATION_CHANGED: 'app:location-changed',
    COASTAL_RADIUS_CHANGED: 'app:coastal-radius-changed',
    COASTAL_INTEL_UPDATED: 'app:coastal-intel-updated',
    ALERT_DISPATCHED: 'app:alert-dispatched',
    ALERT_RESOLVED: 'app:alert-resolved',
    SIMULATION_EXECUTED: 'app:simulation-executed',
    SIMULATION_ACKNOWLEDGED: 'app:simulation-acknowledged',
    SIMULATION_PREVIEW_CHANGED: 'app:sim-preview-changed',
    USER_AUTH_CHANGED: 'app:auth-changed',
    THEME_CHANGED: 'app:theme-changed',
    PREDICTION_UPDATED: 'app:prediction-updated',
    WEATHER_UPDATED: 'app:weather-updated',
    PAGE_CHANGED: 'app:page-changed',
    STATE_CHANGED: 'app:state-changed',
    FILTER_CHANGED: 'app:filter-changed',
  },

  on(event, callback) {
    if (typeof callback !== 'function') return () => {};
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event].push(callback);
    return () => this.off(event, callback);
  },

  off(event, callback) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(fn => fn !== callback);
  },

  emit(event, payload) {
    const list = this._listeners[event];
    if (Array.isArray(list)) {
      list.forEach(fn => {
        try {
          fn(payload);
        } catch (err) {
          console.error(`[AppEvents] Error in listener for "${event}":`, err);
        }
      });
    }
  }
};

if (typeof window !== 'undefined') {
  window.AppEvents = AppEvents;
}

// Global Application State (Backing Store)
const _rawState = {
  theme: localStorage.getItem('floodai-theme') || 'dark',
  accent: localStorage.getItem('floodai-accent') || 'ocean',
  language: localStorage.getItem('floodai-lang') || 'en',
  page: defaultStartPage, // Auto-routes to user role home screen if authenticated
  token: savedToken,
  user: savedUser,
  fcmToken: localStorage.getItem('floodai-fcm-token') || null,
  fcmPermission: (typeof Notification !== 'undefined') ? Notification.permission : 'unsupported',
  activeEngine: 'xgboost', // 'xgboost', 'random_forest', 'ensemble'
  apiHealthy: false,
  userLocation: null,
  userCoordinates: null, // [lat, lon]
  selectedDistrict: 'Chennai',
  locationAccuracyKm: null,
  coastalIntel: null,
  activeWeather: null,
  comparisonData: null,
  latestPrediction: null,
  latestThreatIntel: null,
  onboardingCompleted: localStorage.getItem('floodai-onboarding-completed') === 'true',
  sidebarCollapsed: localStorage.getItem('floodai-sidebar-collapsed') === 'true',
  consentAccepted: false,
  consentModalViewed: false,
};

// Reactive State Proxy: Automatically emits events whenever any property is assigned
const state = (typeof Proxy !== 'undefined') ? new Proxy(_rawState, {
  get(target, prop) {
    return target[prop];
  },
  set(target, prop, value) {
    const oldValue = target[prop];
    target[prop] = value;
    AppEvents.emit(`app:state:${String(prop)}`, { key: prop, value, oldValue });
    AppEvents.emit(AppEvents.EVENTS.STATE_CHANGED, { key: prop, value, oldValue });
    return true;
  }
}) : _rawState;

// State helper accessor & Reactive UI coordinator
const AppStore = {
  get(key) {
    return state[key];
  },
  set(key, value) {
    state[key] = value;
    return value;
  },
  update(patch) {
    if (patch && typeof patch === 'object') {
      Object.keys(patch).forEach(k => {
        state[k] = patch[k];
      });
    }
  },
  getState() {
    return _rawState;
  },

  /**
   * Subscribes to either a state property change ('userLocation') or an AppEvents channel ('app:location-changed')
   * Returns an unsubscribe function.
   */
  subscribe(eventOrKey, callback) {
    if (typeof callback !== 'function') return () => {};
    const channel = String(eventOrKey).startsWith('app:') ? eventOrKey : `app:state:${eventOrKey}`;
    return AppEvents.on(channel, callback);
  },

  /**
   * Reusable sequence counter factory to guard async operations against race conditions
   * Discards stale responses if a newer request was dispatched while earlier request was in-flight.
   */
  createAsyncSequenceGuard() {
    let currentSeq = 0;
    return {
      next() {
        return ++currentSeq;
      },
      isCurrent(seqId) {
        return seqId === currentSeq;
      },
      reset() {
        currentSeq++;
      }
    };
  },

  /**
   * Centralized location synchronizer: updates all dependent global coordinates,
   * active district variables, and emits the reactive LOCATION_CHANGED event.
   */
  syncLocation(locationData, source = 'manual') {
    if (!locationData) return;
    const lat = typeof locationData.lat === 'number' ? locationData.lat : locationData.latitude;
    const lon = typeof locationData.lon === 'number' ? locationData.lon : locationData.longitude;
    if (typeof lat !== 'number' || typeof lon !== 'number') return;

    const district = locationData.district || locationData.name || locationData.cityName || state.selectedDistrict || 'Chennai';
    const cityName = locationData.cityName || locationData.name || district;
    const stateName = locationData.state || locationData.stateName || null;
    const country = locationData.country || 'IN';

    state.userLocation = {
      lat,
      lon,
      cityName,
      district,
      stateName,
      country
    };
    const coordArr = [lat, lon];
    coordArr.lat = lat;
    coordArr.lon = lon;
    state.userCoordinates = coordArr;
    state.selectedDistrict = district;

    if (typeof portalSelectedDistrict !== 'undefined') {
      portalSelectedDistrict = district;
    }
    if (typeof predictInputs !== 'undefined') {
      predictInputs.district = district;
    }

    const payload = {
      status: 'located',
      district,
      cityName,
      stateName,
      country,
      lat,
      lon,
      coords: {
        lat,
        lon,
        accuracyMeters: locationData.accuracyMeters || 3000,
        timestamp: new Date().toISOString(),
        source,
        district,
        cityName,
        stateName,
        country,
        nearestDistrict: district,
        isGps: source === 'gps',
        isManual: source === 'manual',
        isCached: source === 'cached'
      },
      isGps: source === 'gps',
      isManual: source === 'manual'
    };

    AppEvents.emit(AppEvents.EVENTS.LOCATION_CHANGED, payload);

    if (typeof renderLocationHeaderWidget === 'function') {
      renderLocationHeaderWidget();
    }

    return payload;
  }
};

if (typeof window !== 'undefined') {
  window.AppStore = AppStore;
  window.state = state;
}

// Initial Theme & Accent Attribute Synchronization
if (typeof document !== 'undefined') {
  document.documentElement.classList.toggle('light', state.theme === 'light');
  document.documentElement.setAttribute('data-accent', state.accent || 'ocean');
}

// Predict Inputs State
let predictInputs = {};
if (typeof FEATURE_META !== 'undefined') {
  Object.keys(FEATURE_META).forEach(k => predictInputs[k] = FEATURE_META[k].def);
  predictInputs.cyclone = 0;
  predictInputs.district = 'Chennai';
}

// Portal Selected District State
let portalSelectedDistrict = 'Chennai';
