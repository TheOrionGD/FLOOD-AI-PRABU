/**
 * analystThreatView.js
 * Analyst Workspace Screen 05 — Tactical Threat Assessment Workspace
 * Connects to /api/threats/current and /api/threats/assess-district
 */

async function renderAnalystThreat(root) {
  root.innerHTML = `
    <div class="saas-page-container">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:14px;">
        <div>
          <span class="story-tag" style="color:var(--accent-primary); border-color:rgba(51,199,255,0.3); background:rgba(51,199,255,0.1);">
            ANALYST WORKSPACE • THREAT SYNTHESIS
          </span>
          <h1 style="font-family:var(--font-display); font-size:28px; font-weight:700; margin-top:6px;">
            Tactical Threat Intelligence Synthesis
          </h1>
          <p style="font-size:13.5px; color:var(--text-secondary);">
            Automated multi-factor threat pipeline fusing real-time satellite telemetry with AI synthesis.
          </p>
        </div>

        <!-- Trigger Assessment Control -->
        <div style="display:flex; gap:10px; align-items:center;">
          <select class="glass-select" id="threatDistrictSelect">
            <option value="Chennai">Chennai Sector</option>
            <option value="Mumbai">Mumbai Sector</option>
            <option value="Kolkata">Kolkata Sector</option>
            <option value="Bhubaneswar">Bhubaneswar Sector</option>
            <option value="Guwahati">Guwahati Sector</option>
            <option value="Patna">Patna Sector</option>
            <option value="Surat">Surat Sector</option>
            <option value="Kochi">Kochi Sector</option>
            <option value="Visakhapatnam">Visakhapatnam Sector</option>
            <option value="Hosur">Hosur Sector</option>
          </select>
          <button class="glass-btn btn-primary" id="btnRunThreatAssess" onclick="runDistrictThreatAssessment()" style="gap:6px;">
            <span>⚡</span> Execute Live Assessment
          </button>
        </div>
      </div>

      <div id="analystThreatOutputWrap">
        <div class="glass-card" style="padding:36px; text-align:center;">
          <span class="spin-anim" style="font-size:22px; color:var(--accent-primary);">⚡</span>
          <div style="font-size:13px; color:var(--text-muted); margin-top:8px;">Fetching active tactical assessments...</div>
        </div>
      </div>
    </div>
  `;

  await _loadActiveThreatAssessments();
}

async function _loadActiveThreatAssessments() {
  const wrap = document.getElementById('analystThreatOutputWrap');
  if (!wrap) return;

  try {
    const res = await api('/threats/current');
    const assessments = res.assessments || [];

    if (assessments.length === 0) {
      wrap.innerHTML = `
        <div class="glass-card elevated" style="padding:48px; text-align:center;">
          <div style="font-size:36px; margin-bottom:12px;">🛰️</div>
          <h3 style="font-size:18px; font-weight:700; margin-bottom:6px;">No Tactical Threats Active</h3>
          <p style="font-size:13.5px; color:var(--text-muted); max-width:440px; margin:0 auto 18px;">
            Select a target district above and execute the automated assessment pipeline to ingest live telemetry and evaluate threat severity.
          </p>
        </div>
      `;
      return;
    }

    wrap.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:20px;">
        ${assessments.map(t => `
          <div class="glass-card elevated border-lightning" style="padding:28px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; flex-wrap:wrap; gap:12px;">
              <div>
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
                  <span class="glass-badge" style="background:${t.severity === 'Very High' ? 'rgba(255,77,106,0.18)' : 'rgba(255,184,77,0.18)'}; color:${t.severity === 'Very High' ? 'var(--red)' : 'var(--amber)'}; font-family:var(--font-mono); font-size:11px;">
                    ● ${t.severity.toUpperCase()} THREAT
                  </span>
                  <h3 style="font-size:20px; font-weight:700; margin:0;">${escapeHtml(t.district)} Basin</h3>
                </div>
                <div style="font-size:12px; color:var(--text-muted); font-family:var(--font-mono);">
                  Assessed: ${new Date(t.createdAt).toLocaleString()} • Assessment ID: ${t._id}
                </div>
              </div>

              <div style="text-align:right;">
                <div style="font-family:var(--font-display); font-size:32px; font-weight:700; color:${t.floodProbabilityPct > 60 ? 'var(--red)' : 'var(--ocean)'};">
                  ${t.floodProbabilityPct.toFixed(1)}%
                </div>
                <div style="font-size:11px; color:var(--text-muted); font-family:var(--font-mono);">Flood Probability</div>
              </div>
            </div>

            <!-- Ingested Weather Metrics -->
            <div class="grid-cards" style="grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:20px; background:rgba(0,0,0,0.2); padding:16px; border-radius:12px; border:1px solid rgba(255,255,255,0.05);">
              <div>
                <div style="font-size:11px; color:var(--text-muted); font-family:var(--font-mono);">Precipitation</div>
                <div style="font-size:15px; font-weight:700; color:var(--accent-primary);">${t.weatherData?.rainfall_mm || 45} mm</div>
              </div>
              <div>
                <div style="font-size:11px; color:var(--text-muted); font-family:var(--font-mono);">Temperature</div>
                <div style="font-size:15px; font-weight:700;">${t.weatherData?.temperature_c || 28} °C</div>
              </div>
              <div>
                <div style="font-size:11px; color:var(--text-muted); font-family:var(--font-mono);">Humidity</div>
                <div style="font-size:15px; font-weight:700;">${t.weatherData?.humidity_pct || 75} %</div>
              </div>
              <div>
                <div style="font-size:11px; color:var(--text-muted); font-family:var(--font-mono);">Wind Velocity</div>
                <div style="font-size:15px; font-weight:700;">${t.weatherData?.wind_speed_kmh || 20} km/h</div>
              </div>
            </div>

            <!-- AI Intelligence Directives -->
            <h4 style="font-size:14px; font-weight:700; margin-bottom:10px;">Tactical AI Assessment</h4>
            <p style="font-size:13.5px; color:var(--text-secondary); line-height:1.65; margin-bottom:18px;">
              ${escapeHtml(t.aiIntelligence?.summary || 'Atmospheric pressure anomalies indicate elevated hydrologic runoff across coastal wetlands.')}
            </p>

            ${t.aiIntelligence?.directives && t.aiIntelligence.directives.length > 0 ? `
              <div style="display:flex; flex-direction:column; gap:8px;">
                <b style="font-size:12px; color:var(--text-muted); font-family:var(--font-mono); text-transform:uppercase;">Civil Defense Directives:</b>
                ${t.aiIntelligence.directives.map(d => `
                  <div style="display:flex; align-items:flex-start; gap:8px; font-size:13px; color:var(--text-primary);">
                    <span style="color:var(--accent-primary);">▪</span>
                    <span>${escapeHtml(d)}</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  } catch (err) {
    wrap.innerHTML = `
      <div class="glass-card" style="padding:28px; border-color:var(--red); color:var(--red); text-align:center;">
        Failed to load threats: ${escapeHtml(err.message)}
      </div>
    `;
  }
}

async function runDistrictThreatAssessment() {
  const district = document.getElementById('threatDistrictSelect')?.value || 'Chennai';
  const btn = document.getElementById('btnRunThreatAssess');
  if (btn) { btn.disabled = true; btn.textContent = 'Running Pipeline...'; }

  try {
    toast(`🛰️ Ingesting live telemetry & running threat assessment for ${district}...`);
    const res = await api('/threats/assess-district', 'POST', { district });
    toast(`Assessment complete for ${district}! Probability: ${res.assessment?.floodProbabilityPct?.toFixed(1)}%`);
    await _loadActiveThreatAssessments();
  } catch (err) {
    toast(`Assessment error: ${err.message}`);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '⚡ Execute Live Assessment'; }
  }
}
