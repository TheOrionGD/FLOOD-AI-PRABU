/* ===========================================================
   FloodAI — Configuration & Constants
   =========================================================== */

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : '/api';

const VAPID_PUBLIC_KEY = 'BN3I8ZCETqIkTnDgFJtECjU1GRpm07PbxY9HQBNhhwhwqZxdZ1eyPwrGGqj_NEeldaqbW-H1IUo_JEFAbqVfzw8';

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCbk9iP9HPq4PhGqGLMHmv03OvUbh7rgfM",
  authDomain: "floodai-24a0f.firebaseapp.com",
  projectId: "floodai-24a0f",
  storageBucket: "floodai-24a0f.firebasestorage.app",
  messagingSenderId: "552262034830",
  appId: "1:552262034830:web:2acedc1e393a34f6be30df"
};

const FEATURE_META = {
  rainfall_mm: { label: 'Rainfall', unit: 'mm', min: 0, max: 900, def: 120 },
  river_level_m: { label: 'River Level', unit: 'm', min: 0.5, max: 14, def: 5 },
  sea_level_m: { label: 'Sea Level', unit: 'm', min: 0.5, max: 3.5, def: 1.6 },
  temperature_c: { label: 'Temperature', unit: '°C', min: 12, max: 45, def: 29 },
  humidity_pct: { label: 'Humidity', unit: '%', min: 20, max: 100, def: 65 },
  wind_speed_kmh: { label: 'Wind Speed', unit: 'km/h', min: 2, max: 140, def: 22 },
  soil_moisture_pct: { label: 'Soil Moisture', unit: '%', min: 5, max: 100, def: 40 },
  reservoir_level_pct: { label: 'Reservoir Level', unit: '%', min: 5, max: 100, def: 60 },
  elevation_m: { label: 'Elevation', unit: 'm', min: 0, max: 1200, def: 30 },
  distance_from_coast_km: { label: 'Distance from Coast', unit: 'km', min: 0, max: 600, def: 40 },
  population_density: { label: 'Population Density', unit: '/km²', min: 50, max: 30000, def: 4000 },
  forest_cover_pct: { label: 'Forest Cover', unit: '%', min: 0, max: 90, def: 28 },
  drainage_score: { label: 'Drainage Quality', unit: '/100', min: 5, max: 100, def: 55 },
};

const FEATURE_DIRECTION = {
  rainfall_mm: 1, river_level_m: 1, sea_level_m: 1, temperature_c: 0.15, humidity_pct: 0.3,
  wind_speed_kmh: 0.3, soil_moisture_pct: 1, reservoir_level_pct: 1, elevation_m: -1,
  distance_from_coast_km: -1, population_density: 0.2, forest_cover_pct: -1, drainage_score: -1, cyclone: 1
};

const ROUTE_POLICIES = {
  // Public Experience (Layout A)
  splash: {
    title: 'Welcome',
    isPublic: true,
    layout: 'public',
    requiredRoles: [],
    description: 'System initialization and dynamic environmental check.'
  },
  onboarding: {
    title: 'Platform Tour',
    isPublic: true,
    layout: 'public',
    requiredRoles: [],
    description: 'Seven-screen guided immersion into FloodAI intelligence capabilities.'
  },
  landing: {
    title: 'Platform Story',
    isPublic: true,
    layout: 'public',
    requiredRoles: [],
    description: 'Immersive scroll-driven architectural and threat intelligence storytelling.'
  },
  home: {
    title: 'Overview',
    isPublic: true,
    layout: 'saas',
    requiredRoles: [],
    description: 'System-wide hazard summary, persona gateway, and national radar index.'
  },
  login: {
    title: 'SaaS Authentication',
    isPublic: true,
    layout: 'public',
    requiredRoles: [],
    description: 'Secure enterprise split login with mandatory legal consent verification.'
  },
  terms: {
    title: 'Terms and Conditions',
    isPublic: true,
    layout: 'public',
    requiredRoles: [],
    description: 'Authorized terms of use, civil defense disclaimers, and service commitments.'
  },
  privacy: {
    title: 'Privacy Policy',
    isPublic: true,
    layout: 'public',
    requiredRoles: [],
    description: 'Data telemetry handling, cryptographic isolation, and personal location rights.'
  },

  // Authenticated Cross-Role Pages (Layout B)
  profile: {
    title: 'Operator Profile',
    isPublic: false,
    layout: 'saas',
    requiredRoles: ['resident', 'user', 'analyst', 'admin'],
    description: 'Account identity, multi-language localization, theme and 7-accent styling.'
  },
  settings: {
    title: 'System Preferences',
    isPublic: false,
    layout: 'saas',
    requiredRoles: ['resident', 'user', 'analyst', 'admin'],
    description: 'Comprehensive 8-category preferences engine with persistent cloud synchronization.'
  },

  // Admin Workspace (5 Dedicated Screens)
  'admin-ops': {
    title: 'Platform Operations Overview',
    isPublic: false,
    layout: 'saas',
    requiredRoles: ['admin'],
    roleGroup: 'admin',
    description: 'Aggregated service telemetry, memory utilization, and dependency status.'
  },
  'admin-users': {
    title: 'User & Role Administration',
    isPublic: false,
    layout: 'saas',
    requiredRoles: ['admin'],
    roleGroup: 'admin',
    description: 'Cryptographic user directory, clearance management, and role promotion.'
  },
  'admin-config': {
    title: 'System Configuration',
    isPublic: false,
    layout: 'saas',
    requiredRoles: ['admin'],
    roleGroup: 'admin',
    description: 'Dynamic operational boundaries, dispatch channels, and rate limits.'
  },
  'admin-alerts': {
    title: 'Alert Operations Center',
    isPublic: false,
    layout: 'saas',
    requiredRoles: ['admin'],
    roleGroup: 'admin',
    description: 'Disaster advisory dispatch logs, channel delivery health, and broadcast controls.'
  },
  'admin-audit': {
    title: 'Audit & Activity Explorer',
    isPublic: false,
    layout: 'saas',
    requiredRoles: ['admin'],
    roleGroup: 'admin',
    description: 'Searchable administrative log, timestamped audit events, and compliance trail.'
  },

  // Analyst Workspace (5 Dedicated Screens)
  'analyst-predict': {
    title: 'Prediction Workspace',
    isPublic: false,
    layout: 'saas',
    requiredRoles: ['analyst', 'admin'],
    roleGroup: 'analyst',
    description: 'Dual ML inference workbench for XGBoost & Random Forest parameter simulation.'
  },
  'analyst-shap': {
    title: 'Model Explainability Explorer',
    isPublic: false,
    layout: 'saas',
    requiredRoles: ['analyst', 'admin'],
    roleGroup: 'analyst',
    description: 'SHAP tree explainer feature importance breakdown and attribution vectors.'
  },
  'analyst-comparison': {
    title: 'District Risk Comparison Matrix',
    isPublic: false,
    layout: 'saas',
    requiredRoles: ['analyst', 'admin'],
    roleGroup: 'analyst',
    description: 'Comparative hazard matrices across 10 monitored high-density geographic sectors.'
  },
  'analyst-history': {
    title: 'Model Evaluation Log',
    isPublic: false,
    layout: 'saas',
    requiredRoles: ['analyst', 'admin'],
    roleGroup: 'analyst',
    description: 'Historical prediction audit log with engine filters and confidence distribution.'
  },
  'analyst-threat': {
    title: 'Tactical Threat Synthesis',
    isPublic: false,
    layout: 'saas',
    requiredRoles: ['analyst', 'admin'],
    roleGroup: 'analyst',
    description: 'Multi-factor threat detection pipeline fusing Groq AI with live weather.'
  },

  // Resident Workspace (5 Dedicated Screens)
  'resident-risk': {
    title: 'My Proximity Risk Overview',
    isPublic: false,
    layout: 'saas',
    requiredRoles: ['resident', 'user', 'analyst', 'admin'],
    roleGroup: 'resident',
    description: 'Hyper-local flood susceptibility index, safe elevation margins, and live risk rating.'
  },
  'resident-weather': {
    title: 'Hyper-local Weather & Hydro',
    isPublic: false,
    layout: 'saas',
    requiredRoles: ['resident', 'user', 'analyst', 'admin'],
    roleGroup: 'resident',
    description: 'Real-time precipitation telemetry, humidity, atmospheric pressure, and radar feeds.'
  },
  'resident-alerts': {
    title: 'Emergency Advisories & Siren Station',
    isPublic: false,
    layout: 'saas',
    requiredRoles: ['resident', 'user', 'analyst', 'admin'],
    roleGroup: 'resident',
    description: 'Localized civil-defense warning broadcast receiver and emergency acoustic station.'
  },
  'resident-guide': {
    title: 'Disaster Preparedness Handbook',
    isPublic: false,
    layout: 'saas',
    requiredRoles: ['resident', 'user', 'analyst', 'admin'],
    roleGroup: 'resident',
    description: 'Essential survival guidance, shelter locator, emergency contacts, and go-bag checklists.'
  },
  'resident-activity': {
    title: 'Saved Locations & Reports',
    isPublic: false,
    layout: 'saas',
    requiredRoles: ['resident', 'user', 'analyst', 'admin'],
    roleGroup: 'resident',
    description: 'Personalized district bookmark manager and historical risk assessments.'
  },
  'resident-radar': {
    title: '1,000km Live Flood Detection Radar',
    isPublic: false,
    layout: 'saas',
    requiredRoles: ['resident', 'user', 'analyst', 'admin'],
    roleGroup: 'resident',
    description: 'Synoptic 1,000km radial perimeter flood detection from live GPS coordinates.'
  },
  'resident-simulation': {
    title: 'Flood Alert Simulation & Notification Testing',
    isPublic: false,
    layout: 'saas',
    requiredRoles: ['resident', 'user', 'analyst', 'admin'],
    roleGroup: 'resident',
    description: 'Safe simulation workspace testing multi-channel alert delivery (acoustic siren, Brevo email, SMS, and Firebase Web Push) strictly isolated from live emergency broadcasts.'
  },

  // Preserved Existing Operational Modules
  portal: {
    title: 'Resident Portal',
    isPublic: false,
    layout: 'saas',
    requiredRoles: ['resident', 'user', 'analyst', 'admin'],
    description: 'Personalized district intelligence, safety perimeter, and emergency evacuation routing.'
  },
  command: {
    title: 'Threat Command',
    isPublic: false,
    layout: 'saas',
    requiredRoles: ['analyst', 'admin'],
    description: 'Operational threat detection, emergency SOS broadcasts, and tactical civil defense directives.'
  },
  map: {
    title: 'Geospatial GIS',
    isPublic: true,
    layout: 'saas',
    requiredRoles: [],
    description: 'Interactive geospatial district inundation layers and radar telemetry.'
  },
  predict: {
    title: 'AI Risk Lab',
    isPublic: false,
    layout: 'saas',
    requiredRoles: ['user', 'analyst', 'admin'],
    description: 'Dual ML inference engine and SHAP explainability attribution lab.'
  },
  weather: {
    title: 'Live Telemetry',
    isPublic: false,
    layout: 'saas',
    requiredRoles: ['user', 'analyst', 'admin'],
    description: 'Live atmospheric sensor streams, radar integration, and precipitation forecast.'
  },
  dashboard: {
    title: 'MLOps Benchmarks',
    isPublic: false,
    layout: 'saas',
    requiredRoles: ['analyst', 'admin'],
    description: 'Model performance matrices, confusion matrices, and historical database management.'
  },
  analytics: {
    title: 'Climate Trends',
    isPublic: true,
    layout: 'saas',
    requiredRoles: [],
    description: '24-year aggregated climate trends and district risk summaries from MongoDB Atlas.'
  },
  records: {
    title: 'Historical Records',
    isPublic: true,
    layout: 'saas',
    requiredRoles: [],
    description: 'Explore, search, filter, paginate, and manage 10,000 real ground-truth disaster records.'
  },
  alerts: {
    title: 'Emergency Alerts & Siren',
    isPublic: true,
    layout: 'saas',
    requiredRoles: [],
    description: 'Acoustic siren synthesizer, live alert levels, SOS broadcasting & relief centers.'
  },
};

const PAGES = [
  // Public
  ['landing', 'Platform Story', '🌊', 'Scroll-driven intelligence and dual-model architecture', 'public'],
  ['home', 'Overview', '🏠', 'Situational hazard overview & national radar index', 'public'],
  ['map', 'Geospatial GIS', '🗺️', 'Interactive GeoJSON boundaries & live radar layers', 'public'],
  ['records', 'Historical Records', '📚', '10,000 empirical ground-truth disaster catalog', 'public'],
  ['analytics', 'Climate Trends', '📈', '24-year climate records from MongoDB Atlas', 'public'],
  ['alerts', 'Emergency Alerts & Siren', '🚨', 'Acoustic siren synthesizer, live alert levels & broadcast', 'public'],

  // Admin Workspace (5 New Screens)
  ['admin-ops', 'Platform Operations', '⚡', 'Real-time telemetry, service health & memory monitoring', 'admin'],
  ['admin-users', 'User Administration', '👥', 'RBAC directory, role promotions & permission controls', 'admin'],
  ['admin-config', 'System Configuration', '⚙️', 'Operational boundaries, rate limits & alert rules', 'admin'],
  ['admin-alerts', 'Alert Operations', '🚨', 'Broadcast dispatch logs, channel health & resolution', 'admin'],
  ['admin-audit', 'Audit Explorer', '🛡️', 'Searchable compliance trail, event logs & actors', 'admin'],

  // Analyst Workspace (5 New Screens)
  ['analyst-predict', 'Prediction Workbench', '🧪', 'XGBoost & Random Forest multi-factor simulation', 'analyst'],
  ['analyst-shap', 'SHAP Attribution', '📊', 'Deep feature attribution and positive/negative drivers', 'analyst'],
  ['analyst-comparison', 'District Risk Matrix', '📑', 'Comparative risk matrix across 10 monitored sectors', 'analyst'],
  ['analyst-history', 'Model Evaluation Log', '📜', 'Historical prediction logs & model accuracy audit', 'analyst'],
  ['analyst-threat', 'Tactical Threat Intel', '🎯', 'Multi-factor threat detection pipeline & Groq AI', 'analyst'],

  // Resident Workspace (5 New Screens)
  ['resident-risk', 'My Location Risk', '📍', 'Local hazard index, safe elevation margins & ratings', 'resident'],
  ['resident-weather', 'Local Weather & Hydro', '🌦️', 'Hyper-local precipitation telemetry & radar feeds', 'resident'],
  ['resident-alerts', 'Emergency Advisories', '📢', 'Localized civil-defense warnings & acoustic station', 'resident'],
  ['resident-guide', 'Preparedness Handbook', '📖', 'Evacuation protocols, go-bag checklists & shelters', 'resident'],
  ['resident-activity', 'Saved Locations', '⭐', 'Monitored sector bookmarks & quick risk checks', 'resident'],
  ['resident-radar', '1,000km Live Radar', '📡', 'Synoptic 1000km radial perimeter flood detection from GPS', 'resident'],

  // Preserved Operational Screens
  ['portal', 'Resident Portal', '🛡️', 'Personal flood risk, safe routes & local shelters', 'operational'],
  ['command', 'Threat Command', '⚡', 'Automated threat detection & multi-channel dispatches', 'operational'],
  ['predict', 'AI Risk Lab', '🧪', 'XGBoost / Random Forest inference & SHAP explainability', 'operational'],
  ['weather', 'Live Telemetry', '🛰️', 'Real-time satellite feeds & precipitation telemetry', 'operational'],
  ['dashboard', 'MLOps Benchmarks', '📊', 'Dual-model comparison, confusion matrix & metrics', 'operational'],

  // Utilities
  ['profile', 'Operator Profile', '👤', 'Identity, language, theme & 7-accent color customization', 'utility'],
  ['settings', 'System Preferences', '🛠️', '8-category preferences engine & persistent cloud sync', 'utility'],
  ['terms', 'Terms & Conditions', '📄', 'Authorized terms of use & civil defense notices', 'legal'],
  ['privacy', 'Privacy Policy', '🔒', 'Data telemetry handling & cryptographic isolation', 'legal'],
];

/**
 * Filter pages strictly by user role and authentication status.
 * Screens requiring different or higher user roles are NEVER mentioned or displayed.
 */
function getAccessiblePages() {
  return PAGES.filter(([id]) => {
    if (typeof checkRouteAccess === 'function') {
      const check = checkRouteAccess(id);
      return check.allowed;
    }
    const policy = ROUTE_POLICIES[id];
    if (!policy) return true;
    if (policy.isPublic) return true;
    if (!state.user || !state.token) return false;

    const rawRole = (state.user?.role || 'resident').toLowerCase();
    const effectiveRoles = [rawRole];
    if (rawRole === 'resident' || rawRole === 'user') {
      effectiveRoles.push('resident', 'user');
    } else if (rawRole === 'analyst') {
      effectiveRoles.push('analyst', 'resident', 'user');
    } else if (rawRole === 'admin') {
      effectiveRoles.push('admin', 'analyst', 'resident', 'user');
    }

    if (policy.requiredRoles && policy.requiredRoles.length > 0) {
      return policy.requiredRoles.some(reqRole => effectiveRoles.includes(reqRole.toLowerCase()));
    }
    return true;
  });
}

if (typeof window !== 'undefined') {
  window.ROUTE_POLICIES = ROUTE_POLICIES;
  window.getAccessiblePages = getAccessiblePages;
}
if (typeof global !== 'undefined') {
  global.ROUTE_POLICIES = ROUTE_POLICIES;
  global.getAccessiblePages = getAccessiblePages;
}


