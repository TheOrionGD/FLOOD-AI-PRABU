/**
 * adminAuditView.js
 * Admin Workspace Screen 05 — Audit and Activity Explorer
 * Connects to /api/admin/audit-logs
 */

async function renderAdminAudit(root) {
  root.innerHTML = `
    <div class="saas-page-container">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:14px;">
        <div>
          <span class="story-tag" style="color:var(--red); border-color:rgba(255,77,106,0.3); background:rgba(255,77,106,0.1);">
            ADMIN CLEARANCE LEVEL 3
          </span>
          <h1 style="font-family:var(--font-display); font-size:28px; font-weight:700; margin-top:6px;">
            Audit &amp; Activity Explorer
          </h1>
          <p style="font-size:13.5px; color:var(--text-secondary);">
            Immutable administrative compliance log, security events, and operator actions.
          </p>
        </div>

        <button class="glass-btn btn-ghost" onclick="renderAdminAudit(document.getElementById('pageRoot'))">
          Refresh Trail 🔄
        </button>
      </div>

      <div id="adminAuditWrap">
        <div class="glass-card" style="padding:36px; text-align:center;">
          <span class="spin-anim" style="font-size:22px; color:var(--accent-primary);">⚡</span>
          <div style="font-size:13px; color:var(--text-muted); margin-top:8px;">Fetching compliance audit trail...</div>
        </div>
      </div>
    </div>
  `;

  try {
    const res = await api('/admin/audit-logs');
    const wrap = document.getElementById('adminAuditWrap');
    if (!wrap) return;

    if (!res.logs || res.logs.length === 0) {
      wrap.innerHTML = `
        <div class="glass-card" style="padding:48px; text-align:center;">
          <div style="font-size:36px; margin-bottom:12px;">🛡️</div>
          <h3 style="font-size:18px; font-weight:700;">Audit Trail Initialized</h3>
          <p style="font-size:13px; color:var(--text-muted);">No suspicious security events detected.</p>
        </div>
      `;
      return;
    }

    wrap.innerHTML = `
      <div class="glass-table-container">
        <table class="glass-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Actor</th>
              <th>Action Executed</th>
              <th>Target Resource</th>
              <th>Status</th>
              <th>Technical Details</th>
            </tr>
          </thead>
          <tbody>
            ${res.logs.map(log => `
              <tr>
                <td style="font-family:var(--font-mono); font-size:11.5px; color:var(--text-muted); white-space:nowrap;">
                  ${new Date(log.timestamp).toLocaleString()}
                </td>
                <td style="font-weight:600; color:var(--accent-primary);">
                  ${escapeHtml(log.actor)}
                </td>
                <td style="font-weight:600;">
                  ${escapeHtml(log.action)}
                </td>
                <td style="font-family:var(--font-mono); font-size:12px; color:var(--text-secondary);">
                  ${escapeHtml(log.target)}
                </td>
                <td>
                  <span class="glass-badge" style="background:${log.status === 'SUCCESS' || log.status === 'VERIFIED' ? 'rgba(31,224,168,0.15)' : 'rgba(255,77,106,0.15)'}; color:${log.status === 'SUCCESS' || log.status === 'VERIFIED' ? 'var(--ocean)' : 'var(--red)'}; font-family:var(--font-mono); font-size:10.5px;">
                    ● ${escapeHtml(log.status)}
                  </span>
                </td>
                <td style="font-size:12px; color:var(--text-secondary);">
                  ${escapeHtml(log.detail || 'N/A')}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    const wrap = document.getElementById('adminAuditWrap');
    if (wrap) {
      wrap.innerHTML = `
        <div class="glass-card" style="padding:28px; border-color:var(--red); color:var(--red); text-align:center;">
          Failed to fetch audit log: ${escapeHtml(err.message)}
        </div>
      `;
    }
  }
}
