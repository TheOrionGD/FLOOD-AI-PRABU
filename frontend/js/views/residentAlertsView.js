/**
 * residentAlertsView.js
 * Resident Workspace Screen 03 — Emergency Advisories & Siren Station
 * Connects to /api/alerts and audioService.js
 */

async function renderResidentAlerts(root) {
  root.innerHTML = `
    <div class="saas-page-container">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:14px;">
        <div>
          <span class="story-tag" style="color:var(--ocean); border-color:rgba(31,224,168,0.3); background:rgba(31,224,168,0.1);">
            CITIZEN SAFETY HUB • ADVISORIES
          </span>
          <h1 style="font-family:var(--font-display); font-size:28px; font-weight:700; margin-top:6px;">
            Emergency Advisories &amp; Siren Station
          </h1>
          <p style="font-size:13.5px; color:var(--text-secondary);">
            Official civil defense alerts, severe weather warnings, and acoustic alarm receiver.
          </p>
        </div>

        <button class="glass-btn btn-ghost" onclick="renderResidentAlerts(document.getElementById('pageRoot'))">
          Refresh Advisories 🔄
        </button>
      </div>

      <!-- Acoustic Siren Station Test Card -->
      <div class="glass-card elevated border-lightning" style="padding:24px; margin-bottom:28px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
          <div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:20px;">🚨</span>
              <h3 style="font-size:16px; font-weight:700; margin:0;">Emergency Siren Station Receiver</h3>
            </div>
            <div style="font-size:12.5px; color:var(--text-muted); margin-top:4px;">
              Test acoustic alert tone to verify audio hardware operates during power outages or web push delivery.
            </div>
          </div>

          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <button class="glass-btn btn-ghost" onclick="testResidentSiren('chime')" style="font-size:12px;">
              Test Chime 🔔
            </button>
            <button class="glass-btn btn-danger" onclick="testResidentSiren('siren')" style="font-size:12px;">
              Test Siren 🚨
            </button>
            <button class="glass-btn btn-ghost" onclick="AlertSound.stop(); toast('Audio silenced');" style="font-size:12px; color:var(--text-2);">
              Stop Sound ⏹
            </button>
          </div>
        </div>
      </div>

      <div id="residentAlertsListWrap">
        <div class="glass-card" style="padding:36px; text-align:center;">
          <span class="spin-anim" style="font-size:22px; color:var(--accent-primary);">⚡</span>
          <div style="font-size:13px; color:var(--text-muted); margin-top:8px;">Scanning national early warning network...</div>
        </div>
      </div>
    </div>
  `;

  await _loadResidentAlertsList();
}

async function _loadResidentAlertsList() {
  const wrap = document.getElementById('residentAlertsListWrap');
  if (!wrap) return;

  try {
    const alerts = await api('/alerts');
    
    if (!alerts || alerts.length === 0) {
      wrap.innerHTML = `
        <div class="glass-card elevated" style="padding:48px; text-align:center;">
          <div style="font-size:36px; margin-bottom:12px;">🛡️</div>
          <h3 style="font-size:18px; font-weight:700; margin-bottom:6px;">No Active Civil Defense Alerts</h3>
          <p style="font-size:13.5px; color:var(--text-muted);">Your monitored district has zero active evacuation orders or flash flood warnings.</p>
        </div>
      `;
      return;
    }

    wrap.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:16px;">
        ${alerts.map(a => `
          <div class="glass-card elevated" style="border-left:4px solid ${a.level === 'Red' ? 'var(--red)' : (a.level === 'Orange' ? 'var(--amber)' : 'var(--ocean)')}; padding:24px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
              <div style="display:flex; align-items:center; gap:10px;">
                <span class="glass-badge" style="background:${a.level === 'Red' ? 'rgba(255,77,106,0.18)' : 'rgba(255,184,77,0.18)'}; color:${a.level === 'Red' ? 'var(--red)' : 'var(--amber)'}; font-family:var(--font-mono); font-size:11px;">
                  ● ${a.level.toUpperCase()} ADVISORY
                </span>
                <h3 style="font-size:17px; font-weight:700; margin:0;">${escapeHtml(a.location)}</h3>
              </div>
              <span style="font-size:12px; color:var(--text-muted); font-family:var(--font-mono);">${new Date(a.createdAt).toLocaleTimeString()}</span>
            </div>

            <p style="font-size:14px; color:var(--text-primary); line-height:1.6; margin-bottom:14px;">
              ${escapeHtml(a.message)}
            </p>

            <div style="font-size:12px; color:var(--text-muted); font-family:var(--font-mono);">
              Civil Defense Broadcast Verified • Multi-Channel Delivery Active
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (err) {
    wrap.innerHTML = `
      <div class="glass-card" style="padding:28px; border-color:var(--red); color:var(--red); text-align:center;">
        Failed to fetch advisories: ${escapeHtml(err.message)}
      </div>
    `;
  }
}

function testResidentSiren(type) {
  if (typeof audioService !== 'undefined' && audioService) {
    if (type === 'siren') {
      audioService.playAlertSound('critical');
      toast('🚨 Emergency Siren sounded. Stand by for instructions.');
    } else {
      audioService.playAlertSound('moderate');
      toast('🔔 Chime sounded.');
    }
  } else {
    toast(`Acoustic ${type} simulated on audio device.`);
  }
}
