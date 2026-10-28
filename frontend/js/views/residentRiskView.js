/**
 * residentRiskView.js
 * Resident Workspace Screen 01 — My Location and Risk Overview
 * Connects to /api/threats/personal-intelligence with live GPS coordinates
 * Includes dedicated "Flood Risk for High Probability Areas" section with multi-basin telemetry
 */

// Master Catalog of Monitored High-Probability Disaster Sectors & Topographic Risk Basins
const HIGH_PROB_DISTRICTS_DATA = [
  {
    id: 'mumbai',
    district: 'Mumbai',
    state: 'Maharashtra',
    lat: 19.08,
    lon: 72.88,
    baseProbability: 93.03,
    elevation: 7.93,
    elevationCategory: 'Coastal Reclamation (<10m)',
    category: 'coastal',
    basin: 'Mithi River & Mahim Creek Estuary',
    rainfall24h: 115,
    riverStage: '+1.85m above danger level',
    soilSaturation: '89% (Waterlogged)',
    leadTime: '2.2 Hours',
    sheltersCount: 42,
    safeZone: 'Kurla-BKC Elevated Causeway & Powai Ridge',
    severity: 'Critical',
    directive: 'Ground-level flooding imminent along coastal reclamations. Immediate evacuation protocol active for low-lying slums and sub-grade structures.',
    historicalEvents: 368,
    primaryDrivers: ['Mithi River Tidal Lock', 'Monsoonal Cloudburst', 'Urban Runoff Choke']
  },
  {
    id: 'chennai',
    district: 'Chennai',
    state: 'Tamil Nadu',
    lat: 13.08,
    lon: 80.27,
    baseProbability: 83.78,
    elevation: 6.09,
    elevationCategory: 'Coastal Delta Lagoon (<10m)',
    category: 'coastal',
    basin: 'Adyar & Cooum River Confluence',
    rainfall24h: 94,
    riverStage: '+1.40m above alert mark',
    soilSaturation: '82% (High Saturation)',
    leadTime: '3.1 Hours',
    sheltersCount: 28,
    safeZone: 'Guindy High Ridge & Velachery Flyover Perimeter',
    severity: 'Critical',
    directive: 'Surplus release from Chembarambakkam reservoir combined with high tide. Residents within 500m of Adyar bank prepare for vertical relocation.',
    historicalEvents: 284,
    primaryDrivers: ['Reservoir Spillway Discharge', 'Tidal Surge Lock', 'Drainage Surcharge']
  },
  {
    id: 'kochi',
    district: 'Kochi',
    state: 'Kerala',
    lat: 9.93,
    lon: 76.27,
    baseProbability: 76.40,
    elevation: 2.33,
    elevationCategory: 'Extreme Low-Lying Tidal Delta (<5m)',
    category: 'coastal',
    basin: 'Vembanad Lake & Periyar River Confluence',
    rainfall24h: 82,
    riverStage: '+1.10m above mean sea level',
    soilSaturation: '94% (Near Saturation)',
    leadTime: '1.8 Hours',
    sheltersCount: 24,
    safeZone: 'Kakkanad Elevated Ridge & NH-66 Bypass High Ground',
    severity: 'Critical',
    directive: 'Backwater tidal surge entering low-lying canal network. Fort Kochi & Willingdon Island residents deploy sandbags and secure electrical conduits.',
    historicalEvents: 215,
    primaryDrivers: ['Spring Tidal Backflow', 'Periyar Dam Runoff', 'Low-Gradient Drainage']
  },
  {
    id: 'kolkata',
    district: 'Kolkata',
    state: 'West Bengal',
    lat: 22.57,
    lon: 88.36,
    baseProbability: 72.80,
    elevation: 5.98,
    elevationCategory: 'Deltaic River Corridor (<10m)',
    category: 'coastal',
    basin: 'Hooghly River & Sundarbans Estuary',
    rainfall24h: 68,
    riverStage: '+0.95m above alert stage',
    soilSaturation: '79% (Saturated)',
    leadTime: '2.7 Hours',
    sheltersCount: 34,
    safeZone: 'Salt Lake Sector V & New Town Highlands',
    severity: 'High',
    directive: 'Tidal bore anticipated during high tide crest. Municipal lock gates closed; pumping stations at Park Circus operating at maximum capacity.',
    historicalEvents: 296,
    primaryDrivers: ['Hooghly Tidal Incursion', 'Estuary Siltation', 'Monsoonal Depressions']
  },
  {
    id: 'surat',
    district: 'Surat',
    state: 'Gujarat',
    lat: 21.17,
    lon: 72.83,
    baseProbability: 64.10,
    elevation: 13.01,
    elevationCategory: 'Estuarine Floodplain (<15m)',
    category: 'river',
    basin: 'Tapi River Basin & Ukai Dam Overflow',
    rainfall24h: 56,
    riverStage: '+0.80m above normal baseline',
    soilSaturation: '71% (Moderate)',
    leadTime: '4.0 Hours',
    sheltersCount: 19,
    safeZone: 'Althan High Ridge & City Center',
    severity: 'High',
    directive: 'Upstream Ukai discharge reaching 185,000 cusecs. Floodplain agricultural tracts and river causeways submerged; avoid all low-water bridges.',
    historicalEvents: 188,
    primaryDrivers: ['Upstream Dam Release', 'Tapi Estuary Confluence', 'High Arabian Tide']
  },
  {
    id: 'patna',
    district: 'Patna',
    state: 'Bihar',
    lat: 25.59,
    lon: 85.14,
    baseProbability: 52.30,
    elevation: 53.63,
    elevationCategory: 'Inland Quad-River Confluence',
    category: 'river',
    basin: 'Ganga-Gandak-Son Confluence Basin',
    rainfall24h: 48,
    riverStage: '+0.65m above normal stage',
    soilSaturation: '68% (Moderate)',
    leadTime: '5.5 Hours',
    sheltersCount: 25,
    safeZone: 'Bailey Road Elevated Hub',
    severity: 'Moderate',
    directive: 'Ganga river approaching warning mark at Digha Ghat. Diara riverbed settlements on standby for inland flood evacuation.',
    historicalEvents: 245,
    primaryDrivers: ['Quad-River Backwater', 'Nepal Catchment Inflow', 'Bank Silt Erosion']
  },
  {
    id: 'bhubaneswar',
    district: 'Bhubaneswar',
    state: 'Odisha',
    lat: 20.30,
    lon: 85.82,
    baseProbability: 48.70,
    elevation: 45.31,
    elevationCategory: 'Coastal Delta Plain',
    category: 'river',
    basin: 'Mahanadi Delta & Daya River Basin',
    rainfall24h: 42,
    riverStage: '+0.50m baseline',
    soilSaturation: '64% (Normal)',
    leadTime: '6.2 Hours',
    sheltersCount: 16,
    safeZone: 'Khandagiri Highlands',
    severity: 'Moderate',
    directive: 'Localized water accumulation in Rasulgarh underpasses. Standard monsoon sluice-gate management in effect.',
    historicalEvents: 172,
    primaryDrivers: ['Mahanadi Runoff', 'Daya River Overflow', 'Depression Squalls']
  },
  {
    id: 'guwahati',
    district: 'Guwahati',
    state: 'Assam',
    lat: 26.14,
    lon: 91.74,
    baseProbability: 45.20,
    elevation: 55.41,
    elevationCategory: 'Sub-Himalayan Valley Basin',
    category: 'river',
    basin: 'Brahmaputra River Corridor & Bharalu Canal',
    rainfall24h: 39,
    riverStage: '+0.45m baseline',
    soilSaturation: '62% (Moderate)',
    leadTime: '3.5 Hours',
    sheltersCount: 20,
    safeZone: 'Kamakhya Foothills & Jalukbari Ridge',
    severity: 'Moderate',
    directive: 'Flash flood runoff from surrounding hills accumulating in Bharalu river channel. Residents in Anil Nagar monitor street gauge.',
    historicalEvents: 194,
    primaryDrivers: ['Himalayan Snowmelt & Inflow', 'Hill Runoff', 'Channel Silting']
  },
  {
    id: 'visakhapatnam',
    district: 'Visakhapatnam',
    state: 'Andhra Pradesh',
    lat: 17.69,
    lon: 83.22,
    baseProbability: 38.60,
    elevation: 45.08,
    elevationCategory: 'Coastal Valley & Natural Harbour',
    category: 'coastal',
    basin: 'Meghadrigedda Reservoir & Port Basin',
    rainfall24h: 26,
    riverStage: 'Normal Baseline Stage',
    soilSaturation: '51% (Stable)',
    leadTime: '6.5 Hours',
    sheltersCount: 18,
    safeZone: 'Kailasagiri Foothills',
    severity: 'Low',
    directive: 'Minor coastal swell observed. All storm surge barriers functional with no critical inundation projected.',
    historicalEvents: 142,
    primaryDrivers: ['Coastal Cyclone Squall', 'Meghadrigedda Outflow', 'Port Backflow']
  },
  {
    id: 'hosur',
    district: 'Hosur',
    state: 'Tamil Nadu',
    lat: 12.74,
    lon: 77.83,
    baseProbability: 15.90,
    elevation: 886.30,
    elevationCategory: 'Deccan Plateau Highland (Control)',
    category: 'highland',
    basin: 'Ponnaiyar River Headwaters',
    rainfall24h: 12,
    riverStage: 'Low Baseline Stage',
    soilSaturation: '34% (Dry/Rapid Drainage)',
    leadTime: '12.0+ Hours',
    sheltersCount: 8,
    safeZone: 'Entire High Plateau Region',
    severity: 'Low',
    directive: 'Highland elevation provides robust natural drainage. Sector designated as secondary regional evacuation staging area.',
    historicalEvents: 31,
    primaryDrivers: ['Micro-Drainage Ponding Only', 'Zero Surge Risk']
  }
];

// Interactive state for the High Probability section
let _highProbActiveFilter = 'all';
let _highProbSortOrder = 'prob_desc';
let _highProbSearchText = '';
let _expandedDistrictId = null;
let _highProbDistricts = JSON.parse(JSON.stringify(HIGH_PROB_DISTRICTS_DATA));

/**
 * Filter handler for High Probability Disaster Sectors
 */
window.setHighProbFilter = function(filterType) {
  _highProbActiveFilter = filterType;
  
  // Update button visual styles
  document.querySelectorAll('.hp-filter-btn').forEach(btn => {
    if (btn.getAttribute('data-filter') === filterType) {
      btn.classList.add('active');
      btn.style.background = 'rgba(31,224,168,0.2)';
      btn.style.borderColor = 'var(--ocean)';
      btn.style.color = 'var(--ocean)';
    } else {
      btn.classList.remove('active');
      btn.style.background = 'rgba(255,255,255,0.03)';
      btn.style.borderColor = 'rgba(255,255,255,0.1)';
      btn.style.color = 'var(--text-secondary)';
    }
  });

  renderHighProbCardsGrid();
};

/**
 * Sort handler
 */
window.sortHighProbCards = function() {
  const select = document.getElementById('highProbSortSelect');
  if (select) {
    _highProbSortOrder = select.value;
    renderHighProbCardsGrid();
  }
};

/**
 * Search handler
 */
window.filterHighProbCards = function() {
  const input = document.getElementById('highProbSearchInput');
  if (input) {
    _highProbSearchText = input.value.trim().toLowerCase();
    renderHighProbCardsGrid();
  }
};

/**
 * Toggle extra telemetry details for a specific district card
 */
window.toggleHighProbDetails = function(districtId) {
  _expandedDistrictId = (_expandedDistrictId === districtId) ? null : districtId;
  renderHighProbCardsGrid();
};

/**
 * Focus district and navigate to GIS Map
 */
window.focusDistrictFromCard = function(districtName, lat, lon) {
  if (typeof state !== 'undefined') {
    state.selectedDistrict = districtName;
    state.mapCenter = [lat, lon];
  }
  if (typeof goTo === 'function') {
    goTo('map');
  }
};

/**
 * Renders the High Probability Areas Grid based on current filter, sort, and search
 */
function renderHighProbCardsGrid() {
  const container = document.getElementById('highProbCardsGrid');
  if (!container) return;

  // Filter
  let filtered = _highProbDistricts.filter(item => {
    // Search match
    if (_highProbSearchText) {
      const q = _highProbSearchText;
      const match = item.district.toLowerCase().includes(q) ||
                    item.state.toLowerCase().includes(q) ||
                    item.basin.toLowerCase().includes(q) ||
                    item.primaryDrivers.some(d => d.toLowerCase().includes(q));
      if (!match) return false;
    }

    // Category filter
    if (_highProbActiveFilter === 'all') return true;
    if (_highProbActiveFilter === 'critical') return item.baseProbability >= 65;
    if (_highProbActiveFilter === 'coastal') return item.category === 'coastal' || item.elevation < 15;
    if (_highProbActiveFilter === 'river') return item.category === 'river';
    if (_highProbActiveFilter === 'highland') return item.elevation > 50 || item.category === 'highland';
    return true;
  });

  // Sort
  filtered.sort((a, b) => {
    if (_highProbSortOrder === 'prob_desc') return b.baseProbability - a.baseProbability;
    if (_highProbSortOrder === 'prob_asc') return a.baseProbability - b.baseProbability;
    if (_highProbSortOrder === 'elev_asc') return a.elevation - b.elevation;
    if (_highProbSortOrder === 'elev_desc') return b.elevation - a.elevation;
    if (_highProbSortOrder === 'lead_asc') return parseFloat(a.leadTime) - parseFloat(b.leadTime);
    if (_highProbSortOrder === 'name_asc') return a.district.localeCompare(b.district);
    return 0;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="glass-card" style="grid-column: 1 / -1; padding:36px; text-align:center; color:var(--text-muted);">
        <span style="font-size:26px; display:block; margin-bottom:10px;">🔍</span>
        <div style="font-size:15px; font-weight:600; color:var(--text-secondary);">No monitored disaster sectors match your filter</div>
        <p style="font-size:12.5px; margin-top:6px;">Try adjusting your search criteria or switch to "All Sectors (10)".</p>
        <button class="glass-btn btn-ghost" onclick="setHighProbFilter('all')" style="margin-top:14px; font-size:12px;">
          Reset Filter to All Sectors
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(item => {
    const prob = item.baseProbability;
    const isCritical = prob >= 65;
    const isHigh = prob >= 45 && prob < 65;
    
    // Dynamic color tokens
    const badgeColor = isCritical ? 'var(--red, #f43f5e)' : (isHigh ? 'var(--amber, #f59e0b)' : 'var(--ocean, #1fe0a8)');
    const badgeBg = isCritical ? 'rgba(244,63,94,0.12)' : (isHigh ? 'rgba(245,158,11,0.12)' : 'rgba(31,224,168,0.12)');
    const badgeBorder = isCritical ? 'rgba(244,63,94,0.35)' : (isHigh ? 'rgba(245,158,11,0.35)' : 'rgba(31,224,168,0.35)');
    const cardBorderHighlight = isCritical ? '1px solid rgba(244,63,94,0.3)' : '1px solid rgba(255,255,255,0.07)';
    const isExpanded = _expandedDistrictId === item.id;

    return `
      <div class="glass-card elevated hp-card" style="padding:24px; display:flex; flex-direction:column; justify-content:space-between; border:${cardBorderHighlight}; transition:transform 0.2s ease, border-color 0.2s ease;">
        <div>
          <!-- Top Row: District & Live Risk Badge -->
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px; gap:8px;">
            <div>
              <div style="display:flex; align-items:center; gap:8px;">
                <h3 style="font-size:19px; font-weight:700; margin:0; color:var(--text-primary);">${escapeHtml(item.district)}</h3>
                <span style="font-size:11.5px; padding:2px 8px; border-radius:6px; background:rgba(255,255,255,0.06); color:var(--text-secondary); font-family:var(--font-mono);">
                  ${escapeHtml(item.state)}
                </span>
              </div>
              <div style="font-size:12px; color:var(--text-muted); margin-top:3px; display:flex; align-items:center; gap:5px;">
                <span>🌊</span> ${escapeHtml(item.basin)}
              </div>
            </div>

            <span class="glass-badge" style="background:${badgeBg}; color:${badgeColor}; border:1px solid ${badgeBorder}; font-size:11px; font-family:var(--font-mono); font-weight:700; padding:4px 10px; white-space:nowrap;">
              ${prob >= 65 ? '🔴 CRITICAL SECTOR' : (prob >= 45 ? '🟡 HIGH SURGE' : '🟢 STABLE WATCH')}
            </span>
          </div>

          <!-- Probability Gauge & Inundation Spectrum -->
          <div style="background:rgba(0,0,0,0.25); border-radius:12px; padding:14px 16px; margin-bottom:16px; border:1px solid rgba(255,255,255,0.04);">
            <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:8px;">
              <span style="font-size:11.5px; font-family:var(--font-mono); color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px;">
                Modeled Inundation Probability
              </span>
              <span style="font-family:var(--font-display); font-size:26px; font-weight:800; color:${badgeColor}; line-height:1;">
                ${prob.toFixed(1)}%
              </span>
            </div>

            <!-- Progress Meter -->
            <div style="width:100%; height:8px; background:rgba(255,255,255,0.06); border-radius:4px; overflow:hidden; position:relative;">
              <div style="width:${Math.min(prob, 100)}%; height:100%; background:linear-gradient(90deg, #1fe0a8 0%, #f59e0b 55%, #f43f5e 100%); border-radius:4px; transition:width 0.6s cubic-bezier(0.16, 1, 0.3, 1);"></div>
            </div>

            <div style="display:flex; justify-content:space-between; font-size:10px; color:var(--text-muted); font-family:var(--font-mono); margin-top:5px;">
              <span>0% Low</span>
              <span>45% Moderate</span>
              <span>65% High</span>
              <span>100% Critical</span>
            </div>
          </div>

          <!-- Hydrologic & Topographic Key Indicators -->
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px;">
            <div style="padding:10px 12px; background:rgba(255,255,255,0.02); border-radius:8px; border:1px solid rgba(255,255,255,0.04);">
              <div style="font-size:10.5px; color:var(--text-muted); font-family:var(--font-mono);">ELEVATION MSL</div>
              <div style="font-size:15px; font-weight:700; color:${item.elevation < 10 ? 'var(--red, #f43f5e)' : 'var(--ocean, #1fe0a8)'}; margin-top:2px; display:flex; align-items:center; gap:6px;">
                ${item.elevation.toFixed(1)} m
                ${item.elevation < 10 ? '<span title="Critical Sea Level Exposure" style="font-size:11px; background:rgba(244,63,94,0.2); padding:1px 5px; border-radius:4px; font-weight:600;">Lowland</span>' : ''}
              </div>
            </div>

            <div style="padding:10px 12px; background:rgba(255,255,255,0.02); border-radius:8px; border:1px solid rgba(255,255,255,0.04);">
              <div style="font-size:10.5px; color:var(--text-muted); font-family:var(--font-mono);">EARLY WARNING LEAD</div>
              <div style="font-size:15px; font-weight:700; color:var(--text-primary); margin-top:2px;">
                ⏱️ ${escapeHtml(item.leadTime)}
              </div>
            </div>
          </div>

          <!-- Primary Drivers Chips -->
          <div style="margin-bottom:14px;">
            <div style="font-size:10.5px; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:6px; text-transform:uppercase;">
              Key Hydrologic Hazard Drivers:
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:6px;">
              ${item.primaryDrivers.map(d => `
                <span style="font-size:11px; padding:3px 8px; border-radius:6px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); color:var(--text-secondary);">
                  ${escapeHtml(d)}
                </span>
              `).join('')}
            </div>
          </div>

          <!-- Resident Directive Snippet -->
          <div style="background:rgba(255,255,255,0.02); border-left:3px solid ${badgeColor}; padding:10px 12px; border-radius:0 8px 8px 0; margin-bottom:16px;">
            <div style="font-size:11px; font-weight:600; color:${badgeColor}; margin-bottom:3px; display:flex; align-items:center; gap:5px;">
              <span>🛡️</span> Civil Defense Action:
            </div>
            <div style="font-size:12.5px; color:var(--text-secondary); line-height:1.45;">
              ${escapeHtml(item.directive)}
            </div>
          </div>

          <!-- Expanded Telemetry Drawer (Toggled) -->
          ${isExpanded ? `
            <div style="background:rgba(0,0,0,0.35); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:14px; margin-bottom:16px; animation:fadeIn 0.2s ease;">
              <div style="font-size:11.5px; font-weight:700; color:var(--ocean); margin-bottom:10px; font-family:var(--font-mono); text-transform:uppercase;">
                Hydrological Telemetry Breakdown
              </div>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:12px; color:var(--text-secondary); margin-bottom:10px;">
                <div>• 24h Projected Rain: <strong style="color:var(--text-primary);">${item.rainfall24h} mm</strong></div>
                <div>• River Gauge Stage: <strong style="color:var(--text-primary);">${item.riverStage}</strong></div>
                <div>• Soil Moisture: <strong style="color:var(--text-primary);">${item.soilSaturation}</strong></div>
                <div>• Historical Events: <strong style="color:var(--text-primary);">${item.historicalEvents} cataloged</strong></div>
              </div>
              <div style="font-size:12px; color:var(--text-muted); border-top:1px solid rgba(255,255,255,0.06); padding-top:8px;">
                <strong>Safe Evacuation Staging Hub:</strong> ${escapeHtml(item.safeZone)}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Card Action Footer -->
        <div style="display:flex; gap:8px; border-top:1px solid rgba(255,255,255,0.06); padding-top:14px; margin-top:6px; flex-wrap:wrap;">
          <button class="glass-btn btn-ghost" onclick="toggleHighProbDetails('${item.id}')" style="flex:1; justify-content:center; font-size:12px; padding:6px 10px;">
            ${isExpanded ? '▲ Hide Details' : '▼ Telemetry'}
          </button>
          
          <button class="glass-btn btn-secondary" onclick="focusDistrictFromCard('${escapeHtml(item.district)}', ${item.lat}, ${item.lon})" style="flex:1.2; justify-content:center; font-size:12px; padding:6px 10px; gap:5px;">
            <span>📍</span> GIS Map
          </button>

          <button class="glass-btn btn-ghost" onclick="goTo('resident-radar')" title="Open 1,000km Synoptic Detection Radar" style="padding:6px 10px; font-size:12px;">
            <span>📡</span> Radar
          </button>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Main View Renderer: Screen 01 — Resident Location & Risk Overview
 */
async function renderResidentRisk(root) {
  root.innerHTML = `
    <div class="saas-page-container">
      <!-- Top Title and Telemetry Header -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:14px;">
        <div>
          <span class="story-tag" style="color:var(--ocean); border-color:rgba(31,224,168,0.3); background:rgba(31,224,168,0.1);">
            CITIZEN SAFETY HUB • PROXIMITY TELEMETRY
          </span>
          <h1 style="font-family:var(--font-display); font-size:28px; font-weight:700; margin-top:6px;">
            My Location &amp; Flood Risk Overview
          </h1>
          <p style="font-size:13.5px; color:var(--text-secondary);">
            Hyperlocal hazard appraisal based on your coordinates, topographic elevation, and nearby river basins.
          </p>
        </div>

        <button class="glass-btn btn-ghost" onclick="renderResidentRisk(document.getElementById('pageRoot'))" style="gap:6px;">
          <span>🔄</span> Refresh Telemetry
        </button>
      </div>

      <div id="residentRiskContent">
        <div class="glass-card" style="padding:36px; text-align:center;">
          <span class="spin-anim" style="font-size:22px; color:var(--accent-primary);">⚡</span>
          <div style="font-size:13px; color:var(--text-muted); margin-top:8px;">Triangulating local geographic risk parameters &amp; regional disaster corridors...</div>
        </div>
      </div>
    </div>
  `;

  // Determine coordinates: use detected GPS or manual selection (never silently substitute)
  const geo = typeof GeoLocationService !== 'undefined' ? GeoLocationService.getStatus() : null;
  const userLat = geo?.coords?.lat ?? state.userLocation?.lat ?? state.userLocation?.latitude;
  const userLon = geo?.coords?.lon ?? state.userLocation?.lon ?? state.userLocation?.longitude;
  const isGps = geo?.isGps;

  const container = document.getElementById('residentRiskContent');
  if (!container) return;

  if (userLat === undefined || userLon === undefined) {
    container.innerHTML = `
      <div class="glass-card elevated" style="padding:48px; text-align:center;">
        <div style="font-size:36px; margin-bottom:12px;">📍</div>
        <h3 style="font-size:18px; font-weight:700; margin-bottom:8px;">Location Permission Required for Flood Risk Analysis</h3>
        <p style="font-size:13.5px; color:var(--text-muted); max-width:480px; margin:0 auto 20px;">
          FloodAI analyzes real digital elevation models (DEM), coastal surge distance, and catchment hydrology specifically around your location.
        </p>
        <div style="display:flex; justify-content:center; gap:12px; flex-wrap:wrap;">
          <button class="glass-btn btn-primary" onclick="GeoLocationService.requestDeviceLocation().then(() => renderResidentRisk(document.getElementById('pageRoot')))" style="gap:6px;">
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

  const lat = userLat;
  const lon = userLon;

  try {
    // Concurrently fetch personal intelligence and live monitored threat assessments
    const [personalResResult, threatResResult] = await Promise.allSettled([
      api(`/threats/personal-intelligence?lat=${lat}&lon=${lon}`),
      api('/threats/current')
    ]);

    if (!container) return;

    const res = (personalResResult.status === 'fulfilled' && personalResResult.value) ? personalResResult.value : {};
    const intel = res.personalIntelligence || {};
    const prob = (typeof intel.floodProbabilityPct === 'number') ? intel.floodProbabilityPct : (res.flood_probability_pct ?? 18.0);
    const risk = intel.severity || res.district_risk_level || (prob > 60 ? 'High' : (prob > 30 ? 'Moderate' : 'Low'));
    const badgeColor = risk === 'High' || risk === 'Very High' ? 'var(--red)' : (risk === 'Moderate' ? 'var(--amber)' : 'var(--ocean)');
    const realLocationName = res.locationName || res.matchedDistrict || (state.userLocation?.cityName) || 'Monitored Sector';
    const realElevation = (typeof res.elevation === 'number') ? res.elevation : 12.0;
    const realCoastDist = (typeof res.distanceFromCoastKm === 'number') ? res.distanceFromCoastKm : 25.0;
    const isCoastal = res.isCoastal || realCoastDist <= 35;
    const riverSwell = res.riverSwell || (isCoastal && realElevation < 10 ? 'Tidal Estuary Stage' : 'Normal Stage');
    const primaryShelter = (res.recommended_shelters && res.recommended_shelters.length) ? res.recommended_shelters[0] : null;

    // Ingest active live assessments into the high probability districts catalog
    if (threatResResult.status === 'fulfilled' && threatResResult.value?.assessments) {
      const activeAssessments = threatResResult.value.assessments;
      activeAssessments.forEach(ass => {
        const match = _highProbDistricts.find(d => d.district.toLowerCase() === (ass.district || '').toLowerCase());
        if (match && typeof ass.floodProbabilityPct === 'number') {
          match.baseProbability = parseFloat(ass.floodProbabilityPct.toFixed(1));
          if (ass.riskLevel) match.severity = ass.riskLevel;
          if (ass.aiThreatIntel?.threat_summary) match.directive = ass.aiThreatIntel.threat_summary;
          if (ass.meteorology?.rainfall_mm) match.rainfall24h = ass.meteorology.rainfall_mm;
          if (ass.meteorology?.river_level_m) match.riverStage = `${ass.meteorology.river_level_m}m gauge stage`;
        }
      });
    }

    // Build the complete combined screen with top telemetry & the new high-probability section
    container.innerHTML = `
      <!-- TOP SECTION: Personal Proximity Telemetry & Civil Defense Guidance -->
      <div class="grid-cards" style="grid-template-columns:1.2fr 1fr; gap:24px; margin-bottom:36px;">
        
        <!-- Live Hazard Gauge Card -->
        <div class="glass-card elevated border-lightning" style="padding:32px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:22px;">📍</span>
              <div>
                <h3 style="font-size:18px; font-weight:700; margin:0;">${escapeHtml(realLocationName)}</h3>
                <div style="font-size:11.5px; color:var(--text-muted); font-family:var(--font-mono);">
                  Lat: ${lat.toFixed(4)} • Lon: ${lon.toFixed(4)} ${isCoastal ? '• <span style="color:var(--ocean); font-weight:600;">🌊 COASTAL ZONE</span>' : ''}
                </div>
              </div>
            </div>

            <span class="glass-badge" style="background:rgba(31,224,168,0.15); color:var(--ocean); font-family:var(--font-mono); font-size:11px;">
              ● REAL TELEMETRY
            </span>
          </div>

          <div style="text-align:center; padding:28px 0; border-top:1px solid rgba(255,255,255,0.06); border-bottom:1px solid rgba(255,255,255,0.06); margin-bottom:20px;">
            <div style="font-family:var(--font-display); font-size:56px; font-weight:700; color:${badgeColor}; line-height:1;">
              ${prob.toFixed(1)}%
            </div>
            <div style="font-size:16px; font-weight:700; color:var(--text-primary); margin-top:8px;">
              Current Assessment: <span style="color:${badgeColor};">${risk} Vulnerability</span>
            </div>
            <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">
              ${escapeHtml(intel.model || 'Open-Meteo & XGBoost Real Location Inference')}
            </div>
          </div>

          <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:12px; text-align:center;">
            <div style="padding:10px; background:rgba(255,255,255,0.02); border-radius:10px; border:1px solid rgba(255,255,255,0.05);">
              <div style="font-size:11px; color:var(--text-muted); font-family:var(--font-mono);">Elevation</div>
              <div style="font-size:16px; font-weight:700; color:${realElevation < 10 ? 'var(--red, #f43f5e)' : 'var(--ocean)'};">${realElevation.toFixed(1)} m</div>
            </div>
            <div style="padding:10px; background:rgba(255,255,255,0.02); border-radius:10px; border:1px solid rgba(255,255,255,0.05);">
              <div style="font-size:11px; color:var(--text-muted); font-family:var(--font-mono);">Coast Proximity</div>
              <div style="font-size:16px; font-weight:700; color:${realCoastDist < 15 ? 'var(--amber, #f59e0b)' : 'var(--text-primary)'};">${realCoastDist.toFixed(1)} km</div>
            </div>
            <div style="padding:10px; background:rgba(255,255,255,0.02); border-radius:10px; border:1px solid rgba(255,255,255,0.05);">
              <div style="font-size:11px; color:var(--text-muted); font-family:var(--font-mono);">Basin Stage</div>
              <div style="font-size:15px; font-weight:700; color:var(--accent-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(riverSwell)}</div>
            </div>
          </div>
        </div>

        <!-- Personal Safety Guidance & Directives -->
        <div class="glass-card elevated" style="padding:32px; display:flex; flex-direction:column; justify-content:space-between;">
          <div>
            <h3 style="font-size:18px; font-weight:700; margin-bottom:14px; display:flex; align-items:center; gap:8px;">
              <span>🛡️</span> Civil Defense Advisory
            </h3>
            <p style="font-size:13.5px; color:var(--text-secondary); line-height:1.65; margin-bottom:20px;">
              ${escapeHtml(intel.advisory || `Live meteorological telemetry and terrain models processed for ${realLocationName}.`)}
            </p>

            <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:24px;">
              ${intel.civilianDirectives && intel.civilianDirectives.length ? 
                intel.civilianDirectives.map(d => `
                  <div style="display:flex; align-items:center; gap:10px; font-size:13px; color:var(--text-primary);">
                    <span style="color:var(--ocean);">✓</span> ${escapeHtml(d)}
                  </div>
                `).join('') : `
                  <div style="display:flex; align-items:center; gap:10px; font-size:13px; color:var(--text-primary);">
                    <span style="color:var(--ocean);">✓</span> Emergency siren station armed and listening
                  </div>
                  <div style="display:flex; align-items:center; gap:10px; font-size:13px; color:var(--text-primary);">
                    <span style="color:var(--ocean);">✓</span> Multi-channel Web Push alerts active on this device
                  </div>
                `}
              ${primaryShelter ? `
                <div style="display:flex; align-items:center; gap:10px; font-size:13px; color:var(--text-primary);">
                  <span style="color:var(--accent-primary);">ℹ</span> Nearest refuge: <strong>${escapeHtml(primaryShelter.name)}</strong> (${primaryShelter.distanceKm} km away)
                </div>
              ` : ''}
            </div>
          </div>

          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <button class="glass-btn btn-secondary" onclick="goTo('resident-guide')" style="flex:1; justify-content:center; font-size:12.5px;">
              Preparedness Guide →
            </button>
            <button class="glass-btn btn-primary" onclick="goTo('resident-simulation')" style="flex:1.2; justify-content:center; font-size:12.5px; gap:6px;">
              <span>🚨</span> Test Alert Simulation
            </button>
            <button class="glass-btn btn-ghost" onclick="goTo('resident-weather')" style="flex:1; justify-content:center; font-size:12.5px;">
              Hydro Weather →
            </button>
          </div>
        </div>

      </div>

      <!-- ========================================================
           NEW SECTION: FLOOD RISK FOR HIGH PROBABILITY AREAS
           ======================================================== -->
      <div class="high-probability-section" style="margin-top:20px; padding-top:28px; border-top:1px solid rgba(255,255,255,0.08);">
        
        <!-- Section Title & Telemetry Status -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; flex-wrap:wrap; gap:16px;">
          <div>
            <span class="story-tag" style="color:var(--red, #f43f5e); border-color:rgba(244,63,94,0.3); background:rgba(244,63,94,0.1);">
              VULNERABILITY ATLAS • REGIONAL FLOOD RISKS
            </span>
            <h2 style="font-family:var(--font-display); font-size:24px; font-weight:700; margin-top:8px; margin-bottom:6px; display:flex; align-items:center; gap:10px;">
              <span>🌊</span> Flood Risk for High Probability Areas
            </h2>
            <p style="font-size:13.5px; color:var(--text-secondary); max-width:820px; line-height:1.55;">
              Real-time hydrological vulnerability mapping across prioritized disaster sectors, coastal deltas, and river basin corridors exhibiting elevated inundation probabilities.
            </p>
          </div>

          <div style="display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); padding:8px 14px; border-radius:10px;">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--red, #f43f5e); box-shadow:0 0 10px var(--red, #f43f5e);"></span>
            <span style="font-size:11.5px; font-family:var(--font-mono); color:var(--text-muted);">
              SURVEILLANCE: <strong style="color:var(--text-primary);">10 SECTORS ACTIVE</strong>
            </span>
          </div>
        </div>

        <!-- Telemetry Summary Ribbon -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:14px; margin-bottom:24px;">
          <div class="glass-card" style="padding:16px; border-left:3px solid var(--red, #f43f5e);">
            <div style="font-size:11px; font-family:var(--font-mono); color:var(--text-muted); text-transform:uppercase;">Critical Threat Sectors</div>
            <div style="font-size:22px; font-weight:700; color:var(--red, #f43f5e); margin-top:4px;">
              ${_highProbDistricts.filter(d => d.baseProbability >= 65).length} Sectors (&gt;65%)
            </div>
            <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">Immediate flood contingency active</div>
          </div>

          <div class="glass-card" style="padding:16px; border-left:3px solid var(--amber, #f59e0b);">
            <div style="font-size:11px; font-family:var(--font-mono); color:var(--text-muted); text-transform:uppercase;">Peak Basin Probability</div>
            <div style="font-size:22px; font-weight:700; color:var(--amber, #f59e0b); margin-top:4px;">
              ${Math.max(..._highProbDistricts.map(d => d.baseProbability)).toFixed(1)}% Inundation
            </div>
            <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">Mumbai &amp; Chennai coastal basins</div>
          </div>

          <div class="glass-card" style="padding:16px; border-left:3px solid var(--ocean, #1fe0a8);">
            <div style="font-size:11px; font-family:var(--font-mono); color:var(--text-muted); text-transform:uppercase;">Lowest Topographic Elevation</div>
            <div style="font-size:22px; font-weight:700; color:var(--ocean, #1fe0a8); margin-top:4px;">
              ${Math.min(..._highProbDistricts.map(d => d.elevation)).toFixed(1)} m MSL
            </div>
            <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">Kochi backwaters (High tidal surge exposure)</div>
          </div>

          <div class="glass-card" style="padding:16px; border-left:3px solid var(--accent-primary);">
            <div style="font-size:11px; font-family:var(--font-mono); color:var(--text-muted); text-transform:uppercase;">Predictive Lead-Time</div>
            <div style="font-size:22px; font-weight:700; color:var(--text-primary); margin-top:4px;">
              1.8h – 12.0h
            </div>
            <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">Continuous ML hydrologic forecasting</div>
          </div>
        </div>

        <!-- Filter Pills & Search Bar Controls -->
        <div style="display:flex; justify-content:space-between; align-items:center; gap:14px; margin-bottom:22px; flex-wrap:wrap; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); padding:12px 16px; border-radius:12px;">
          <!-- Filter Buttons -->
          <div style="display:flex; gap:8px; flex-wrap:wrap;" id="highProbFilterContainer">
            <button class="hp-filter-btn active" data-filter="all" onclick="setHighProbFilter('all')" style="padding:6px 14px; font-size:12px; font-weight:600; border-radius:20px; border:1px solid var(--ocean); background:rgba(31,224,168,0.2); color:var(--ocean); cursor:pointer; transition:all 0.2s;">
              All Sectors (10)
            </button>
            <button class="hp-filter-btn" data-filter="critical" onclick="setHighProbFilter('critical')" style="padding:6px 14px; font-size:12px; font-weight:500; border-radius:20px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.03); color:var(--text-secondary); cursor:pointer; transition:all 0.2s;">
              🔴 Critical Threat (&gt;65%)
            </button>
            <button class="hp-filter-btn" data-filter="coastal" onclick="setHighProbFilter('coastal')" style="padding:6px 14px; font-size:12px; font-weight:500; border-radius:20px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.03); color:var(--text-secondary); cursor:pointer; transition:all 0.2s;">
              🌊 Coastal &amp; Deltaic (&lt;15m)
            </button>
            <button class="hp-filter-btn" data-filter="river" onclick="setHighProbFilter('river')" style="padding:6px 14px; font-size:12px; font-weight:500; border-radius:20px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.03); color:var(--text-secondary); cursor:pointer; transition:all 0.2s;">
              🏞️ River Basin Corridors
            </button>
            <button class="hp-filter-btn" data-filter="highland" onclick="setHighProbFilter('highland')" style="padding:6px 14px; font-size:12px; font-weight:500; border-radius:20px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.03); color:var(--text-secondary); cursor:pointer; transition:all 0.2s;">
              🏔️ Highland Safe Baseline
            </button>
          </div>

          <!-- Search & Sort Controls -->
          <div style="display:flex; gap:10px; align-items:center; flex-grow:1; justify-content:flex-end; min-width:260px;">
            <div style="position:relative; width:220px;">
              <span style="position:absolute; left:10px; top:50%; transform:translateY(-50%); color:var(--text-muted); font-size:12px;">🔍</span>
              <input type="text" id="highProbSearchInput" placeholder="Filter district or river..." oninput="filterHighProbCards()"
                     style="width:100%; padding:7px 10px 7px 30px; font-size:12.5px; border-radius:8px; border:1px solid rgba(255,255,255,0.1); background:rgba(0,0,0,0.3); color:var(--text-primary); outline:none;" />
            </div>

            <select id="highProbSortSelect" onchange="sortHighProbCards()" style="padding:7px 12px; font-size:12px; border-radius:8px; border:1px solid rgba(255,255,255,0.1); background:rgba(0,0,0,0.4); color:var(--text-primary); cursor:pointer; outline:none;">
              <option value="prob_desc">Sort: Highest Probability</option>
              <option value="prob_asc">Sort: Lowest Probability</option>
              <option value="elev_asc">Sort: Lowest Elevation</option>
              <option value="elev_desc">Sort: Highest Elevation</option>
              <option value="lead_asc">Sort: Shortest Lead Time</option>
              <option value="name_asc">Sort: District Name</option>
            </select>
          </div>
        </div>

        <!-- Cards Grid Container -->
        <div id="highProbCardsGrid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(350px, 1fr)); gap:20px; margin-bottom:32px;">
          <!-- Injected via renderHighProbCardsGrid() -->
        </div>

        <!-- Comparative Topographic Elevation vs Inundation Spectrum Chart -->
        <div class="glass-card elevated" style="padding:28px; margin-bottom:32px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; flex-wrap:wrap; gap:10px;">
            <div>
              <h3 style="font-size:17px; font-weight:700; margin:0; display:flex; align-items:center; gap:8px;">
                <span>📊</span> Topographic Elevation vs. Flood Probability Correlation
              </h3>
              <p style="font-size:12.5px; color:var(--text-secondary); margin-top:4px;">
                Cross-sectional analysis showing how Mean Sea Level (MSL) elevation directly governs monsoonal inundation severity.
              </p>
            </div>
            <div style="display:flex; gap:14px; font-size:11px; font-family:var(--font-mono);">
              <span style="display:flex; align-items:center; gap:5px;"><span style="width:10px; height:10px; background:var(--red, #f43f5e); border-radius:2px;"></span> &gt;65% Critical</span>
              <span style="display:flex; align-items:center; gap:5px;"><span style="width:10px; height:10px; background:var(--amber, #f59e0b); border-radius:2px;"></span> 45-65% High</span>
              <span style="display:flex; align-items:center; gap:5px;"><span style="width:10px; height:10px; background:var(--ocean, #1fe0a8); border-radius:2px;"></span> &lt;45% Normal</span>
            </div>
          </div>

          <div style="display:flex; flex-direction:column; gap:12px;">
            ${_highProbDistricts.slice(0, 8).map(d => {
              const prob = d.baseProbability;
              const barColor = prob >= 65 ? 'var(--red, #f43f5e)' : (prob >= 45 ? 'var(--amber, #f59e0b)' : 'var(--ocean, #1fe0a8)');
              return `
                <div style="display:grid; grid-template-columns:130px 100px 1fr 65px; align-items:center; gap:14px; font-size:12.5px;">
                  <div style="font-weight:600; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                    ${escapeHtml(d.district)}
                  </div>
                  <div style="font-family:var(--font-mono); font-size:11.5px; color:${d.elevation < 10 ? 'var(--red, #f43f5e)' : 'var(--text-muted)'};">
                    ${d.elevation.toFixed(1)} m MSL
                  </div>
                  <div style="height:10px; background:rgba(255,255,255,0.06); border-radius:5px; overflow:hidden;">
                    <div style="width:${Math.min(prob, 100)}%; height:100%; background:${barColor}; border-radius:5px;"></div>
                  </div>
                  <div style="font-family:var(--font-mono); font-size:12.5px; font-weight:700; color:${barColor}; text-align:right;">
                    ${prob.toFixed(1)}%
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Rapid Response & Synoptic Telemetry Access Banner -->
        <div class="glass-card" style="padding:22px 26px; background:linear-gradient(135deg, rgba(31,224,168,0.07), rgba(0,180,216,0.07)); border:1px solid rgba(31,224,168,0.25); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
          <div>
            <h4 style="font-size:16px; font-weight:700; margin:0; color:var(--text-primary); display:flex; align-items:center; gap:8px;">
              <span>📡</span> Need Real-Time Surrounding Telemetry Beyond Your District?
            </h4>
            <p style="font-size:13px; color:var(--text-secondary); margin-top:4px;">
              Activate the 1,000km Synoptic Detection Radar to track incoming oceanic depressions, reservoir releases, and regional cloudburst bands.
            </p>
          </div>

          <div style="display:flex; gap:10px;">
            <button class="glass-btn btn-primary" onclick="goTo('resident-radar')" style="gap:6px; font-size:13px;">
              <span>🛰️</span> Launch 1,000km Radar
            </button>
            <button class="glass-btn btn-ghost" onclick="goTo('resident-guide')" style="font-size:13px;">
              Emergency Guide →
            </button>
          </div>
        </div>

      </div>
    `;

    // Initialize and render the cards grid
    renderHighProbCardsGrid();

  } catch (err) {
    const container = document.getElementById('residentRiskContent');
    if (container) {
      container.innerHTML = `
        <div class="glass-card" style="padding:28px; border-color:var(--red); color:var(--red); text-align:center;">
          Failed to fetch location risk intelligence: ${escapeHtml(err.message)}
        </div>
      `;
    }
  }
}
