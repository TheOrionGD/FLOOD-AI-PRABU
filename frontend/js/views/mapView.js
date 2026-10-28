/**
 * FLOODAI — Geospatial Threat Intelligence Map View
 * Leaflet map, GeoJSON district boundaries, inundation contours, live weather radar, and GPS proximity radius.
 */

let leafletMap = null;
let districtGeoJsonLayer = null;
let radarTileLayer = null;
let inundationLayerGroup = null;
let userRadiusCircle = null;
let userMarker = null;
let currentBasemapLayer = null;
let baseMapLayers = {};
let mapLayersState = {
  boundaries: true,
  inundation: true,
  radar: false,
  inundationOpacity: 0.65,
  activeBasemap: 'dark',
};

async function renderMap(root) {
  root = root || document.getElementById('pageRoot');
  if (!root) return;

  root.innerHTML = `
    <div class="eyebrow">GIS · GeoJSON District Boundaries · Live Weather Radar · Digital Elevation Models</div>
    <h1 class="page-title">Geospatial Threat Intelligence Map</h1>
    <p class="page-sub">Interactive geospatial intelligence with authoritative district polygon boundaries, inundation depth models, and live precipitation radar overlays.</p>

    <!-- Data Freshness & Status Bar -->
    <div style="margin-bottom:14px;">
      ${renderDataFreshnessBar({ label: 'GIS Boundaries &amp; Hydrological Radar', timestamp: Date.now(), onRefresh: 'refreshMapLayers()' })}
    </div>

    <div class="map-layout">
      <!-- Main Leaflet Map Container with Loading Overlay -->
      <div id="map" class="glass" style="position:relative; overflow:hidden;">
        <div id="mapLoadingOverlay" style="position:absolute; inset:0; z-index:1000; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; background:rgba(6,11,24,0.85); backdrop-filter:blur(6px); border-radius:14px; transition:opacity 0.4s ease;">
          <span class="spinner" style="width:28px; height:28px; border-width:3px;"></span>
          <span style="font-family:var(--font-mono); font-size:12px; color:var(--cyber);">Initializing Tactical GIS Map &amp; GeoJSON Layers...</span>
        </div>
      </div>

      <!-- Control Sidebar -->
      <div class="glass map-legend card-glow">
        <div>
          <div style="font-family:var(--font-display); font-weight:700; margin-bottom:12px; font-size:16px;">Map Layer Controls</div>

          <!-- District Boundaries Toggle -->
          <div class="layer-toggle-btn ${mapLayersState.boundaries ? 'active' : ''}" onclick="toggleMapLayer('boundaries')">
            <span>District Boundaries (GeoJSON)</span>
            <span style="font-family:var(--font-mono); font-size:11px;">${mapLayersState.boundaries ? 'ON' : 'OFF'}</span>
          </div>

          <!-- Inundation Layer Toggle -->
          <div class="layer-toggle-btn ${mapLayersState.inundation ? 'active' : ''}" onclick="toggleMapLayer('inundation')">
            <span>Inundation Topo-Layer</span>
            <span style="font-family:var(--font-mono); font-size:11px;">${mapLayersState.inundation ? 'ON' : 'OFF'}</span>
          </div>
          <div style="margin-bottom:12px; padding:0 4px;">
            <label style="font-size:11px; color:var(--text-2); display:flex; justify-content:space-between;">
              Inundation Opacity <span id="val_opacity">${Math.round(mapLayersState.inundationOpacity * 100)}%</span>
            </label>
            <input type="range" class="layer-slider" min="0.1" max="1.0" step="0.05" value="${mapLayersState.inundationOpacity}" oninput="updateInundationOpacity(this.value)">
          </div>

          <!-- Live Precipitation Radar Toggle (OpenWeather & RainViewer) -->
          <div class="layer-toggle-btn ${mapLayersState.radar ? 'active' : ''}" onclick="toggleMapLayer('radar')">
            <span>Live Precipitation Radar</span>
            <span style="font-family:var(--font-mono); font-size:11px;">${mapLayersState.radar ? 'LIVE' : 'OFF'}</span>
          </div>

          <!-- Basemap Style Selector -->
          <div style="font-size:11px; color:var(--text-2); margin-top:14px; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.8px;">Basemap Style</div>
          <div id="basemapBtns" style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:6px; margin-bottom:14px;">
            <button data-style="dark" class="btn btn-sm ${mapLayersState.activeBasemap === 'dark' ? 'btn-primary' : 'btn-ghost'}" style="font-size:10px; padding:4px 6px; justify-content:center;" onclick="switchBasemap('dark')">🌙 Dark</button>
            <button data-style="satellite" class="btn btn-sm ${mapLayersState.activeBasemap === 'satellite' ? 'btn-primary' : 'btn-ghost'}" style="font-size:10px; padding:4px 6px; justify-content:center;" onclick="switchBasemap('satellite')">🛰️ Satellite</button>
            <button data-style="street" class="btn btn-sm ${mapLayersState.activeBasemap === 'street' ? 'btn-primary' : 'btn-ghost'}" style="font-size:10px; padding:4px 6px; justify-content:center;" onclick="switchBasemap('street')">🗺️ Street</button>
          </div>
        </div>

        <hr style="border-color:var(--panel-border);">

        <!-- GPS Location & Perimeter Section -->
        <div>
          <div style="font-family:var(--font-display); font-weight:700; font-size:14px; margin-bottom:8px;">User Proximity Perimeter</div>
          <button class="btn btn-sm btn-ghost" style="width:100%; justify-content:center; font-size:12px;" onclick="detectUserLocation()">
            ${iconPin()} Scan My Location &amp; Proximity
          </button>
          <div id="userProximityInfo" style="margin-top:10px; font-size:12px; color:var(--text-1); line-height:1.5;"></div>
        </div>

        <hr style="border-color:var(--panel-border);">

        <!-- Legend -->
        <div>
          <div style="font-family:var(--font-display); font-weight:700; margin-bottom:10px; font-size:14px;">Risk Level Legend</div>
          <div class="leg-item"><span class="leg-dot" style="background:#1FE0A8"></span> Low Risk (&lt; 30%)</div>
          <div class="leg-item"><span class="leg-dot" style="background:#FFD166"></span> Medium Risk (30–55%)</div>
          <div class="leg-item"><span class="leg-dot" style="background:#FFB84D"></span> High Risk (55–75%)</div>
          <div class="leg-item"><span class="leg-dot" style="background:#FF4D6A"></span> Very High Emergency (&gt; 75%)</div>
        </div>
      </div>
    </div>

    <!-- Live Climatic & Geospatial Intelligence Container (Directive 1) -->
    <div id="climaticIntelligenceContainer" class="glass border-lightning container-glow" style="margin-top:24px; padding:28px; border-radius:20px; border:1px solid var(--panel-border); background:radial-gradient(ellipse at 50% 0%, rgba(14,28,54,0.92), rgba(6,11,24,0.98)); transition:all 0.3s ease;">
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding:44px 20px; gap:14px; text-align:center;">
        <span class="spinner" style="width:30px; height:30px; border-width:3px;"></span>
        <div style="font-family:var(--font-display); font-size:15px; font-weight:700; color:var(--text-0);">
          Initializing OpenStreetMap &amp; Weather Telemetry Stream...
        </div>
      </div>
    </div>
  `;

  setTimeout(initLeafletMap, 100);
}

function switchBasemap(styleName) {
  if (!leafletMap || !baseMapLayers[styleName]) return;
  if (currentBasemapLayer) {
    leafletMap.removeLayer(currentBasemapLayer);
  }
  mapLayersState.activeBasemap = styleName;
  currentBasemapLayer = baseMapLayers[styleName];
  currentBasemapLayer.addTo(leafletMap);
  if (currentBasemapLayer.bringToBack) {
    currentBasemapLayer.bringToBack();
  }
  const btnsContainer = document.getElementById('basemapBtns');
  if (btnsContainer) {
    btnsContainer.querySelectorAll('button').forEach(b => {
      if (b.dataset.style === styleName) {
        b.className = 'btn btn-sm btn-primary';
      } else {
        b.className = 'btn btn-sm btn-ghost';
      }
    });
  }
  toast(`Switched basemap to ${styleName.toUpperCase()}`);
}

async function refreshMapLayers() {
  toast('Synchronizing GeoJSON boundaries & radar tiles...');
  try {
    const geoData = await api('/geospatial/districts', 'GET', null, false);
    if (districtGeoJsonLayer && leafletMap) {
      leafletMap.removeLayer(districtGeoJsonLayer);
    }
    renderDistrictBoundaries(geoData);
    if (mapLayersState.radar) {
      mountRadarLayer();
    }
    toast('✅ Map layers synchronized with live geospatial server.');
  } catch (e) {
    toast(`Layer sync notice: ${e.message}`);
  }
}

async function initLeafletMap() {
  if (typeof L === 'undefined') {
    const el = document.getElementById('map');
    if (el) el.innerHTML = '<div style="padding:40px; text-align:center;">Leaflet library loading...</div>';
    return;
  }

  if (leafletMap) {
    leafletMap.remove();
    leafletMap = null;
  }

  leafletMap = L.map('map', { scrollWheelZoom: false, zoomControl: true }).setView([20.5, 79.5], 5);

  const darkBasemap = L.layerGroup([
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
      maxZoom: 16,
    }),
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 16,
      zIndex: 5,
      opacity: 0.85,
    }),
  ]);

  const streetBasemap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 18,
  });

  const satelliteBasemap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: '&copy; Esri, Maxar, Earthstar Geographics',
    maxZoom: 18,
  });

  baseMapLayers = {
    dark: darkBasemap,
    street: streetBasemap,
    satellite: satelliteBasemap,
  };

  const activeStyle = mapLayersState.activeBasemap || 'dark';
  currentBasemapLayer = baseMapLayers[activeStyle] || darkBasemap;
  currentBasemapLayer.addTo(leafletMap);

  inundationLayerGroup = L.layerGroup().addTo(leafletMap);

  try {
    const geoData = await api('/geospatial/districts', 'GET', null, false);
    renderDistrictBoundaries(geoData);
  } catch (e) {
    console.warn('[Map] Could not fetch GeoJSON boundaries from backend, using centroids:', e.message);
    renderDistrictCentroidMarkers();
  }

  loadInundationLayers();

  if (mapLayersState.radar) {
    mountRadarLayer();
  }

  const activeLat = state.userLocation?.lat || 10.874;
  const activeLon = state.userLocation?.lon || 78.727;

  if (state.userLocation) {
    plotUserLocationOnMap(state.userLocation.lat, state.userLocation.lon);
  } else {
    loadClimaticIntelligence(activeLat, activeLon);
  }

  const ov = document.getElementById('mapLoadingOverlay');
  if (ov) {
    ov.style.opacity = '0';
    setTimeout(() => { if (ov) ov.remove(); }, 400);
  }
}

function renderDistrictBoundaries(geoData) {
  if (!leafletMap || !geoData) return;

  districtGeoJsonLayer = L.geoJSON(geoData, {
    style: (feature) => {
      const dName = feature.properties.district;
      const dInfo = DISTRICTS.find(x => x.district.toLowerCase() === dName.toLowerCase());
      const risk = dInfo ? dInfo.avg_risk : 35;
      const col = riskColor(risk);
      return {
        fillColor: col,
        weight: 2,
        opacity: 0.9,
        color: col,
        dashArray: '3',
        fillOpacity: mapLayersState.boundaries ? 0.35 : 0.0,
      };
    },
    onEachFeature: (feature, layer) => {
      const p = feature.properties;
      const dInfo = DISTRICTS.find(x => x.district.toLowerCase() === p.district.toLowerCase());
      const risk = dInfo ? dInfo.avg_risk : 35;
      const col = riskColor(risk);

      layer.bindTooltip(`<b>${p.district}</b> (${riskLabel(risk)}: ${risk.toFixed(1)}%)`, {
        permanent: false,
        direction: 'center',
        className: 'dist-label',
      });

      const sheltersHtml = (p.shelters || []).map(s => `
        <div style="font-size:11px; margin-top:4px;">
          🏠 <b>${escapeHtml(s.name)}</b> (Capacity: ${s.capacity})
        </div>
      `).join('');

      layer.bindPopup(`
        <div style="font-family:Inter, sans-serif; min-width:210px; color:#0B1526;">
          <h4 style="font-family:'Space Grotesk',sans-serif; margin-bottom:4px; font-size:15px;">${p.district}, ${p.state}</h4>
          <div style="font-size:12.5px; line-height:1.6;">
            Modeled Flood Risk: <b style="color:${col};">${risk.toFixed(1)}% (${riskLabel(risk)})</b><br/>
            Elevation: <b>${p.elevation_m} m</b> · Coastal: <b>${p.coastal ? 'Yes' : 'No'}</b><br/>
            Drainage Score: <b>${p.drainage_quality}/100</b><br/>
            Pop. Density: <b>${p.population_density}/km²</b>
          </div>
          <div style="margin-top:8px; border-top:1px solid #ccc; padding-top:6px;">
            <b style="font-size:11.5px; color:#333;">Emergency Relief Shelters:</b>
            ${sheltersHtml || '<div style="font-size:11px;">Central Municipal Shelter Available</div>'}
          </div>
          <button onclick="assessDistrictFromMap('${p.district}')" class="btn btn-sm btn-primary" style="width:100%; margin-top:10px; font-size:11px; justify-content:center;">
            ⚡ Run Threat Assessment
          </button>
        </div>
      `);

      layer.on({
        mouseover: (e) => {
          const l = e.target;
          l.setStyle({ weight: 4, fillOpacity: 0.65, dashArray: '' });
          if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            l.bringToFront();
          }
        },
        mouseout: (e) => {
          if (districtGeoJsonLayer) districtGeoJsonLayer.resetStyle(e.target);
        },
      });
    },
  }).addTo(leafletMap);

  if (districtGeoJsonLayer.getBounds().isValid()) {
    leafletMap.fitBounds(districtGeoJsonLayer.getBounds(), { padding: [30, 30] });
  }
}

function renderDistrictCentroidMarkers() {
  if (!leafletMap) return;
  DISTRICTS.forEach(d => {
    const col = riskColor(d.avg_risk);
    const radius = 10 + (d.avg_risk / 100) * 16;
    const marker = L.circleMarker([d.latitude, d.longitude], {
      radius, color: col, fillColor: col, fillOpacity: 0.45, weight: 2
    }).addTo(leafletMap);
    marker.bindTooltip(d.district, { permanent: true, direction: 'right', className: 'dist-label' });
  });
}

async function loadInundationLayers() {
  if (!inundationLayerGroup) return;
  inundationLayerGroup.clearLayers();

  try {
    const inunData = await api('/geospatial/inundation-layers', 'GET', null, false);
    (inunData.zones || []).forEach(z => {
      const isHigh = z.inundation_severity === 'High';
      const col = isHigh ? '#FF4D6A' : '#33C7FF';
      const circle = L.circle(z.centroid, {
        radius: isHigh ? 14000 : 8000,
        color: col,
        fillColor: col,
        fillOpacity: mapLayersState.inundation ? mapLayersState.inundationOpacity : 0.0,
        weight: 1,
      });
      circle.bindTooltip(`🌊 Inundation Contour: ${z.district} (Est. Depth: ${z.estimated_depth_m}m)`, { sticky: true });
      inundationLayerGroup.addLayer(circle);
    });
  } catch (e) {
    console.warn('[Map] Inundation layers load notice:', e.message);
  }
}

function updateInundationOpacity(val) {
  mapLayersState.inundationOpacity = parseFloat(val);
  const tag = document.getElementById('val_opacity');
  if (tag) tag.textContent = `${Math.round(mapLayersState.inundationOpacity * 100)}%`;
  if (inundationLayerGroup) {
    inundationLayerGroup.eachLayer(l => {
      if (l.setStyle) {
        l.setStyle({ fillOpacity: mapLayersState.inundation ? mapLayersState.inundationOpacity : 0 });
      }
    });
  }
}

async function toggleMapLayer(layerName) {
  mapLayersState[layerName] = !mapLayersState[layerName];

  if (layerName === 'boundaries' && districtGeoJsonLayer) {
    districtGeoJsonLayer.setStyle({
      fillOpacity: mapLayersState.boundaries ? 0.35 : 0.0,
      opacity: mapLayersState.boundaries ? 0.9 : 0.0,
    });
  }

  if (layerName === 'inundation') {
    updateInundationOpacity(mapLayersState.inundationOpacity);
  }

  if (layerName === 'radar') {
    if (mapLayersState.radar) {
      await mountRadarLayer();
    } else {
      if (radarTileLayer && leafletMap) {
        leafletMap.removeLayer(radarTileLayer);
        radarTileLayer = null;
      }
    }
  }

  renderMap();
}

async function mountRadarLayer() {
  toast('Loading live precipitation radar (OpenWeather & RainViewer)...');
  try {
    const radarMeta = await api('/geospatial/radar-source', 'GET', null, false);
    const tileTemplate = radarMeta.openweather_tile_template || radarMeta.tile_url_template || 'https://tile.rainviewer.com/v2/radar/nowcast/256/{z}/{x}/{y}/2/1_1.png';
    if (radarTileLayer && leafletMap) leafletMap.removeLayer(radarTileLayer);
    radarTileLayer = L.tileLayer(tileTemplate, {
      opacity: 0.65,
      zIndex: 10,
      attribution: radarMeta.attribution,
    }).addTo(leafletMap);
    toast('🛰️ Live OpenWeather precipitation radar active');
  } catch (e) {
    toast('Radar layer service temporarily unavailable');
  }
}

async function assessDistrictFromMap(districtName) {
  predictInputs.district = districtName;
  goTo('predict');
  executePrediction(true);
}

function plotUserLocationOnMap(lat, lon) {
  if (!leafletMap) return;

  if (userRadiusCircle) {
    leafletMap.removeLayer(userRadiusCircle);
  }
  if (userMarker) {
    leafletMap.removeLayer(userMarker);
  }

  const radiusKm = state.user?.preferences?.alertRadiusKm || 50;

  userRadiusCircle = L.circle([lat, lon], {
    radius: radiusKm * 1000,
    color: '#33C7FF',
    fillColor: '#33C7FF',
    fillOpacity: 0.12,
    weight: 2,
    dashArray: '4',
  }).addTo(leafletMap);

  userMarker = L.circleMarker([lat, lon], {
    radius: 9,
    color: '#FFFFFF',
    fillColor: '#33C7FF',
    fillOpacity: 1,
    weight: 3,
  }).addTo(leafletMap);

  userMarker.bindPopup(`<b>Your Detected Position</b><br/>Alert Radius: ${radiusKm} km`).openPopup();
  leafletMap.setView([lat, lon], 7);

  // Synchronize climatic & geospatial intelligence stream below the map
  loadClimaticIntelligence(lat, lon);
}

/**
 * Directive 1: Hyper-Local Climatic & Geospatial Intelligence Service
 * Ingests OpenStreetMap reverse-geocoded cadastral hierarchy and OpenWeather/Open-Meteo telemetry
 */
async function loadClimaticIntelligence(lat, lon) {
  const container = document.getElementById('climaticIntelligenceContainer');
  if (!container) return;

  if (lat === undefined || lon === undefined) {
    lat = state.userLocation?.lat || 10.874;
    lon = state.userLocation?.lon || 78.727;
  }

  container.innerHTML = `
    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding:44px 20px; gap:14px; text-align:center;">
      <span class="spinner" style="width:32px; height:32px; border-width:3px;"></span>
      <div>
        <div style="font-family:var(--font-display); font-size:16px; font-weight:700; color:var(--text-0); margin-bottom:4px;">
          Synchronizing OpenStreetMap &amp; Weather Telemetry Stream...
        </div>
        <div style="font-family:var(--font-mono); font-size:12px; color:var(--cyber);">
          Querying Nominatim GIS Reverse-Geocoding · OpenWeather Sensors · Catchment Risk (${Number(lat).toFixed(4)}° N, ${Number(lon).toFixed(4)}° E)
        </div>
      </div>
    </div>
  `;

  try {
    const data = await api(`/geospatial/climatic-intelligence?lat=${lat}&lon=${lon}`, 'GET', null, false);
    renderClimaticIntelligenceContent(container, data, lat, lon);
  } catch (err) {
    console.error('[Map:ClimaticIntel] Ingestion error:', err);
    container.innerHTML = `
      <div style="padding:28px; text-align:center;">
        <div style="font-size:26px; margin-bottom:8px;">⚠️</div>
        <div style="font-weight:700; color:var(--text-0); margin-bottom:6px;">Climatic Telemetry Stream Notice</div>
        <div style="font-size:12.5px; color:var(--text-2); margin-bottom:16px; max-width:500px; margin-left:auto; margin-right:auto;">
          ${escapeHtml(err.message || 'Unable to synchronize telemetry sensors. Please verify network connectivity.')}
        </div>
        <button class="btn btn-sm btn-primary" onclick="loadClimaticIntelligence(${lat}, ${lon})">
          🔄 Retry Synchronization
        </button>
      </div>
    `;
  }
}

function renderClimaticIntelligenceContent(container, data, lat, lon) {
  const osm = data.openstreetmap || {};
  const w = data.weather || {};
  const hydro = data.hydrology || {};
  const threat = data.catchment_threat || {};

  container.innerHTML = `
    <!-- Top Header & Actions -->
    <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px; margin-bottom:20px; padding-bottom:16px; border-bottom:1px solid var(--panel-border);">
      <div>
        <div style="display:inline-flex; align-items:center; gap:8px; margin-bottom:8px; font-family:var(--font-mono); font-size:11px; text-transform:uppercase; letter-spacing:0.8px; color:var(--cyber); background:rgba(51,199,255,0.08); padding:4px 10px; border-radius:20px; border:1px solid rgba(51,199,255,0.25);">
          <span style="width:7px; height:7px; border-radius:50%; background:#1FE0A8; box-shadow:0 0 8px #1FE0A8;"></span>
          LIVE STREAM · OPENSTREETMAP &amp; OPENWEATHER TELEMETRY
        </div>
        <h2 style="font-family:var(--font-display); font-size:22px; font-weight:700; color:var(--text-0); margin-bottom:4px;">
          Hyper-Local Climatic &amp; Geospatial Intelligence
        </h2>
        <p style="font-size:13px; color:var(--text-2); margin:0;">
          Authoritative OpenStreetMap cadastral boundaries, live precipitation radar telemetry, and catchment hydrological flood risk.
        </p>
      </div>

      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <button class="btn btn-sm btn-ghost" onclick="detectUserLocation()" style="font-size:11.5px; padding:6px 12px;" title="Scan GPS Coordinates">
          ${iconPin()} Scan GPS Location
        </button>
        <button class="btn btn-sm btn-ghost" onclick="loadClimaticIntelligence(${lat}, ${lon})" style="font-size:11.5px; padding:6px 12px;" title="Refresh Telemetry">
          🔄 Refresh Telemetry
        </button>
        <button class="btn btn-sm btn-primary" onclick="assessDistrictFromMap('${threat.nearest_monitored_basin || 'Chennai'}')" style="font-size:11.5px; padding:6px 14px;" title="Run Predictive Model">
          ⚡ Threat Assessment
        </button>
      </div>
    </div>

    <!-- Resolved Locality & Geospatial Badge Strip -->
    <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; background:rgba(255,255,255,0.02); border:1px solid var(--panel-border); border-radius:12px; padding:12px 16px; margin-bottom:20px;">
      <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
        <span style="font-size:18px;">🗺️</span>
        <div>
          <span style="font-size:11px; text-transform:uppercase; letter-spacing:0.6px; color:var(--text-2); font-family:var(--font-mono);">OpenStreetMap Geo-Resolved Locality:</span>
          <div style="font-size:13.5px; font-weight:600; color:var(--text-0);">
            ${escapeHtml(osm.display_name || `${osm.locality || 'Regional Sector'}, ${osm.district || ''}`)}
          </div>
        </div>
      </div>

      <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; font-family:var(--font-mono); font-size:11.5px;">
        <span style="padding:4px 8px; border-radius:6px; background:rgba(51,199,255,0.1); border:1px solid rgba(51,199,255,0.25); color:var(--cyber);">
          📍 ${Number(lat).toFixed(4)}° N, ${Number(lon).toFixed(4)}° E
        </span>
        <span style="padding:4px 8px; border-radius:6px; background:rgba(255,255,255,0.05); border:1px solid var(--panel-border); color:var(--text-1);">
          Postcode: <b>${escapeHtml(osm.postcode || 'N/A')}</b>
        </span>
      </div>
    </div>

    <!-- 6-Metric Liquid Glass Sensor Cards Grid -->
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(210px, 1fr)); gap:14px; margin-bottom:22px;">
      
      <!-- Card 1: Precipitation Rate -->
      <div class="glass" style="padding:16px; border-radius:14px; border:1px solid var(--panel-border); background:rgba(255,255,255,0.02);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span style="font-size:11px; color:var(--text-2); text-transform:uppercase; font-family:var(--font-mono);">Precipitation Rate</span>
          <span style="font-size:16px;">🌧️</span>
        </div>
        <div style="font-size:24px; font-weight:700; color:var(--text-0); font-family:var(--font-display); margin-bottom:4px;">
          ${Number(w.rainfall_rate_mm_h || 0).toFixed(1)} <span style="font-size:13px; font-weight:400; color:var(--text-2);">mm/h</span>
        </div>
        <div style="font-size:11.5px; color:var(--text-1); display:flex; justify-content:space-between;">
          <span>Precipitation Prob:</span>
          <span style="color:var(--cyber); font-weight:600;">${hydro.precipitation_probability_pct || 0}%</span>
        </div>
      </div>

      <!-- Card 2: Surface Temperature -->
      <div class="glass" style="padding:16px; border-radius:14px; border:1px solid var(--panel-border); background:rgba(255,255,255,0.02);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span style="font-size:11px; color:var(--text-2); text-transform:uppercase; font-family:var(--font-mono);">Surface Temp &amp; Heat</span>
          <span style="font-size:16px;">🌡️</span>
        </div>
        <div style="font-size:24px; font-weight:700; color:var(--text-0); font-family:var(--font-display); margin-bottom:4px;">
          ${Number(w.temperature_c || 0).toFixed(1)} <span style="font-size:13px; font-weight:400; color:var(--text-2);">°C</span>
        </div>
        <div style="font-size:11.5px; color:var(--text-1); display:flex; justify-content:space-between;">
          <span>Feels Like:</span>
          <span style="color:var(--ocean); font-weight:600;">${Number(w.feels_like_c || 0).toFixed(1)}°C</span>
        </div>
      </div>

      <!-- Card 3: Relative Humidity -->
      <div class="glass" style="padding:16px; border-radius:14px; border:1px solid var(--panel-border); background:rgba(255,255,255,0.02);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span style="font-size:11px; color:var(--text-2); text-transform:uppercase; font-family:var(--font-mono);">Humidity &amp; Soil</span>
          <span style="font-size:16px;">💧</span>
        </div>
        <div style="font-size:24px; font-weight:700; color:var(--text-0); font-family:var(--font-display); margin-bottom:4px;">
          ${w.humidity_pct || 0} <span style="font-size:13px; font-weight:400; color:var(--text-2);">%</span>
        </div>
        <div style="font-size:11.5px; color:var(--text-1); display:flex; justify-content:space-between;">
          <span>Topsoil Moisture:</span>
          <span style="color:#1FE0A8; font-weight:600;">${hydro.soil_saturation_pct || 0}%</span>
        </div>
      </div>

      <!-- Card 4: Barometric Pressure -->
      <div class="glass" style="padding:16px; border-radius:14px; border:1px solid var(--panel-border); background:rgba(255,255,255,0.02);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span style="font-size:11px; color:var(--text-2); text-transform:uppercase; font-family:var(--font-mono);">Surface Pressure</span>
          <span style="font-size:16px;">⏱️</span>
        </div>
        <div style="font-size:24px; font-weight:700; color:var(--text-0); font-family:var(--font-display); margin-bottom:4px;">
          ${w.surface_pressure_hpa || 1010} <span style="font-size:13px; font-weight:400; color:var(--text-2);">hPa</span>
        </div>
        <div style="font-size:11.5px; color:var(--text-1); display:flex; justify-content:space-between;">
          <span>Elevation DEM:</span>
          <span style="color:var(--text-0); font-weight:600;">${hydro.elevation_m || 24}m</span>
        </div>
      </div>

      <!-- Card 5: Wind Vector -->
      <div class="glass" style="padding:16px; border-radius:14px; border:1px solid var(--panel-border); background:rgba(255,255,255,0.02);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span style="font-size:11px; color:var(--text-2); text-transform:uppercase; font-family:var(--font-mono);">Wind Velocity</span>
          <span style="font-size:16px;">💨</span>
        </div>
        <div style="font-size:24px; font-weight:700; color:var(--text-0); font-family:var(--font-display); margin-bottom:4px;">
          ${Number(w.wind_speed_kmh || 0).toFixed(1)} <span style="font-size:13px; font-weight:400; color:var(--text-2);">km/h</span>
        </div>
        <div style="font-size:11.5px; color:var(--text-1); display:flex; justify-content:space-between;">
          <span>Cardinal Vector:</span>
          <span style="color:var(--cyber); font-weight:600;">${escapeHtml(w.wind_cardinal || 'SW')} (${w.wind_bearing_deg || 0}°)</span>
        </div>
      </div>

      <!-- Card 6: Flood Risk -->
      <div class="glass" style="padding:16px; border-radius:14px; border:1px solid ${threat.risk_color || '#1FE0A8'}40; background:rgba(255,255,255,0.02);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span style="font-size:11px; color:var(--text-2); text-transform:uppercase; font-family:var(--font-mono);">Catchment Flood Risk</span>
          <span style="font-size:16px;">🛡️</span>
        </div>
        <div style="font-size:24px; font-weight:700; color:${threat.risk_color || '#1FE0A8'}; font-family:var(--font-display); margin-bottom:4px;">
          ${threat.flood_probability_pct || 0}% <span style="font-size:12px; font-weight:600; padding:2px 6px; border-radius:4px; background:${threat.risk_color || '#1FE0A8'}25;">${escapeHtml(threat.risk_level || 'Low Risk')}</span>
        </div>
        <div style="font-size:11.5px; color:var(--text-1); display:flex; justify-content:space-between;">
          <span>Nearest Basin:</span>
          <span style="color:var(--text-0); font-weight:600;">${escapeHtml(threat.nearest_monitored_basin || '')} (${threat.distance_to_basin_km || 0} km)</span>
        </div>
      </div>

    </div>

    <!-- Detailed 2-Column Cadastral & Advisory Row -->
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:16px;">
      
      <!-- OpenStreetMap Detailed Cadastral Hierarchy -->
      <div class="glass" style="padding:18px; border-radius:14px; border:1px solid var(--panel-border); background:rgba(255,255,255,0.02);">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
          <span style="color:var(--cyber); font-size:16px;">🌐</span>
          <h4 style="font-family:var(--font-display); font-size:14px; font-weight:700; color:var(--text-0); margin:0;">
            OpenStreetMap Cadastral Topology
          </h4>
        </div>
        <div style="font-size:12px; line-height:1.8; color:var(--text-1);">
          <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.04); padding:4px 0;">
            <span style="color:var(--text-2);">Locality / Hamlet:</span>
            <span style="font-weight:600; color:var(--text-0);">${escapeHtml(osm.locality || 'Keeramangalam')}</span>
          </div>
          <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.04); padding:4px 0;">
            <span style="color:var(--text-2);">Administrative District:</span>
            <span style="font-weight:600; color:var(--text-0);">${escapeHtml(osm.district || 'Tiruchirappalli')}</span>
          </div>
          <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.04); padding:4px 0;">
            <span style="color:var(--text-2);">State &amp; Country:</span>
            <span style="font-weight:600; color:var(--text-0);">${escapeHtml(osm.state || 'Tamil Nadu')}, ${escapeHtml(osm.country || 'India')}</span>
          </div>
          <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.04); padding:4px 0;">
            <span style="color:var(--text-2);">OSM Node / Feature:</span>
            <span style="font-family:var(--font-mono); color:var(--cyber);">${osm.osm_id ? `#${osm.osm_id} (${osm.osm_type || 'node'})` : 'Authoritative GIS Node'}</span>
          </div>
          <div style="display:flex; justify-content:space-between; padding:4px 0;">
            <span style="color:var(--text-2);">GIS Licence:</span>
            <span style="font-size:11px; color:var(--text-muted);">${escapeHtml(osm.licence || 'OpenStreetMap ODbL')}</span>
          </div>
        </div>
      </div>

      <!-- FloodAI Localized Catchment Advisory -->
      <div class="glass" style="padding:18px; border-radius:14px; border:1px solid var(--panel-border); background:rgba(255,255,255,0.02);">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
          <span style="color:#1FE0A8; font-size:16px;">🛡️</span>
          <h4 style="font-family:var(--font-display); font-size:14px; font-weight:700; color:var(--text-0); margin:0;">
            Catchment Civil Defense Advisory
          </h4>
        </div>
        <div style="font-size:12.5px; line-height:1.6; color:var(--text-1); margin-bottom:14px;">
          ${escapeHtml(threat.civil_advisory || 'Hydrological indices within standard operational thresholds. Catchment channels flowing freely.')}
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px; font-size:11.5px;">
          <div style="padding:8px 10px; border-radius:8px; background:rgba(255,255,255,0.03); border:1px solid var(--panel-border);">
            <div style="color:var(--text-2); font-size:10.5px;">Drainage Efficiency</div>
            <div style="font-weight:700; color:var(--text-0);">${hydro.drainage_efficiency_score || 50} / 100</div>
          </div>
          <div style="padding:8px 10px; border-radius:8px; background:rgba(255,255,255,0.03); border:1px solid var(--panel-border);">
            <div style="color:var(--text-2); font-size:10.5px;">Atmospheric Visibility</div>
            <div style="font-weight:700; color:var(--text-0);">${Number(w.visibility_km || 10).toFixed(1)} km</div>
          </div>
        </div>
        <div style="font-size:11.5px; color:var(--text-2); font-family:var(--font-mono); border-top:1px solid rgba(255,255,255,0.06); padding-top:8px;">
          🚨 Emergency Hotlines: NDRF <b>1078</b> · State EOC <b>1070</b>
        </div>
      </div>

    </div>
  `;
}

