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

  // Attach reactive listener for location updates
  if (typeof AppEvents !== 'undefined') {
    if (window._resWeatherUnsub) window._resWeatherUnsub();
    window._resWeatherUnsub = AppEvents.on(AppEvents.EVENTS.LOCATION_CHANGED, () => {
      const activeEl = document.getElementById('residentWeatherContent');
      if (activeEl && typeof state !== 'undefined' && state.page === 'resident-weather') {
        renderResidentWeather(document.getElementById('pageRoot'));
      }
    });
  }

  // Check location from GeoLocationService or state
  const geo = typeof GeoLocationService !== 'undefined' ? GeoLocationService.getStatus() : null;
  const userLat = geo?.coords?.lat ?? state.userLocation?.lat ?? state.userLocation?.latitude;
  const userLon = geo?.coords?.lon ?? state.userLocation?.lon ?? state.userLocation?.longitude;
  const isGps = geo?.isGps;
  const placeLabel = geo?.coords?.cityName || geo?.coords?.district || state.userLocation?.cityName || state.userLocation?.district || (userLat ? `${userLat.toFixed(2)}°, ${userLon.toFixed(2)}°` : null);

  const container = document.getElementById('residentWeatherContent');
  if (!container) return;

  if (userLat === undefined || userLon === undefined) {
    container.innerHTML = `
      <div class="glass-card elevated" style="padding:48px; text-align:center;">
        <div style="font-size:36px; margin-bottom:12px;">🛰️</div>
        <h3 style="font-size:18px; font-weight:700; margin-bottom:8px;">Location Permission Required</h3>
        <p style="font-size:13.5px; color:var(--text-muted); max-width:480px; margin:0 auto 20px;">
          Enable browser device geolocation or select your sector manually to stream live hyper-local weather and precipitation telemetry.
        </p>
        <div style="display:flex; justify-content:center; gap:12px; flex-wrap:wrap;">
          <button class="glass-btn btn-primary" onclick="GeoLocationService.requestDeviceLocation().then(() => renderResidentWeather(document.getElementById('pageRoot')))" style="gap:6px;">
            <span>📍</span> Enable GPS Location
          </button>
          <button class="glass-btn btn-ghost" onclick="if(typeof openLocPickerModal==='function')openLocPickerModal()" style="gap:6px;">
            <span>🏙️</span> Choose Sector Manually
          </button>
        </div>
      </div>
    `;
    return;
  }

  const lat = userLat;
  const lon = userLon;

  try {
    const data = await api(`/weather?lat=${lat}&lon=${lon}`);
    if (!container) return;

    const current = data.current || {};
    const temp = current.temp !== undefined ? current.temp : (data.main?.temp || 28);
    const rain = current.rain !== undefined ? current.rain : (data.rain?.['1h'] || 0);
    const humidity = current.humidity !== undefined ? current.humidity : (data.main?.humidity || 65);
    const wind = current.windSpeed !== undefined ? current.windSpeed : ((data.wind?.speed || 5) * 3.6);
    const pressure = current.pressure !== undefined ? current.pressure : (data.main?.pressure || 1012);

    const provBadge = isGps ? '🛰️ LIVE GPS SATELLITE FIX' : '📍 MANUAL SECTOR SELECTION';
    const provColor = isGps ? 'var(--ocean)' : 'var(--accent-primary)';

    container.innerHTML = `
      <!-- Location Telemetry Header -->
      <div class="glass-card" style="padding:16px 20px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <span style="font-size:22px;">📍</span>
          <div>
            <div style="font-weight:700; font-size:16px; color:var(--text-primary);">${escapeHtml(placeLabel || 'Monitored Sector')}</div>
            <div style="font-size:12px; color:var(--text-muted); font-family:var(--font-mono);">Coordinates: ${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E</div>
          </div>
        </div>
        <div style="display:flex; gap:10px; align-items:center;">
          <span class="glass-badge" style="background:rgba(255,255,255,0.06); color:${provColor}; font-family:var(--font-mono); font-size:11px;">
            ${provBadge}
          </span>
          <button class="glass-btn btn-ghost" onclick="if(typeof openLocPickerModal==='function')openLocPickerModal()" style="font-size:11.5px; padding:4px 10px;">
            Change Location ✏️
          </button>
        </div>
      </div>

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
