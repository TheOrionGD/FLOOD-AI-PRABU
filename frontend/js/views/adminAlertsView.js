/**
 * adminAlertsView.js
 * Admin Workspace Screen 04 — Alert Operations Center
 * Connects to /api/alerts and /api/alerts/:id/resolve
 */

async function renderAdminAlerts(root) {
  root.innerHTML = `
    <div class="saas-page-container">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:14px;">
        <div>
          <span class="story-tag" style="color:var(--red); border-color:rgba(255,77,106,0.3); background:rgba(255,77,106,0.1);">
            ADMIN CLEARANCE LEVEL 3
          </span>
          <h1 style="font-family:var(--font-display); font-size:28px; font-weight:700; margin-top:6px;">
            Alert Operations Center
          </h1>
          <p style="font-size:13.5px; color:var(--text-secondary);">
            Emergency disaster broadcasts, channel delivery health, and active incident resolution.
          </p>
        </div>

        <button class="glass-btn btn-danger" onclick="toggleAdminNewAlertForm()" style="gap:6px;">
          <span>🚨</span> Dispatch New Alert
        </button>
      </div>

      <!-- Acoustic Civil Siren Dispatch Console -->
      <div class="glass-card elevated border-lightning" style="padding:20px 24px; margin-bottom:24px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px;">
          <div>
            <div style="font-size:15px; font-weight:700; color:var(--text-0); display:flex; align-items:center; gap:8px;">
              <span>🚨</span> Civil Defense Acoustic Siren Station Test
            </div>
            <div style="font-size:12px; color:var(--text-2); margin-top:2px;">
              Verify local station and mobile unit acoustic warning transducers.
            </div>
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button class="glass-btn btn-ghost" onclick="testSound('yellow')" style="font-size:11.5px;">Test Advisory ⚠️</button>
            <button class="glass-btn btn-danger" onclick="testSound('red')" style="font-size:11.5px;">Sound Siren 🚨</button>
            <button class="glass-btn btn-ghost" onclick="AlertSound.stop(); toast('Siren silenced');" style="font-size:11.5px; color:var(--text-2);">Stop ⏹</button>
          </div>
        </div>
      </div>

      <!-- New Alert Form Accordion -->
      <div id="adminNewAlertCard" class="glass-card elevated border-lightning-danger" style="display:none; padding:28px; margin-bottom:28px;">
        <h3 style="font-size:18px; font-weight:700; margin-bottom:14px; color:var(--red);">
          Broadcast Emergency Civil Defense Alert
        </h3>
        <form onsubmit="submitAdminAlert(event)" style="display:flex; flex-direction:column; gap:14px;">
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
            <div class="field">
              <label>Target Sector / District</label>
              <select class="glass-select" id="newAlertLocation" required>
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

            <div class="field">
              <label>Threat Level Severity</label>
              <select class="glass-select" id="newAlertLevel">
                <option value="Red">Red (Immediate Evacuation / Severe Flood)</option>
                <option value="Orange">Orange (High Threat / Flash Flood Warning)</option>
                <option value="Yellow">Yellow (Moderate Advisory / Watch)</option>
                <option value="Green">Green (Informational Notice)</option>
              </select>
            </div>
          </div>

          <div class="field">
            <label>Emergency Message Directives</label>
            <textarea class="glass-input" id="newAlertMsg" rows="3" required placeholder="Evacuate low-lying river margins immediately. Emergency shelters open at Sector 4 Stadium."></textarea>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:8px;">
            <button type="button" class="glass-btn btn-ghost" onclick="toggleAdminNewAlertForm()">Cancel</button>
            <button type="submit" class="glass-btn btn-danger" style="gap:6px;">
              <span>⚡ Confirm Multi-Channel Dispatch</span>
            </button>
          </div>
        </form>
      </div>

      <div id="adminAlertsListWrap">
        <div class="glass-card" style="padding:36px; text-align:center;">
          <span class="spin-anim" style="font-size:22px; color:var(--accent-primary);">⚡</span>
          <div style="font-size:13px; color:var(--text-muted); margin-top:8px;">Loading alert operations log...</div>
        </div>
      </div>
    </div>
  `;

  await _loadAdminAlertsList();
}

function toggleAdminNewAlertForm() {
  const card = document.getElementById('adminNewAlertCard');
  if (card) card.style.display = card.style.display === 'none' ? 'block' : 'none';
}

async function _loadAdminAlertsList() {
  const wrap = document.getElementById('adminAlertsListWrap');
  if (!wrap) return;

  try {
    const alerts = await api('/alerts');
    
    if (!alerts || alerts.length === 0) {
      wrap.innerHTML = `
        <div class="glass-card elevated" style="padding:48px; text-align:center;">
          <div style="font-size:36px; margin-bottom:12px;">🛡️</div>
          <h3 style="font-size:18px; font-weight:700; margin-bottom:6px;">No Active Dispatches</h3>
          <p style="font-size:13.5px; color:var(--text-muted);">All monitored sectors are operating under normal conditions.</p>
        </div>
      `;
      return;
    }

    wrap.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:16px;">
        ${alerts.map(a => `
          <div class="glass-card elevated" style="border-left:4px solid ${a.level === 'Red' ? 'var(--red)' : (a.level === 'Orange' ? 'var(--amber)' : 'var(--ocean)')}; padding:22px 24px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; flex-wrap:wrap; gap:10px;">
              <div>
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:4px;">
                  <span class="glass-badge" style="background:${a.level === 'Red' ? 'rgba(255,77,106,0.18)' : 'rgba(255,184,77,0.18)'}; color:${a.level === 'Red' ? 'var(--red)' : 'var(--amber)'}; font-family:var(--font-mono); font-size:11px;">
                    ● ${a.level.toUpperCase()} WARNING
                  </span>
                  <h3 style="font-size:17px; font-weight:700; margin:0;">${escapeHtml(a.location)}</h3>
                </div>
                <div style="font-size:12px; color:var(--text-muted);">
                  Dispatched: ${new Date(a.createdAt).toLocaleString()} • Incident ID: <code style="font-family:var(--font-mono);">${a._id}</code>
                </div>
              </div>

              ${a.active ? `
                <button class="glass-btn btn-ghost" onclick="resolveAdminAlert('${a._id}')" style="font-size:12px; color:var(--ocean); border-color:rgba(31,224,168,0.3); gap:6px;">
                  <span>✓</span> Resolve Alert
                </button>
              ` : `
                <span class="glass-badge" style="background:rgba(255,255,255,0.06); color:var(--text-muted);">RESOLVED</span>
              `}
            </div>

            <p style="font-size:14px; color:var(--text-primary); line-height:1.6; margin-bottom:16px;">
              ${escapeHtml(a.message)}
            </p>

            <div style="display:flex; gap:16px; font-size:12px; color:var(--text-muted); font-family:var(--font-mono); border-top:1px solid rgba(255,255,255,0.05); padding-top:12px;">
              <span>FCM Push: <b style="color:var(--ocean);">Delivered</b></span>
              <span>•</span>
              <span>Brevo Email: <b style="color:var(--ocean);">Sent</b></span>
              <span>•</span>
              <span>SMS Gateway: <b style="color:var(--ocean);">Active</b></span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (err) {
    wrap.innerHTML = `
      <div class="glass-card" style="padding:28px; border-color:var(--red); color:var(--red); text-align:center;">
        Failed to fetch alerts: ${escapeHtml(err.message)}
      </div>
    `;
  }
}

async function resolveAdminAlert(alertId) {
  if (!confirm(`Mark alert ${alertId} as resolved?`)) return;
  try {
    await api(`/alerts/${alertId}/resolve`, 'PUT');
    toast('✅ Emergency alert resolved.');
    _loadAdminAlertsList();
  } catch (err) {
    toast(`Failed to resolve: ${err.message}`);
  }
}

async function submitAdminAlert(e) {
  e.preventDefault();
  const location = document.getElementById('newAlertLocation')?.value;
  const level = document.getElementById('newAlertLevel')?.value;
  const message = document.getElementById('newAlertMsg')?.value;

  try {
    await api('/alerts', 'POST', { location, level, message });
    toast('🚨 Alert dispatched across all configured channels.');
    toggleAdminNewAlertForm();
    _loadAdminAlertsList();
  } catch (err) {
    toast(`Dispatch failed: ${err.message}`);
  }
}
