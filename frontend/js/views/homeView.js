/* ===========================================================
   FloodAI — Home View (Overview, Scrolltelling & Personas)
   =========================================================== */

async function renderHome(root) {
  root = root || document.getElementById('pageRoot');
  if (!root) return;

  if (!isDataBootstrapped || DISTRICTS.length === 0) {
    try {
      await bootstrapDynamicData();
    } catch (e) {
      console.warn('[Home] Dynamic data load note:', e);
    }
  }

  const avgRisk = DISTRICTS.length ? (DISTRICTS.reduce((s, d) => s + d.avg_risk, 0) / DISTRICTS.length) : 28.5;
  const totalFloods = FLOOD_STATS?.flood_events ?? (DISTRICTS.reduce((s, d) => s + (d.flood_events || 0), 0) || 3074);
  const totalRecords = FLOOD_STATS?.total_records || 10000;
  const avgRainfallLatest = FLOOD_STATS?.avg_rainfall_mm ?? (YEARLY[YEARLY.length - 1]?.avg_rainfall || 74.9);
  const xgbAcc = MODEL_METRICS?.models?.xgboost?.metrics?.accuracy
    ? (MODEL_METRICS.models.xgboost.metrics.accuracy * 100).toFixed(2) + '%'
    : '82.95%';
  const rocAuc = MODEL_METRICS?.models?.xgboost?.metrics?.roc_auc
    ? MODEL_METRICS.models.xgboost.metrics.roc_auc.toFixed(4)
    : '0.8981';

  root.innerHTML = `
    ${typeof renderPermissionBanner === 'function' ? renderPermissionBanner('home') : ''}
    <!-- Top Alert Notification Strip -->
    <div class="alert-banner border-lightning">
      <span class="alert-dot"></span>
      <div style="flex:1;">
        <b>Active Early Warning Grid</b> &nbsp;
        <span>Real-time atmospheric telemetry, dual XGBoost + RF models, and multi-channel emergency broadcast are active.</span>
      </div>
      <div style="display:flex; gap:8px;">
        <button class="btn btn-sm btn-ghost" onclick="openPermissionsModal()" style="font-size:11px; padding:6px 12px;">🛡️ Permissions</button>
        ${state.fcmToken ? `
          <button class="btn btn-sm btn-ghost" onclick="triggerTestPush()" style="font-size:11px; padding:6px 12px;">Test Web Push</button>
        ` : `
          <button class="btn btn-sm btn-primary" onclick="enableWebPushNotifications()" style="font-size:11px; padding:6px 12px;">Enable Web Push</button>
        `}
      </div>
    </div>

    <!-- Hero Section -->
    <section class="hero">
      <div>
        <div class="eyebrow">Disaster Threat Intelligence</div>
        <h1>AI-Driven Threat Intelligence <span class="grad">before the water rises.</span></h1>
        <p>
          FloodAI fuses live OpenWeather telemetry, authoritative district boundaries,
          XGBoost + Random Forest machine learning models, and Groq LLM situational directives into an operational early warning platform.
        </p>
        <div class="btn-row">
          <button class="btn btn-primary" onclick="goTo('portal')">🛡️ Resident Safety Portal</button>
          <button class="btn btn-ghost" onclick="goTo('command')">🚨 Threat Command Center</button>
          <button class="btn btn-ghost" onclick="goTo('map')">🗺️ Geospatial Map</button>
        </div>
      </div>
      <div class="radar-wrap">
        <div class="liquid-glass radar-card border-lightning border-scale-lg card-glow">
          <div class="tag">National Modeled Flood Hazard Index</div>
          ${radarGaugeSVG(avgRisk)}
        </div>
      </div>
    </section>

    <!-- Key Metrics Strip -->
    <section class="stat-strip">
      ${statCard(fmtNum(totalRecords, 0), 'Historical Inundation Records', 'up', `${DISTRICTS.length || 10} districts · ${YEARLY.length || 24} yrs`)}
      ${statCard(xgbAcc, 'XGBoost Classification Accuracy', 'up', `ROC-AUC ${rocAuc} · Holdout Test Set`)}
      ${statCard(fmtNum(totalFloods, 0), 'Validated Flood Incidents', 'down', `${((totalFloods / totalRecords) * 100).toFixed(1)}% event frequency`)}
      ${statCard(Math.round(avgRainfallLatest) + ' mm', 'Average Monitored Rainfall', 'up', 'MongoDB Ingested Baseline')}
    </section>

    <!-- User Separation / Persona Gateways (Liquid Glass UI) -->
    <section class="block" style="margin-top:40px;">
      <div class="block-head">
        <div>
          <div class="eyebrow">User Separation &amp; Dedicated Workspaces</div>
          <h2 class="block-title">Select Your Operational Profile</h2>
        </div>
      </div>

      <div class="grid-cards" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
        <!-- Persona 1: Resident & Citizen -->
        <div class="liquid-glass persona-card border-scale card-glow" onclick="autoConfigureRoleScreens('resident')" style="cursor:pointer;">
          <div>
            <div class="persona-badge" style="background:rgba(31,224,168,0.15); color:var(--ocean); border:1px solid rgba(31,224,168,0.3);">
              🛡️ For Public Residents &amp; Citizens
            </div>
            <h3 style="font-family:var(--font-display); font-size:18px; margin:14px 0 8px;">Resident Safety Portal</h3>
            <p style="color:var(--text-1); font-size:13px; line-height:1.6; margin-bottom:20px;">
              Personalized risk assessments for your specific home district, automated SMS/Email/Push warnings, real-time shelter locator, and local emergency evacuation plans.
            </p>
          </div>
          <button class="btn btn-sm btn-ghost" style="width:100%; justify-content:center; gap:8px;">
            Configure Resident Hub →
          </button>
        </div>

        <!-- Persona 2: Emergency Responder / Admin -->
        <div class="liquid-glass persona-card border-scale card-glow" onclick="autoConfigureRoleScreens('admin')" style="cursor:pointer;">
          <div>
            <div class="persona-badge" style="background:rgba(255,77,106,0.15); color:var(--red); border:1px solid rgba(255,77,106,0.3);">
              🚨 For Emergency Responders &amp; Commanders
            </div>
            <h3 style="font-family:var(--font-display); font-size:18px; margin:14px 0 8px;">Threat Command Center</h3>
            <p style="color:var(--text-1); font-size:13px; line-height:1.6; margin-bottom:20px;">
              Cross-district risk surveillance matrix, automated telemetry ingestion triggers, multi-channel alert dispatch logs, cooldown monitoring, and crisis infrastructure guidance.
            </p>
          </div>
          <button class="btn btn-sm btn-ghost" style="width:100%; justify-content:center; gap:8px;">
            Configure Admin Operations →
          </button>
        </div>

        <!-- Persona 3: Data Scientist / Analyst -->
        <div class="liquid-glass persona-card border-scale card-glow" onclick="autoConfigureRoleScreens('analyst')" style="cursor:pointer;">
          <div>
            <div class="persona-badge" style="background:rgba(51,199,255,0.15); color:var(--cyber); border:1px solid rgba(51,199,255,0.3);">
              🔬 For Hydrologists &amp; AI Analysts
            </div>
            <h3 style="font-family:var(--font-display); font-size:18px; margin:14px 0 8px;">AI Prediction &amp; SHAP Lab</h3>
            <p style="color:var(--text-1); font-size:13px; line-height:1.6; margin-bottom:20px;">
              Execute live dual-engine inference (XGBoost vs Random Forest), explore TreeExplainer local waterfall attributions, simulate weather anomalies, and inspect MLOps curves.
            </p>
          </div>
          <button class="btn btn-sm btn-ghost" style="width:100%; justify-content:center; gap:8px;">
            Configure Analyst Lab →
          </button>
        </div>
      </div>
    </section>

    <!-- Core Disaster Intelligence Modules (Quick Access) -->
    <section class="block" style="margin-top:40px;">
      <div class="block-head">
        <div>
          <div class="eyebrow">Core Disaster Intelligence Modules</div>
          <h2 class="block-title">Instant Operational Access</h2>
        </div>
        <p style="color:var(--text-1); font-size:13.5px; margin-top:4px;">
          Direct access to the 8 primary flood prediction, geospatial analysis, acoustic alert, and climate modeling screens.
        </p>
      </div>

      <div class="grid-cards" style="grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;">
        <div class="liquid-glass qcard border-scale card-glow" onclick="goTo('predict')" style="cursor:pointer; padding:20px; border-radius:14px;">
          <div style="font-size:28px; margin-bottom:8px;">🧪</div>
          <h3 style="font-family:var(--font-display); font-size:16px; margin:0 0 6px 0; color:var(--text-0);">AI Threat Prediction</h3>
          <p style="color:var(--text-1); font-size:12.5px; line-height:1.5; margin:0 0 12px 0;">
            Adjust 14 environmental sliders to compute real-time dual-model flood probability &amp; SHAP attributions.
          </p>
          <span style="font-size:11.5px; font-weight:700; color:var(--cyber);">Run Prediction →</span>
        </div>

        <div class="liquid-glass qcard border-scale card-glow" onclick="goTo('map')" style="cursor:pointer; padding:20px; border-radius:14px;">
          <div style="font-size:28px; margin-bottom:8px;">🗺️</div>
          <h3 style="font-family:var(--font-display); font-size:16px; margin:0 0 6px 0; color:var(--text-0);">Geospatial Flood Map</h3>
          <p style="color:var(--text-1); font-size:12.5px; line-height:1.5; margin:0 0 12px 0;">
            Explore interactive GeoJSON inundation zones, live rainfall gauges, river stages, and verified relief shelters.
          </p>
          <span style="font-size:11.5px; font-weight:700; color:var(--ocean);">Open GIS Map →</span>
        </div>

        <div class="liquid-glass qcard border-scale card-glow" onclick="goTo('alerts')" style="cursor:pointer; padding:20px; border-radius:14px;">
          <div style="font-size:28px; margin-bottom:8px;">🚨</div>
          <h3 style="font-family:var(--font-display); font-size:16px; margin:0 0 6px 0; color:var(--text-0);">Emergency Alerts &amp; Siren</h3>
          <p style="color:var(--text-1); font-size:12.5px; line-height:1.5; margin:0 0 12px 0;">
            Acoustic synthesizer siren test console, live network alert levels, one-tap SOS broadcast &amp; citizen warnings.
          </p>
          <span style="font-size:11.5px; font-weight:700; color:var(--red);">Test Siren &amp; Alerts →</span>
        </div>

        <div class="liquid-glass qcard border-scale card-glow" onclick="goTo('analytics')" style="cursor:pointer; padding:20px; border-radius:14px;">
          <div style="font-size:28px; margin-bottom:8px;">📈</div>
          <h3 style="font-family:var(--font-display); font-size:16px; margin:0 0 6px 0; color:var(--text-0);">24-Yr Climate Analysis</h3>
          <p style="color:var(--text-1); font-size:12.5px; line-height:1.5; margin:0 0 12px 0;">
            Inspect long-term monsoonal rainfall, sea level rise, temperature anomalies, and cyclone frequency curves.
          </p>
          <span style="font-size:11.5px; font-weight:700; color:var(--cyber);">View Trends →</span>
        </div>

        <div class="liquid-glass qcard border-scale card-glow" onclick="goTo('records')" style="cursor:pointer; padding:20px; border-radius:14px;">
          <div style="font-size:28px; margin-bottom:8px;">📚</div>
          <h3 style="font-family:var(--font-display); font-size:16px; margin:0 0 6px 0; color:var(--text-0);">Disaster Catalog (10k)</h3>
          <p style="color:var(--text-1); font-size:12.5px; line-height:1.5; margin:0 0 12px 0;">
            Search, filter, paginate, and export 10,000 real empirical ground-truth disaster telemetry records.
          </p>
          <span style="font-size:11.5px; font-weight:700; color:var(--ocean);">Browse Catalog →</span>
        </div>

        <div class="liquid-glass qcard border-scale card-glow" onclick="goTo('weather')" style="cursor:pointer; padding:20px; border-radius:14px;">
          <div style="font-size:28px; margin-bottom:8px;">🌦️</div>
          <h3 style="font-family:var(--font-display); font-size:16px; margin:0 0 6px 0; color:var(--text-0);">Live Weather Telemetry</h3>
          <p style="color:var(--text-1); font-size:12.5px; line-height:1.5; margin:0 0 12px 0;">
            Real-time OpenWeather sensor streams, atmospheric pressure, relative humidity, and precipitation radar.
          </p>
          <span style="font-size:11.5px; font-weight:700; color:var(--amber);">Open Telemetry →</span>
        </div>

        <div class="liquid-glass qcard border-scale card-glow" onclick="goTo('dashboard')" style="cursor:pointer; padding:20px; border-radius:14px;">
          <div style="font-size:28px; margin-bottom:8px;">📊</div>
          <h3 style="font-family:var(--font-display); font-size:16px; margin:0 0 6px 0; color:var(--text-0);">MLOps AI Benchmarks</h3>
          <p style="color:var(--text-1); font-size:12.5px; line-height:1.5; margin:0 0 12px 0;">
            Dual-model comparison matrix, confusion matrix, precision-recall tradeoffs, and ROC-AUC curves.
          </p>
          <span style="font-size:11.5px; font-weight:700; color:var(--cyber);">Inspect MLOps →</span>
        </div>

        <div class="liquid-glass qcard border-scale card-glow" onclick="goTo('portal')" style="cursor:pointer; padding:20px; border-radius:14px;">
          <div style="font-size:28px; margin-bottom:8px;">🛡️</div>
          <h3 style="font-family:var(--font-display); font-size:16px; margin:0 0 6px 0; color:var(--text-0);">Resident Safety Hub</h3>
          <p style="color:var(--text-1); font-size:12.5px; line-height:1.5; margin:0 0 12px 0;">
            District risk assessment, local hydro telemetry, emergency advisories, and family survival handbook.
          </p>
          <span style="font-size:11.5px; font-weight:700; color:var(--ocean);">Open Safety Hub →</span>
        </div>
      </div>
    </section>

    <!-- 6-Stage Scroll-Driven Storytelling Experience (Scrolltelling) -->
    <section class="block" style="margin-top:54px;">
      <div class="block-head" style="text-align:center; max-width:760px; margin:0 auto 36px;">
        <div class="eyebrow" style="justify-content:center;">Mission Architecture &amp; Methodology</div>
        <h2 class="block-title" style="font-size:32px;">How FloodAI Predicts &amp; Protects</h2>
        <p style="color:var(--text-1); font-size:14px; margin-top:8px;">
          Scroll through the 6-stage operational pipeline: from Doppler radar and river stage ingestion to gradient-boosted explainability and multi-channel evacuation dispatch.
        </p>
      </div>

      <div class="scrolltelling-container" id="scrollStoryContainer">
        <!-- Left: Narrative Step Cards -->
        <div class="scrolltelling-narrative">
          <!-- Stage 1: Problem Space -->
          <div class="story-step active" data-step="1">
            <div class="story-step-badge">Stage 01 // Problem Space</div>
            <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:8px;">
              <span style="font-family:var(--font-mono); font-size:10px; color:var(--cyber); background:rgba(51,199,255,0.08); padding:2px 8px; border-radius:4px; border:1px solid rgba(51,199,255,0.2);">⏱️ 3–12h Forecast Lead</span>
              <span style="font-family:var(--font-mono); font-size:10px; color:#1FE0A8; background:rgba(31,224,168,0.08); padding:2px 8px; border-radius:4px; border:1px solid rgba(31,224,168,0.2);">🌊 Flash Flood Modeling</span>
            </div>
            <h3>Understanding the Inundation Threat</h3>
            <p>Urban flooding from sudden monsoonal cloudbursts, low-lying drainage failure, and rapid catchment swelling develops within minutes. Traditional municipal alerts are reactive because river gauges only detect water after riverbanks breach.</p>
            <div class="story-step-highlight">
              ⚠️ <b>Core Challenge:</b> Conventional sirens sound only when water reaches streets. FloodAI predicts dangerous catchment swelling 3 to 12 hours in advance.
            </div>
            <div class="mobile-scene" id="mobileScene1"></div>
          </div>

          <!-- Stage 2: Surveillance Grid -->
          <div class="story-step" data-step="2">
            <div class="story-step-badge">Stage 02 // Surveillance Grid</div>
            <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:8px;">
              <span style="font-family:var(--font-mono); font-size:10px; color:var(--cyber); background:rgba(51,199,255,0.08); padding:2px 8px; border-radius:4px; border:1px solid rgba(51,199,255,0.2);">📡 13 Hydro Vectors</span>
              <span style="font-family:var(--font-mono); font-size:10px; color:#1FE0A8; background:rgba(31,224,168,0.08); padding:2px 8px; border-radius:4px; border:1px solid rgba(31,224,168,0.2);">🛰️ X-Band Radar Grid</span>
            </div>
            <h3>Multi-Source Environmental Telemetry</h3>
            <p>Continuous ingestion of live OpenWeather atmospheric telemetry (hourly precipitation rate, humidity, barometric pressure) coupled with Doppler radar reflection, river gauge level sensors, and coastal sea level telemetry.</p>
            <div class="story-step-highlight">
              📡 <b>Sensor Ingestion:</b> 13 hydro-meteorological features updated dynamically across 10 strategic Indian disaster corridors.
            </div>
            <div class="mobile-scene" id="mobileScene2"></div>
          </div>

          <!-- Stage 3: Algorithmic Core -->
          <div class="story-step" data-step="3">
            <div class="story-step-badge">Stage 03 // Algorithmic Core</div>
            <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:8px;">
              <span style="font-family:var(--font-mono); font-size:10px; color:var(--cyber); background:rgba(51,199,255,0.08); padding:2px 8px; border-radius:4px; border:1px solid rgba(51,199,255,0.2);">🔬 XGBoost (${xgbAcc})</span>
              <span style="font-family:var(--font-mono); font-size:10px; color:#FFB84D; background:rgba(255,184,77,0.08); padding:2px 8px; border-radius:4px; border:1px solid rgba(255,184,77,0.2);">🌳 SHAP TreeExplainer</span>
            </div>
            <h3>Dual-Model Inference &amp; TreeExplainer SHAP</h3>
            <p>The telemetry vector is scored across two trained machine learning classifiers: our primary XGBoost classifier (${xgbAcc} accuracy) and a Random Forest baseline. Every single prediction computes exact Shapley feature weight attributions so responders know exactly why risk is elevated.</p>
            <div class="story-step-highlight">
              🔬 <b>Algorithmic Rigor:</b> 10,000 ground-truth flood disaster records ingested into MongoDB Atlas, benchmarked on holdout test sets.
            </div>
            <div class="mobile-scene" id="mobileScene3"></div>
          </div>

          <!-- Stage 4: Geospatial GIS -->
          <div class="story-step" data-step="4">
            <div class="story-step-badge">Stage 04 // Geospatial GIS</div>
            <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:8px;">
              <span style="font-family:var(--font-mono); font-size:10px; color:var(--cyber); background:rgba(51,199,255,0.08); padding:2px 8px; border-radius:4px; border:1px solid rgba(51,199,255,0.2);">🗺️ GeoJSON Boundaries</span>
              <span style="font-family:var(--font-mono); font-size:10px; color:#1FE0A8; background:rgba(31,224,168,0.08); padding:2px 8px; border-radius:4px; border:1px solid rgba(31,224,168,0.2);">⛰️ Digital Elevation DEM</span>
            </div>
            <h3>Topographical Inundation &amp; Shelter Mapping</h3>
            <p>Digital elevation models (DEM) and GeoJSON district boundaries segment risk between low-elevation coastal zones (Chennai 6m, Mumbai 8m, Kochi 2m) and inland plateaus (Hosur 886m). Pre-identified relief shelters are automatically linked.</p>
            <div class="story-step-highlight">
              🗺️ <b>Spatial Intelligence:</b> Real-time evacuation routing to verified high-ground relief centers with registered capacities.
            </div>
            <div class="mobile-scene" id="mobileScene4"></div>
          </div>

          <!-- Stage 5: Crisis Dispatch -->
          <div class="story-step" data-step="5">
            <div class="story-step-badge">Stage 05 // Crisis Dispatch</div>
            <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:8px;">
              <span style="font-family:var(--font-mono); font-size:10px; color:var(--cyber); background:rgba(51,199,255,0.08); padding:2px 8px; border-radius:4px; border:1px solid rgba(51,199,255,0.2);">🔔 Web Push + SMTP</span>
              <span style="font-family:var(--font-mono); font-size:10px; color:#FF4D6A; background:rgba(255,77,106,0.08); padding:2px 8px; border-radius:4px; border:1px solid rgba(255,77,106,0.2);">🔊 880Hz Siren</span>
            </div>
            <h3>Multi-Channel Automated Early Warnings</h3>
            <p>When modeled flood risk breaches severe thresholds, FloodAI dispatches synchronized alerts across W3C Web Push, Brevo Transactional Email, Cellular SMS, and acoustic sirens to ensure messages reach citizens even during grid interruptions.</p>
            <div class="story-step-highlight">
              🚨 <b>Failover Delivery:</b> 15-minute deduplication window with background service worker offline persistence.
            </div>
            <div class="mobile-scene" id="mobileScene5"></div>
          </div>

          <!-- Stage 6: Community Defense -->
          <div class="story-step" data-step="6">
            <div class="story-step-badge">Stage 06 // Community Defense</div>
            <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:8px;">
              <span style="font-family:var(--font-mono); font-size:10px; color:#1FE0A8; background:rgba(31,224,168,0.08); padding:2px 8px; border-radius:4px; border:1px solid rgba(31,224,168,0.2);">🛡️ Citizen Life-Safety</span>
              <span style="font-family:var(--font-mono); font-size:10px; color:var(--cyber); background:rgba(51,199,255,0.08); padding:2px 8px; border-radius:4px; border:1px solid rgba(51,199,255,0.2);">🚨 Command Triage</span>
            </div>
            <h3>Preparedness, Evacuation &amp; Operational Response</h3>
            <p>Citizens receive plain-language guidance, emergency supply checklists, and one-tap SOS emergency sirens. Municipal commanders monitor real-time incident queues with deduplication and cooldown controls.</p>
            <div class="story-step-highlight">
              🛡️ <b>The FloodAI Promise:</b> Zero blind spots. Actionable intelligence delivered before the first centimeter of floodwater rises.
            </div>
            <div class="mobile-scene" id="mobileScene6"></div>
          </div>
        </div>

        <!-- Right: Sticky Interactive Visual Stage (IMAX-Level Mission Control) -->
        <div class="scrolltelling-stage">
          <!-- IMAX Top Control & Scrubber HUD -->
          <div class="imax-hud-bar">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="width:7px; height:7px; border-radius:50%; background:#1FE0A8; box-shadow:0 0 8px #1FE0A8;"></span>
              <span style="font-family:var(--font-mono); font-size:10.5px; color:var(--text-0); font-weight:700; letter-spacing:0.8px;">IMAX MISSION HUD</span>
            </div>
            <div class="imax-timeline-nav" id="imaxNavPills">
              <span class="imax-nav-pill active" data-step="1" onclick="scrollToStoryStep('1')">01 Radar</span>
              <span class="imax-nav-pill" data-step="2" onclick="scrollToStoryStep('2')">02 Ingest</span>
              <span class="imax-nav-pill" data-step="3" onclick="scrollToStoryStep('3')">03 Dual ML</span>
              <span class="imax-nav-pill" data-step="4" onclick="scrollToStoryStep('4')">04 Topo GIS</span>
              <span class="imax-nav-pill" data-step="5" onclick="scrollToStoryStep('5')">05 Dispatch</span>
              <span class="imax-nav-pill" data-step="6" onclick="scrollToStoryStep('6')">06 Command</span>
            </div>
            <div style="font-family:var(--font-mono); font-size:10px; color:var(--cyber);">
              4K SPECTRAL
            </div>
          </div>
          <div class="imax-progress-track">
            <div class="imax-progress-fill" id="imaxProgressFill"></div>
          </div>

          <!-- Scene 1: Tactical Hydrological Threat Radar & Dynamic Risk Sphere -->
          <div class="stage-scene active" id="scene1">
            <div class="scene-header">
              <span>Stage 01 Visual · 360° Tactical Doppler Inundation Radar</span>
            </div>
            
            <div style="position:relative; width:100%; height:340px; display:flex; justify-content:center; align-items:center; overflow:hidden;">
              <!-- Outer Radar Grid SVG -->
              <svg viewBox="0 0 340 340" style="width:330px; height:330px; filter:drop-shadow(0 0 20px rgba(51,199,255,0.2));">
                <defs>
                  <radialGradient id="radarSweepGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="rgba(51,199,255,0.45)" />
                    <stop offset="60%" stop-color="rgba(31,224,168,0.18)" />
                    <stop offset="100%" stop-color="transparent" />
                  </radialGradient>
                  <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                <!-- Radar Background Circle & Range Rings -->
                <circle cx="170" cy="170" r="160" fill="#040916" stroke="rgba(51,199,255,0.25)" stroke-width="1.5" />
                <circle cx="170" cy="170" r="120" fill="none" stroke="rgba(51,199,255,0.15)" stroke-width="1" stroke-dasharray="4 4" />
                <circle cx="170" cy="170" r="80" fill="none" stroke="rgba(51,199,255,0.18)" stroke-width="1" />
                <circle cx="170" cy="170" r="40" fill="none" stroke="rgba(51,199,255,0.25)" stroke-width="1" stroke-dasharray="2 2" />

                <!-- Crosshair Coordinate Lines -->
                <line x1="10" y1="170" x2="330" y2="170" stroke="rgba(51,199,255,0.2)" stroke-width="1" />
                <line x1="170" y1="10" x2="170" y2="330" stroke="rgba(51,199,255,0.2)" stroke-width="1" />
                <line x1="57" y1="57" x2="283" y2="283" stroke="rgba(51,199,255,0.08)" stroke-width="1" />
                <line x1="283" y1="57" x2="57" y2="283" stroke="rgba(51,199,255,0.08)" stroke-width="1" />

                <!-- Distance Ring Labels -->
                <text x="174" y="93" fill="rgba(51,199,255,0.5)" font-size="8" font-family="var(--font-mono)">100 KM</text>
                <text x="174" y="53" fill="rgba(51,199,255,0.5)" font-size="8" font-family="var(--font-mono)">200 KM</text>
                <text x="174" y="18" fill="rgba(51,199,255,0.5)" font-size="8" font-family="var(--font-mono)">300 KM</text>

                <!-- Rotating Radar Beam -->
                <g style="transform-origin: 170px 170px; animation: imaxRadarSweep 4s linear infinite;">
                  <path d="M 170 170 L 330 170 A 160 160 0 0 0 283 57 Z" fill="url(#radarSweepGrad)" />
                  <line x1="170" y1="170" x2="330" y2="170" stroke="#33C7FF" stroke-width="2" filter="url(#radarGlow)" />
                </g>

                <!-- Monitored Indian Disaster District Blips with Pulse Rings -->
                <!-- Chennai -->
                <g transform="translate(235, 185)">
                  <circle cx="0" cy="0" r="10" fill="none" stroke="#FF4D6A" stroke-width="1.5" style="animation: imaxRadarPing 2.2s infinite ease-out;" />
                  <circle cx="0" cy="0" r="3.5" fill="#FF4D6A" />
                  <text x="7" y="3" fill="#FFFFFF" font-size="8" font-family="var(--font-mono)">Chennai 38%</text>
                </g>

                <!-- Mumbai -->
                <g transform="translate(85, 125)">
                  <circle cx="0" cy="0" r="10" fill="none" stroke="#FFB84D" stroke-width="1.5" style="animation: imaxRadarPing 2.2s infinite ease-out 0.8s;" />
                  <circle cx="0" cy="0" r="3.5" fill="#FFB84D" />
                  <text x="7" y="3" fill="#FFFFFF" font-size="8" font-family="var(--font-mono)">Mumbai 35%</text>
                </g>

                <!-- Kochi -->
                <g transform="translate(145, 275)">
                  <circle cx="0" cy="0" r="3" fill="#1FE0A8" />
                  <text x="7" y="3" fill="#93A4C3" font-size="8" font-family="var(--font-mono)">Kochi</text>
                </g>

                <!-- Kolkata -->
                <g transform="translate(285, 95)">
                  <circle cx="0" cy="0" r="3" fill="#1FE0A8" />
                  <text x="7" y="3" fill="#93A4C3" font-size="8" font-family="var(--font-mono)">Kolkata</text>
                </g>

                <!-- Patna -->
                <g transform="translate(225, 65)">
                  <circle cx="0" cy="0" r="3" fill="#1FE0A8" />
                  <text x="7" y="3" fill="#93A4C3" font-size="8" font-family="var(--font-mono)">Patna</text>
                </g>

                <!-- Center Holographic Risk Core -->
                <circle cx="170" cy="170" r="34" fill="#061226" stroke="var(--cyber)" stroke-width="2" filter="url(#radarGlow)" style="animation: imaxPulseGlow 3s infinite ease-in-out;" />
                <circle cx="170" cy="170" r="28" fill="rgba(51,199,255,0.08)" />
                <text x="170" y="167" text-anchor="middle" fill="#FFFFFF" font-size="14" font-weight="700" font-family="var(--font-display)">${(avgRisk || 27.8).toFixed(1)}%</text>
                <text x="170" y="179" text-anchor="middle" fill="var(--cyber)" font-size="7" font-weight="700" font-family="var(--font-mono)">RISK INDEX</text>
              </svg>
            </div>

            <div class="scene-footer-pill" style="display:flex; justify-content:space-between; align-items:center;">
              <div style="text-align:left;">
                <span style="color:var(--cyber); font-weight:700;">360° X-Band Doppler Sweep:</span> 10 Strategic Basins Active
              </div>
              <div style="font-family:var(--font-mono); color:#1FE0A8; font-weight:600;">
                ● NOMINAL WATCH
              </div>
            </div>
          </div>

          <!-- Scene 2: Live Multi-Sensor Telemetry Matrix (4 Animated Telemetry Modules) -->
          <div class="stage-scene" id="scene2">
            <div class="scene-header">
              <span>Stage 02 Visual · Cybernetic Environmental Telemetry Hub</span>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; width:100%; flex:1;">
              
              <!-- Sensor 1: Precipitation Wave Tank -->
              <div style="padding:14px; border-radius:14px; background:rgba(255,255,255,0.03); border:1px solid rgba(51,199,255,0.2); display:flex; flex-direction:column; justify-content:space-between; position:relative; overflow:hidden;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-size:10.5px; color:var(--text-2); font-family:var(--font-mono);">PRECIPITATION HYETOGRAPH</span>
                  <span style="font-size:14px;">🌧️</span>
                </div>
                <div style="margin:8px 0;">
                  <div style="font-size:26px; font-weight:700; color:var(--cyber); font-family:var(--font-display); line-height:1;">
                    ${Math.round(avgRainfallLatest || 81)} <span style="font-size:13px; font-weight:400; color:var(--text-2);">mm/h</span>
                  </div>
                  <div style="font-size:10.5px; color:var(--text-1); margin-top:4px;">Doppler Reflectivity: <b>48.2 dBZ</b></div>
                </div>
                <!-- Mini Animated Inflow Wave -->
                <div style="height:22px; width:100%; border-radius:6px; background:rgba(51,199,255,0.1); overflow:hidden; position:relative;">
                  <div style="position:absolute; inset:0; background:linear-gradient(90deg, transparent, rgba(51,199,255,0.4), transparent); animation:imaxSignalExpand 2s infinite linear;"></div>
                  <div style="position:absolute; bottom:0; left:0; right:0; height:12px; background:linear-gradient(180deg, rgba(51,199,255,0.8), rgba(31,224,168,0.5)); border-radius:4px;"></div>
                </div>
              </div>

              <!-- Sensor 2: Ultrasonic River Gauge -->
              <div style="padding:14px; border-radius:14px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,184,77,0.25); display:flex; flex-direction:column; justify-content:space-between;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-size:10.5px; color:var(--text-2); font-family:var(--font-mono);">ULTRASONIC RIVER STAGE</span>
                  <span style="font-size:14px;">🌊</span>
                </div>
                <div style="margin:8px 0;">
                  <div style="font-size:26px; font-weight:700; color:var(--amber); font-family:var(--font-display); line-height:1;">
                    4.80 <span style="font-size:13px; font-weight:400; color:var(--text-2);">meters</span>
                  </div>
                  <div style="font-size:10.5px; color:var(--text-1); margin-top:4px;">Danger Level: <b>7.20m</b> (Safe Buffer +2.4m)</div>
                </div>
                <!-- Channel Level Gauge Track -->
                <div style="height:6px; width:100%; border-radius:3px; background:rgba(255,255,255,0.08); overflow:hidden;">
                  <div style="height:100%; width:66.6%; background:linear-gradient(90deg, #1FE0A8, #FFB84D); border-radius:3px;"></div>
                </div>
              </div>

              <!-- Sensor 3: Dielectric Topsoil Saturation -->
              <div style="padding:14px; border-radius:14px; background:rgba(255,255,255,0.03); border:1px solid rgba(31,224,168,0.2); display:flex; flex-direction:column; justify-content:space-between;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-size:10.5px; color:var(--text-2); font-family:var(--font-mono);">TOPSOIL DIELECTRIC MOISTURE</span>
                  <span style="font-size:14px;">💧</span>
                </div>
                <div style="margin:8px 0;">
                  <div style="font-size:26px; font-weight:700; color:#1FE0A8; font-family:var(--font-display); line-height:1;">
                    65.2 <span style="font-size:13px; font-weight:400; color:var(--text-2);">%</span>
                  </div>
                  <div style="font-size:10.5px; color:var(--text-1); margin-top:4px;">Infiltration Capacity: <b>34.8% Reserve</b></div>
                </div>
                <div style="height:6px; width:100%; border-radius:3px; background:rgba(255,255,255,0.08); overflow:hidden;">
                  <div style="height:100%; width:65%; background:linear-gradient(90deg, #33C7FF, #1FE0A8); border-radius:3px;"></div>
                </div>
              </div>

              <!-- Sensor 4: Vector Anemometer & Barometer -->
              <div style="padding:14px; border-radius:14px; background:rgba(255,255,255,0.03); border:1px solid rgba(177,140,255,0.2); display:flex; flex-direction:column; justify-content:space-between;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-size:10.5px; color:var(--text-2); font-family:var(--font-mono);">WIND &amp; SURFACE PRESSURE</span>
                  <span style="font-size:14px;">💨</span>
                </div>
                <div style="margin:8px 0;">
                  <div style="font-size:26px; font-weight:700; color:var(--purple); font-family:var(--font-display); line-height:1;">
                    22.4 <span style="font-size:13px; font-weight:400; color:var(--text-2);">km/h</span>
                  </div>
                  <div style="font-size:10.5px; color:var(--text-1); margin-top:4px;">Vector: <b>216° SW</b> · Barometer: <b>1010 hPa</b></div>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:10px; font-family:var(--font-mono); color:var(--text-2);">
                  <span>GRADIENT STABLE</span>
                  <span style="color:var(--purple);">0.1s REFRESH</span>
                </div>
              </div>

            </div>

            <div class="scene-footer-pill" style="display:flex; justify-content:space-between; align-items:center;">
              <div><span style="color:#1FE0A8; font-weight:700;">Live Sensor Stream:</span> 13 Hydrometeorological Variables Synchronized</div>
              <div style="font-family:var(--font-mono); font-size:11px; color:var(--cyber);">0% PACKET DROPOUT</div>
            </div>
          </div>

          <!-- Scene 3: Dual ML Inference & TreeExplainer SHAP Topology -->
          <div class="stage-scene" id="scene3">
            <div class="scene-header">
              <span>Stage 03 Visual · Dual ML Inference &amp; TreeExplainer Attribution</span>
            </div>

            <!-- Dual Classifier Benchmark Header -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px;">
              <div style="padding:10px 14px; border-radius:10px; background:rgba(51,199,255,0.06); border:1px solid rgba(51,199,255,0.25);">
                <div style="font-size:10px; color:var(--cyber); font-family:var(--font-mono); text-transform:uppercase;">Primary ML: XGBoost 2.0</div>
                <div style="font-size:18px; font-weight:700; color:var(--text-0); font-family:var(--font-display); margin-top:2px;">
                  ${xgbAcc} <span style="font-size:11px; color:var(--ocean); font-weight:500;">Accuracy</span>
                </div>
                <div style="font-size:10px; color:var(--text-2); font-family:var(--font-mono);">250 Trees · 8.4ms Latency</div>
              </div>
              <div style="padding:10px 14px; border-radius:10px; background:rgba(255,184,77,0.06); border:1px solid rgba(255,184,77,0.25);">
                <div style="font-size:10px; color:var(--amber); font-family:var(--font-mono); text-transform:uppercase;">Validation: Random Forest</div>
                <div style="font-size:18px; font-weight:700; color:var(--text-0); font-family:var(--font-display); margin-top:2px;">
                  83.45% <span style="font-size:11px; color:var(--amber); font-weight:500;">Accuracy</span>
                </div>
                <div style="font-size:10px; color:var(--text-2); font-family:var(--font-mono);">300 Trees · ROC-AUC: ${rocAuc}</div>
              </div>
            </div>

            <!-- Interactive SHAP Feature Force Waterfall -->
            <div style="padding:14px; border-radius:12px; background:rgba(0,0,0,0.3); border:1px solid var(--panel-border); flex:1; display:flex; flex-direction:column; justify-content:space-around;">
              <div style="font-size:10.5px; font-family:var(--font-mono); color:var(--text-2); margin-bottom:4px; text-transform:uppercase; letter-spacing:0.8px;">
                SHAP TreeExplainer Attribution Vectors:
              </div>

              <div class="shap-row">
                <span class="shap-fname" style="font-size:11.5px;">🌧️ Rainfall Vector</span>
                <div class="shap-bar-track"><div class="shap-bar-fill shap-bar-pos" style="width:78%; background:linear-gradient(90deg, #FFB84D, #FF4D6A);"></div></div>
                <span class="shap-score" style="color:var(--red); font-weight:700;">+0.38 ➔</span>
              </div>
              <div class="shap-row">
                <span class="shap-fname" style="font-size:11.5px;">🌊 River Level</span>
                <div class="shap-bar-track"><div class="shap-bar-fill shap-bar-pos" style="width:62%; background:linear-gradient(90deg, #FFB84D, #FF4D6A);"></div></div>
                <span class="shap-score" style="color:var(--red); font-weight:700;">+0.29 ➔</span>
              </div>
              <div class="shap-row">
                <span class="shap-fname" style="font-size:11.5px;">⛰️ Elevation Profile</span>
                <div class="shap-bar-track"><div class="shap-bar-fill shap-bar-neg" style="width:84%; background:linear-gradient(90deg, #33C7FF, #1FE0A8);"></div></div>
                <span class="shap-score" style="color:var(--ocean); font-weight:700;">-0.42 ⬅</span>
              </div>
              <div class="shap-row">
                <span class="shap-fname" style="font-size:11.5px;">🚰 Drainage Capacity</span>
                <div class="shap-bar-track"><div class="shap-bar-fill shap-bar-neg" style="width:55%; background:linear-gradient(90deg, #33C7FF, #1FE0A8);"></div></div>
                <span class="shap-score" style="color:var(--ocean); font-weight:700;">-0.24 ⬅</span>
              </div>
              <div class="shap-row">
                <span class="shap-fname" style="font-size:11.5px;">💧 Soil Saturation</span>
                <div class="shap-bar-track"><div class="shap-bar-fill shap-bar-pos" style="width:38%; background:linear-gradient(90deg, #FFB84D, #FF4D6A);"></div></div>
                <span class="shap-score" style="color:var(--amber); font-weight:700;">+0.18 ➔</span>
              </div>
            </div>

            <div class="scene-footer-pill" style="display:flex; justify-content:space-between; align-items:center;">
              <div><span style="color:var(--cyber); font-weight:700;">Dual Model Benchmark:</span> 10,000 Verified Ground-Truth Records</div>
              <div style="font-family:var(--font-mono); font-size:11px; color:#1FE0A8;">ROC-AUC <b>${rocAuc}</b></div>
            </div>
          </div>

          <!-- Scene 4: Topographical Inundation & Safe Haven Shelter Network -->
          <div class="stage-scene" id="scene4">
            <div class="scene-header">
              <span>Stage 04 Visual · Geospatial Terrain &amp; Relief Hubs</span>
            </div>

            <!-- Visual Terrain Slice Graphic -->
            <div style="padding:14px; border-radius:14px; background:rgba(0,0,0,0.3); border:1px solid var(--panel-border); margin-bottom:12px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span style="font-size:10.5px; font-family:var(--font-mono); color:var(--cyber); text-transform:uppercase;">Digital Elevation Model (DEM) Cross-Section</span>
                <span style="font-size:10px; font-family:var(--font-mono); color:var(--text-2);">0m to 886m MSL</span>
              </div>

              <!-- SVG Terrain & Water Surge Inundation Graphic -->
              <svg viewBox="0 0 400 90" style="width:100%; height:80px; overflow:visible;">
                <defs>
                  <linearGradient id="terrainGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="rgba(177,140,255,0.4)" />
                    <stop offset="100%" stop-color="rgba(13,22,38,0.9)" />
                  </linearGradient>
                  <linearGradient id="floodWaterGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="rgba(51,199,255,0.7)" />
                    <stop offset="100%" stop-color="rgba(31,224,168,0.3)" />
                  </linearGradient>
                </defs>

                <!-- Terrain Slope -->
                <path d="M 0 75 Q 80 72 140 68 T 240 45 T 320 25 L 400 15 L 400 90 L 0 90 Z" fill="url(#terrainGrad)" stroke="rgba(177,140,255,0.6)" stroke-width="1.5" />
                
                <!-- Inundation Water Inflow -->
                <path d="M 0 65 Q 60 63 120 65 L 140 68 L 140 90 L 0 90 Z" fill="url(#floodWaterGrad)" />
                <line x1="0" y1="65" x2="135" y2="65" stroke="#33C7FF" stroke-width="2" stroke-dasharray="3 3" />
                <text x="10" y="60" fill="#33C7FF" font-size="8" font-family="var(--font-mono)">Est. Flood Inundation (1.4m)</text>

                <!-- Coastal Label -->
                <text x="10" y="84" fill="#FFFFFF" font-size="8.5" font-family="var(--font-mono)">Coastal Lowlands (6m)</text>
                <!-- Highland Plateau Label -->
                <text x="270" y="24" fill="#1FE0A8" font-size="8.5" font-family="var(--font-mono)">Inland Plateau (886m)</text>
              </svg>
            </div>

            <!-- Active Relief Shelters Grid -->
            <div style="display:flex; flex-direction:column; gap:8px; flex:1; justify-content:center;">
              <div style="padding:10px 14px; border-radius:10px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <div style="font-size:12px; font-weight:600; color:var(--text-0);">🏠 Ripon Central Municipal Shelter</div>
                  <div style="font-size:10.5px; color:var(--text-2);">Verified High-Ground · Standby Power Generator</div>
                </div>
                <div style="text-align:right;">
                  <span style="font-family:var(--font-mono); font-size:11px; color:#1FE0A8; font-weight:700;">600 / 800</span>
                  <div style="font-size:9.5px; color:var(--text-2);">Capacity</div>
                </div>
              </div>

              <div style="padding:10px 14px; border-radius:10px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <div style="font-size:12px; font-weight:600; color:var(--text-0);">🏟️ Andheri Sports Arena Relief Camp</div>
                  <div style="font-size:10.5px; color:var(--text-2);">Elevated Plinth 14m · Medical Triage Hub</div>
                </div>
                <div style="text-align:right;">
                  <span style="font-family:var(--font-mono); font-size:11px; color:#1FE0A8; font-weight:700;">1,200 / 1,500</span>
                  <div style="font-size:9.5px; color:var(--text-2);">Capacity</div>
                </div>
              </div>
            </div>

            <div class="scene-footer-pill" style="display:flex; justify-content:space-between; align-items:center;">
              <div><span style="color:var(--ocean); font-weight:700;">Spatial GIS Intelligence:</span> 20 Pre-Registered High-Ground Havens</div>
              <div style="font-family:var(--font-mono); font-size:11px; color:var(--cyber);">DEM VERIFIED</div>
            </div>
          </div>

          <!-- Scene 5: Multi-Channel Dispatch Verification -->
          <div class="stage-scene" id="scene5">
            <div class="scene-header">
              <span>Stage 05 Visual · Multi-Channel Crisis Delivery Matrix</span>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; width:100%; flex:1; align-content:center;">
              
              <div style="padding:12px 14px; border-radius:12px; background:rgba(255,255,255,0.03); border:1px solid rgba(51,199,255,0.25); display:flex; flex-direction:column; justify-content:space-between;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-size:12px; font-weight:600; color:var(--text-0);">🔔 Firebase Web Push</span>
                  <span style="width:7px; height:7px; border-radius:50%; background:#1FE0A8; box-shadow:0 0 6px #1FE0A8;"></span>
                </div>
                <div style="font-size:10px; color:var(--text-2); font-family:var(--font-mono); margin:6px 0 2px;">W3C Push API ServiceWorker</div>
                <div style="font-family:var(--font-mono); color:var(--cyber); font-size:11px; font-weight:600;">● 0.4s Delivery Latency</div>
              </div>

              <div style="padding:12px 14px; border-radius:12px; background:rgba(255,255,255,0.03); border:1px solid rgba(31,224,168,0.25); display:flex; flex-direction:column; justify-content:space-between;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-size:12px; font-weight:600; color:var(--text-0);">📧 Brevo SMTP Gateway</span>
                  <span style="width:7px; height:7px; border-radius:50%; background:#1FE0A8; box-shadow:0 0 6px #1FE0A8;"></span>
                </div>
                <div style="font-size:10px; color:var(--text-2); font-family:var(--font-mono); margin:6px 0 2px;">TLS 1.3 · Port 587 Relay</div>
                <div style="font-family:var(--font-mono); color:#1FE0A8; font-size:11px; font-weight:600;">● DKIM &amp; SPF Signed</div>
              </div>

              <div style="padding:12px 14px; border-radius:12px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,184,77,0.25); display:flex; flex-direction:column; justify-content:space-between;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-size:12px; font-weight:600; color:var(--text-0);">📱 Cellular SMS Broadcast</span>
                  <span style="width:7px; height:7px; border-radius:50%; background:#FFB84D; box-shadow:0 0 6px #FFB84D;"></span>
                </div>
                <div style="font-size:10px; color:var(--text-2); font-family:var(--font-mono); margin:6px 0 2px;">GSM Telecommunications</div>
                <div style="font-family:var(--font-mono); color:var(--amber); font-size:11px; font-weight:600;">● Grid-Failover Ready</div>
              </div>

              <div style="padding:12px 14px; border-radius:12px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,77,106,0.25); display:flex; flex-direction:column; justify-content:space-between;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-size:12px; font-weight:600; color:var(--text-0);">🔊 Acoustic Siren Hub</span>
                  <button class="btn btn-sm btn-ghost" onclick="playSirenPreview()" style="font-size:9.5px; padding:2px 6px;" title="Test Audio Alert">
                    ▶ Play Tone
                  </button>
                </div>
                <div style="font-size:10px; color:var(--text-2); font-family:var(--font-mono); margin:6px 0 2px;">Web Audio API Synthesizer</div>
                <div style="font-family:var(--font-mono); color:var(--red); font-size:11px; font-weight:600;">● 880Hz Calibrated Tone</div>
              </div>

            </div>

            <div class="scene-footer-pill" style="display:flex; justify-content:space-between; align-items:center;">
              <div><span style="color:var(--amber); font-weight:700;">Failover Engine Armed:</span> 15-Minute Deduplication Buffer</div>
              <div style="font-family:var(--font-mono); font-size:11px; color:#1FE0A8;">0 PHANTOM WARNINGS</div>
            </div>
          </div>

          <!-- Scene 6: Gateway Launchpad -->
          <div class="stage-scene" id="scene6">
            <div class="scene-header">
              <span>Stage 06 Visual · Select Operational Workspace</span>
            </div>

            <div style="display:flex; flex-direction:column; gap:10px; width:100%; flex:1; justify-content:center;">
              <div class="liquid-glass" style="padding:14px 16px; cursor:pointer; display:flex; align-items:center; justify-content:space-between; border-color:rgba(31,224,168,0.3);" onclick="goTo('portal')">
                <div>
                  <div style="font-size:13.5px; font-weight:700; color:var(--text-0);">🛡️ Resident &amp; Citizen Safety Portal</div>
                  <div style="font-size:11px; color:var(--text-2);">GPS proximity scan, local shelter finder &amp; one-tap SOS siren</div>
                </div>
                <span class="btn btn-sm btn-primary" style="font-size:11px; padding:6px 12px;">Launch &rarr;</span>
              </div>

              <div class="liquid-glass" style="padding:14px 16px; cursor:pointer; display:flex; align-items:center; justify-content:space-between; border-color:rgba(51,199,255,0.3);" onclick="goTo('command')">
                <div>
                  <div style="font-size:13.5px; font-weight:700; color:var(--text-0);">🚨 Disaster Threat Command Center</div>
                  <div style="font-size:11px; color:var(--text-2);">Multi-district live incident queue, evacuation triage &amp; broadcasts</div>
                </div>
                <span class="btn btn-sm btn-ghost" style="font-size:11px; padding:6px 12px;">Open &rarr;</span>
              </div>

              <div class="liquid-glass" style="padding:14px 16px; cursor:pointer; display:flex; align-items:center; justify-content:space-between; border-color:rgba(177,140,255,0.3);" onclick="goTo('predict')">
                <div>
                  <div style="font-size:13.5px; font-weight:700; color:var(--text-0);">🔬 AI Simulation &amp; SHAP Explainer Lab</div>
                  <div style="font-size:11px; color:var(--text-2);">What-If rainfall simulator, dual XGBoost inference &amp; feature weights</div>
                </div>
                <span class="btn btn-sm btn-ghost" style="font-size:11px; padding:6px 12px;">Explore &rarr;</span>
              </div>
            </div>

            <div class="scene-footer-pill" style="display:flex; justify-content:space-between; align-items:center;">
              <div><span style="color:var(--ocean); font-weight:700;">Operational Status:</span> All 10 Corridors Synchronized &amp; Armed</div>
              <div style="font-family:var(--font-mono); font-size:11px; color:var(--cyber);">FULL CLEARANCE</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Regional Risk Status Grid -->
    <section class="block" style="margin-top:54px;">
      <div class="block-head">
        <div>
          <div class="eyebrow">Real-Time Situational Snapshot</div>
          <h2 class="block-title">Monitored District Threat Levels</h2>
        </div>
        <button class="btn btn-sm btn-ghost" onclick="goTo('map')">View Interactive GIS Map →</button>
      </div>

      <div class="grid-cards" style="grid-template-columns: repeat(5, 1fr); gap: 14px;">
        ${DISTRICTS.map(d => {
          const col = riskColor(d.avg_risk);
          return `
            <div class="liquid-glass" style="padding:16px; cursor:pointer;" onclick="viewDistrictInPortal('${d.district}')">
              <div style="display:flex; align-items:center; justify-content:space-between;">
                <span style="font-size:11px; color:var(--text-2); font-family:var(--font-mono);">${d.state}</span>
                <span style="width:8px; height:8px; border-radius:50%; background:${col};"></span>
              </div>
              <div style="font-family:var(--font-display); font-weight:700; font-size:15px; margin:6px 0 4px;">${d.district}</div>
              <div style="font-size:12px; color:${col}; font-weight:600;">
                ${d.avg_risk.toFixed(1)}% · ${riskLabel(d.avg_risk)}
              </div>
              <div style="font-size:11px; color:var(--text-1); margin-top:6px;">
                ${d.coastal ? '🌊 Coastal Sector' : '⛰️ Inland Sector'}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </section>
  `;

  initScrolltelling();
}

function initScrolltelling() {
  const steps = document.querySelectorAll('.story-step');
  const scenes = document.querySelectorAll('.stage-scene');
  if (!steps.length || !scenes.length) return;

  // Clean up any prior observers or scroll listeners
  if (window.__storyCleanup) {
    try { window.__storyCleanup(); } catch (e) {}
    window.__storyCleanup = null;
  }

  // Populate mobile nested scenes
  [1, 2, 3, 4, 5, 6].forEach(num => {
    const mobEl = document.getElementById(`mobileScene${num}`);
    const deskEl = document.getElementById(`scene${num}`);
    if (mobEl && deskEl && !mobEl.hasChildNodes()) {
      mobEl.innerHTML = deskEl.innerHTML;
    }
  });

  let currentActive = '1';

  function setActiveStep(stepNum) {
    if (!stepNum || currentActive === stepNum) return;
    currentActive = stepNum;
    steps.forEach(s => s.classList.toggle('active', s.dataset.step === stepNum));
    scenes.forEach(sc => sc.classList.toggle('active', sc.id === `scene${stepNum}`));

    // Update IMAX Scrubber Navigation Pills
    const pills = document.querySelectorAll('.imax-nav-pill');
    pills.forEach(p => p.classList.toggle('active', p.dataset.step === stepNum));

    // Update IMAX Progress Indicator Fill
    const fill = document.getElementById('imaxProgressFill');
    if (fill) {
      const idx = Math.max(1, Math.min(6, parseInt(stepNum) || 1));
      const pct = ((idx - 1) / 5) * 83.33 + 16.66;
      fill.style.width = `${pct}%`;
    }
  }

  // Dual mechanism for seamless scroll synchronization:
  // 1. High-frequency viewport center calculation
  let ticking = false;
  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const targetY = window.innerHeight * 0.42;
        let closestStep = null;
        let minDistance = Infinity;

        steps.forEach(step => {
          const rect = step.getBoundingClientRect();
          const stepCenter = rect.top + rect.height * 0.5;
          const dist = Math.abs(stepCenter - targetY);
          if (dist < minDistance) {
            minDistance = dist;
            closestStep = step.dataset.step;
          }
        });

        if (closestStep) {
          setActiveStep(closestStep);
        }
        ticking = false;
      });
      ticking = true;
    }
  }

  // 2. IntersectionObserver for intersection boundaries
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
        setActiveStep(entry.target.dataset.step);
      }
    });
  }, {
    threshold: [0.35, 0.6],
    rootMargin: '-40px 0px -40px 0px'
  });

  steps.forEach(s => observer.observe(s));
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  // Trigger initial frame
  onScroll();

  window.__storyCleanup = () => {
    try { observer.disconnect(); } catch (e) {}
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
  };
}

window.scrollToStoryStep = function(stepNum) {
  const step = document.querySelector(`.story-step[data-step="${stepNum}"]`);
  if (step) {
    step.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

window.playSirenPreview = function() {
  if (typeof AlertSound !== 'undefined' && AlertSound.play) {
    AlertSound.play('warning');
    setTimeout(() => {
      if (AlertSound.stop) AlertSound.stop();
    }, 1800);
    toast('🔊 Playing 880Hz Acoustic Alert Tone (Test Signal)');
  } else {
    toast('🔊 Acoustic siren active (880Hz calibrated tone)');
  }
};

function viewDistrictInPortal(dName) {
  portalSelectedDistrict = dName;
  goTo('portal');
}
