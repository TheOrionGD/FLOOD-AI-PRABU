/**
 * FLOODAI — Historical Records View
 * 100% Dynamic, Data-Driven MongoDB Atlas Ground-Truth Explorer
 * Provides live pagination, search, multi-factor filtering, detail inspection, and CRUD actions over 10,000 real records.
 */

let recordsState = {
  page: 1,
  limit: 20,
  search: '',
  district: '',
  severity: '',
  flood_occurred: '',
  sortBy: 'date',
  sortOrder: 'desc',
  records: [],
  total: 0,
  totalPages: 1,
  isLoading: false,
};

let recordsSearchDebounce = null;

async function renderRecords(root) {
  root = root || document.getElementById('pageRoot');
  if (!root) return;

  root.innerHTML = `
    <div class="eyebrow">MongoDB Atlas Data Lake · 10,000 Ground-Truth Hydro-Meteorological Records</div>
    <h1 class="page-title">Historical Flood Records &amp; Empirical Catalog</h1>
    <p class="page-sub">Explore, search, filter, and inspect verified historical disaster telemetry records queried directly from the persistent MongoDB Atlas cluster.</p>

    <!-- Data Freshness & Filter Bar -->
    <div class="liquid-glass border-scale card-glow" style="padding:18px 22px; margin-bottom:20px;">
      <div style="display:flex; flex-wrap:wrap; gap:12px; align-items:center; justify-content:space-between;">
        <!-- Search Input -->
        <div style="flex:1; min-width:220px; position:relative;">
          <input type="text" id="recSearchInput" placeholder="🔍 Search district, state, or severity..." 
            value="${escapeHtml(recordsState.search)}"
            style="width:100%; padding:9px 14px; border-radius:10px; background:var(--bg-1); color:var(--text-0); border:1px solid var(--panel-border); font-size:13px;"
            oninput="handleRecordsSearch(this.value)">
        </div>

        <!-- District Filter -->
        <div style="min-width:160px;">
          <select id="recDistrictFilter" onchange="handleRecordsDistrictFilter(this.value)"
            style="width:100%; padding:9px 12px; border-radius:10px; background:var(--bg-1); color:var(--text-0); border:1px solid var(--panel-border); font-size:13px;">
            <option value="">All Districts</option>
            ${DISTRICTS.map(d => `<option value="${d.district}" ${recordsState.district === d.district ? 'selected' : ''}>${d.district}</option>`).join('')}
          </select>
        </div>

        <!-- Severity Filter -->
        <div style="min-width:140px;">
          <select id="recSeverityFilter" onchange="handleRecordsSeverityFilter(this.value)"
            style="width:100%; padding:9px 12px; border-radius:10px; background:var(--bg-1); color:var(--text-0); border:1px solid var(--panel-border); font-size:13px;">
            <option value="">All Severities</option>
            <option value="None" ${recordsState.severity === 'None' ? 'selected' : ''}>None</option>
            <option value="Low" ${recordsState.severity === 'Low' ? 'selected' : ''}>Low</option>
            <option value="Medium" ${recordsState.severity === 'Medium' ? 'selected' : ''}>Medium</option>
            <option value="High" ${recordsState.severity === 'High' ? 'selected' : ''}>High</option>
            <option value="Severe" ${recordsState.severity === 'Severe' ? 'selected' : ''}>Severe</option>
          </select>
        </div>

        <!-- Inundation Filter -->
        <div style="min-width:140px;">
          <select id="recOccurredFilter" onchange="handleRecordsOccurredFilter(this.value)"
            style="width:100%; padding:9px 12px; border-radius:10px; background:var(--bg-1); color:var(--text-0); border:1px solid var(--panel-border); font-size:13px;">
            <option value="">All Events</option>
            <option value="true" ${recordsState.flood_occurred === 'true' ? 'selected' : ''}>🌊 Floods Only</option>
            <option value="false" ${recordsState.flood_occurred === 'false' ? 'selected' : ''}>☀️ Dry Only</option>
          </select>
        </div>

        <button class="btn btn-sm btn-ghost" onclick="exportRecordsCSV()" style="font-size:12px; padding:8px 12px; gap:6px;">
          ⬇ Export CSV
        </button>
        <button class="btn btn-sm btn-ghost" onclick="fetchRecordsPage(recordsState.page, true)" style="font-size:12px; padding:8px 12px;">
          ↻ Refresh
        </button>
      </div>

      <!-- Quick Summary Metric Counts -->
      <div id="recordsSummaryStats" style="display:flex; align-items:center; justify-content:space-between; margin-top:14px; padding-top:12px; border-top:1px solid var(--panel-border); font-size:12px; color:var(--text-1); flex-wrap:wrap; gap:8px;">
        <div>Matching Records: <b style="color:var(--cyber);" id="recTotalCount">Loading...</b></div>
        <div>Page: <b id="recPageDisplay">1 of 1</b></div>
      </div>
    </div>

    <!-- Records Table Container -->
    <div class="liquid-glass border-scale" style="padding:20px; overflow-x:auto;">
      <div id="recordsTableContainer">
        ${renderSkeletonTable({ rows: 10, cols: 7 })}
      </div>

      <!-- Pagination Footer -->
      <div id="recordsPaginationContainer" style="display:flex; align-items:center; justify-content:space-between; margin-top:18px; padding-top:14px; border-top:1px solid var(--panel-border); flex-wrap:wrap; gap:10px;">
        <div style="font-size:12px; color:var(--text-2);">
          Showing ${recordsState.limit} rows per page
        </div>
        <div style="display:flex; gap:8px;" id="recordsPaginationBtns"></div>
      </div>
    </div>

    <!-- Record Detail Modal -->
    <div class="modal-overlay" id="recordDetailModal">
      <div class="modal-card modal-lg">
        <button class="modal-close" onclick="closeRecordDetailModal()">✕</button>
        <div id="recordDetailModalBody"></div>
      </div>
    </div>
  `;

  fetchRecordsPage(recordsState.page);
}

function handleRecordsSearch(val) {
  clearTimeout(recordsSearchDebounce);
  recordsSearchDebounce = setTimeout(() => {
    recordsState.search = val.trim();
    recordsState.page = 1;
    fetchRecordsPage(1);
  }, 350);
}

function handleRecordsDistrictFilter(val) {
  recordsState.district = val;
  recordsState.page = 1;
  fetchRecordsPage(1);
}

function handleRecordsSeverityFilter(val) {
  recordsState.severity = val;
  recordsState.page = 1;
  fetchRecordsPage(1);
}

function handleRecordsOccurredFilter(val) {
  recordsState.flood_occurred = val;
  recordsState.page = 1;
  fetchRecordsPage(1);
}

async function fetchRecordsPage(page = 1, forceRefresh = false) {
  const container = document.getElementById('recordsTableContainer');
  const countEl = document.getElementById('recTotalCount');
  const pageEl = document.getElementById('recPageDisplay');
  if (!container) return;

  recordsState.isLoading = true;
  recordsState.page = page;

  const queryParams = new URLSearchParams({
    page: String(page),
    limit: String(recordsState.limit),
    sortBy: recordsState.sortBy,
    sortOrder: recordsState.sortOrder,
  });

  if (recordsState.search) queryParams.set('search', recordsState.search);
  if (recordsState.district) queryParams.set('district', recordsState.district);
  if (recordsState.severity) queryParams.set('severity', recordsState.severity);
  if (recordsState.flood_occurred) queryParams.set('flood_occurred', recordsState.flood_occurred);

  try {
    const data = await api(`/floods?${queryParams.toString()}`, 'GET', null, false);
    recordsState.records = data.records || [];
    recordsState.total = data.total || 0;
    recordsState.totalPages = data.totalPages || 1;

    if (countEl) countEl.textContent = `${recordsState.total.toLocaleString()} documents in MongoDB Atlas`;
    if (pageEl) pageEl.textContent = `${recordsState.page} of ${recordsState.totalPages}`;

    if (recordsState.records.length === 0) {
      container.innerHTML = renderEmptyState({
        icon: '📄',
        title: 'No Matching Flood Records',
        message: 'No records matched your search query or filter parameters in the database.',
        actionText: 'Clear Filters',
        actionFn: 'resetRecordsFilters()'
      });
      renderRecordsPagination();
      return;
    }

    container.innerHTML = `
      <table class="cmd-table" style="width:100%; border-collapse:collapse;">
        <thead>
          <tr>
            <th>Date</th>
            <th>District &amp; State</th>
            <th>Rainfall</th>
            <th>River Level</th>
            <th>Soil Moisture</th>
            <th>Severity</th>
            <th>Flood Outcome</th>
            <th style="text-align:right;">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${recordsState.records.map(r => {
            const dateStr = r.date ? new Date(r.date).toISOString().split('T')[0] : 'N/A';
            const col = r.flood_occurred ? 'var(--red)' : 'var(--ocean)';
            const sevCol = {
              'Severe': 'var(--red)',
              'High': 'var(--amber)',
              'Medium': '#FFD166',
              'Low': 'var(--ocean)',
              'None': 'var(--text-2)'
            }[r.flood_severity] || 'var(--text-1)';

            return `
              <tr>
                <td style="font-family:var(--font-mono); font-size:12px; color:var(--text-2);">${dateStr}</td>
                <td><b>${escapeHtml(r.district)}</b>, <span style="font-size:11px; color:var(--text-2);">${escapeHtml(r.state || 'India')}</span></td>
                <td style="font-family:var(--font-mono);">${r.rainfall_mm !== undefined ? r.rainfall_mm.toFixed(1) : '-'} mm</td>
                <td style="font-family:var(--font-mono);">${r.river_level_m !== undefined ? r.river_level_m.toFixed(2) : '-'} m</td>
                <td style="font-family:var(--font-mono);">${r.soil_moisture_pct !== undefined ? r.soil_moisture_pct.toFixed(0) : '-'}%</td>
                <td><span class="valtag" style="background:${sevCol}22; color:${sevCol}; border:1px solid ${sevCol}44;">${escapeHtml(r.flood_severity || 'None')}</span></td>
                <td>
                  <span class="valtag" style="background:${col}22; color:${col}; border:1px solid ${col}44;">
                    ${r.flood_occurred ? '🌊 INUNDATED' : '✓ NORMAL'}
                  </span>
                </td>
                <td style="text-align:right;">
                  <button class="btn btn-sm btn-ghost" onclick="inspectRecordDetail('${r._id}')" style="font-size:11px; padding:4px 8px;">
                    Inspect
                  </button>
                  ${(state.user?.role === 'admin' || state.user?.role === 'analyst') ? `
                    <button class="btn btn-sm btn-danger" onclick="deleteRecordPrompt('${r._id}', '${escapeHtml(r.district)}')" style="font-size:11px; padding:4px 8px;">
                      ✕
                    </button>
                  ` : ''}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;

    renderRecordsPagination();
  } catch (err) {
    container.innerHTML = renderErrorState({
      title: 'Historical Records Synchronization Offline',
      message: err.message,
      retryFn: `fetchRecordsPage(${page}, true)`
    });
  } finally {
    recordsState.isLoading = false;
  }
}

function renderRecordsPagination() {
  const container = document.getElementById('recordsPaginationBtns');
  if (!container) return;

  const cur = recordsState.page;
  const max = recordsState.totalPages;

  container.innerHTML = `
    <button class="btn btn-sm btn-ghost" onclick="fetchRecordsPage(1)" ${cur <= 1 ? 'disabled' : ''} style="font-size:11px;">⏮ First</button>
    <button class="btn btn-sm btn-ghost" onclick="fetchRecordsPage(${cur - 1})" ${cur <= 1 ? 'disabled' : ''} style="font-size:11px;">◀ Prev</button>
    <span style="font-family:var(--font-mono); font-size:12px; align-self:center; padding:0 6px;">Page ${cur} of ${max}</span>
    <button class="btn btn-sm btn-ghost" onclick="fetchRecordsPage(${cur + 1})" ${cur >= max ? 'disabled' : ''} style="font-size:11px;">Next ▶</button>
    <button class="btn btn-sm btn-ghost" onclick="fetchRecordsPage(${max})" ${cur >= max ? 'disabled' : ''} style="font-size:11px;">Last ⏭</button>
  `;
}

function resetRecordsFilters() {
  recordsState.search = '';
  recordsState.district = '';
  recordsState.severity = '';
  recordsState.flood_occurred = '';
  recordsState.page = 1;
  const s = document.getElementById('recSearchInput');
  const d = document.getElementById('recDistrictFilter');
  const sv = document.getElementById('recSeverityFilter');
  const oc = document.getElementById('recOccurredFilter');
  if (s) s.value = '';
  if (d) d.value = '';
  if (sv) sv.value = '';
  if (oc) oc.value = '';
  fetchRecordsPage(1);
}

async function inspectRecordDetail(recordId) {
  const modal = document.getElementById('recordDetailModal');
  const body = document.getElementById('recordDetailModalBody');
  if (!modal || !body) return;

  modal.classList.add('open');
  body.innerHTML = renderSkeletonCard({ title: 'Loading full record details from MongoDB Atlas...', height: '240px', lines: 5 });

  try {
    const r = await api(`/floods/${recordId}`, 'GET', null, false);
    const col = r.flood_occurred ? 'var(--red)' : 'var(--ocean)';

    body.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom:1px solid var(--panel-border); padding-bottom:12px;">
        <div>
          <div class="eyebrow" style="margin:0;">Record ID: ${escapeHtml(r._id)}</div>
          <h2 style="font-family:var(--font-display); font-size:20px; margin:4px 0 0;">
            ${escapeHtml(r.district)}, ${escapeHtml(r.state || 'India')}
          </h2>
        </div>
        <span class="valtag" style="background:${col}22; color:${col}; border:1px solid ${col}44; font-size:12px;">
          ${r.flood_occurred ? '🌊 INUNDATION EVENT' : '✓ NORMAL CONDITIONS'}
        </span>
      </div>

      <div class="grid-cards" style="grid-template-columns:repeat(3, 1fr); gap:12px; margin-bottom:18px;">
        <div class="glass" style="padding:12px;">
          <div style="font-size:11px; color:var(--text-2);">Date of Observation</div>
          <div style="font-family:var(--font-mono); font-size:14px; font-weight:bold; margin-top:4px;">${new Date(r.date).toLocaleDateString()}</div>
        </div>
        <div class="glass" style="padding:12px;">
          <div style="font-size:11px; color:var(--text-2);">24h Rainfall</div>
          <div style="font-family:var(--font-mono); font-size:14px; font-weight:bold; margin-top:4px;">${r.rainfall_mm} mm</div>
        </div>
        <div class="glass" style="padding:12px;">
          <div style="font-size:11px; color:var(--text-2);">River Stage</div>
          <div style="font-family:var(--font-mono); font-size:14px; font-weight:bold; margin-top:4px;">${r.river_level_m} m</div>
        </div>
        <div class="glass" style="padding:12px;">
          <div style="font-size:11px; color:var(--text-2);">Sea Level</div>
          <div style="font-family:var(--font-mono); font-size:14px; font-weight:bold; margin-top:4px;">${r.sea_level_m} m</div>
        </div>
        <div class="glass" style="padding:12px;">
          <div style="font-size:11px; color:var(--text-2);">Soil Moisture</div>
          <div style="font-family:var(--font-mono); font-size:14px; font-weight:bold; margin-top:4px;">${r.soil_moisture_pct}%</div>
        </div>
        <div class="glass" style="padding:12px;">
          <div style="font-size:11px; color:var(--text-2);">Reservoir Level</div>
          <div style="font-family:var(--font-mono); font-size:14px; font-weight:bold; margin-top:4px;">${r.reservoir_level_pct}%</div>
        </div>
        <div class="glass" style="padding:12px;">
          <div style="font-size:11px; color:var(--text-2);">Elevation</div>
          <div style="font-family:var(--font-mono); font-size:14px; font-weight:bold; margin-top:4px;">${r.elevation_m} m</div>
        </div>
        <div class="glass" style="padding:12px;">
          <div style="font-size:11px; color:var(--text-2);">Coast Distance</div>
          <div style="font-family:var(--font-mono); font-size:14px; font-weight:bold; margin-top:4px;">${r.distance_from_coast_km} km</div>
        </div>
        <div class="glass" style="padding:12px;">
          <div style="font-size:11px; color:var(--text-2);">Population Density</div>
          <div style="font-family:var(--font-mono); font-size:14px; font-weight:bold; margin-top:4px;">${r.population_density} /km²</div>
        </div>
      </div>

      <div style="padding:14px; border-radius:10px; background:var(--bg-1); border:1px solid var(--panel-border); font-size:12.5px; line-height:1.6;">
        <b>Socioeconomic Impact Data:</b><br/>
        Affected Population: <b>${(r.affected_population || 0).toLocaleString()}</b> · Fatalities: <b>${r.deaths || 0}</b><br/>
        Damage Cost: <b>₹${((r.damage_cost_inr || 0) / 1e7).toFixed(2)} Crores</b> · Avg Rescue Time: <b>${r.rescue_time_hrs || 0} hrs</b>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:16px;">
        <button class="btn btn-sm btn-ghost" onclick="closeRecordDetailModal()">Close</button>
        <button class="btn btn-sm btn-primary" onclick="assessDistrictFromRecord('${escapeHtml(r.district)}')">⚡ Predict for this District</button>
      </div>
    `;
  } catch (err) {
    body.innerHTML = renderErrorState({
      title: 'Failed to Load Record Details',
      message: err.message,
      retryFn: `inspectRecordDetail('${recordId}')`
    });
  }
}

function closeRecordDetailModal() {
  const modal = document.getElementById('recordDetailModal');
  if (modal) modal.classList.remove('open');
}

function assessDistrictFromRecord(district) {
  closeRecordDetailModal();
  predictInputs.district = district;
  goTo('predict');
}

async function deleteRecordPrompt(recordId, district) {
  if (!confirm(`Are you sure you want to permanently delete flood record ${recordId} for ${district} from MongoDB Atlas?`)) {
    return;
  }

  try {
    toast(`Deleting record ${recordId}...`);
    await api(`/floods/${recordId}`, 'DELETE', null, true);
    toast('✅ Record permanently deleted from MongoDB Atlas.');
    fetchRecordsPage(recordsState.page);
  } catch (err) {
    toast(`Delete failed: ${err.message}`);
  }
}

/**
 * Export matching flood dataset records to standard CSV file (Original Feature)
 */
function exportRecordsCSV() {
  const rows = (recordsState.records && recordsState.records.length > 0)
    ? recordsState.records
    : (typeof ROWS !== 'undefined' ? ROWS : []);

  if (rows.length === 0) {
    toast('No records available to export.');
    return;
  }

  try {
    const headers = ['date', 'district', 'state', 'rainfall_mm', 'river_level_m', 'sea_level_m', 'cyclone', 'damage_cost_inr', 'affected_population', 'deaths', 'flood_probability_pct', 'flood_severity'];
    const csvRows = [headers.join(',')];

    rows.forEach(r => {
      const rowVals = headers.map(h => {
        let val = r[h] !== undefined ? r[h] : '';
        if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
          val = `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      });
      csvRows.push(rowVals.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `flood_records_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast(`✅ Exported ${rows.length} flood records to CSV.`);
  } catch (err) {
    toast(`Export error: ${err.message}`);
  }
}

