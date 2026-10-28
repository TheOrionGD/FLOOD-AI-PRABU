/**
 * FLOODAI — Application Shell, Layout, Navigation, Command Palette & Modals
 * Features:
 *  - Clean Topbar Header (no cluttered screen tabs)
 *  - Desktop Command Palette (Ctrl+K / Cmd+K) with keyboard navigation
 *  - Responsive Mobile Slide-out Drawer Menu (☰)
 *  - Dynamic Role-Based Screen Visibility (Restricted screens are hidden from unauthorized users)
 *  - Geolocation Sector Picker & Sensor Permissions Center
 *  - Emergency SOS Dispatch Confirmation & Siren Sounding Banner
 */

let cmdPaletteActiveIndex = 0;
let cmdPaletteFilteredItems = [];

/* ================= ROLE HELPER & AUTO-CONFIGURATION ================= */
function getRoleHomeScreen(role) {
  if (role === 'admin') return 'admin-ops';
  if (role === 'analyst') return 'analyst-predict';
  return 'resident-risk';
}

function getRoleHomeLabel(role) {
  if (role === 'admin') return 'Admin Ops';
  if (role === 'analyst') return 'Predict Lab';
  return 'Safety Hub';
}

function getRoleHomeIcon(role) {
  if (role === 'admin') return '⚡';
  if (role === 'analyst') return '🧪';
  return '📍';
}

function getRoleColor(role) {
  if (role === 'admin') return '#EF4444';
  if (role === 'analyst') return 'var(--accent-primary)';
  return 'var(--ocean)';
}

function autoConfigureRoleScreens(targetRole, shouldNavigate = true) {
  if (!targetRole) targetRole = state.user?.role || 'resident';

  if (!state.user) {
    state.user = {
      id: `usr_${targetRole}_${Date.now().toString(36)}`,
      email: `${targetRole}@floodai.org`,
      displayName: `${targetRole.charAt(0).toUpperCase() + targetRole.slice(1)} Operator`,
      role: targetRole,
      createdAt: new Date().toISOString()
    };
  } else {
    state.user.role = targetRole;
    if (!state.user.displayName || state.user.displayName === 'Anonymous User' || state.user.displayName.includes('Operator')) {
      state.user.displayName = `${targetRole.charAt(0).toUpperCase() + targetRole.slice(1)} Operator`;
    }
  }

  try {
    localStorage.setItem('floodai-user', JSON.stringify(state.user));
  } catch (_) {}

  const targetScreen = getRoleHomeScreen(targetRole);

  closeMobileMenu();

  // Re-render shell so that sidebar and mobile menu auto-configure with role groups
  renderShell();

  if (shouldNavigate) {
    goTo(targetScreen);
    if (typeof toast === 'function') {
      toast(`Workspace auto-configured for ${targetRole.toUpperCase()}: Switched to ${targetScreen}`);
    }
  }
}

function cycleRoleAutoConfigure() {
  const currentRole = state.user?.role || 'resident';
  const roleOrder = ['resident', 'analyst', 'admin'];
  const nextIdx = (roleOrder.indexOf(currentRole) + 1) % roleOrder.length;
  const nextRole = roleOrder[nextIdx];
  autoConfigureRoleScreens(nextRole, true);
}

function toggleGlobalTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  try {
    localStorage.setItem('floodai-theme', state.theme);
  } catch (_) {}
  document.documentElement.classList.toggle('light', state.theme === 'light');
  const themeBtns = [document.getElementById('themeToggle'), document.getElementById('mobileThemeToggle')];
  themeBtns.forEach(btn => {
    if (btn) btn.innerHTML = state.theme === 'dark' ? iconSun() : iconMoon();
  });
  if (typeof toast === 'function') {
    toast(`${state.theme === 'dark' ? 'Dark' : 'Light'} mode enabled`);
  }
  if (state.page === 'analytics' && typeof renderAnalytics === 'function') renderAnalytics();
  if (state.page === 'dashboard' && typeof renderDashboard === 'function') renderDashboard();
  if (state.page === 'map' && typeof renderMap === 'function') renderMap();
}

function renderSidebarNavigation() {
  const role = state.user?.role || 'user';
  const curPage = state.page || 'home';

  const roleSwitcherHtml = `
    <div class="sidebar-role-switcher" style="margin: 0 4px 14px; padding: 10px 10px; border-radius: 12px; background: rgba(255,255,255,0.035); border: 1px solid var(--panel-border);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <span style="font-size:9.5px; font-weight:700; text-transform:uppercase; letter-spacing:0.8px; color:var(--text-2); font-family:var(--font-mono);">
          WORKSPACE ROLE
        </span>
        <span class="role-indicator-badge" style="background:${getRoleColor(role)}22; color:${getRoleColor(role)}; border:1px solid ${getRoleColor(role)}55; font-size:9.5px; font-weight:700; padding:1px 6px; border-radius:5px;">
          ${role.toUpperCase()}
        </span>
      </div>
      <div class="role-switch-buttons" style="display:grid; grid-template-columns:repeat(3, 1fr); gap:4px;">
        <button class="role-btn ${role === 'admin' ? 'active' : ''}" onclick="autoConfigureRoleScreens('admin')" title="Switch to Admin Operations Workspace" style="padding:6px 2px; font-size:10.5px; font-weight:600; border-radius:7px; border:1px solid ${role === 'admin' ? '#EF4444' : 'var(--panel-border)'}; background:${role === 'admin' ? 'rgba(239,68,68,0.22)' : 'transparent'}; color:${role === 'admin' ? '#FF6B6B' : 'var(--text-1)'}; cursor:pointer; transition:all 0.2s ease;">
          ⚡ Admin
        </button>
        <button class="role-btn ${role === 'analyst' ? 'active' : ''}" onclick="autoConfigureRoleScreens('analyst')" title="Switch to Analyst Hydrologic Lab" style="padding:6px 2px; font-size:10.5px; font-weight:600; border-radius:7px; border:1px solid ${role === 'analyst' ? 'var(--accent-primary)' : 'var(--panel-border)'}; background:${role === 'analyst' ? 'var(--accent-glow)' : 'transparent'}; color:${role === 'analyst' ? 'var(--accent-primary)' : 'var(--text-1)'}; cursor:pointer; transition:all 0.2s ease;">
          🧪 Analyst
        </button>
        <button class="role-btn ${role === 'resident' || role === 'user' ? 'active' : ''}" onclick="autoConfigureRoleScreens('resident')" title="Switch to Resident Safety Hub" style="padding:6px 2px; font-size:10.5px; font-weight:600; border-radius:7px; border:1px solid ${(role === 'resident' || role === 'user') ? 'var(--ocean)' : 'var(--panel-border)'}; background:${(role === 'resident' || role === 'user') ? 'rgba(31,224,168,0.22)' : 'transparent'}; color:${(role === 'resident' || role === 'user') ? 'var(--ocean)' : 'var(--text-1)'}; cursor:pointer; transition:all 0.2s ease;">
          📍 Resident
        </button>
      </div>
    </div>
  `;

  let roleItemsHtml = '';
  if (role === 'admin') {
    roleItemsHtml = `
      <div class="sidebar-nav-group">
        <div class="sidebar-heading" style="color:var(--red);">Admin Command Center</div>
        <a class="sidebar-item ${curPage === 'admin-ops' ? 'active' : ''}" onclick="goTo('admin-ops')" title="Platform Operations">
          <span class="sidebar-icon">⚡</span>
          <span class="sidebar-label">Platform Operations</span>
        </a>
        <a class="sidebar-item ${curPage === 'admin-users' ? 'active' : ''}" onclick="goTo('admin-users')" title="User Directory & RBAC">
          <span class="sidebar-icon">👥</span>
          <span class="sidebar-label">User Administration</span>
        </a>
        <a class="sidebar-item ${curPage === 'admin-config' ? 'active' : ''}" onclick="goTo('admin-config')" title="System Configuration">
          <span class="sidebar-icon">⚙️</span>
          <span class="sidebar-label">System Configuration</span>
        </a>
        <a class="sidebar-item ${curPage === 'admin-alerts' ? 'active' : ''}" onclick="goTo('admin-alerts')" title="Alert Operations">
          <span class="sidebar-icon">🚨</span>
          <span class="sidebar-label">Alert Operations</span>
        </a>
        <a class="sidebar-item ${curPage === 'admin-audit' ? 'active' : ''}" onclick="goTo('admin-audit')" title="Compliance Audit Trail">
          <span class="sidebar-icon">🛡️</span>
          <span class="sidebar-label">Audit Explorer</span>
        </a>
      </div>
    `;
  } else if (role === 'analyst') {
    roleItemsHtml = `
      <div class="sidebar-nav-group">
        <div class="sidebar-heading" style="color:var(--accent-primary);">Analyst Hydrologic Lab</div>
        <a class="sidebar-item ${curPage === 'analyst-predict' ? 'active' : ''}" onclick="goTo('analyst-predict')" title="Prediction Workbench">
          <span class="sidebar-icon">🧪</span>
          <span class="sidebar-label">Prediction Workbench</span>
        </a>
        <a class="sidebar-item ${curPage === 'analyst-shap' ? 'active' : ''}" onclick="goTo('analyst-shap')" title="SHAP Attribution">
          <span class="sidebar-icon">📊</span>
          <span class="sidebar-label">SHAP Attribution</span>
        </a>
        <a class="sidebar-item ${curPage === 'analyst-comparison' ? 'active' : ''}" onclick="goTo('analyst-comparison')" title="District Risk Matrix">
          <span class="sidebar-icon">📑</span>
          <span class="sidebar-label">District Risk Matrix</span>
        </a>
        <a class="sidebar-item ${curPage === 'analyst-history' ? 'active' : ''}" onclick="goTo('analyst-history')" title="Evaluation Log">
          <span class="sidebar-icon">📜</span>
          <span class="sidebar-label">Evaluation History</span>
        </a>
        <a class="sidebar-item ${curPage === 'analyst-threat' ? 'active' : ''}" onclick="goTo('analyst-threat')" title="Tactical Threat Synthesis">
          <span class="sidebar-icon">🎯</span>
          <span class="sidebar-label">Tactical Threat Intel</span>
        </a>
      </div>
    `;
  } else {
    // Resident / User Role
    roleItemsHtml = `
      <div class="sidebar-nav-group">
        <div class="sidebar-heading" style="color:var(--ocean);">Resident Safety Hub</div>
        <a class="sidebar-item ${curPage === 'resident-risk' ? 'active' : ''}" onclick="goTo('resident-risk')" title="My Location Risk">
          <span class="sidebar-icon">📍</span>
          <span class="sidebar-label">My Location Risk</span>
        </a>
        <a class="sidebar-item ${curPage === 'resident-weather' ? 'active' : ''}" onclick="goTo('resident-weather')" title="Local Hydro Weather">
          <span class="sidebar-icon">🌦️</span>
          <span class="sidebar-label">Local Hydro Weather</span>
        </a>
        <a class="sidebar-item ${curPage === 'resident-alerts' ? 'active' : ''}" onclick="goTo('resident-alerts')" title="Emergency Advisories">
          <span class="sidebar-icon">📢</span>
          <span class="sidebar-label">Emergency Advisories</span>
        </a>
        <a class="sidebar-item ${curPage === 'resident-guide' ? 'active' : ''}" onclick="goTo('resident-guide')" title="Preparedness Handbook">
          <span class="sidebar-icon">📖</span>
          <span class="sidebar-label">Preparedness Guide</span>
        </a>
        <a class="sidebar-item ${curPage === 'resident-activity' ? 'active' : ''}" onclick="goTo('resident-activity')" title="Saved Locations">
          <span class="sidebar-icon">⭐</span>
          <span class="sidebar-label">Saved Locations</span>
        </a>
        <a class="sidebar-item ${curPage === 'resident-radar' ? 'active' : ''}" onclick="goTo('resident-radar')" title="1,000km Live Flood Radar">
          <span class="sidebar-icon">📡</span>
          <span class="sidebar-label">1,000km Live Radar</span>
        </a>
        <a class="sidebar-item ${curPage === 'resident-simulation' ? 'active' : ''}" onclick="goTo('resident-simulation')" title="Flood Alert Simulator">
          <span class="sidebar-icon">🧪</span>
          <span class="sidebar-label">Alert Simulator</span>
        </a>
      </div>
    `;
  }

  return `
    ${roleSwitcherHtml}

    ${roleItemsHtml}

    <div class="sidebar-nav-group">
      <div class="sidebar-heading">Core Disaster Modules</div>
      <a class="sidebar-item ${curPage === 'home' ? 'active' : ''}" onclick="goTo('home')" title="Overview">
        <span class="sidebar-icon">🏠</span>
        <span class="sidebar-label">National Radar Overview</span>
      </a>
      <a class="sidebar-item ${curPage === 'map' ? 'active' : ''}" onclick="goTo('map')" title="Geospatial GIS">
        <span class="sidebar-icon">🗺️</span>
        <span class="sidebar-label">Geospatial GIS Map</span>
      </a>
      <a class="sidebar-item ${curPage === 'records' ? 'active' : ''}" onclick="goTo('records')" title="Historical Records">
        <span class="sidebar-icon">📚</span>
        <span class="sidebar-label">Disaster Catalog (10k)</span>
      </a>
      <a class="sidebar-item ${curPage === 'analytics' ? 'active' : ''}" onclick="goTo('analytics')" title="Climate Trends">
        <span class="sidebar-icon">📈</span>
        <span class="sidebar-label">Climate Trends (24-Yr)</span>
      </a>
      <a class="sidebar-item ${curPage === 'alerts' ? 'active' : ''}" onclick="goTo('alerts')" title="Emergency Alerts & Siren">
        <span class="sidebar-icon">🚨</span>
        <span class="sidebar-label">Emergency Alerts &amp; Siren</span>
      </a>
      ${role === 'admin' || role === 'analyst' ? `
        <a class="sidebar-item ${curPage === 'command' ? 'active' : ''}" onclick="goTo('command')" title="Threat Command">
          <span class="sidebar-icon">⚡</span>
          <span class="sidebar-label">Threat Command</span>
        </a>
        <a class="sidebar-item ${curPage === 'dashboard' ? 'active' : ''}" onclick="goTo('dashboard')" title="MLOps Benchmarks">
          <span class="sidebar-icon">📊</span>
          <span class="sidebar-label">MLOps Benchmarks</span>
        </a>
      ` : ''}
    </div>
  `;
}

function toggleSidebarCollapse() {
  state.sidebarCollapsed = !state.sidebarCollapsed;
  localStorage.setItem('floodai-sidebar-collapsed', state.sidebarCollapsed);
  const sidebar = document.getElementById('saasSidebar');
  if (sidebar) sidebar.classList.toggle('collapsed', state.sidebarCollapsed);
}

function renderShell() {
  const app = document.getElementById('app');
  if (!app) return;

  const role = state.user?.role || 'resident';

  const policy = (typeof ROUTE_POLICIES !== 'undefined' && ROUTE_POLICIES[state.page])
    ? ROUTE_POLICIES[state.page]
    : { layout: 'saas', title: state.page };

  const isPublicLayout = policy.layout === 'public';

  if (isPublicLayout) {
    // LAYOUT A: Public and Onboarding Layout (No operational sidebar)
    app.innerHTML = `
      <div class="layout-public" id="publicShellRoot">
        <main id="main"></main>
      </div>

      <!-- Shared Modals Container -->
      <div id="sharedModalsMount">${renderSharedModalsHtml()}</div>
    `;
  } else {
    // LAYOUT B: Authenticated Enterprise SaaS Workspace
    app.innerHTML = `
      <div class="saas-layout" id="saasShellRoot">
        
        <!-- Mobile Menubar (Visible ONLY on mobile devices <= 900px) -->
        <header class="mobile-menubar" id="mobileMenubar">
          <div style="display:flex; align-items:center; gap:8px;">
            <button class="mobile-hamburger-btn" onclick="openMobileMenu()" title="Open Navigation Menu">
              <span>☰</span>
            </button>
            <div class="brand" onclick="goTo('home')" style="cursor:pointer; font-size:16px;">
              <span class="mark" style="width:28px; height:28px;">${iconWave()}</span>
              <span class="brand-text">FloodAI</span>
            </div>
          </div>

          <div style="display:flex; align-items:center; gap:6px;">
            <button class="mobile-role-pill" onclick="cycleRoleAutoConfigure()" title="Current Workspace Role: tap to switch" style="background:${getRoleColor(role)}22; border:1px solid ${getRoleColor(role)}55; color:${getRoleColor(role)};">
              <span>${getRoleHomeIcon(role)}</span>
              <span>${role.toUpperCase()}</span>
            </button>

            <button class="icon-btn" onclick="openClimateModal()" title="Weather Atmosphere" style="width:34px; height:34px; font-size:14px; border-radius:8px;">
              🌧️
            </button>

            <button class="icon-btn" id="mobileThemeToggle" onclick="toggleGlobalTheme()" title="Toggle Theme" style="width:34px; height:34px; font-size:14px; border-radius:8px;">
              ${state.theme === 'dark' ? iconSun() : iconMoon()}
            </button>
          </div>
        </header>

        <!-- Right SaaS Content Column -->
        <div class="saas-content">
          <!-- Desktop Topbar -->
          <header class="saas-topbar">
            <!-- Navigation Trigger & Breadcrumbs -->
            <div class="saas-breadcrumbs" style="display:flex; align-items:center; gap:8px;">
              <button class="icon-btn" onclick="openMobileMenu()" title="Open Navigation Menu" style="width:34px; height:34px; border-radius:8px; display:inline-flex; align-items:center; justify-content:center; cursor:pointer;">
                <span style="font-size:16px;">☰</span>
              </button>
              <div class="brand" onclick="goTo('home')" style="cursor:pointer; display:inline-flex; align-items:center; gap:6px; margin-right:4px;" title="FloodAI Overview">
                <span class="mark" style="width:26px; height:26px;">${iconWave()}</span>
                <span class="brand-text" style="font-weight:700; font-size:15px;">FloodAI</span>
              </div>
              <span style="color:var(--text-muted); opacity:0.6;">/</span>
              <span style="text-transform:capitalize; color:var(--text-secondary); cursor:pointer;" onclick="cycleRoleAutoConfigure()" title="Click to switch role">${role} Workspace</span>
              <span style="color:var(--text-muted); opacity:0.6;">/</span>
              <span class="active">${escapeHtml(policy.title || state.page)}</span>
            </div>

            <!-- Header Actions: Role Pill, Command Palette, Climate, Profile & Theme -->
            <div class="top-actions">
              <!-- Quick Role Switcher Pill -->
              <div class="role-indicator-badge" onclick="cycleRoleAutoConfigure()" title="Operational Role (Click to switch)"
                style="display:inline-flex; align-items:center; gap:6px; padding:5px 12px; border-radius:10px; background:${getRoleColor(role)}18; border:1px solid ${getRoleColor(role)}44; color:${getRoleColor(role)}; font-size:11.5px; font-weight:700; cursor:pointer;">
                <span>${getRoleHomeIcon(role)}</span>
                <span>${role.toUpperCase()}</span>
                <span style="font-size:9px; opacity:0.75;">▼</span>
              </div>

              <!-- Command Palette Shortcut Prompt -->
              <div class="cmd-palette-top-pill" onclick="openCommandPalette()" title="Press Ctrl+K to access Command Palette"
                style="display:inline-flex; align-items:center; gap:8px; padding:6px 14px; border-radius:12px; background:rgba(255,255,255,0.04); border:1px solid var(--panel-border); font-size:12px; color:var(--text-1); cursor:pointer;">
                <span style="color:var(--cyber); font-size:13px;">⚡</span>
                <span><kbd class="cmd-kbd-shortcut">Ctrl+K</kbd></span>
              </div>

              <!-- Location Sector & Coordinates Pill -->
              <div class="icon-btn border-scale" id="headerLocationPill" onclick="openLocPickerModal()" title="Location Intelligence & Monitored Catchment Sector"
                style="width:auto; height:38px; padding:0 12px; display:inline-flex; align-items:center; gap:6px; font-size:12px; font-family:var(--font-mono); border-radius:10px; cursor:pointer;">
                <span>📍</span>
                <span style="font-weight:600; color:var(--text-0);" id="headerLocationLabel">${escapeHtml(
                  (typeof GeoLocationService !== 'undefined' && GeoLocationService.coords?.cityName) 
                    ? GeoLocationService.coords.cityName 
                    : ((typeof GeoLocationService !== 'undefined' && GeoLocationService.coords?.district) ? GeoLocationService.coords.district : 'Location')
                )}</span>
              </div>

              <!-- Climate Atmosphere Particle Control Pill -->
              <div class="icon-btn border-scale" id="climateAtmospherePill" onclick="openClimateModal()" title="Atmospheric Particle Climate & Weather Telemetry"
                style="width:auto; height:38px; padding:0 12px; display:inline-flex; align-items:center; gap:6px; font-size:12px; font-family:var(--font-mono); border-radius:10px; cursor:pointer;">
                <span>🌧️</span>
                <span style="font-weight:600; color:var(--cyber);">Atmosphere</span>
              </div>

              <!-- Auth Status / Profile Pill -->
              <div id="authHeaderWidget"></div>

              <!-- Dark / Light Theme Toggle -->
              <div class="icon-btn" id="themeToggle" onclick="toggleGlobalTheme()" title="Toggle theme">
                ${state.theme === 'dark' ? iconSun() : iconMoon()}
              </div>
            </div>
          </header>

          <!-- Main View Root -->
          <main id="main"></main>

          <!-- Global Footer -->
          <footer id="footer"></footer>
        </div>

        <!-- Mobile Bottom Navigation Bar (Visible ONLY on mobile devices <= 900px) -->
        <nav class="mobile-bottom-bar" id="mobileBottomBar">
          <button class="mobile-bottom-item ${state.page === getRoleHomeScreen(role) ? 'active' : ''}" onclick="goTo(getRoleHomeScreen('${role}'))">
            <span class="bottom-icon">${getRoleHomeIcon(role)}</span>
            <span class="bottom-label">${getRoleHomeLabel(role)}</span>
          </button>
          <button class="mobile-bottom-item ${state.page === 'map' ? 'active' : ''}" onclick="goTo('map')">
            <span class="bottom-icon">🗺️</span>
            <span class="bottom-label">GIS Map</span>
          </button>
          <button class="mobile-bottom-item" onclick="openClimateModal()">
            <span class="bottom-icon">🌧️</span>
            <span class="bottom-label">Weather</span>
          </button>
          <button class="mobile-bottom-item alert-item" onclick="openSosConfirmModal()">
            <span class="bottom-icon">🚨</span>
            <span class="bottom-label">SOS</span>
          </button>
          <button class="mobile-bottom-item" onclick="openMobileMenu()">
            <span class="bottom-icon">☰</span>
            <span class="bottom-label">Menu</span>
          </button>
        </nav>

      </div>

      <!-- Shared Modals Container -->
      <div id="sharedModalsMount">${renderSharedModalsHtml()}</div>
    `;
  }

  if (typeof renderAuthHeaderWidget === 'function') renderAuthHeaderWidget();
  if (typeof renderLocationHeaderWidget === 'function') renderLocationHeaderWidget();
  updatePermissionsHeaderBadge();
  if (window.climateParticleEngine) window.climateParticleEngine.updateUIBadge();

  if (!isPublicLayout) {
    renderFooter();
  }
  setupGlobalKeyboardShortcuts();
  if (typeof translateCurrentPage === 'function') {
    translateCurrentPage();
  }
}

function renderSharedModalsHtml() {
  return `
    <!-- Command Palette Modal (Ctrl+K) -->
    <div class="modal-overlay" id="commandPaletteModal" onclick="if(event.target===this) closeCommandPalette()">
      <div class="cmd-palette-card border-lightning">
        <div class="cmd-palette-search-wrap">
          <span style="font-size:18px; color:var(--cyber);">🔍</span>
          <input type="text" id="cmdPaletteInput" placeholder="Jump to screen or action (e.g. Risk Lab, GIS Map, Records, SOS)..." autocomplete="off" oninput="filterCommandPalette(this.value)" onkeydown="handleCommandPaletteKey(event)">
          <kbd class="cmd-kbd-shortcut" onclick="closeCommandPalette()" style="cursor:pointer;">ESC</kbd>
        </div>
        <div class="cmd-palette-results" id="cmdPaletteResults"></div>
        <div class="cmd-palette-footer">
          <span><kbd>↑</kbd> <kbd>↓</kbd> Navigate</span>
          <span><kbd>↵</kbd> Select</span>
          <span><kbd>ESC</kbd> Close</span>
        </div>
      </div>
    </div>

    <!-- Mobile Slide-out Drawer Menu -->
    <div class="mobile-drawer-overlay" id="mobileDrawerMenu" onclick="if(event.target===this) closeMobileMenu()">
      <div class="mobile-drawer-content">
        <div class="mobile-drawer-header">
          <div class="brand" onclick="goTo('home'); closeMobileMenu();" style="cursor:pointer;">
            <span class="mark">${iconWave()}</span> FloodAI
          </div>
          <button class="modal-close" onclick="closeMobileMenu()">✕</button>
        </div>
        <div class="mobile-drawer-user" id="mobileDrawerUserSlot"></div>
        <div class="mobile-drawer-nav" id="mobileDrawerNavList"></div>
        <div class="mobile-drawer-actions">
          <button class="btn btn-sm btn-danger" onclick="closeMobileMenu(); openSosConfirmModal();" style="width:100%; justify-content:center; gap:8px;">
            🚨 Emergency SOS Broadcast
          </button>
          <button class="btn btn-sm btn-ghost" onclick="closeMobileMenu(); openPermissionsModal();" style="width:100%; justify-content:center; gap:8px; margin-top:8px;">
            🛡️ Permissions &amp; Sensors
          </button>
        </div>
      </div>
    </div>

    <!-- Location Sector Picker Modal -->
    <div class="modal-overlay" id="locPickerModal">
      <div class="modal-card">
        <button class="modal-close" onclick="closeLocPickerModal()">✕</button>
        <div id="locPickerModalBody"></div>
      </div>
    </div>

    <!-- Emergency SOS Confirmation Modal -->
    <div class="modal-overlay" id="sosConfirmModal">
      <div class="modal-card border-lightning-danger">
        <button class="modal-close" onclick="closeSosConfirmModal()">✕</button>
        <div id="sosConfirmModalBody"></div>
      </div>
    </div>

    <!-- Global Permissions & Access Modal -->
    <div class="modal-overlay" id="permModal">
      <div class="modal-card modal-lg border-lightning">
        <button class="modal-close" onclick="closePermissionsModal()">✕</button>
        <div id="permModalBody"></div>
      </div>
    </div>

    <!-- Global Auth Modal -->
    <div class="modal-overlay" id="authModal">
      <div class="modal-card border-lightning">
        <button class="modal-close" onclick="closeAuthModal()">✕</button>
        <div class="auth-tabs">
          <button class="auth-tab-btn active" id="tabLogin" onclick="switchAuthTab('login')">Sign In</button>
          <button class="auth-tab-btn" id="tabRegister" onclick="switchAuthTab('register')">Create Account</button>
        </div>
        <div id="authModalBody"></div>
      </div>
    </div>

    <!-- Global Preferences Modal -->
    <div class="modal-overlay" id="prefModal">
      <div class="modal-card">
        <button class="modal-close" onclick="closePrefModal()">✕</button>
        <h3 style="font-family:var(--font-display); font-size:18px; margin-bottom:14px;">Notification &amp; Location Settings</h3>
        <div id="prefModalBody"></div>
      </div>
    </div>

    <!-- Atmospheric Particle Climate & Weather Telemetry Modal -->
    <div class="modal-overlay" id="climateModal" onclick="if(event.target===this) closeClimateModal()">
      <div class="modal-card modal-lg border-lightning" style="max-width:720px;">
        <button class="modal-close" onclick="closeClimateModal()">✕</button>
        <div id="climateModalBody"></div>
      </div>
    </div>
  `;
}

/* ================= 1. GLOBAL KEYBOARD SHORTCUTS (CTRL+K) ================= */
let isKeyboardListenerAttached = false;

function setupGlobalKeyboardShortcuts() {
  if (isKeyboardListenerAttached) return;
  isKeyboardListenerAttached = true;

  window.addEventListener('keydown', (e) => {
    // Ctrl+K or Cmd+K
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      toggleCommandPalette();
      return;
    }

    // '/' shortcut to search when not typing in an input
    if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
      e.preventDefault();
      openCommandPalette();
      return;
    }

    // Escape closes modals
    if (e.key === 'Escape') {
      const cmdModal = document.getElementById('commandPaletteModal');
      if (cmdModal && cmdModal.classList.contains('open')) {
        closeCommandPalette();
      }
      const mobDrawer = document.getElementById('mobileDrawerMenu');
      if (mobDrawer && mobDrawer.classList.contains('open')) {
        closeMobileMenu();
      }
    }
  });
}

/* ================= 2. COMMAND PALETTE (CTRL+K) ================= */
function openCommandPalette() {
  const modal = document.getElementById('commandPaletteModal');
  const input = document.getElementById('cmdPaletteInput');
  if (!modal) return;

  modal.classList.add('open');
  cmdPaletteActiveIndex = 0;
  if (input) {
    input.value = '';
    setTimeout(() => input.focus(), 50);
  }
  filterCommandPalette('');
}

function closeCommandPalette() {
  const modal = document.getElementById('commandPaletteModal');
  if (modal) modal.classList.remove('open');
}

function toggleCommandPalette() {
  const modal = document.getElementById('commandPaletteModal');
  if (modal && modal.classList.contains('open')) {
    closeCommandPalette();
  } else {
    openCommandPalette();
  }
}

function filterCommandPalette(query = '') {
  const resultsContainer = document.getElementById('cmdPaletteResults');
  if (!resultsContainer) return;

  const q = query.toLowerCase().trim();

  // 1. Role-Filtered Screens (STRICT: Unauthorized screens are NEVER mentioned)
  const accessiblePages = typeof getAccessiblePages === 'function' ? getAccessiblePages() : PAGES;
  const matchedPages = accessiblePages.filter(([id, title, icon, desc]) => {
    if (!q) return true;
    return id.includes(q) || title.toLowerCase().includes(q) || (desc && desc.toLowerCase().includes(q));
  }).map(([id, title, icon, desc]) => ({
    type: 'screen',
    id,
    title,
    icon: icon || '📄',
    desc: desc || 'Navigate to screen',
    badge: id === state.page ? 'CURRENT' : null,
    action: () => {
      closeCommandPalette();
      goTo(id);
    }
  }));

  // 2. Quick Operational System Actions
  const systemActions = [
    {
      id: 'action-sos',
      title: 'Trigger Emergency SOS Broadcast',
      icon: '🚨',
      desc: 'Activate civil defense alert siren & send dispatch telemetry',
      badge: 'URGENT',
      action: () => {
        closeCommandPalette();
        openSosConfirmModal();
      }
    },
    {
      id: 'action-loc',
      title: 'Change Monitored District / Sector',
      icon: '📍',
      desc: 'Switch active geographic catchment zone or acquire GPS coordinates',
      badge: null,
      action: () => {
        closeCommandPalette();
        openLocPickerModal();
      }
    },
    {
      id: 'action-perms',
      title: 'System Permissions & Hardware Center',
      icon: '🛡️',
      desc: 'Manage Web Push, Geolocation, and Audio Siren synthesizer permissions',
      badge: null,
      action: () => {
        closeCommandPalette();
        openPermissionsModal();
      }
    },
    {
      id: 'action-theme',
      title: `Toggle Theme (${state.theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'})`,
      icon: state.theme === 'dark' ? '☀️' : '🌙',
      desc: 'Change visual interface theme mode',
      badge: null,
      action: () => {
        closeCommandPalette();
        document.getElementById('themeToggle')?.click();
      }
    },
  ];

  const matchedActions = systemActions.filter(a => {
    if (!q) return true;
    return a.title.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q);
  });

  cmdPaletteFilteredItems = [...matchedPages, ...matchedActions];
  cmdPaletteActiveIndex = Math.min(cmdPaletteActiveIndex, Math.max(0, cmdPaletteFilteredItems.length - 1));

  if (cmdPaletteFilteredItems.length === 0) {
    resultsContainer.innerHTML = `
      <div style="padding:32px 20px; text-align:center; color:var(--text-2);">
        <div style="font-size:32px; margin-bottom:8px;">🔍</div>
        <b style="color:var(--text-0);">No matching screens or actions found</b>
        <p style="font-size:12px; margin-top:4px;">Try searching for "Risk", "GIS", "Records", or "SOS".</p>
      </div>
    `;
    return;
  }

  let html = '';

  if (matchedPages.length > 0) {
    html += `<div class="cmd-palette-section-title">Accessible Screens (${state.user?.role || 'Guest'})</div>`;
    matchedPages.forEach((item, idx) => {
      const isSelected = idx === cmdPaletteActiveIndex;
      html += renderCmdPaletteItemHtml(item, idx, isSelected);
    });
  }

  if (matchedActions.length > 0) {
    html += `<div class="cmd-palette-section-title" style="margin-top:6px;">Quick Operational Actions</div>`;
    matchedActions.forEach((item, actionIdx) => {
      const globalIdx = matchedPages.length + actionIdx;
      const isSelected = globalIdx === cmdPaletteActiveIndex;
      html += renderCmdPaletteItemHtml(item, globalIdx, isSelected);
    });
  }

  resultsContainer.innerHTML = html;
}

function renderCmdPaletteItemHtml(item, index, isSelected) {
  return `
    <div class="cmd-palette-item ${isSelected ? 'active' : ''}" 
      onclick="executeCommandPaletteItem(${index})"
      onmouseenter="setCmdPaletteActiveIndex(${index})"
      id="cmdItem_${index}">
      <div class="cmd-palette-item-left">
        <span class="cmd-palette-item-icon">${item.icon}</span>
        <div>
          <div class="cmd-palette-item-title">${escapeHtml(item.title)}</div>
          <div class="cmd-palette-item-sub">${escapeHtml(item.desc)}</div>
        </div>
      </div>
      <div>
        ${item.badge ? `<span class="valtag" style="background:rgba(51,199,255,0.15); color:var(--cyber); font-size:10px;">${escapeHtml(item.badge)}</span>` : ''}
        <span style="font-size:12px; color:var(--text-2); margin-left:8px;">↵</span>
      </div>
    </div>
  `;
}

function setCmdPaletteActiveIndex(idx) {
  cmdPaletteActiveIndex = idx;
  document.querySelectorAll('.cmd-palette-item').forEach((el, i) => {
    el.classList.toggle('active', i === idx);
  });
}

function handleCommandPaletteKey(e) {
  if (!cmdPaletteFilteredItems.length) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    cmdPaletteActiveIndex = (cmdPaletteActiveIndex + 1) % cmdPaletteFilteredItems.length;
    setCmdPaletteActiveIndex(cmdPaletteActiveIndex);
    scrollActiveCommandItemIntoView();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    cmdPaletteActiveIndex = (cmdPaletteActiveIndex - 1 + cmdPaletteFilteredItems.length) % cmdPaletteFilteredItems.length;
    setCmdPaletteActiveIndex(cmdPaletteActiveIndex);
    scrollActiveCommandItemIntoView();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    executeCommandPaletteItem(cmdPaletteActiveIndex);
  }
}

function scrollActiveCommandItemIntoView() {
  const el = document.getElementById(`cmdItem_${cmdPaletteActiveIndex}`);
  if (el) {
    el.scrollIntoView({ block: 'nearest' });
  }
}

function executeCommandPaletteItem(index) {
  const item = cmdPaletteFilteredItems[index];
  if (item && item.action) {
    item.action();
  }
}

/* ================= 3. MOBILE SLIDE-OUT DRAWER MENU & SIDEBAR ================= */
function renderMobileDrawerNavigation() {
  const role = state.user?.role || 'resident';
  const curPage = state.page || 'home';

  const roleSwitcherHtml = `
    <div class="sidebar-role-switcher" style="margin: 8px 0 14px; padding: 10px 10px; border-radius: 12px; background: rgba(255,255,255,0.035); border: 1px solid var(--panel-border);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <span style="font-size:9.5px; font-weight:700; text-transform:uppercase; letter-spacing:0.8px; color:var(--text-2); font-family:var(--font-mono);">
          CONFIGURE WORKSPACE ROLE
        </span>
        <span class="role-indicator-badge" style="background:${getRoleColor(role)}22; color:${getRoleColor(role)}; border:1px solid ${getRoleColor(role)}55; font-size:9.5px; font-weight:700; padding:1px 6px; border-radius:5px;">
          ${role.toUpperCase()}
        </span>
      </div>
      <div class="role-switch-buttons" style="display:grid; grid-template-columns:repeat(3, 1fr); gap:4px;">
        <button class="role-btn ${role === 'admin' ? 'active' : ''}" onclick="autoConfigureRoleScreens('admin')" title="Switch to Admin Operations Workspace" style="padding:6px 2px; font-size:10.5px; font-weight:600; border-radius:7px; border:1px solid ${role === 'admin' ? '#EF4444' : 'var(--panel-border)'}; background:${role === 'admin' ? 'rgba(239,68,68,0.22)' : 'transparent'}; color:${role === 'admin' ? '#FF6B6B' : 'var(--text-1)'}; cursor:pointer; transition:all 0.2s ease;">
          ⚡ Admin
        </button>
        <button class="role-btn ${role === 'analyst' ? 'active' : ''}" onclick="autoConfigureRoleScreens('analyst')" title="Switch to Analyst Hydrologic Lab" style="padding:6px 2px; font-size:10.5px; font-weight:600; border-radius:7px; border:1px solid ${role === 'analyst' ? 'var(--accent-primary)' : 'var(--panel-border)'}; background:${role === 'analyst' ? 'var(--accent-glow)' : 'transparent'}; color:${role === 'analyst' ? 'var(--accent-primary)' : 'var(--text-1)'}; cursor:pointer; transition:all 0.2s ease;">
          🧪 Analyst
        </button>
        <button class="role-btn ${role === 'resident' || role === 'user' ? 'active' : ''}" onclick="autoConfigureRoleScreens('resident')" title="Switch to Resident Safety Hub" style="padding:6px 2px; font-size:10.5px; font-weight:600; border-radius:7px; border:1px solid ${(role === 'resident' || role === 'user') ? 'var(--ocean)' : 'var(--panel-border)'}; background:${(role === 'resident' || role === 'user') ? 'rgba(31,224,168,0.22)' : 'transparent'}; color:${(role === 'resident' || role === 'user') ? 'var(--ocean)' : 'var(--text-1)'}; cursor:pointer; transition:all 0.2s ease;">
          📍 Resident
        </button>
      </div>
    </div>
  `;

  let roleItemsHtml = '';
  if (role === 'admin') {
    roleItemsHtml = `
      <div class="mobile-drawer-group">
        <div class="mobile-drawer-heading" style="color:var(--red);">Admin Command Center</div>
        <a class="mobile-drawer-item ${curPage === 'admin-ops' ? 'active' : ''}" onclick="goTo('admin-ops'); closeMobileMenu();">
          <span style="font-size:16px;">⚡</span>
          <span style="flex:1; font-weight:600;">Platform Operations</span>
          ${curPage === 'admin-ops' ? '<span style="font-size:10px; color:var(--cyber); font-family:var(--font-mono);">●</span>' : ''}
        </a>
        <a class="mobile-drawer-item ${curPage === 'admin-users' ? 'active' : ''}" onclick="goTo('admin-users'); closeMobileMenu();">
          <span style="font-size:16px;">👥</span>
          <span style="flex:1; font-weight:600;">User Administration</span>
          ${curPage === 'admin-users' ? '<span style="font-size:10px; color:var(--cyber); font-family:var(--font-mono);">●</span>' : ''}
        </a>
        <a class="mobile-drawer-item ${curPage === 'admin-config' ? 'active' : ''}" onclick="goTo('admin-config'); closeMobileMenu();">
          <span style="font-size:16px;">⚙️</span>
          <span style="flex:1; font-weight:600;">System Configuration</span>
          ${curPage === 'admin-config' ? '<span style="font-size:10px; color:var(--cyber); font-family:var(--font-mono);">●</span>' : ''}
        </a>
        <a class="mobile-drawer-item ${curPage === 'admin-alerts' ? 'active' : ''}" onclick="goTo('admin-alerts'); closeMobileMenu();">
          <span style="font-size:16px;">🚨</span>
          <span style="flex:1; font-weight:600;">Alert Operations</span>
          ${curPage === 'admin-alerts' ? '<span style="font-size:10px; color:var(--cyber); font-family:var(--font-mono);">●</span>' : ''}
        </a>
        <a class="mobile-drawer-item ${curPage === 'admin-audit' ? 'active' : ''}" onclick="goTo('admin-audit'); closeMobileMenu();">
          <span style="font-size:16px;">🛡️</span>
          <span style="flex:1; font-weight:600;">Audit Explorer</span>
          ${curPage === 'admin-audit' ? '<span style="font-size:10px; color:var(--cyber); font-family:var(--font-mono);">●</span>' : ''}
        </a>
      </div>
    `;
  } else if (role === 'analyst') {
    roleItemsHtml = `
      <div class="mobile-drawer-group">
        <div class="mobile-drawer-heading" style="color:var(--accent-primary);">Analyst Hydrologic Lab</div>
        <a class="mobile-drawer-item ${curPage === 'analyst-predict' ? 'active' : ''}" onclick="goTo('analyst-predict'); closeMobileMenu();">
          <span style="font-size:16px;">🧪</span>
          <span style="flex:1; font-weight:600;">Prediction Workbench</span>
          ${curPage === 'analyst-predict' ? '<span style="font-size:10px; color:var(--cyber); font-family:var(--font-mono);">●</span>' : ''}
        </a>
        <a class="mobile-drawer-item ${curPage === 'analyst-shap' ? 'active' : ''}" onclick="goTo('analyst-shap'); closeMobileMenu();">
          <span style="font-size:16px;">📊</span>
          <span style="flex:1; font-weight:600;">SHAP Attribution</span>
          ${curPage === 'analyst-shap' ? '<span style="font-size:10px; color:var(--cyber); font-family:var(--font-mono);">●</span>' : ''}
        </a>
        <a class="mobile-drawer-item ${curPage === 'analyst-comparison' ? 'active' : ''}" onclick="goTo('analyst-comparison'); closeMobileMenu();">
          <span style="font-size:16px;">📑</span>
          <span style="flex:1; font-weight:600;">District Risk Matrix</span>
          ${curPage === 'analyst-comparison' ? '<span style="font-size:10px; color:var(--cyber); font-family:var(--font-mono);">●</span>' : ''}
        </a>
        <a class="mobile-drawer-item ${curPage === 'analyst-history' ? 'active' : ''}" onclick="goTo('analyst-history'); closeMobileMenu();">
          <span style="font-size:16px;">📜</span>
          <span style="flex:1; font-weight:600;">Evaluation History</span>
          ${curPage === 'analyst-history' ? '<span style="font-size:10px; color:var(--cyber); font-family:var(--font-mono);">●</span>' : ''}
        </a>
        <a class="mobile-drawer-item ${curPage === 'analyst-threat' ? 'active' : ''}" onclick="goTo('analyst-threat'); closeMobileMenu();">
          <span style="font-size:16px;">🎯</span>
          <span style="flex:1; font-weight:600;">Tactical Threat Intel</span>
          ${curPage === 'analyst-threat' ? '<span style="font-size:10px; color:var(--cyber); font-family:var(--font-mono);">●</span>' : ''}
        </a>
      </div>
    `;
  } else {
    // Resident / User Role
    roleItemsHtml = `
      <div class="mobile-drawer-group">
        <div class="mobile-drawer-heading" style="color:var(--ocean);">Resident Safety Hub</div>
        <a class="mobile-drawer-item ${curPage === 'resident-risk' ? 'active' : ''}" onclick="goTo('resident-risk'); closeMobileMenu();">
          <span style="font-size:16px;">📍</span>
          <span style="flex:1; font-weight:600;">My Location Risk</span>
          ${curPage === 'resident-risk' ? '<span style="font-size:10px; color:var(--cyber); font-family:var(--font-mono);">●</span>' : ''}
        </a>
        <a class="mobile-drawer-item ${curPage === 'resident-weather' ? 'active' : ''}" onclick="goTo('resident-weather'); closeMobileMenu();">
          <span style="font-size:16px;">🌦️</span>
          <span style="flex:1; font-weight:600;">Local Hydro Weather</span>
          ${curPage === 'resident-weather' ? '<span style="font-size:10px; color:var(--cyber); font-family:var(--font-mono);">●</span>' : ''}
        </a>
        <a class="mobile-drawer-item ${curPage === 'resident-alerts' ? 'active' : ''}" onclick="goTo('resident-alerts'); closeMobileMenu();">
          <span style="font-size:16px;">📢</span>
          <span style="flex:1; font-weight:600;">Emergency Advisories</span>
          ${curPage === 'resident-alerts' ? '<span style="font-size:10px; color:var(--cyber); font-family:var(--font-mono);">●</span>' : ''}
        </a>
        <a class="mobile-drawer-item ${curPage === 'resident-guide' ? 'active' : ''}" onclick="goTo('resident-guide'); closeMobileMenu();">
          <span style="font-size:16px;">📖</span>
          <span style="flex:1; font-weight:600;">Preparedness Guide</span>
          ${curPage === 'resident-guide' ? '<span style="font-size:10px; color:var(--cyber); font-family:var(--font-mono);">●</span>' : ''}
        </a>
        <a class="mobile-drawer-item ${curPage === 'resident-activity' ? 'active' : ''}" onclick="goTo('resident-activity'); closeMobileMenu();">
          <span style="font-size:16px;">⭐</span>
          <span style="flex:1; font-weight:600;">Saved Locations</span>
          ${curPage === 'resident-activity' ? '<span style="font-size:10px; color:var(--cyber); font-family:var(--font-mono);">●</span>' : ''}
        </a>
        <a class="mobile-drawer-item ${curPage === 'resident-radar' ? 'active' : ''}" onclick="goTo('resident-radar'); closeMobileMenu();">
          <span style="font-size:16px;">📡</span>
          <span style="flex:1; font-weight:600;">1,000km Live Radar</span>
          ${curPage === 'resident-radar' ? '<span style="font-size:10px; color:var(--cyber); font-family:var(--font-mono);">●</span>' : ''}
        </a>
        <a class="mobile-drawer-item ${curPage === 'resident-simulation' ? 'active' : ''}" onclick="goTo('resident-simulation'); closeMobileMenu();">
          <span style="font-size:16px;">🧪</span>
          <span style="flex:1; font-weight:600;">Flood Alert Simulator</span>
          ${curPage === 'resident-simulation' ? '<span style="font-size:10px; color:var(--cyber); font-family:var(--font-mono);">●</span>' : ''}
        </a>
      </div>
    `;
  }

  const coreModulesHtml = `
    <div class="mobile-drawer-group">
      <div class="mobile-drawer-heading">Core Disaster Modules</div>
      <a class="mobile-drawer-item ${curPage === 'home' ? 'active' : ''}" onclick="goTo('home'); closeMobileMenu();">
        <span style="font-size:16px;">🏠</span>
        <span style="flex:1; font-weight:600;">National Radar Overview</span>
        ${curPage === 'home' ? '<span style="font-size:10px; color:var(--cyber); font-family:var(--font-mono);">●</span>' : ''}
      </a>
      <a class="mobile-drawer-item ${curPage === 'map' ? 'active' : ''}" onclick="goTo('map'); closeMobileMenu();">
        <span style="font-size:16px;">🗺️</span>
        <span style="flex:1; font-weight:600;">Geospatial GIS Map</span>
        ${curPage === 'map' ? '<span style="font-size:10px; color:var(--cyber); font-family:var(--font-mono);">●</span>' : ''}
      </a>
      <a class="mobile-drawer-item ${curPage === 'records' ? 'active' : ''}" onclick="goTo('records'); closeMobileMenu();">
        <span style="font-size:16px;">📚</span>
        <span style="flex:1; font-weight:600;">Disaster Catalog (10k)</span>
        ${curPage === 'records' ? '<span style="font-size:10px; color:var(--cyber); font-family:var(--font-mono);">●</span>' : ''}
      </a>
      <a class="mobile-drawer-item ${curPage === 'analytics' ? 'active' : ''}" onclick="goTo('analytics'); closeMobileMenu();">
        <span style="font-size:16px;">📈</span>
        <span style="flex:1; font-weight:600;">Climate Trends (24-Yr)</span>
        ${curPage === 'analytics' ? '<span style="font-size:10px; color:var(--cyber); font-family:var(--font-mono);">●</span>' : ''}
      </a>
      <a class="mobile-drawer-item ${curPage === 'alerts' ? 'active' : ''}" onclick="goTo('alerts'); closeMobileMenu();">
        <span style="font-size:16px;">🚨</span>
        <span style="flex:1; font-weight:600;">Emergency Alerts &amp; Siren</span>
        ${curPage === 'alerts' ? '<span style="font-size:10px; color:var(--cyber); font-family:var(--font-mono);">●</span>' : ''}
      </a>
      ${role === 'admin' || role === 'analyst' ? `
        <a class="mobile-drawer-item ${curPage === 'command' ? 'active' : ''}" onclick="goTo('command'); closeMobileMenu();">
          <span style="font-size:16px;">⚡</span>
          <span style="flex:1; font-weight:600;">Threat Command</span>
          ${curPage === 'command' ? '<span style="font-size:10px; color:var(--cyber); font-family:var(--font-mono);">●</span>' : ''}
        </a>
        <a class="mobile-drawer-item ${curPage === 'dashboard' ? 'active' : ''}" onclick="goTo('dashboard'); closeMobileMenu();">
          <span style="font-size:16px;">📊</span>
          <span style="flex:1; font-weight:600;">MLOps Benchmarks</span>
          ${curPage === 'dashboard' ? '<span style="font-size:10px; color:var(--cyber); font-family:var(--font-mono);">●</span>' : ''}
        </a>
      ` : ''}
    </div>
  `;

  const utilitiesHtml = `
    <div class="mobile-drawer-group" style="border-top:1px solid var(--glass-border); padding-top:10px; margin-top:12px;">
      <div class="mobile-drawer-heading">Operator Preferences</div>
      <a class="mobile-drawer-item ${curPage === 'profile' ? 'active' : ''}" onclick="goTo('profile'); closeMobileMenu();">
        <span style="font-size:16px;">👤</span>
        <span style="flex:1; font-weight:600;">Operator Profile</span>
        ${curPage === 'profile' ? '<span style="font-size:10px; color:var(--cyber); font-family:var(--font-mono);">●</span>' : ''}
      </a>
      <a class="mobile-drawer-item ${curPage === 'settings' ? 'active' : ''}" onclick="goTo('settings'); closeMobileMenu();">
        <span style="font-size:16px;">⚙️</span>
        <span style="flex:1; font-weight:600;">System Settings</span>
        ${curPage === 'settings' ? '<span style="font-size:10px; color:var(--cyber); font-family:var(--font-mono);">●</span>' : ''}
      </a>
      ${state.user ? `
        <a class="mobile-drawer-item" onclick="closeMobileMenu(); logout();" style="color:var(--red);">
          <span style="font-size:16px;">⎋</span>
          <span style="flex:1; font-weight:600;">Sign Out</span>
        </a>
      ` : `
        <a class="mobile-drawer-item" onclick="closeMobileMenu(); goTo('login');" style="color:var(--accent-primary);">
          <span style="font-size:16px;">➔</span>
          <span style="flex:1; font-weight:600;">Sign In</span>
        </a>
      `}
    </div>
  `;

  return `
    ${roleSwitcherHtml}
    ${roleItemsHtml}
    ${coreModulesHtml}
    ${utilitiesHtml}
  `;
}

function openMobileMenu() {
  const drawer = document.getElementById('mobileDrawerMenu');
  if (!drawer) return;
  drawer.classList.add('open');

  const role = state.user?.role || 'resident';

  // Render User Status in Drawer
  const userSlot = document.getElementById('mobileDrawerUserSlot');
  if (userSlot) {
    if (state.user) {
      userSlot.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-size:14px; font-weight:700; color:var(--text-0);">${escapeHtml(state.user.displayName || state.user.email)}</div>
            <div style="font-size:11.5px; color:var(--text-2); font-family:var(--font-mono);">${state.user.email}</div>
          </div>
          <span class="role-indicator-badge" style="background:${getRoleColor(role)}22; color:${getRoleColor(role)}; border:1px solid ${getRoleColor(role)}55; font-size:10px; font-weight:700; padding:2px 8px; border-radius:6px;">
            ${role.toUpperCase()}
          </span>
        </div>
      `;
    } else {
      userSlot.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-size:13px; font-weight:600; color:var(--text-0);">Civilian / Guest Mode</div>
            <div style="font-size:11.5px; color:var(--text-2);">Sign in for responder &amp; analyst access</div>
          </div>
          <button class="btn btn-sm btn-primary" onclick="closeMobileMenu(); openAuthModal('login');" style="font-size:11px; padding:5px 10px;">Sign In</button>
        </div>
      `;
    }
  }

  // Render Mobile Drawer Navigation with Role Switcher & Role-Configured Screens
  const navList = document.getElementById('mobileDrawerNavList');
  if (navList) {
    navList.innerHTML = renderMobileDrawerNavigation();
  }
}

function closeMobileMenu() {
  const drawer = document.getElementById('mobileDrawerMenu');
  if (drawer) drawer.classList.remove('open');
}

/* ================= 4. ROUTER & PAGE RENDERING ================= */
let _pageTransitionTimer = null;

function goTo(page) {
  const check = checkRouteAccess(page);
  
  if (!check.allowed && check.reason === 'unauthenticated') {
    state.redirectAfterLogin = page;
    state.page = 'login';
  } else {
    state.page = page;
  }

  // Synchronize layout architecture (Layout A vs Layout B)
  renderShell();

  const existingRoot = document.getElementById('pageRoot');
  if (existingRoot) {
    existingRoot.classList.add('page-exit');
    if (_pageTransitionTimer) clearTimeout(_pageTransitionTimer);
    _pageTransitionTimer = setTimeout(() => {
      renderPage();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 120);
  } else {
    renderPage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function renderPage() {
  const main = document.getElementById('main');
  if (!main) return;

  main.innerHTML = `<div class="page active stagger-in" id="pageRoot"></div>`;
  const root = document.getElementById('pageRoot');

  // Page-level Authorization Check
  const check = checkRouteAccess(state.page);
  if (!check.allowed) {
    renderAccessRestricted(root, check);
    updatePermissionsHeaderBadge();
    return;
  }

  const routes = {
    // Public Experience (Layout A)
    splash: typeof renderSplash === 'function' ? renderSplash : renderHome,
    onboarding: typeof renderOnboarding === 'function' ? renderOnboarding : renderHome,
    landing: typeof renderLanding === 'function' ? renderLanding : renderHome,
    home: renderHome,
    login: typeof renderLogin === 'function' ? renderLogin : renderHome,
    terms: typeof renderTerms === 'function' ? renderTerms : renderHome,
    privacy: typeof renderPrivacy === 'function' ? renderPrivacy : renderHome,

    // Cross-Role Utilities (Layout B)
    profile: typeof renderProfile === 'function' ? renderProfile : renderHome,
    settings: typeof renderSettings === 'function' ? renderSettings : renderHome,

    // Admin Workspace (5 Screens)
    'admin-ops': typeof renderAdminOps === 'function' ? renderAdminOps : renderHome,
    'admin-users': typeof renderAdminUsers === 'function' ? renderAdminUsers : renderHome,
    'admin-config': typeof renderAdminConfig === 'function' ? renderAdminConfig : renderHome,
    'admin-alerts': typeof renderAdminAlerts === 'function' ? renderAdminAlerts : renderHome,
    'admin-audit': typeof renderAdminAudit === 'function' ? renderAdminAudit : renderHome,

    // Analyst Workspace (5 Screens)
    'analyst-predict': typeof renderAnalystPredict === 'function' ? renderAnalystPredict : renderHome,
    'analyst-shap': typeof renderAnalystShap === 'function' ? renderAnalystShap : renderHome,
    'analyst-comparison': typeof renderAnalystComparison === 'function' ? renderAnalystComparison : renderHome,
    'analyst-history': typeof renderAnalystHistory === 'function' ? renderAnalystHistory : renderHome,
    'analyst-threat': typeof renderAnalystThreat === 'function' ? renderAnalystThreat : renderHome,

    // Resident Workspace (6 Screens)
    'resident-risk': typeof renderResidentRisk === 'function' ? renderResidentRisk : renderHome,
    'resident-weather': typeof renderResidentWeather === 'function' ? renderResidentWeather : renderHome,
    'resident-alerts': typeof renderResidentAlerts === 'function' ? renderResidentAlerts : renderHome,
    'resident-guide': typeof renderResidentGuide === 'function' ? renderResidentGuide : renderHome,
    'resident-activity': typeof renderResidentActivity === 'function' ? renderResidentActivity : renderHome,
    'resident-radar': typeof renderResidentRadar === 'function' ? renderResidentRadar : renderHome,
    'resident-simulation': typeof renderResidentSimulation === 'function' ? renderResidentSimulation : renderHome,

    // Preserved Operational Screens
    portal: renderPortal,
    command: renderCommand,
    map: renderMap,
    predict: renderPredict,
    weather: renderWeather,
    dashboard: renderDashboard,
    analytics: renderAnalytics,
    records: renderRecords,
    dataset: renderRecords,
    alerts: typeof renderAlerts === 'function' ? renderAlerts : renderCommand,
  };

  // Immediate component skeleton injection for liquid smooth component-based loading
  if (typeof renderViewSkeleton === 'function') {
    root.innerHTML = renderViewSkeleton(state.page);
  }

  if (routes[state.page]) {
    routes[state.page](root);
  } else {
    routes.home(root);
  }
  updatePermissionsHeaderBadge();
  if (typeof translateCurrentPage === 'function') {
    translateCurrentPage();
  }

  // Invalidate Leaflet map canvas size after transition completes to ensure crisp bounds
  setTimeout(() => {
    if (state.page === 'map' && typeof leafletMap !== 'undefined' && leafletMap) {
      try { leafletMap.invalidateSize(); } catch (e) {}
    }
  }, 260);
}

function renderFooter() {
  const f = document.getElementById('footer');
  if (!f) return;
  f.innerHTML = `
    <div class="footer-grid">
      <div>
        <div class="brand"><span class="mark">${iconWave()}</span> FloodAI</div>
        <p style="color:var(--text-1); font-size:13px; margin-top:12px; max-width:340px; line-height:1.7;">
          AI Disaster Threat Intelligence &amp; Early Warning Platform fusing machine learning,
          topographic GIS, Digital Elevation Models, and automated multi-channel alert delivery.
        </p>
        <div class="foot-badges">
          <span>XGBoost</span><span>Random Forest</span><span>SHAP</span><span>Groq LLaMA</span><span>Node.js</span><span>MongoDB Atlas</span><span>Leaflet GeoJSON</span><span>Firebase FCM</span><span>Brevo Email</span>
        </div>
      </div>
      <div>
        <h3 style="font-family:var(--font-display); font-size:15px; margin-bottom:14px;">Platform Architecture</h3>
        <p style="color:var(--text-1); font-size:13px; line-height:2;">
          Inference Engine: XGBoost + Random Forest<br/>
          Threat Intelligence: Groq Qwen 2.5 / GPT-OSS<br/>
          Push Notifications: Firebase Web Messaging (FCM)<br/>
          Geospatial Standard: GeoJSON + RainViewer Radar<br/>
          Database: MongoDB Atlas Persistent Cluster (10k Records)
        </p>
      </div>
      <div>
        <h3 style="font-family:var(--font-display); font-size:15px; margin-bottom:14px; display:flex; align-items:center; gap:8px;">
          <span>🛡️</span> Civil Defense Portal
        </h3>
        <div class="contact-form">
          <input type="text" id="footerReportUnit" class="glass-input" placeholder="Disaster Management Unit (e.g. Sector 4 QRF)">
          <textarea rows="3" id="footerReportNotes" class="glass-input" placeholder="Operational comments / Field report..."></textarea>
          <button class="btn btn-primary" onclick="submitFieldReport()" style="width:100%; justify-content:center; gap:8px;">
            📨 Submit Field Report
          </button>
        </div>
      </div>
    </div>
    <div style="text-align:center; color:var(--text-2); font-size:12px; margin-top:36px;">
      © 2026 FloodAI Disaster Threat Intelligence Platform — Production Build v2.5 (Modular)
    </div>
  `;
}

function submitFieldReport() {
  const unit = document.getElementById('footerReportUnit')?.value?.trim();
  const notes = document.getElementById('footerReportNotes')?.value?.trim();
  if (!unit && !notes) {
    toast('Please enter a disaster management unit or field report notes.');
    return;
  }
  toast(`Report filed for ${unit || 'Disaster Unit'} — Logged to operational incident stream`);
  if (document.getElementById('footerReportUnit')) document.getElementById('footerReportUnit').value = '';
  if (document.getElementById('footerReportNotes')) document.getElementById('footerReportNotes').value = '';
}

/* ================= 5. LOCATION SECTOR & WORLDWIDE CITY PICKER MODAL ================= */
let locSearchDebounceTimer = null;

function openLocPickerModal() {
  const m = document.getElementById('locPickerModal');
  if (m) m.classList.add('open');
  renderLocPickerBody();
}

function closeLocPickerModal() {
  const m = document.getElementById('locPickerModal');
  if (m) m.classList.remove('open');
}

function renderLocPickerBody() {
  const body = document.getElementById('locPickerModalBody');
  if (!body) return;

  const cur = GeoLocationService.getStatus();
  const coords = cur.coords;
  const isRequesting = cur.status === 'requesting';
  const placeLabel = coords
    ? (coords.cityName || coords.district || `${coords.lat.toFixed(2)}°, ${coords.lon.toFixed(2)}°`)
    : (isRequesting ? 'Acquiring GPS...' : 'Not determined');
  const isGps = coords?.source === 'gps';
  const isManual = coords?.source === 'manual';
  const isCached = coords?.source === 'cached' || coords?.isCached;

  // Auto-populate city input with fetched place name or coordinates
  let cityInputValue = '';
  if (coords) {
    if (coords.cityName) {
      cityInputValue = coords.cityName + (coords.stateName ? `, ${coords.stateName}` : '');
    } else if (coords.district) {
      cityInputValue = coords.district + (coords.stateName ? `, ${coords.stateName}` : '');
    } else if (coords.locality) {
      cityInputValue = coords.locality;
    } else if (typeof coords.lat === 'number') {
      cityInputValue = `${coords.lat.toFixed(4)}°, ${coords.lon.toFixed(4)}°`;
    }
  }

  // Available monitored districts
  const distList = (typeof DISTRICTS !== 'undefined' && DISTRICTS.length)
    ? DISTRICTS
    : (typeof DEFAULT_MONITORED_DISTRICTS !== 'undefined' ? DEFAULT_MONITORED_DISTRICTS : []);

  // Auto-select matching or nearest monitored disaster district
  let matchedDistrict = '';
  if (distList.length && coords) {
    const exact = distList.find(d => 
      (coords.district && d.district.toLowerCase() === coords.district.toLowerCase()) ||
      (coords.cityName && d.district.toLowerCase() === coords.cityName.toLowerCase()) ||
      (coords.cityName && coords.cityName.toLowerCase().includes(d.district.toLowerCase())) ||
      (coords.district && coords.district.toLowerCase().includes(d.district.toLowerCase()))
    );
    if (exact) {
      matchedDistrict = exact.district;
    } else if (coords.nearestDistrict) {
      matchedDistrict = coords.nearestDistrict;
    } else if (typeof coords.lat === 'number' && typeof coords.lon === 'number') {
      let minDist = Infinity;
      distList.forEach(d => {
        if (typeof d.latitude === 'number' && typeof d.longitude === 'number') {
          const dist = Math.hypot(coords.lat - d.latitude, coords.lon - d.longitude);
          if (dist < minDist) {
            minDist = dist;
            matchedDistrict = d.district;
          }
        }
      });
    }
  }

  body.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:16px;">
      <div>
        <h3 style="font-family:var(--font-display); font-size:18px; margin-bottom:6px; display:flex; align-items:center; gap:8px;">
          <span>📍</span> Location &amp; Environmental Intelligence
        </h3>
        <p style="font-size:12.5px; color:var(--text-1); line-height:1.5;">
          Determine your atmospheric coordinates via device GPS or choose any global city or monitored district manually.
        </p>
      </div>

      <!-- Current Location Status Card -->
      <div style="padding:14px; border-radius:12px; background:rgba(255,255,255,0.03); border:1px solid var(--panel-border);">
        <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.8px; color:var(--text-2); margin-bottom:6px;">Current Status</div>
        <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
          <div>
            <div style="font-size:14px; font-weight:700; color:var(--text-0); display:flex; align-items:center; gap:6px;">
              <span>${isGps ? '🛰️ Device GPS' : (isManual ? '📍 Manual Location' : (isRequesting ? '🔄 Acquiring GPS' : '⚡ Standby'))}</span>
              <span style="color:var(--cyber);">${escapeHtml(placeLabel)}</span>
            </div>
            ${coords ? `<div style="font-size:11px; font-family:var(--font-mono); color:var(--text-2); margin-top:3px;">${coords.lat.toFixed(4)}°, ${coords.lon.toFixed(4)}° (±${coords.accuracyMeters}m accuracy)</div>` : ''}
            ${isRequesting ? `<div style="font-size:11.5px; color:var(--cyber); margin-top:4px;"><span class="spin-anim">🔄</span> Contacting satellite &amp; geocoding sensor feeds...</div>` : ''}
          </div>
          <button class="btn btn-sm" id="btnPickerGpsDetect" onclick="acquireGpsFromModal()" style="gap:6px;" ${isRequesting ? 'disabled' : ''}>
            ${isRequesting ? '<span class="spin-anim">🔄</span> Acquiring GPS Lock...' : '🛰️ Acquire GPS Lock'}
          </button>
        </div>
        ${cur.error ? `<div style="font-size:11.5px; color:var(--amber); margin-top:8px; line-height:1.4;">⚠️ ${escapeHtml(cur.error)}</div>` : ''}
      </div>

      <!-- Worldwide City Geocoding Search -->
      <div>
        <label style="font-size:12px; font-weight:600; color:var(--text-1); margin-bottom:6px; display:flex; align-items:center; justify-content:space-between;">
          <span>Search Any Worldwide City</span>
          ${(isGps || isCached) && cityInputValue ? `<span style="font-size:11px; color:var(--cyber); font-weight:600; display:inline-flex; align-items:center; gap:4px;">✓ Auto-updated from GPS</span>` : ''}
        </label>
        <div class="city-search-wrap">
          <span class="city-search-icon">🔍</span>
          <input type="text" id="locPickerSearchInput" class="city-search-input" value="${escapeHtml(cityInputValue)}" placeholder="Type city name (e.g. London, Tokyo, Mumbai, New York)..." autocomplete="off" oninput="handlePickerCitySearch(this.value)">
        </div>
        <div id="pickerSearchResults" class="city-search-results"></div>
      </div>

      <!-- Monitored Disaster Districts Quick-Select -->
      <div class="field">
        <label style="font-size:12px; font-weight:600; color:var(--text-1); display:flex; align-items:center; justify-content:space-between;">
          <span>Or Select Monitored Disaster District</span>
          ${(isGps || isCached) && matchedDistrict ? `<span style="font-size:11px; color:var(--ocean); font-weight:600; display:inline-flex; align-items:center; gap:4px;">✓ Auto-selected nearest sector (${escapeHtml(matchedDistrict)})</span>` : ''}
        </label>
        <select id="modalDistrictSelect" onchange="onPickerDistrictSelectChange(this.value)" style="margin-top:6px;">
          <option value="">-- Choose Monitored Sector --</option>
          ${distList.map(d => {
            const isSelected = Boolean(matchedDistrict && matchedDistrict.toLowerCase() === d.district.toLowerCase());
            return `
              <option value="${d.district}" ${isSelected ? 'selected' : ''}>
                ${d.district}, ${d.state} (${d.avg_elevation}m elevation)${isSelected && coords?.source === 'gps' && coords?.cityName !== d.district ? ' — [Nearest Monitored Sector]' : ''}
              </option>
            `;
          }).join('')}
        </select>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:8px;">
        <button class="btn btn-ghost" onclick="closeLocPickerModal()">Done</button>
      </div>
    </div>
  `;

  // Explicit programmatic synchronization to guarantee DOM input values match
  const inputEl = document.getElementById('locPickerSearchInput');
  if (inputEl && cityInputValue) {
    inputEl.value = cityInputValue;
  }
  const selectEl = document.getElementById('modalDistrictSelect');
  if (selectEl && matchedDistrict) {
    selectEl.value = matchedDistrict;
  }
}

async function acquireGpsFromModal() {
  const btn = document.getElementById('btnPickerGpsDetect');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="spin-anim">🔄</span> Acquiring GPS Lock...`;
  }
  try {
    if (typeof GeoLocationService !== 'undefined') {
      await GeoLocationService.requestDeviceLocation(true);
    }
  } finally {
    renderLocPickerBody();
  }
}

function onPickerDistrictSelectChange(val) {
  if (!val) return;
  if (typeof GeoLocationService !== 'undefined') {
    GeoLocationService.selectManualDistrict(val);
  }
  const distList = (typeof DISTRICTS !== 'undefined' && DISTRICTS.length)
    ? DISTRICTS
    : (typeof DEFAULT_MONITORED_DISTRICTS !== 'undefined' ? DEFAULT_MONITORED_DISTRICTS : []);
  const d = distList.find(x => x.district.toLowerCase() === val.toLowerCase());
  const inputEl = document.getElementById('locPickerSearchInput');
  if (inputEl && d) {
    inputEl.value = `${d.district}, ${d.state}`;
  }
  renderLocPickerBody();
}

// Auto-update modal if GPS finishes resolving while modal is open
if (typeof GeoLocationService !== 'undefined') {
  const subscribeFn = GeoLocationService.subscribe || GeoLocationService.addListener;
  if (typeof subscribeFn === 'function') {
    subscribeFn.call(GeoLocationService, () => {
      const modal = document.getElementById('locPickerModal');
      if (modal && modal.classList.contains('open')) {
        renderLocPickerBody();
      }
    });
  }
}

function handlePickerCitySearch(query) {
  clearTimeout(locSearchDebounceTimer);
  const container = document.getElementById('pickerSearchResults');
  if (!container) return;

  const clean = String(query || '').trim();
  if (clean.length < 2) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `<div style="font-size:12px; color:var(--text-2); padding:8px 0;"><span class="spin-anim">🔄</span> Searching OpenWeather geocoding database...</div>`;

  locSearchDebounceTimer = setTimeout(async () => {
    try {
      const results = await WeatherService.searchCities(clean);
      if (!Array.isArray(results) || results.length === 0) {
        container.innerHTML = `<div style="font-size:12px; color:var(--text-2); padding:8px 0;">No matching cities found for "${escapeHtml(clean)}".</div>`;
        return;
      }
      container.innerHTML = results.map(r => `
        <div class="city-search-item" onclick="selectCityFromPickerModal(${r.lat}, ${r.lon}, '${escapeHtml(r.name)}', '${escapeHtml(r.country || '')}', '${escapeHtml(r.state || '')}')">
          <div>
            <div style="font-size:13px; font-weight:700; color:var(--text-0);">${escapeHtml(r.name)}${r.state ? `, ${escapeHtml(r.state)}` : ''} <span style="font-size:11px; color:var(--cyber); font-weight:600;">${escapeHtml(r.country || '')}</span></div>
            <div style="font-size:10.5px; font-family:var(--font-mono); color:var(--text-2); margin-top:2px;">${r.lat.toFixed(3)}°, ${r.lon.toFixed(3)}°</div>
          </div>
          <button class="btn btn-sm btn-ghost" style="padding:4px 10px; font-size:11px;">Select</button>
        </div>
      `).join('');
    } catch (e) {
      container.innerHTML = `<div style="font-size:12px; color:var(--red); padding:8px 0;">City search error: ${escapeHtml(e.message)}</div>`;
    }
  }, 320);
}

function selectCityFromPickerModal(lat, lon, name, country, state) {
  GeoLocationService.selectManualLocation({ lat, lon, name, country, state });
  renderLocPickerBody();
}

/* ================= 5b. CLIMATE ATMOSPHERE & WEATHER INTELLIGENCE MODAL ================= */
let climateSearchDebounceTimer = null;

function openClimateModal() {
  const m = document.getElementById('climateModal');
  if (m) m.classList.add('open');
  renderClimateModalBody();
}

function closeClimateModal() {
  const m = document.getElementById('climateModal');
  if (m) m.classList.remove('open');
}

function renderClimateModalBody() {
  const body = document.getElementById('climateModalBody');
  if (!body) return;

  const c = AtmosphereController.currentClimateState || ClimateStateResolver.getNeutralClimateState();
  const engine = window.climateParticleEngine;
  const isOverride = Boolean(engine?.settings.manualOverrideCondition);
  const activeCondition = engine?.currentCondition || c.condition;
  const isRefreshing = AtmosphereController.isRefreshing;
  const isStale = c.dataFreshness === 'stale';

  const loc = c.location || {};
  const isGps = loc.source === 'gps';

  body.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:16px;">
      <!-- Title & Live Status Bar -->
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:14px; flex-wrap:wrap; border-bottom:1px solid var(--panel-border); padding-bottom:14px; padding-right:38px;">
        <div style="flex:1; min-width:220px;">
          <h3 style="font-family:var(--font-display); font-size:19px; font-weight:700; margin:0 0 4px 0; display:flex; align-items:center; gap:8px; color:var(--text-0);">
            <span>🌦️</span> Atmospheric Climate &amp; Weather Engine
          </h3>
          <p style="font-size:12.5px; color:var(--text-1); line-height:1.45; margin:0;">
            Location-aware atmospheric simulation powered in real-time by the OpenWeather API.
          </p>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <button class="btn btn-sm btn-ghost" onclick="AtmosphereController.refreshWeather()" title="Fetch latest atmospheric telemetry" ${isRefreshing ? 'disabled' : ''} style="gap:6px; font-size:12px; padding:6px 12px; border-radius:8px;">
            <span class="${isRefreshing ? 'spin-anim' : ''}">🔄</span>
            <span>${isRefreshing ? 'Refreshing...' : 'Refresh Weather'}</span>
          </button>
        </div>
      </div>

      <!-- Live Telemetry Hero Card -->
      <div class="climate-hero-card">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:14px;">
          <div style="display:flex; align-items:center; gap:16px;">
            <div style="font-size:46px; line-height:1;">${c.icon}</div>
            <div>
              <div style="font-size:32px; font-weight:800; font-family:var(--font-display); color:var(--text-0); letter-spacing:-0.5px;">
                ${typeof c.temperature === 'number' ? `${c.temperature}°C` : '--'}
              </div>
              <div style="font-size:13.5px; font-weight:600; color:var(--cyber); text-transform:capitalize;">
                ${escapeHtml(c.weatherDescription || c.category)}
              </div>
              <div style="font-size:11.5px; color:var(--text-2); margin-top:2px;">
                Feels like ${typeof c.feelsLike === 'number' ? `${c.feelsLike}°C` : '--'} · Min ${c.tempMin}° / Max ${c.tempMax}°
              </div>
            </div>
          </div>

          <div style="text-align:right;">
            <div style="display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border-radius:8px; background:rgba(255,255,255,0.06); font-size:11.5px; font-weight:600;">
              <span>${isGps ? '🛰️ Device GPS' : '📍 Manual Sector'}</span>
              <span style="color:var(--text-0); font-weight:700;">${escapeHtml(loc.name || 'Unknown')}</span>
              ${loc.country ? `<span style="color:var(--cyber); font-size:10px;">${escapeHtml(loc.country)}</span>` : ''}
            </div>
            <div style="font-size:11px; color:var(--text-2); margin-top:6px; font-family:var(--font-mono);">
              Observed: ${c.observedAt || 'Standby'}
              <span style="margin-left:4px; padding:1px 6px; border-radius:4px; font-size:9.5px; font-weight:700; ${isStale ? 'background:rgba(255,184,77,0.2); color:#FFB84D;' : 'background:rgba(31,224,168,0.2); color:#1FE0A8;'}">
                ${isStale ? 'STALE CACHE' : 'LIVE TELEMETRY'}
              </span>
            </div>
            ${loc.lat ? `<div style="font-size:10px; color:var(--text-2); margin-top:2px; font-family:var(--font-mono);">${loc.lat.toFixed(3)}°N, ${loc.lon.toFixed(3)}°E</div>` : ''}
          </div>
        </div>

        <!-- 6-Cell Atmospheric Telemetry Grid -->
        <div class="climate-telemetry-grid">
          <div class="climate-telemetry-cell">
            <span class="climate-telemetry-label">Relative Humidity</span>
            <span class="climate-telemetry-value">${c.humidity}%</span>
          </div>
          <div class="climate-telemetry-cell">
            <span class="climate-telemetry-label">Wind Velocity &amp; Trajectory</span>
            <span class="climate-telemetry-value">${c.windSpeedKmh} km/h ${c.windBearing} (${c.windDirection}°)</span>
          </div>
          <div class="climate-telemetry-cell">
            <span class="climate-telemetry-label">Cloud Coverage</span>
            <span class="climate-telemetry-value">${c.cloudCoverage}%</span>
          </div>
          <div class="climate-telemetry-cell">
            <span class="climate-telemetry-label">Surface Pressure</span>
            <span class="climate-telemetry-value">${c.pressure} hPa</span>
          </div>
          <div class="climate-telemetry-cell">
            <span class="climate-telemetry-label">Visibility Horizon</span>
            <span class="climate-telemetry-value">${(c.visibility / 1000).toFixed(1)} km</span>
          </div>
          <div class="climate-telemetry-cell">
            <span class="climate-telemetry-label">Solar Phase</span>
            <span class="climate-telemetry-value" style="text-transform:capitalize;">
              ${c.solarPhase === 'night' ? '🌙 Night' : (c.solarPhase === 'sunrise' ? '🌅 Sunrise' : (c.solarPhase === 'sunset' ? '🌇 Sunset' : '☀️ Day'))}
            </span>
          </div>
        </div>
      </div>

      <!-- Atmospheric Engine Controls (Density, Presets & Overrides) -->
      <div style="padding:16px; border-radius:14px; background:rgba(255,255,255,0.02); border:1px solid var(--panel-border);">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
          <div>
            <div style="font-size:13px; font-weight:700; color:var(--text-0);">Atmospheric Profile Selection</div>
            <div style="font-size:11.5px; color:var(--text-2);">
              ${isOverride ? '⚠️ Manual profile override active. Ambient visuals are decoupled from live weather.' : '🟢 Live Mode: Environmental particles adapt automatically to real OpenWeather telemetry.'}
            </div>
          </div>
          ${isOverride ? `
            <button class="btn btn-sm btn-ghost" onclick="AtmosphereController.setManualPreset(null)" style="color:var(--cyber);">
              🛰️ Restore Live Weather Mode
            </button>
          ` : ''}
        </div>

        <!-- 9 Climate Presets -->
        <div class="climate-preset-grid">
          ${[
            { id: 'clear', label: 'Clear Sky', icon: '☀️' },
            { id: 'clouds', label: 'Overcast', icon: '☁️' },
            { id: 'rain', label: 'Rain Drops', icon: '🌧️' },
            { id: 'drizzle', label: 'Drizzle', icon: '🌦️' },
            { id: 'thunderstorm', label: 'Thunderstorm', icon: '⛈️' },
            { id: 'snow', label: 'Snowfall', icon: '❄️' },
            { id: 'fog', label: 'Fog Mist', icon: '🌫️' },
            { id: 'wind', label: 'High Wind', icon: '💨' },
            { id: 'heat', label: 'Extreme Heat', icon: '🔥' }
          ].map(p => `
            <button class="climate-preset-btn ${activeCondition === p.id ? 'active' : ''}" onclick="AtmosphereController.setManualPreset('${p.id}')">
              <span style="font-size:18px;">${p.icon}</span>
              <span>${p.label}</span>
            </button>
          `).join('')}
        </div>

        <!-- Particle Density & Motion Accessibility -->
        <div style="margin-top:16px; padding-top:14px; border-top:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div>
            <div style="font-size:12px; font-weight:600; color:var(--text-1);">Particle Density</div>
            <div class="climate-density-chips">
              ${['off', 'low', 'balanced', 'high'].map(d => `
                <button class="climate-density-chip ${engine?.settings.density === d ? 'active' : ''}" onclick="AtmosphereController.setDensity('${d}')">
                  ${d.toUpperCase()}
                </button>
              `).join('')}
            </div>
          </div>

          <div style="display:flex; align-items:center; gap:16px;">
            <label style="display:flex; align-items:center; gap:6px; font-size:12px; color:var(--text-1); cursor:pointer;">
              <input type="checkbox" id="chkClimateReducedMotion" ${engine?.settings.isReducedMotion ? 'checked' : ''} onchange="AtmosphereController.setReducedMotion(this.checked)">
              <span>Reduced Motion</span>
            </label>
            <label style="display:flex; align-items:center; gap:6px; font-size:12px; color:var(--text-1); cursor:pointer;">
              <input type="checkbox" id="chkClimateLightning" ${engine?.settings.allowLightning ? 'checked' : ''} onchange="if(window.climateParticleEngine) window.climateParticleEngine.settings.allowLightning = this.checked">
              <span>Lightning Flashes</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Quick Location & City Search Integration -->
      <div style="padding:16px; border-radius:14px; background:rgba(255,255,255,0.02); border:1px solid var(--panel-border);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <div style="font-size:13px; font-weight:700; color:var(--text-0);">Location &amp; Geocoding Target</div>
          <button class="btn btn-sm btn-ghost" onclick="GeoLocationService.requestDeviceLocation(true).then(() => renderClimateModalBody())" style="gap:4px;">
            🛰️ Use GPS Position
          </button>
        </div>
        <div class="city-search-wrap">
          <span class="city-search-icon">🔍</span>
          <input type="text" id="climateCitySearchInput" class="city-search-input" placeholder="Search any city worldwide (e.g. London, Paris, Tokyo, Sydney, Singapore)..." autocomplete="off" oninput="handleClimateCitySearch(this.value)">
        </div>
        <div id="climateCitySearchResults" class="city-search-results"></div>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button class="btn btn-ghost" onclick="closeClimateModal()">Close</button>
      </div>
    </div>
  `;
}

function handleClimateCitySearch(query) {
  clearTimeout(climateSearchDebounceTimer);
  const container = document.getElementById('climateCitySearchResults');
  if (!container) return;

  const clean = String(query || '').trim();
  if (clean.length < 2) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `<div style="font-size:12px; color:var(--text-2); padding:8px 0;"><span class="spin-anim">🔄</span> Querying OpenWeather Geocoding API...</div>`;

  climateSearchDebounceTimer = setTimeout(async () => {
    try {
      const results = await WeatherService.searchCities(clean);
      if (!Array.isArray(results) || results.length === 0) {
        container.innerHTML = `<div style="font-size:12px; color:var(--text-2); padding:8px 0;">No matching cities found for "${escapeHtml(clean)}".</div>`;
        return;
      }
      container.innerHTML = results.map(r => `
        <div class="city-search-item" onclick="selectCityFromClimateModal(${r.lat}, ${r.lon}, '${escapeHtml(r.name)}', '${escapeHtml(r.country || '')}', '${escapeHtml(r.state || '')}')">
          <div>
            <div style="font-size:13px; font-weight:700; color:var(--text-0);">${escapeHtml(r.name)}${r.state ? `, ${escapeHtml(r.state)}` : ''} <span style="font-size:11px; color:var(--cyber); font-weight:600;">${escapeHtml(r.country || '')}</span></div>
            <div style="font-size:10.5px; font-family:var(--font-mono); color:var(--text-2); margin-top:2px;">${r.lat.toFixed(3)}°, ${r.lon.toFixed(3)}°</div>
          </div>
          <button class="btn btn-sm btn-ghost" style="padding:4px 10px; font-size:11px;">Select &amp; Apply</button>
        </div>
      `).join('');
    } catch (e) {
      container.innerHTML = `<div style="font-size:12px; color:var(--red); padding:8px 0;">City search error: ${escapeHtml(e.message)}</div>`;
    }
  }, 320);
}

function selectCityFromClimateModal(lat, lon, name, country, state) {
  GeoLocationService.selectManualLocation({ lat, lon, name, country, state });
  // Also revert manual preset override so live weather of selected city immediately drives engine
  if (AtmosphereController.mode === 'manual') {
    AtmosphereController.setManualPreset(null);
  }
  renderClimateModalBody();
}

/* ================= 6. EMERGENCY SOS WORKFLOW ================= */
function openSosConfirmModal() {
  const m = document.getElementById('sosConfirmModal');
  if (m) m.classList.add('open');
  renderSosConfirmBody();
}

function closeSosConfirmModal() {
  const m = document.getElementById('sosConfirmModal');
  if (m) m.classList.remove('open');
}

function renderSosConfirmBody() {
  const body = document.getElementById('sosConfirmModalBody');
  if (!body) return;

  const loc = GeoLocationService.getStatus();
  const district = loc.coords?.district || (state.userLocation ? 'Detected GPS Sector' : (DISTRICTS[0]?.district || 'Chennai'));
  const user = state.user;

  body.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:16px;">
      <div style="display:flex; align-items:center; gap:12px;">
        <span style="font-size:36px;">🚨</span>
        <div>
          <h3 style="font-family:var(--font-display); font-size:20px; font-weight:700; color:var(--risk-critical); margin:0;">
            Confirm Emergency SOS Broadcast
          </h3>
          <span style="font-size:12px; color:var(--text-muted);">High-Priority Disaster Dispatch Event</span>
        </div>
      </div>

      <div style="padding:16px; border-radius:12px; background:rgba(240, 82, 96, 0.12); border:1px solid rgba(240, 82, 96, 0.4); line-height:1.5; font-size:13px; color:var(--text-primary);">
        <b>Target Sector:</b> ${escapeHtml(district)}<br/>
        <b>Initiator:</b> ${user ? escapeHtml(user.displayName + ' (' + user.email + ')') : 'Guest / Civilian Session'}<br/>
        <b>Channels:</b> SMS Alert to Civil Defense, FCM Browser Web Push, and Brevo Email Dispatch.
      </div>

      <p style="font-size:12.5px; color:var(--text-secondary); line-height:1.5;">
        This action will immediately activate the emergency alert siren, transmit incident telemetry to backend dispatch routers, and alert emergency response teams in this sector.
      </p>

      <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:10px;">
        <button class="glass-btn" onclick="closeSosConfirmModal()">Cancel</button>
        <button class="glass-btn glass-btn-sos" id="btnConfirmSosDispatch" onclick="dispatchConfirmedSOS('${escapeHtml(district)}')">
          🚨 Confirm &amp; Dispatch SOS
        </button>
      </div>
    </div>
  `;
}

async function dispatchConfirmedSOS(targetDistrict) {
  const btn = document.getElementById('btnConfirmSosDispatch');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> Transmitting SOS...`;
  }

  AlertSound.play('red', { force: true, maxMs: 35000 });
  vibrate([400, 200, 400, 200, 400]);

  try {
    const payload = {
      location: targetDistrict || 'Chennai',
      level: 'Red',
      message: `URGENT: Civilian Emergency SOS Distress Signal triggered for sector ${targetDistrict || 'Chennai'}. Immediate relief required.`,
      directives: [
        'Evacuate ground-level structures to nearest designated shelters.',
        'Follow instructions from field civil protection units.',
        'Keep cellular communication clear for emergency responders.'
      ]
    };

    const outcome = await api('/alerts', 'POST', payload, false);
    toast(`🚨 SOS Dispatched! Logged Alert ID: ${outcome.alert?._id?.substring(0, 8) || 'CONFIRMED'}`);
    closeSosConfirmModal();
    renderFloatingSirenBanner();
  } catch (err) {
    toast(`⚠️ Dispatch notice: ${err.message}. Local siren remains active.`);
    closeSosConfirmModal();
    renderFloatingSirenBanner();
  }
}

function renderFloatingSirenBanner() {
  let b = document.getElementById('floatingSirenBanner');
  if (!b) {
    b = document.createElement('div');
    b.id = 'floatingSirenBanner';
    b.style.cssText = 'position:fixed; bottom:24px; right:24px; z-index:300; display:flex; align-items:center; gap:10px; padding:12px 18px; border-radius:14px; background:rgba(240, 82, 96, 0.95); color:#fff; box-shadow:0 12px 34px rgba(240,82,96,0.6); backdrop-filter:blur(10px); animation:fadeIn 0.3s ease;';
    document.body.appendChild(b);
  }
  b.innerHTML = `
    <span style="font-size:18px; animation:spin 1s linear infinite;">🚨</span>
    <div>
      <div style="font-weight:700; font-size:13px;">ACTIVE EMERGENCY SIREN</div>
      <div style="font-size:11px; opacity:0.9;">Sounding distress alarm</div>
    </div>
    <button class="glass-btn" onclick="silenceEmergencySiren()" style="background:#fff; color:#D62246; font-weight:700; padding:6px 12px; font-size:12px; margin-left:8px;">
      Mute Siren
    </button>
  `;
}

function silenceEmergencySiren() {
  AlertSound.stop();
  const b = document.getElementById('floatingSirenBanner');
  if (b) b.remove();
  toast('Emergency siren muted.');
}

function toggleSOS() {
  if (AlertSound.playing === 'red') {
    silenceEmergencySiren();
    return;
  }
  openSosConfirmModal();
}

/* ================= 7. SYSTEM PERMISSIONS & HARDWARE CENTER ================= */
async function getSystemPermissionsState() {
  const p = {
    push: 'default',
    location: 'prompt',
    audio: AlertSound ? AlertSound.enabled : true,
    email: Boolean(state.user && state.user.email),
    sms: Boolean(state.user && state.user.phoneVerified),
    storage: typeof localStorage !== 'undefined',
  };

  if (typeof Notification === 'undefined') {
    p.push = 'unsupported';
  } else {
    p.push = Notification.permission;
  }

  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
    p.location = 'unsupported';
  } else if (state.userLocation) {
    p.location = 'granted';
  } else if (navigator.permissions && navigator.permissions.query) {
    try {
      const q = await navigator.permissions.query({ name: 'geolocation' });
      p.location = q.state;
    } catch (e) {
      p.location = state.userLocation ? 'granted' : 'prompt';
    }
  }

  return p;
}

function renderLocationHeaderWidget() {
  if (window.climateParticleEngine) {
    window.climateParticleEngine.updateUIBadge();
  }
  const label = document.getElementById('headerLocationLabel');
  if (label && typeof GeoLocationService !== 'undefined') {
    const c = GeoLocationService.coords;
    if (c) {
      label.textContent = c.cityName || c.district || `${c.lat.toFixed(1)}°, ${c.lon.toFixed(1)}°`;
    }
  }
}

async function updatePermissionsHeaderBadge() {
  const el = document.getElementById('permHeaderSummary');
  const btn = document.getElementById('btnHeaderPerms');
  if (!el || !btn) return;

  try {
    const perms = await getSystemPermissionsState();
    let activeCount = 0;
    if (perms.push === 'granted') activeCount++;
    if (perms.location === 'granted') activeCount++;
    if (perms.audio) activeCount++;
    if (perms.email) activeCount++;
    if (perms.sms) activeCount++;

    el.textContent = `${activeCount}/5 Active`;
    if (activeCount >= 4) {
      btn.style.color = 'var(--ocean)';
      btn.style.borderColor = 'rgba(31,224,168,0.35)';
      btn.style.background = 'rgba(31,224,168,0.08)';
    } else if (activeCount >= 2) {
      btn.style.color = 'var(--cyber)';
      btn.style.borderColor = 'rgba(51,199,255,0.35)';
      btn.style.background = 'rgba(51,199,255,0.08)';
    } else {
      btn.style.color = 'var(--amber)';
      btn.style.borderColor = 'rgba(255,184,77,0.35)';
      btn.style.background = 'rgba(255,184,77,0.08)';
    }
  } catch (err) {
    console.warn('[Perms] Update error:', err);
  }
}

function openPermissionsModal() {
  const modal = document.getElementById('permModal');
  if (!modal) return;
  modal.classList.add('open');
  renderPermissionsModalContent();
}

function closePermissionsModal() {
  const modal = document.getElementById('permModal');
  if (modal) modal.classList.remove('open');
  updatePermissionsHeaderBadge();
}

async function renderPermissionsModalContent() {
  const body = document.getElementById('permModalBody');
  if (!body) return;

  const perms = await getSystemPermissionsState();
  let activeCount = 0;
  if (perms.push === 'granted') activeCount++;
  if (perms.location === 'granted') activeCount++;
  if (perms.audio) activeCount++;
  if (perms.email) activeCount++;
  if (perms.sms) activeCount++;

  const pct = Math.round((activeCount / 5) * 100);
  const user = state.user;

  body.innerHTML = `
    <div>
      <div class="eyebrow" style="margin-bottom:6px;">Life-Safety Compliance · Browser &amp; Sensor Access</div>
      <h2 style="font-family:var(--font-display); font-size:22px; margin:0 0 8px;">System Permissions &amp; Telemetry Access</h2>
      <p style="font-size:13px; color:var(--text-1); line-height:1.5; margin-bottom:16px;">
        To calculate hyper-local catchment threats, route you to relief shelters, and sound emergency sirens, FloodAI requires explicit access to device sensors and broadcast channels.
      </p>

      <!-- Readiness Meter -->
      <div style="background:var(--bg-0); padding:16px 18px; border-radius:14px; border:1px solid var(--panel-border);">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <b style="font-size:13px;">Disaster Protection Readiness</b>
          <span style="font-family:var(--font-mono); font-size:12px; font-weight:700; color:${activeCount >= 4 ? 'var(--ocean)' : (activeCount >= 2 ? 'var(--cyber)' : 'var(--amber)')};">
            ${activeCount} of 5 Channels Active (${pct}%)
          </span>
        </div>
        <div class="perm-meter-track" style="margin:10px 0 6px; height:8px; border-radius:6px; background:var(--bg-1); overflow:hidden;">
          <div class="perm-meter-bar" style="width:${pct}%; height:100%; background:linear-gradient(90deg, var(--ocean), var(--cyber)); transition:width 0.4s ease;"></div>
        </div>
        <div style="font-size:11.5px; color:var(--text-2); display:flex; justify-content:space-between;">
          <span>Basic Sensor Telemetry</span>
          <span>Full Multi-Agency Disaster Shield</span>
        </div>
      </div>

      <!-- Quick Action: Grant All Essential -->
      ${(perms.push !== 'granted' || perms.location !== 'granted' || !perms.audio) ? `
        <div style="margin-top:16px;">
          <button class="btn btn-primary" onclick="grantAllEssentialPermissions()" style="width:100%; justify-content:center; padding:12px 18px; font-weight:700; font-size:13px;">
            ⚡ Grant All Essential Permissions (Push, GPS &amp; Audio)
          </button>
        </div>
      ` : `
        <div style="margin-top:14px; padding:10px 14px; border-radius:10px; background:rgba(31,224,168,0.1); border:1px solid rgba(31,224,168,0.25); font-size:12px; color:var(--ocean); text-align:center;">
          🛡️ All essential browser and device permissions are actively protecting your session.
        </div>
      `}

      <!-- Permissions Detailed Grid -->
      <div class="perm-grid" style="display:flex; flex-direction:column; gap:12px; margin-top:16px;">
        <!-- 1. Web Push Disaster Notifications -->
        <div class="perm-item" style="padding:14px; border-radius:10px; background:var(--bg-1); border:1px solid var(--panel-border);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <div style="display:flex; align-items:center; gap:8px; font-weight:600;">
              <span>🔔</span>
              <span>Web Push Disaster Notifications</span>
            </div>
            ${perms.push === 'granted'
              ? '<span class="valtag" style="background:rgba(31,224,168,0.15); color:var(--ocean);">● GRANTED &amp; ACTIVE</span>'
              : (perms.push === 'denied'
                ? '<span class="valtag" style="background:rgba(255,77,106,0.15); color:var(--red);">✕ BLOCKED IN BROWSER</span>'
                : '<span class="valtag" style="background:rgba(255,184,77,0.15); color:var(--amber);">○ PERMISSION NEEDED</span>')}
          </div>
          <div style="font-size:12px; color:var(--text-1); line-height:1.5; margin-bottom:8px;">
            Dispatches automated high-priority evacuation orders and reservoir flood alerts in the background.
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:11px; color:var(--text-2);">Standard W3C Notification API + FCM</span>
            <div>
              ${perms.push === 'granted'
                ? `<button class="btn btn-sm btn-ghost" onclick="triggerTestPush()" style="font-size:11px;">Send Test Alert</button>`
                : (perms.push === 'denied'
                  ? `<span style="font-size:11px; color:var(--text-1);">Click the padlock 🔒 icon in address bar to reset.</span>`
                  : `<button class="btn btn-sm btn-primary" onclick="requestPushPermissionFromModal()" style="font-size:11px;">Allow Notifications</button>`)}
            </div>
          </div>
        </div>

        <!-- 2. Precise GPS Geolocation -->
        <div class="perm-item" style="padding:14px; border-radius:10px; background:var(--bg-1); border:1px solid var(--panel-border);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <div style="display:flex; align-items:center; gap:8px; font-weight:600;">
              <span>📍</span>
              <span>Real-Time GPS Geolocation</span>
            </div>
            ${perms.location === 'granted'
              ? `<span class="valtag" style="background:rgba(31,224,168,0.15); color:var(--ocean);">● ACTIVE ${state.userLocation ? `(${state.userLocation.lat.toFixed(2)}, ${state.userLocation.lon.toFixed(2)})` : ''}</span>`
              : (perms.location === 'denied'
                ? '<span class="valtag" style="background:rgba(255,77,106,0.15); color:var(--red);">✕ BLOCKED IN BROWSER</span>'
                : '<span class="valtag" style="background:rgba(255,184,77,0.15); color:var(--amber);">○ PERMISSION NEEDED</span>')}
          </div>
          <div style="font-size:12px; color:var(--text-1); line-height:1.5; margin-bottom:8px;">
            Automatically calculates distance to flood corridors and plots real-time evacuation directions.
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:11px; color:var(--text-2);">Client-side Geolocation API</span>
            <div>
              ${perms.location === 'granted'
                ? `<button class="btn btn-sm btn-ghost" onclick="requestLocationPermissionFromModal()" style="font-size:11px;">Recalibrate GPS</button>`
                : (perms.location === 'denied'
                  ? `<span style="font-size:11px; color:var(--text-1);">Allow location access in browser settings.</span>`
                  : `<button class="btn btn-sm btn-primary" onclick="requestLocationPermissionFromModal()" style="font-size:11px;">Acquire My Location</button>`)}
            </div>
          </div>
        </div>

        <!-- 3. Acoustic Siren Engine -->
        <div class="perm-item" style="padding:14px; border-radius:10px; background:var(--bg-1); border:1px solid var(--panel-border);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <div style="display:flex; align-items:center; gap:8px; font-weight:600;">
              <span>🔊</span>
              <span>Acoustic Emergency Siren Engine</span>
            </div>
            ${perms.audio
              ? '<span class="valtag" style="background:rgba(31,224,168,0.15); color:var(--ocean);">● SYNTHESIZER UNLOCKED</span>'
              : '<span class="valtag" style="background:rgba(255,184,77,0.15); color:var(--amber);">○ MUTED / CLICK TO UNLOCK</span>'}
          </div>
          <div style="font-size:12px; color:var(--text-1); line-height:1.5; margin-bottom:8px;">
            Synthesizes loud multi-tone audio alerts through the Web Audio API during emergency inundations.
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:11px; color:var(--text-2);">High-priority Web Audio Synthesis</span>
            <div style="display:flex; gap:6px;">
              <button class="btn btn-sm btn-ghost" onclick="testAudioEngineFromModal()" style="font-size:11px;">🔊 Test Chime</button>
              <button class="btn btn-sm ${perms.audio ? 'btn-ghost' : 'btn-primary'}" onclick="toggleAudioEngineFromModal()" style="font-size:11px;">
                ${perms.audio ? 'Mute' : 'Unlock & Enable'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function grantAllEssentialPermissions() {
  toast('Activating all essential disaster protection permissions...');
  AlertSound.setEnabled(true);
  AlertSound.play('chime');

  if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
    detectUserLocation();
  }

  await enableWebPushNotifications();

  setTimeout(() => {
    renderPermissionsModalContent();
    updatePermissionsHeaderBadge();
    toast('✅ Essential permissions processed!');
  }, 1000);
}

async function requestPushPermissionFromModal() {
  await enableWebPushNotifications();
  renderPermissionsModalContent();
  updatePermissionsHeaderBadge();
}

function requestLocationPermissionFromModal() {
  detectUserLocation();
  setTimeout(() => {
    renderPermissionsModalContent();
    updatePermissionsHeaderBadge();
  }, 1200);
}

function testAudioEngineFromModal() {
  AlertSound.setEnabled(true);
  AlertSound.play('chime');
  toast('🔊 Siren chime tested successfully!');
  renderPermissionsModalContent();
  updatePermissionsHeaderBadge();
}

function toggleAudioEngineFromModal() {
  const next = !AlertSound.enabled;
  AlertSound.setEnabled(next);
  if (next) {
    AlertSound.play('chime');
    toast('🔊 Siren audio engine enabled!');
  } else {
    toast('Audio siren muted.');
  }
  renderPermissionsModalContent();
  updatePermissionsHeaderBadge();
}

function renderPermissionBanner(context) {
  if (sessionStorage.getItem('floodai-perm-dismissed') === '1') return '';
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && state.userLocation) return '';

  return `
    <div class="perm-prompt-banner" id="permPromptBanner" style="margin-bottom:16px;">
      <div style="display:flex; align-items:center; gap:14px;">
        <span style="font-size:24px;">🛡️</span>
        <div>
          <b style="font-size:13px; color:var(--text-0);">Enable Life-Safety Threat Permissions</b>
          <p style="font-size:12px; color:var(--text-1); margin-top:2px;">
            Activate Web Push Notifications and GPS Geolocation to receive automated evacuation warnings and nearest relief shelter directions for your sector.
          </p>
        </div>
      </div>
      <div style="display:flex; gap:8px;">
        <button class="btn btn-sm btn-primary" onclick="openPermissionsModal()">Configure</button>
        <button class="btn btn-sm btn-ghost" onclick="this.closest('#permPromptBanner').remove(); sessionStorage.setItem('floodai-perm-dismissed','1');">Dismiss</button>
      </div>
    </div>
  `;
}
