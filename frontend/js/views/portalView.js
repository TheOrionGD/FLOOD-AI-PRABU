/* ===========================================================
   FloodAI — Resident & Citizen Safety Portal View
   =========================================================== */

async function renderPortal(root) {
  root = root || document.getElementById('pageRoot');
  if (!root) return;

  if (!isDataBootstrapped || DISTRICTS.length === 0) {
    try {
      await bootstrapDynamicData();
    } catch (e) {
      console.warn('[Portal] Dynamic data load note:', e);
    }
  }

  const user = state.user;

  root.innerHTML = `
    <div class="eyebrow">Public Safety Grid · Personalized Flood Intelligence · User Data Isolation</div>
    <h1 class="page-title">Citizen &amp; Resident Safety Portal</h1>
    <p class="page-sub">Direct access to localized flood advisories, nearby disaster shelters, and personalized SMS/Email/Web Push emergency warnings.</p>

    ${typeof renderPermissionBanner === 'function' ? renderPermissionBanner('portal') : ''}

    <!-- User Authentication & Verification Status -->
    <div class="liquid-glass border-scale card-glow" style="padding:22px; margin:24px 0; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px;">
      <div style="display:flex; align-items:center; gap:16px;">
        <div style="width:48px; height:48px; border-radius:12px; background:rgba(31,224,168,0.15); display:grid; place-items:center; font-size:24px;">
          ${user ? '👤' : '🛡️'}
        </div>
        <div>
          <div style="display:flex; align-items:center; gap:8px;">
            <h3 style="font-family:var(--font-display); font-size:17px; margin:0;" class="text-glow-cyber">${user ? escapeHtml(user.displayName) : 'Guest Resident Session'}</h3>
            <span style="font-family:var(--font-mono); font-size:10px; padding:2px 8px; border-radius:4px; background:rgba(51,199,255,0.15); color:var(--cyber);">
              ${user ? (user.role || 'Resident') : 'Public Access'}
            </span>
            ${user?.phoneVerified ? '<span style="font-family:var(--font-mono); font-size:10px; padding:2px 8px; border-radius:4px; background:rgba(31,224,168,0.15); color:var(--ocean);">📱 Phone Verified</span>' : ''}
          </div>
          <p style="color:var(--text-1); font-size:12.5px; margin:4px 0 0;">
            ${user ? `Account: ${escapeHtml(user.email)} · ${user.phone ? `SMS: ${escapeHtml(user.phone)}` : 'No phone linked'}` : 'Sign in to link verified phone number for SMS alerts and preserve saved districts.'}
          </p>
        </div>
      </div>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <button class="btn btn-sm btn-ghost" onclick="openPermissionsModal()">🛡️ Permissions Center</button>
        ${user ? `
          <button class="btn btn-sm btn-ghost" onclick="openPrefModal()">⚙️ Preferences</button>
        ` : `
          <button class="btn btn-sm btn-primary" onclick="openAuthModal('login')">Sign In / Register</button>
        `}
      </div>
    </div>

    <!-- Portal Layout -->
    <div style="display:grid; grid-template-columns:1.2fr 0.8fr; gap:24px; align-items:start;">
      <!-- Left Column: District Telemetry & Safety Status -->
      <div>
        <div class="liquid-glass" style="padding:24px; margin-bottom:24px;">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; flex-wrap:wrap; gap:10px;">
            <div>
              <div style="font-family:var(--font-display); font-weight:700; font-size:16px;">My Monitored District</div>
              <div style="font-size:12px; color:var(--text-1);">Select your home or workplace area for real-time risk status</div>
            </div>
            <div style="display:flex; gap:8px;">
              <select id="portalDistrictSelect" style="padding:8px 12px; border-radius:8px; background:var(--bg-1); color:var(--text-0); border:1px solid var(--panel-border);" onchange="changePortalDistrict(this.value)">
                ${DISTRICTS.map(d => `<option value="${d.district}" ${d.district === portalSelectedDistrict ? 'selected' : ''}>${d.district}, ${d.state}</option>`).join('')}
              </select>
              <button class="btn btn-sm btn-ghost" onclick="detectUserLocation()" title="Use GPS Location">${iconPin()} Locate</button>
            </div>
          </div>

          <div id="portalDistrictBody">
            <div style="text-align:center; padding:30px; color:var(--text-1);">Loading district telemetry...</div>
          </div>
        </div>

        <!-- Local Relief Shelters & Evacuation Routes -->
        <div class="liquid-glass border-scale card-glow-ocean" style="padding:24px;">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:14px;">
            <div style="font-family:var(--font-display); font-weight:700; font-size:16px;">Emergency Relief Shelters</div>
            <span class="valtag" style="color:var(--ocean);" id="portalShelterCount">Active</span>
          </div>
          <div id="portalSheltersList" style="display:flex; flex-direction:column; gap:10px;">
            <!-- Rendered dynamically -->
          </div>
        </div>
      </div>

      <!-- Right Column: Personal Notification Channels & History -->
      <div>
        <!-- Notification Channels Card -->
        <div class="liquid-glass border-lightning border-scale card-glow" style="padding:24px; margin-bottom:24px;">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; flex-wrap:wrap; gap:8px;">
            <div style="font-family:var(--font-display); font-weight:700; font-size:16px;">Emergency Alert Channels</div>
            <button class="btn btn-sm btn-ghost" onclick="openPermissionsModal()" style="font-size:11px; padding:4px 9px;">🛡️ Manage Access</button>
          </div>
          <p style="font-size:12.5px; color:var(--text-1); margin-bottom:18px;">Automated early warnings are dispatched when modeled risk exceeds your threshold.</p>

          <div style="display:flex; flex-direction:column; gap:14px;">
            <!-- FCM Web Push -->
            <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 14px; border-radius:10px; background:var(--bg-1); border:1px solid var(--panel-border);">
              <div>
                <div style="font-weight:600; font-size:13px;">🔔 Web Push Notifications</div>
                <div style="font-size:11px; color:var(--text-1);">${state.fcmToken ? 'Active on this browser' : 'Permission needed'}</div>
              </div>
              <button class="btn btn-sm ${state.fcmToken ? 'btn-ghost' : 'btn-primary'}" onclick="${state.fcmToken ? 'triggerTestPush()' : 'enableWebPushNotifications()'}" style="font-size:11px;">
                ${state.fcmToken ? 'Test' : 'Enable'}
              </button>
            </div>

            <!-- Email Alerts -->
            <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 14px; border-radius:10px; background:var(--bg-1); border:1px solid var(--panel-border);">
              <div>
                <div style="font-weight:600; font-size:13px;">📧 Brevo Transactional Email</div>
                <div style="font-size:11px; color:var(--text-1);">${user ? escapeHtml(user.email) : 'Login required'}</div>
              </div>
              <span style="font-family:var(--font-mono); font-size:11px; color:var(--ocean);">${user ? 'CONFIGURED' : 'LOCKED'}</span>
            </div>

            <!-- SMS Alerts -->
            <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 14px; border-radius:10px; background:var(--bg-1); border:1px solid var(--panel-border);">
              <div>
                <div style="font-weight:600; font-size:13px;">📱 SMS Emergency Broadcasts</div>
                <div style="font-size:11px; color:var(--text-1);">${user?.phoneVerified ? `Verified: ${escapeHtml(user.phone)}` : (user?.phone ? 'Unverified Phone' : 'No Phone Linked')}</div>
              </div>
              <button class="btn btn-sm btn-ghost" onclick="openPrefModal()" style="font-size:11px;">Configure</button>
            </div>
          </div>
        </div>

        <!-- Personal Notification History (User-Isolated) -->
        <div class="liquid-glass" style="padding:24px;">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
            <div style="font-family:var(--font-display); font-weight:700; font-size:16px;">My Alert History</div>
            <button class="btn btn-sm btn-ghost" onclick="loadUserAlertHistory()" style="font-size:11px;">Refresh</button>
          </div>
          <div id="portalAlertHistory" style="display:flex; flex-direction:column; gap:8px;">
            <div style="font-size:12px; color:var(--text-2); text-align:center; padding:16px;">Loading alert dispatch history...</div>
          </div>
        </div>
      </div>
    </div>
  `;

  loadPortalDistrictTelemetry(portalSelectedDistrict);
  loadUserAlertHistory();
}

function changePortalDistrict(dName) {
  portalSelectedDistrict = dName;
  loadPortalDistrictTelemetry(dName);
}

async function loadPortalDistrictTelemetry(districtName, isRefresh = false) {
  const d = DISTRICTS.find(x => x.district.toLowerCase() === districtName.toLowerCase()) || DISTRICTS[0] || { district: districtName, latitude: 13.08, longitude: 80.27, avg_risk: 30 };
  const body = document.getElementById('portalDistrictBody');
  const shelterList = document.getElementById('portalSheltersList');
  if (!body) return;

  if (isRefresh) {
    body.classList.add('refreshing-card');
  } else {
    body.innerHTML = `
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-bottom:18px;">
        <div class="skeleton" style="height:120px; border-radius:12px;"></div>
        <div class="skeleton" style="height:120px; border-radius:12px;"></div>
      </div>
      <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:18px;">
        <div class="skeleton" style="height:60px; border-radius:10px;"></div>
        <div class="skeleton" style="height:60px; border-radius:10px;"></div>
        <div class="skeleton" style="height:60px; border-radius:10px;"></div>
        <div class="skeleton" style="height:60px; border-radius:10px;"></div>
      </div>
      <div class="skeleton" style="height:70px; border-radius:10px;"></div>
    `;
    if (shelterList) {
      shelterList.innerHTML = `
        <div class="skeleton" style="height:56px; border-radius:10px; margin-bottom:8px;"></div>
        <div class="skeleton" style="height:56px; border-radius:10px;"></div>
      `;
    }
  }

  try {
    let temp = 28, hum = 70, wind = 20, rain = 25, cond = 'Overcast', isStale = false;
    try {
      const owm = await api(`/weather?lat=${d.latitude}&lon=${d.longitude}`, 'GET', null, false);
      if (owm?.data?.main) {
        temp = Math.round(owm.data.main.temp);
        hum = Math.round(owm.data.main.humidity);
        wind = Math.round((owm.data.wind?.speed || 5) * 3.6);
        rain = owm.data.rain ? Math.max((owm.data.rain['1h'] || owm.data.rain['3h'] || 0) * 8, 15) : 15;
        cond = owm.data.weather?.[0]?.description || 'Active';
      }
    } catch (e) {
      isStale = true;
    }

    const risk = d.avg_risk || 40;
    const col = riskColor(risk);
    body.classList.remove('refreshing-card');

    body.innerHTML = `
      ${renderDataFreshnessBar({
        label: 'OpenWeather Atmospheric Stream',
        timestamp: new Date(),
        onRefresh: `loadPortalDistrictTelemetry('${districtName}', true)`,
        isRefreshing: false,
        isStale
      })}

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-bottom:18px;">
        <div style="padding:18px; border-radius:12px; background:rgba(0,0,0,0.2); border:1px solid var(--panel-border);">
          <div style="font-size:11px; color:var(--text-2); text-transform:uppercase; letter-spacing:1px;">Modeled Hazard Risk</div>
          <div style="font-family:var(--font-display); font-size:36px; font-weight:700; color:${col}; margin:4px 0;">${risk.toFixed(1)}%</div>
          <span class="valtag" style="background:${col}22; color:${col}; border:1px solid ${col}44;">${riskLabel(risk).toUpperCase()} SEVERITY</span>
        </div>
        <div style="padding:18px; border-radius:12px; background:rgba(0,0,0,0.2); border:1px solid var(--panel-border);">
          <div style="font-size:11px; color:var(--text-2); text-transform:uppercase; letter-spacing:1px;">Atmospheric Conditions</div>
          <div style="font-family:var(--font-display); font-size:36px; font-weight:700; color:var(--cyber); margin:4px 0;">${temp}°C</div>
          <div style="font-size:12px; color:var(--text-1); text-transform:capitalize;">${cond} · Wind ${wind} km/h</div>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:18px;">
        <div class="glass" style="padding:10px; text-align:center;">
          <div style="font-size:10px; color:var(--text-2);">Rainfall</div>
          <div style="font-weight:700; font-size:14px; margin-top:2px;">${rain} mm</div>
        </div>
        <div class="glass" style="padding:10px; text-align:center;">
          <div style="font-size:10px; color:var(--text-2);">Humidity</div>
          <div style="font-weight:700; font-size:14px; margin-top:2px;">${hum}%</div>
        </div>
        <div class="glass" style="padding:10px; text-align:center;">
          <div style="font-size:10px; color:var(--text-2);">Elevation</div>
          <div style="font-weight:700; font-size:14px; margin-top:2px;">${Math.round(d.avg_elevation || d.elevation_m || 15)} m</div>
        </div>
        <div class="glass" style="padding:10px; text-align:center;">
          <div style="font-size:10px; color:var(--text-2);">Sector</div>
          <div style="font-weight:700; font-size:14px; margin-top:2px;">${(d.coastal || ['Chennai','Kochi','Kolkata','Mumbai','Surat','Visakhapatnam'].includes(d.district)) ? 'Coastal' : 'Inland'}</div>
        </div>
      </div>

      <div style="padding:14px 16px; border-radius:10px; background:${risk > 50 ? 'rgba(255,77,106,0.1)' : 'rgba(31,224,168,0.1)'}; border:1px solid ${risk > 50 ? 'rgba(255,77,106,0.3)' : 'rgba(31,224,168,0.3)'};">
        <b style="color:${risk > 50 ? 'var(--red)' : 'var(--ocean)'}; font-size:13px;">Civil Protection Advisory:</b>
        <p style="margin:4px 0 0; font-size:12.5px; line-height:1.5; color:var(--text-0);">
          ${risk > 50 
            ? 'Water stages in low-lying catchment areas are elevated. Avoid subterranean transit corridors and keep portable emergency kits accessible.' 
            : 'Precipitation levels within nominal drainage thresholds. Continue monitoring automated push and SMS channels for advisories.'}
        </p>
      </div>
    `;

    if (shelterList) {
      const shelters = d.shelters || [
        { name: `${districtName} Central Relief Complex`, capacity: 1200, contact: '1077' },
        { name: 'District Stadium Multi-Purpose Shelter', capacity: 850, contact: '112' }
      ];
      const countEl = document.getElementById('portalShelterCount');
      if (countEl) countEl.textContent = `${shelters.length} Shelters Listed`;
      shelterList.innerHTML = shelters.map(s => `
        <div style="padding:12px 14px; border-radius:10px; background:var(--bg-1); border:1px solid var(--panel-border); display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-weight:600; font-size:13px;">🏠 ${escapeHtml(s.name)}</div>
            <div style="font-size:11px; color:var(--text-1); margin-top:2px;">Capacity: <b>${s.capacity} persons</b> · Emergency Contact: <b>${s.contact || '1077'}</b></div>
          </div>
          <button class="btn btn-sm btn-ghost" onclick="toast('Directions to ${escapeHtml(s.name)} loaded on map'); goTo('map');" style="font-size:10px; padding:4px 8px;">Directions</button>
        </div>
      `).join('');
    }
  } catch (err) {
    body.classList.remove('refreshing-card');
    body.innerHTML = renderErrorState({
      title: 'Telemetry Synchronization Notice',
      message: `Failed to load atmospheric vectors for ${districtName}: ${err.message}`,
      retryFn: `loadPortalDistrictTelemetry('${districtName}')`
    });
  }
}

async function loadUserAlertHistory() {
  const container = document.getElementById('portalAlertHistory');
  if (!container) return;

  container.innerHTML = `
    <div class="skeleton" style="height:52px; border-radius:8px; margin-bottom:8px;"></div>
    <div class="skeleton" style="height:52px; border-radius:8px;"></div>
  `;

  try {
    const res = await api('/notifications/history', 'GET', null, false);
    const dispatches = res.dispatches || [];

    if (dispatches.length === 0) {
      container.innerHTML = renderEmptyState({
        icon: '🔔',
        title: 'No Alerts Dispatched Yet',
        message: 'Personal flood early warnings will appear here when risk thresholds are exceeded in your sector.',
        actionText: state.fcmToken ? 'Send Test Web Push' : 'Enable Web Push',
        actionFn: state.fcmToken ? 'triggerTestPush()' : 'enableWebPushNotifications()'
      });
      return;
    }

    container.innerHTML = dispatches.slice(0, 6).map(a => `
      <div style="padding:10px 12px; border-radius:8px; background:rgba(255,255,255,0.03); border:1px solid var(--panel-border); font-size:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <span style="font-weight:600; color:var(--cyber); text-transform:uppercase; font-size:10px;">${a.channel}</span>
          <span style="font-size:10px; color:var(--text-2);">${new Date(a.createdAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</span>
        </div>
        <div style="color:var(--text-0);">${escapeHtml(a.message || a.dedupKey)}</div>
        <div style="font-size:10px; color:var(--text-2); margin-top:4px;">Status: <b style="color:var(--ocean);">${a.status}</b></div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = renderErrorState({
      title: 'Alert History Offline',
      message: 'Sign in to sync your verified alert dispatch history.',
      retryFn: 'loadUserAlertHistory()'
    });
  }
}
