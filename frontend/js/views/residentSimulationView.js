/**
 * residentSimulationView.js
 * Resident Workspace — Flood Alert Simulation & Notification Testing
 * 
 * Production-ready test workspace for validating multi-channel emergency alert dispatches:
 * 1. In-browser acoustic siren wail (Web Audio API)
 * 2. Brevo transactional email notification to authenticated resident's email
 * 3. Cellular SMS notification to authenticated resident's verified phone
 * 4. Firebase Cloud Messaging (FCM) Web Push notification to browser service worker
 * 
 * Strict Isolation: All simulations are tagged with isSimulation: true and never contaminate
 * live emergency feeds, municipal alert broadcasts, or GIS operational dashboards.
 */

let _simSirenActive = false;
let _activeSimScenario = 'coastal_surge';
let _activeSimSeverity = 'Warning';
let _currentSimulationId = null;
let _simHistory = [];

const SIM_SCENARIOS = {
  coastal_surge: {
    id: 'coastal_surge',
    name: 'Coastal Storm Surge & Inundation',
    category: 'coastal_inundation',
    badge: 'COASTAL TIDAL SURGE',
    icon: '🌊',
    defaultSeverity: 'Critical',
    probabilityPct: 91.5,
    rainfall: '140 mm / 24h',
    tideSurge: '+3.2m Astronomical Swell',
    description: 'Severe cyclonic storm surge breaching coastal seawalls. Rapid seawater ingress into low-lying settlements within 1.5km of the shoreline.',
    directives: [
      'Evacuate ground-level living spaces within 1,200m of the shoreline immediately.',
      'Commence vertical evacuation to reinforced concrete structures >10m MSL.',
      'Disconnect main electrical breaker and gas cylinders before floodwaters reach conduits.',
      'Do not attempt vehicular transit across flooded causeways or coastal roads.'
    ]
  },
  heavy_rainfall: {
    id: 'heavy_rainfall',
    name: 'Severe Pluvial Downpour / Heavy Rainfall',
    category: 'heavy_rainfall',
    badge: 'EXTREME PLUVIAL INUNDATION',
    icon: '⛈️',
    defaultSeverity: 'Warning',
    probabilityPct: 83.2,
    rainfall: '165 mm / 6h',
    tideSurge: 'Urban Drainage Surcharge',
    description: 'Intense atmospheric convective downpour exceeding municipal storm drain capacity. Rapid street-level flash flooding in urban sub-basins.',
    directives: [
      'Move essential medicines, drinking water, and valuables to upper storeys.',
      'Stay indoors; avoid storm culverts, open drains, and subterranean basements.',
      'Disconnect ground-level electrical appliances.',
      'Monitor live FloodAI radar and siren audio broadcasts.'
    ]
  },
  rising_water_level: {
    id: 'rising_water_level',
    name: 'Riverine Floodplain / Rising Water Level',
    category: 'rising_water_level',
    badge: 'RIVERINE FLOODPLAIN DISCHARGE',
    icon: '⚠️',
    defaultSeverity: 'Watch',
    probabilityPct: 72.8,
    rainfall: '95 mm / 24h',
    tideSurge: 'River Gauge: Above Warning Mark (+4.6m)',
    description: 'Upstream reservoir spillway discharge and runoff elevating river stages past warning thresholds. Low-lying riparian buffer zones at risk.',
    directives: [
      'Residents within 500m of riverbanks must prepare for preemptive evacuation.',
      'Untether livestock and relocate domestic vehicles to elevated terrain.',
      'Avoid standing or driving near bridge abutments and retaining walls.',
      'Keep mobile phones fully charged and emergency radios on standby.'
    ]
  },
  official_warning: {
    id: 'official_warning',
    name: 'Official Civil Defense Flood Warning',
    category: 'official_warning',
    badge: 'OFFICIAL DISASTER AUTHORITY ADVISORY',
    icon: '📢',
    defaultSeverity: 'Advisory',
    probabilityPct: 65.0,
    rainfall: 'Synoptic Alert Forecast',
    tideSurge: 'IMD / CWC Bulletin Synchronized',
    description: 'Official flood watch issued by regional disaster management authorities based on hydrometric river forecasts and depression trajectories.',
    directives: [
      'Review family emergency evacuation plans and designated community shelters.',
      'Ensure 72-hour emergency survival kits contain non-perishable food and water.',
      'Verify that SMS and push notification alerts remain unmuted on mobile devices.',
      'Check on elderly neighbors and vulnerable household members.'
    ]
  }
};

async function renderResidentSimulation(root) {
  root = root || document.getElementById('pageRoot');
  if (!root) return;

  const user = state.user || {};
  const isAuthenticated = Boolean(state.token && user.email);

  const registeredName = user.displayName || user.name || 'Registered Resident';
  const registeredEmail = user.email || 'Unregistered';
  const registeredPhone = user.phone || 'No phone registered';
  const phoneVerified = Boolean(user.phoneVerified);

  // Derive location from GeoLocationService or state
  let resolvedLat = 13.0827;
  let resolvedLon = 80.2707;
  let locLabel = 'Chennai Central Sector';
  let isGps = false;

  if (typeof GeoLocationService !== 'undefined' && GeoLocationService.coords) {
    resolvedLat = GeoLocationService.coords.latitude;
    resolvedLon = GeoLocationService.coords.longitude;
    locLabel = GeoLocationService.locality || `Live GPS Sector (${resolvedLat.toFixed(3)}°N, ${resolvedLon.toFixed(3)}°E)`;
    isGps = true;
  } else if (state.userCoordinates) {
    resolvedLat = state.userCoordinates[0];
    resolvedLon = state.userCoordinates[1];
    locLabel = state.selectedDistrict ? `${state.selectedDistrict} Sector` : `Coordinates (${resolvedLat.toFixed(3)}°N, ${resolvedLon.toFixed(3)}°E)`;
  } else if (state.selectedDistrict) {
    locLabel = `${state.selectedDistrict} Monitoring Sector`;
  }

  root.innerHTML = `
    <div class="saas-page-container">
      
      <!-- Top Breadcrumb & Live Safety Mode Banner -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:12px;">
        <div>
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
            <span class="story-tag" style="color:#FFAA33; border-color:rgba(255,170,51,0.3); background:rgba(255,170,51,0.08);">
              TESTING &amp; VERIFICATION WORKSPACE
            </span>
            <span class="badge badge-warning" style="font-size:11px; padding:2px 8px;">
              🛡️ ISOLATED SIMULATION MODE
            </span>
          </div>
          <h1 style="font-family:var(--font-display); font-size:26px; font-weight:700; margin:0;">
            Flood Alert Simulation &amp; Notification Testing
          </h1>
          <p style="font-size:13.5px; color:var(--text-1); margin-top:4px;">
            Test end-to-end resident emergency notification delivery without triggering real public emergency broadcasts.
          </p>
        </div>

        <div style="display:flex; gap:10px; align-items:center;">
          <button class="glass-btn btn-ghost" onclick="goTo('resident-risk')" style="gap:6px; font-size:12.5px;">
            <span>📍</span> Risk Overview
          </button>
          <button class="glass-btn btn-primary" onclick="goTo('resident-radar')" style="gap:6px; font-size:12.5px;">
            <span>📡</span> 1,000km Live Radar
          </button>
        </div>
      </div>

      <!-- Persistent Simulation Isolation Notice -->
      <div style="margin-bottom:20px; padding:12px 18px; border-radius:10px; background:rgba(255,170,51,0.07); border:1px solid rgba(255,170,51,0.3); display:flex; align-items:center; gap:12px;">
        <span style="font-size:20px;">⚠️</span>
        <div style="font-size:12.5px; color:var(--text-0); line-height:1.5;">
          <strong>SIMULATION SAFETY NOTICE:</strong> Alerts triggered from this workspace are tagged with <code style="color:#FFAA33; font-family:var(--font-mono);">isSimulation: true</code>. They will target <strong>only your registered devices</strong> and will never appear on public GIS maps, civil defense dashboards, or community broadcasts.
        </div>
      </div>

      ${!isAuthenticated ? `
        <div class="glass-card elevated border-lightning" style="padding:24px; margin-bottom:24px; text-align:center;">
          <div style="font-size:32px; margin-bottom:8px;">🔒</div>
          <h3 style="font-size:16px; font-weight:700; margin:0 0 6px;">Authentication Required for Test Dispatches</h3>
          <p style="font-size:13px; color:var(--text-1); max-width:500px; margin:0 auto 16px;">
            To test real email, SMS, and push notification deliveries, you must be logged into your verified FloodAI resident account so contact details can be safely pulled from the database.
          </p>
          <button class="glass-btn btn-primary" onclick="goTo('auth')" style="margin:0 auto; padding:8px 20px;">
            Log In to Resident Account
          </button>
        </div>
      ` : ''}

      <!-- In-Tab Active Siren Strobe Banner (Shown when siren is active) -->
      <div id="simSirenBanner" style="display:none; margin-bottom:20px; padding:16px 22px; border-radius:var(--radius); background:linear-gradient(90deg, rgba(255,77,106,0.22), rgba(255,184,77,0.18)); border:1px solid #FF4D6A; box-shadow:0 0 24px rgba(255,77,106,0.35); animation:pulseGlow 1.2s infinite alternate;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
          <div style="display:flex; align-items:center; gap:14px;">
            <div style="width:40px; height:40px; border-radius:50%; background:rgba(255,77,106,0.25); display:flex; align-items:center; justify-content:center; font-size:22px;">
              🚨
            </div>
            <div>
              <div style="font-weight:700; font-size:15px; color:#FF4D6A; letter-spacing:0.5px;">
                ACOUSTIC CIVIL DEFENSE SIREN SOUNDING (TAB ACTIVE)
              </div>
              <div style="font-size:12px; color:var(--text-0); margin-top:2px;">
                High-urgency dual-oscillator acoustic siren active in resident browser tab.
              </div>
            </div>
          </div>
          <div style="display:flex; gap:10px;">
            <button class="glass-btn btn-danger" onclick="stopSimSiren()" style="gap:6px; font-size:12.5px; font-weight:700;">
              <span>⏹</span> Silence Siren
            </button>
          </div>
        </div>
      </div>

      <!-- Main Two-Column Layout -->
      <div style="display:grid; grid-template-columns:1.15fr 1fr; gap:20px; margin-bottom:24px;">
        
        <!-- Left: Configuration & Scenario Selection -->
        <div style="display:flex; flex-direction:column; gap:20px;">
          
          <!-- Card 1: Authenticated Resident Data -->
          <div class="glass-card elevated" style="padding:22px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:18px;">👤</span>
                <h3 style="font-size:15px; font-weight:700; margin:0;">Authenticated Recipient Profile</h3>
              </div>
              <span class="badge ${isAuthenticated ? 'badge-success' : 'badge-danger'}" style="font-size:11px;">
                ${isAuthenticated ? 'VERIFIED DB RECORD' : 'UNAUTHENTICATED'}
              </span>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">
              <div style="background:rgba(255,255,255,0.025); border:1px solid var(--panel-border); border-radius:10px; padding:10px 14px;">
                <div style="font-size:10.5px; color:var(--text-2); text-transform:uppercase; font-family:var(--font-mono);">Resident Name</div>
                <div style="font-size:13.5px; font-weight:600; margin-top:4px; color:var(--text-0);">${registeredName}</div>
              </div>

              <div style="background:rgba(255,255,255,0.025); border:1px solid var(--panel-border); border-radius:10px; padding:10px 14px;">
                <div style="font-size:10.5px; color:var(--text-2); text-transform:uppercase; font-family:var(--font-mono);">
                  Test Target Location ${isGps ? '📍 (GPS)' : '🏙️ (Sector)'}
                </div>
                <div style="font-size:13px; font-weight:600; margin-top:4px; color:var(--cyber);">
                  ${locLabel}
                </div>
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:10px;">
              <div style="background:rgba(255,255,255,0.02); border:1px solid var(--panel-border); border-radius:10px; padding:10px 14px;">
                <div style="display:flex; justify-content:space-between;">
                  <span style="font-size:10.5px; color:var(--text-2); font-family:var(--font-mono);">EMAIL RECIPIENT</span>
                  <span class="badge badge-success" style="font-size:9.5px; padding:1px 6px;">VERIFIED</span>
                </div>
                <div style="font-size:12.5px; font-weight:600; margin-top:4px; color:var(--text-0); word-break:break-all;">
                  ${registeredEmail}
                </div>
              </div>

              <div style="background:rgba(255,255,255,0.02); border:1px solid var(--panel-border); border-radius:10px; padding:10px 14px;">
                <div style="display:flex; justify-content:space-between;">
                  <span style="font-size:10.5px; color:var(--text-2); font-family:var(--font-mono);">PHONE RECIPIENT</span>
                  <span class="badge ${phoneVerified ? 'badge-success' : 'badge-warning'}" style="font-size:9.5px; padding:1px 6px;">
                    ${phoneVerified ? 'VERIFIED' : 'UNVERIFIED'}
                  </span>
                </div>
                <div style="font-size:12.5px; font-weight:600; margin-top:4px; color:var(--text-0);">
                  ${registeredPhone}
                </div>
              </div>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
              <span style="font-size:11px; color:var(--text-2);">
                Contact info is loaded from your database account and cannot be forged.
              </span>
              <a href="javascript:void(0)" onclick="goTo('profile')" style="font-size:11.5px; color:var(--cyber); text-decoration:underline;">
                Update Profile Contact Info
              </a>
            </div>
          </div>

          <!-- Card 2: Inundation Scenario & Severity Selector -->
          <div class="glass-card elevated" style="padding:22px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:18px;">🌊</span>
                <h3 style="font-size:15px; font-weight:700; margin:0;">Select Flood Threat Scenario</h3>
              </div>
              <div style="display:flex; gap:6px; align-items:center;">
                <label style="font-size:11px; font-family:var(--font-mono); color:var(--text-2);">SEVERITY:</label>
                <select id="simSeveritySelect" onchange="updateSimSeverity(this.value)" class="glass-input" style="padding:2px 8px; font-size:11px; font-family:var(--font-mono);">
                  <option value="Advisory">Advisory (Low-Medium)</option>
                  <option value="Watch">Watch (Medium)</option>
                  <option value="Warning" selected>Warning (High)</option>
                  <option value="Critical">Critical (Very High)</option>
                </select>
              </div>
            </div>

            <div style="display:flex; flex-direction:column; gap:10px;" id="simScenarioOptionsContainer">
              ${renderSimScenarioOptions()}
            </div>
          </div>

          <!-- Card 3: Channel Selection Toggles -->
          <div class="glass-card elevated" style="padding:20px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
              <h3 style="font-size:14px; font-weight:700; margin:0;">Target Channels to Test</h3>
              <span style="font-size:11px; color:var(--text-2);">Independent delivery tracking</span>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
              <label style="display:flex; align-items:center; gap:8px; font-size:12.5px; cursor:pointer;">
                <input type="checkbox" id="chkChSiren" checked />
                <span>🔊 In-Tab Acoustic Siren</span>
              </label>
              <label style="display:flex; align-items:center; gap:8px; font-size:12.5px; cursor:pointer;">
                <input type="checkbox" id="chkChFcm" checked />
                <span>🔔 Firebase FCM Web Push</span>
              </label>
              <label style="display:flex; align-items:center; gap:8px; font-size:12.5px; cursor:pointer;">
                <input type="checkbox" id="chkChEmail" checked />
                <span>📧 Brevo Transactional Email</span>
              </label>
              <label style="display:flex; align-items:center; gap:8px; font-size:12.5px; cursor:pointer;">
                <input type="checkbox" id="chkChSms" checked />
                <span>💬 Cellular SMS Bulletin</span>
              </label>
            </div>
          </div>

        </div>

        <!-- Right: Dispatch Action & Real-Time Status -->
        <div style="display:flex; flex-direction:column; gap:20px;">
          
          <!-- Master Action Card -->
          <div class="glass-card elevated border-lightning" style="padding:24px; text-align:center; background:radial-gradient(ellipse at 50% 0%, rgba(255,170,51,0.12), transparent 70%);">
            <div style="font-size:36px; margin-bottom:8px;">🚨</div>
            <h2 style="font-family:var(--font-display); font-size:19px; font-weight:700; margin:0;">
              Execute Resident Alert Simulation
            </h2>
            <p style="font-size:12.5px; color:var(--text-1); max-width:440px; margin:8px auto 18px;">
              Safely dispatches multi-channel test notifications strictly to your verified resident account and browser session.
            </p>

            <button id="simLaunchBtn" class="glass-btn btn-danger" onclick="promptSimConfirmation()" ${!isAuthenticated ? 'disabled' : ''} style="width:100%; max-width:380px; margin:0 auto; padding:13px 22px; font-size:14px; font-weight:700; letter-spacing:0.5px; box-shadow:0 0 20px rgba(255,77,106,0.4); gap:10px; justify-content:center;">
              <span>🚨</span> LAUNCH TEST FLOOD ALERT DISPATCH
            </button>

            <div id="simProgressWrap" style="display:none; margin-top:16px;">
              <div style="font-size:12px; font-family:var(--font-mono); color:var(--cyber); margin-bottom:6px;" id="simProgressLabel">
                Broadcasting multi-channel emergency telemetry...
              </div>
              <div style="height:6px; background:rgba(255,255,255,0.06); border-radius:99px; overflow:hidden;">
                <div id="simProgressBar" style="width:0%; height:100%; background:linear-gradient(90deg, #FFAA33, #FF4D6A); transition:width 0.3s ease;"></div>
              </div>
            </div>
          </div>

          <!-- Alert Preview & Acknowledgment Card (Appears after simulation) -->
          <div id="simAlertPreviewCard" class="glass-card elevated" style="display:none; padding:20px; border-left:4px solid #FF4D6A;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
              <div>
                <span id="previewSeverityBadge" class="badge badge-danger" style="font-size:11px; font-weight:700;">CRITICAL WARNING</span>
                <h3 id="previewTitle" style="font-size:15px; font-weight:700; margin:6px 0 2px;">Flood Threat Detected</h3>
                <div id="previewLocation" style="font-size:12px; color:var(--text-2);">Monitored Sector</div>
              </div>
              <button id="simAcknowledgeBtn" class="glass-btn btn-success" onclick="acknowledgeSimulationAlert()" style="font-size:12px; padding:6px 14px; font-weight:700;">
                ✓ Acknowledge Alert
              </button>
            </div>

            <p id="previewBody" style="font-size:12.5px; color:var(--text-1); margin:10px 0; line-height:1.5;">
              Safety directives are active for this sector.
            </p>

            <div style="background:rgba(255,255,255,0.02); border:1px solid var(--panel-border); border-radius:8px; padding:10px 14px; margin-top:10px;">
              <div style="font-size:11px; font-weight:700; color:var(--text-0); margin-bottom:4px;">RECOMMENDED ACTIONS:</div>
              <ul id="previewDirectives" style="margin:0; padding-left:18px; font-size:11.5px; color:var(--text-1); line-height:1.6;"></ul>
            </div>
          </div>

          <!-- 4-Channel Live Diagnostic Status Grid -->
          <div class="glass-card elevated" style="padding:22px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:18px;">📡</span>
                <h3 style="font-size:15px; font-weight:700; margin:0;">Channel Delivery Verification</h3>
              </div>
              <span id="simOverallStatusBadge" class="badge badge-ghost" style="font-size:11px;">
                STANDBY
              </span>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;" id="simChannelGrid">
              
              <!-- Channel 1: In-Tab Acoustic Siren -->
              <div class="channel-card" id="cardChSiren" style="background:rgba(255,255,255,0.02); border:1px solid var(--panel-border); border-radius:12px; padding:14px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
                  <div style="display:flex; align-items:center; gap:8px;">
                    <span style="font-size:18px;">🔊</span>
                    <div>
                      <div style="font-weight:600; font-size:13px;">Tab Siren</div>
                      <div style="font-size:10.5px; color:var(--text-2);">Web Audio API</div>
                    </div>
                  </div>
                  <span class="badge" id="badgeChSiren" style="background:rgba(255,255,255,0.08); font-size:10px;">IDLE</span>
                </div>
                <div style="font-size:11.5px; color:var(--text-1); margin-top:8px;" id="descChSiren">
                  Urgent acoustic alarm in active resident browser tab.
                </div>
                <div style="display:flex; gap:6px; margin-top:10px;">
                  <button class="glass-btn btn-ghost" onclick="testSirenAudio()" style="font-size:10.5px; padding:3px 8px;">
                    Test Siren 🔊
                  </button>
                  <button class="glass-btn btn-ghost" onclick="stopSimSiren()" style="font-size:10.5px; padding:3px 8px;">
                    Silence 🔇
                  </button>
                </div>
              </div>

              <!-- Channel 2: Brevo Email Notification -->
              <div class="channel-card" id="cardChEmail" style="background:rgba(255,255,255,0.02); border:1px solid var(--panel-border); border-radius:12px; padding:14px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
                  <div style="display:flex; align-items:center; gap:8px;">
                    <span style="font-size:18px;">📧</span>
                    <div>
                      <div style="font-weight:600; font-size:13px;">Brevo Email</div>
                      <div style="font-size:10.5px; color:var(--text-2);">SMTP Gateway</div>
                    </div>
                  </div>
                  <span class="badge" id="badgeChEmail" style="background:rgba(255,255,255,0.08); font-size:10px;">STANDBY</span>
                </div>
                <div style="font-size:11.5px; color:var(--text-1); margin-top:8px;" id="descChEmail">
                  Delivers official HTML warning bulletin to verified inbox.
                </div>
              </div>

              <!-- Channel 3: Cellular SMS Notification -->
              <div class="channel-card" id="cardChSms" style="background:rgba(255,255,255,0.02); border:1px solid var(--panel-border); border-radius:12px; padding:14px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
                  <div style="display:flex; align-items:center; gap:8px;">
                    <span style="font-size:18px;">💬</span>
                    <div>
                      <div style="font-weight:600; font-size:13px;">Cellular SMS</div>
                      <div style="font-size:10.5px; color:var(--text-2);">SMS Gateway</div>
                    </div>
                  </div>
                  <span class="badge" id="badgeChSms" style="background:rgba(255,255,255,0.08); font-size:10px;">STANDBY</span>
                </div>
                <div style="font-size:11.5px; color:var(--text-1); margin-top:8px;" id="descChSms">
                  Sends high-priority text bulletin to registered mobile phone.
                </div>
              </div>

              <!-- Channel 4: Firebase FCM Web Push -->
              <div class="channel-card" id="cardChFcm" style="background:rgba(255,255,255,0.02); border:1px solid var(--panel-border); border-radius:12px; padding:14px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
                  <div style="display:flex; align-items:center; gap:8px;">
                    <span style="font-size:18px;">🔔</span>
                    <div>
                      <div style="font-weight:600; font-size:13px;">Firebase Push</div>
                      <div style="font-size:10.5px; color:var(--text-2);">FCM ServiceWorker</div>
                    </div>
                  </div>
                  <span class="badge" id="badgeChFcm" style="background:rgba(255,255,255,0.08); font-size:10px;">ARMED</span>
                </div>
                <div style="font-size:11.5px; color:var(--text-1); margin-top:8px;" id="descChFcm">
                  Sends desktop &amp; mobile lockscreen push banner.
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

      <!-- Simulation Run History Table -->
      <div class="glass-card elevated" style="padding:22px; margin-bottom:24px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:18px;">📋</span>
            <h3 style="font-size:15px; font-weight:700; margin:0;">Authorized Simulation Audit Trail</h3>
          </div>
          <button class="glass-btn btn-ghost" onclick="loadSimHistory()" style="font-size:11px; padding:4px 10px;">
            Refresh History 🔄
          </button>
        </div>

        <div id="simHistoryContainer" style="overflow-x:auto;">
          <div style="color:var(--text-2); font-size:12px; text-align:center; padding:16px;">
            Loading simulation audit records from database...
          </div>
        </div>
      </div>

      <!-- Execution Console Log -->
      <div class="glass-card elevated" style="padding:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:18px;">📜</span>
            <h3 style="font-size:14px; font-weight:700; margin:0;">Dispatch Gateway Console</h3>
          </div>
          <button class="glass-btn btn-ghost" onclick="clearSimLog()" style="font-size:11px; padding:3px 8px;">
            Clear Console 🧹
          </button>
        </div>

        <div id="simLogTerminal" style="background:#040812; border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:12px 16px; font-family:var(--font-mono); font-size:12px; max-height:180px; overflow-y:auto; color:var(--text-1); line-height:1.7;">
          <div style="color:var(--text-2);">[SIMULATOR READY] Select scenario and click "LAUNCH TEST FLOOD ALERT DISPATCH" to begin.</div>
        </div>
      </div>

    </div>

    <!-- Confirmation Modal Dialog -->
    <div id="simConfirmModal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.75); z-index:9999; align-items:center; justify-content:center; padding:20px;">
      <div class="glass-card elevated" style="max-width:480px; width:100%; padding:24px; border:1px solid rgba(255,170,51,0.4);">
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">
          <span style="font-size:24px;">⚠️</span>
          <h3 style="font-size:17px; font-weight:700; margin:0;">Confirm Simulation Dispatch</h3>
        </div>
        <p style="font-size:13px; color:var(--text-1); line-height:1.5; margin-bottom:16px;">
          You are about to launch an authorized test notification dispatch. This will send simulated flood alert messages to:
        </p>
        <ul style="font-size:12.5px; color:var(--text-0); margin-bottom:16px; padding-left:20px; line-height:1.6;">
          <li><strong>Email:</strong> ${registeredEmail}</li>
          <li><strong>Phone:</strong> ${registeredPhone}</li>
          <li><strong>Browser:</strong> Active Web Push session</li>
        </ul>
        <p style="font-size:11.5px; color:var(--text-2); margin-bottom:20px;">
          All events are recorded as simulations and will not alert outside emergency contacts.
        </p>
        <div style="display:flex; justify-content:flex-end; gap:10px;">
          <button class="glass-btn btn-ghost" onclick="closeSimConfirmModal()">Cancel</button>
          <button class="glass-btn btn-danger" onclick="executeConfirmedSimulation()" style="font-weight:700;">
            Confirm &amp; Dispatch
          </button>
        </div>
      </div>
    </div>
  `;

  // Auto-load history if authenticated
  if (isAuthenticated) {
    loadSimHistory();
  }
}

function renderSimScenarioOptions() {
  return Object.values(SIM_SCENARIOS).map(sc => {
    const isSelected = sc.id === _activeSimScenario;
    const borderStyle = isSelected ? 'border:1px solid var(--accent-primary); background:rgba(51,199,255,0.07);' : 'border:1px solid var(--panel-border); background:rgba(255,255,255,0.02);';

    return `
      <div onclick="selectSimScenario('${sc.id}')" style="cursor:pointer; border-radius:12px; padding:12px 14px; ${borderStyle} transition:all 0.2s ease;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:18px;">${sc.icon}</span>
            <div>
              <div style="font-weight:700; font-size:13.5px; color:${isSelected ? 'var(--cyber)' : 'var(--text-0)'};">${sc.name}</div>
              <div style="font-size:10.5px; color:var(--text-2); font-family:var(--font-mono);">${sc.badge}</div>
            </div>
          </div>
          <div style="text-align:right;">
            <span class="badge ${sc.probabilityPct >= 80 ? 'badge-danger' : 'badge-warning'}" style="font-size:10.5px; font-weight:700;">
              ${sc.probabilityPct}% MODEL RISK
            </span>
          </div>
        </div>
        <div style="font-size:12px; color:var(--text-1); margin-top:4px; line-height:1.4;">
          ${sc.description}
        </div>
      </div>
    `;
  }).join('');
}

function selectSimScenario(scId) {
  _activeSimScenario = scId;
  const container = document.getElementById('simScenarioOptionsContainer');
  if (container) {
    container.innerHTML = renderSimScenarioOptions();
  }
}

function updateSimSeverity(val) {
  _activeSimSeverity = val;
}

function promptSimConfirmation() {
  const modal = document.getElementById('simConfirmModal');
  if (modal) modal.style.display = 'flex';
}

function closeSimConfirmModal() {
  const modal = document.getElementById('simConfirmModal');
  if (modal) modal.style.display = 'none';
}

async function executeConfirmedSimulation() {
  closeSimConfirmModal();
  await triggerFloodSimulation();
}

async function triggerFloodSimulation() {
  const launchBtn = document.getElementById('simLaunchBtn');
  const progWrap = document.getElementById('simProgressWrap');
  const progBar = document.getElementById('simProgressBar');
  const progLabel = document.getElementById('simProgressLabel');

  const user = state.user || {};
  const token = state.token;

  if (!token) {
    toast('Please log in to execute simulation dispatches', 'warning');
    return;
  }

  // Read configured channels
  const channels = [];
  if (document.getElementById('chkChSiren')?.checked) channels.push('siren');
  if (document.getElementById('chkChFcm')?.checked) channels.push('fcm');
  if (document.getElementById('chkChEmail')?.checked) channels.push('email');
  if (document.getElementById('chkChSms')?.checked) channels.push('sms');

  const scenario = SIM_SCENARIOS[_activeSimScenario] || SIM_SCENARIOS.coastal_surge;
  const severity = _activeSimSeverity || scenario.defaultSeverity;

  let lat = 13.0827;
  let lon = 80.2707;
  let location = state.selectedDistrict ? `${state.selectedDistrict} Monitoring Sector` : 'Chennai Central Sector';

  if (typeof GeoLocationService !== 'undefined' && GeoLocationService.coords) {
    lat = GeoLocationService.coords.latitude;
    lon = GeoLocationService.coords.longitude;
    location = GeoLocationService.locality || `Live GPS Sector (${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E)`;
  } else if (state.userCoordinates) {
    lat = state.userCoordinates[0];
    lon = state.userCoordinates[1];
  }

  // Lock UI & initiate progress
  if (launchBtn) {
    launchBtn.disabled = true;
    launchBtn.innerHTML = `<span>⏳</span> DISPATCHING MULTI-CHANNEL TELEMETRY...`;
  }
  if (progWrap) progWrap.style.display = 'block';
  if (progBar) progBar.style.width = '20%';

  logSimConsole(`[INITIATE] Authorized simulation dispatch started for ${user.displayName || user.email}`);
  logSimConsole(`[SCENARIO] ${scenario.name} | Severity: ${severity} | Location: ${location}`);

  // Step 1: In-Tab Acoustic Siren
  if (channels.includes('siren')) {
    try {
      logSimConsole(`[1/4] Sounding in-tab acoustic warning siren (Civil Defense Protocol)...`);
      if (typeof AlertSound !== 'undefined' && AlertSound.play) {
        AlertSound.play(severity === 'Critical' ? 'red' : 'orange', { force: true, maxMs: 15000 });
        _simSirenActive = true;
        const banner = document.getElementById('simSirenBanner');
        if (banner) banner.style.display = 'block';

        updateChannelBadge('cardChSiren', 'badgeChSiren', 'ACTIVE WAIL', 'badge-danger');
        const desc = document.getElementById('descChSiren');
        if (desc) desc.innerHTML = `<span style="color:#FF4D6A; font-weight:700;">Acoustic siren sounding in open tab (Web Audio API).</span>`;
      }
    } catch (audioErr) {
      logSimConsole(`[1/4:ERR] Acoustic siren error: ${audioErr.message}`);
    }
  }

  if (progBar) progBar.style.width = '45%';
  if (progLabel) progLabel.textContent = 'Transmitting dispatch payload to backend alert gateway...';

  // Step 2, 3, 4: Backend API Dispatch with Authentication
  try {
    const payload = {
      scenario: scenario.id,
      severity,
      probabilityPct: scenario.probabilityPct,
      location,
      latitude: lat,
      longitude: lon,
      channels,
      directives: scenario.directives,
      testMessage: `[SIMULATION: ${severity.toUpperCase()}] Flood hazard detected (${scenario.probabilityPct}% modeled risk). Immediate citizen safety directives active for ${location}.`
    };

    const res = await fetch(`${API_BASE}/alerts/simulate-resident-flood`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (progBar) progBar.style.width = '85%';

    if (data.success) {
      _currentSimulationId = data.simulationId;
      logSimConsole(`[SUCCESS] Gateway dispatched simulation run ID: ${data.simulationId}`);

      // Display Resident-Facing Alert Preview Card
      const previewCard = document.getElementById('simAlertPreviewCard');
      if (previewCard) {
        previewCard.style.display = 'block';
        const sevBadge = document.getElementById('previewSeverityBadge');
        if (sevBadge) {
          sevBadge.textContent = `${data.severity.toUpperCase()} ALERT (SIMULATED)`;
          sevBadge.className = `badge ${data.severity === 'Critical' ? 'badge-danger' : 'badge-warning'}`;
        }
        const pTitle = document.getElementById('previewTitle');
        if (pTitle) pTitle.textContent = data.alertTitle;
        const pLoc = document.getElementById('previewLocation');
        if (pLoc) pLoc.textContent = `Affected: ${data.location} • Time: ${new Date(data.timestamp).toLocaleTimeString()}`;
        const pBody = document.getElementById('previewBody');
        if (pBody) pBody.textContent = data.alertBody;
        const pDirectives = document.getElementById('previewDirectives');
        if (pDirectives && Array.isArray(data.directives)) {
          pDirectives.innerHTML = data.directives.map(d => `<li>${d}</li>`).join('');
        }
      }

      // 1. Email Status
      const em = data.channels?.email;
      if (em) {
        const emStatus = em.status;
        const isDelivered = emStatus === 'delivered';
        const isSandbox = emStatus === 'sandbox_simulated';
        const badgeClass = isDelivered ? 'badge-success' : isSandbox ? 'badge-info' : 'badge-warning';
        const badgeText = isDelivered ? 'DELIVERED' : isSandbox ? 'SANDBOX (SIMULATED)' : emStatus.toUpperCase();

        updateChannelBadge('cardChEmail', 'badgeChEmail', badgeText, badgeClass);
        const desc = document.getElementById('descChEmail');
        if (desc) desc.innerHTML = `<span style="color:var(--ocean); font-weight:600;">To: ${em.recipient}. Provider: ${em.provider || 'Brevo SMTP'}. MsgID: ${em.messageId ? em.messageId.substring(0, 14) + '...' : 'OK'}</span>`;
        logSimConsole(`[2/4:EMAIL] ${badgeText} to ${em.recipient}`);
      }

      // 2. SMS Status
      const sms = data.channels?.sms;
      if (sms) {
        const smsStatus = sms.status;
        const isDelivered = smsStatus === 'delivered';
        const isSandbox = smsStatus === 'sandbox_simulated';
        const badgeClass = isDelivered ? 'badge-success' : isSandbox ? 'badge-info' : 'badge-warning';
        const badgeText = isDelivered ? 'DELIVERED' : isSandbox ? 'SANDBOX (SIMULATED)' : smsStatus.toUpperCase();

        updateChannelBadge('cardChSms', 'badgeChSms', badgeText, badgeClass);
        const desc = document.getElementById('descChSms');
        if (desc) desc.innerHTML = `<span style="color:var(--ocean); font-weight:600;">To: ${sms.recipient}. Provider: ${sms.provider || 'Cellular SMS'}. SID: ${sms.sid || 'OK'}</span>`;
        logSimConsole(`[3/4:SMS] ${badgeText} to ${sms.recipient}`);
      }

      // 3. FCM Web Push Status
      const fcm = data.channels?.fcm;
      if (fcm) {
        const fcmStatus = fcm.status;
        const badgeClass = fcmStatus === 'delivered' ? 'badge-success' : 'badge-info';
        updateChannelBadge('cardChFcm', 'badgeChFcm', fcmStatus.toUpperCase(), badgeClass);
        logSimConsole(`[4/4:FCM] Push Status: ${fcmStatus} (${fcm.provider || 'Web Push'})`);

        // Show local browser notification if permitted
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          try {
            new Notification(data.alertTitle, {
              body: data.alertBody,
              icon: '/favicon.ico',
              tag: 'floodai-sim-alert'
            });
          } catch (_) {}
        }
      }

      const overallBadge = document.getElementById('simOverallStatusBadge');
      if (overallBadge) {
        overallBadge.textContent = 'DISPATCH VERIFIED';
        overallBadge.className = 'badge badge-success';
      }

      toast('🚨 Simulation alert dispatched successfully!');
      loadSimHistory();
    } else {
      throw new Error(data.error || 'Simulation returned unsuccessful status');
    }
  } catch (err) {
    logSimConsole(`[DISPATCH:ERROR] ${err.message}`);
    toast('Simulation failed: ' + err.message, 'warning');
  } finally {
    if (progBar) progBar.style.width = '100%';
    setTimeout(() => {
      if (launchBtn) {
        launchBtn.disabled = false;
        launchBtn.innerHTML = `<span>🚨</span> LAUNCH TEST FLOOD ALERT DISPATCH`;
      }
      if (progWrap) progWrap.style.display = 'none';
    }, 1200);
  }
}

async function acknowledgeSimulationAlert() {
  if (!_currentSimulationId) {
    toast('No active simulation to acknowledge');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/alerts/simulations/${_currentSimulationId}/acknowledge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      }
    });

    const data = await res.json();
    if (data.success) {
      toast('Alert acknowledged by resident ✅', 'success');
      const ackBtn = document.getElementById('simAcknowledgeBtn');
      if (ackBtn) {
        ackBtn.disabled = true;
        ackBtn.textContent = '✓ Acknowledged';
        ackBtn.className = 'glass-btn btn-ghost';
      }
      stopSimSiren();
      loadSimHistory();
    }
  } catch (err) {
    toast('Acknowledgment failed: ' + err.message, 'warning');
  }
}

async function loadSimHistory() {
  const container = document.getElementById('simHistoryContainer');
  if (!container || !state.token) return;

  try {
    const res = await fetch(`${API_BASE}/alerts/simulations/history`, {
      headers: {
        'Authorization': `Bearer ${state.token}`
      }
    });

    const list = await res.json();
    _simHistory = Array.isArray(list) ? list : [];

    if (_simHistory.length === 0) {
      container.innerHTML = `
        <div style="color:var(--text-2); font-size:12px; text-align:center; padding:16px;">
          No simulation runs recorded yet. Launch your first test alert above.
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <table style="width:100%; border-collapse:collapse; font-size:12px; text-align:left;">
        <thead>
          <tr style="border-bottom:1px solid var(--panel-border); color:var(--text-2); font-family:var(--font-mono); font-size:11px;">
            <th style="padding:8px 10px;">TIMESTAMP</th>
            <th style="padding:8px 10px;">SCENARIO</th>
            <th style="padding:8px 10px;">SEVERITY</th>
            <th style="padding:8px 10px;">SECTOR</th>
            <th style="padding:8px 10px;">CHANNELS</th>
            <th style="padding:8px 10px;">STATUS</th>
          </tr>
        </thead>
        <tbody>
          ${_simHistory.map(row => {
            const time = new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const date = new Date(row.createdAt).toLocaleDateString();
            const channels = row.channelsRequested?.join(', ') || 'siren, fcm';
            const isAck = row.acknowledged;

            return `
              <tr style="border-bottom:1px solid rgba(255,255,255,0.03);">
                <td style="padding:8px 10px; font-family:var(--font-mono); color:var(--text-1);">${date} ${time}</td>
                <td style="padding:8px 10px; font-weight:600; color:var(--text-0);">${row.scenario}</td>
                <td style="padding:8px 10px;">
                  <span class="badge ${row.severity === 'Critical' ? 'badge-danger' : 'badge-warning'}" style="font-size:10px;">
                    ${row.severity}
                  </span>
                </td>
                <td style="padding:8px 10px; color:var(--text-1);">${row.location}</td>
                <td style="padding:8px 10px; font-family:var(--font-mono); font-size:11px; color:var(--cyber);">${channels}</td>
                <td style="padding:8px 10px;">
                  <span class="badge ${isAck ? 'badge-success' : 'badge-ghost'}" style="font-size:10px;">
                    ${isAck ? 'ACKNOWLEDGED' : 'SENT'}
                  </span>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    container.innerHTML = `
      <div style="color:var(--text-2); font-size:12px; text-align:center; padding:16px;">
        Unable to load simulation history: ${err.message}
      </div>
    `;
  }
}

function testSirenAudio() {
  if (typeof AlertSound !== 'undefined' && AlertSound.play) {
    AlertSound.play('orange', { force: true, maxMs: 4000 });
    _simSirenActive = true;
    toast('Playing 4-second siren audio test 🔊');
  } else {
    toast('AlertSound module not loaded', 'warning');
  }
}

function stopSimSiren() {
  if (typeof AlertSound !== 'undefined' && AlertSound.stop) {
    AlertSound.stop();
  }
  _simSirenActive = false;
  const banner = document.getElementById('simSirenBanner');
  if (banner) banner.style.display = 'none';

  updateChannelBadge('cardChSiren', 'badgeChSiren', 'SILENCED', 'badge-ghost');
  const desc = document.getElementById('descChSiren');
  if (desc) desc.innerHTML = 'Acoustic siren silenced. Ready for next simulation trigger.';

  logSimConsole(`[SIREN] Acoustic siren silenced by operator.`);
  toast('Siren audio muted 🔇');
}

function updateChannelBadge(cardId, badgeId, text, badgeClass) {
  const badge = document.getElementById(badgeId);
  if (badge) {
    badge.textContent = text;
    badge.className = `badge ${badgeClass}`;
  }
}

function logSimConsole(msg) {
  const terminal = document.getElementById('simLogTerminal');
  if (!terminal) return;
  const time = new Date().toLocaleTimeString();
  const line = document.createElement('div');
  line.innerHTML = `<span style="color:var(--text-2); font-size:11px;">[${time}]</span> ${msg}`;
  terminal.appendChild(line);
  terminal.scrollTop = terminal.scrollHeight;
}

function clearSimLog() {
  const terminal = document.getElementById('simLogTerminal');
  if (terminal) {
    terminal.innerHTML = `<div style="color:var(--text-2);">[CONSOLE CLEARED] Ready for new simulation run.</div>`;
  }
}
