/**
 * residentRiskView.js
 * Resident Workspace Screen 01 — Dynamic Coastal Flood Intelligence & Risk Ranking
 *
 * Fully dynamic, globally scalable coastal flood intelligence and propagation engine:
 * 1. Resident Location Acquisition (Browser GPS or Manual Selector)
 * 2. Configurable 500 km Search Radius (Recalculates dynamically globally)
 * 3. Dynamic Coastal Monitoring Discovery from real geospatial datasets
 * 4. Real-Time Environmental Observations (OpenWeather + Open-Meteo)
 * 5. Dynamic Baseline Change Detection & Calibrated Multi-Factor Risk Ranking
 * 6. Dynamic Hydrodynamic Propagation Graph & Arrival-Time Estimation
 * 7. Resident Exposure Assessment & Civil Defense Directives
 * 8. Interactive Leaflet Coastal Monitoring Map with Radius Circle & Hazard Vectors
 */

// Active reactive state for Coastal Intelligence
let _coastalRadiusKm = parseInt(localStorage.getItem('floodai_coastal_radius_km'), 10) || 500;
let _coastalIntel = null;
let _coastalActiveFilter = 'all';
let _coastalSortOrder = 'risk_desc';
let _coastalSearchText = '';
let _inspectedZoneId = null;
let _coastalLeafletMap = null;
let _coastalMapMarkers = [];
let _coastalRadiusCircle = null;
let _coastalEdgesLayer = null;
let _coastalRefreshTimer = null;
let _coastalRadiusDebounceTimer = null;
let _coastalReqSequence = 0;
let _riskUnsubscribeLocation = null;
let _isCoastalRefreshing = false;

/**
 * Persists and updates the search radius, triggering dynamic recalculation
 */
window.setCoastalRadius = function(newRadiusKm) {
  const rad = Math.max(10, Math.min(1500, parseInt(newRadiusKm, 10) || 500));
  _coastalRadiusKm = rad;
  localStorage.setItem('floodai_coastal_radius_km', String(rad));

  // Update slider and display if in DOM immediately for instant UI feedback
  const slider = document.getElementById('coastalRadiusSlider');
  if (slider) slider.value = rad;
  const label = document.getElementById('coastalRadiusValLabel');
  if (label) label.textContent = `${rad} km`;

  // Update preset buttons styles immediately
  document.querySelectorAll('.radius-preset-btn').forEach(btn => {
    const val = parseInt(btn.getAttribute('data-radius'), 10);
    if (val === rad) {
      btn.classList.add('active');
      btn.style.background = 'rgba(51,199,255,0.2)';
      btn.style.borderColor = 'var(--cyber, #33c7ff)';
      btn.style.color = 'var(--cyber, #33c7ff)';
    } else {
      btn.classList.remove('active');
      btn.style.background = 'rgba(255,255,255,0.03)';
      btn.style.borderColor = 'rgba(255,255,255,0.1)';
      btn.style.color = 'var(--text-secondary)';
    }
  });

  if (typeof AppEvents !== 'undefined') {
    AppEvents.emit(AppEvents.EVENTS.COASTAL_RADIUS_CHANGED, { radiusKm: rad });
  }

  // Debounce API dispatch by 200ms to prevent duplicate requests during rapid dragging
  clearTimeout(_coastalRadiusDebounceTimer);
  _coastalRadiusDebounceTimer = setTimeout(() => {
    fetchAndRenderCoastalIntelligence();
  }, 200);
};

/**
 * Filter handler for coastal zones
 */
window.setCoastalFilter = function(filterType) {
  _coastalActiveFilter = filterType;
  document.querySelectorAll('.coastal-filter-btn').forEach(btn => {
    if (btn.getAttribute('data-filter') === filterType) {
      btn.classList.add('active');
      btn.style.background = 'rgba(31,224,168,0.2)';
      btn.style.borderColor = 'var(--ocean, #1fe0a8)';
      btn.style.color = 'var(--ocean, #1fe0a8)';
    } else {
      btn.classList.remove('active');
      btn.style.background = 'rgba(255,255,255,0.03)';
      btn.style.borderColor = 'rgba(255,255,255,0.1)';
      btn.style.color = 'var(--text-secondary)';
    }
  });
  renderRankedCoastalCards();
};

/**
 * Sort handler for coastal zones
 */
window.sortCoastalCards = function() {
  const select = document.getElementById('coastalSortSelect');
  if (select) {
    _coastalSortOrder = select.value;
    renderRankedCoastalCards();
  }
};

/**
 * Search handler for coastal zones
 */
window.filterCoastalCards = function() {
  const input = document.getElementById('coastalSearchInput');
  if (input) {
    _coastalSearchText = input.value.trim().toLowerCase();
    renderRankedCoastalCards();
  }
};

/**
 * Toggles inspection drawer for a specific coastal zone
 */
window.inspectCoastalZone = function(zoneId) {
  _inspectedZoneId = (_inspectedZoneId === zoneId) ? null : zoneId;
  renderRankedCoastalCards();
  if (_inspectedZoneId) {
    const el = document.getElementById(`card-${_inspectedZoneId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
};

/**
 * Focuses map on a selected zone and opens popup
 */
window.focusMapOnZone = function(lat, lon, zoneName) {
  if (_coastalLeafletMap && typeof _coastalLeafletMap.setView === 'function') {
    _coastalLeafletMap.setView([lat, lon], 8, { animate: true });
    const targetMarker = _coastalMapMarkers.find(m => m.zoneName === zoneName);
    if (targetMarker && targetMarker.marker) {
      targetMarker.marker.openPopup();
    }
    const mapSection = document.getElementById('coastalMapContainer');
    if (mapSection) mapSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

/**
 * Pre-configures and navigates to the simulation page with this coastal zone
 */
window.simulateZoneAlert = function(zoneId, zoneName, severity, lat, lon) {
  sessionStorage.setItem('floodai_sim_target_zone_id', zoneId);
  sessionStorage.setItem('floodai_sim_target_zone_name', zoneName);
  sessionStorage.setItem('floodai_sim_target_severity', severity);
  sessionStorage.setItem('floodai_sim_target_lat', String(lat));
  sessionStorage.setItem('floodai_sim_target_lon', String(lon));
  if (typeof goTo === 'function') {
    goTo('resident-simulation');
  }
};

/**
 * Renders the live-ranked coastal zone cards grid
 */
function renderRankedCoastalCards() {
  const container = document.getElementById('rankedCoastalCardsGrid');
  if (!container || !_coastalIntel) return;

  const rawZones = _coastalIntel.rankedZones || [];

  // Filter
  let filtered = rawZones.filter(item => {
    if (_coastalSearchText) {
      const q = _coastalSearchText;
      const match = item.name.toLowerCase().includes(q) ||
                    (item.region && item.region.toLowerCase().includes(q)) ||
                    (item.country && item.country.toLowerCase().includes(q)) ||
                    (item.drainageBasin && item.drainageBasin.toLowerCase().includes(q)) ||
                    item.zoneId.toLowerCase().includes(q);
      if (!match) return false;
    }

    const cat = item.riskAssessment?.riskCategory || 'Normal';
    const warning = item.observations?.officialWarningSeverity || 'None';

    if (_coastalActiveFilter === 'all') return true;
    if (_coastalActiveFilter === 'critical') return cat === 'Critical';
    if (_coastalActiveFilter === 'high') return cat === 'High';
    if (_coastalActiveFilter === 'elevated') return cat === 'Elevated';
    if (_coastalActiveFilter === 'normal') return cat === 'Normal';
    if (_coastalActiveFilter === 'warning') return warning !== 'None';
    return true;
  });

  // Sort
  filtered.sort((a, b) => {
    const scoreA = a.riskAssessment?.riskScore || 0;
    const scoreB = b.riskAssessment?.riskScore || 0;
    const distA = a.distanceFromUserKm || 0;
    const distB = b.distanceFromUserKm || 0;
    const elevA = a.elevationMsl || 0;
    const elevB = b.elevationMsl || 0;
    const confA = a.riskAssessment?.confidencePct || 0;
    const confB = b.riskAssessment?.confidencePct || 0;

    if (_coastalSortOrder === 'risk_desc') return scoreB - scoreA;
    if (_coastalSortOrder === 'risk_asc') return scoreA - scoreB;
    if (_coastalSortOrder === 'dist_asc') return distA - distB;
    if (_coastalSortOrder === 'dist_desc') return distB - distA;
    if (_coastalSortOrder === 'elev_asc') return elevA - elevB;
    if (_coastalSortOrder === 'conf_desc') return confB - confA;
    if (_coastalSortOrder === 'name_asc') return a.name.localeCompare(b.name);
    return 0;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="glass-card" style="grid-column:1 / -1; padding:36px; text-align:center; color:var(--text-muted);">
        <span style="font-size:26px; display:block; margin-bottom:10px;">🔍</span>
        <div style="font-size:15px; font-weight:600; color:var(--text-secondary);">No coastal monitoring zones match your current filter</div>
        <p style="font-size:12.5px; margin-top:6px;">Try switching to "All Discovered Zones (${rawZones.length})" or adjust your search keywords.</p>
        <button class="glass-btn btn-ghost" onclick="setCoastalFilter('all')" style="margin-top:14px; font-size:12px;">
          Reset Filter to All Zones
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map((item, idx) => {
    const score = item.riskAssessment?.riskScore || 15.0;
    const cat = item.riskAssessment?.riskCategory || 'Normal';
    const conf = item.riskAssessment?.confidencePct || 85;
    const obs = item.observations || {};
    const changes = item.baselineChanges || {};
    const isExpanded = _inspectedZoneId === item.zoneId;

    let badgeColor = 'var(--ocean, #1fe0a8)';
    let badgeBg = 'rgba(31,224,168,0.12)';
    let badgeBorder = 'rgba(31,224,168,0.35)';
    let cardBorder = '1px solid rgba(255,255,255,0.07)';

    if (cat === 'Critical') {
      badgeColor = 'var(--red, #f43f5e)';
      badgeBg = 'rgba(244,63,94,0.14)';
      badgeBorder = 'rgba(244,63,94,0.4)';
      cardBorder = '1px solid rgba(244,63,94,0.35)';
    } else if (cat === 'High') {
      badgeColor = 'var(--amber, #f59e0b)';
      badgeBg = 'rgba(245,158,11,0.14)';
      badgeBorder = 'rgba(245,158,11,0.4)';
      cardBorder = '1px solid rgba(245,158,11,0.25)';
    } else if (cat === 'Elevated') {
      badgeColor = '#FFD166';
      badgeBg = 'rgba(255,209,102,0.12)';
      badgeBorder = 'rgba(255,209,102,0.3)';
    }

    const warning = obs.officialWarningSeverity || 'None';
    const hasOfficialWarning = warning !== 'None';

    return `
      <div id="card-${escapeHtml(item.zoneId)}" class="glass-card elevated coastal-zone-card" style="padding:22px; display:flex; flex-direction:column; justify-content:space-between; border:${cardBorder}; position:relative; transition:transform 0.2s ease, border-color 0.2s ease;">
        <div>
          <!-- Header: Stable ID & Proximity -->
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; font-family:var(--font-mono); font-size:11px; color:var(--text-muted);">
            <span style="background:rgba(255,255,255,0.05); padding:2px 8px; border-radius:4px; border:1px solid rgba(255,255,255,0.08);" title="Stable Deterministic Location Identifier">
              🆔 ${escapeHtml(item.zoneId)}
            </span>
            <span style="color:var(--cyber, #33c7ff); font-weight:600;">
              📍 ${item.distanceFromUserKm > 0 ? `${item.distanceFromUserKm.toFixed(1)} km away` : 'Your Immediate Sector'}
            </span>
          </div>

          <!-- Zone Name & Risk Badge -->
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; gap:8px;">
            <div>
              <h3 style="font-size:18px; font-weight:700; margin:0; color:var(--text-primary); line-height:1.25;">
                ${escapeHtml(item.name)}
              </h3>
              <div style="font-size:12px; color:var(--text-muted); margin-top:3px; display:flex; align-items:center; gap:6px;">
                <span>🌊</span> ${escapeHtml(item.drainageBasin || item.region || 'Coastal Basin')} • <span style="font-family:var(--font-mono); font-size:11px;">${escapeHtml(item.country)}</span>
              </div>
            </div>

            <span class="glass-badge" style="background:${badgeBg}; color:${badgeColor}; border:1px solid ${badgeBorder}; font-size:11px; font-family:var(--font-mono); font-weight:700; padding:4px 9px; white-space:nowrap;">
              ${cat === 'Critical' ? '🔴 CRITICAL SURGE' : (cat === 'High' ? '🟡 HIGH HAZARD' : (cat === 'Elevated' ? '🟠 ELEVATED WATCH' : '🟢 NORMAL STATUS'))}
            </span>
          </div>

          <!-- Official Warning Ribbon (If applicable) -->
          ${hasOfficialWarning ? `
            <div style="background:rgba(244,63,94,0.1); border-left:3px solid var(--red, #f43f5e); padding:8px 12px; border-radius:0 6px 6px 0; margin-bottom:12px; font-size:11.5px; color:var(--text-primary); display:flex; align-items:center; gap:6px;">
              <span>📢</span> <strong>Official ${escapeHtml(warning)} Alert</strong> synchronized with regional disaster bulletins.
            </div>
          ` : ''}

          <!-- Risk Score & Probability Meter -->
          <div style="background:rgba(0,0,0,0.25); border-radius:10px; padding:12px 14px; margin-bottom:14px; border:1px solid rgba(255,255,255,0.04);">
            <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:6px;">
              <span style="font-size:11px; font-family:var(--font-mono); color:var(--text-muted); text-transform:uppercase;">
                Evidence-Based Risk Score
              </span>
              <span style="font-family:var(--font-display); font-size:24px; font-weight:800; color:${badgeColor}; line-height:1;">
                ${score.toFixed(1)} / 100
              </span>
            </div>

            <div style="width:100%; height:7px; background:rgba(255,255,255,0.06); border-radius:4px; overflow:hidden;">
              <div style="width:${Math.min(score, 100)}%; height:100%; background:linear-gradient(90deg, #1fe0a8 0%, #f59e0b 55%, #f43f5e 100%); border-radius:4px; transition:width 0.4s ease;"></div>
            </div>

            <div style="display:flex; justify-content:space-between; font-size:10px; color:var(--text-muted); font-family:var(--font-mono); margin-top:4px;">
              <span>Normal &lt;30</span>
              <span>Elevated 30-55</span>
              <span>High 55-75</span>
              <span>Critical &gt;75</span>
            </div>
          </div>

          <!-- Key Hydro-Meteorological Metrics -->
          <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; margin-bottom:14px; font-size:11.5px; text-align:center;">
            <div style="padding:8px 6px; background:rgba(255,255,255,0.02); border-radius:6px; border:1px solid rgba(255,255,255,0.04);">
              <div style="color:var(--text-muted); font-family:var(--font-mono); font-size:10px;">ELEVATION</div>
              <div style="font-weight:700; margin-top:2px; color:${item.elevationMsl < 8 ? 'var(--red, #f43f5e)' : 'var(--ocean)'};">
                ${item.elevationMsl ? item.elevationMsl.toFixed(1) : '6.0'}m
              </div>
            </div>

            <div style="padding:8px 6px; background:rgba(255,255,255,0.02); border-radius:6px; border:1px solid rgba(255,255,255,0.04);">
              <div style="color:var(--text-muted); font-family:var(--font-mono); font-size:10px;">RAIN (1h / 24h)</div>
              <div style="font-weight:700; margin-top:2px; color:var(--text-primary);">
                ${obs.rainfall1hMm || 0} / ${obs.rainfall24hMm || 0}mm
              </div>
            </div>

            <div style="padding:8px 6px; background:rgba(255,255,255,0.02); border-radius:6px; border:1px solid rgba(255,255,255,0.04);">
              <div style="color:var(--text-muted); font-family:var(--font-mono); font-size:10px;">WAVE SWELL</div>
              <div style="font-weight:700; margin-top:2px; color:${(obs.waveHeightM || 0) > 1.8 ? 'var(--amber)' : 'var(--text-primary)'};">
                ${obs.waveHeightM ? obs.waveHeightM.toFixed(1) : '0.8'}m MSL
              </div>
            </div>
          </div>

          <!-- Primary Drivers Chips -->
          <div style="margin-bottom:12px;">
            <div style="font-size:10px; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:5px; text-transform:uppercase;">
              Verified Hazard Drivers:
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:5px;">
              ${(item.riskAssessment?.primaryDrivers || ['Baseline hydro nominal']).map(d => `
                <span style="font-size:11px; padding:2px 7px; border-radius:4px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); color:var(--text-secondary);">
                  ${escapeHtml(d)}
                </span>
              `).join('')}
            </div>
          </div>

          <!-- Contextual Civilian Directive -->
          <div style="background:rgba(255,255,255,0.02); border-left:3px solid ${badgeColor}; padding:9px 12px; border-radius:0 6px 6px 0; margin-bottom:14px;">
            <div style="font-size:10.5px; font-weight:600; color:${badgeColor}; margin-bottom:2px;">
              🛡️ Civil Defense Directive:
            </div>
            <div style="font-size:12px; color:var(--text-secondary); line-height:1.4;">
              ${escapeHtml(item.riskAssessment?.civilianDirectives?.[0] || 'Standard surveillance active.')}
            </div>
          </div>

          <!-- Expanded Evidence & Telemetry Drawer -->
          ${isExpanded ? `
            <div style="background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.09); border-radius:8px; padding:14px; margin-bottom:14px; font-size:11.5px; animation:fadeIn 0.2s ease;">
              <div style="font-family:var(--font-mono); font-weight:700; color:var(--cyber, #33c7ff); margin-bottom:8px; text-transform:uppercase;">
                Telemetry &amp; Baseline Anomaly Analysis
              </div>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; color:var(--text-secondary); margin-bottom:10px;">
                <div>• Surface Pressure: <strong style="color:var(--text-primary);">${obs.surfacePressureHpa || 1012} hPa</strong> (${changes.pressureAnomalyHpa >= 0 ? '+' : ''}${changes.pressureAnomalyHpa || 0} hPa)</div>
                <div>• Wind Speed &amp; Gust: <strong style="color:var(--text-primary);">${obs.windSpeedKmh || 15} km/h</strong> (Gusts: ${obs.windGustKmh || 20} km/h)</div>
                <div>• Relative Humidity: <strong style="color:var(--text-primary);">${obs.humidityPct || 70}%</strong></div>
                <div>• Soil Moisture: <strong style="color:var(--text-primary);">${obs.soilMoisturePct || 45}%</strong></div>
                <div>• Ambient Temp (Context): <strong style="color:var(--text-primary);">${obs.temperatureC || 27}°C</strong></div>
                <div>• Prediction Confidence: <strong style="color:var(--ocean);">${conf}% Model Score</strong></div>
              </div>
              <div style="font-size:11px; color:var(--text-muted); border-top:1px solid rgba(255,255,255,0.06); padding-top:6px;">
                <strong>Source Provenance:</strong> ${escapeHtml(obs.dataProvenance?.weatherProvider || 'OpenWeatherMap API')} &amp; ${escapeHtml(obs.dataProvenance?.marineProvider || 'Open-Meteo High-Res')}
              </div>
              <div style="font-size:10.5px; color:#93A4C3; margin-top:4px; font-style:italic;">
                ${escapeHtml(obs.temperatureContextNotice || 'Temperature evaluated as atmospheric context; not sole proof of flood.')}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Action Buttons -->
        <div style="display:flex; gap:8px; border-top:1px solid rgba(255,255,255,0.06); padding-top:12px; margin-top:6px; flex-wrap:wrap;">
          <button class="glass-btn btn-ghost" onclick="inspectCoastalZone('${escapeHtml(item.zoneId)}')" style="flex:1; justify-content:center; font-size:11.5px; padding:6px 8px;">
            ${isExpanded ? '▲ Hide Evidence' : '▼ Inspect Telemetry'}
          </button>

          <button class="glass-btn btn-secondary" onclick="focusMapOnZone(${item.coordinates.latitude}, ${item.coordinates.longitude}, '${escapeHtml(item.name)}')" style="flex:1.1; justify-content:center; font-size:11.5px; padding:6px 8px; gap:4px;">
            <span>📍</span> Focus GIS
          </button>

          <button class="glass-btn btn-primary" onclick="simulateZoneAlert('${escapeHtml(item.zoneId)}', '${escapeHtml(item.name)}', '${escapeHtml(cat)}', ${item.coordinates.latitude}, ${item.coordinates.longitude})" style="flex:1.2; justify-content:center; font-size:11.5px; padding:6px 8px; gap:4px;" title="Test resident alert dispatch simulation with this zone">
            <span>🚨</span> Test Alert
          </button>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Initializes and updates the Interactive Leaflet Coastal Monitoring Map & Radar
 */
/**
 * Initializes and updates the Interactive Leaflet Coastal Monitoring Map & Radar
 */
function initOrUpdateCoastalMap(centerLat, centerLon, radiusKm, rankedZones = [], propagationGraph = null) {
  const mapContainer = document.getElementById('coastalMapCanvas');
  if (!mapContainer || typeof L === 'undefined') return;

  const existingMap = _coastalLeafletMap;
  const isMapAttached = existingMap && mapContainer._leaflet_id && document.body.contains(mapContainer);

  if (isMapAttached) {
    // Smoothly pan & update view without destroying the map
    existingMap.setView([centerLat, centerLon], existingMap.getZoom() || 7, { animate: true });

    if (_coastalRadiusCircle) {
      _coastalRadiusCircle.setLatLng([centerLat, centerLon]);
      _coastalRadiusCircle.setRadius(radiusKm * 1000);
      try {
        _coastalRadiusCircle.setTooltipContent(
          `<strong>Active Search Boundary</strong><br>Radius: ${radiusKm} km centered on your location`
        );
      } catch (_) {}
    }

    // Remove existing zone markers and edge polylines
    _coastalMapMarkers.forEach(m => {
      if (m.marker) existingMap.removeLayer(m.marker);
    });
    _coastalMapMarkers = [];

    if (_coastalEdgesLayer) {
      if (Array.isArray(_coastalEdgesLayer)) {
        _coastalEdgesLayer.forEach(l => existingMap.removeLayer(l));
      } else {
        existingMap.removeLayer(_coastalEdgesLayer);
      }
      _coastalEdgesLayer = [];
    } else {
      _coastalEdgesLayer = [];
    }

    // Add new markers & edge polylines
    _drawCoastalMarkersAndEdges(existingMap, centerLat, centerLon, rankedZones, propagationGraph);
    return;
  }

  // Clear existing map instance if container was destroyed or recreated
  if (_coastalLeafletMap) {
    try {
      _coastalLeafletMap.remove();
    } catch (e) {}
    _coastalLeafletMap = null;
  }
  _coastalMapMarkers = [];
  _coastalEdgesLayer = [];

  // Create Leaflet map centered at resident coordinates
  _coastalLeafletMap = L.map('coastalMapCanvas', {
    scrollWheelZoom: false,
    zoomControl: true,
  }).setView([centerLat, centerLon], 7);

  // High-contrast Dark GIS Map Tiles (CartoDB Dark Matter)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO &copy; FloodAI HydroGIS',
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(_coastalLeafletMap);

  // 1. Draw 500 km (or configured) Monitoring Radius Circle
  _coastalRadiusCircle = L.circle([centerLat, centerLon], {
    radius: radiusKm * 1000,
    color: '#33C7FF',
    weight: 1.5,
    dashArray: '6, 6',
    fillColor: '#33C7FF',
    fillOpacity: 0.04,
  }).addTo(_coastalLeafletMap);

  _coastalRadiusCircle.bindTooltip(
    `<strong>Active Search Boundary</strong><br>Radius: ${radiusKm} km centered on your location`,
    { permanent: false, direction: 'top' }
  );

  // 2. Add Center Resident Marker (Pulsing Cyan Marker)
  const residentIcon = L.divIcon({
    className: 'resident-gis-marker',
    html: `
      <div style="position:relative; width:22px; height:22px;">
        <div style="position:absolute; width:22px; height:22px; border-radius:50%; background:rgba(51,199,255,0.4); animation:ping 1.5s infinite;"></div>
        <div style="position:absolute; top:3px; left:3px; width:16px; height:16px; border-radius:50%; background:#33C7FF; border:2px solid #FFFFFF; box-shadow:0 0 10px #33C7FF;"></div>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });

  L.marker([centerLat, centerLon], { icon: residentIcon, zIndexOffset: 1000 })
    .addTo(_coastalLeafletMap)
    .bindPopup(`
      <div style="font-family:sans-serif; color:#04101F; padding:4px;">
        <strong style="color:#0077b6; font-size:13px;">📍 Resident Monitoring Base</strong><br>
        <div style="font-size:11px; margin-top:3px;">Lat: ${centerLat.toFixed(4)} • Lon: ${centerLon.toFixed(4)}</div>
        <div style="font-size:11px; color:#555; margin-top:2px;">Configured Search Radius: <strong>${radiusKm} km</strong></div>
      </div>
    `);

  _drawCoastalMarkersAndEdges(_coastalLeafletMap, centerLat, centerLon, rankedZones, propagationGraph);

  // Adjust map bounds to encompass radius circle
  try {
    _coastalLeafletMap.fitBounds(_coastalRadiusCircle.getBounds(), { padding: [20, 20] });
  } catch (e) {}
}

function _drawCoastalMarkersAndEdges(mapInstance, centerLat, centerLon, rankedZones = [], propagationGraph = null) {
  // 3. Add Discovered Coastal Monitoring Zones Markers
  rankedZones.forEach(z => {
    const lat = z.coordinates?.latitude || z.latitude;
    const lon = z.coordinates?.longitude || z.longitude;
    if (typeof lat !== 'number' || typeof lon !== 'number') return;
    const cat = z.riskAssessment?.riskCategory || 'Normal';
    const score = z.riskAssessment?.riskScore || 20;

    let pinColor = '#1FE0A8';
    if (cat === 'Critical') pinColor = '#FF4D6A';
    else if (cat === 'High') pinColor = '#FFB84D';
    else if (cat === 'Elevated') pinColor = '#FFD166';

    const zoneIcon = L.divIcon({
      className: 'coastal-zone-gis-marker',
      html: `
        <div style="width:28px; height:28px; border-radius:50%; background:rgba(0,0,0,0.7); border:2px solid ${pinColor}; box-shadow:0 0 8px ${pinColor}; display:flex; align-items:center; justify-content:center; color:#FFF; font-size:10px; font-weight:800; font-family:var(--font-mono, monospace);">
          ${Math.round(score)}
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    const marker = L.marker([lat, lon], { icon: zoneIcon })
      .addTo(mapInstance)
      .bindPopup(`
        <div style="font-family:sans-serif; color:#04101F; padding:6px; min-width:180px;">
          <div style="font-size:10px; color:#666; font-family:monospace; margin-bottom:2px;">${escapeHtml(z.zoneId)}</div>
          <strong style="font-size:13px; color:${pinColor};">${escapeHtml(z.name)}</strong>
          <div style="font-size:11.5px; margin-top:4px;"><strong>${score.toFixed(1)}%</strong> ${cat} Risk</div>
          <div style="font-size:11px; color:#444; margin-top:2px;">Dist: <strong>${(z.distanceFromUserKm || 0).toFixed(1)} km</strong> • Elev: ${z.elevationMsl || 6}m</div>
          <div style="margin-top:8px;">
            <button onclick="inspectCoastalZone('${escapeHtml(z.zoneId)}')" style="background:#04101F; color:#FFF; border:none; padding:4px 8px; border-radius:4px; font-size:10.5px; cursor:pointer;">
              Inspect Telemetry →
            </button>
          </div>
        </div>
      `);

    _coastalMapMarkers.push({ zoneName: z.name, marker });
  });

  // 4. Draw Directional Hazard Propagation Vectors from Graph
  _coastalEdgesLayer = [];
  if (propagationGraph && propagationGraph.edges && propagationGraph.edges.length > 0) {
    propagationGraph.edges.forEach(edge => {
      const srcNode = propagationGraph.nodes.find(n => n.id === edge.sourceNodeId);
      const tgtNode = propagationGraph.nodes.find(n => n.id === edge.targetNodeId);
      if (srcNode && tgtNode) {
        const isHazardCascade = edge.isActiveHazardCascade;
        const lineColor = isHazardCascade ? '#FF4D6A' : 'rgba(51,199,255,0.45)';
        const lineWeight = isHazardCascade ? 3.0 : 1.5;

        const line = L.polyline(
          [
            [srcNode.coordinates.latitude, srcNode.coordinates.longitude],
            [tgtNode.coordinates.latitude, tgtNode.coordinates.longitude],
          ],
          {
            color: lineColor,
            weight: lineWeight,
            dashArray: isHazardCascade ? '4, 4' : '6, 8',
            opacity: 0.85,
          }
        ).addTo(mapInstance);

        line.bindTooltip(
          `<strong>${escapeHtml(edge.pathwayType)}</strong><br>Distance: ${edge.distanceKm} km<br>Travel Window: ${edge.estimatedTravelWindow}`,
          { permanent: false }
        );

        _coastalEdgesLayer.push(line);
      }
    });
  }
}

/**
 * Fetches coastal intelligence from the backend and updates the view
 */
async function fetchAndRenderCoastalIntelligence(isManualRefresh = false) {
  const container = document.getElementById('coastalContentContainer');
  if (!container) return;

  const geo = typeof GeoLocationService !== 'undefined' ? GeoLocationService.getStatus() : null;
  const userLat = geo?.coords?.lat ?? state.userLocation?.lat ?? state.userLocation?.latitude;
  const userLon = geo?.coords?.lon ?? state.userLocation?.lon ?? state.userLocation?.longitude;
  const isGps = geo?.isGps;

  if (userLat === undefined || userLon === undefined) {
    container.innerHTML = `
      <div class="glass-card elevated" style="padding:48px; text-align:center;">
        <div style="font-size:38px; margin-bottom:14px;">📍</div>
        <h3 style="font-size:19px; font-weight:700; margin-bottom:8px;">Location Permission Required for Coastal Flood Intelligence</h3>
        <p style="font-size:13.5px; color:var(--text-muted); max-width:520px; margin:0 auto 24px; line-height:1.6;">
          FloodAI dynamically discovers coastal vulnerability zones and computes hydrodynamic propagation cascades across a 500 km radius specifically centered on your actual coordinates.
        </p>
        <div style="display:flex; justify-content:center; gap:12px; flex-wrap:wrap;">
          <button class="glass-btn btn-primary" onclick="GeoLocationService.requestDeviceLocation().then(() => fetchAndRenderCoastalIntelligence(true))" style="gap:6px;">
            <span>🛰️</span> Allow GPS Coordinates
          </button>
          <button class="glass-btn btn-ghost" onclick="if(typeof openLocPickerModal==='function')openLocPickerModal()" style="gap:6px;">
            <span>🏙️</span> Select Sector Manually
          </button>
        </div>
      </div>
    `;
    return;
  }

  _isCoastalRefreshing = true;
  const thisReqId = ++_coastalReqSequence;
  const refreshIndicator = document.getElementById('coastalRefreshIndicator');
  if (refreshIndicator) {
    refreshIndicator.innerHTML = '<span class="spin-anim" style="display:inline-block; margin-right:4px;">⚡</span> Ingesting telemetry...';
    refreshIndicator.style.color = 'var(--cyber, #33c7ff)';
  }

  try {
    const res = await api(`/geospatial/coastal-intelligence?lat=${userLat}&lon=${userLon}&radius=${_coastalRadiusKm}`);
    // Race condition guard: if another request was triggered while in flight, discard stale response
    if (thisReqId !== _coastalReqSequence) {
      return;
    }
    _coastalIntel = res;
    state.coastalIntel = res;
    _isCoastalRefreshing = false;

    // Render or update the page content reactively
    renderCoastalIntelligenceUI(res, userLat, userLon, isGps);

    if (typeof AppEvents !== 'undefined') {
      AppEvents.emit(AppEvents.EVENTS.COASTAL_INTEL_UPDATED, res);
    }
  } catch (err) {
    if (thisReqId !== _coastalReqSequence) return;
    _isCoastalRefreshing = false;
    
    // If we already have previously rendered content, preserve it and show an inline error indicator
    if (refreshIndicator) {
      refreshIndicator.innerHTML = `⚠️ Sync notice: ${escapeHtml(err.message)}`;
      refreshIndicator.style.color = 'var(--amber, #f59e0b)';
      if (typeof toast === 'function') toast(`Telemetry sync notice: ${err.message}`);
    } else {
      container.innerHTML = `
        <div class="glass-card" style="padding:28px; border-color:var(--red); color:var(--red); text-align:center;">
          <strong>Failed to retrieve dynamic coastal flood intelligence:</strong> ${escapeHtml(err.message)}
          <div style="margin-top:12px;">
            <button class="glass-btn btn-ghost" onclick="fetchAndRenderCoastalIntelligence(true)" style="font-size:12px;">
              Retry Telemetry Ingestion
            </button>
          </div>
        </div>
      `;
    }
  }
}

/**
 * Builds the full UI markup once coastal intelligence data is ready
 */
function renderCoastalIntelligenceUI(intel, lat, lon, isGps) {
  const container = document.getElementById('coastalContentContainer');
  if (!container) return;

  const resident = intel.residentContext || {};
  const summary = intel.summary || {};
  const exposure = intel.residentExposure || {};
  const graph = intel.propagationGraph || { nodes: [], edges: [] };
  const query = intel.queryContext || {};
  const ranked = intel.rankedZones || [];

  const locName = resident.locality || resident.district || 'Resident Sector';
  const radius = query.radiusKm || _coastalRadiusKm;

  container.innerHTML = `
    <!-- ========================================================
         SECTION 1: LOCATION, MONITORING SCOPE & RADIUS CONTROLS
         ======================================================== -->
    <div class="glass-card elevated" style="padding:24px 28px; margin-bottom:24px; border:1px solid rgba(51,199,255,0.25); background:linear-gradient(135deg, rgba(6,11,24,0.7), rgba(13,22,38,0.7));">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px; margin-bottom:20px;">
        <div>
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
            <span class="story-tag" style="color:var(--cyber, #33c7ff); border-color:rgba(51,199,255,0.3); background:rgba(51,199,255,0.08);">
              DYNAMIC GEOSPATIAL INTELLIGENCE • ${radius} KM SURVEILLANCE
            </span>
            <span class="glass-badge" style="background:${isGps ? 'rgba(31,224,168,0.15)' : 'rgba(255,255,255,0.06)'}; color:${isGps ? 'var(--ocean)' : 'var(--text-secondary)'}; font-family:var(--font-mono); font-size:10.5px;">
              ${isGps ? '🛰️ DEVICE GPS ACCURATE' : '🏙️ MANUAL SECTOR'}
            </span>
          </div>

          <h2 style="font-family:var(--font-display); font-size:24px; font-weight:700; margin:0; color:var(--text-primary); display:flex; align-items:center; gap:8px;">
            <span>📍</span> ${escapeHtml(locName)}
            <span style="font-size:13px; font-weight:400; color:var(--text-muted); font-family:var(--font-mono);">(${resident.state || ''}, ${resident.country || ''})</span>
          </h2>

          <div style="font-size:12px; color:var(--text-muted); font-family:var(--font-mono); margin-top:4px;">
            Lat: ${lat.toFixed(4)}° • Lon: ${lon.toFixed(4)}° • Elevation: ${resident.elevationMsl || 12}m MSL • Ocean Distance: ${resident.distanceToCoastKm ? `${resident.distanceToCoastKm} km` : 'Coastal Buffer'}
          </div>
        </div>

        <!-- Radius Adjustment Slider & Presets -->
        <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.08); padding:12px 18px; border-radius:12px; min-width:280px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span style="font-size:11px; font-family:var(--font-mono); color:var(--text-muted); text-transform:uppercase;">
              Search Radius Boundary:
            </span>
            <strong id="coastalRadiusValLabel" style="font-family:var(--font-display); font-size:16px; color:var(--cyber, #33c7ff);">
              ${radius} km
            </strong>
          </div>

          <!-- Range Input Slider -->
          <input type="range" id="coastalRadiusSlider" min="50" max="1000" step="50" value="${radius}"
                 onchange="setCoastalRadius(this.value)"
                 style="width:100%; accent-color:var(--cyber, #33c7ff); cursor:pointer;" />

          <!-- Quick Presets -->
          <div style="display:flex; justify-content:space-between; gap:6px; margin-top:8px;">
            <button class="radius-preset-btn ${radius === 100 ? 'active' : ''}" data-radius="100" onclick="setCoastalRadius(100)" style="flex:1; padding:3px 6px; font-size:10.5px; border-radius:6px; border:1px solid ${radius === 100 ? 'var(--cyber)' : 'rgba(255,255,255,0.1)'}; background:${radius === 100 ? 'rgba(51,199,255,0.2)' : 'rgba(255,255,255,0.03)'}; color:${radius === 100 ? 'var(--cyber)' : 'var(--text-secondary)'}; cursor:pointer;">
              100km
            </button>
            <button class="radius-preset-btn ${radius === 250 ? 'active' : ''}" data-radius="250" onclick="setCoastalRadius(250)" style="flex:1; padding:3px 6px; font-size:10.5px; border-radius:6px; border:1px solid ${radius === 250 ? 'var(--cyber)' : 'rgba(255,255,255,0.1)'}; background:${radius === 250 ? 'rgba(51,199,255,0.2)' : 'rgba(255,255,255,0.03)'}; color:${radius === 250 ? 'var(--cyber)' : 'var(--text-secondary)'}; cursor:pointer;">
              250km
            </button>
            <button class="radius-preset-btn ${radius === 500 ? 'active' : ''}" data-radius="500" onclick="setCoastalRadius(500)" style="flex:1; padding:3px 6px; font-size:10.5px; border-radius:6px; border:1px solid ${radius === 500 ? 'var(--cyber)' : 'rgba(255,255,255,0.1)'}; background:${radius === 500 ? 'rgba(51,199,255,0.2)' : 'rgba(255,255,255,0.03)'}; color:${radius === 500 ? 'var(--cyber)' : 'var(--text-secondary)'}; cursor:pointer;">
              500km (Def)
            </button>
            <button class="radius-preset-btn ${radius === 1000 ? 'active' : ''}" data-radius="1000" onclick="setCoastalRadius(1000)" style="flex:1; padding:3px 6px; font-size:10.5px; border-radius:6px; border:1px solid ${radius === 1000 ? 'var(--cyber)' : 'rgba(255,255,255,0.1)'}; background:${radius === 1000 ? 'rgba(51,199,255,0.2)' : 'rgba(255,255,255,0.03)'}; color:${radius === 1000 ? 'var(--cyber)' : 'var(--text-secondary)'}; cursor:pointer;">
              1000km
            </button>
          </div>
        </div>
      </div>

      <!-- Scope Telemetry Summary Counters Ribbon -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px; border-top:1px solid rgba(255,255,255,0.07); padding-top:16px;">
        <div>
          <div style="font-size:10.5px; font-family:var(--font-mono); color:var(--text-muted); text-transform:uppercase;">Discovered Coastal Zones</div>
          <div style="font-size:20px; font-weight:700; color:var(--cyber, #33c7ff); margin-top:2px;">
            ${summary.totalDiscoveredZones || 0} Monitoring Zones
          </div>
          <div style="font-size:11px; color:var(--text-muted);">Dynamically queried within ${radius}km</div>
        </div>

        <div>
          <div style="font-size:10.5px; font-family:var(--font-mono); color:var(--text-muted); text-transform:uppercase;">Critical Threat Sectors</div>
          <div style="font-size:20px; font-weight:700; color:var(--red, #f43f5e); margin-top:2px;">
            ${summary.criticalThreatCount || 0} Critical (&gt;75%)
          </div>
          <div style="font-size:11px; color:var(--text-muted);">${summary.highThreatCount || 0} in High Hazard stage</div>
        </div>

        <div>
          <div style="font-size:10.5px; font-family:var(--font-mono); color:var(--text-muted); text-transform:uppercase;">Peak Regional Risk</div>
          <div style="font-size:20px; font-weight:700; color:${summary.peakRiskScore >= 75 ? 'var(--red)' : (summary.peakRiskScore >= 55 ? 'var(--amber)' : 'var(--ocean)')}; margin-top:2px;">
            ${summary.peakRiskScore ? summary.peakRiskScore.toFixed(1) : 0}% Risk
          </div>
          <div style="font-size:11px; color:var(--text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(summary.peakRiskZoneName || 'None')}</div>
        </div>

        <div>
          <div style="font-size:10.5px; font-family:var(--font-mono); color:var(--text-muted); text-transform:uppercase;">Data Freshness &amp; Sync</div>
          <div style="font-size:15px; font-weight:600; color:var(--text-primary); margin-top:4px;">
            ${new Date(intel.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div style="font-size:11px; color:var(--ocean);">● Live API Synchronized</div>
        </div>
      </div>
    </div>

    <!-- ========================================================
         SECTION 2: RESIDENT EXPOSURE & PROPAGATION IMPACT CARD
         ======================================================== -->
    <div class="glass-card elevated" style="padding:26px 28px; margin-bottom:28px; border-left:4px solid ${exposure.exposureColor || 'var(--ocean)'};">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px;">
        <div style="flex:1; min-width:300px;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
            <span style="font-size:18px;">🛡️</span>
            <span style="font-family:var(--font-mono); font-size:11px; font-weight:700; color:${exposure.exposureColor}; text-transform:uppercase; letter-spacing:0.5px;">
              RESIDENT EXPOSURE APPRAISAL • TIME-TO-IMPACT OUTLOOK
            </span>
          </div>

          <h3 style="font-size:20px; font-weight:700; color:var(--text-primary); margin:0 0 8px;">
            ${escapeHtml(exposure.exposureLevel || 'Normal Vigilance')}
          </h3>

          <p style="font-size:13.5px; color:var(--text-secondary); line-height:1.6; margin-bottom:16px;">
            ${escapeHtml(exposure.pathwayDescription || 'All monitored coastal sectors are operating within standard hydrometric thresholds.')}
          </p>

          <div style="display:flex; flex-direction:column; gap:8px;">
            ${(exposure.residentDirectives || []).map(d => `
              <div style="display:flex; align-items:flex-start; gap:8px; font-size:13px; color:var(--text-primary);">
                <span style="color:${exposure.exposureColor}; font-weight:700;">✓</span>
                <span>${escapeHtml(d)}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Arrival Time Window Gauge -->
        <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.08); padding:18px 22px; border-radius:12px; text-align:center; min-width:240px;">
          <div style="font-size:10.5px; font-family:var(--font-mono); color:var(--text-muted); text-transform:uppercase;">
            Estimated Travel Window
          </div>
          <div style="font-family:var(--font-display); font-size:20px; font-weight:800; color:${exposure.exposureColor}; margin:6px 0;">
            ${escapeHtml(exposure.estimatedTimeWindow || 'N/A')}
          </div>
          <div style="font-size:10.5px; color:var(--text-muted); font-family:var(--font-mono);">
            ${escapeHtml(exposure.modelProvenance || 'Saint-Venant 1D Hydro-Model')}
          </div>

          <div style="margin-top:14px;">
            <button class="glass-btn btn-primary" onclick="goTo('resident-simulation')" style="width:100%; justify-content:center; font-size:12px; gap:6px;">
              <span>🚨</span> Test Notification Simulation
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================================
         SECTION 3: DYNAMIC COASTAL MONITORING MAP & PROPAGATION RADAR
         ======================================================== -->
    <div id="coastalMapContainer" class="glass-card elevated" style="padding:22px 24px; margin-bottom:28px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:10px;">
        <div>
          <h3 style="font-size:17px; font-weight:700; margin:0; display:flex; align-items:center; gap:8px;">
            <span>🛰️</span> Dynamic Coastal Surveillance Radar &amp; Propagation Graph
          </h3>
          <p style="font-size:12.5px; color:var(--text-secondary); margin-top:2px;">
            Real-time GIS map displaying discovered coastal zones, the ${radius}km monitoring perimeter circle, and active hydrodynamic propagation lines.
          </p>
        </div>

        <div style="display:flex; gap:12px; font-size:11px; font-family:var(--font-mono); flex-wrap:wrap;">
          <span style="display:flex; align-items:center; gap:5px;"><span style="width:9px; height:9px; background:#33C7FF; border-radius:50%;"></span> Resident Base</span>
          <span style="display:flex; align-items:center; gap:5px;"><span style="width:9px; height:9px; background:#FF4D6A; border-radius:50%;"></span> Critical (&gt;75)</span>
          <span style="display:flex; align-items:center; gap:5px;"><span style="width:9px; height:9px; background:#FFB84D; border-radius:50%;"></span> High (55-75)</span>
          <span style="display:flex; align-items:center; gap:5px;"><span style="width:9px; height:9px; background:#1FE0A8; border-radius:50%;"></span> Normal (&lt;30)</span>
          <span style="display:flex; align-items:center; gap:5px;"><span style="width:14px; height:2px; background:#FF4D6A;"></span> Active Cascade</span>
        </div>
      </div>

      <!-- Map Canvas -->
      <div id="coastalMapCanvas" style="width:100%; height:440px; border-radius:10px; border:1px solid rgba(255,255,255,0.08); overflow:hidden; position:relative;">
        <div style="display:flex; align-items:center; justify-content:center; height:100%; color:var(--text-muted); font-size:13px;">
          Initializing High-Resolution GIS Radar...
        </div>
      </div>
    </div>

    <!-- ========================================================
         SECTION 4: HIGHEST-PRIORITY COASTAL MONITORING ZONES (LIVE-RANKED)
         ======================================================== -->
    <div style="margin-top:10px;">
      <!-- Section Header -->
      <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:18px; flex-wrap:wrap; gap:12px;">
        <div>
          <span class="story-tag" style="color:var(--ocean, #1fe0a8); border-color:rgba(31,224,168,0.3); background:rgba(31,224,168,0.08);">
            LIVE-RANKED COASTAL DIRECTORY
          </span>
          <h2 style="font-family:var(--font-display); font-size:22px; font-weight:700; margin:6px 0 2px;">
            Highest-Priority Coastal Monitoring Zones (${ranked.length})
          </h2>
          <p style="font-size:13px; color:var(--text-secondary);">
            Ranked by multi-factor physical hazard scores incorporating rainfall intensity, coastal swell, barometric anomalies, and terrain elevation.
          </p>
        </div>

        <div style="display:flex; align-items:center; gap:8px;">
          <span id="coastalRefreshIndicator" style="font-size:11.5px; font-family:var(--font-mono); color:var(--text-muted);">
            Auto-refresh active (5 min)
          </span>
          <button class="glass-btn btn-ghost" onclick="fetchAndRenderCoastalIntelligence()" style="gap:5px; font-size:12px; padding:6px 12px;">
            <span>🔄</span> Refresh Now
          </button>
        </div>
      </div>

      <!-- Filter Pills & Search Controls Bar -->
      <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:20px; flex-wrap:wrap; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); padding:10px 14px; border-radius:10px;">
        <!-- Filter Buttons -->
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          <button class="coastal-filter-btn ${_coastalActiveFilter === 'all' ? 'active' : ''}" data-filter="all" onclick="setCoastalFilter('all')" style="padding:5px 12px; font-size:11.5px; font-weight:${_coastalActiveFilter === 'all' ? '600' : '500'}; border-radius:20px; border:1px solid ${_coastalActiveFilter === 'all' ? 'var(--ocean)' : 'rgba(255,255,255,0.1)'}; background:${_coastalActiveFilter === 'all' ? 'rgba(31,224,168,0.2)' : 'rgba(255,255,255,0.03)'}; color:${_coastalActiveFilter === 'all' ? 'var(--ocean)' : 'var(--text-secondary)'}; cursor:pointer;">
            All Zones (${ranked.length})
          </button>
          <button class="coastal-filter-btn ${_coastalActiveFilter === 'critical' ? 'active' : ''}" data-filter="critical" onclick="setCoastalFilter('critical')" style="padding:5px 12px; font-size:11.5px; font-weight:${_coastalActiveFilter === 'critical' ? '600' : '500'}; border-radius:20px; border:1px solid ${_coastalActiveFilter === 'critical' ? 'var(--ocean)' : 'rgba(255,255,255,0.1)'}; background:${_coastalActiveFilter === 'critical' ? 'rgba(31,224,168,0.2)' : 'rgba(255,255,255,0.03)'}; color:${_coastalActiveFilter === 'critical' ? 'var(--ocean)' : 'var(--text-secondary)'}; cursor:pointer;">
            🔴 Critical (${summary.criticalThreatCount || 0})
          </button>
          <button class="coastal-filter-btn ${_coastalActiveFilter === 'high' ? 'active' : ''}" data-filter="high" onclick="setCoastalFilter('high')" style="padding:5px 12px; font-size:11.5px; font-weight:${_coastalActiveFilter === 'high' ? '600' : '500'}; border-radius:20px; border:1px solid ${_coastalActiveFilter === 'high' ? 'var(--ocean)' : 'rgba(255,255,255,0.1)'}; background:${_coastalActiveFilter === 'high' ? 'rgba(31,224,168,0.2)' : 'rgba(255,255,255,0.03)'}; color:${_coastalActiveFilter === 'high' ? 'var(--ocean)' : 'var(--text-secondary)'}; cursor:pointer;">
            🟡 High Risk (${summary.highThreatCount || 0})
          </button>
          <button class="coastal-filter-btn ${_coastalActiveFilter === 'elevated' ? 'active' : ''}" data-filter="elevated" onclick="setCoastalFilter('elevated')" style="padding:5px 12px; font-size:11.5px; font-weight:${_coastalActiveFilter === 'elevated' ? '600' : '500'}; border-radius:20px; border:1px solid ${_coastalActiveFilter === 'elevated' ? 'var(--ocean)' : 'rgba(255,255,255,0.1)'}; background:${_coastalActiveFilter === 'elevated' ? 'rgba(31,224,168,0.2)' : 'rgba(255,255,255,0.03)'}; color:${_coastalActiveFilter === 'elevated' ? 'var(--ocean)' : 'var(--text-secondary)'}; cursor:pointer;">
            🟠 Elevated Watch
          </button>
          <button class="coastal-filter-btn ${_coastalActiveFilter === 'normal' ? 'active' : ''}" data-filter="normal" onclick="setCoastalFilter('normal')" style="padding:5px 12px; font-size:11.5px; font-weight:${_coastalActiveFilter === 'normal' ? '600' : '500'}; border-radius:20px; border:1px solid ${_coastalActiveFilter === 'normal' ? 'var(--ocean)' : 'rgba(255,255,255,0.1)'}; background:${_coastalActiveFilter === 'normal' ? 'rgba(31,224,168,0.2)' : 'rgba(255,255,255,0.03)'}; color:${_coastalActiveFilter === 'normal' ? 'var(--ocean)' : 'var(--text-secondary)'}; cursor:pointer;">
            🟢 Normal Status
          </button>
        </div>

        <!-- Search & Sort Controls -->
        <div style="display:flex; gap:8px; align-items:center; flex-grow:1; justify-content:flex-end; min-width:240px;">
          <div style="position:relative; width:200px;">
            <span style="position:absolute; left:9px; top:50%; transform:translateY(-50%); color:var(--text-muted); font-size:11px;">🔍</span>
            <input type="text" id="coastalSearchInput" placeholder="Filter zone or river..." value="${escapeHtml(_coastalSearchText)}" oninput="filterCoastalCards()"
                   style="width:100%; padding:6px 8px 6px 28px; font-size:12px; border-radius:6px; border:1px solid rgba(255,255,255,0.1); background:rgba(0,0,0,0.3); color:var(--text-primary); outline:none;" />
          </div>

          <select id="coastalSortSelect" onchange="sortCoastalCards()" style="padding:6px 10px; font-size:11.5px; border-radius:6px; border:1px solid rgba(255,255,255,0.1); background:rgba(0,0,0,0.4); color:var(--text-primary); cursor:pointer; outline:none;">
            <option value="risk_desc" ${_coastalSortOrder === 'risk_desc' ? 'selected' : ''}>Sort: Highest Risk Score</option>
            <option value="risk_asc" ${_coastalSortOrder === 'risk_asc' ? 'selected' : ''}>Sort: Lowest Risk Score</option>
            <option value="dist_asc" ${_coastalSortOrder === 'dist_asc' ? 'selected' : ''}>Sort: Nearest Distance</option>
            <option value="dist_desc" ${_coastalSortOrder === 'dist_desc' ? 'selected' : ''}>Sort: Farthest Distance</option>
            <option value="elev_asc" ${_coastalSortOrder === 'elev_asc' ? 'selected' : ''}>Sort: Lowest Elevation</option>
            <option value="conf_desc" ${_coastalSortOrder === 'conf_desc' ? 'selected' : ''}>Sort: Highest Confidence</option>
            <option value="name_asc" ${_coastalSortOrder === 'name_asc' ? 'selected' : ''}>Sort: Name (A-Z)</option>
          </select>
        </div>
      </div>

      <!-- Ranked Cards Grid -->
      <div id="rankedCoastalCardsGrid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(340px, 1fr)); gap:18px; margin-bottom:32px;">
        <!-- Injected via renderRankedCoastalCards() -->
      </div>
    </div>
  `;

  // Render the ranked cards
  renderRankedCoastalCards();

  // Initialize or update the interactive Leaflet map after DOM paints
  setTimeout(() => {
    initOrUpdateCoastalMap(lat, lon, radius, ranked, graph);
  }, 50);
}

/**
 * Main View Entry Point: Screen 01 — Resident Location & Flood Risk Overview
 */
async function renderResidentRisk(root) {
  root = root || document.getElementById('pageRoot');
  if (!root) return;

  root.innerHTML = `
    <div class="saas-page-container">
      <!-- Main Content Root Container -->
      <div id="coastalContentContainer">
        <div class="glass-card" style="padding:48px; text-align:center;">
          <span class="spin-anim" style="font-size:24px; color:var(--cyber, #33c7ff);">⚡</span>
          <div style="font-size:14px; font-weight:600; color:var(--text-primary); margin-top:12px;">
            Initializing Dynamic Global Coastal Flood Intelligence Engine...
          </div>
          <div style="font-size:12.5px; color:var(--text-muted); margin-top:4px;">
            Querying geospatial coastal topology, OpenWeatherMap telemetry, and Copernicus elevation models...
          </div>
        </div>
      </div>
    </div>
  `;

  // Clear any existing background timers and listeners
  if (_coastalRefreshTimer) {
    clearInterval(_coastalRefreshTimer);
    _coastalRefreshTimer = null;
  }
  if (typeof _riskUnsubscribeLocation === 'function') {
    _riskUnsubscribeLocation();
    _riskUnsubscribeLocation = null;
  }

  // Reactive listener: automatically recalculate & re-render when location updates
  if (typeof AppEvents !== 'undefined') {
    _riskUnsubscribeLocation = AppEvents.on(AppEvents.EVENTS.LOCATION_CHANGED, () => {
      const activeContainer = document.getElementById('coastalContentContainer');
      if (activeContainer && typeof state !== 'undefined' && state.page === 'resident-risk') {
        fetchAndRenderCoastalIntelligence();
      }
    });
  }

  // Execute intelligence retrieval
  await fetchAndRenderCoastalIntelligence();

  // Set up controlled 5-minute background auto-refresh
  _coastalRefreshTimer = setInterval(() => {
    fetchAndRenderCoastalIntelligence();
  }, 5 * 60 * 1000);
}

// Cleanup timer and listener when navigating away or unloading
window.addEventListener('beforeunload', () => {
  if (_coastalRefreshTimer) clearInterval(_coastalRefreshTimer);
  if (typeof _riskUnsubscribeLocation === 'function') _riskUnsubscribeLocation();
});
