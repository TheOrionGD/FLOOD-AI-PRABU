/**
 * adminUsersView.js
 * Admin Workspace Screen 02 — User and Role Administration
 * Connects to /api/admin/users and /api/admin/users/:id/role
 */

let _adminUsersSearch = '';
let _adminUsersPage = 1;

async function renderAdminUsers(root) {
  root.innerHTML = `
    <div class="saas-page-container">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:14px;">
        <div>
          <span class="story-tag" style="color:var(--red); border-color:rgba(255,77,106,0.3); background:rgba(255,77,106,0.1);">
            ADMIN CLEARANCE LEVEL 3
          </span>
          <h1 style="font-family:var(--font-display); font-size:28px; font-weight:700; margin-top:6px;">
            User &amp; Role Administration
          </h1>
          <p style="font-size:13.5px; color:var(--text-secondary);">
            Cryptographic RBAC directory, role promotions, and clearance authorization.
          </p>
        </div>

        <!-- Search Bar -->
        <div style="display:flex; gap:10px; align-items:center;">
          <input type="text" class="glass-input" id="adminUserSearchInput" placeholder="Search by email, name or role..." 
            value="${escapeHtml(_adminUsersSearch)}" oninput="_handleAdminUserSearch(this.value)" style="min-width:280px;">
          <button class="glass-btn btn-ghost" onclick="_loadAdminUsersList()">
            Refresh 🔄
          </button>
        </div>
      </div>

      <div id="adminUsersTableWrap">
        <div class="glass-card" style="padding:36px; text-align:center;">
          <span class="spin-anim" style="font-size:22px; color:var(--accent-primary);">⚡</span>
          <div style="font-size:13px; color:var(--text-muted); margin-top:8px;">Loading registered operators...</div>
        </div>
      </div>
    </div>
  `;

  await _loadAdminUsersList();
}

let _searchDebounceTimer = null;
function _handleAdminUserSearch(val) {
  _adminUsersSearch = val;
  if (_searchDebounceTimer) clearTimeout(_searchDebounceTimer);
  _searchDebounceTimer = setTimeout(() => {
    _adminUsersPage = 1;
    _loadAdminUsersList();
  }, 350);
}

async function _loadAdminUsersList() {
  const wrap = document.getElementById('adminUsersTableWrap');
  if (!wrap) return;

  try {
    const res = await api(`/admin/users?page=${_adminUsersPage}&limit=15&search=${encodeURIComponent(_adminUsersSearch)}`);
    
    if (!res.users || res.users.length === 0) {
      wrap.innerHTML = `
        <div class="glass-card" style="padding:48px; text-align:center;">
          <div style="font-size:32px; margin-bottom:12px;">👥</div>
          <h3 style="font-size:16px; font-weight:700; margin-bottom:6px;">No Operators Found</h3>
          <p style="font-size:13px; color:var(--text-muted);">Try refining your search keyword.</p>
        </div>
      `;
      return;
    }

    wrap.innerHTML = `
      <div class="glass-table-container">
        <table class="glass-table">
          <thead>
            <tr>
              <th>Operator</th>
              <th>Email Address</th>
              <th>Assigned Role</th>
              <th>Phone Verification</th>
              <th>Registered</th>
              <th style="text-align:right;">Clearance Action</th>
            </tr>
          </thead>
          <tbody>
            ${res.users.map(u => `
              <tr>
                <td>
                  <div style="display:flex; align-items:center; gap:10px;">
                    <div style="width:32px; height:32px; border-radius:50%; background:rgba(255,255,255,0.08); display:grid; place-items:center; font-size:13px; font-weight:700; color:var(--accent-primary);">
                      ${escapeHtml((u.displayName || 'U').charAt(0).toUpperCase())}
                    </div>
                    <div>
                      <div style="font-weight:600; color:var(--text-primary);">${escapeHtml(u.displayName || 'Unnamed')}</div>
                      <div style="font-size:11px; color:var(--text-muted); font-family:var(--font-mono);">${u._id}</div>
                    </div>
                  </div>
                </td>
                <td style="font-family:var(--font-mono); font-size:12.5px;">
                  ${escapeHtml(u.email)}
                </td>
                <td>
                  <span class="glass-badge" style="background:${u.role === 'admin' ? 'rgba(255,77,106,0.15)' : (u.role === 'analyst' ? 'rgba(51,199,255,0.15)' : 'rgba(31,224,168,0.15)')}; color:${u.role === 'admin' ? 'var(--red)' : (u.role === 'analyst' ? 'var(--accent-primary)' : 'var(--ocean)')}; font-family:var(--font-mono); font-size:11px;">
                    ● ${escapeHtml(u.role.toUpperCase())}
                  </span>
                </td>
                <td>
                  <span style="font-size:12px; color:${u.phoneVerified ? 'var(--ocean)' : 'var(--text-muted)'};">
                    ${u.phoneVerified ? '✓ Verified SIM' : '○ Unverified'}
                  </span>
                </td>
                <td style="font-size:12px; color:var(--text-muted);">
                  ${new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td style="text-align:right;">
                  <select class="glass-select" onchange="changeUserRole('${u._id}', this.value)" style="padding:6px 10px; font-size:12px;">
                    <option value="user" ${u.role === 'user' ? 'selected' : ''}>Resident</option>
                    <option value="analyst" ${u.role === 'analyst' ? 'selected' : ''}>Analyst</option>
                    <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
                  </select>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:18px; font-size:12.5px; color:var(--text-muted);">
        <div>Total: <b>${res.total}</b> operators registered</div>
        <div style="display:flex; gap:8px;">
          <button class="glass-btn btn-ghost" onclick="_adminUsersPage = Math.max(1, _adminUsersPage - 1); _loadAdminUsersList();" ${_adminUsersPage <= 1 ? 'disabled style="opacity:0.3;"' : ''}>
            ← Prev
          </button>
          <span style="padding:6px 12px; font-family:var(--font-mono);">Page ${_adminUsersPage} of ${res.pages || 1}</span>
          <button class="glass-btn btn-ghost" onclick="_adminUsersPage = Math.min(${res.pages || 1}, _adminUsersPage + 1); _loadAdminUsersList();" ${_adminUsersPage >= (res.pages || 1) ? 'disabled style="opacity:0.3;"' : ''}>
            Next →
          </button>
        </div>
      </div>
    `;
  } catch (err) {
    wrap.innerHTML = `
      <div class="glass-card" style="padding:28px; border-color:var(--red); color:var(--red); text-align:center;">
        Failed to fetch users: ${escapeHtml(err.message)}
      </div>
    `;
  }
}

async function changeUserRole(userId, newRole) {
  if (!confirm(`Are you sure you want to promote/change user ${userId} to role ${newRole.toUpperCase()}?`)) {
    _loadAdminUsersList();
    return;
  }
  try {
    const res = await api(`/admin/users/${userId}/role`, 'PATCH', { role: newRole });
    toast(`✅ ${res.message}`);
    _loadAdminUsersList();
  } catch (err) {
    toast(`Failed to update role: ${err.message}`);
    _loadAdminUsersList();
  }
}
