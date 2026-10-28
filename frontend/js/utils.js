/* ===========================================================
   FloodAI — UI Utilities, Skeletons, Sinks & Visual Assets
   =========================================================== */

function toast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}

function riskColor(pct) {
  if (pct < 30) return getCss('--ocean') || '#1FE0A8';
  if (pct < 55) return '#FFD166';
  if (pct < 75) return getCss('--amber') || '#FFB84D';
  return getCss('--red') || '#FF4D6A';
}

function riskLabel(pct) {
  if (pct < 30) return 'Low';
  if (pct < 55) return 'Medium';
  if (pct < 75) return 'High';
  return 'Very High';
}

function getCss(v) {
  if (typeof document === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(v).trim();
}

function fmtNum(n, d = 1) {
  return Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: d });
}

function roundNum(n, d = 2) {
  return Number(n || 0).toFixed(d);
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
}

function levelKey(pct) {
  return pct < 30 ? 'green' : (pct < 55 ? 'yellow' : (pct < 75 ? 'orange' : 'red'));
}

function vibrate(p) {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p);
  } catch (e) {}
}

/* ================= REUSABLE LOADING & COMPONENT STATE UTILITIES ================= */

function renderSkeletonCard({ title = 'Loading...', height = '140px', lines = 2 } = {}) {
  return `
    <div class="skeleton-card-wrap" style="min-height:${height};" role="status" aria-label="Loading content">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div class="skeleton skeleton-line" style="width:40%; height:16px;"></div>
        <div class="skeleton skeleton-line xs" style="width:20%; height:12px;"></div>
      </div>
      <div class="skeleton skeleton-box" style="height:${Math.max(40, parseInt(height) - 70)}px; margin:8px 0;"></div>
      ${Array.from({ length: lines }).map((_, i) => `
        <div class="skeleton skeleton-line ${i === lines - 1 ? 'short' : ''}" style="margin-bottom:6px;"></div>
      `).join('')}
    </div>
  `;
}

function renderSkeletonChart({ title = 'Analyzing Telemetry Trends...', height = '260px', bars = 6 } = {}) {
  const barHeights = [45, 75, 90, 60, 80, 50, 70, 85];
  return `
    <div class="skeleton-chart-wrap" style="min-height:${height};" role="status" aria-label="Loading chart data">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <div class="skeleton skeleton-line" style="width:35%; height:16px;"></div>
        <div class="skeleton skeleton-line xs" style="width:20%;"></div>
      </div>
      <div class="skeleton-chart-bars">
        ${Array.from({ length: bars }).map((_, i) => `
          <div class="skeleton skeleton-chart-bar" style="height:${barHeights[i % barHeights.length]}%;"></div>
        `).join('')}
      </div>
      <div style="display:flex; justify-content:space-between; margin-top:10px;">
        <div class="skeleton skeleton-line xs" style="width:15%;"></div>
        <div class="skeleton skeleton-line xs" style="width:15%;"></div>
        <div class="skeleton skeleton-line xs" style="width:15%;"></div>
        <div class="skeleton skeleton-line xs" style="width:15%;"></div>
      </div>
    </div>
  `;
}

function renderSkeletonTable({ rows = 5, cols = 5 } = {}) {
  return `
    <div class="skeleton-table-wrap" role="status" aria-label="Loading table data">
      <div style="display:flex; justify-content:space-between; margin-bottom:14px; padding-bottom:8px; border-bottom:1px solid var(--panel-border);">
        <div class="skeleton skeleton-line" style="width:25%; height:16px;"></div>
        <div class="skeleton skeleton-line xs" style="width:15%;"></div>
      </div>
      ${Array.from({ length: rows }).map((_, r) => `
        <div class="skeleton-table-row">
          <div class="skeleton skeleton-line" style="width:85%;"></div>
          <div class="skeleton skeleton-line" style="width:60%;"></div>
          <div class="skeleton skeleton-line" style="width:50%;"></div>
          <div class="skeleton skeleton-line" style="width:65%;"></div>
          <div class="skeleton skeleton-line" style="width:75%;"></div>
          <div class="skeleton skeleton-line" style="width:40%;"></div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderSkeletonWeather() {
  return `
    <div class="glass weather-hero" style="position:relative; overflow:hidden;" role="status" aria-label="Loading weather">
      <div>
        <div class="skeleton skeleton-line" style="width:30%; height:14px; margin-bottom:12px;"></div>
        <div class="skeleton skeleton-box" style="height:64px; width:120px; border-radius:12px; margin-bottom:12px;"></div>
        <div class="skeleton skeleton-line short" style="margin-bottom:20px;"></div>
        <div style="display:flex; gap:10px;">
          ${Array.from({ length: 6 }).map(() => `
            <div class="skeleton" style="width:60px; height:70px; border-radius:10px;"></div>
          `).join('')}
        </div>
      </div>
      <div class="grid-cards" style="grid-template-columns:repeat(2,1fr); margin-top:0;">
        ${Array.from({ length: 6 }).map(() => `
          <div class="skeleton" style="height:68px; border-radius:12px;"></div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderViewSkeleton(viewName) {
  if (viewName === 'weather') return renderSkeletonWeather();
  if (viewName === 'records') {
    return `
      <div class="stagger-in">
        <div class="skeleton skeleton-line" style="width:28%; height:20px; margin-bottom:12px;"></div>
        <div class="skeleton skeleton-line xs" style="width:50%; margin-bottom:24px;"></div>
        <div class="skeleton skeleton-box" style="height:60px; margin-bottom:20px;"></div>
        ${renderSkeletonTable({ rows: 8, cols: 6 })}
      </div>
    `;
  }
  if (viewName === 'analytics' || viewName === 'dashboard') {
    return `
      <div class="stagger-in">
        <div class="skeleton skeleton-line" style="width:30%; height:20px; margin-bottom:12px;"></div>
        <div class="stat-strip" style="margin:20px 0;">
          ${Array.from({ length: 4 }).map(() => `
            <div class="skeleton-card-wrap" style="min-height:90px;">
              <div class="skeleton skeleton-line xs" style="width:60%; margin-bottom:8px;"></div>
              <div class="skeleton skeleton-line" style="width:40%; height:22px;"></div>
            </div>
          `).join('')}
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:20px;">
          ${renderSkeletonChart({ title: 'Loading Analytical Trends...', height: '240px', bars: 6 })}
          ${renderSkeletonChart({ title: 'Loading Machine Learning Matrices...', height: '240px', bars: 6 })}
        </div>
      </div>
    `;
  }
  if (viewName === 'map') {
    return `
      <div class="stagger-in">
        <div class="skeleton skeleton-line" style="width:32%; height:20px; margin-bottom:12px;"></div>
        <div class="skeleton skeleton-line xs" style="width:45%; margin-bottom:20px;"></div>
        <div style="display:grid; grid-template-columns:1.8fr 1fr; gap:20px;">
          <div class="skeleton skeleton-box" style="height:480px; border-radius:16px;"></div>
          <div class="skeleton-card-wrap" style="height:480px;">
            <div class="skeleton skeleton-line" style="width:60%; height:16px; margin-bottom:14px;"></div>
            <div class="skeleton skeleton-box" style="height:120px; margin-bottom:14px;"></div>
            <div class="skeleton skeleton-line" style="width:80%;"></div>
            <div class="skeleton skeleton-line" style="width:70%;"></div>
            <div class="skeleton skeleton-line" style="width:50%;"></div>
          </div>
        </div>
      </div>
    `;
  }
  if (viewName === 'predict') {
    return `
      <div class="stagger-in">
        <div class="skeleton skeleton-line" style="width:35%; height:20px; margin-bottom:12px;"></div>
        <div class="skeleton skeleton-line xs" style="width:55%; margin-bottom:20px;"></div>
        <div style="display:grid; grid-template-columns:1.2fr 0.8fr; gap:24px;">
          <div class="skeleton-card-wrap" style="height:440px;">
            <div class="skeleton skeleton-line" style="width:40%; height:16px; margin-bottom:16px;"></div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
              ${Array.from({ length: 6 }).map(() => `<div class="skeleton skeleton-box" style="height:50px;"></div>`).join('')}
            </div>
          </div>
          <div class="skeleton-card-wrap" style="height:440px;">
            <div class="skeleton skeleton-box" style="height:180px; border-radius:50%; width:180px; margin:20px auto;"></div>
            <div class="skeleton skeleton-line" style="width:70%; margin:0 auto 10px;"></div>
            <div class="skeleton skeleton-line xs" style="width:50%; margin:0 auto;"></div>
          </div>
        </div>
      </div>
    `;
  }
  // Default / Home / Command / Portal
  return `
    <div class="stagger-in">
      <div class="skeleton skeleton-line" style="width:36%; height:22px; margin-bottom:12px;"></div>
      <div class="skeleton skeleton-line xs" style="width:55%; margin-bottom:24px;"></div>
      <div class="hero" style="grid-template-columns:1.1fr 0.9fr; gap:36px; padding:20px 0;">
        <div>
          <div class="skeleton skeleton-box" style="height:100px; margin-bottom:16px;"></div>
          <div class="skeleton skeleton-line" style="width:85%; margin-bottom:10px;"></div>
          <div class="skeleton skeleton-line" style="width:70%; margin-bottom:24px;"></div>
          <div style="display:flex; gap:12px;">
            <div class="skeleton skeleton-box" style="width:160px; height:42px; border-radius:12px;"></div>
            <div class="skeleton skeleton-box" style="width:160px; height:42px; border-radius:12px;"></div>
          </div>
        </div>
        <div class="skeleton-card-wrap" style="height:320px; display:flex; flex-direction:column; align-items:center; justify-content:center;">
          <div class="skeleton skeleton-box" style="height:180px; width:180px; border-radius:50%; margin-bottom:14px;"></div>
          <div class="skeleton skeleton-line" style="width:40%; height:18px;"></div>
        </div>
      </div>
      <div class="stat-strip" style="margin:30px 0;">
        ${Array.from({ length: 4 }).map(() => `
          <div class="skeleton-card-wrap" style="min-height:90px;">
            <div class="skeleton skeleton-line" style="width:40%; height:22px; margin-bottom:8px;"></div>
            <div class="skeleton skeleton-line xs" style="width:60%;"></div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderEmptyState({ icon = '📭', title = 'No Data Available', message = 'No records found matching current criteria.', actionText = '', actionFn = '' } = {}) {
  return `
    <div class="component-state-empty">
      <div style="font-size:36px; margin-bottom:4px;">${icon}</div>
      <h4 style="font-family:var(--font-display); font-size:16px; margin:0; color:var(--text-0);">${escapeHtml(title)}</h4>
      <p style="font-size:12.5px; color:var(--text-1); max-width:380px; margin:4px 0 12px; line-height:1.5;">${escapeHtml(message)}</p>
      ${actionText && actionFn ? `
        <button class="btn btn-sm btn-ghost" onclick="${actionFn}" style="font-size:11.5px;">${escapeHtml(actionText)}</button>
      ` : ''}
    </div>
  `;
}

function renderErrorState({ title = 'Data Feed Interrupted', message = 'Unable to synchronize telemetry with backend service.', retryFn = '', staleData = null, staleNotice = '' } = {}) {
  return `
    <div class="component-state-error">
      <div style="display:flex; align-items:flex-start; gap:12px;">
        <span style="font-size:22px; line-height:1;">⚠️</span>
        <div style="flex:1;">
          <b style="font-size:13.5px; color:var(--red); font-family:var(--font-display);">${escapeHtml(title)}</b>
          <p style="font-size:12px; color:var(--text-1); margin:4px 0 0; line-height:1.5;">${escapeHtml(message)}</p>
          ${staleNotice ? `<div style="font-size:11px; color:var(--amber); margin-top:6px;">${escapeHtml(staleNotice)}</div>` : ''}
        </div>
      </div>
      ${retryFn ? `
        <div style="display:flex; justify-content:flex-end;">
          <button class="btn btn-sm btn-ghost" onclick="${retryFn}" style="font-size:11px; gap:6px; color:var(--text-0);">
            ↻ Retry Request
          </button>
        </div>
      ` : ''}
    </div>
  `;
}

function renderDataFreshnessBar({ label = 'Telemetry Feed', timestamp = null, onRefresh = '', isRefreshing = false, isStale = false } = {}) {
  const timeStr = timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Live';
  return `
    <div class="data-freshness-bar">
      <div style="display:flex; align-items:center;">
        <span class="freshness-pulse ${isStale ? 'stale' : ''}"></span>
        <span>${escapeHtml(label)}: <b style="color:${isStale ? 'var(--amber)' : 'var(--ocean)'};">${isStale ? 'Cached / Stale' : 'Live Stream'}</b> (${timeStr})</span>
      </div>
      ${onRefresh ? `
        <button class="btn-refresh-icon ${isRefreshing ? 'spinning' : ''}" onclick="${onRefresh}" title="Refresh telemetry">
          <span>↻</span> ${isRefreshing ? 'Updating...' : 'Refresh'}
        </button>
      ` : ''}
    </div>
  `;
}

function renderInlineSpinner(text = 'Loading...') {
  return `<span class="spinner"></span> <span>${escapeHtml(text)}</span>`;
}

function renderLoadingOverlay(msg = 'Synthesizing Intelligence...') {
  return `
    <div style="padding:28px; text-align:center; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px;">
      <span class="spinner" style="width:24px; height:24px; border-width:3px; border-color:rgba(51,199,255,0.2); border-top-color:var(--cyber);"></span>
      <div style="font-family:var(--font-mono); font-size:12px; color:var(--cyber); letter-spacing:0.5px;">${escapeHtml(msg)}</div>
    </div>
  `;
}

/* ================= SVGs & VISUAL ASSETS ================= */

function iconWave() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="#04101f" stroke-width="2.4" stroke-linecap="round"><path d="M2 16c2 0 2-3 4-3s2 3 4 3 2-3 4-3 2-3 4-3 2-3 4-3"/><path d="M2 21c2 0 2-3 4-3s2 3 4 3 2-3 4-3 2-3 4-3 2-3 4-3"/></svg>`;
}

function iconSun() {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`;
}

function iconMoon() {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.5A8.5 8.5 0 1111.5 3 7 7 0 0021 12.5z"/></svg>`;
}

function iconPin() {
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
}

function iconSvg(name) {
  const p = {
    predict: '<path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"/><circle cx="12" cy="12" r="4"/>',
    map: '<path d="M9 20l-6-3V4l6 3 6-3 6 3v13l-6-3-6 3z"/><path d="M9 7v13M15 4v13"/>',
    chart: '<path d="M3 3v18h18"/><path d="M7 15l4-6 4 3 5-8"/>',
    dash: '<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="5" rx="2"/><rect x="13" y="12" width="8" height="9" rx="2"/><rect x="3" y="15" width="8" height="6" rx="2"/>',
    contact: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    records: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  };
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${p[name] || ''}</svg>`;
}

function radarGaugeSVG(pct, size = 340, customColor = null) {
  const c = size / 2, r = size * 0.38;
  const color = customColor || riskColor(pct);
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.max(0, Math.min(100, pct)) / 100);
  return `
    <svg class="radar-svg" viewBox="0 0 ${size} ${size}">
      <defs>
        <radialGradient id="rg_${size}" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.28"/>
          <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="${c}" cy="${c}" r="${r + 22}" fill="url(#rg_${size})"/>
      ${[1, 2, 3].map(i => `<circle cx="${c}" cy="${c}" r="${r * i / 3}" fill="none" stroke="currentColor" stroke-opacity="0.08" stroke-width="1"/>`).join('')}
      <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="currentColor" stroke-opacity="0.09" stroke-width="10"/>
      <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${color}" stroke-width="10" stroke-linecap="round"
        stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" transform="rotate(-90 ${c} ${c})"
        style="transition:stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)"/>
      <g class="radar-scan" style="transform-origin:${c}px ${c}px">
        <line x1="${c}" y1="${c}" x2="${c}" y2="${c - r}" stroke="${color}" stroke-width="1.4" stroke-opacity="0.55"/>
      </g>
      <text x="${c}" y="${c - 6}" text-anchor="middle" font-family="Space Grotesk, sans-serif" font-weight="700" font-size="${size * 0.13}" fill="currentColor">${Number(pct || 0).toFixed(1)}%</text>
      <text x="${c}" y="${c + 22}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="12" letter-spacing="2" fill="${color}">${riskLabel(pct).toUpperCase()} RISK</text>
    </svg>
  `;
}

function statCard(num, lbl, dir, delta) {
  return `
    <div class="glass stat-card border-scale card-glow">
      <div class="num text-glow-cyber">${num}</div>
      <div class="lbl">${lbl}</div>
      <div class="delta ${dir}">${dir === 'up' ? '▲' : '▼'} ${delta}</div>
    </div>
  `;
}

function quickCard(page, icon, title, desc) {
  return `
    <div class="glass qcard border-scale" onclick="goTo('${page}')">
      <div class="qi icon-hover-float">${iconSvg(icon)}</div>
      <h3 style="transition:all 0.25s ease;">${title}</h3>
      <p>${desc}</p>
    </div>
  `;
}

/* ================= GLOBAL ACCENT & THEME CONTROLLER ================= */
function setAppAccent(accentId) {
  if (!accentId) return;
  state.accent = accentId;
  try {
    localStorage.setItem('floodai-accent', accentId);
  } catch (_) {}

  // Apply to document root immediately
  document.documentElement.setAttribute('data-accent', accentId);
  document.body.setAttribute('data-accent', accentId);

  // Notify Particle Service if active
  if (typeof particleService !== 'undefined' && particleService && typeof particleService.setTheme === 'function') {
    try {
      particleService.setTheme(state.theme, accentId);
    } catch (_) {}
  }

  // Update any accent select dropdowns currently rendered in DOM
  document.querySelectorAll('select.accent-select, select[id*="accent"], select[onchange*="Accent"]').forEach(sel => {
    sel.value = accentId;
  });

  // Re-render current page smoothly if needed to update dynamic SVG / Canvas colors
  if (state.page === 'map' && typeof renderMap === 'function') {
    try { renderMap(); } catch (_) {}
  } else if (state.page === 'analytics' && typeof renderAnalytics === 'function') {
    try { renderAnalytics(); } catch (_) {}
  } else if (state.page === 'dashboard' && typeof renderDashboard === 'function') {
    try { renderDashboard(); } catch (_) {}
  }

  const accentNames = {
    ocean: 'Ocean Cyan',
    electric: 'Electric Blue',
    emerald: 'Emerald Green',
    violet: 'Violet Purple',
    amber: 'Solar Amber',
    coral: 'Living Coral',
    rose: 'Crimson Rose'
  };

  if (typeof toast === 'function') {
    toast(`Accent theme applied: ${accentNames[accentId] || accentId.toUpperCase()}`);
  }
}

// Aliases for profile and settings compatibility
function setProfileAccent(accentId) {
  setAppAccent(accentId);
  if (state.page === 'profile' && typeof renderProfile === 'function') {
    renderProfile(document.getElementById('pageRoot'));
  }
}

function setProfileTheme(mode) {
  state.theme = mode;
  try {
    localStorage.setItem('floodai-theme', mode);
  } catch (_) {}
  document.documentElement.classList.toggle('light', mode === 'light');
  if (typeof toast === 'function') {
    toast(`Theme switched to ${mode.toUpperCase()} mode.`);
  }
  if (state.page === 'profile' && typeof renderProfile === 'function') {
    renderProfile(document.getElementById('pageRoot'));
  } else if (state.page === 'settings' && typeof renderSettings === 'function') {
    renderSettings(document.getElementById('pageRoot'));
  }
}

/* ================= GLOBAL LANGUAGE CONTROLLER ================= */
function setAppLanguage(langCode) {
  if (!langCode) return;
  state.language = langCode;
  try {
    localStorage.setItem('floodai-lang', langCode);
  } catch (_) {}

  document.documentElement.setAttribute('lang', langCode);

  // If i18nService is available, trigger immediate DOM translation
  if (typeof i18nService !== 'undefined' && i18nService && typeof i18nService.setLanguage === 'function') {
    i18nService.setLanguage(langCode);
  } else if (typeof translateCurrentPage === 'function') {
    translateCurrentPage();
  }

  // Update language select dropdowns currently rendered
  document.querySelectorAll('select.lang-select, select[id*="language"], select[onchange*="Language"]').forEach(sel => {
    sel.value = langCode;
  });

  const langNames = {
    en: 'English (Global)',
    hi: 'हिंदी (Hindi)',
    ta: 'தமிழ் (Tamil)',
    bn: 'বাংলা (Bengali)',
    es: 'Español (Spanish)',
    fr: 'Français (French)'
  };

  if (typeof toast === 'function') {
    toast(`Language updated: ${langNames[langCode] || langCode.toUpperCase()}`);
  }

  // Re-render shell & current page to reflect new language across entire client
  if (typeof renderShell === 'function') renderShell();
  if (typeof renderPage === 'function') renderPage();
}

function setProfileLanguage(langCode) {
  setAppLanguage(langCode);
}

