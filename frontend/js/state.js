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
