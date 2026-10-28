/**
 * settingsView.js
 * Comprehensive Settings Center with 8 Structured Categories (A through H)
 * Persists preferences across localStorage and /api/auth/preferences
 */

let _activeSettingsTab = 'appearance';

function renderSettings(root) {
  const user = state.user || {};
  const prefs = user.preferences || {};
  const channels = prefs.channels || { fcm: true, email: true, sms: false };

  root.innerHTML = `
    <div class="saas-page-container" style="max-width:1100px;">
      
      <!-- Top Title -->
      <div style="margin-bottom:28px;">
        <span class="story-tag" style="color:var(--accent-primary); border-color:rgba(51,199,255,0.3); background:rgba(51,199,255,0.1);">
          SYSTEM CONFIGURATION &amp; PREFERENCES
        </span>
        <h1 style="font-family:var(--font-display); font-size:28px; font-weight:700; margin-top:6px;">
          Comprehensive Settings Center
        </h1>
        <p style="font-size:13.5px; color:var(--text-secondary);">
          Configure appearance, regional preferences, emergency notification channels, and security settings.
        </p>
      </div>

      <div class="settings-layout-grid" style="display:grid; grid-template-columns:260px 1fr; gap:28px; align-items:flex-start;">
        
        <!-- Category Sidebar Navigation -->
        <div class="glass-card elevated settings-category-nav" style="padding:16px 12px; display:flex; flex-direction:column; gap:4px;">
          <div class="sidebar-item ${_activeSettingsTab === 'appearance' ? 'active' : ''}" onclick="switchSettingsTab('appearance')">
            <span class="sidebar-icon">🎨</span> A. Appearance
          </div>
          <div class="sidebar-item ${_activeSettingsTab === 'language' ? 'active' : ''}" onclick="switchSettingsTab('language')">
            <span class="sidebar-icon">🌐</span> B. Language &amp; Regional
          </div>
          <div class="sidebar-item ${_activeSettingsTab === 'location' ? 'active' : ''}" onclick="switchSettingsTab('location')">
            <span class="sidebar-icon">📍</span> C. Location &amp; Privacy
          </div>
          <div class="sidebar-item ${_activeSettingsTab === 'notifications' ? 'active' : ''}" onclick="switchSettingsTab('notifications')">
            <span class="sidebar-icon">📢</span> D. Notifications
          </div>
          <div class="sidebar-item ${_activeSettingsTab === 'weather' ? 'active' : ''}" onclick="switchSettingsTab('weather')">
            <span class="sidebar-icon">🌦️</span> E. Weather &amp; Flood-Risk
          </div>
          <div class="sidebar-item ${_activeSettingsTab === 'security' ? 'active' : ''}" onclick="switchSettingsTab('security')">
            <span class="sidebar-icon">🔒</span> F. Security &amp; Account
          </div>
          <div class="sidebar-item ${_activeSettingsTab === 'accessibility' ? 'active' : ''}" onclick="switchSettingsTab('accessibility')">
            <span class="sidebar-icon">♿</span> G. Accessibility
          </div>
          <div class="sidebar-item ${_activeSettingsTab === 'about' ? 'active' : ''}" onclick="switchSettingsTab('about')">
            <span class="sidebar-icon">ℹ️</span> H. Application Information
          </div>
        </div>

        <!-- Main Category Settings Content -->
        <div id="settingsCategoryContent">
          <!-- Rendered dynamically -->
        </div>

      </div>

    </div>
  `;

  renderActiveSettingsTab();
}

function switchSettingsTab(tab) {
  _activeSettingsTab = tab;
  renderSettings(document.getElementById('pageRoot'));
}

function renderActiveSettingsTab() {
  const container = document.getElementById('settingsCategoryContent');
  if (!container) return;

  const user = state.user || {};
  const prefs = user.preferences || {};
  const channels = prefs.channels || { fcm: true, email: true, sms: false };

  if (_activeSettingsTab === 'appearance') {
    container.innerHTML = `
      <div class="glass-card elevated" style="padding:32px;">
        <h3 style="font-size:18px; font-weight:700; margin-bottom:18px;">A. Appearance &amp; Design System</h3>
        
        <div style="display:flex; flex-direction:column; gap:20px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:14px; font-weight:600;">Color Mode</div>
              <div style="font-size:12px; color:var(--text-muted);">Toggle between dark bathymetric glass and light frosted surfaces.</div>
            </div>
            <select class="glass-select" onchange="setProfileTheme(this.value)">
              <option value="dark" ${state.theme === 'dark' ? 'selected' : ''}>Dark Mode</option>
              <option value="light" ${state.theme === 'light' ? 'selected' : ''}>Light Mode</option>
            </select>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:14px; font-weight:600;">Accent Colour Theme</div>
              <div style="font-size:12px; color:var(--text-muted);">Choose one of 7 curated accent color themes.</div>
            </div>
            <select class="glass-select" onchange="setAppAccent(this.value); renderSettings(document.getElementById('pageRoot'));">
              <option value="ocean" ${state.accent === 'ocean' ? 'selected' : ''}>Ocean Cyan</option>
              <option value="electric" ${state.accent === 'electric' ? 'selected' : ''}>Electric Blue</option>
              <option value="emerald" ${state.accent === 'emerald' ? 'selected' : ''}>Emerald</option>
              <option value="violet" ${state.accent === 'violet' ? 'selected' : ''}>Violet</option>
              <option value="amber" ${state.accent === 'amber' ? 'selected' : ''}>Amber</option>
              <option value="coral" ${state.accent === 'coral' ? 'selected' : ''}>Coral</option>
              <option value="rose" ${state.accent === 'rose' ? 'selected' : ''}>Rose</option>
            </select>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:14px; font-weight:600;">Atmospheric Weather Particle Canvas</div>
              <div style="font-size:12px; color:var(--text-muted);">Render GPU-accelerated rainfall and atmospheric particles.</div>
            </div>
            <label class="glass-switch">
              <input type="checkbox" checked onchange="toggleAtmosphereParticles(this.checked)">
              <span class="glass-switch-slider"></span>
            </label>
          </div>
        </div>
      </div>
    `;
  } else if (_activeSettingsTab === 'language') {
    container.innerHTML = `
      <div class="glass-card elevated" style="padding:32px;">
        <h3 style="font-size:18px; font-weight:700; margin-bottom:18px;">B. Language &amp; Regional Preferences</h3>
        
        <div style="display:flex; flex-direction:column; gap:20px;">
          <div class="field">
            <label>Platform Language</label>
            <select class="glass-select" onchange="setAppLanguage(this.value); renderSettings(document.getElementById('pageRoot'));">
              <option value="en" ${state.language === 'en' ? 'selected' : ''}>English (Global / US)</option>
              <option value="hi" ${state.language === 'hi' ? 'selected' : ''}>Hindi (हिंदी)</option>
              <option value="ta" ${state.language === 'ta' ? 'selected' : ''}>Tamil (தமிழ்)</option>
              <option value="bn" ${state.language === 'bn' ? 'selected' : ''}>Bengali (বাংলা)</option>
              <option value="es" ${state.language === 'es' ? 'selected' : ''}>Spanish (Español)</option>
              <option value="fr" ${state.language === 'fr' ? 'selected' : ''}>French (Français)</option>
            </select>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
            <div class="field">
              <label>Measurement Units</label>
              <select class="glass-select">
                <option value="metric" selected>Metric (mm, meters, °C, km/h)</option>
                <option value="imperial">Imperial (inches, feet, °F, mph)</option>
              </select>
            </div>
            <div class="field">
              <label>Time Format</label>
              <select class="glass-select">
                <option value="24h" selected>24-Hour Military (14:30)</option>
                <option value="12h">12-Hour AM/PM (2:30 PM)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    `;
  } else if (_activeSettingsTab === 'location') {
    container.innerHTML = `
      <div class="glass-card elevated" style="padding:32px;">
        <h3 style="font-size:18px; font-weight:700; margin-bottom:18px;">C. Location &amp; Privacy Safeguards</h3>
        
        <div style="display:flex; flex-direction:column; gap:18px;">
          <div style="padding:14px; border-radius:10px; background:rgba(31,224,168,0.08); border:1px solid rgba(31,224,168,0.25); font-size:12.5px; line-height:1.6; color:var(--text-secondary);">
            <b>Privacy Guarantee:</b> Precise GPS coordinates are processed solely on the client to calculate danger distances. We never record or commercialize personal movement trails.
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:14px; font-weight:600;">Client-Side GPS Triangulation</div>
              <div style="font-size:12px; color:var(--text-muted);">Current Status: ${state.userLocation ? 'Acquired via Browser' : 'Manual Sector Selected'}</div>
            </div>
            <button class="glass-btn btn-ghost" onclick="requestGpsRefresh()" style="font-size:12px;">
              Refresh GPS Coordinates 🛰️
            </button>
          </div>
        </div>
      </div>
    `;
  } else if (_activeSettingsTab === 'notifications') {
    container.innerHTML = `
      <div class="glass-card elevated" style="padding:32px;">
        <h3 style="font-size:18px; font-weight:700; margin-bottom:18px;">D. Emergency Notification Channels</h3>
        
        <div style="display:flex; flex-direction:column; gap:18px;">
          <div class="field">
            <label style="display:flex; justify-content:space-between;">
              <span>Alert Perimeter Radius:</span> <b id="val_set_rad" style="color:var(--accent-primary); font-family:var(--font-mono);">${prefs.alertRadiusKm || 50} km</b>
            </label>
            <input type="range" min="10" max="250" step="5" value="${prefs.alertRadiusKm || 50}" id="set_radius" oninput="document.getElementById('val_set_rad').textContent = this.value + ' km'">
          </div>

          <div style="display:flex; flex-direction:column; gap:12px;">
            <label class="glass-checkbox-wrap">
              <input type="checkbox" id="set_ch_fcm" ${channels.fcm ? 'checked' : ''}>
              <span>Firebase Cloud Messaging (FCM Web Push)</span>
            </label>
            <label class="glass-checkbox-wrap">
              <input type="checkbox" id="set_ch_email" ${channels.email ? 'checked' : ''}>
              <span>Brevo Transactional Email Alerts</span>
            </label>
            <label class="glass-checkbox-wrap">
              <input type="checkbox" id="set_ch_sms" ${channels.sms ? 'checked' : ''}>
              <span>Carrier SMS Emergency Directives</span>
            </label>
          </div>

          <div style="display:flex; justify-content:flex-end; margin-top:12px;">
            <button class="glass-btn btn-primary" onclick="saveSettingsNotifications()">
              Save Notification Preferences ✓
            </button>
          </div>
        </div>
      </div>
    `;
  } else if (_activeSettingsTab === 'weather') {
    container.innerHTML = `
      <div class="glass-card elevated" style="padding:32px;">
        <h3 style="font-size:18px; font-weight:700; margin-bottom:18px;">E. Weather &amp; Flood-Risk Thresholds</h3>
        
        <div style="display:flex; flex-direction:column; gap:20px;">
          <div class="field">
            <label>Minimum Severity Threshold to Trigger Warning</label>
            <select class="glass-select" id="set_severity">
              <option value="Low" ${prefs.severityThreshold === 'Low' ? 'selected' : ''}>Low (All Advisories)</option>
              <option value="Medium" ${prefs.severityThreshold === 'Medium' ? 'selected' : ''}>Medium (Elevated Hazards)</option>
              <option value="High" ${prefs.severityThreshold === 'High' ? 'selected' : ''}>High (Critical Threats Only)</option>
              <option value="Very High" ${prefs.severityThreshold === 'Very High' ? 'selected' : ''}>Very High (Evacuations Only)</option>
            </select>
          </div>

          <div class="field">
            <label>Default Disaster Sector</label>
            <select class="glass-select">
              <option value="Chennai" selected>Chennai, Tamil Nadu</option>
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
      </div>
    `;
  } else if (_activeSettingsTab === 'security') {
    container.innerHTML = `
      <div class="glass-card elevated" style="padding:32px;">
        <h3 style="font-size:18px; font-weight:700; margin-bottom:18px;">F. Security &amp; Session Management</h3>
        
        <div style="display:flex; flex-direction:column; gap:18px;">
          <div style="padding:14px; border-radius:10px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); font-size:13px; line-height:1.6;">
            <div><b>Active Session:</b> Authenticated via HMAC-SHA256 Token</div>
            <div style="color:var(--text-muted); font-size:11.5px; font-family:var(--font-mono); margin-top:4px;">
              Session Token Expiration: 8 Hours
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:14px; font-weight:600;">Sign Out of All Devices</div>
              <div style="font-size:12px; color:var(--text-muted);">Revokes local JWT token and unregisters active Web Push device tokens.</div>
            </div>
            <button class="glass-btn btn-ghost" onclick="logout()" style="color:var(--red); border-color:rgba(255,77,106,0.3); font-size:12.5px;">
              Sign Out ⎋
            </button>
          </div>
        </div>
      </div>
    `;
  } else if (_activeSettingsTab === 'accessibility') {
    container.innerHTML = `
      <div class="glass-card elevated" style="padding:32px;">
        <h3 style="font-size:18px; font-weight:700; margin-bottom:18px;">G. Accessibility &amp; Motion Controls</h3>
        
        <div style="display:flex; flex-direction:column; gap:18px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:14px; font-weight:600;">Reduced Motion</div>
              <div style="font-size:12px; color:var(--text-muted);">Suppresses smooth scrolling animations and liquid transitions.</div>
            </div>
            <label class="glass-switch">
              <input type="checkbox" onchange="toggleReducedMotion(this.checked)">
              <span class="glass-switch-slider"></span>
            </label>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:14px; font-weight:600;">High Contrast Glass Highlights</div>
              <div style="font-size:12px; color:var(--text-muted);">Increases border opacity and text contrast for low-visibility outdoor sunlight.</div>
            </div>
            <label class="glass-switch">
              <input type="checkbox" onchange="toggleHighContrast(this.checked)">
              <span class="glass-switch-slider"></span>
            </label>
          </div>
        </div>
      </div>
    `;
  } else if (_activeSettingsTab === 'about') {
    container.innerHTML = `
      <div class="glass-card elevated" style="padding:32px;">
        <h3 style="font-size:18px; font-weight:700; margin-bottom:18px;">H. Application Information &amp; Legal Policies</h3>
        
        <div style="display:flex; flex-direction:column; gap:16px;">
          <div style="display:flex; justify-content:space-between; font-size:13px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:10px;">
            <span>Platform Core Version</span>
            <span style="font-family:var(--font-mono); color:var(--accent-primary);">v2.6.0 (Liquid Glass Edition)</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:13px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:10px;">
            <span>ML Microservice Integration</span>
            <span style="font-family:var(--font-mono); color:var(--ocean);">XGBoost v2.0 / Random Forest Ensemble</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:13px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:10px;">
            <span>Database Storage</span>
            <span style="font-family:var(--font-mono); color:var(--text-primary);">MongoDB Atlas (TLS 1.3)</span>
          </div>

          <div style="display:flex; gap:16px; margin-top:14px;">
            <button class="glass-btn btn-ghost" onclick="goTo('terms')" style="font-size:12px;">
              Review Terms and Conditions ↗
            </button>
            <button class="glass-btn btn-ghost" onclick="goTo('privacy')" style="font-size:12px;">
              Review Privacy Policy ↗
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

async function saveSettingsNotifications() {
  const alertRadiusKm = document.getElementById('set_radius')?.value;
  const channels = {
    fcm: document.getElementById('set_ch_fcm')?.checked,
    email: document.getElementById('set_ch_email')?.checked,
    sms: document.getElementById('set_ch_sms')?.checked,
  };

  try {
    const res = await api('/auth/preferences', 'PUT', { alertRadiusKm, channels });
    if (state.user) {
      state.user.preferences = res.preferences;
      localStorage.setItem('floodai-user', JSON.stringify(state.user));
    }
    toast('✅ Notification preferences saved.');
  } catch (err) {
    toast(`Failed to save: ${err.message}`);
  }
}

function requestGpsRefresh() {
  if (navigator.geolocation) {
    toast('🛰️ Triangulating GPS coordinates...');
    navigator.geolocation.getCurrentPosition(
      pos => {
        state.userLocation = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        toast(`✅ Coordinates locked: ${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)}`);
        renderSettings(document.getElementById('pageRoot'));
      },
      err => {
        toast(`Location note: ${err.message}`);
      }
    );
  } else {
    toast('Geolocation not supported by this browser.');
  }
}

function toggleAtmosphereParticles(enabled) {
  const canvas = document.getElementById('climateParticleCanvas');
  if (canvas) canvas.style.display = enabled ? 'block' : 'none';
  toast(`Weather particles ${enabled ? 'enabled' : 'disabled'}.`);
}

function toggleReducedMotion(enabled) {
  document.documentElement.classList.toggle('reduce-motion', enabled);
  toast(`Reduced motion ${enabled ? 'active' : 'disabled'}.`);
}

function toggleHighContrast(enabled) {
  document.documentElement.classList.toggle('high-contrast', enabled);
  toast(`High contrast ${enabled ? 'active' : 'disabled'}.`);
}
