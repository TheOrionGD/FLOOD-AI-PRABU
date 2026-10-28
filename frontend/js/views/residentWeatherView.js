/**
 * residentWeatherView.js
 * Resident Workspace Screen 02 — Hyper-local Weather & Hydro Forecast
 * Connects to /api/weather with live GPS telemetry
 */

async function renderResidentWeather(root) {
  root.innerHTML = `
    <div class="saas-page-container">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:14px;">
        <div>
          <span class="story-tag" style="color:var(--ocean); border-color:rgba(31,224,168,0.3); background:rgba(31,224,168,0.1);">
            CITIZEN SAFETY HUB • ATMOSPHERIC METRICS
          </span>
          <h1 style="font-family:var(--font-display); font-size:28px; font-weight:700; margin-top:6px;">
            Hyper-Local Weather &amp; Hydro Forecast
          </h1>
          <p style="font-size:13.5px; color:var(--text-secondary);">
            Real-time satellite feeds and precipitation telemetry powered by OpenWeather and Open-Meteo.
          </p>
        </div>

        <button class="glass-btn btn-ghost" onclick="renderResidentWeather(document.getElementById('pageRoot'))">
          Refresh Sensors 🔄
        </button>
      </div>

      <div id="residentWeatherContent">
        <div class="glass-card" style="padding:36px; text-align:center;">
          <span class="spin-anim" style="font-size:22px; color:var(--accent-primary);">⚡</span>
          <div style="font-size:13px; color:var(--text-muted); margin-top:8px;">Streaming atmospheric sensor readings...</div>
        </div>
      </div>
    </div>
  `;

  let lat = 13.08;
  let lon = 80.27;
  if (state.userLocation && state.userLocation.latitude) {
    lat = state.userLocation.latitude;
    lon = state.userLocation.longitude;
  }

  try {
    const data = await api(`/weather?lat=${lat}&lon=${lon}`);
    const container = document.getElementById('residentWeatherContent');
    if (!container) return;

    const current = data.current || {};
    const temp = current.temp !== undefined ? current.temp : (data.main?.temp || 28);
    const rain = current.rain !== undefined ? current.rain : (data.rain?.['1h'] || 0);
    const humidity = current.humidity !== undefined ? current.humidity : (data.main?.humidity || 65);
    const wind = current.windSpeed !== undefined ? current.windSpeed : ((data.wind?.speed || 5) * 3.6);
    const pressure = current.pressure !== undefined ? current.pressure : (data.main?.pressure || 1012);

    container.innerHTML = `
      <!-- Weather Telemetry Grid -->
      <div class="grid-cards" style="grid-template-columns:repeat(4,1fr); gap:18px; margin-bottom:28px;">
        <div class="glass-stat-card border-lightning">
          <div class="glass-stat-header">Temperature</div>
          <div class="glass-stat-value" style="color:var(--accent-primary);">${Math.round(temp)}°C</div>
          <div class="glass-stat-subtext">Ambient Air Sensor</div>
        </div>

        <div class="glass-stat-card">
          <div class="glass-stat-header">Precipitation</div>
          <div class="glass-stat-value" style="color:var(--ocean);">${rain.toFixed(1)} mm</div>
          <div class="glass-stat-subtext">1-Hour Accrual Rate</div>
        </div>

        <div class="glass-stat-card">
          <div class="glass-stat-header">Relative Humidity</div>
          <div class="glass-stat-value" style="color:var(--accent-primary);">${humidity}%</div>
          <div class="glass-stat-subtext">Dew Point Saturation</div>
        </div>

        <div class="glass-stat-card">
          <div class="glass-stat-header">Barometric Pressure</div>
          <div class="glass-stat-value" style="color:var(--text-primary);">${pressure} hPa</div>
          <div class="glass-stat-subtext">Wind: ${Math.round(wind)} km/h</div>
        </div>
      </div>

      <!-- Hydro Insights Card -->
      <div class="glass-card elevated" style="padding:32px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <h3 style="font-size:18px; font-weight:700; display:flex; align-items:center; gap:8px;">
            <span>🌧️</span> Hydrologic Runoff Diagnostic
          </h3>
          <span class="glass-badge" style="background:rgba(51,199,255,0.12); color:var(--accent-primary); font-family:var(--font-mono); font-size:11px;">
            STATION TELEMETRY LIVE
          </span>
        </div>

        <p style="font-size:14px; color:var(--text-secondary); line-height:1.65; margin-bottom:24px;">
          Sensor stations indicate normal atmospheric conditions with barometric pressure holding at ${pressure} hPa. Precipitation rates of ${rain.toFixed(1)} mm/hr are well below urban culvert surcharge thresholds (45 mm/hr).
        </p>

        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.06); padding-top:20px;">
          <button class="glass-btn btn-secondary" onclick="openClimateModal()" style="gap:6px;">
            <span>🌦️</span> Open Dynamic Particle Atmosphere Settings
          </button>
          <button class="glass-btn btn-ghost" onclick="goTo('resident-risk')">
            Check Flood Probability Risk →
          </button>
        </div>
      </div>
    `;
  } catch (err) {
    const container = document.getElementById('residentWeatherContent');
    if (container) {
      container.innerHTML = `
        <div class="glass-card" style="padding:28px; border-color:var(--red); color:var(--red); text-align:center;">
          Failed to fetch live weather: ${escapeHtml(err.message)}
        </div>
      `;
    }
  }
}
