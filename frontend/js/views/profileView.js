/**
 * profileView.js
 * Dedicated Operator Profile Screen
 * Features:
 *  - Profile identity (avatar, display name, email, role, phone verification)
 *  - Location preferences (GPS refresh, manual sector override)
 *  - Preferred language selector (EN, HI, TA, BN, ES, FR)
 *  - Dark / Light Theme Toggle
 *  - EXACTLY 7 Selectable Accent Colour Themes with live preview:
 *      1. Ocean Cyan, 2. Electric Blue, 3. Emerald, 4. Violet, 5. Amber, 6. Coral, 7. Rose
 *  - Sign-out and session revocation action
 */

const ACCENT_PRESETS = [
  { id: 'ocean', name: 'Ocean Cyan', hex: '#33C7FF', secHex: '#1FE0A8' },
  { id: 'electric', name: 'Electric Blue', hex: '#3B82F6', secHex: '#60A5FA' },
  { id: 'emerald', name: 'Emerald', hex: '#10B981', secHex: '#34D399' },
  { id: 'violet', name: 'Violet', hex: '#8B5CF6', secHex: '#C084FC' },
  { id: 'amber', name: 'Amber', hex: '#F59E0B', secHex: '#FBBF24' },
  { id: 'coral', name: 'Coral', hex: '#F97316', secHex: '#FB923C' },
  { id: 'rose', name: 'Rose', hex: '#F43F5E', secHex: '#FB7185' },
];

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English (US / Global)', native: 'English' },
  { code: 'hi', name: 'Hindi (हिंदी)', native: 'हिंदी' },
  { code: 'ta', name: 'Tamil (தமிழ்)', native: 'தமிழ்' },
  { code: 'bn', name: 'Bengali (বাংলা)', native: 'বাংলা' },
  { code: 'es', name: 'Spanish (Español)', native: 'Español' },
  { code: 'fr', name: 'French (Français)', native: 'Français' },
];

function renderProfile(root) {
  const user = state.user || {
    displayName: 'Guest Operator',
    email: 'guest@floodai.org',
    role: 'user',
    phone: null,
    phoneVerified: false,
  };

  const currentAccent = state.accent || 'ocean';
  const currentLang = state.language || 'en';

  root.innerHTML = `
    <div class="saas-page-container" style="max-width:960px;">
      
      <!-- Top Title -->
      <div style="margin-bottom:28px;">
        <span class="story-tag" style="color:var(--accent-primary); border-color:rgba(51,199,255,0.3); background:rgba(51,199,255,0.1);">
          OPERATOR CLEARANCE &amp; PREFERENCES
        </span>
        <h1 style="font-family:var(--font-display); font-size:28px; font-weight:700; margin-top:6px;">
          Operator Profile &amp; Customization
        </h1>
        <p style="font-size:13.5px; color:var(--text-secondary);">
          Manage your account identity, regional localization, visual theme, and 7 accent colour palettes.
        </p>
      </div>

      <!-- Identity Card -->
      <div class="glass-card elevated border-lightning" style="padding:32px; margin-bottom:28px;">
        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:20px;">
          <div style="display:flex; align-items:center; gap:20px;">
            <div style="width:72px; height:72px; border-radius:50%; background:linear-gradient(135deg, var(--accent-primary), var(--accent-secondary)); display:grid; place-items:center; font-size:28px; font-weight:700; color:var(--text-inverse); box-shadow:0 0 24px var(--accent-glow);">
              ${escapeHtml((user.displayName || 'U').charAt(0).toUpperCase())}
            </div>
            <div>
              <div style="display:flex; align-items:center; gap:10px;">
                <h2 style="font-size:22px; font-weight:700; margin:0;">${escapeHtml(user.displayName || 'Operator')}</h2>
                <span class="glass-badge" style="background:${user.role === 'admin' ? 'rgba(255,77,106,0.18)' : (user.role === 'analyst' ? 'rgba(51,199,255,0.18)' : 'rgba(31,224,168,0.18)')}; color:${user.role === 'admin' ? 'var(--red)' : (user.role === 'analyst' ? 'var(--accent-primary)' : 'var(--ocean)')}; font-family:var(--font-mono); font-size:11px;">
                  ● ${(user.role || 'user').toUpperCase()} CLEARANCE
                </span>
              </div>
              <div style="font-family:var(--font-mono); font-size:13px; color:var(--text-muted); margin-top:4px;">
                ${escapeHtml(user.email)}
              </div>
              <div style="font-size:12px; color:var(--text-secondary); margin-top:6px; display:flex; align-items:center; gap:8px;">
                <span>Phone: <b>${escapeHtml(user.phone || 'Not configured')}</b></span>
                <span style="font-size:11px; color:${user.phoneVerified ? 'var(--ocean)' : 'var(--amber)'}; font-family:var(--font-mono);">
                  ${user.phoneVerified ? '✓ Verified' : '○ Unverified'}
                </span>
              </div>
            </div>
          </div>

          <button class="glass-btn btn-ghost" onclick="logout()" style="color:var(--red); border-color:rgba(255,77,106,0.3); font-size:12.5px;">
            Sign Out ⎋
          </button>
        </div>
      </div>

      <!-- Operational Role & Auto-Configured Workspace Selection Card -->
      <div class="glass-card elevated" style="padding:28px; margin-bottom:28px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px; margin-bottom:16px;">
          <div>
            <h3 style="font-size:18px; font-weight:700; margin:0 0 6px 0; display:flex; align-items:center; gap:8px;">
              <span>🛡️</span> Operational Role &amp; Workspace Clearance
            </h3>
            <p style="font-size:13px; color:var(--text-secondary); line-height:1.5; margin:0;">
              Selecting an operational role immediately auto-configures your workspace layout, active screen, navigation permissions, and telemetry modules.
            </p>
          </div>
          <span class="glass-badge" style="background:${user.role === 'admin' ? 'rgba(255,77,106,0.18)' : (user.role === 'analyst' ? 'rgba(51,199,255,0.18)' : 'rgba(31,224,168,0.18)')}; color:${user.role === 'admin' ? 'var(--red)' : (user.role === 'analyst' ? 'var(--accent-primary)' : 'var(--ocean)')}; font-family:var(--font-mono); font-size:11px;">
            CURRENT: ${(user.role || 'resident').toUpperCase()}
          </span>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:14px;">
          <!-- Admin Card -->
          <div onclick="autoConfigureRoleScreens('admin')" 
            style="padding:18px; border-radius:14px; cursor:pointer; transition:all 0.25s ease; border:1px solid ${user.role === 'admin' ? '#EF4444' : 'var(--panel-border)'}; background:${user.role === 'admin' ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.02)'};"
            class="role-select-card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <span style="font-size:24px;">⚡</span>
              ${user.role === 'admin' ? '<span style="font-size:10px; font-weight:700; color:#EF4444; font-family:var(--font-mono);">● ACTIVE WORKSPACE</span>' : ''}
            </div>
            <div style="font-size:15px; font-weight:700; color:var(--text-0);">Administrator Clearance</div>
            <div style="font-size:12px; color:var(--text-secondary); margin-top:4px; line-height:1.45;">
              Platform operations center, user RBAC directory, system configuration, alert dispatch, and compliance audit explorer.
            </div>
            <div style="margin-top:12px; font-size:11.5px; font-weight:600; color:#FF6B6B;">
              Auto-configures to: Platform Operations (admin-ops) →
            </div>
          </div>

          <!-- Analyst Card -->
          <div onclick="autoConfigureRoleScreens('analyst')" 
            style="padding:18px; border-radius:14px; cursor:pointer; transition:all 0.25s ease; border:1px solid ${user.role === 'analyst' ? 'var(--accent-primary)' : 'var(--panel-border)'}; background:${user.role === 'analyst' ? 'var(--accent-glow)' : 'rgba(255,255,255,0.02)'};"
            class="role-select-card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <span style="font-size:24px;">🧪</span>
              ${user.role === 'analyst' ? '<span style="font-size:10px; font-weight:700; color:var(--accent-primary); font-family:var(--font-mono);">● ACTIVE WORKSPACE</span>' : ''}
            </div>
            <div style="font-size:15px; font-weight:700; color:var(--text-0);">Analyst Hydrologic Lab</div>
            <div style="font-size:12px; color:var(--text-secondary); margin-top:4px; line-height:1.45;">
              Interactive prediction workbench, SHAP feature attributions, district risk matrix, historical evaluation log, and threat intel.
            </div>
            <div style="margin-top:12px; font-size:11.5px; font-weight:600; color:var(--accent-primary);">
              Auto-configures to: Prediction Workbench (analyst-predict) →
            </div>
          </div>

          <!-- Resident Card -->
          <div onclick="autoConfigureRoleScreens('resident')" 
            style="padding:18px; border-radius:14px; cursor:pointer; transition:all 0.25s ease; border:1px solid ${(user.role === 'resident' || user.role === 'user') ? 'var(--ocean)' : 'var(--panel-border)'}; background:${(user.role === 'resident' || user.role === 'user') ? 'rgba(31,224,168,0.12)' : 'rgba(255,255,255,0.02)'};"
            class="role-select-card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <span style="font-size:24px;">📍</span>
              ${(user.role === 'resident' || user.role === 'user') ? '<span style="font-size:10px; font-weight:700; color:var(--ocean); font-family:var(--font-mono);">● ACTIVE WORKSPACE</span>' : ''}
            </div>
            <div style="font-size:15px; font-weight:700; color:var(--text-0);">Resident Safety Hub</div>
            <div style="font-size:12px; color:var(--text-secondary); margin-top:4px; line-height:1.45;">
              Local real-time flood risk indicator, hydro-meteorological weather forecasts, emergency advisories, and disaster handbook.
            </div>
            <div style="margin-top:12px; font-size:11.5px; font-weight:600; color:var(--ocean);">
              Auto-configures to: My Location Risk (resident-risk) →
            </div>
          </div>
        </div>
      </div>

      <!-- Theme & 7 Accent Colours Selection Card -->
      <div class="glass-card elevated" style="padding:32px; margin-bottom:28px;">
        <h3 style="font-size:18px; font-weight:700; margin-bottom:6px; display:flex; align-items:center; gap:8px;">
          <span>🎨</span> Liquid Glass Theme &amp; Accent Styling
        </h3>
        <p style="font-size:13px; color:var(--text-secondary); line-height:1.6; margin-bottom:24px;">
          Select from 7 curated accent colour themes. The accent dynamically permeates buttons, navigation, glowing borders, and focus rings across all workspaces.
        </p>

        <!-- Light / Dark Mode Toggle Row -->
        <div style="display:flex; align-items:center; justify-content:space-between; padding:16px 20px; border-radius:12px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); margin-bottom:24px;">
          <div>
            <div style="font-size:14px; font-weight:600;">Display Surface Theme</div>
            <div style="font-size:12px; color:var(--text-muted);">Switch between deep bathymetric dark glass and frosted light glass.</div>
          </div>
          <div style="display:flex; gap:8px;">
            <button class="glass-btn ${state.theme === 'dark' ? 'btn-primary' : 'btn-ghost'}" onclick="setProfileTheme('dark')" style="padding:8px 16px; font-size:12.5px;">
              🌙 Dark Mode
            </button>
            <button class="glass-btn ${state.theme === 'light' ? 'btn-primary' : 'btn-ghost'}" onclick="setProfileTheme('light')" style="padding:8px 16px; font-size:12.5px;">
              ☀️ Light Mode
            </button>
          </div>
        </div>

        <!-- 7 Accent Color Themes Grid -->
        <div style="font-size:13px; font-weight:600; color:var(--text-primary); margin-bottom:12px;">
          Select Accent Palette (7 Presets)
        </div>

        <div class="grid-cards" style="grid-template-columns:repeat(7,1fr); gap:12px; margin-bottom:20px;">
          ${ACCENT_PRESETS.map(acc => `
            <div onclick="setProfileAccent('${acc.id}')"
              style="cursor:pointer; padding:14px 8px; border-radius:14px; text-align:center; transition:all 0.25s ease; border:2px solid ${currentAccent === acc.id ? acc.hex : 'rgba(255,255,255,0.08)'}; background:${currentAccent === acc.id ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)'};"
              title="${acc.name}">
              <div style="width:34px; height:34px; border-radius:50%; margin:0 auto 8px; background:linear-gradient(135deg, ${acc.hex}, ${acc.secHex}); box-shadow:0 0 14px ${acc.hex}66; display:grid; place-items:center;">
                ${currentAccent === acc.id ? '<span style="color:#000; font-weight:700; font-size:13px;">✓</span>' : ''}
              </div>
              <div style="font-size:11.5px; font-weight:600; color:${currentAccent === acc.id ? 'var(--text-primary)' : 'var(--text-muted)'}; line-height:1.2;">
                ${acc.name}
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Live Preview Pill -->
        <div style="padding:14px 18px; border-radius:12px; background:var(--glass-interactive); border:1px solid var(--glass-border); display:flex; align-items:center; justify-content:space-between;">
          <div style="display:flex; align-items:center; gap:10px; font-size:13px;">
            <span>Active Accent:</span>
            <b style="color:var(--accent-primary); font-family:var(--font-mono);">${ACCENT_PRESETS.find(a => a.id === currentAccent)?.name || 'Ocean Cyan'}</b>
          </div>
          <button class="glass-btn btn-primary" style="font-size:12px; padding:6px 16px;">
            Preview Action Button
          </button>
        </div>
      </div>

      <!-- Language & Regional Preferences Card -->
      <div class="glass-card elevated" style="padding:32px; margin-bottom:28px;">
        <h3 style="font-size:18px; font-weight:700; margin-bottom:6px; display:flex; align-items:center; gap:8px;">
          <span>🌐</span> Regional Language &amp; Localization
        </h3>
        <p style="font-size:13px; color:var(--text-secondary); line-height:1.6; margin-bottom:20px;">
          Select your primary language for emergency alerts, threat bulletins, and interface typography.
        </p>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
          <div class="field">
            <label>Interface Language</label>
            <select class="glass-select" onchange="setProfileLanguage(this.value)">
              ${SUPPORTED_LANGUAGES.map(l => `
                <option value="${l.code}" ${currentLang === l.code ? 'selected' : ''}>
                  ${l.name}
                </option>
              `).join('')}
            </select>
          </div>

          <div class="field">
            <label>Emergency Alert Perimeter</label>
            <input type="text" class="glass-input" readonly value="${(user.preferences?.alertRadiusKm || 50)} km Radius" style="opacity:0.8;">
          </div>
        </div>
      </div>

    </div>
  `;
}

function setProfileTheme(mode) {
  state.theme = mode;
  localStorage.setItem('floodai-theme', mode);
  document.documentElement.classList.toggle('light', mode === 'light');
  toast(`Theme switched to ${mode.toUpperCase()} mode.`);
  renderProfile(document.getElementById('pageRoot'));
}

function setProfileAccent(accentId) {
  setAppAccent(accentId);
  renderProfile(document.getElementById('pageRoot'));
}

function setProfileLanguage(langCode) {
  setAppLanguage(langCode);
  renderProfile(document.getElementById('pageRoot'));
}
