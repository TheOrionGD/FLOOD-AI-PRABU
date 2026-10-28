/**
 * profileView.js
 * Dedicated Operator Profile & Customization Screen
 * Features:
 *  - Profile identity (avatar, display name, email, role, phone verification)
 *  - 1,000km Live Flood Detection Sentinel Callout & Quick Gateway
 *  - Comprehensive Personal & Household Disaster Data:
 *      * Full Name, Age, Gender, DOB, Phone number, Email
 *      * Locality, Ward, Address, District/City, State, Pincode, GPS Telemetry
 *      * Elevation, Floor Level (Ground floor = High Risk), Household Occupants
 *      * Mobility & Special Medical Assistance Needs
 *      * Emergency Contact Name, Relationship, Phone
 *      * Primary Evacuation Shelter Landmark
 *  - Operational Role & Auto-Configured Workspace Selection (Admin, Analyst, Resident)
 *  - Theme Toggle (Dark / Light)
 *  - EXACTLY 7 Selectable Accent Colour Themes with live preview:
 *      1. Ocean Cyan, 2. Electric Blue, 3. Emerald, 4. Violet, 5. Amber, 6. Coral, 7. Rose
 *  - Regional Language Selector (EN, HI, TA, BN, ES, FR)
 *  - Sign-out and session revocation action
 */

const ACCENT_PRESETS = [
  { id: 'ocean', name: 'Ocean Cyan', hex: '#33C7FF', secHex: '#1FE0A8' },
  { id: 'electric', name: 'Electric Blue', hex: '#3B82F6', secHex: '#60A5FA' },
  { id: 'emerald', name: 'Emerald', hex: '#10B981', secHex: '#34D399' },
  { id: 'violet', name: 'Violet', hex: '#8B5CF6', secHex: '#C084FC' },
  { id: 'amber', name: 'Amber', hex: '#F59E0B', secHex: '#FBBF24' },
  { id: 'coral', name: 'Coral', hex: '#F97316', secHex: '#FB923C' },
  { id: 'rose', name: 'Rose', hex: '#F43F5E', secHex: '#FB7185' },
];

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English (US / Global)', native: 'English' },
  { code: 'hi', name: 'Hindi (हिंदी)', native: 'हिंदी' },
  { code: 'ta', name: 'Tamil (தமிழ்)', native: 'தமிழ்' },
  { code: 'bn', name: 'Bengali (বাংলা)', native: 'বাংলা' },
  { code: 'es', name: 'Spanish (Español)', native: 'Español' },
  { code: 'fr', name: 'French (Français)', native: 'Français' },
];

function getPersonalProfile() {
  try {
    const raw = localStorage.getItem('floodai-personal-profile');
    if (raw) return JSON.parse(raw);
  } catch (_) {}

  // Derive live location defaults from GeoLocationService coords (set by header GPS / manual pick)
  const geo = (typeof GeoLocationService !== 'undefined' && GeoLocationService.coords) ? GeoLocationService.coords : null;
  const liveLocality = geo?.locality || geo?.cityName || geo?.district || state.userLocation?.cityName || state.userLocation?.district || '';
  const liveCity     = geo?.district || geo?.cityName || state.userLocation?.district || '';
  const liveState    = geo?.stateName || '';
  const liveLat      = geo?.lat || state.userLocation?.lat || '';
  const liveLon      = geo?.lon || state.userLocation?.lon || '';

  return {
    fullName:  state.user?.name || state.user?.displayName || '',
    age:       '',
    gender:    '',
    dob:       '',
    phone:     state.user?.phone || '',
    phoneVerified: !!(state.user?.phone),
    email:     state.user?.email || '',
    locality:  liveLocality,
    address:   '',
    city:      liveCity,
    state:     liveState,
    pincode:   '',
    elevation: '',
    lat:       liveLat ? String(liveLat) : '',
    lon:       liveLon ? String(liveLon) : '',
    floorLevel: 'ground',
    familyCount: '',
    childrenCount: '',
    seniorCount: '',
    medicalAssistance: 'none',
    emergencyContactName: '',
    emergencyContactRelation: '',
    emergencyPhone: '',
    primaryShelter: '',
    alertSms: true,
    alertPush: true,
    alertEmail: true,
    alertSiren: true
  };
}

function renderProfile(root) {
  const user = state.user || {
    displayName: 'Guest Operator',
    email: 'guest@floodai.org',
    role: 'resident',
    phone: null,
    phoneVerified: false,
  };

  const personal = getPersonalProfile();
  const currentAccent = state.accent || 'ocean';
  const currentLang = state.language || 'en';

  root.innerHTML = `
    <div class="saas-page-container" style="max-width:1040px;">
      
      <!-- Top Title -->
      <div style="margin-bottom:28px;">
        <span class="story-tag" style="color:var(--accent-primary); border-color:rgba(51,199,255,0.3); background:rgba(51,199,255,0.1);">
          OPERATOR CLEARANCE &amp; RESILIENCE PROFILE
        </span>
        <h1 style="font-family:var(--font-display); font-size:clamp(1.8rem, 3vw, 2.4rem); font-weight:800; margin-top:6px;">
          Operator Profile &amp; Customization
        </h1>
        <p style="font-size:14px; color:var(--text-secondary); max-width:820px; line-height:1.6;">
          Configure your personal identity, residential flood vulnerability parameters, 1,000km radial sentinel telemetry, operational role clearance, and 7 accent themes.
        </p>
      </div>

      <!-- Identity Card -->
      <div class="glass-card elevated border-lightning" style="padding:28px 32px; margin-bottom:28px;">
        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:20px;">
          <div style="display:flex; align-items:center; gap:20px;">
            <div style="width:72px; height:72px; border-radius:50%; background:linear-gradient(135deg, var(--accent-primary), var(--accent-secondary)); display:grid; place-items:center; font-size:28px; font-weight:700; color:var(--text-inverse); box-shadow:0 0 24px var(--accent-glow);">
              ${escapeHtml((personal.fullName || user.displayName || 'U').charAt(0).toUpperCase())}
            </div>
            <div>
              <div style="display:flex; align-items:center; gap:10px;">
                <h2 style="font-size:22px; font-weight:700; margin:0;">${escapeHtml(personal.fullName || user.displayName || 'Operator')}</h2>
                <span class="glass-badge" style="background:${user.role === 'admin' ? 'rgba(255,77,106,0.18)' : (user.role === 'analyst' ? 'rgba(51,199,255,0.18)' : 'rgba(31,224,168,0.18)')}; color:${user.role === 'admin' ? 'var(--red)' : (user.role === 'analyst' ? 'var(--accent-primary)' : 'var(--ocean)')}; font-family:var(--font-mono); font-size:11px;">
                  ● ${(user.role || 'resident').toUpperCase()} CLEARANCE
                </span>
              </div>
              <div style="font-family:var(--font-mono); font-size:13px; color:var(--text-muted); margin-top:4px;">
                ${escapeHtml(personal.email || user.email)}
              </div>
              <div style="font-size:12px; color:var(--text-secondary); margin-top:6px; display:flex; align-items:center; gap:12px;">
                <span>Phone: <b>${escapeHtml(personal.phone || user.phone || 'Not configured')}</b></span>
                <span style="font-size:11px; color:${personal.phoneVerified ? 'var(--ocean)' : 'var(--amber)'}; font-family:var(--font-mono);">
                  ${personal.phoneVerified ? '✓ Emergency SMS Active' : '○ Unverified'}
                </span>
                <span>•</span>
                <span>Locality: <b>${escapeHtml(personal.locality || 'Chennai Basin')}</b></span>
              </div>
            </div>
          </div>

          <div style="display:flex; gap:10px;">
            <button class="glass-btn btn-primary" onclick="goTo('resident-radar')" style="font-size:12.5px; padding:8px 18px; gap:8px;">
              <span>📡 1,000km Live Radar</span> →
            </button>
            <button class="glass-btn btn-ghost" onclick="logout()" style="color:var(--red); border-color:rgba(255,77,106,0.3); font-size:12.5px;">
              Sign Out ⎋
            </button>
          </div>
        </div>
      </div>

      <!-- CORE SENTINEL CALLOUT: 1,000KM LIVE FLOOD DETECTION RADAR -->
      <div class="glass-card elevated border-lightning" style="padding:28px 32px; margin-bottom:28px; background:linear-gradient(135deg, rgba(7, 21, 34, 0.9), rgba(18, 42, 65, 0.75)); position:relative; overflow:hidden;">
        
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:20px; position:relative; z-index:2;">
          <div style="max-width:640px;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
              <span class="hud-beacon"></span>
              <span style="font-family:var(--font-mono); font-size:11px; color:var(--cyber); letter-spacing:1px; text-transform:uppercase; font-weight:700;">
                CORE SYSTEM CAPABILITY // 1,000 KM SURROUNDING SCAN
              </span>
            </div>
            
            <h3 style="font-size:22px; font-weight:800; font-family:var(--font-display); margin:0 0 10px 0; color:var(--text-0);">
              Live Flood Detection from Your Current Location to 1,000km Radius
            </h3>
            
            <p style="font-size:13.5px; color:var(--text-secondary); line-height:1.6; margin:0 0 14px 0;">
              FloodAI connects to satellite radar and upstream river sensors to scan atmospheric weather systems, upstream dam spillway surges, and cyclone tracks heading toward your coordinates from up to 1,000 km away.
            </p>

            <div style="display:flex; gap:16px; font-family:var(--font-mono); font-size:11.5px; color:var(--text-muted); flex-wrap:wrap;">
              <span>Radius: <b style="color:var(--cyber);">1,000 km</b></span>
              <span>•</span>
              <span>Coverage: <b style="color:var(--ocean);">4 Radial Tiers (50km, 250km, 500km, 1000km)</b></span>
              <span>•</span>
              <span>Lead Time: <b style="color:var(--accent-tertiary, #B18CFF);">Multi-Hour Early Warnings</b></span>
            </div>
          </div>

          <div>
            <button class="glass-btn btn-primary" onclick="goTo('resident-radar')" style="padding:14px 28px; font-size:14px; font-weight:700; box-shadow:0 0 28px var(--accent-glow); gap:10px;">
              <span>Launch 1,000km Live Radar Sentinel</span> →
            </button>
          </div>
        </div>
      </div>

      <!-- COMPREHENSIVE PERSONAL DATA & FLOOD RESILIENCE SECTION -->
      <div class="glass-card elevated border-lightning" style="padding:32px; margin-bottom:28px;">
        
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:12px; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:16px;">
          <div>
            <h3 style="font-size:20px; font-weight:700; margin:0 0 4px 0; display:flex; align-items:center; gap:8px;">
              <span>📋</span> Personal &amp; Residential Disaster Profile
            </h3>
            <p style="font-size:13px; color:var(--text-secondary); margin:0;">
              Accurate personal, locality, and household parameters allow FloodAI to calculate your precise inundation vulnerability index.
            </p>
          </div>
          <button class="glass-btn btn-primary" onclick="savePersonalProfile()" style="font-size:13px; padding:8px 22px; gap:8px;">
            <span>💾 Save Profile Information</span>
          </button>
        </div>

        <!-- SECTION A: Personal Identity & Contact Information -->
        <div style="margin-bottom:28px;">
          <div style="font-family:var(--font-mono); font-size:11px; text-transform:uppercase; letter-spacing:1px; color:var(--accent-primary); font-weight:700; margin-bottom:14px;">
            1. Personal Identity &amp; Contact Details
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:16px;">
            <div class="field">
              <label>Full Legal Name</label>
              <input type="text" id="profFullName" class="glass-input" value="${escapeHtml(personal.fullName)}" placeholder="e.g. Godfrey Prabakaran">
            </div>

            <div class="field">
              <label>Age</label>
              <input type="number" id="profAge" class="glass-input" value="${escapeHtml(personal.age)}" placeholder="e.g. 28" min="1" max="120">
            </div>

            <div class="field">
              <label>Date of Birth</label>
              <input type="date" id="profDob" class="glass-input" value="${escapeHtml(personal.dob)}">
            </div>

            <div class="field">
              <label>Gender / Identity</label>
              <select id="profGender" class="glass-select">
                <option value="male" ${personal.gender === 'male' ? 'selected' : ''}>Male</option>
                <option value="female" ${personal.gender === 'female' ? 'selected' : ''}>Female</option>
                <option value="nonbinary" ${personal.gender === 'nonbinary' ? 'selected' : ''}>Non-Binary / Other</option>
                <option value="prefer_not" ${personal.gender === 'prefer_not' ? 'selected' : ''}>Prefer not to say</option>
              </select>
            </div>

            <div class="field">
              <label>Phone Number (Emergency SMS)</label>
              <input type="tel" id="profPhone" class="glass-input" value="${escapeHtml(personal.phone)}" placeholder="+91 98401 55678">
            </div>

            <div class="field">
              <label>Email Address</label>
              <input type="email" id="profEmail" class="glass-input" value="${escapeHtml(personal.email)}" placeholder="name@domain.com">
            </div>
          </div>
        </div>

        <!-- SECTION B: Locality & Cadastral Geography -->
        <div style="margin-bottom:28px; border-top:1px solid rgba(255,255,255,0.06); padding-top:22px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:8px;">
            <div style="font-family:var(--font-mono); font-size:11px; text-transform:uppercase; letter-spacing:1px; color:var(--accent-primary); font-weight:700;">
              2. Locality, Neighborhood &amp; Cadastral Location
            </div>
            <button class="glass-btn btn-ghost" onclick="acquireDeviceGpsForProfile()" style="font-size:11.5px; padding:6px 14px; gap:6px;">
              <span>📍 Acquire Live GPS Fix</span>
            </button>
          </div>

          <!-- GPS Lock Status Badge (shown/updated after GPS fix) -->
          <div id="profGpsCoordsBadge" style="display:${personal.lat ? 'flex' : 'none'}; align-items:center; gap:10px; padding:8px 14px; border-radius:10px; background:rgba(31,224,168,0.08); border:1px solid rgba(31,224,168,0.25); margin-bottom:14px;">
            <span style="font-size:14px;">🛰️</span>
            <span style="font-family:var(--font-mono); font-size:11.5px; color:var(--ocean);">
              ${personal.lat ? `GPS LOCKED: ${parseFloat(personal.lat).toFixed(5)}°N, ${parseFloat(personal.lon||0).toFixed(5)}°E` : ''}
            </span>
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:16px;">
            <div class="field" style="grid-column: span 2;">
              <label>Locality / Neighborhood / Ward</label>
              <input type="text" id="profLocality" class="glass-input" value="${escapeHtml(personal.locality)}" placeholder="Tap 'Acquire Live GPS Fix' or type manually">
            </div>

            <div class="field" style="grid-column: span 2;">
              <label>Street Address / Apartment</label>
              <input type="text" id="profAddress" class="glass-input" value="${escapeHtml(personal.address)}" placeholder="e.g. 42, Station Road, Near Bus Stand">
            </div>

            <div class="field">
              <label>District / Municipal City</label>
              <input type="text" id="profCity" class="glass-input" value="${escapeHtml(personal.city)}" placeholder="Auto-filled from GPS or type manually">
            </div>

            <div class="field">
              <label>State / Province</label>
              <input type="text" id="profState" class="glass-input" value="${escapeHtml(personal.state)}" placeholder="Auto-filled from GPS or type manually">
            </div>

            <div class="field">
              <label>Postal PIN Code</label>
              <input type="text" id="profPincode" class="glass-input" value="${escapeHtml(personal.pincode)}" placeholder="e.g. 621601">
            </div>

            <div class="field">
              <label>Ground Elevation (MSL)</label>
              <input type="text" id="profElevation" class="glass-input" value="${escapeHtml(personal.elevation)}" placeholder="Auto-filled or e.g. 67m">
            </div>

            <div class="field">
              <label>GPS Latitude (decimal)</label>
              <input type="text" id="profLat" class="glass-input" value="${escapeHtml(personal.lat)}" placeholder="Auto-filled on GPS fix" readonly style="opacity:0.75; cursor:default;">
            </div>

            <div class="field">
              <label>GPS Longitude (decimal)</label>
              <input type="text" id="profLon" class="glass-input" value="${escapeHtml(personal.lon)}" placeholder="Auto-filled on GPS fix" readonly style="opacity:0.75; cursor:default;">
            </div>
          </div>
        </div>

        <!-- SECTION C: Household Flood Vulnerability Parameters -->
        <div style="margin-bottom:28px; border-top:1px solid rgba(255,255,255,0.06); padding-top:22px;">
          <div style="font-family:var(--font-mono); font-size:11px; text-transform:uppercase; letter-spacing:1px; color:var(--accent-primary); font-weight:700; margin-bottom:14px;">
            3. Household Flood Resilience &amp; Vulnerability Factors
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:16px;">
            <div class="field">
              <label>Residence Floor Level</label>
              <select id="profFloorLevel" class="glass-select">
                <option value="basement" ${personal.floorLevel === 'basement' ? 'selected' : ''}>Basement Floor (-1) — Severe Inundation Vulnerability</option>
                <option value="ground" ${personal.floorLevel === 'ground' ? 'selected' : ''}>Ground Floor (0) — High Inundation Risk</option>
                <option value="first" ${personal.floorLevel === 'first' ? 'selected' : ''}>1st Floor (+1) — Moderate Surcharge Risk</option>
                <option value="second" ${personal.floorLevel === 'second' ? 'selected' : ''}>2nd Floor (+2) — Safe Elevation Margin</option>
                <option value="third_plus" ${personal.floorLevel === 'third_plus' ? 'selected' : ''}>3rd+ Floor (+3) — Upper Safety Shelter</option>
              </select>
            </div>

            <div class="field">
              <label>Total Household Occupants</label>
              <input type="number" id="profFamilyCount" class="glass-input" value="${escapeHtml(personal.familyCount)}" min="1" max="30">
            </div>

            <div class="field">
              <label>Children (Under 12)</label>
              <input type="number" id="profChildrenCount" class="glass-input" value="${escapeHtml(personal.childrenCount)}" min="0" max="15">
            </div>

            <div class="field">
              <label>Senior Citizens (65+)</label>
              <input type="number" id="profSeniorCount" class="glass-input" value="${escapeHtml(personal.seniorCount)}" min="0" max="15">
            </div>

            <div class="field" style="grid-column: span 2;">
              <label>Special Mobility or Medical Assistance Needs</label>
              <select id="profMedicalAssistance" class="glass-select">
                <option value="none" ${personal.medicalAssistance === 'none' ? 'selected' : ''}>None — Independent ambulatory evacuation capability</option>
                <option value="mobility" ${personal.medicalAssistance === 'mobility' ? 'selected' : ''}>Mobility Assistance Needed (Wheelchair / Stretcher / Walker)</option>
                <option value="critical" ${personal.medicalAssistance === 'critical' ? 'selected' : ''}>Critical Medical Dependence (Oxygen Concentrator / Dialysis / Bedridden)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- SECTION D: Emergency Contacts & Dispatch Protocol -->
        <div style="border-top:1px solid rgba(255,255,255,0.06); padding-top:22px; margin-bottom:16px;">
          <div style="font-family:var(--font-mono); font-size:11px; text-transform:uppercase; letter-spacing:1px; color:var(--accent-primary); font-weight:700; margin-bottom:14px;">
            4. Emergency Contact &amp; Shelter Rendezvous Landmark
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:16px; margin-bottom:20px;">
            <div class="field">
              <label>Emergency Contact Person</label>
              <input type="text" id="profEmergencyName" class="glass-input" value="${escapeHtml(personal.emergencyContactName)}" placeholder="e.g. Sarah Prabakaran">
            </div>

            <div class="field">
              <label>Relationship</label>
              <input type="text" id="profEmergencyRelation" class="glass-input" value="${escapeHtml(personal.emergencyContactRelation)}" placeholder="e.g. Spouse / Sibling">
            </div>

            <div class="field">
              <label>Emergency Contact Phone</label>
              <input type="tel" id="profEmergencyPhone" class="glass-input" value="${escapeHtml(personal.emergencyPhone)}" placeholder="+91 98401 22334">
            </div>

            <div class="field" style="grid-column: span 3;">
              <label>Designated Nearest Evacuation Shelter / Safe Assembly</label>
              <input type="text" id="profShelter" class="glass-input" value="${escapeHtml(personal.primaryShelter)}" placeholder="e.g. Velachery Government Higher Secondary Relief Camp">
            </div>
          </div>

          <div style="display:flex; justify-content:flex-end;">
            <button class="glass-btn btn-primary" onclick="savePersonalProfile()" style="padding:12px 28px; font-size:13.5px; font-weight:700; box-shadow:0 0 20px var(--accent-glow); gap:8px;">
              <span>💾 Save Personal &amp; Flood Resilience Data</span>
            </button>
          </div>
        </div>

      </div>

      <!-- Operational Role & Auto-Configured Workspace Selection Card -->
      <div class="glass-card elevated" style="padding:28px; margin-bottom:28px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px; margin-bottom:16px;">
          <div>
            <h3 style="font-size:18px; font-weight:700; margin:0 0 6px 0; display:flex; align-items:center; gap:8px;">
              <span>🛡️</span> Operational Role &amp; Workspace Clearance
            </h3>
            <p style="font-size:13px; color:var(--text-secondary); line-height:1.5; margin:0;">
              Selecting an operational role immediately auto-configures your workspace layout, active screen, navigation permissions, and telemetry modules.
            </p>
          </div>
          <span class="glass-badge" style="background:${user.role === 'admin' ? 'rgba(255,77,106,0.18)' : (user.role === 'analyst' ? 'rgba(51,199,255,0.18)' : 'rgba(31,224,168,0.18)')}; color:${user.role === 'admin' ? 'var(--red)' : (user.role === 'analyst' ? 'var(--accent-primary)' : 'var(--ocean)')}; font-family:var(--font-mono); font-size:11px;">
            CURRENT: ${(user.role || 'resident').toUpperCase()}
          </span>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:14px;">
          <!-- Admin Card -->
          <div onclick="autoConfigureRoleScreens('admin')" 
            style="padding:18px; border-radius:14px; cursor:pointer; transition:all 0.25s ease; border:1px solid ${user.role === 'admin' ? '#EF4444' : 'var(--panel-border)'}; background:${user.role === 'admin' ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.02)'};"
            class="role-select-card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <span style="font-size:24px;">⚡</span>
              ${user.role === 'admin' ? '<span style="font-size:10px; font-weight:700; color:#EF4444; font-family:var(--font-mono);">● ACTIVE WORKSPACE</span>' : ''}
            </div>
            <div style="font-size:15px; font-weight:700; color:var(--text-0);">Administrator Clearance</div>
            <div style="font-size:12px; color:var(--text-secondary); margin-top:4px; line-height:1.45;">
              Platform operations center, user RBAC directory, system configuration, alert dispatch, and compliance audit explorer.
            </div>
            <div style="margin-top:12px; font-size:11.5px; font-weight:600; color:#FF6B6B;">
              Auto-configures to: Platform Operations (admin-ops) →
            </div>
          </div>

          <!-- Analyst Card -->
          <div onclick="autoConfigureRoleScreens('analyst')" 
            style="padding:18px; border-radius:14px; cursor:pointer; transition:all 0.25s ease; border:1px solid ${user.role === 'analyst' ? 'var(--accent-primary)' : 'var(--panel-border)'}; background:${user.role === 'analyst' ? 'var(--accent-glow)' : 'rgba(255,255,255,0.02)'};"
            class="role-select-card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <span style="font-size:24px;">🧪</span>
              ${user.role === 'analyst' ? '<span style="font-size:10px; font-weight:700; color:var(--accent-primary); font-family:var(--font-mono);">● ACTIVE WORKSPACE</span>' : ''}
            </div>
            <div style="font-size:15px; font-weight:700; color:var(--text-0);">Analyst Hydrologic Lab</div>
            <div style="font-size:12px; color:var(--text-secondary); margin-top:4px; line-height:1.45;">
              Interactive prediction workbench, SHAP feature attributions, district risk matrix, historical evaluation log, and threat intel.
            </div>
            <div style="margin-top:12px; font-size:11.5px; font-weight:600; color:var(--accent-primary);">
              Auto-configures to: Prediction Workbench (analyst-predict) →
            </div>
          </div>

          <!-- Resident Card -->
          <div onclick="autoConfigureRoleScreens('resident')" 
            style="padding:18px; border-radius:14px; cursor:pointer; transition:all 0.25s ease; border:1px solid ${(user.role === 'resident' || user.role === 'user') ? 'var(--ocean)' : 'var(--panel-border)'}; background:${(user.role === 'resident' || user.role === 'user') ? 'rgba(31,224,168,0.12)' : 'rgba(255,255,255,0.02)'};"
            class="role-select-card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <span style="font-size:24px;">📍</span>
              ${(user.role === 'resident' || user.role === 'user') ? '<span style="font-size:10px; font-weight:700; color:var(--ocean); font-family:var(--font-mono);">● ACTIVE WORKSPACE</span>' : ''}
            </div>
            <div style="font-size:15px; font-weight:700; color:var(--text-0);">Resident Safety Hub</div>
            <div style="font-size:12px; color:var(--text-secondary); margin-top:4px; line-height:1.45;">
              Local real-time flood risk indicator, 1,000km live radar sentinel, emergency advisories, and disaster handbook.
            </div>
            <div style="margin-top:12px; font-size:11.5px; font-weight:600; color:var(--ocean);">
              Auto-configures to: 1,000km Live Radar (resident-radar) →
            </div>
          </div>
        </div>
      </div>

      <!-- Theme & 7 Accent Colours Selection Card -->
      <div class="glass-card elevated" style="padding:32px; margin-bottom:28px;">
        <h3 style="font-size:18px; font-weight:700; margin-bottom:6px; display:flex; align-items:center; gap:8px;">
          <span>🎨</span> Liquid Glass Theme &amp; Accent Styling
        </h3>
        <p style="font-size:13px; color:var(--text-secondary); line-height:1.6; margin-bottom:24px;">
          Select from 7 curated accent colour themes. The accent dynamically permeates buttons, navigation, glowing borders, and focus rings across all workspaces.
        </p>

        <!-- Light / Dark Mode Toggle Row -->
        <div style="display:flex; align-items:center; justify-content:space-between; padding:16px 20px; border-radius:12px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); margin-bottom:24px;">
          <div>
            <div style="font-size:14px; font-weight:600;">Display Surface Theme</div>
            <div style="font-size:12px; color:var(--text-muted);">Switch between deep bathymetric dark glass and frosted light glass.</div>
          </div>
          <div style="display:flex; gap:8px;">
            <button class="glass-btn ${state.theme === 'dark' ? 'btn-primary' : 'btn-ghost'}" onclick="setProfileTheme('dark')" style="padding:8px 16px; font-size:12.5px;">
              🌙 Dark Mode
            </button>
            <button class="glass-btn ${state.theme === 'light' ? 'btn-primary' : 'btn-ghost'}" onclick="setProfileTheme('light')" style="padding:8px 16px; font-size:12.5px;">
              ☀️ Light Mode
            </button>
          </div>
        </div>

        <!-- 7 Accent Color Themes Grid -->
        <div style="font-size:13px; font-weight:600; color:var(--text-primary); margin-bottom:12px;">
          Select Accent Palette (7 Presets)
        </div>

        <div class="grid-cards" style="grid-template-columns:repeat(7,1fr); gap:12px; margin-bottom:20px;">
          ${ACCENT_PRESETS.map(acc => `
            <div onclick="setProfileAccent('${acc.id}')"
              style="cursor:pointer; padding:14px 8px; border-radius:14px; text-align:center; transition:all 0.25s ease; border:2px solid ${currentAccent === acc.id ? acc.hex : 'rgba(255,255,255,0.08)'}; background:${currentAccent === acc.id ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)'};"
              title="${acc.name}">
              <div style="width:34px; height:34px; border-radius:50%; margin:0 auto 8px; background:linear-gradient(135deg, ${acc.hex}, ${acc.secHex}); box-shadow:0 0 14px ${acc.hex}66; display:grid; place-items:center;">
                ${currentAccent === acc.id ? '<span style="color:#000; font-weight:700; font-size:13px;">✓</span>' : ''}
              </div>
              <div style="font-size:11.5px; font-weight:600; color:${currentAccent === acc.id ? 'var(--text-primary)' : 'var(--text-muted)'}; line-height:1.2;">
                ${acc.name}
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Live Preview Pill -->
        <div style="padding:14px 18px; border-radius:12px; background:var(--glass-interactive); border:1px solid var(--glass-border); display:flex; align-items:center; justify-content:space-between;">
          <div style="display:flex; align-items:center; gap:10px; font-size:13px;">
            <span>Active Accent:</span>
            <b style="color:var(--accent-primary); font-family:var(--font-mono);">${ACCENT_PRESETS.find(a => a.id === currentAccent)?.name || 'Ocean Cyan'}</b>
          </div>
          <button class="glass-btn btn-primary" style="font-size:12px; padding:6px 16px;">
            Preview Action Button
          </button>
        </div>
      </div>

      <!-- Language & Regional Preferences Card -->
      <div class="glass-card elevated" style="padding:32px; margin-bottom:28px;">
        <h3 style="font-size:18px; font-weight:700; margin-bottom:6px; display:flex; align-items:center; gap:8px;">
          <span>🌐</span> Regional Language &amp; Localization
        </h3>
        <p style="font-size:13px; color:var(--text-secondary); line-height:1.6; margin-bottom:20px;">
          Select your primary language for emergency alerts, threat bulletins, and interface typography.
        </p>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
          <div class="field">
            <label>Interface Language</label>
            <select class="glass-select" onchange="setProfileLanguage(this.value)">
              ${SUPPORTED_LANGUAGES.map(l => `
                <option value="${l.code}" ${currentLang === l.code ? 'selected' : ''}>
                  ${l.name}
                </option>
              `).join('')}
            </select>
          </div>

          <div class="field">
            <label>Emergency Alert Perimeter</label>
            <input type="text" class="glass-input" readonly value="1,000 km Synoptic Surveillance Radius" style="opacity:0.8;">
          </div>
        </div>
      </div>

    </div>
  `;
}

function savePersonalProfile() {
  const updated = {
    fullName: document.getElementById('profFullName')?.value || '',
    age: document.getElementById('profAge')?.value || '',
    dob: document.getElementById('profDob')?.value || '',
    gender: document.getElementById('profGender')?.value || '',
    phone: document.getElementById('profPhone')?.value || '',
    phoneVerified: !!(document.getElementById('profPhone')?.value),
    email: document.getElementById('profEmail')?.value || '',
    locality: document.getElementById('profLocality')?.value || '',
    address: document.getElementById('profAddress')?.value || '',
    city: document.getElementById('profCity')?.value || '',
    state: document.getElementById('profState')?.value || '',
    pincode: document.getElementById('profPincode')?.value || '',
    elevation: document.getElementById('profElevation')?.value || '',
    lat: document.getElementById('profLat')?.value || '',
    lon: document.getElementById('profLon')?.value || '',
    floorLevel: document.getElementById('profFloorLevel')?.value || 'ground',
    familyCount: document.getElementById('profFamilyCount')?.value || '',
    childrenCount: document.getElementById('profChildrenCount')?.value || '',
    seniorCount: document.getElementById('profSeniorCount')?.value || '',
    medicalAssistance: document.getElementById('profMedicalAssistance')?.value || 'none',
    emergencyContactName: document.getElementById('profEmergencyName')?.value || '',
    emergencyContactRelation: document.getElementById('profEmergencyRelation')?.value || '',
    emergencyPhone: document.getElementById('profEmergencyPhone')?.value || '',
    primaryShelter: document.getElementById('profShelter')?.value || '',
    alertSms: true,
    alertPush: true,
    alertEmail: true,
    alertSiren: true
  };

  localStorage.setItem('floodai-personal-profile', JSON.stringify(updated));

  // Sync to state.user so all views (simulation, risk) pick up latest contact data
  if (state.user) {
    if (updated.fullName) state.user.name = updated.fullName;
    if (updated.fullName) state.user.displayName = updated.fullName;
    if (updated.email)    state.user.email = updated.email;
    if (updated.phone)    state.user.phone = updated.phone;
    state.user.locality   = updated.locality || updated.city || '';
    state.user.phoneVerified = updated.phoneVerified;
    localStorage.setItem('floodai-user', JSON.stringify(state.user));
  }

  toast('✅ Personal data & flood resilience profile saved successfully!');
  renderProfile(document.getElementById('pageRoot'));
}

function acquireDeviceGpsForProfile() {
  if (typeof GeoLocationService === 'undefined') {
    toast('⚠️ Geolocation service unavailable in this browser.');
    return;
  }

  const btn = document.querySelector('[onclick="acquireDeviceGpsForProfile()"]');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span>⏳</span> Acquiring GPS...'; }

  GeoLocationService.requestDeviceLocation(false).then(() => {
    const c = GeoLocationService.coords;
    if (!c) {
      toast('⚠️ GPS permission denied or unavailable. Grant location access and retry.');
      if (btn) { btn.disabled = false; btn.innerHTML = '<span>📍</span> Acquire Live GPS Fix'; }
      return;
    }

    // Populate locality fields from live reverse-geocoded coordinates
    const locality = c.locality || c.cityName || c.district || '';
    const city     = c.district || c.cityName || '';
    const stateVal = c.stateName || '';

    const el = (id) => document.getElementById(id);
    if (el('profLocality') && locality) el('profLocality').value = locality;
    if (el('profState')    && stateVal) el('profState').value    = stateVal;
    if (el('profLat'))                  el('profLat').value      = c.lat.toFixed(6);
    if (el('profLon'))                  el('profLon').value      = c.lon.toFixed(6);

    // Update city dropdown or text fallback
    const cityEl = el('profCity');
    if (cityEl) {
      const opt = [...cityEl.options].find(o => o.value.toLowerCase() === city.toLowerCase());
      if (opt) { cityEl.value = city; }
      else if (city) {
        // Add dynamic option for live GPS city
        const newOpt = document.createElement('option');
        newOpt.value = city;
        newOpt.textContent = city;
        newOpt.selected = true;
        cityEl.appendChild(newOpt);
      }
    }

    // Show GPS-resolved coordinates badge
    const coordsDisplay = el('profGpsCoordsBadge');
    if (coordsDisplay) {
      coordsDisplay.style.display = 'flex';
      coordsDisplay.innerHTML = `<span style="font-family:var(--font-mono); font-size:11.5px; color:var(--ocean);">
        📍 GPS LOCKED: ${c.lat.toFixed(5)}°N, ${c.lon.toFixed(5)}°E &nbsp;|&nbsp; ±${c.accuracyMeters}m accuracy
      </span>`;
    }

    toast(`📍 GPS Fix Acquired: ${locality || city || (c.lat.toFixed(3) + '°N, ' + c.lon.toFixed(3) + '°E')} (±${c.accuracyMeters}m)`);
    if (btn) { btn.disabled = false; btn.innerHTML = '<span>✅</span> GPS Location Applied'; }
  }).catch(err => {
    toast('⚠️ GPS error: ' + (err?.message || 'Unknown error'));
    if (btn) { btn.disabled = false; btn.innerHTML = '<span>📍</span> Acquire Live GPS Fix'; }
  });
}

function setProfileTheme(mode) {
  state.theme = mode;
  localStorage.setItem('floodai-theme', mode);
  document.documentElement.classList.toggle('light', mode === 'light');
  toast(`Theme switched to ${mode.toUpperCase()} mode.`);
  renderProfile(document.getElementById('pageRoot'));
}

function setProfileAccent(accentId) {
  setAppAccent(accentId);
  renderProfile(document.getElementById('pageRoot'));
}

function setProfileLanguage(langCode) {
  setAppLanguage(langCode);
  renderProfile(document.getElementById('pageRoot'));
}
