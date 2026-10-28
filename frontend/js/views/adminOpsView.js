/**
 * adminOpsView.js
 * Admin Workspace Screen 01 — Platform Operations Overview
 * Connected to live backend telemetry at /api/admin/stats and /api/health
 */

async function renderAdminOps(root) {
  root.innerHTML = `
    <div class="saas-page-container">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:14px;">
        <div>
          <span class="story-tag" style="color:var(--red); border-color:rgba(255,77,106,0.3); background:rgba(255,77,106,0.1);">
            ADMIN CLEARANCE LEVEL 3
          </span>
          <h1 style="font-family:var(--font-display); font-size:28px; font-weight:700; margin-top:6px;">
            Platform Operations &amp; System Health
          </h1>
          <p style="font-size:13.5px; color:var(--text-secondary);">
            Real-time server telemetry, active database connection, and microservice status.
          </p>
        </div>
        <button class="glass-btn btn-ghost" onclick="renderAdminOps(document.getElementById('pageRoot'))" style="gap:6px;">
          <span>🔄</span> Refresh Telemetry
        </button>
      </div>

      <div id="adminOpsContent">
        <div class="glass-card" style="padding:40px; text-align:center;">
          <span class="spin-anim" style="font-size:24px; color:var(--accent-primary);">⚡</span>
          <div style="font-size:13px; color:var(--text-muted); margin-top:8px;">Polling cluster health metrics...</div>
        </div>
      </div>
    </div>
  `;

  try {
    const stats = await api('/admin/stats');
    const container = document.getElementById('adminOpsContent');
    if (!container) return;

    container.innerHTML = `
      <!-- Metric Cards Grid -->
      <div class="grid-cards" style="grid-template-columns:repeat(4,1fr); gap:18px; margin-bottom:28px;">
        <div class="glass-stat-card border-lightning">
          <div class="glass-stat-header">Cluster Status</div>
          <div class="glass-stat-value" style="color:var(--ocean);">${escapeHtml(stats.status.toUpperCase())}</div>
          <div class="glass-stat-subtext">Uptime: ${Math.floor(stats.uptimeSeconds / 60)} min</div>
        </div>

        <div class="glass-stat-card">
          <div class="glass-stat-header">Registered Operators</div>
          <div class="glass-stat-value" style="color:var(--accent-primary);">${stats.counts.users}</div>
          <div class="glass-stat-subtext">RBAC User Directory</div>
        </div>

        <div class="glass-stat-card">
          <div class="glass-stat-header">Historical Records</div>
          <div class="glass-stat-value" style="color:var(--text-primary);">${stats.counts.disasterRecords.toLocaleString()}</div>
          <div class="glass-stat-subtext">Ground-Truth Vectors</div>
        </div>

        <div class="glass-stat-card">
          <div class="glass-stat-header">Active Emergencies</div>
          <div class="glass-stat-value" style="color:${stats.counts.activeAlerts > 0 ? 'var(--red)' : 'var(--ocean)'};">
            ${stats.counts.activeAlerts}
          </div>
          <div class="glass-stat-subtext">Broadcast Dispatches: ${stats.counts.alerts}</div>
        </div>
      </div>

      <!-- Service Status and Node Memory Breakdown -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-bottom:28px;">
        
        <!-- Live Services Health Card -->
        <div class="glass-card elevated">
          <h3 style="font-size:16px; font-weight:700; margin-bottom:16px; display:flex; align-items:center; gap:8px;">
            <span>🛡️</span> Service Topology &amp; Microservices
          </h3>

          <div style="display:flex; flex-direction:column; gap:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; border-radius:10px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05);">
              <div>
                <div style="font-size:13px; font-weight:600;">Node.js Express API Gateway</div>
                <div style="font-size:11px; color:var(--text-muted);">Port 5000 • Production Cluster</div>
              </div>
              <span class="glass-badge" style="background:rgba(31,224,168,0.15); color:var(--ocean); font-family:var(--font-mono); font-size:11px;">
                ● ${escapeHtml(stats.services.nodeBackend)}
              </span>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; border-radius:10px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05);">
              <div>
                <div style="font-size:13px; font-weight:600;">Python Flask ML Microservice</div>
                <div style="font-size:11px; color:var(--text-muted);">Port 8000 • XGBoost &amp; Random Forest</div>
              </div>
              <span class="glass-badge" style="background:rgba(31,224,168,0.15); color:var(--ocean); font-family:var(--font-mono); font-size:11px;">
                ● ${escapeHtml(stats.services.pythonMlService)}
              </span>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; border-radius:10px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05);">
              <div>
                <div style="font-size:13px; font-weight:600;">MongoDB Atlas Cluster</div>
                <div style="font-size:11px; color:var(--text-muted);">${escapeHtml(stats.database.host)}</div>
              </div>
              <span class="glass-badge" style="background:rgba(31,224,168,0.15); color:var(--ocean); font-family:var(--font-mono); font-size:11px;">
                ● ${escapeHtml(stats.services.mongodbAtlas)}
              </span>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; border-radius:10px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05);">
              <div>
                <div style="font-size:13px; font-weight:600;">OpenWeather Atmospheric Telemetry</div>
                <div style="font-size:11px; color:var(--text-muted);">10 Monitored Districts Ingestion</div>
              </div>
              <span class="glass-badge" style="background:rgba(51,199,255,0.15); color:var(--accent-primary); font-family:var(--font-mono); font-size:11px;">
                ● ${escapeHtml(stats.services.openWeatherStream)}
              </span>
            </div>
          </div>
        </div>

        <!-- System Memory & Host Health -->
        <div class="glass-card elevated">
          <h3 style="font-size:16px; font-weight:700; margin-bottom:16px; display:flex; align-items:center; gap:8px;">
            <span>💻</span> Node.js Host Memory Allocation
          </h3>

          <div style="display:flex; flex-direction:column; gap:16px;">
            <div>
              <div style="display:flex; justify-content:space-between; font-size:12.5px; margin-bottom:6px;">
                <span>V8 Heap Memory Used</span>
                <span style="font-family:var(--font-mono); font-weight:700; color:var(--accent-primary);">${stats.system.heapUsedMb} MB / ${stats.system.heapTotalMb} MB</span>
              </div>
              <div style="width:100%; height:8px; background:rgba(255,255,255,0.06); border-radius:4px; overflow:hidden;">
                <div style="width:${Math.min(100, Math.round((stats.system.heapUsedMb / stats.system.heapTotalMb) * 100))}%; height:100%; background:var(--accent-primary); border-radius:4px;"></div>
              </div>
            </div>

            <div>
              <div style="display:flex; justify-content:space-between; font-size:12.5px; margin-bottom:6px;">
                <span>Resident Set Size (RSS)</span>
                <span style="font-family:var(--font-mono); font-weight:700; color:var(--ocean);">${stats.system.rssMb} MB</span>
              </div>
              <div style="width:100%; height:8px; background:rgba(255,255,255,0.06); border-radius:4px; overflow:hidden;">
                <div style="width:35%; height:100%; background:var(--ocean); border-radius:4px;"></div>
              </div>
            </div>

            <div style="padding:14px; border-radius:10px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); font-size:12px; line-height:1.6; color:var(--text-secondary);">
              <b>Operating Host RAM:</b> ${stats.system.freeMemGb} GB free of ${stats.system.totalMemGb} GB total capacity.
              <div style="margin-top:6px; color:var(--text-muted); font-family:var(--font-mono); font-size:11px;">
                Node Version: ${navigator.userAgent.indexOf('Chrome') > -1 ? 'V8 Engine Active' : 'ES6 Module System'}
              </div>
            </div>
          </div>
        </div>

      </div>
    `;
  } catch (err) {
    const container = document.getElementById('adminOpsContent');
    if (container) {
      container.innerHTML = `
        <div class="glass-card" style="padding:32px; border-color:var(--red); color:var(--red); text-align:center;">
          <b>Failed to load operational telemetry:</b> ${escapeHtml(err.message)}
        </div>
      `;
    }
  }
}
