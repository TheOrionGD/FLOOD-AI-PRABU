/**
 * residentActivityView.js
 * Resident Workspace Screen 05 — Saved Locations & Personal Activity
 * Connects to /api/auth/preferences for user-isolated saved locations
 */

async function renderResidentActivity(root) {
  root.innerHTML = `
    <div class="saas-page-container">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:14px;">
        <div>
          <span class="story-tag" style="color:var(--ocean); border-color:rgba(31,224,168,0.3); background:rgba(31,224,168,0.1);">
            CITIZEN SAFETY HUB • BOOKMARKS
          </span>
          <h1 style="font-family:var(--font-display); font-size:28px; font-weight:700; margin-top:6px;">
            Saved Locations &amp; Risk Bookmarks
          </h1>
          <p style="font-size:13.5px; color:var(--text-secondary);">
            Monitor multiple personal locations (residence, workplace, family home) for localized flood danger.
          </p>
        </div>

        <button class="glass-btn btn-primary" onclick="toggleAddLocationForm()" style="gap:6px;">
          <span>➕</span> Add Saved Location
        </button>
      </div>

      <!-- Add Location Form -->
      <div id="addLocationCard" class="glass-card elevated border-lightning" style="display:none; padding:24px; margin-bottom:28px;">
        <h3 style="font-size:17px; font-weight:700; margin-bottom:14px;">Add Monitored Location</h3>
        <form onsubmit="saveNewLocationBookmark(event)" style="display:flex; flex-direction:column; gap:14px;">
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
            <div class="field">
              <label>Location Nickname</label>
              <input type="text" class="glass-input" id="newLocName" required placeholder="e.g. Primary Residence / Office">
            </div>
            <div class="field">
              <label>Associated Disaster Sector</label>
              <select class="glass-select" id="newLocDistrict">
                <option value="Chennai">Chennai, Tamil Nadu</option>
                <option value="Mumbai">Mumbai, Maharashtra</option>
                <option value="Kolkata">Kolkata, West Bengal</option>
                <option value="Bhubaneswar">Bhubaneswar, Odisha</option>
                <option value="Guwahati">Guwahati, Assam</option>
                <option value="Patna">Patna, Bihar</option>
                <option value="Surat">Surat, Gujarat</option>
                <option value="Kochi">Kochi, Kerala</option>
                <option value="Visakhapatnam">Visakhapatnam, Andhra Pradesh</option>
                <option value="Hosur">Hosur, Tamil Nadu</option>
              </select>
            </div>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:10px;">
            <button type="button" class="glass-btn btn-ghost" onclick="toggleAddLocationForm()">Cancel</button>
            <button type="submit" class="glass-btn btn-primary">Save Location ✓</button>
          </div>
        </form>
      </div>

      <div id="residentSavedLocationsWrap">
        <div class="glass-card" style="padding:36px; text-align:center;">
          <span class="spin-anim" style="font-size:22px; color:var(--accent-primary);">⚡</span>
          <div style="font-size:13px; color:var(--text-muted); margin-top:8px;">Fetching saved location bookmarks...</div>
        </div>
      </div>
    </div>
  `;

  await _loadResidentLocationsList();
}

function toggleAddLocationForm() {
  const card = document.getElementById('addLocationCard');
  if (card) card.style.display = card.style.display === 'none' ? 'block' : 'none';
}

async function _loadResidentLocationsList() {
  const wrap = document.getElementById('residentSavedLocationsWrap');
  if (!wrap) return;

  const prefs = state.user?.preferences || {};
  let savedLocations = prefs.savedLocations || [];

  if (savedLocations.length === 0) {
    wrap.innerHTML = `
      <div class="glass-card elevated" style="padding:48px; text-align:center;">
        <div style="font-size:36px; margin-bottom:12px;">📍</div>
        <h3 style="font-size:18px; font-weight:700; margin-bottom:6px;">No Saved Locations Bookmarked</h3>
        <p style="font-size:13.5px; color:var(--text-muted); max-width:480px; margin:0 auto 20px;">
          Bookmark your primary residence, workplace, or family home to monitor localized flood danger.
        </p>
        <button class="glass-btn btn-primary" onclick="toggleAddLocationForm()" style="gap:6px; margin:0 auto;">
          <span>➕</span> Add Your First Location
        </button>
      </div>
    `;
    return;
  }

  wrap.innerHTML = `
    <div class="grid-cards" style="grid-template-columns:repeat(2,1fr); gap:20px;">
      ${savedLocations.map((loc, idx) => `
        <div class="glass-card elevated" style="padding:24px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="font-size:24px;">⭐</span>
              <div>
                <h3 style="font-size:17px; font-weight:700; margin:0;">${escapeHtml(loc.name)}</h3>
                <div style="font-size:12px; color:var(--text-muted);">${escapeHtml(loc.district)} Basin</div>
              </div>
            </div>
            <button class="glass-btn btn-ghost" onclick="deleteSavedLocationBookmark(${idx})" style="padding:4px 8px; font-size:12px; color:var(--red);" title="Remove bookmark">
              ✕
            </button>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.06); padding-top:14px; margin-top:14px;">
            <span class="glass-badge" style="background:rgba(31,224,168,0.12); color:var(--ocean); font-family:var(--font-mono); font-size:11px;">
              ● TELEMETRY MONITORED
            </span>
            <button class="glass-btn btn-ghost" onclick="quickCheckLocationRisk('${loc.district}')" style="font-size:12px; gap:4px;">
              <span>⚡</span> Check Risk →
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

async function saveNewLocationBookmark(e) {
  e.preventDefault();
  const name = document.getElementById('newLocName')?.value.trim();
  const district = document.getElementById('newLocDistrict')?.value;

  if (!name) return;

  const currentPrefs = state.user?.preferences || {};
  const currentSaved = currentPrefs.savedLocations || [];
  currentSaved.push({ name, district, latitude: 13.08, longitude: 80.27 });

  try {
    const res = await api('/auth/preferences', 'PUT', { savedLocations: currentSaved });
    if (state.user) {
      state.user.preferences = res.preferences;
      localStorage.setItem('floodai-user', JSON.stringify(state.user));
    }
    toast(`✅ Location "${name}" saved to monitoring list.`);
    toggleAddLocationForm();
    await _loadResidentLocationsList();
  } catch (err) {
    toast(`Failed to save: ${err.message}`);
  }
}

async function deleteSavedLocationBookmark(idx) {
  const currentPrefs = state.user?.preferences || {};
  const currentSaved = currentPrefs.savedLocations || [];
  currentSaved.splice(idx, 1);

  try {
    const res = await api('/auth/preferences', 'PUT', { savedLocations: currentSaved });
    if (state.user) {
      state.user.preferences = res.preferences;
      localStorage.setItem('floodai-user', JSON.stringify(state.user));
    }
    toast('Location bookmark removed.');
    await _loadResidentLocationsList();
  } catch (err) {
    toast(`Failed to remove: ${err.message}`);
  }
}

function quickCheckLocationRisk(district) {
  portalSelectedDistrict = district;
  if (typeof GeoLocationService !== 'undefined' && GeoLocationService.selectManualDistrict) {
    GeoLocationService.selectManualDistrict(district);
  } else if (typeof AppStore !== 'undefined' && AppStore.syncLocation) {
    AppStore.syncLocation({ district });
  }
  goTo('resident-risk');
}

