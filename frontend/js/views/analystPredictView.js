/**
 * analystPredictView.js
 * Analyst Workspace Screen 01 — Structured Prediction Workbench
 * Connects to /api/predict with XGBoost & Random Forest Dual Engines
 */

let _analystSelectedEngine = 'xgboost';

function renderAnalystPredict(root) {
  root.innerHTML = `
    <div class="saas-page-container">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:14px;">
        <div>
          <span class="story-tag" style="color:var(--accent-primary); border-color:rgba(51,199,255,0.3); background:rgba(51,199,255,0.1);">
            ANALYST WORKSPACE • ML INFERENCE
          </span>
          <h1 style="font-family:var(--font-display); font-size:28px; font-weight:700; margin-top:6px;">
            Structured Prediction Workbench
          </h1>
          <p style="font-size:13.5px; color:var(--text-secondary);">
            Dual-model hydrologic simulation workbench for XGBoost and Random Forest classifiers.
          </p>
        </div>

        <!-- Engine Selector Pills -->
        <div style="display:flex; gap:8px; background:var(--glass-interactive); padding:4px; border-radius:12px; border:1px solid var(--glass-border);">
          <button class="glass-btn ${_analystSelectedEngine === 'xgboost' ? 'btn-primary' : 'btn-ghost'}" onclick="setAnalystEngine('xgboost')" style="padding:6px 14px; font-size:12px;">
            XGBoost v2.0
          </button>
          <button class="glass-btn ${_analystSelectedEngine === 'random_forest' ? 'btn-primary' : 'btn-ghost'}" onclick="setAnalystEngine('random_forest')" style="padding:6px 14px; font-size:12px;">
            Random Forest Ensemble
          </button>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1.2fr 1fr; gap:28px;">
        
        <!-- Parameter Sliders Card -->
        <div class="glass-card elevated" style="padding:28px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
            <h3 style="font-size:17px; font-weight:700;">Environmental Indicators</h3>
            <button class="glass-btn btn-ghost" onclick="resetAnalystInputs()" style="font-size:11.5px; padding:4px 10px;">
              Reset Baseline
            </button>
          </div>

          <form onsubmit="runAnalystInference(event)" style="display:flex; flex-direction:column; gap:16px;">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
              <div class="field">
                <label>Target District</label>
                <select class="glass-select" id="an_district">
                  <option value="Chennai">Chennai (Coastal TN)</option>
                  <option value="Mumbai">Mumbai (Maharashtra)</option>
                  <option value="Kolkata">Kolkata (West Bengal)</option>
                  <option value="Bhubaneswar">Bhubaneswar (Odisha)</option>
                  <option value="Guwahati">Guwahati (Assam)</option>
                  <option value="Patna">Patna (Bihar)</option>
                  <option value="Surat">Surat (Gujarat)</option>
                  <option value="Kochi">Kochi (Kerala)</option>
                  <option value="Visakhapatnam">Visakhapatnam (Andhra)</option>
                  <option value="Hosur">Hosur (Inland TN)</option>
                </select>
              </div>

              <div class="field">
                <label>Tropical Cyclone State</label>
                <select class="glass-select" id="an_cyclone">
                  <option value="0">0 — Calm / Normal Atmospheric State</option>
                  <option value="1">1 — Tropical Depression / Cyclone Warning</option>
                </select>
              </div>
            </div>

            <!-- Sliders Grid -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-top:6px;">
              <div class="field">
                <label style="display:flex; justify-content:space-between;">
                  <span>Rainfall Volume:</span> <b id="val_an_rain" style="color:var(--accent-primary); font-family:var(--font-mono);">120 mm</b>
                </label>
                <input type="range" min="0" max="600" value="120" id="an_rainfall_mm" oninput="document.getElementById('val_an_rain').textContent = this.value + ' mm'">
              </div>

              <div class="field">
                <label style="display:flex; justify-content:space-between;">
                  <span>River Stage:</span> <b id="val_an_river" style="color:var(--accent-primary); font-family:var(--font-mono);">5.0 m</b>
                </label>
                <input type="range" min="0.5" max="14" step="0.1" value="5" id="an_river_level_m" oninput="document.getElementById('val_an_river').textContent = this.value + ' m'">
              </div>

              <div class="field">
                <label style="display:flex; justify-content:space-between;">
                  <span>Sea Level / Surge:</span> <b id="val_an_sea" style="color:var(--accent-primary); font-family:var(--font-mono);">1.6 m</b>
                </label>
                <input type="range" min="0.5" max="3.5" step="0.1" value="1.6" id="an_sea_level_m" oninput="document.getElementById('val_an_sea').textContent = this.value + ' m'">
              </div>

              <div class="field">
                <label style="display:flex; justify-content:space-between;">
                  <span>Soil Saturation:</span> <b id="val_an_soil" style="color:var(--accent-primary); font-family:var(--font-mono);">40%</b>
                </label>
                <input type="range" min="5" max="100" value="40" id="an_soil_moisture_pct" oninput="document.getElementById('val_an_soil').textContent = this.value + '%'">
              </div>

              <div class="field">
                <label style="display:flex; justify-content:space-between;">
                  <span>Reservoir Capacity:</span> <b id="val_an_res" style="color:var(--accent-primary); font-family:var(--font-mono);">60%</b>
                </label>
                <input type="range" min="5" max="100" value="60" id="an_reservoir_level_pct" oninput="document.getElementById('val_an_res').textContent = this.value + '%'">
              </div>

              <div class="field">
                <label style="display:flex; justify-content:space-between;">
                  <span>Elevation (MSL):</span> <b id="val_an_elev" style="color:var(--ocean); font-family:var(--font-mono);">30 m</b>
                </label>
                <input type="range" min="0" max="600" value="30" id="an_elevation_m" oninput="document.getElementById('val_an_elev').textContent = this.value + ' m'">
              </div>
            </div>

            <button type="submit" class="glass-btn btn-primary" id="btnAnalystInference" style="justify-content:center; padding:12px; margin-top:12px; gap:8px;">
              <span>⚡ Execute ML Inference Model</span>
            </button>
          </form>
        </div>

        <!-- Inference Output & Telemetry Details -->
        <div id="analystOutputWrap">
          <div class="glass-card elevated" style="padding:32px; text-align:center; height:100%; display:flex; flex-direction:column; justify-content:center; align-items:center;">
            <div style="font-size:44px; margin-bottom:14px;">🧪</div>
            <h3 style="font-size:18px; font-weight:700; margin-bottom:8px;">Workbench Awaiting Inputs</h3>
            <p style="font-size:13.5px; color:var(--text-muted); max-width:320px; line-height:1.6;">
              Adjust indicators or select target district, then execute the inference model to calculate real-time flood probability and SHAP attribution.
            </p>
          </div>
        </div>

      </div>
    </div>
  `;
}

function setAnalystEngine(eng) {
  _analystSelectedEngine = eng;
  renderAnalystPredict(document.getElementById('pageRoot'));
}

function resetAnalystInputs() {
  renderAnalystPredict(document.getElementById('pageRoot'));
}

async function runAnalystInference(e) {
  e.preventDefault();
  const btn = document.getElementById('btnAnalystInference');
  if (btn) { btn.disabled = true; btn.textContent = 'Computing ML Inference...'; }

  const payload = {
    district: document.getElementById('an_district')?.value || 'Chennai',
    cyclone: Number(document.getElementById('an_cyclone')?.value || 0),
    rainfall_mm: Number(document.getElementById('an_rainfall_mm')?.value || 120),
    river_level_m: Number(document.getElementById('an_river_level_m')?.value || 5),
    sea_level_m: Number(document.getElementById('an_sea_level_m')?.value || 1.6),
    soil_moisture_pct: Number(document.getElementById('an_soil_moisture_pct')?.value || 40),
    reservoir_level_pct: Number(document.getElementById('an_reservoir_level_pct')?.value || 60),
    elevation_m: Number(document.getElementById('an_elevation_m')?.value || 30),
    temperature_c: 29,
    humidity_pct: 65,
    wind_speed_kmh: 22,
    distance_from_coast_km: 40,
    population_density: 4000,
    forest_cover_pct: 28,
    drainage_score: 55,
    engine: _analystSelectedEngine,
  };

  try {
    const res = await api('/predict', 'POST', payload);
    const wrap = document.getElementById('analystOutputWrap');
    if (!wrap) return;

    const prob = res.flood_probability_pct || res.probability || 0;
    const risk = res.risk_level || (prob > 70 ? 'Very High' : (prob > 40 ? 'Moderate' : 'Low'));
    const badgeColor = risk === 'Very High' ? 'var(--red)' : (risk === 'High' ? 'var(--amber)' : 'var(--ocean)');

    wrap.innerHTML = `
      <div class="glass-card elevated border-lightning" style="padding:32px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <span class="glass-badge" style="background:rgba(51,199,255,0.15); color:var(--accent-primary); font-family:var(--font-mono); font-size:11px;">
            ${escapeHtml((res.engine || _analystSelectedEngine).toUpperCase())} INFERENCE RESULT
          </span>
          <span style="font-size:12px; color:var(--text-muted); font-family:var(--font-mono);">${new Date().toLocaleTimeString()}</span>
        </div>

        <div style="text-align:center; padding:24px 0; border-bottom:1px solid rgba(255,255,255,0.06); margin-bottom:20px;">
          <div style="font-family:var(--font-display); font-size:56px; font-weight:700; color:${badgeColor}; line-height:1;">
            ${prob.toFixed(1)}%
          </div>
          <div style="font-size:14px; font-weight:700; color:var(--text-primary); margin-top:8px;">
            Hazard Level: <span style="color:${badgeColor};">${risk} Risk</span>
          </div>
          <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">
            Confidence Score: ${(res.model_confidence_pct || 92).toFixed(1)}%
          </div>
        </div>

        <!-- Tactical Directives -->
        <h4 style="font-size:14px; font-weight:700; margin-bottom:10px;">Tactical Recommendations</h4>
        <div style="font-size:13px; color:var(--text-secondary); line-height:1.6; margin-bottom:20px;">
          ${prob > 60 
            ? 'Hydrologic saturation models indicate immediate cresting hazard. Recommend alerting civil defense coordinators and inspecting emergency reservoir sluices.' 
            : 'Precipitation volume within managed absorption capacity. Normal sensor telemetry streaming recommended.'}
        </div>

        <div style="display:flex; gap:10px;">
          <button class="glass-btn btn-ghost" onclick="goTo('analyst-shap')" style="flex:1; justify-content:center; font-size:12px;">
            Examine SHAP Breakdown →
          </button>
          <button class="glass-btn btn-ghost" onclick="goTo('analyst-history')" style="flex:1; justify-content:center; font-size:12px;">
            View Evaluation Log →
          </button>
        </div>
      </div>
    `;
    toast(`Inference complete: ${prob.toFixed(1)}% Flood Probability`);
  } catch (err) {
    toast(`Prediction error: ${err.message}`);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '⚡ Execute ML Inference Model'; }
  }
}
