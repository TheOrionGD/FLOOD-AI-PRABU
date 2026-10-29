/**
 * FLOODAI — Threat Prediction & Diagnostics View
 * XGBoost & Random Forest 14-telemetry feature sliders, SHAP waterfall explanation, Groq AI directives.
 */

function renderPredict(root) {
  root = root || document.getElementById('pageRoot');
  if (!root) return;

  if (DISTRICTS.length && !predictInputs.district) {
    predictInputs.district = DISTRICTS[0].district;
  }

  root.innerHTML = `
    <div class="eyebrow">XGBoost &amp; Random Forest · 14 Telemetry Features · SHAP Explainability</div>
    <h1 class="page-title">AI Threat Prediction &amp; Diagnostics</h1>
    <p class="page-sub">Adjust meteorological factors to simulate potential flood conditions. Predictions execute live through the Python ML microservice.</p>

    <!-- Engine Selector Bar -->
    <div id="engineSelectorBar" style="display:flex; align-items:center; gap:12px; margin:20px 0; padding:12px 18px; border-radius:12px; background:var(--bg-1); border:1px solid var(--panel-border); flex-wrap:wrap;">
      <span style="font-size:12.5px; font-weight:600; color:var(--text-1);">Active Inference Engine:</span>
      <button data-engine="xgboost" class="btn btn-sm ${state.activeEngine === 'xgboost' ? 'btn-primary' : 'btn-ghost'}" onclick="setEngine('xgboost')">XGBoost Classifier (Primary)</button>
      <button data-engine="random_forest" class="btn btn-sm ${state.activeEngine === 'random_forest' ? 'btn-primary' : 'btn-ghost'}" onclick="setEngine('random_forest')">Random Forest (Baseline)</button>
      <button data-engine="ensemble" class="btn btn-sm ${state.activeEngine === 'ensemble' ? 'btn-primary' : 'btn-ghost'}" onclick="setEngine('ensemble')">Dual-Ensemble (Weighted)</button>
    </div>

    <div class="predict-layout">
      <!-- Input Panel -->
      <div class="glass form-panel border-scale card-glow">
        <div class="field span2" style="margin-bottom:16px;">
          <label>District Preset (auto-populates elevation, coast distance, &amp; drainage)</label>
          <select id="f_district"></select>
        </div>
        <div class="form-grid" id="formGrid"></div>
        <div class="field span2" style="margin-top:16px;">
          <div class="toggle-row">
            <span>Cyclone active in maritime sector</span>
            <div class="switch ${predictInputs.cyclone ? 'on' : ''}" id="cycloneSwitch"><i></i></div>
          </div>
        </div>
        <div style="display:flex; gap:10px; margin-top:20px;">
          <button class="btn btn-primary" style="flex:1; justify-content:center;" id="predictBtn">
            ${iconSvg('predict')} Run Machine Learning Inference
          </button>
          <button class="btn btn-ghost" id="fetchLiveWeatherBtn" onclick="populateFromLiveWeather()">
            Fetch Live Weather
          </button>
        </div>
      </div>

      <!-- Result Panel with SHAP Breakdown -->
      <div class="glass result-panel border-lightning border-scale-lg card-glow" id="resultPanel">
        <div class="skeleton skeleton-box"></div>
        <div class="skeleton skeleton-line"></div>
        <div class="skeleton skeleton-line short"></div>
      </div>
    </div>
  `;

  const sel = document.getElementById('f_district');
  DISTRICTS.forEach(d => {
    const o = document.createElement('option');
    o.value = d.district;
    o.textContent = `${d.district}, ${d.state}`;
    sel.appendChild(o);
  });
  if (predictInputs.district) sel.value = predictInputs.district;
  sel.onchange = () => {
    predictInputs.district = sel.value;
    const d = DISTRICTS.find(x => x.district === sel.value);
    if (d) {
      predictInputs.elevation_m = Math.round(d.avg_elevation || d.elevation_m || 20);
      predictInputs.distance_from_coast_km = Math.round((d.avg_elevation || 20) < 100 ? 15 : 220);
      predictInputs.population_density = Math.round(d.avg_population_density || 1200);
    }
    renderFormGrid();
    executePrediction();
  };

  renderFormGrid();

  const cycloneBtn = document.getElementById('cycloneSwitch');
  if (cycloneBtn) {
    cycloneBtn.onclick = (e) => {
      predictInputs.cyclone = predictInputs.cyclone ? 0 : 1;
      e.currentTarget.classList.toggle('on', !!predictInputs.cyclone);
      executePrediction();
    };
  }

  const pBtn = document.getElementById('predictBtn');
  if (pBtn) pBtn.onclick = () => executePrediction(true);
  executePrediction();
}

function setEngine(engine) {
  state.activeEngine = engine;
  toast(`Inference engine set to: ${engine.toUpperCase()}`);

  const bar = document.getElementById('engineSelectorBar');
  if (bar) {
    const btns = bar.querySelectorAll('button[data-engine]');
    btns.forEach(btn => {
      if (btn.getAttribute('data-engine') === engine) {
        btn.classList.remove('btn-ghost');
        btn.classList.add('btn-primary');
      } else {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-ghost');
      }
    });
  }

  executePrediction(false);
}

async function populateFromLiveWeather() {
  const d = DISTRICTS.find(x => x.district === predictInputs.district);
  if (!d) return;
  toast(`Fetching real-time atmospheric telemetry for ${d.district}...`);
  try {
    let ingested = false;
    try {
      const owm = await api(`/weather?lat=${d.latitude}&lon=${d.longitude}`, 'GET', null, false);
      if (owm && owm.data && owm.data.main) {
        const cur = owm.data;
        const rain1h = cur.rain ? (cur.rain['1h'] || cur.rain['3h'] || 0) : 0;
        predictInputs.rainfall_mm = Math.max(rain1h * 8, 28);
        predictInputs.temperature_c = Math.round(cur.main.temp);
        predictInputs.humidity_pct = Math.round(cur.main.humidity);
        predictInputs.wind_speed_kmh = Math.round((cur.wind?.speed || 5) * 3.6);
        ingested = true;
        toast(`✅ Ingested live OpenWeatherMap telemetry for ${d.district} (${cur.weather?.[0]?.description || 'Active'})`);
      }
    } catch (e) {
      // Fall through to Open-Meteo
    }

    if (!ingested) {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${d.latitude}&longitude=${d.longitude}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&timezone=auto`;
      const res = await fetch(url);
      const j = await res.json();
      if (j.current) {
        predictInputs.rainfall_mm = Math.max(j.current.precipitation * 10, 25);
        predictInputs.temperature_c = Math.round(j.current.temperature_2m || 28);
        predictInputs.humidity_pct = Math.round(j.current.relative_humidity_2m || 70);
        predictInputs.wind_speed_kmh = Math.round(j.current.wind_speed_10m || 20);
        toast(`✅ Ingested live Open-Meteo telemetry for ${d.district}`);
      }
    }

    renderFormGrid();
    executePrediction();
  } catch (e) {
    toast(`Could not fetch live weather: ${e.message}`);
  }
}

function renderFormGrid() {
  const grid = document.getElementById('formGrid');
  if (!grid) return;
  grid.innerHTML = Object.entries(FEATURE_META).map(([key, m]) => `
    <div class="field">
      <label>${m.label} <span class="valtag" id="val_${key}">${predictInputs[key]}${m.unit}</span></label>
      <input type="range" min="${m.min}" max="${m.max}" step="${(m.max - m.min) > 50 ? 1 : 0.1}" value="${predictInputs[key]}" id="in_${key}">
    </div>
  `).join('');

  Object.keys(FEATURE_META).forEach(key => {
    const el = document.getElementById('in_' + key);
    if (!el) return;
    el.oninput = () => {
      predictInputs[key] = parseFloat(el.value);
      const tag = document.getElementById('val_' + key);
      if (tag) tag.textContent = predictInputs[key] + FEATURE_META[key].unit;
    };
    el.onchange = () => executePrediction();
  });
}

let _predictReqSeq = 0;

async function executePrediction(fromUserClick = false) {
  const panel = document.getElementById('resultPanel');
  const btn = document.getElementById('predictBtn');
  if (!panel) return;

  const thisReqId = ++_predictReqSeq;

  if (fromUserClick && btn) {
    btn.disabled = true;
    btn.innerHTML = renderInlineSpinner('Running Inference...');
  }

  if (fromUserClick) {
    panel.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <div class="skeleton skeleton-line" style="width:35%; height:14px;"></div>
        <div class="skeleton skeleton-line xs" style="width:20%; height:12px;"></div>
      </div>
      <div style="width:220px; height:150px; margin:0 auto 16px; border-radius:50%; background:var(--bg-1);" class="skeleton"></div>
      <div style="margin:20px 0 10px;">
        <div class="skeleton skeleton-line" style="width:40%; height:14px; margin-bottom:10px;"></div>
        <div class="skeleton skeleton-line" style="width:90%; height:12px; margin-bottom:8px;"></div>
        <div class="skeleton skeleton-line" style="width:75%; height:12px; margin-bottom:8px;"></div>
        <div class="skeleton skeleton-line" style="width:85%; height:12px; margin-bottom:8px;"></div>
      </div>
      <div class="skeleton skeleton-box" style="height:48px; border-radius:8px;"></div>
    `;
  }

  let result = null;
  try {
    const payload = {
      ...predictInputs,
      location: predictInputs.district,
      engine: state.activeEngine,
    };
    result = await api('/predict', 'POST', payload, false);
    if (thisReqId !== _predictReqSeq) return; // Stale response discarded

    state.latestPrediction = result;
    if (typeof AppEvents !== 'undefined') {
      AppEvents.emit(AppEvents.EVENTS.PREDICTION_UPDATED, result);
    }
  } catch (err) {
    if (thisReqId !== _predictReqSeq) return;
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = 'Execute Threat Model &rarr;';
    }
    panel.innerHTML = renderErrorState({
      title: 'ML Prediction Service Unavailable',
      message: 'Failed to obtain live risk inference: ' + (err.message || 'Microservice unreachable') + '. Ensure the Python ML inference service is active on port 8000.',
      retryFn: 'executePrediction(true)'
    });
    return;
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = 'Execute Threat Model &rarr;';
    }
  }

  const pct = result.flood_probability_pct;
  const color = riskColor(pct);
  const label = result.risk_level;
  const confidence = result.model_confidence_pct;
  const engineName = result.engine || state.activeEngine;
  const shapData = result.shap_explanation || { top_positive: [], top_negative: [], contributions: [] };

  const recos = {
    'Low': 'Hydrological conditions are currently safe. Maintain normal surveillance and clear storm drain outfalls.',
    'Medium': 'Elevated runoff predicted over next 24–48 hours. Alert municipal engineering crews to clear water channels.',
    'High': 'Critical inundation threat detected! Pre-position emergency dewatering pumps and alert low-lying wards.',
    'Very High': 'Severe flood surge emergency! Activate municipal disaster protocols, open public shelters, and broadcast evacuation notices.',
  }[label] || 'Monitor live conditions.';

  panel.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <div class="tag" style="font-family:var(--font-mono); font-size:11px; color:var(--text-2); text-transform:uppercase; letter-spacing:1.5px;">ML Inference Result</div>
      <span style="font-family:var(--font-mono); font-size:11px; padding:2px 8px; border-radius:6px; background:rgba(51,199,255,0.12); color:var(--cyber);">${escapeHtml(engineName)}</span>
    </div>

    <div class="gauge-wrap">
      ${radarGaugeSVG(pct, 260)}
      <span class="risk-pill" style="background:${color}22; color:${color}; border:1px solid ${color}55;">Model Confidence: ${confidence}%</span>
    </div>

    <!-- SHAP Explainability Waterfall -->
    <div class="shap-container">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <span style="font-size:12.5px; color:var(--text-1); font-weight:600;">SHAP TreeExplainer Drivers</span>
        <span style="font-family:var(--font-mono); font-size:11px; color:var(--text-2);">Base Value: ${shapData.base_value || '0.05'}</span>
      </div>

      ${(shapData.contributions || []).slice(0, 5).map(c => {
        const isPos = c.shap_value > 0;
        const widthPct = Math.min(100, Math.abs(c.shap_value) * 120);
        return `
          <div class="shap-row">
            <span class="shap-fname" title="${c.feature}">${FEATURE_META[c.feature]?.label || c.feature}</span>
            <div class="shap-bar-track">
              <div class="shap-bar-fill ${isPos ? 'shap-bar-pos' : 'shap-bar-neg'}" style="width:${Math.max(8, widthPct)}%;"></div>
            </div>
            <span class="shap-score" style="color:${isPos ? 'var(--red)' : 'var(--ocean)'};">
              ${isPos ? '+' : ''}${c.shap_value}
            </span>
          </div>
        `;
      }).join('')}
    </div>

    <div class="recommend">
      <b style="color:${color}">Recommended Operational Action —</b> ${recos}
    </div>

    <!-- Groq Threat Intelligence Directive Button -->
    <button class="btn btn-ghost" id="btnGroqDirectives" style="width:100%; justify-content:center; margin-top:14px; font-size:12.5px;" onclick="synthesizeThreatIntelligence()">
      ⚡ Generate Groq AI Civil Defense Directives
    </button>
    <div id="predictThreatIntelSlot"></div>
  `;

  if (fromUserClick) {
    const lv = levelKey(pct);
    if (pct >= 55) {
      AlertSound.play(lv, { maxMs: lv === 'red' ? 9000 : 6000 });
      vibrate([300, 150, 300]);
    } else {
      AlertSound.play(lv);
    }
  }
}

async function synthesizeThreatIntelligence() {
  const slot = document.getElementById('predictThreatIntelSlot');
  const btn = document.getElementById('btnGroqDirectives');
  if (!slot) return;
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = renderInlineSpinner('Consulting Groq LLM Directives...');
  }
  slot.innerHTML = `
    <div style="margin-top:12px;">
      ${renderSkeletonCard({
        title: 'Consulting Groq LLaMA/Qwen for Civil Defense Synthesis...',
        height: '160px',
        lines: 3
      })}
    </div>
  `;

  try {
    const intel = await api('/threats/assess-district', 'POST', { district: predictInputs.district });
    const aiData = intel.assessment?.aiThreatIntel || intel.threat_intel || {};

    slot.innerHTML = `
      <div class="threat-intel-box">
        <div class="threat-intel-header">
          <span style="font-family:var(--font-display); font-weight:700; font-size:14px; color:var(--text-0);">
            ${escapeHtml(aiData.headline || aiData.threat_title || 'Disaster Risk Synthesis')}
          </span>
          <span class="intel-badge">${escapeHtml(aiData.source_ai_model || intel.model_provenance?.ai_model || 'Groq AI Model')}</span>
        </div>
        <p style="font-size:12.5px; color:var(--text-1); line-height:1.6;">
          ${escapeHtml(aiData.executive_summary || aiData.threat_summary || 'Telemetry indicates elevated hydrological pressure in river basins.')}
        </p>
        <div style="margin-top:10px;">
          <div style="font-size:12px; font-weight:600; color:var(--ocean); margin-bottom:6px;">Civil Defense Directives:</div>
          <div class="directive-list">
            ${(aiData.precautionary_directives || aiData.civilian_directives || [
              'Evacuate ground floor structures in high-risk zones.',
              'Avoid all river-crossing bridges and underpasses.',
              'Maintain charged communications and essential provisions.'
            ]).map(d => `
              <div class="directive-item">
                <span class="directive-icon">✔</span>
                <span>${escapeHtml(d)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    slot.innerHTML = renderErrorState({
      title: 'Groq Directive Synthesis Interrupted',
      message: 'Unable to communicate with Groq LLM service. Fallback protocol: follow district civil defense guidance and avoid river crossings.',
      retryFn: 'synthesizeThreatIntelligence()'
    });
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '⚡ Generate Groq AI Civil Defense Directives';
    }
  }
}

// Reactive listener to synchronize predict inputs when location changes elsewhere
if (typeof AppEvents !== 'undefined') {
  AppEvents.on(AppEvents.EVENTS.LOCATION_CHANGED, (loc) => {
    const sel = document.getElementById('f_district');
    if (!sel || !loc.district) return;
    if (sel.value.toLowerCase() !== loc.district.toLowerCase()) {
      sel.value = loc.district;
      predictInputs.district = loc.district;
      const d = DISTRICTS.find(x => x.district.toLowerCase() === loc.district.toLowerCase());
      if (d) {
        predictInputs.elevation_m = Math.round(d.avg_elevation || d.elevation_m || 20);
        predictInputs.distance_from_coast_km = Math.round((d.avg_elevation || 20) < 100 ? 15 : 220);
        predictInputs.population_density = Math.round(d.avg_population_density || 1200);
      }
      renderFormGrid();
      executePrediction();
    }
  });
}

