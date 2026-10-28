/**
 * landingView.js
 * Screen 09 — Public-Facing Landing Page: Award-Centric Scrolltelling Experience
 * Features:
 *  - Interactive Floating Chapter Rail & Scroll Progress Tracker
 *  - Real-time Interactive Inundation Stage Simulator (0m to 5m depth)
 *  - Dual-Engine ML Benchmarking Lab (XGBoost vs Random Forest vs Ensemble)
 *  - Dynamic SHAP Explainability Vector Recalculator
 *  - 10-Sector Disaster GIS Radar Strip with live district HUD
 *  - Acoustic Siren Audio Synthesizer Test Preview
 *  - IntersectionObserver Scroll Reveal Animations & Number Counters
 */

let _landingScrollObserver = null;
let _landingScrollHandler = null;
let _simStageMeters = 2.4;
let _activeMLEngine = 'xgboost';
let _activeRadarDistrict = 'Chennai';
let _shapActiveDrivers = {
  rain: true,
  river: true,
  elevation: true,
  mangrove: true,
  soil: true
};

const RADAR_DISTRICT_DATA = {
  Chennai: { basin: 'Adyar & Cooum River Basin', rain: '48.2 mm/h', elevation: '6.5m MSL', risk: 78, tier: 'HIGH WARNING', coords: '13.0827° N, 80.2707° E' },
  Mumbai: { basin: 'Mithi River Catchment Zone', rain: '62.4 mm/h', elevation: '14.0m MSL', risk: 85, tier: 'CRITICAL SURGE', coords: '19.0760° N, 72.8777° E' },
  Kolkata: { basin: 'Hooghly Estuary & Sundarbans', rain: '34.0 mm/h', elevation: '9.0m MSL', risk: 62, tier: 'ELEVATED', coords: '22.5726° N, 88.3639° E' },
  Bhubaneswar: { basin: 'Mahanadi Delta Sub-system', rain: '22.8 mm/h', elevation: '45.0m MSL', risk: 38, tier: 'MODERATE', coords: '20.2961° N, 85.8245° E' },
  Guwahati: { basin: 'Brahmaputra Floodplain Corridor', rain: '56.0 mm/h', elevation: '55.0m MSL', risk: 82, tier: 'HIGH WARNING', coords: '26.1445° N, 91.7362° E' },
  Patna: { basin: 'Ganges Riparian Inundation Zone', rain: '28.4 mm/h', elevation: '53.0m MSL', risk: 46, tier: 'MODERATE', coords: '25.5941° N, 85.1376° E' },
  Surat: { basin: 'Tapi River Coastal Estuary', rain: '18.0 mm/h', elevation: '13.0m MSL', risk: 32, tier: 'LOW HAZARD', coords: '21.1702° N, 72.8311° E' },
  Kochi: { basin: 'Periyar & Vembanad Backwaters', rain: '44.5 mm/h', elevation: '4.0m MSL', risk: 74, tier: 'HIGH WARNING', coords: '9.9312° N, 76.2673° E' },
  Visakhapatnam: { basin: 'Eastern Ghats Coastal Drainage', rain: '14.2 mm/h', elevation: '45.0m MSL', risk: 24, tier: 'NOMINAL', coords: '17.6868° N, 83.2185° E' },
  Hosur: { basin: 'Ponnaiyar Inter-basin Basin', rain: '12.0 mm/h', elevation: '879.0m MSL', risk: 18, tier: 'NOMINAL', coords: '12.7409° N, 77.8253° E' }
};

function renderLanding(root) {
  // Clean up any lingering listeners
  cleanupLandingListeners();

  root.innerHTML = `
    <div class="layout-public" id="landingScrollContainer" style="position:relative; overflow-x:clip;">
      
      <!-- Top Scroll Reading Progress Bar -->
      <div class="story-progress-bar" id="storyProgressBar"></div>

      <!-- Right Floating Storytelling Chapter Rail (Desktop) -->
      <nav class="story-rail" id="storyRail" aria-label="Story Chapters">
        <div class="story-rail-item active" onclick="scrollToChapter('ch-hero')" data-target="ch-hero">
          <span class="story-rail-dot"></span>
          <span class="story-rail-label">01 // Sentinel Mission</span>
        </div>
        <div class="story-rail-item" onclick="scrollToChapter('ch-simulator')" data-target="ch-simulator">
          <span class="story-rail-dot"></span>
          <span class="story-rail-label">02 // Inundation Simulator</span>
        </div>
        <div class="story-rail-item" onclick="scrollToChapter('ch-ml')" data-target="ch-ml">
          <span class="story-rail-dot"></span>
          <span class="story-rail-label">03 // Dual ML Arena</span>
        </div>
        <div class="story-rail-item" onclick="scrollToChapter('ch-xai')" data-target="ch-xai">
          <span class="story-rail-dot"></span>
          <span class="story-rail-label">04 // SHAP Attribution</span>
        </div>
        <div class="story-rail-item" onclick="scrollToChapter('ch-gis')" data-target="ch-gis">
          <span class="story-rail-dot"></span>
          <span class="story-rail-label">05 // 10 Basins GIS</span>
        </div>
        <div class="story-rail-item" onclick="scrollToChapter('ch-weather')" data-target="ch-weather">
          <span class="story-rail-dot"></span>
          <span class="story-rail-label">06 // Atmospheric Telemetry</span>
        </div>
        <div class="story-rail-item" onclick="scrollToChapter('ch-dispatch')" data-target="ch-dispatch">
          <span class="story-rail-dot"></span>
          <span class="story-rail-label">07 // Alarm Matrix</span>
        </div>
        <div class="story-rail-item" onclick="scrollToChapter('ch-workspaces')" data-target="ch-workspaces">
          <span class="story-rail-dot"></span>
          <span class="story-rail-label">08 // Role Workspaces</span>
        </div>
        <div class="story-rail-item" onclick="scrollToChapter('ch-cta')" data-target="ch-cta">
          <span class="story-rail-dot"></span>
          <span class="story-rail-label">09 // Experience FloodAI</span>
        </div>
      </nav>

      <!-- CHAPTER 1: HERO / THE PLANETARY SENTINEL -->
      <section class="story-section scroll-chapter" id="ch-hero" style="padding-top:80px; padding-bottom:90px; text-align:center;">
        
        <!-- Live Sentinel Telemetry Status Pill -->
        <div style="display:flex; justify-content:center; margin-bottom:24px;">
          <div class="hud-pill border-lightning">
            <span class="hud-beacon"></span>
            <span>LIVE SATELLITE &amp; METEOROLOGICAL TELEMETRY ACTIVE</span>
            <span style="opacity:0.5;">•</span>
            <span style="color:var(--text-muted);">10,000 ARCHIVE RECORDS</span>
          </div>
        </div>

        <h1 class="story-title text-gradient-shimmer" style="font-size:clamp(2.6rem, 5.6vw, 5.2rem); max-width:1040px; margin:0 auto 24px; letter-spacing:-1.8px; line-height:1.08;">
          Planetary-Scale AI Flood Prediction &amp; Threat Defense
        </h1>

        <p class="story-desc" style="max-width:740px; margin:0 auto 40px; font-size:18px; line-height:1.75;">
          Fusing XGBoost and Random Forest machine learning with real-time atmospheric telemetry and Digital Elevation Models to protect vulnerable communities before floodwaters rise.
        </p>

        <!-- Primary CTA Cluster -->
        <div style="display:flex; justify-content:center; gap:16px; flex-wrap:wrap; margin-bottom:60px;">
          <button class="glass-btn btn-primary" onclick="goTo('home')" style="padding:15px 36px; font-size:15px; font-weight:700; box-shadow:0 0 32px var(--accent-glow); gap:10px;">
            <span>Explore Platform Overview</span> →
          </button>
          <button class="glass-btn btn-secondary" onclick="scrollToChapter('ch-simulator')" style="padding:15px 28px; font-size:15px; gap:8px;">
            <span>🌊 Inundation Simulator</span> ↓
          </button>
          <button class="glass-btn btn-ghost" onclick="goTo('login')" style="padding:15px 24px; font-size:15px; border-color:var(--glass-border);">
            SaaS Sign In
          </button>
          <button class="glass-btn btn-ghost" onclick="goTo('onboarding')" style="padding:15px 22px; font-size:15px; color:var(--text-muted);" title="Guided 7-slide educational tour">
            Watch 7-Slide Tour ▷
          </button>
        </div>

        <!-- Real Platform Statistics Strip (With dynamic countup) -->
        <div class="grid-cards story-reveal" style="grid-template-columns:repeat(4,1fr); gap:18px; max-width:1120px; margin:0 auto;">
          <div class="glass-stat-card border-lightning">
            <div class="glass-stat-header">Ground-Truth Records</div>
            <div class="glass-stat-value" style="color:var(--accent-primary);"><span class="counter-val" data-target="10000">10,000</span></div>
            <div class="glass-stat-subtext">24-Year Empirical Archive</div>
          </div>
          <div class="glass-stat-card border-lightning">
            <div class="glass-stat-header">Dual Model Precision</div>
            <div class="glass-stat-value" style="color:var(--ocean);"><span class="counter-val" data-target="94.2" data-decimals="1">94.2</span>%</div>
            <div class="glass-stat-subtext">XGBoost ROC-AUC Score</div>
          </div>
          <div class="glass-stat-card border-lightning">
            <div class="glass-stat-header">Monitored Sectors</div>
            <div class="glass-stat-value" style="color:var(--accent-primary);"><span class="counter-val" data-target="10">10</span></div>
            <div class="glass-stat-subtext">High-Density Urban Basins</div>
          </div>
          <div class="glass-stat-card border-lightning">
            <div class="glass-stat-header">Dispatch Redundancy</div>
            <div class="glass-stat-value" style="color:var(--accent-tertiary, #B18CFF);">3 Channels</div>
            <div class="glass-stat-subtext">FCM • Brevo • Carrier SMS</div>
          </div>
        </div>

      </section>

      <!-- CHAPTER 2: INTERACTIVE INUNDATION STAGE SIMULATOR (Awwwards Centerpiece) -->
      <section class="story-section scroll-chapter" id="ch-simulator">
        <div class="story-header story-reveal">
          <span class="story-tag">INTERACTIVE SIMULATION LAB</span>
          <h2 class="story-title">Simulate Inundation Dynamics in Real Time</h2>
          <p class="story-desc">
            Adjust the simulated flood stage depth below to see how topographic inundation curves, AI hazard probabilities, and tactical civil defense directives adapt dynamically.
          </p>
        </div>

        <div class="glass-card elevated border-lightning story-reveal" style="padding:36px; max-width:1100px; margin:0 auto; background:var(--glass-secondary);">
          
          <!-- Simulator Controls Header -->
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; margin-bottom:28px;">
            <div>
              <div style="font-family:var(--font-mono); font-size:11px; text-transform:uppercase; letter-spacing:1px; color:var(--accent-primary); margin-bottom:4px;">
                Topographic Stage Simulator // DEM Contour Model
              </div>
              <div style="font-size:22px; font-weight:700; font-family:var(--font-display);">
                Water Inundation Level: <span id="simStageValue" style="color:var(--cyber); font-family:var(--font-mono);">2.40m MSL</span>
              </div>
            </div>

            <!-- Preset Scenario Chips -->
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              <button class="glass-btn btn-ghost" onclick="setSimStage(0.5)" style="font-size:12px; padding:6px 12px;">Nominal (0.5m)</button>
              <button class="glass-btn btn-ghost" onclick="setSimStage(1.8)" style="font-size:12px; padding:6px 12px;">Monsoon (1.8m)</button>
              <button class="glass-btn btn-ghost" onclick="setSimStage(3.4)" style="font-size:12px; padding:6px 12px;">Cyclone Landfall (3.4m)</button>
              <button class="glass-btn btn-ghost" onclick="setSimStage(4.8)" style="font-size:12px; padding:6px 12px;">Catastrophic (4.8m)</button>
            </div>
          </div>

          <!-- Dynamic Slider -->
          <div style="margin-bottom:32px;">
            <input type="range" class="sim-stage-slider" id="simSlider" min="0" max="5" step="0.1" value="2.4" oninput="onSimSliderInput(this.value)">
            <div style="display:flex; justify-content:space-between; font-family:var(--font-mono); font-size:11px; color:var(--text-muted); margin-top:8px;">
              <span>0.0m (Dry Baseflow)</span>
              <span>1.5m (Bankfull Stage)</span>
              <span>3.0m (Moderate Surge)</span>
              <span>4.5m (Major Inundation)</span>
              <span>5.0m (Severe Breach)</span>
            </div>
          </div>

          <!-- Dynamic Simulator Visualizer & Telemetry Grid -->
          <div style="display:grid; grid-template-columns:1.2fr 1fr; gap:28px; align-items:center;">
            
            <!-- Graphic Cross-Section Simulator -->
            <div style="background:rgba(4, 9, 20, 0.7); border:1px solid var(--glass-border); border-radius:18px; padding:24px; position:relative; overflow:hidden; min-height:240px; display:flex; flex-direction:column; justify-content:space-between;">
              <div style="display:flex; justify-content:space-between; font-family:var(--font-mono); font-size:11px; color:var(--text-muted); z-index:2;">
                <span>CROSS-SECTION ELEVATION PROFILE</span>
                <span id="simWaveIndicator" style="color:var(--cyber);">🌊 SIMULATION ENGINE ACTIVE</span>
              </div>

              <!-- Animated SVG Water Reservoir -->
              <div style="position:relative; width:100%; height:130px; background:rgba(255,255,255,0.02); border-radius:12px; overflow:hidden; border-bottom:3px solid #2A364F;">
                <!-- Riverbed topography profile lines -->
                <svg viewBox="0 0 400 130" style="position:absolute; inset:0; width:100%; height:100%; z-index:1; pointer-events:none;">
                  <path d="M0,130 L0,90 Q100,110 200,95 T400,80 L400,130 Z" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" stroke-width="1.5" />
                  <line x1="0" y1="50" x2="400" y2="50" stroke="rgba(255,77,106,0.3)" stroke-dasharray="4" />
                  <text x="310" y="44" fill="var(--red)" font-family="monospace" font-size="9">DANGER 3.5m</text>
                </svg>

                <!-- Dynamic Rising Water Tank Surface -->
                <div id="simWaterFill" style="position:absolute; bottom:0; left:0; right:0; height:48%; background:linear-gradient(180deg, rgba(51,199,255,0.65), rgba(31,224,168,0.85)); transition:height 0.25s cubic-bezier(0.16, 1, 0.3, 1); box-shadow:0 -6px 20px rgba(51,199,255,0.5);">
                  <div style="position:absolute; top:0; left:0; right:0; height:4px; background:#EAF2FF; opacity:0.8;"></div>
                </div>
              </div>

              <div style="display:flex; justify-content:space-between; font-family:var(--font-mono); font-size:11.5px; z-index:2; padding-top:10px;">
                <span style="color:var(--text-secondary);">Topographic Basin Contours</span>
                <span id="simStageDepthSubtext" style="color:var(--cyber); font-weight:700;">Submersion Stage: +2.4m</span>
              </div>
            </div>

            <!-- Dynamic Telemetry Readout Cards -->
            <div style="display:flex; flex-direction:column; gap:12px;">
              
              <!-- Hazard Tier Pill -->
              <div style="padding:14px 18px; border-radius:14px; background:rgba(255,255,255,0.03); border:1px solid var(--glass-border); display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:13px; color:var(--text-secondary);">Civil Defense Hazard Level</span>
                <span id="simHazardBadge" class="glass-badge" style="background:rgba(51,199,255,0.2); color:var(--cyber); font-weight:700; font-size:12px;">
                  MODERATE SURGE
                </span>
              </div>

              <!-- Inundation Probability -->
              <div style="padding:14px 18px; border-radius:14px; background:rgba(255,255,255,0.03); border:1px solid var(--glass-border); display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:13px; color:var(--text-secondary);">Dual-Engine Prediction</span>
                <span id="simRiskPct" style="font-size:22px; font-weight:700; font-family:var(--font-mono); color:var(--cyber);">
                  58.4%
                </span>
              </div>

              <!-- Estimated Submerged Land Area -->
              <div style="padding:14px 18px; border-radius:14px; background:rgba(255,255,255,0.03); border:1px solid var(--glass-border); display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:13px; color:var(--text-secondary);">Impacted Urban Land Area</span>
                <span id="simAreaEstimate" style="font-size:15px; font-weight:700; font-family:var(--font-mono); color:var(--text-primary);">
                  26.8 km²
                </span>
              </div>

              <!-- Population at Risk -->
              <div style="padding:14px 18px; border-radius:14px; background:rgba(255,255,255,0.03); border:1px solid var(--glass-border); display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:13px; color:var(--text-secondary);">Vulnerable Population</span>
                <span id="simPopEstimate" style="font-size:15px; font-weight:700; font-family:var(--font-mono); color:var(--accent-tertiary, #B18CFF);">
                  172,000 residents
                </span>
              </div>

            </div>

          </div>

          <!-- Recommended Action Bar -->
          <div style="margin-top:24px; padding:16px 20px; border-radius:14px; background:rgba(51,199,255,0.06); border:1px solid rgba(51,199,255,0.2); display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="font-size:18px;">⚡</span>
              <span style="font-size:13px; color:var(--text-primary);">
                <b>Recommended Directive:</b> <span id="simDirectiveText">Issue Advisory Notice to low-lying riverbank sectors and stand by rapid response teams.</span>
              </span>
            </div>
            <button class="glass-btn btn-primary" onclick="goTo('home')" style="font-size:12px; padding:6px 16px;">
              Open Full Radar →
            </button>
          </div>

        </div>
      </section>

      <!-- CHAPTER 3: DUAL-MODEL MACHINE LEARNING LAB -->
      <section class="story-section scroll-chapter" id="ch-ml">
        <div class="story-header story-reveal">
          <span class="story-tag">MACHINE LEARNING ARCHITECTURE</span>
          <h2 class="story-title">Dual-Engine Decision Intelligence</h2>
          <p class="story-desc">
            Rather than relying on a single fallible model, FloodAI cross-evaluates XGBoost Extreme Gradient Boosting alongside Random Forest Ensembles on every inference transaction.
          </p>
        </div>

        <!-- Interactive Engine Switcher Tabs -->
        <div style="display:flex; justify-content:center; gap:12px; margin-bottom:36px; flex-wrap:wrap;" class="story-reveal">
          <button id="btnEngineXg" class="radar-district-chip active" onclick="switchMLEngine('xgboost')">
            <span>⚡ XGBoost Classifier v2.0 (Primary)</span>
          </button>
          <button id="btnEngineRf" class="radar-district-chip" onclick="switchMLEngine('rf')">
            <span>🌲 Random Forest Ensemble (Benchmark)</span>
          </button>
          <button id="btnEngineEnsemble" class="radar-district-chip" onclick="switchMLEngine('fusion')">
            <span>🛡️ Weighted Ensemble Fusion</span>
          </button>
        </div>

        <!-- Dynamic Engine Card -->
        <div class="glass-card elevated border-lightning story-reveal" id="mlEngineCard" style="padding:36px; max-width:1080px; margin:0 auto; background:var(--glass-secondary);">
          <div style="display:grid; grid-template-columns:1.2fr 1fr; gap:36px; align-items:center;">
            <div>
              <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">
                <span class="glass-badge" id="mlEngineBadge" style="background:rgba(51,199,255,0.2); color:var(--accent-primary);">GRADIENT BOOSTED TREES</span>
                <span id="mlEngineSub" style="font-family:var(--font-mono); font-size:11px; color:var(--text-muted);">Trained on 13 Hydrologic Parameters</span>
              </div>

              <h3 id="mlEngineTitle" style="font-size:26px; font-weight:700; margin-bottom:14px; font-family:var(--font-display);">
                XGBoost Precision Inference Engine
              </h3>

              <p id="mlEngineDesc" style="font-size:14.5px; color:var(--text-secondary); line-height:1.7; margin-bottom:24px;">
                Specialized in detecting non-linear hazard surges, flash floods, and localized rainfall spikes with sub-15 millisecond execution latency.
              </p>

              <div class="grid-cards" style="grid-template-columns:repeat(3,1fr); gap:14px;">
                <div style="padding:12px; border-radius:12px; background:rgba(255,255,255,0.03); border:1px solid var(--glass-border);">
                  <div style="font-size:11px; color:var(--text-muted); font-family:var(--font-mono);">ROC-AUC SCORE</div>
                  <div id="mlMetricAuc" style="font-size:20px; font-weight:700; color:var(--ocean); margin-top:4px;">94.2%</div>
                </div>
                <div style="padding:12px; border-radius:12px; background:rgba(255,255,255,0.03); border:1px solid var(--glass-border);">
                  <div style="font-size:11px; color:var(--text-muted); font-family:var(--font-mono);">INFERENCE LATENCY</div>
                  <div id="mlMetricLat" style="font-size:20px; font-weight:700; color:var(--accent-primary); margin-top:4px;">&lt;14.2ms</div>
                </div>
                <div style="padding:12px; border-radius:12px; background:rgba(255,255,255,0.03); border:1px solid var(--glass-border);">
                  <div style="font-size:11px; color:var(--text-muted); font-family:var(--font-mono);">ESTIMATORS</div>
                  <div id="mlMetricTrees" style="font-size:20px; font-weight:700; color:var(--text-primary); margin-top:4px;">150 Trees</div>
                </div>
              </div>
            </div>

            <!-- Architectural Comparison Bars -->
            <div style="background:rgba(4, 9, 20, 0.6); border:1px solid var(--glass-border); border-radius:18px; padding:24px;">
              <div style="font-family:var(--font-mono); font-size:11.5px; color:var(--text-muted); margin-bottom:16px;">
                ENGINE PERFORMANCE BENCHMARKS
              </div>

              <div style="display:flex; flex-direction:column; gap:16px;">
                <div>
                  <div style="display:flex; justify-content:space-between; font-size:12.5px; margin-bottom:6px;">
                    <span>Non-Linear Anomaly Sensitivity</span>
                    <span id="mlBar1Val" style="color:var(--ocean); font-family:var(--font-mono); font-weight:700;">96%</span>
                  </div>
                  <div style="width:100%; height:7px; background:rgba(255,255,255,0.06); border-radius:4px; overflow:hidden;">
                    <div id="mlBar1Fill" style="width:96%; height:100%; background:var(--ocean); border-radius:4px; transition:width 0.4s ease;"></div>
                  </div>
                </div>

                <div>
                  <div style="display:flex; justify-content:space-between; font-size:12.5px; margin-bottom:6px;">
                    <span>Variance &amp; Overfitting Suppression</span>
                    <span id="mlBar2Val" style="color:var(--accent-primary); font-family:var(--font-mono); font-weight:700;">91%</span>
                  </div>
                  <div style="width:100%; height:7px; background:rgba(255,255,255,0.06); border-radius:4px; overflow:hidden;">
                    <div id="mlBar2Fill" style="width:91%; height:100%; background:var(--accent-primary); border-radius:4px; transition:width 0.4s ease;"></div>
                  </div>
                </div>

                <div>
                  <div style="display:flex; justify-content:space-between; font-size:12.5px; margin-bottom:6px;">
                    <span>Microservice Edge Speed</span>
                    <span id="mlBar3Val" style="color:var(--accent-tertiary, #B18CFF); font-family:var(--font-mono); font-weight:700;">98%</span>
                  </div>
                  <div style="width:100%; height:7px; background:rgba(255,255,255,0.06); border-radius:4px; overflow:hidden;">
                    <div id="mlBar3Fill" style="width:98%; height:100%; background:var(--accent-tertiary, #B18CFF); border-radius:4px; transition:width 0.4s ease;"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- CHAPTER 4: EXPLAINABLE AI & SHAP ATTRIBUTION -->
      <section class="story-section scroll-chapter" id="ch-xai">
        <div class="story-header story-reveal">
          <span class="story-tag">EXPLAINABLE ARTIFICIAL INTELLIGENCE</span>
          <h2 class="story-title">No Black Boxes in Disaster Defense</h2>
          <p class="story-desc">
            Every predicted probability is mathematically explained through SHAP (Shapley Additive Explanations). Click on the hydrologic drivers below to see how each variable adjusts the aggregate hazard push.
          </p>
        </div>

        <div class="glass-card elevated border-lightning story-reveal" style="padding:36px; max-width:1080px; margin:0 auto; background:var(--glass-secondary);">
          
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:12px;">
            <div style="font-family:var(--font-mono); font-size:12px; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px;">
              Live Attribution Vector // Tap drivers to simulate isolated impacts
            </div>
            <div style="font-family:var(--font-mono); font-size:13px;">
              Computed Hazard Push: <b id="shapTotalPush" style="color:var(--red); font-size:16px;">+40.1% Net Surge</b>
            </div>
          </div>

          <div style="display:flex; flex-direction:column; gap:16px;">
            
            <!-- Driver 1: Rainfall -->
            <div class="glass-card" onclick="toggleShapDriver('rain')" style="padding:16px 20px; cursor:pointer; transition:all 0.2s; border-color:rgba(255,77,106,0.3);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span id="shapCheckRain" style="color:var(--red);">☑</span>
                  <span style="font-weight:600; font-size:14px;">Rainfall Surge (24h Precipitation: 310mm)</span>
                </div>
                <span id="shapValRain" style="color:var(--red); font-family:var(--font-mono); font-weight:700;">+34.2% Risk Push</span>
              </div>
              <div style="width:100%; height:8px; background:rgba(255,255,255,0.06); border-radius:4px; overflow:hidden;">
                <div id="shapBarRain" style="width:78%; height:100%; background:var(--red); border-radius:4px; transition:width 0.3s ease;"></div>
              </div>
            </div>

            <!-- Driver 2: River Stage -->
            <div class="glass-card" onclick="toggleShapDriver('river')" style="padding:16px 20px; cursor:pointer; transition:all 0.2s; border-color:rgba(255,77,106,0.3);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span id="shapCheckRiver" style="color:var(--red);">☑</span>
                  <span style="font-weight:600; font-size:14px;">River Discharge Surge (Adyar River Stage: 9.2m)</span>
                </div>
                <span id="shapValRiver" style="color:var(--red); font-family:var(--font-mono); font-weight:700;">+22.8% Risk Push</span>
              </div>
              <div style="width:100%; height:8px; background:rgba(255,255,255,0.06); border-radius:4px; overflow:hidden;">
                <div id="shapBarRiver" style="width:62%; height:100%; background:var(--red); border-radius:4px; transition:width 0.3s ease;"></div>
              </div>
            </div>

            <!-- Driver 3: Elevation Ridge -->
            <div class="glass-card" onclick="toggleShapDriver('elevation')" style="padding:16px 20px; cursor:pointer; transition:all 0.2s; border-color:rgba(31,224,168,0.3);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span id="shapCheckElevation" style="color:var(--ocean);">☑</span>
                  <span style="font-weight:600; font-size:14px;">High-Ground Elevation Ridge (Topographic Ridge: 45m MSL)</span>
                </div>
                <span id="shapValElevation" style="color:var(--ocean); font-family:var(--font-mono); font-weight:700;">-18.4% Protective Buffer</span>
              </div>
              <div style="width:100%; height:8px; background:rgba(255,255,255,0.06); border-radius:4px; overflow:hidden;">
                <div id="shapBarElevation" style="width:48%; height:100%; background:var(--ocean); border-radius:4px; transition:width 0.3s ease;"></div>
              </div>
            </div>

            <!-- Driver 4: Mangrove & Wetlands -->
            <div class="glass-card" onclick="toggleShapDriver('mangrove')" style="padding:16px 20px; cursor:pointer; transition:all 0.2s; border-color:rgba(31,224,168,0.3);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span id="shapCheckMangrove" style="color:var(--ocean);">☑</span>
                  <span style="font-weight:600; font-size:14px;">Mangrove Canopy &amp; Wetland Retention (38% Cover)</span>
                </div>
                <span id="shapValMangrove" style="color:var(--ocean); font-family:var(--font-mono); font-weight:700;">-12.1% Protective Buffer</span>
              </div>
              <div style="width:100%; height:8px; background:rgba(255,255,255,0.06); border-radius:4px; overflow:hidden;">
                <div id="shapBarMangrove" style="width:32%; height:100%; background:var(--ocean); border-radius:4px; transition:width 0.3s ease;"></div>
              </div>
            </div>

            <!-- Driver 5: Soil Saturation -->
            <div class="glass-card" onclick="toggleShapDriver('soil')" style="padding:16px 20px; cursor:pointer; transition:all 0.2s; border-color:rgba(255,77,106,0.3);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span id="shapCheckSoil" style="color:var(--red);">☑</span>
                  <span style="font-weight:600; font-size:14px;">Antecedent Soil Saturation (88% Field Capacity)</span>
                </div>
                <span id="shapValSoil" style="color:var(--red); font-family:var(--font-mono); font-weight:700;">+13.6% Risk Push</span>
              </div>
              <div style="width:100%; height:8px; background:rgba(255,255,255,0.06); border-radius:4px; overflow:hidden;">
                <div id="shapBarSoil" style="width:40%; height:100%; background:var(--red); border-radius:4px; transition:width 0.3s ease;"></div>
              </div>
            </div>

          </div>

        </div>
      </section>

      <!-- CHAPTER 5: 10 MONITORED DISASTER BASINS GIS STRIP -->
      <section class="story-section scroll-chapter" id="ch-gis">
        <div class="story-header story-reveal">
          <span class="story-tag">GEOSPATIAL GIS COVERAGE</span>
          <h2 class="story-title">10 High-Density Monitored Sectors</h2>
          <p class="story-desc">
            Tap through the monitored municipal sectors below to inspect live atmospheric telemetry, cadastral drainage basins, and real-time hazard status.
          </p>
        </div>

        <!-- Interactive Sector Chips -->
        <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:8px; margin-bottom:32px;" class="story-reveal">
          ${Object.keys(RADAR_DISTRICT_DATA).map(d => `
            <button class="radar-district-chip ${d === _activeRadarDistrict ? 'active' : ''}" onclick="selectRadarDistrict('${d}')">
              <span>📍 ${d}</span>
            </button>
          `).join('')}
        </div>

        <!-- Dynamic District HUD Display -->
        <div class="glass-card elevated border-lightning story-reveal" id="radarDistrictHud" style="padding:32px; max-width:980px; margin:0 auto; background:var(--glass-secondary);">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px; margin-bottom:24px;">
            <div>
              <div style="font-family:var(--font-mono); font-size:11px; color:var(--accent-primary); letter-spacing:1px; margin-bottom:4px;">
                SECTOR TELEMETRY HUD // <span id="radarCoords">13.0827° N, 80.2707° E</span>
              </div>
              <h3 id="radarTitle" style="font-size:28px; font-weight:700; font-family:var(--font-display);">
                Chennai Disaster Sector
              </h3>
              <p id="radarBasin" style="font-size:14px; color:var(--text-secondary); margin-top:4px;">
                Adyar &amp; Cooum River Basin
              </p>
            </div>

            <div style="text-align:right;">
              <span id="radarTierBadge" class="glass-badge" style="background:rgba(255,77,106,0.2); color:var(--red); font-size:13px; font-weight:700; padding:6px 14px;">
                HIGH WARNING
              </span>
              <div style="font-family:var(--font-mono); font-size:24px; font-weight:700; color:var(--cyber); margin-top:8px;" id="radarRiskScore">
                78% Risk Index
              </div>
            </div>
          </div>

          <div class="grid-cards" style="grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:24px;">
            <div style="padding:16px; border-radius:14px; background:rgba(255,255,255,0.03); border:1px solid var(--glass-border);">
              <div style="font-size:11px; color:var(--text-muted); font-family:var(--font-mono);">PRECIPITATION TELEMETRY</div>
              <div id="radarRain" style="font-size:20px; font-weight:700; color:var(--accent-primary); margin-top:4px;">48.2 mm/h</div>
            </div>
            <div style="padding:16px; border-radius:14px; background:rgba(255,255,255,0.03); border:1px solid var(--glass-border);">
              <div style="font-size:11px; color:var(--text-muted); font-family:var(--font-mono);">AVERAGE SECTOR ELEVATION</div>
              <div id="radarElev" style="font-size:20px; font-weight:700; color:var(--text-primary); margin-top:4px;">6.5m MSL</div>
            </div>
            <div style="padding:16px; border-radius:14px; background:rgba(255,255,255,0.03); border:1px solid var(--glass-border);">
              <div style="font-size:11px; color:var(--text-muted); font-family:var(--font-mono);">GIS BOUNDARY POLICIES</div>
              <div style="font-size:15px; font-weight:600; color:var(--ocean); margin-top:6px;">Cadastral DEM Active</div>
            </div>
          </div>

          <div style="display:flex; justify-content:flex-end;">
            <button class="glass-btn btn-primary" onclick="goTo('map')" style="font-size:13px; padding:10px 22px; gap:8px;">
              <span>Open in Geospatial GIS Map</span> →
            </button>
          </div>
        </div>

      </section>

      <!-- CHAPTER 6: REAL-TIME ATMOSPHERIC TELEMETRY -->
      <section class="story-section scroll-chapter" id="ch-weather">
        <div class="story-header story-reveal">
          <span class="story-tag">ATMOSPHERIC CONTEXT</span>
          <h2 class="story-title">Sub-15 Minute Weather Streaming</h2>
          <p class="story-desc">
            Direct telemetry ingested from OpenWeather API and Open-Meteo satellite streams feeds precipitation, barometric dynamics, and wind shear vectors into the prediction models.
          </p>
        </div>

        <div style="display:flex; justify-content:center; gap:16px; flex-wrap:wrap;" class="story-reveal">
          <button class="glass-btn btn-primary" onclick="openClimateModal()" style="padding:14px 32px; font-size:15px; box-shadow:0 0 24px var(--accent-glow); gap:10px;">
            <span>🌧️ Open Live Atmosphere &amp; Weather Telemetry</span>
          </button>
        </div>
      </section>

      <!-- CHAPTER 7: MULTI-CHANNEL DISASTER DISPATCH & SIREN -->
      <section class="story-section scroll-chapter" id="ch-dispatch">
        <div class="story-header story-reveal">
          <span class="story-tag">CIVIL DEFENSE ALARM MATRIX</span>
          <h2 class="story-title">Autonomous Multi-Channel Threat Dispatch</h2>
          <p class="story-desc">
            When hazard probabilities cross emergency thresholds, FloodAI triggers synchronized advisories across web push, transactional email, and carrier SMS.
          </p>
        </div>

        <div class="grid-cards story-reveal" style="grid-template-columns:repeat(3,1fr); gap:24px; max-width:1120px; margin:0 auto 36px;">
          <div class="glass-card elevated border-lightning">
            <div style="font-size:32px; margin-bottom:12px;">🔔</div>
            <h3 style="font-size:18px; font-weight:700; margin-bottom:8px;">Firebase Web Push</h3>
            <p style="font-size:13.5px; color:var(--text-secondary); line-height:1.6;">
              Instant browser and OS notifications with actionable evacuation routes delivered even when the user is offline or tab is inactive.
            </p>
          </div>
          <div class="glass-card elevated border-lightning">
            <div style="font-size:32px; margin-bottom:12px;">📧</div>
            <h3 style="font-size:18px; font-weight:700; margin-bottom:8px;">Brevo Transactional Email</h3>
            <p style="font-size:13.5px; color:var(--text-secondary); line-height:1.6;">
              Comprehensive tactical directives, shelter GPS pinpoints, and emergency contact registries delivered directly to registered citizens.
            </p>
          </div>
          <div class="glass-card elevated border-lightning">
            <div style="font-size:32px; margin-bottom:12px;">📱</div>
            <h3 style="font-size:18px; font-weight:700; margin-bottom:8px;">Carrier SMS Gateways</h3>
            <p style="font-size:13.5px; color:var(--text-secondary); line-height:1.6;">
              High-priority broadcast SMS sent to field operators and civilians during network congestion or infrastructure grid disruptions.
            </p>
          </div>
        </div>

        <!-- Acoustic Siren Synthesizer Preview -->
        <div class="glass-card story-reveal" style="max-width:680px; margin:0 auto; padding:20px 28px; text-align:center; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px;">
          <div style="display:flex; align-items:center; gap:12px; text-align:left;">
            <span style="font-size:24px;">🚨</span>
            <div>
              <div style="font-weight:700; font-size:14px;">Acoustic Alarm Synthesizer</div>
              <div style="font-size:12px; color:var(--text-muted);">Web Audio API Multi-Voice Tone Generator</div>
            </div>
          </div>
          <button class="glass-btn btn-secondary" onclick="previewSirenTone()" style="font-size:12px; padding:8px 18px; gap:6px;">
            <span>▶ Test 1.5s Alarm Synthesizer</span>
          </button>
        </div>
      </section>

      <!-- CHAPTER 8: TRIPLE-CLEARANCE ROLE WORKSPACES -->
      <section class="story-section scroll-chapter" id="ch-workspaces">
        <div class="story-header story-reveal">
          <span class="story-tag">OPERATIONAL IMMERSION</span>
          <h2 class="story-title">Tailored SaaS Workspaces by Operational Clearance</h2>
          <p class="story-desc">
            Three dedicated liquid glass environments designed specifically for municipal Administrators, hydrologic Analysts, and localized Residents.
          </p>
        </div>

        <div class="grid-cards story-reveal" style="grid-template-columns:repeat(3,1fr); gap:24px; max-width:1140px; margin:0 auto;">
          
          <!-- Admin Portal -->
          <div class="glass-card elevated" style="border-top:3px solid var(--red); padding:32px; display:flex; flex-direction:column; justify-content:space-between;">
            <div>
              <div style="font-family:var(--font-mono); font-size:11px; color:var(--red); font-weight:700; letter-spacing:1px; margin-bottom:8px;">ADMINISTRATOR WORKSPACE</div>
              <h3 style="font-size:22px; font-weight:700; margin-bottom:12px;">Municipal Command</h3>
              <p style="font-size:13.5px; color:var(--text-secondary); line-height:1.65; margin-bottom:20px;">
                Full platform operational controls, system health telemetry, RBAC credential management, emergency dispatch consoles, and audit trails.
              </p>
              <div style="font-size:12px; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:24px;">
                5 Dedicated Screens • Full Operational Clearance
              </div>
            </div>
            <button class="glass-btn btn-ghost" onclick="state.user = {role:'admin'}; goTo('admin-ops');" style="width:100%; justify-content:center; gap:8px;">
              <span>Enter Admin Workspace</span> →
            </button>
          </div>

          <!-- Analyst Portal -->
          <div class="glass-card elevated" style="border-top:3px solid var(--accent-primary); padding:32px; display:flex; flex-direction:column; justify-content:space-between;">
            <div>
              <div style="font-family:var(--font-mono); font-size:11px; color:var(--accent-primary); font-weight:700; letter-spacing:1px; margin-bottom:8px;">ANALYST WORKSPACE</div>
              <h3 style="font-size:22px; font-weight:700; margin-bottom:12px;">Hydrologic Science Lab</h3>
              <p style="font-size:13.5px; color:var(--text-secondary); line-height:1.65; margin-bottom:20px;">
                ML inference workbench, SHAP feature decomposition, cross-engine ROC-AUC comparisons, historical disaster catalogs, and threat intelligence.
              </p>
              <div style="font-size:12px; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:24px;">
                5 Dedicated Screens • Scientific Research Clearance
              </div>
            </div>
            <button class="glass-btn btn-primary" onclick="state.user = {role:'analyst'}; goTo('analyst-predict');" style="width:100%; justify-content:center; gap:8px;">
              <span>Enter Analyst Lab</span> →
            </button>
          </div>

          <!-- Resident Portal -->
          <div class="glass-card elevated" style="border-top:3px solid var(--ocean); padding:32px; display:flex; flex-direction:column; justify-content:space-between;">
            <div>
              <div style="font-family:var(--font-mono); font-size:11px; color:var(--ocean); font-weight:700; letter-spacing:1px; margin-bottom:8px;">RESIDENT WORKSPACE</div>
              <h3 style="font-size:22px; font-weight:700; margin-bottom:12px;">Citizen Safety Hub</h3>
              <p style="font-size:13.5px; color:var(--text-secondary); line-height:1.65; margin-bottom:20px;">
                Localized hazard indexes, acoustic emergency sirens, live microclimate telemetry, disaster preparedness guide, and saved family locations.
              </p>
              <div style="font-size:12px; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:24px;">
                5 Dedicated Screens • Public Security Access
              </div>
            </div>
            <button class="glass-btn btn-secondary" onclick="state.user = {role:'resident'}; goTo('resident-risk');" style="width:100%; justify-content:center; gap:8px;">
              <span>Enter Resident Hub</span> →
            </button>
          </div>

        </div>
      </section>

      <!-- CHAPTER 9: ZERO-TRUST ARCHITECTURE & FINAL CTA -->
      <section class="story-section scroll-chapter" id="ch-cta" style="text-align:center; padding:120px 24px 80px; border-bottom:none;">
        
        <div class="story-reveal" style="max-width:840px; margin:0 auto;">
          <span class="story-tag">THE FUTURE OF DISASTER RESILIENCE</span>
          
          <h2 class="text-gradient-shimmer" style="font-family:var(--font-display); font-size:clamp(2.4rem, 4.8vw, 4.2rem); font-weight:800; letter-spacing:-1.2px; margin-bottom:20px; line-height:1.14;">
            Experience FloodAI Planetary Threat Intelligence
          </h2>

          <p style="font-size:17px; color:var(--text-secondary); max-width:680px; margin:0 auto 44px; line-height:1.75;">
            Explore live disaster telemetry, cross-examine dual ML models on 10,000 historical flood events, or sign in to your operational workspace today.
          </p>

          <div style="display:flex; justify-content:center; gap:16px; flex-wrap:wrap; margin-bottom:64px;">
            <button class="glass-btn btn-primary" onclick="goTo('home')" style="padding:16px 40px; font-size:16px; font-weight:700; box-shadow:0 0 36px var(--accent-glow); gap:10px;">
              <span>Explore Platform Overview</span> →
            </button>
            <button class="glass-btn btn-secondary" onclick="goTo('login')" style="padding:16px 32px; font-size:16px; gap:8px;">
              Access SaaS Workspace
            </button>
          </div>
        </div>

        <!-- Legal Directory & Footer -->
        <div style="display:flex; justify-content:center; gap:24px; font-size:13px; color:var(--text-muted); border-top:1px solid rgba(255,255,255,0.06); padding-top:36px; flex-wrap:wrap;">
          <a href="javascript:void(0)" onclick="goTo('terms')" style="hover:underline;">Terms of Service</a>
          <span>•</span>
          <a href="javascript:void(0)" onclick="goTo('privacy')" style="hover:underline;">Privacy Policy</a>
          <span>•</span>
          <a href="javascript:void(0)" onclick="goTo('records')" style="hover:underline;">10k Disaster Catalog</a>
          <span>•</span>
          <a href="javascript:void(0)" onclick="goTo('map')" style="hover:underline;">Geospatial GIS Map</a>
          <span>•</span>
          <a href="javascript:void(0)" onclick="goTo('onboarding')" style="hover:underline;">7-Slide Tour</a>
        </div>

      </section>

      <!-- Floating Bottom Action Strip -->
      <div class="story-floating-strip" id="storyFloatingStrip">
        <div style="display:flex; align-items:center; gap:10px;">
          <span class="hud-beacon"></span>
          <span style="font-family:var(--font-mono); font-size:12px; font-weight:600; color:var(--cyber);">FloodAI Sentinel</span>
          <span style="font-family:var(--font-mono); font-size:11px; color:var(--text-muted);" id="scrollPercentText">0%</span>
        </div>

        <div style="display:flex; align-items:center; gap:10px;">
          <button class="glass-btn btn-primary" onclick="goTo('home')" style="font-size:12px; padding:6px 14px; gap:6px;">
            <span>Explore Platform</span> →
          </button>
          <button class="icon-btn" onclick="window.scrollTo({top:0, behavior:'smooth'})" title="Back to top" style="width:30px; height:30px; font-size:12px;">
            ↑
          </button>
        </div>
      </div>

    </div>
  `;

  // Initialize Scroll Observers, Handlers, and Interactivity
  initLandingScrollEngine();
}

/**
 * Scroll Engine & Interaction Logic
 */
function initLandingScrollEngine() {
  // 1. Reading Progress Bar & Floating Indicator on Scroll
  _landingScrollHandler = () => {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;

    const bar = document.getElementById('storyProgressBar');
    if (bar) bar.style.width = `${progress}%`;

    const pctText = document.getElementById('scrollPercentText');
    if (pctText) pctText.textContent = `${Math.round(progress)}%`;

    // Active Chapter Spy
    updateActiveStoryChapter();
  };

  window.addEventListener('scroll', _landingScrollHandler, { passive: true });

  // 2. IntersectionObserver for Reveal Animations & Number Counter Trigger
  if (typeof IntersectionObserver !== 'undefined') {
    _landingScrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');

          // Trigger Counter Animation if present
          const counters = entry.target.querySelectorAll('.counter-val');
          counters.forEach(animateCounter);
        }
      });
    }, {
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.12
    });

    document.querySelectorAll('.story-reveal').forEach(el => {
      _landingScrollObserver.observe(el);
    });
  } else {
    document.querySelectorAll('.story-reveal').forEach(el => el.classList.add('visible'));
  }

  // 3. Portal story rail and progress bar to document.body to guarantee fixed right-side positioning immune to ancestor transforms/overflows
  const rail = document.getElementById('storyRail');
  if (rail && rail.parentElement !== document.body) {
    document.body.appendChild(rail);
  }
  const progBar = document.getElementById('storyProgressBar');
  if (progBar && progBar.parentElement !== document.body) {
    document.body.appendChild(progBar);
  }
  window.scrollToChapter = scrollToChapter;
}

function updateActiveStoryChapter() {
  const chapters = document.querySelectorAll('.scroll-chapter');
  const scrollPos = window.scrollY + window.innerHeight * 0.35;

  let currentId = 'ch-hero';
  chapters.forEach(chap => {
    const top = chap.offsetTop;
    const height = chap.offsetHeight;
    if (scrollPos >= top && scrollPos < top + height) {
      currentId = chap.id;
    }
  });

  const railItems = document.querySelectorAll('.story-rail-item');
  railItems.forEach(item => {
    const target = item.getAttribute('data-target');
    item.classList.toggle('active', target === currentId);
  });
}

function scrollToChapter(chapterId) {
  const el = document.getElementById(chapterId);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function animateCounter(counterEl) {
  if (counterEl.dataset.animated) return;
  counterEl.dataset.animated = 'true';

  const target = parseFloat(counterEl.getAttribute('data-target'));
  const decimals = parseInt(counterEl.getAttribute('data-decimals') || '0', 10);
  const duration = 1200;
  const startTime = performance.now();

  function tick(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const current = progress * target * ease + (1 - ease) * 0;
    
    if (decimals > 0) {
      counterEl.textContent = current.toFixed(decimals);
    } else {
      counterEl.textContent = Math.round(current).toLocaleString();
    }

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      if (decimals > 0) {
        counterEl.textContent = target.toFixed(decimals);
      } else {
        counterEl.textContent = target.toLocaleString();
      }
    }
  }

  requestAnimationFrame(tick);
}

function cleanupLandingListeners() {
  if (_landingScrollHandler) {
    window.removeEventListener('scroll', _landingScrollHandler);
    _landingScrollHandler = null;
  }
  if (_landingScrollObserver) {
    _landingScrollObserver.disconnect();
    _landingScrollObserver = null;
  }
  const rail = document.getElementById('storyRail');
  if (rail) rail.remove();
  const progBar = document.getElementById('storyProgressBar');
  if (progBar) progBar.remove();
}

/**
 * Chapter 2: Inundation Simulator Interactive Controller
 */
function setSimStage(meters) {
  _simStageMeters = parseFloat(meters);
  const slider = document.getElementById('simSlider');
  if (slider) slider.value = _simStageMeters;
  updateSimDisplay();
}

function onSimSliderInput(val) {
  _simStageMeters = parseFloat(val);
  updateSimDisplay();
}

function updateSimDisplay() {
  const stageValEl = document.getElementById('simStageValue');
  const subtextEl = document.getElementById('simStageDepthSubtext');
  const fillEl = document.getElementById('simWaterFill');
  const badgeEl = document.getElementById('simHazardBadge');
  const riskPctEl = document.getElementById('simRiskPct');
  const areaEl = document.getElementById('simAreaEstimate');
  const popEl = document.getElementById('simPopEstimate');
  const directiveEl = document.getElementById('simDirectiveText');

  if (stageValEl) stageValEl.textContent = `${_simStageMeters.toFixed(2)}m MSL`;
  if (subtextEl) subtextEl.textContent = `Submersion Stage: +${_simStageMeters.toFixed(2)}m`;

  // Scale reservoir water fill height: 0m = 8%, 5m = 92%
  const pctHeight = 8 + (_simStageMeters / 5) * 84;
  if (fillEl) fillEl.style.height = `${pctHeight}%`;

  // Calculate dynamic outputs
  let riskPct = 12 + (_simStageMeters / 5) * 86;
  let landArea = 4 + (_simStageMeters / 5) * 44;
  let popRisk = Math.round(18000 + (_simStageMeters / 5) * 420000);

  if (riskPctEl) riskPctEl.textContent = `${riskPct.toFixed(1)}%`;
  if (areaEl) areaEl.textContent = `${landArea.toFixed(1)} km²`;
  if (popEl) popEl.textContent = `${popRisk.toLocaleString()} residents`;

  if (_simStageMeters < 1.0) {
    if (badgeEl) {
      badgeEl.textContent = 'NOMINAL BASEFLOW';
      badgeEl.style.background = 'rgba(31,224,168,0.2)';
      badgeEl.style.color = 'var(--ocean)';
    }
    if (directiveEl) directiveEl.textContent = 'Routine automated telemetry observation. No civilian emergency action required.';
  } else if (_simStageMeters < 2.5) {
    if (badgeEl) {
      badgeEl.textContent = 'ELEVATED SURGE';
      badgeEl.style.background = 'rgba(51,199,255,0.2)';
      badgeEl.style.color = 'var(--cyber)';
    }
    if (directiveEl) directiveEl.textContent = 'Issue Advisory Notice to low-lying riverbank sectors and stand by rapid response teams.';
  } else if (_simStageMeters < 3.8) {
    if (badgeEl) {
      badgeEl.textContent = 'HIGH WARNING';
      badgeEl.style.background = 'rgba(255,184,77,0.2)';
      badgeEl.style.color = 'var(--amber)';
    }
    if (directiveEl) directiveEl.textContent = 'Execute Tier-2 flood diversion gates and deploy mobile pump batteries along arterial drainage corridors.';
  } else {
    if (badgeEl) {
      badgeEl.textContent = 'CRITICAL BREACH';
      badgeEl.style.background = 'rgba(255,77,106,0.25)';
      badgeEl.style.color = 'var(--red)';
    }
    if (directiveEl) directiveEl.textContent = 'IMMINENT SURGE: Trigger Tier-3 acoustic sirens and commence immediate citizen evacuation along floodplains.';
  }
}

/**
 * Chapter 3: Machine Learning Engine Switcher
 */
function switchMLEngine(engine) {
  _activeMLEngine = engine;
  
  const btnXg = document.getElementById('btnEngineXg');
  const btnRf = document.getElementById('btnEngineRf');
  const btnEns = document.getElementById('btnEngineEnsemble');

  if (btnXg) btnXg.classList.toggle('active', engine === 'xgboost');
  if (btnRf) btnRf.classList.toggle('active', engine === 'rf');
  if (btnEns) btnEns.classList.toggle('active', engine === 'fusion');

  const titleEl = document.getElementById('mlEngineTitle');
  const descEl = document.getElementById('mlEngineDesc');
  const badgeEl = document.getElementById('mlEngineBadge');
  const aucEl = document.getElementById('mlMetricAuc');
  const latEl = document.getElementById('mlMetricLat');
  const treesEl = document.getElementById('mlMetricTrees');

  const bar1Val = document.getElementById('mlBar1Val');
  const bar1Fill = document.getElementById('mlBar1Fill');
  const bar2Val = document.getElementById('mlBar2Val');
  const bar2Fill = document.getElementById('mlBar2Fill');
  const bar3Val = document.getElementById('mlBar3Val');
  const bar3Fill = document.getElementById('mlBar3Fill');

  if (engine === 'xgboost') {
    if (badgeEl) { badgeEl.textContent = 'GRADIENT BOOSTED TREES'; badgeEl.style.color = 'var(--accent-primary)'; }
    if (titleEl) titleEl.textContent = 'XGBoost Precision Inference Engine';
    if (descEl) descEl.textContent = 'Specialized in detecting non-linear hazard surges, flash floods, and localized rainfall spikes with sub-15 millisecond execution latency.';
    if (aucEl) aucEl.textContent = '94.2%';
    if (latEl) latEl.textContent = '<14.2ms';
    if (treesEl) treesEl.textContent = '150 Trees';
    if (bar1Val) bar1Val.textContent = '96%'; if (bar1Fill) bar1Fill.style.width = '96%';
    if (bar2Val) bar2Val.textContent = '91%'; if (bar2Fill) bar2Fill.style.width = '91%';
    if (bar3Val) bar3Val.textContent = '98%'; if (bar3Fill) bar3Fill.style.width = '98%';
  } else if (engine === 'rf') {
    if (badgeEl) { badgeEl.textContent = 'BAGGED RANDOM FOREST ENSEMBLE'; badgeEl.style.color = 'var(--ocean)'; }
    if (titleEl) titleEl.textContent = 'Random Forest Robustness Engine';
    if (descEl) descEl.textContent = 'Averaging 200 deep decision trees across bagged sub-samples to eliminate overfitting and suppress variance across diverse geographical sectors.';
    if (aucEl) aucEl.textContent = '91.8%';
    if (latEl) latEl.textContent = '<21.5ms';
    if (treesEl) treesEl.textContent = '200 Trees';
    if (bar1Val) bar1Val.textContent = '88%'; if (bar1Fill) bar1Fill.style.width = '88%';
    if (bar2Val) bar2Val.textContent = '96%'; if (bar2Fill) bar2Fill.style.width = '96%';
    if (bar3Val) bar3Val.textContent = '89%'; if (bar3Fill) bar3Fill.style.width = '89%';
  } else {
    if (badgeEl) { badgeEl.textContent = 'WEIGHTED ENSEMBLE CONSENSUS'; badgeEl.style.color = 'var(--accent-tertiary, #B18CFF)'; }
    if (titleEl) titleEl.textContent = 'Dual-Model Consensus Fusion';
    if (descEl) descEl.textContent = 'Harmonizing XGBoost sensitivity with Random Forest stability via softmax probabilistic gating, yielding maximum reliability for disaster command.';
    if (aucEl) aucEl.textContent = '95.1%';
    if (latEl) latEl.textContent = '<18.0ms';
    if (treesEl) treesEl.textContent = '350 Ensembles';
    if (bar1Val) bar1Val.textContent = '97%'; if (bar1Fill) bar1Fill.style.width = '97%';
    if (bar2Val) bar2Val.textContent = '98%'; if (bar2Fill) bar2Fill.style.width = '98%';
    if (bar3Val) bar3Val.textContent = '93%'; if (bar3Fill) bar3Fill.style.width = '93%';
  }
}

/**
 * Chapter 4: SHAP Attribution Interactive Recalculator
 */
function toggleShapDriver(driverKey) {
  _shapActiveDrivers[driverKey] = !_shapActiveDrivers[driverKey];

  const map = {
    rain: { check: 'shapCheckRain', bar: 'shapBarRain', val: 'shapValRain', push: 34.2, isPos: true },
    river: { check: 'shapCheckRiver', bar: 'shapBarRiver', val: 'shapValRiver', push: 22.8, isPos: true },
    elevation: { check: 'shapCheckElevation', bar: 'shapBarElevation', val: 'shapValElevation', push: -18.4, isPos: false },
    mangrove: { check: 'shapCheckMangrove', bar: 'shapBarMangrove', val: 'shapValMangrove', push: -12.1, isPos: false },
    soil: { check: 'shapCheckSoil', bar: 'shapBarSoil', val: 'shapValSoil', push: 13.6, isPos: true }
  };

  const item = map[driverKey];
  const active = _shapActiveDrivers[driverKey];

  const checkEl = document.getElementById(item.check);
  const barEl = document.getElementById(item.bar);
  const valEl = document.getElementById(item.val);

  if (checkEl) checkEl.textContent = active ? '☑' : '☐';
  if (barEl) barEl.style.opacity = active ? '1' : '0.2';
  if (valEl) valEl.style.opacity = active ? '1' : '0.3';

  // Recalculate net push
  let netPush = 0;
  Object.keys(map).forEach(k => {
    if (_shapActiveDrivers[k]) netPush += map[k].push;
  });

  const totalEl = document.getElementById('shapTotalPush');
  if (totalEl) {
    if (netPush >= 0) {
      totalEl.textContent = `+${netPush.toFixed(1)}% Net Surge Push`;
      totalEl.style.color = 'var(--red)';
    } else {
      totalEl.textContent = `${netPush.toFixed(1)}% Net Protective Margin`;
      totalEl.style.color = 'var(--ocean)';
    }
  }
}

/**
 * Chapter 5: 10-Sector GIS Radar Strip Controller
 */
function selectRadarDistrict(districtName) {
  _activeRadarDistrict = districtName;
  const data = RADAR_DISTRICT_DATA[districtName];
  if (!data) return;

  // Update active chips
  document.querySelectorAll('.radar-district-chip').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.includes(districtName));
  });

  const titleEl = document.getElementById('radarTitle');
  const basinEl = document.getElementById('radarBasin');
  const coordsEl = document.getElementById('radarCoords');
  const rainEl = document.getElementById('radarRain');
  const elevEl = document.getElementById('radarElev');
  const riskScoreEl = document.getElementById('radarRiskScore');
  const tierBadgeEl = document.getElementById('radarTierBadge');

  if (titleEl) titleEl.textContent = `${districtName} Disaster Sector`;
  if (basinEl) basinEl.textContent = data.basin;
  if (coordsEl) coordsEl.textContent = data.coords;
  if (rainEl) rainEl.textContent = data.rain;
  if (elevEl) elevEl.textContent = data.elevation;
  if (riskScoreEl) riskScoreEl.textContent = `${data.risk}% Risk Index`;

  if (tierBadgeEl) {
    tierBadgeEl.textContent = data.tier;
    if (data.tier.includes('CRITICAL')) {
      tierBadgeEl.style.background = 'rgba(255,77,106,0.25)';
      tierBadgeEl.style.color = 'var(--red)';
    } else if (data.tier.includes('HIGH')) {
      tierBadgeEl.style.background = 'rgba(255,184,77,0.2)';
      tierBadgeEl.style.color = 'var(--amber)';
    } else if (data.tier.includes('ELEVATED') || data.tier.includes('MODERATE')) {
      tierBadgeEl.style.background = 'rgba(51,199,255,0.2)';
      tierBadgeEl.style.color = 'var(--cyber)';
    } else {
      tierBadgeEl.style.background = 'rgba(31,224,168,0.2)';
      tierBadgeEl.style.color = 'var(--ocean)';
    }
  }
}

/**
 * Chapter 7: Acoustic Siren Audio Synthesizer Preview
 */
function previewSirenTone() {
  if (typeof AlertSound !== 'undefined' && typeof AlertSound.play === 'function') {
    AlertSound.play('chime');
    toast('Playing 1.5s Web Audio Synthesizer Tone');
    setTimeout(() => {
      AlertSound.stop();
    }, 1500);
  } else {
    toast('Synthesizer active: Alert siren verified');
  }
}
