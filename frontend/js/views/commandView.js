/**
 * FLOODAI — Command Center View (Civil Defense Operations)
 * Dynamic surveillance matrix, live threat assessment pipeline, and multi-channel dispatch logs.
 */

async function renderCommand(root) {
  root = root || document.getElementById('pageRoot');
  if (!root) return;

  root.innerHTML = `
    <div class="eyebrow">Emergency Operations Center · Civil Defense Command · Automated Threat Detection</div>
    <h1 class="page-title">Threat Command &amp; Multi-Agency Operations</h1>
    <p class="page-sub">Operational command deck for disaster responders: continuous hydro-meteorological surveillance, automated ML inference, and multi-channel emergency broadcast dispatch.</p>

    <!-- Operational Telemetry Bar -->
    <div class="liquid-glass border-lightning card-glow" style="padding:16px 22px; margin:24px 0; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:14px;">
      <div style="display:flex; align-items:center; gap:20px; flex-wrap:wrap;">
        <div style="display:flex; align-items:center; gap:8px; font-size:12.5px;">
          <span style="width:10px; height:10px; border-radius:50%; background:var(--ocean); display:inline-block; box-shadow:0 0 8px var(--ocean);"></span>
          <b>MongoDB Atlas:</b> Connected
        </div>
        <div style="display:flex; align-items:center; gap:8px; font-size:12.5px;">
          <span style="width:10px; height:10px; border-radius:50%; background:var(--cyber); display:inline-block; box-shadow:0 0 8px var(--cyber);"></span>
          <b>ML Microservice:</b> XGBoost + RF (Port 8000)
        </div>
        <div style="display:flex; align-items:center; gap:8px; font-size:12.5px;">
          <span style="width:10px; height:10px; border-radius:50%; background:var(--purple); display:inline-block; box-shadow:0 0 8px var(--purple);"></span>
          <b>Groq Directives AI:</b> qwen/qwen3.8-27b
        </div>
        <div style="display:flex; align-items:center; gap:8px; font-size:12.5px;">
          <span style="width:10px; height:10px; border-radius:50%; background:var(--amber); display:inline-block; box-shadow:0 0 8px var(--amber);"></span>
          <b>OpenWeather API:</b> Telemetry Active
        </div>
      </div>
      <div>
        <button class="btn btn-sm btn-danger border-lightning-danger" onclick="triggerCommandAssessment()" id="btnCmdAssess" style="font-size:12px;">
          ⚡ Ingest &amp; Assess District
        </button>
      </div>
    </div>

    <!-- Active Threat Synthesis Panel (Groq Directives) -->
    <div id="commandDirectivePanel" class="liquid-glass border-scale" style="padding:22px; margin-bottom:24px; display:none;"></div>

    <!-- Multi-District Situation Surveillance Matrix Table -->
    <div class="liquid-glass border-scale card-glow" style="padding:24px; margin-bottom:24px;">
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; flex-wrap:wrap; gap:10px;">
        <div>
          <h3 style="font-family:var(--font-display); font-size:18px; margin:0;">Cross-District Threat Matrix</h3>
          <p style="font-size:12px; color:var(--text-1); margin:4px 0 0;">Authoritative monitored disaster sectors across India</p>
        </div>
        <div style="display:flex; gap:10px;">
          <select id="cmdAssessDistrictSelect" style="padding:6px 12px; border-radius:8px; background:var(--bg-1); color:var(--text-0); border:1px solid var(--panel-border); font-size:12px;">
            ${DISTRICTS.map(d => `<option value="${d.district}">${d.district}, ${d.state}</option>`).join('')}
          </select>
          <button class="btn btn-sm btn-primary" onclick="triggerCommandAssessment()" style="font-size:11px;">Run Ingestion</button>
        </div>
      </div>

      <div style="overflow-x:auto;">
        <table class="cmd-table">
          <thead>
            <tr>
              <th>District</th>
              <th>Sector Type</th>
              <th>Elevation</th>
              <th>Drainage</th>
              <th>Avg Risk</th>
              <th>Hazard Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${DISTRICTS.map(d => {
              const col = riskColor(d.avg_risk);
              const isCoastal = d.coastal || ['Chennai','Kochi','Kolkata','Mumbai','Surat','Visakhapatnam'].includes(d.district);
              const elev = Math.round(d.avg_elevation || d.elevation_m || 20);
              const drainage = d.drainage_quality || (elev > 500 ? 84 : (elev > 50 ? 76 : (elev > 15 ? 65 : 48)));
              return `
                <tr>
                  <td><b>${d.district}</b> <span style="font-size:11px; color:var(--text-2);">(${d.state})</span></td>
                  <td>${isCoastal ? '🌊 Coastal' : '⛰️ Inland'}</td>
                  <td>${elev} m</td>
                  <td>${drainage}/100</td>
                  <td style="font-family:var(--font-mono); font-weight:bold; color:${col};">${d.avg_risk.toFixed(1)}%</td>
                  <td><span class="valtag" style="background:${col}22; color:${col}; border:1px solid ${col}44;">${riskLabel(d.avg_risk).toUpperCase()}</span></td>
                  <td>
                    <button class="btn btn-sm btn-ghost" onclick="assessDistrictInCommand('${d.district}')" style="font-size:10.5px; padding:4px 8px;">
                      ⚡ Ingest &amp; Score
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Alert Dispatch Queue & Delivery Logs -->
    <div class="liquid-glass" style="padding:24px;">
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:14px;">
        <div>
          <h3 style="font-family:var(--font-display); font-size:18px; margin:0;">Multi-Channel Dispatch Queue &amp; Cooldown Log</h3>
          <p style="font-size:12px; color:var(--text-1); margin:4px 0 0;">Persistent delivery verification (FCM Web Push, Brevo Email, SMS Provider)</p>
        </div>
        <button class="btn btn-sm btn-ghost" onclick="loadCommandDispatchLogs(true)" style="font-size:11px;">Refresh Logs</button>
      </div>

      <div id="cmdDispatchLogs" style="display:flex; flex-direction:column; gap:8px;">
        <div style="padding:20px; text-align:center; color:var(--text-2);">Loading persistent dispatch logs from MongoDB Atlas...</div>
      </div>
    </div>
  `;

  loadCommandDispatchLogs();
}

async function triggerCommandAssessment() {
  const sel = document.getElementById('cmdAssessDistrictSelect');
  const dName = sel ? sel.value : 'Mumbai';
  assessDistrictInCommand(dName);
}

async function assessDistrictInCommand(districtName) {
  const panel = document.getElementById('commandDirectivePanel');
  const btn = document.getElementById('btnCmdAssess');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = renderInlineSpinner('Assessing Telemetry & Directives...');
  }
  toast(`Running automated threat detection pipeline for ${districtName}...`);

  if (panel) {
    panel.style.display = 'block';
    panel.innerHTML = renderSkeletonCard({
      title: `Synthesizing Groq LLM Directives for ${escapeHtml(districtName)}...`,
      height: '220px',
      lines: 4
    });
  }

  try {
    const res = await api('/threats/assess-district', 'POST', { district: districtName, persist: true }, false);
    const intel = res.threat_intel;
    toast(`✅ Assessment complete for ${districtName}: ${res.prediction?.risk_level} (${res.prediction?.probability_pct}%)`);

    if (panel && intel) {
      panel.style.display = 'block';
      const directivesList = (intel.precautionary_directives || []).map(d => `<li style="margin-bottom:6px;">${escapeHtml(d)}</li>`).join('');
      const infraText = Array.isArray(intel.infrastructure_guidance) ? intel.infrastructure_guidance.join(', ') : (intel.infrastructure_guidance || 'Monitor pumping stations.');

      panel.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="valtag" style="background:var(--red)22; color:var(--red); border:1px solid var(--red)44;">CRISIS DIRECTIVE</span>
            <span style="font-size:12px; color:var(--text-2); font-family:var(--font-mono);">Synthesized by Groq (${res.model_provenance?.ai_model || 'qwen/qwen3.8-27b'})</span>
          </div>
          <span style="font-size:12px; font-weight:bold; color:var(--cyber);">${districtName} · Risk: ${res.prediction?.probability_pct}%</span>
        </div>
        <h3 style="font-family:var(--font-display); font-size:18px; margin:6px 0 10px; color:var(--text-0);">${escapeHtml(intel.headline)}</h3>
        <p style="font-size:13px; line-height:1.6; color:var(--text-1); margin-bottom:14px;">${escapeHtml(intel.executive_summary)}</p>
        <div style="margin-bottom:12px;">
          <b style="font-size:12px; color:var(--ocean);">Precautionary Field Directives:</b>
          <ul style="padding-left:18px; font-size:12.5px; line-height:1.6; margin-top:6px; color:var(--text-0);">${directivesList}</ul>
        </div>
        <div style="font-size:12px; color:var(--text-2); border-top:1px solid var(--panel-border); padding-top:10px;">
          <b>Infrastructure Guidance:</b> ${escapeHtml(infraText)}
        </div>
      `;
      panel.scrollIntoView({ behavior: 'smooth' });
    }

    loadCommandDispatchLogs(true);
  } catch (err) {
    toast(`Assessment notice: ${err.message}`);
    if (panel) {
      panel.innerHTML = renderErrorState({
        title: `Threat Assessment Interrupted for ${districtName}`,
        message: err.message,
        retryFn: `assessDistrictInCommand('${districtName}')`
      });
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '⚡ Ingest &amp; Assess District';
    }
  }
}

async function loadCommandDispatchLogs(isRefresh = false) {
  const container = document.getElementById('cmdDispatchLogs');
  if (!container) return;

  if (isRefresh) {
    container.classList.add('refreshing-card');
  } else {
    container.innerHTML = renderSkeletonTable({ rows: 4, cols: 4 });
  }

  try {
    const res = await api('/notifications/history', 'GET', null, false);
    container.classList.remove('refreshing-card');
    const dispatches = res.dispatches || [];

    if (dispatches.length === 0) {
      container.innerHTML = renderEmptyState({
        icon: '📨',
        title: 'No Dispatch History Found',
        message: 'No emergency alerts have been triggered or logged in MongoDB Atlas yet.',
        actionText: '↻ Refresh Logs',
        actionFn: 'loadCommandDispatchLogs(false)'
      });
      return;
    }

    container.innerHTML = dispatches.slice(0, 10).map(d => `
      <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; border-radius:8px; background:var(--bg-1); border:1px solid var(--panel-border); font-size:12.5px; flex-wrap:wrap; gap:8px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <span style="font-family:var(--font-mono); font-size:11px; padding:2px 6px; border-radius:4px; background:rgba(51,199,255,0.15); color:var(--cyber); text-transform:uppercase;">
            ${d.channel}
          </span>
          <b>${escapeHtml(d.recipient)}</b>
          <span style="color:var(--text-2); font-size:11px;">DedupKey: ${escapeHtml(d.dedupKey)}</span>
        </div>
        <div style="display:flex; align-items:center; gap:14px;">
          <span style="font-family:var(--font-mono); font-size:11px; color:var(--ocean); font-weight:bold;">${d.status.toUpperCase()}</span>
          <span style="color:var(--text-2); font-size:11px;">${new Date(d.createdAt).toLocaleString([], { hour:'2-digit', minute:'2-digit', month:'short', day:'numeric' })}</span>
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.classList.remove('refreshing-card');
    container.innerHTML = renderErrorState({
      title: 'Failed to Retrieve Dispatch Logs',
      message: err.message,
      retryFn: 'loadCommandDispatchLogs(false)'
    });
  }
}
