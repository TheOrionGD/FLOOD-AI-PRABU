/**
 * landingView.js
 * Screen 09 — Public-Facing Landing Page with 10 Scroll-Driven Storytelling Sections
 */

function renderLanding(root) {
  root.innerHTML = `
    <div class="layout-public">
      
      <!-- Public Sticky Top Navigation -->
      <nav class="public-topbar">
        <div class="brand" onclick="goTo('home')" style="cursor:pointer;">
          <span class="mark">${iconWave()}</span> FloodAI
        </div>

        <div class="public-nav-links">
          <button class="glass-btn btn-ghost" onclick="goTo('home')">Platform Overview</button>
          <button class="glass-btn btn-ghost" onclick="goTo('map')">Geospatial GIS</button>
          <button class="glass-btn btn-ghost" onclick="goTo('records')">Historical Records</button>
          <button class="glass-btn btn-ghost" onclick="goTo('analytics')">Climate Trends</button>
          <button class="glass-btn btn-secondary" onclick="goTo('login')" style="margin-left:12px; gap:6px;">
            <span>Sign In</span> →
          </button>
        </div>
      </nav>

      <!-- SECTION 1: HERO -->
      <section class="story-section" style="padding-top:70px; padding-bottom:80px; text-align:center;">
        <span class="story-tag">NEXT-GENERATION DISASTER INTELLIGENCE</span>
        <h1 class="story-title" style="font-size:52px; max-width:920px; margin:0 auto 20px; letter-spacing:-1px;">
          Planetary-Scale AI Flood Prediction &amp; Threat Defense
        </h1>
        <p class="story-desc" style="max-width:680px; margin:0 auto 36px; font-size:18px;">
          Fusing XGBoost and Random Forest machine learning with real-time atmospheric telemetry and Digital Elevation Models to protect vulnerable communities before floodwaters rise.
        </p>

        <div style="display:flex; justify-content:center; gap:16px; flex-wrap:wrap; margin-bottom:48px;">
          <button class="glass-btn btn-primary" onclick="goTo('home')" style="padding:14px 32px; font-size:15px; box-shadow:0 0 28px var(--accent-glow);">
            Explore Platform →
          </button>
          <button class="glass-btn btn-ghost" onclick="goTo('login')" style="padding:14px 28px; font-size:15px; border-color:var(--glass-border);">
            SaaS Sign In
          </button>
          <button class="glass-btn btn-ghost" onclick="goTo('onboarding')" style="padding:14px 24px; font-size:15px; color:var(--text-muted);">
            Watch 7-Slide Tour ▷
          </button>
        </div>

        <!-- Real Platform Statistics Strip -->
        <div class="grid-cards" style="grid-template-columns:repeat(4,1fr); gap:16px; max-width:1080px; margin:0 auto;">
          <div class="glass-stat-card">
            <div class="glass-stat-header">Ground-Truth Records</div>
            <div class="glass-stat-value" style="color:var(--accent-primary);">10,000</div>
            <div class="glass-stat-subtext">24-Year Empirical Archive</div>
          </div>
          <div class="glass-stat-card">
            <div class="glass-stat-header">Dual Model Precision</div>
            <div class="glass-stat-value" style="color:var(--ocean);">94.2%</div>
            <div class="glass-stat-subtext">XGBoost ROC-AUC Score</div>
          </div>
          <div class="glass-stat-card">
            <div class="glass-stat-header">Monitored Sectors</div>
            <div class="glass-stat-value" style="color:var(--accent-primary);">10</div>
            <div class="glass-stat-subtext">High-Density Urban Basins</div>
          </div>
          <div class="glass-stat-card">
            <div class="glass-stat-header">Dispatch Redundancy</div>
            <div class="glass-stat-value" style="color:var(--accent-tertiary, #B18CFF);">3 Channels</div>
            <div class="glass-stat-subtext">FCM • Brevo • Carrier SMS</div>
          </div>
        </div>
      </section>

      <!-- SECTION 2: THE CHALLENGE -->
      <section class="story-section">
        <div class="story-header">
          <span class="story-tag">THE PROBLEM</span>
          <h2 class="story-title">Environmental Fragmentation Kills Reaction Time</h2>
          <p class="story-desc">
            Traditional flood advisories rely on isolated rain gauges and delayed manual reports. When extreme weather strikes, delayed warnings cost lives, infrastructure, and emergency responsiveness.
          </p>
        </div>

        <div class="grid-cards" style="grid-template-columns:repeat(3,1fr); gap:24px;">
          <div class="glass-card elevated">
            <div style="font-size:32px; margin-bottom:12px;">🌧️</div>
            <h3 style="font-size:18px; font-weight:700; margin-bottom:10px;">Uncoordinated Sensor Silos</h3>
            <p style="font-size:13.5px; color:var(--text-secondary); line-height:1.6;">
              Precipitation, reservoir storage, and tidal heights live in incompatible systems, leaving emergency coordinators without a unified tactical picture.
            </p>
          </div>
          <div class="glass-card elevated">
            <div style="font-size:32px; margin-bottom:12px;">⏳</div>
            <h3 style="font-size:18px; font-weight:700; margin-bottom:10px;">Delayed Evacuation Notice</h3>
            <p style="font-size:13.5px; color:var(--text-secondary); line-height:1.6;">
              Citizens frequently receive evacuation orders hours after inundation has blocked critical escape corridors and inundated transit hubs.
            </p>
          </div>
          <div class="glass-card elevated">
            <div style="font-size:32px; margin-bottom:12px;">❓</div>
            <h3 style="font-size:18px; font-weight:700; margin-bottom:10px;">Black-Box Confusion</h3>
            <p style="font-size:13.5px; color:var(--text-secondary); line-height:1.6;">
              Emergency decision-makers hesitate to act on opaque statistical predictions without transparent scientific attribution and local terrain context.
            </p>
          </div>
        </div>
      </section>

      <!-- SECTION 3: PREDICTION INTELLIGENCE -->
      <section class="story-section">
        <div class="story-header">
          <span class="story-tag">MACHINE LEARNING</span>
          <h2 class="story-title">Dual-Model Prediction Architecture</h2>
          <p class="story-desc">
            FloodAI compares XGBoost Extreme Gradient Boosting with Random Forest Ensembles on every inference, balancing non-linear hazard curves with robust variance suppression.
          </p>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:28px;">
          <div class="glass-card elevated border-lightning" style="padding:32px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
              <span class="glass-badge" style="background:rgba(51,199,255,0.15); color:var(--accent-primary);">PRIMARY ENGINE</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:var(--text-muted);">v2.0 Model</span>
            </div>
            <h3 style="font-size:22px; font-weight:700; margin-bottom:12px;">XGBoost Classifier</h3>
            <p style="font-size:14px; color:var(--text-secondary); line-height:1.6; margin-bottom:20px;">
              Optimized gradient-boosted decision trees trained on 13 environmental features. Specialized in early detection of flash floods and extreme monsoon anomalies.
            </p>
            <div style="display:flex; gap:16px; font-family:var(--font-mono); font-size:12px;">
              <div>ROC-AUC: <b style="color:var(--ocean);">94.2%</b></div>
              <div>Recall: <b style="color:var(--ocean);">92.8%</b></div>
              <div>Latency: <b style="color:var(--accent-primary);">&lt;15ms</b></div>
            </div>
          </div>

          <div class="glass-card elevated border-lightning" style="padding:32px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
              <span class="glass-badge" style="background:rgba(31,224,168,0.15); color:var(--ocean);">BENCHMARK ENGINE</span>
              <span style="font-family:var(--font-mono); font-size:12px; color:var(--text-muted);">Ensemble Model</span>
            </div>
            <h3 style="font-size:22px; font-weight:700; margin-bottom:12px;">Random Forest Ensemble</h3>
            <p style="font-size:14px; color:var(--text-secondary); line-height:1.6; margin-bottom:20px;">
              Averaging 200 deep decision trees across bagged sub-samples. Provides high stability across diverse geographical regions and minimizes overfitting.
            </p>
            <div style="display:flex; gap:16px; font-family:var(--font-mono); font-size:12px;">
              <div>ROC-AUC: <b style="color:var(--ocean);">91.8%</b></div>
              <div>Precision: <b style="color:var(--ocean);">90.4%</b></div>
              <div>Latency: <b style="color:var(--accent-primary);">&lt;22ms</b></div>
            </div>
          </div>
        </div>
      </section>

      <!-- SECTION 4: EXPLAINABLE AI -->
      <section class="story-section">
        <div class="story-header">
          <span class="story-tag">INTERPRETABILITY</span>
          <h2 class="story-title">SHAP Feature Attribution: Total Decision Transparency</h2>
          <p class="story-desc">
            Every predicted probability is mathematically explained through Shapley values, calculating each variable's exact positive or negative push toward inundation.
          </p>
        </div>

        <div class="glass-card elevated" style="padding:36px;">
          <div style="margin-bottom:20px; font-family:var(--font-mono); font-size:12px; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px;">
            Live SHAP Force Contribution Vector Example (Chennai Monsoon Simulation)
          </div>

          <div style="display:flex; flex-direction:column; gap:12px;">
            <div>
              <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:4px;">
                <span>Rainfall Surge (24h Precipitation: 310mm)</span>
                <span style="color:var(--red); font-family:var(--font-mono); font-weight:700;">+34.2% Risk Push</span>
              </div>
              <div style="width:100%; height:8px; background:rgba(255,255,255,0.06); border-radius:4px; overflow:hidden;">
                <div style="width:78%; height:100%; background:var(--red); border-radius:4px;"></div>
              </div>
            </div>

            <div>
              <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:4px;">
                <span>River Discharge Rate (Adyar River Stage: 9.2m)</span>
                <span style="color:var(--red); font-family:var(--font-mono); font-weight:700;">+22.8% Risk Push</span>
              </div>
              <div style="width:100%; height:8px; background:rgba(255,255,255,0.06); border-radius:4px; overflow:hidden;">
                <div style="width:62%; height:100%; background:var(--red); border-radius:4px;"></div>
              </div>
            </div>

            <div>
              <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:4px;">
                <span>High Ground Elevation (Topographic Ridge: 45m MSL)</span>
                <span style="color:var(--ocean); font-family:var(--font-mono); font-weight:700;">-18.4% Protective Buffer</span>
              </div>
              <div style="width:100%; height:8px; background:rgba(255,255,255,0.06); border-radius:4px; overflow:hidden;">
                <div style="width:45%; height:100%; background:var(--ocean); border-radius:4px;"></div>
              </div>
            </div>

            <div>
              <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:4px;">
                <span>Forest Canopy Absorption (38% Mangrove Cover)</span>
                <span style="color:var(--ocean); font-family:var(--font-mono); font-weight:700;">-12.1% Protective Buffer</span>
              </div>
              <div style="width:100%; height:8px; background:rgba(255,255,255,0.06); border-radius:4px; overflow:hidden;">
                <div style="width:30%; height:100%; background:var(--ocean); border-radius:4px;"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- SECTION 5: GEOGRAPHIC INTELLIGENCE -->
      <section class="story-section">
        <div class="story-header">
          <span class="story-tag">GEOSPATIAL GIS</span>
          <h2 class="story-title">Cadastral Demarcation &amp; Topographic Contours</h2>
          <p class="story-desc">
            Interactive OpenStreetMap GeoJSON boundaries and Digital Elevation Models (DEM) allow granular evaluation of sub-districts, coastal margins, and river drainage basins.
          </p>
        </div>

        <div class="grid-cards" style="grid-template-columns:repeat(3,1fr); gap:20px;">
          <div class="glass-card">
            <h4 style="font-size:16px; font-weight:700; margin-bottom:8px;">Sub-Meter Elevation Contours</h4>
            <p style="font-size:13px; color:var(--text-secondary); line-height:1.6;">
              Calculates natural runoff gravity flow to identify depressed topographic pockets at highest risk of standing water.
            </p>
          </div>
          <div class="glass-card">
            <h4 style="font-size:16px; font-weight:700; margin-bottom:8px;">10 Monitored Sectors</h4>
            <p style="font-size:13px; color:var(--text-secondary); line-height:1.6;">
              Continuous sensor coverage across Chennai, Mumbai, Kolkata, Bhubaneswar, Guwahati, Patna, Surat, Kochi, Visakhapatnam, and Hosur.
            </p>
          </div>
          <div class="glass-card">
            <h4 style="font-size:16px; font-weight:700; margin-bottom:8px;">Privacy-Preserving Triangulation</h4>
            <p style="font-size:13px; color:var(--text-secondary); line-height:1.6;">
              Calculates danger margins client-side using device GPS or manual sector selection without storing personal real-time tracking trails.
            </p>
          </div>
        </div>
      </section>

      <!-- SECTION 6: WEATHER CONTEXT -->
      <section class="story-section">
        <div class="story-header">
          <span class="story-tag">ATMOSPHERIC TELEMETRY</span>
          <h2 class="story-title">Real-Time Weather Streaming &amp; Dynamic Atmosphere</h2>
          <p class="story-desc">
            Direct API feeds from OpenWeather and Open-Meteo deliver sub-15 minute atmospheric updates, turning raw barometric data into live particle rendering on your screen.
          </p>
        </div>

        <div style="display:flex; justify-content:center;">
          <button class="glass-btn btn-primary" onclick="openClimateModal()" style="gap:8px; padding:12px 28px;">
            <span>🌧️ Inspect Live Telemetry Stream</span>
          </button>
        </div>
      </section>

      <!-- SECTION 7: THREAT INTELLIGENCE & ALERTS -->
      <section class="story-section">
        <div class="story-header">
          <span class="story-tag">CIVIL DEFENSE</span>
          <h2 class="story-title">Autonomous Multi-Channel Disaster Dispatch</h2>
          <p class="story-desc">
            When predicted flood probability exceeds safe thresholds, FloodAI dispatches localized tactical warnings simultaneously across web, mobile, and telecommunication infrastructure.
          </p>
        </div>

        <div class="grid-cards" style="grid-template-columns:repeat(3,1fr); gap:20px;">
          <div class="glass-card elevated">
            <div style="font-size:28px; margin-bottom:8px;">🔔</div>
            <h4 style="font-size:16px; font-weight:700; margin-bottom:6px;">Firebase Web Push</h4>
            <p style="font-size:13px; color:var(--text-secondary); line-height:1.55;">
              Instant browser desktop and mobile alerts delivered via service workers even when the user is not actively viewing the tab.
            </p>
          </div>
          <div class="glass-card elevated">
            <div style="font-size:28px; margin-bottom:8px;">📧</div>
            <h4 style="font-size:16px; font-weight:700; margin-bottom:6px;">Brevo Transactional Email</h4>
            <p style="font-size:13px; color:var(--text-secondary); line-height:1.55;">
              Detailed emergency directives, safe evacuation routes, and shelter locations formatted for immediate reading on mobile devices.
            </p>
          </div>
          <div class="glass-card elevated">
            <div style="font-size:28px; margin-bottom:8px;">📱</div>
            <h4 style="font-size:16px; font-weight:700; margin-bottom:6px;">Carrier SMS Broadcast</h4>
            <p style="font-size:13px; color:var(--text-secondary); line-height:1.55;">
              Offline-ready emergency dispatches sent directly to verified SIM phone numbers during power outages and telecom network congestion.
            </p>
          </div>
        </div>
      </section>

      <!-- SECTION 8: ROLE-BASED WORKSPACES -->
      <section class="story-section">
        <div class="story-header">
          <span class="story-tag">ROLE CLEARANCE</span>
          <h2 class="story-title">Tailored Workspaces for Every Stakeholder</h2>
          <p class="story-desc">
            Three dedicated SaaS experiences, each providing exactly the operational tools required for their responsibilities.
          </p>
        </div>

        <div class="grid-cards" style="grid-template-columns:repeat(3,1fr); gap:24px;">
          <div class="glass-card elevated" style="border-top:3px solid var(--red);">
            <div style="font-size:11px; font-family:var(--font-mono); color:var(--red); font-weight:700; letter-spacing:1px; margin-bottom:8px;">ADMIN WORKSPACE</div>
            <h3 style="font-size:20px; font-weight:700; margin-bottom:10px;">Platform Command</h3>
            <p style="font-size:13.5px; color:var(--text-secondary); line-height:1.6; margin-bottom:16px;">
              Real-time platform operations health, RBAC user directory, system configuration, alert operations center, and audit explorer.
            </p>
            <div style="font-size:12px; color:var(--text-muted); font-family:var(--font-mono);">
              5 Dedicated Screens • Full Authority
            </div>
          </div>

          <div class="glass-card elevated" style="border-top:3px solid var(--accent-primary);">
            <div style="font-size:11px; font-family:var(--font-mono); color:var(--accent-primary); font-weight:700; letter-spacing:1px; margin-bottom:8px;">ANALYST WORKSPACE</div>
            <h3 style="font-size:20px; font-weight:700; margin-bottom:10px;">Hydrologic Science Lab</h3>
            <p style="font-size:13.5px; color:var(--text-secondary); line-height:1.6; margin-bottom:16px;">
              Dual ML prediction workbench, deep SHAP attribution breakdown, district risk matrix, historical evaluation logs, and tactical threat synthesis.
            </p>
            <div style="font-size:12px; color:var(--text-muted); font-family:var(--font-mono);">
              5 Dedicated Screens • Research Clearance
            </div>
          </div>

          <div class="glass-card elevated" style="border-top:3px solid var(--ocean);">
            <div style="font-size:11px; font-family:var(--font-mono); color:var(--ocean); font-weight:700; letter-spacing:1px; margin-bottom:8px;">RESIDENT WORKSPACE</div>
            <h3 style="font-size:20px; font-weight:700; margin-bottom:10px;">Citizen Safety Hub</h3>
            <p style="font-size:13.5px; color:var(--text-secondary); line-height:1.6; margin-bottom:16px;">
              Personal location flood risk index, local precipitation telemetry, acoustic siren station, preparedness handbook, and saved districts.
            </p>
            <div style="font-size:12px; color:var(--text-muted); font-family:var(--font-mono);">
              5 Dedicated Screens • Citizen Security
            </div>
          </div>
        </div>
      </section>

      <!-- SECTION 9: ARCHITECTURE & TRUST -->
      <section class="story-section">
        <div class="story-header">
          <span class="story-tag">SECURITY &amp; COMPLIANCE</span>
          <h2 class="story-title">Built on Enterprise Zero-Trust Architecture</h2>
          <p class="story-desc">
            Full cryptographic JSON Web Token verification, MongoDB Atlas cluster isolation, helmet security headers, and strict rate limiting.
          </p>
        </div>

        <div class="grid-cards" style="grid-template-columns:repeat(4,1fr); gap:16px;">
          <div class="glass-card subtle" style="text-align:center; padding:24px 16px;">
            <div style="font-size:24px; margin-bottom:6px;">🔒</div>
            <div style="font-weight:700; font-size:14px;">JWT Authentication</div>
            <div style="font-size:11.5px; color:var(--text-muted); margin-top:4px;">HMAC-SHA256 Token Lifecycle</div>
          </div>
          <div class="glass-card subtle" style="text-align:center; padding:24px 16px;">
            <div style="font-size:24px; margin-bottom:6px;">🛡️</div>
            <div style="font-weight:700; font-size:14px;">Server-Side RBAC</div>
            <div style="font-size:11.5px; color:var(--text-muted); margin-top:4px;">Role Guards on Every Route</div>
          </div>
          <div class="glass-card subtle" style="text-align:center; padding:24px 16px;">
            <div style="font-size:24px; margin-bottom:6px;">⚡</div>
            <div style="font-weight:700; font-size:14px;">Rate Limiting</div>
            <div style="font-size:11.5px; color:var(--text-muted); margin-top:4px;">DDoS &amp; Brute-Force Defense</div>
          </div>
          <div class="glass-card subtle" style="text-align:center; padding:24px 16px;">
            <div style="font-size:24px; margin-bottom:6px;">💾</div>
            <div style="font-weight:700; font-size:14px;">Atlas Persistence</div>
            <div style="font-size:11.5px; color:var(--text-muted); margin-top:4px;">TLS 1.3 Encrypted at Rest</div>
          </div>
        </div>
      </section>

      <!-- SECTION 10: FINAL CTA & FOOTER -->
      <section class="story-section" style="text-align:center; padding:100px 24px; border-bottom:none;">
        <h2 style="font-family:var(--font-display); font-size:42px; font-weight:700; margin-bottom:16px;">
          Experience FloodAI Threat Intelligence
        </h2>
        <p style="font-size:16px; color:var(--text-secondary); max-width:620px; margin:0 auto 36px;">
          Explore live hazards, inspect historical flood records, or sign in to your role-specific operational workspace.
        </p>

        <div style="display:flex; justify-content:center; gap:16px; flex-wrap:wrap; margin-bottom:60px;">
          <button class="glass-btn btn-primary" onclick="goTo('home')" style="padding:14px 36px; font-size:15px; box-shadow:0 0 30px var(--accent-glow);">
            Explore Platform Overview →
          </button>
          <button class="glass-btn btn-secondary" onclick="goTo('login')" style="padding:14px 28px; font-size:15px;">
            Access SaaS Workspace
          </button>
        </div>

        <div style="display:flex; justify-content:center; gap:24px; font-size:13px; color:var(--text-muted); border-top:1px solid rgba(255,255,255,0.06); padding-top:32px;">
          <a href="javascript:void(0)" onclick="goTo('terms')" style="hover:underline;">Terms and Conditions</a>
          <span>•</span>
          <a href="javascript:void(0)" onclick="goTo('privacy')" style="hover:underline;">Privacy Policy</a>
          <span>•</span>
          <a href="javascript:void(0)" onclick="goTo('records')" style="hover:underline;">Disaster Catalog</a>
          <span>•</span>
          <a href="javascript:void(0)" onclick="goTo('map')" style="hover:underline;">Interactive GIS Map</a>
        </div>
      </section>

    </div>
  `;
}
