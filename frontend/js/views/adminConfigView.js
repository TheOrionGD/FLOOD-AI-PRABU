/**
 * adminConfigView.js
 * Admin Workspace Screen 03 — System Configuration
 * Connects to /api/admin/config
 */

async function renderAdminConfig(root) {
  root.innerHTML = `
    <div class="saas-page-container" style="max-width:980px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:14px;">
        <div>
          <span class="story-tag" style="color:var(--red); border-color:rgba(255,77,106,0.3); background:rgba(255,77,106,0.1);">
            ADMIN CLEARANCE LEVEL 3
          </span>
          <h1 style="font-family:var(--font-display); font-size:28px; font-weight:700; margin-top:6px;">
            System Configuration &amp; Thresholds
          </h1>
          <p style="font-size:13.5px; color:var(--text-secondary);">
            Dynamic operational boundaries, alert radius limits, and dispatch channels.
          </p>
        </div>
      </div>

      <div id="adminConfigContent">
        <div class="glass-card" style="padding:36px; text-align:center;">
          <span class="spin-anim" style="font-size:22px; color:var(--accent-primary);">⚡</span>
          <div style="font-size:13px; color:var(--text-muted); margin-top:8px;">Fetching system configuration...</div>
        </div>
      </div>
    </div>
  `;

  try {
    const config = await api('/admin/config');
    const container = document.getElementById('adminConfigContent');
    if (!container) return;

    container.innerHTML = `
      <form onsubmit="saveAdminConfig(event)" style="display:flex; flex-direction:column; gap:24px;">
        
        <!-- Operational Safeguards -->
        <div class="glass-card elevated" style="padding:28px;">
          <h3 style="font-size:16px; font-weight:700; margin-bottom:16px; display:flex; align-items:center; gap:8px;">
            <span>🛡️</span> Autonomous Dispatch &amp; Safety Guards
          </h3>

          <div style="display:flex; flex-direction:column; gap:16px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div>
                <div style="font-size:13.5px; font-weight:600;">Automated Threat Dispatch</div>
                <div style="font-size:12px; color:var(--text-muted);">Automatically broadcast FCM push and SMS when high risk is detected.</div>
              </div>
              <label class="glass-switch">
                <input type="checkbox" id="cfg_autoThreatDispatch" ${config.autoThreatDispatch ? 'checked' : ''}>
                <span class="glass-switch-slider"></span>
              </label>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div>
                <div style="font-size:13.5px; font-weight:600;">Maintenance Mode</div>
                <div style="font-size:12px; color:var(--text-muted);">Temporarily restrict public API access to authenticated admins only.</div>
              </div>
              <label class="glass-switch">
                <input type="checkbox" id="cfg_maintenanceMode" ${config.maintenanceMode ? 'checked' : ''}>
                <span class="glass-switch-slider"></span>
              </label>
            </div>
          </div>
        </div>

        <!-- ML Inference Engine Defaults -->
        <div class="glass-card elevated" style="padding:28px;">
          <h3 style="font-size:16px; font-weight:700; margin-bottom:16px; display:flex; align-items:center; gap:8px;">
            <span>🧪</span> Machine Learning Engine Routing
          </h3>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
            <div class="field">
              <label>Default Inference Engine</label>
              <select class="glass-select" id="cfg_defaultEngine">
                <option value="xgboost" ${config.defaultInferenceEngine === 'xgboost' ? 'selected' : ''}>XGBoost Gradient Boosting</option>
                <option value="random_forest" ${config.defaultInferenceEngine === 'random_forest' ? 'selected' : ''}>Random Forest Ensemble</option>
              </select>
            </div>

            <div class="field">
              <label>Maximum Emergency Radius Ceiling</label>
              <input type="number" class="glass-input" id="cfg_maxRadius" min="50" max="500" value="${config.maxAlertRadiusKm || 250}">
              <div style="font-size:11px; color:var(--text-muted); margin-top:4px;">Maximum permissible alert perimeter in kilometers.</div>
            </div>
          </div>
        </div>

        <!-- Notification Channels Status -->
        <div class="glass-card elevated" style="padding:28px;">
          <h3 style="font-size:16px; font-weight:700; margin-bottom:16px; display:flex; align-items:center; gap:8px;">
            <span>📢</span> Global Alert Delivery Gateways
          </h3>

          <div style="display:flex; flex-direction:column; gap:12px;">
            <label class="glass-checkbox-wrap">
              <input type="checkbox" id="cfg_ch_fcm" ${config.notificationChannels?.fcmWebPush ? 'checked' : ''}>
              <span>Firebase Cloud Messaging (FCM Web Push Service Worker)</span>
            </label>

            <label class="glass-checkbox-wrap">
              <input type="checkbox" id="cfg_ch_brevo" ${config.notificationChannels?.brevoEmail ? 'checked' : ''}>
              <span>Brevo Transactional Email Gateway</span>
            </label>

            <label class="glass-checkbox-wrap">
              <input type="checkbox" id="cfg_ch_sms" ${config.notificationChannels?.smsProvider ? 'checked' : ''}>
              <span>Carrier SMS Emergency Broadcast Dispatcher</span>
            </label>
          </div>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:12px;">
          <button type="submit" class="glass-btn btn-primary" style="padding:12px 28px;">
            Save Operational Configuration ✓
          </button>
        </div>
      </form>
    `;
  } catch (err) {
    const container = document.getElementById('adminConfigContent');
    if (container) {
      container.innerHTML = `
        <div class="glass-card" style="padding:28px; border-color:var(--red); color:var(--red); text-align:center;">
          Failed to load configuration: ${escapeHtml(err.message)}
        </div>
      `;
    }
  }
}

async function saveAdminConfig(e) {
  e.preventDefault();
  const autoThreatDispatch = document.getElementById('cfg_autoThreatDispatch')?.checked;
  const maintenanceMode = document.getElementById('cfg_maintenanceMode')?.checked;
  const defaultInferenceEngine = document.getElementById('cfg_defaultEngine')?.value;
  const maxAlertRadiusKm = document.getElementById('cfg_maxRadius')?.value;
  const notificationChannels = {
    fcmWebPush: document.getElementById('cfg_ch_fcm')?.checked,
    brevoEmail: document.getElementById('cfg_ch_brevo')?.checked,
    smsProvider: document.getElementById('cfg_ch_sms')?.checked,
  };

  try {
    const res = await api('/admin/config', 'PUT', {
      autoThreatDispatch,
      maintenanceMode,
      defaultInferenceEngine,
      maxAlertRadiusKm,
      notificationChannels,
    });
    toast('✅ System configuration updated successfully');
  } catch (err) {
    toast(`Failed to update config: ${err.message}`);
  }
}
