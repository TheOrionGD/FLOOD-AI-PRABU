/* ===========================================================
   FloodAI — Global Reactive State & Data Stores
   =========================================================== */

// Dynamic Data Stores Ingested from MongoDB Atlas & Active ML Microservice
let DISTRICTS = [];
let YEARLY = [];
let FLOOD_STATS = null;
let MODEL_METRICS = null;
let isDataBootstrapped = false;
let dataBootstrapPromise = null;

let savedUser = null;
try {
  savedUser = JSON.parse(localStorage.getItem('floodai-user') || 'null');
} catch (_) {}

let savedToken = localStorage.getItem('floodai-token') || null;
let defaultStartPage = 'splash';
if (savedToken && savedUser && savedUser.role) {
  defaultStartPage = (savedUser.role === 'admin') ? 'admin-ops' : ((savedUser.role === 'analyst') ? 'analyst-predict' : 'resident-risk');
}

// Global Application State
let state = {
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
  locationAccuracyKm: null,
  comparisonData: null,
  latestPrediction: null,
  latestThreatIntel: null,
  onboardingCompleted: localStorage.getItem('floodai-onboarding-completed') === 'true',
  sidebarCollapsed: localStorage.getItem('floodai-sidebar-collapsed') === 'true',
  consentAccepted: false,
  consentModalViewed: false,
};

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
