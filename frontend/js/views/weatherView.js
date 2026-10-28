/**
 * FLOODAI — Live Weather & Atmospheric Telemetry View
 * Open-Meteo satellite feed integration and OpenWeather observations across all monitored disaster districts.
 */

async function renderWeather(root) {
  root = root || document.getElementById('pageRoot');
  if (!root) return;

  root.innerHTML = `
    <div class="eyebrow">Real-Time Atmospheric Observation · Satellite Feeds</div>
    <h1 class="page-title">Live Weather &amp; Hydrological Monitor</h1>
    <p class="page-sub">Direct atmospheric telemetry feeds across all monitored disaster districts.</p>

    <div class="field span2" style="max-width:340px; margin:18px 0 12px;">
      <select id="wDistrict"></select>
    </div>
    <div id="weatherBody"></div>
  `;

  const sel = document.getElementById('wDistrict');
  const userCoords = (typeof GeoLocationService !== 'undefined' ? GeoLocationService.coords : null) || (typeof state !== 'undefined' ? state.userLocation : null);

  if (userCoords && typeof userCoords.lat === 'number' && typeof userCoords.lon === 'number') {
    const placeLabel = userCoords.cityName || userCoords.district || `${Number(userCoords.lat).toFixed(2)}°, ${Number(userCoords.lon).toFixed(2)}°`;
    const userOpt = document.createElement('option');
    userOpt.value = '__my_location__';
    userOpt.textContent = `📍 ${placeLabel} (Detected Location)`;
    sel.appendChild(userOpt);
  }

  DISTRICTS.forEach(d => {
    const o = document.createElement('option');
    o.value = d.district;
    o.textContent = `${d.district}, ${d.state}`;
    sel.appendChild(o);
  });

  if (userCoords && typeof userCoords.lat === 'number') {
    sel.value = '__my_location__';
  } else {
    sel.value = DISTRICTS[0]?.district || 'Chennai';
  }

  sel.onchange = () => loadWeather(sel.value, false);
  loadWeather(sel.value, false);
}

async function loadWeather(districtTarget, isRefresh = false) {
  const userCoords = (typeof GeoLocationService !== 'undefined' ? GeoLocationService.coords : null) || (typeof state !== 'undefined' ? state.userLocation : null);
  let lat, lon, districtName, stateName;

  if (districtTarget === '__my_location__' && userCoords) {
    lat = userCoords.lat;
    lon = userCoords.lon;
    districtName = userCoords.cityName || userCoords.district || 'Detected Location';
    stateName = userCoords.stateName || 'Monitored Region';
  } else {
    const d = DISTRICTS.find(x => x.district === districtTarget) || DISTRICTS[0] || { latitude: 13.08, longitude: 80.27, state: 'Tamil Nadu' };
    lat = d.latitude;
    lon = d.longitude;
    districtName = d.district;
    stateName = d.state;
  }

  const body = document.getElementById('weatherBody');
  if (!body) return;

  if (isRefresh) {
    body.classList.add('refreshing-card');
  } else {
    body.innerHTML = renderSkeletonWeather();
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,cloud_cover,surface_pressure&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,sunrise,sunset&timezone=auto&forecast_days=6`;
    
    // Fetch Open-Meteo and OpenWeather concurrently
    const [meteoRes, owData] = await Promise.allSettled([
      fetch(url).then(r => r.ok ? r.json() : null),
      (typeof WeatherService !== 'undefined' ? WeatherService.fetchCurrentWeather(d.latitude, d.longitude, isRefresh) : Promise.resolve(null))
    ]);

    const j = meteoRes.status === 'fulfilled' && meteoRes.value ? meteoRes.value : null;
    const c = j?.current || {};
    const ow = owData.status === 'fulfilled' && owData.value?.data ? owData.value.data : null;
    const norm = ow && typeof ClimateStateResolver !== 'undefined'
      ? ClimateStateResolver.normalizeWeatherResponse(ow, { district: districtName, lat: d.latitude, lon: d.longitude })
      : null;

    body.classList.remove('refreshing-card');

    const tempDisplay = norm ? `${norm.temperature}°C` : (typeof c.temperature_2m === 'number' ? `${Math.round(c.temperature_2m)}°C` : '--°C');
    const weatherDesc = norm ? `${norm.icon} ${norm.category} — ${norm.weatherDescription}` : 'Satellite Observation Active';

    body.innerHTML = `
      <div style="margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        ${renderDataFreshnessBar({
          label: `OpenWeather & Satellite Atmospheric Telemetry (${escapeHtml(districtName)})`,
          timestamp: c.time || new Date().toISOString(),
          onRefresh: `loadWeather('${districtName}', true)`,
          isRefreshing: false
        })}
        <button class="btn btn-sm btn-ghost" onclick="openClimateModal()" style="gap:6px; font-size:12px;">
          <span>🎨</span> Atmospheric Engine Settings
        </button>
      </div>
      <div class="glass weather-hero">
        <div>
          <div style="font-size:14px; color:var(--text-1); margin-bottom:6px;">${districtName}, ${d.state}</div>
          <div class="weather-big">${tempDisplay}</div>
          <div style="color:var(--cyber); font-size:13.5px; font-weight:600; margin-top:4px; text-transform:capitalize;">
            ${weatherDesc}
          </div>
          <div style="color:var(--text-2); font-size:12px; margin-top:4px;">
            Atmospheric Simulation Profile: <b style="color:var(--text-0);">${norm ? norm.condition.toUpperCase() : 'NEUTRAL'}</b>
          </div>
          <div class="forecast-row" style="margin-top:26px;">
            ${(j?.daily?.time || []).slice(0, 6).map((day, i) => `
              <div class="fday">
                <div class="d">${new Date(day).toLocaleDateString(undefined, { weekday: 'short' })}</div>
                <div class="t">${Math.round(j.daily.temperature_2m_max[i])}° / ${Math.round(j.daily.temperature_2m_min[i])}°</div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="grid-cards" style="grid-template-columns:repeat(2,1fr); margin-top:0;">
          ${weatherStat('Relative Humidity', (norm ? norm.humidity : c.relative_humidity_2m || 0) + '%')}
          ${weatherStat('Wind Velocity', norm ? `${norm.windSpeedKmh} km/h ${norm.windBearing}` : `${Math.round(c.wind_speed_10m || 0)} km/h`)}
          ${weatherStat('Precipitation', norm ? `${norm.precipitationIntensity > 0 ? (norm.precipitationIntensity * 100).toFixed(0) + '% Intensity' : 'None'}` : `${c.precipitation || 0} mm`)}
          ${weatherStat('Cloud Coverage', (norm ? norm.cloudCoverage : c.cloud_cover || 0) + '%')}
          ${weatherStat('Surface Pressure', (norm ? norm.pressure : Math.round(c.surface_pressure || 1013)) + ' hPa')}
          ${weatherStat('Solar Phase', norm ? `${norm.solarPhase.toUpperCase()} (${norm.sunriseTime || '06:00'} / ${norm.sunsetTime || '18:30'})` : 'Day')}
        </div>
      </div>
    `;
  } catch (err) {
    body.classList.remove('refreshing-card');
    body.innerHTML = renderErrorState({
      title: `Weather Telemetry Offline for ${districtName}`,
      message: err.message || 'Unable to retrieve live OpenWeather and satellite atmospheric telemetry.',
      retryFn: `loadWeather('${districtName}', false)`
    });
  }
}

function weatherStat(lbl, val) {
  return `
    <div class="glass" style="padding:16px;">
      <div style="font-size:11px; color:var(--text-1); text-transform:uppercase; letter-spacing:1px;">${lbl}</div>
      <div style="font-family:var(--font-display); font-size:19px; font-weight:700; margin-top:6px;">${val}</div>
    </div>
  `;
}
