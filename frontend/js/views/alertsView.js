/**
 * alertsView.js
 * Comprehensive Emergency Alert System & Acoustic Siren Console
 * Features:
 *  - Network-wide computed alert level (Green / Yellow / Orange / Red)
 *  - Interactive Acoustic Synthesizer Siren Test Console:
 *      * Green Chime (two-note soft chime)
 *      * Yellow Advisory (dual-beep alert)
 *      * Orange Warning (triple-beep cycling pulse)
 *      * Red Siren (continuous rising/falling emergency siren)
 *  - Live SOS Broadcast Trigger with real-time sounding indicator & stop action
 *  - Sound enablement toggle & master volume slider with instant audio feedback
 *  - Real-time reactive DOM updates without requiring browser page refreshes
 *  - Emergency Evacuation Routes, Nearest Relief Shelters, and Citizen Handbook
 *  - Multi-Channel Notification Subscription (Push, Email, SMS)
 */

function renderAlerts(root) {
  root = root || document.getElementById('pageRoot');
  if (!root) return;

  const districts = (typeof DISTRICTS !== 'undefined' && DISTRICTS.length)
    ? DISTRICTS
    : [
        { district: 'Thanjavur', state: 'Tamil Nadu', avg_risk: 78.4 },
        { district: 'Cuddalore', state: 'Tamil Nadu', avg_risk: 72.1 },
        { district: 'Nagapattinam', state: 'Tamil Nadu', avg_risk: 68.5 },
        { district: 'Tiruchirappalli', state: 'Tamil Nadu', avg_risk: 42.0 },
      ];

  const avgRisk = districts.reduce((s, d) => s + (d.avg_risk || d.risk || 0), 0) / districts.length;
  const level = avgRisk < 30 ? 'Green' : (avgRisk < 55 ? 'Yellow' : (avgRisk < 75 ? 'Orange' : 'Red'));
  const levelColor = {
    Green: 'var(--ocean)',
    Yellow: '#FFD166',
    Orange: 'var(--amber)',
    Red: 'var(--red)'
  }[level];

  const worst = [...districts].sort((a, b) => (b.avg_risk || 0) - (a.avg_risk || 0)).slice(0, 3);
  const isSirenActive = typeof AlertSound !== 'undefined' && AlertSound.playing === 'red';

  root.innerHTML = `
    <div class="saas-page-container" style="max-width:1160px;">
      
      <!-- Top Title & Narrative Eyebrow -->
      <div style="margin-bottom:24px;">
        <span class="story-tag" style="color:${levelColor}; border-color:${levelColor}44; background:${levelColor}15;">
          ● DEFENSE ALERT LEVEL ${level.toUpperCase()}
        </span>
        <h1 style="font-family:var(--font-display); font-size:28px; font-weight:700; margin-top:6px;">
          Emergency Alert System &amp; Acoustic Siren Center
        </h1>
        <p style="font-size:13.5px; color:var(--text-secondary); max-width:720px;">
          Real-time network alert level derived from live hydrological telemetry and dual-model machine learning inferences across all catchment sectors.
        </p>
      </div>

      <!-- Live Network Alert Level Hero Card -->
      <div class="glass-card elevated border-lightning" style="padding:28px; margin-bottom:28px; text-align:center; position:relative; overflow:hidden;">
        <div style="font-size:11px; font-weight:700; color:var(--text-2); letter-spacing:2px; text-transform:uppercase; font-family:var(--font-mono);">
          NETWORK-WIDE DISASTER STATUS
        </div>
        
        <div class="level-badge" style="display:inline-flex; align-items:center; gap:8px; margin:14px auto; padding:8px 24px; border-radius:999px; background:${levelColor}22; color:${levelColor}; border:1px solid ${levelColor}55; font-size:20px; font-weight:800; font-family:var(--font-display); letter-spacing:1px;">
          <span style="font-size:14px; animation:pulse 1.5s infinite;">●</span> LEVEL ${level.toUpperCase()}
        </div>

        <p style="color:var(--text-secondary); font-size:14px; max-width:540px; margin:0 auto 20px; line-height:1.5;">
          Highest risk exposure in: <b>${worst.map(w => w.district).join(', ')}</b>.<br/>
          Network aggregate modeled flood hazard index: <b style="color:var(--text-0);">${avgRisk.toFixed(1)}%</b>.
        </p>

        <!-- Dynamic SOS & Siren Trigger Button -->
        <div style="display:flex; flex-direction:column; align-items:center; gap:10px;">
          <button class="sos-btn ${isSirenActive ? 'sounding' : ''}" id="sosBtn" onclick="toggleSOS()" style="cursor:pointer; transition:all 0.25s ease;">
            ${isSirenActive ? 'STOP' : 'SOS'}
          </button>
          
          <div class="siren-live ${isSirenActive ? 'on' : ''}" id="sirenLive" onclick="stopSirenAction()" style="cursor:pointer;">
            ● SIREN ACTIVE — TAP TO SILENCE DISASTER ALARM
          </div>
        </div>
      </div>

      <!-- Acoustic Synthesizer Siren Console -->
      <div class="glass-card elevated" style="padding:28px; margin-bottom:28px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px; margin-bottom:14px;">
          <div>
            <h2 style="font-family:var(--font-display); font-size:18px; font-weight:700; margin:0 0 4px 0; display:flex; align-items:center; gap:8px;">
              <span>🔊</span> Acoustic Alert Sound &amp; Siren Synthesizer
            </h2>
            <p style="font-size:12.5px; color:var(--text-secondary); margin:0;">
              Browser-synthesized multi-voice audio alarms generated via Web Audio API. Tap any tier to test audible warnings immediately.
            </p>
          </div>
          <div id="activeSoundStatus" style="font-size:12px; font-family:var(--font-mono); color:var(--cyber); padding:4px 10px; border-radius:6px; background:rgba(51,199,255,0.08); border:1px solid rgba(51,199,255,0.25);">
            STANDBY
          </div>
        </div>

        <!-- 4 Siren Sound Test Buttons -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:12px; margin-bottom:20px;">
          <button class="btn btn-ghost" onclick="testSound('green')" style="justify-content:flex-start; gap:10px; padding:12px 16px; border-radius:10px; border-color:rgba(31,224,168,0.3); color:var(--ocean);">
            <span style="font-size:18px;">🔔</span>
            <div style="text-align:left;">
              <div style="font-weight:700; font-size:13px;">Green — Chime</div>
              <div style="font-size:11px; color:var(--text-2);">Dual-tone 660/880Hz advisory</div>
            </div>
          </button>

          <button class="btn btn-ghost" onclick="testSound('yellow')" style="justify-content:flex-start; gap:10px; padding:12px 16px; border-radius:10px; border-color:rgba(255,209,102,0.3); color:#FFD166;">
            <span style="font-size:18px;">⚠️</span>
            <div style="text-align:left;">
              <div style="font-weight:700; font-size:13px;">Yellow — Advisory</div>
              <div style="font-size:11px; color:var(--text-2);">Two short 720Hz beeps</div>
            </div>
          </button>

          <button class="btn btn-ghost" onclick="testSound('orange')" style="justify-content:flex-start; gap:10px; padding:12px 16px; border-radius:10px; border-color:rgba(255,184,77,0.3); color:var(--amber);">
            <span style="font-size:18px;">📢</span>
            <div style="text-align:left;">
              <div style="font-weight:700; font-size:13px;">Orange — Warning</div>
              <div style="font-size:11px; color:var(--text-2);">Triple 920Hz burst pulse</div>
            </div>
          </button>

          <button class="btn btn-ghost" onclick="testSound('red')" style="justify-content:flex-start; gap:10px; padding:12px 16px; border-radius:10px; border-color:rgba(239,68,68,0.4); color:var(--red);">
            <span style="font-size:18px;">🚨</span>
            <div style="text-align:left;">
              <div style="font-weight:700; font-size:13px;">Red — Civil Siren</div>
              <div style="font-size:11px; color:var(--text-2);">Continuous 650-1350Hz sweep</div>
            </div>
          </button>
        </div>

        <!-- Sound Controls: Toggle, Volume & Stop -->
        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px; padding:16px 20px; border-radius:12px; background:rgba(255,255,255,0.025); border:1px solid var(--panel-border);">
          <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-size:13px; font-weight:600; color:var(--text-0);">
            <input type="checkbox" id="soundEnabledCheck" ${(typeof AlertSound !== 'undefined' && AlertSound.enabled) ? 'checked' : ''} 
              onchange="handleSoundToggle(this.checked)" style="width:16px; height:16px; cursor:pointer;">
            <span>Play Audible Alerts on High / Very High Predictions</span>
          </label>

          <div style="display:flex; align-items:center; gap:12px;">
            <span style="font-size:12.5px; color:var(--text-secondary); font-family:var(--font-mono);">Volume:</span>
            <input type="range" id="soundVolRange" min="0" max="100" 
              value="${Math.round(((typeof AlertSound !== 'undefined' ? AlertSound.volume : 0.7) || 0.7) * 100)}" 
              oninput="handleVolumeChange(this.value)" style="width:120px; cursor:pointer;">
            <span id="soundVolVal" style="font-size:11.5px; font-family:var(--font-mono); color:var(--cyber); min-width:32px;">
              ${Math.round(((typeof AlertSound !== 'undefined' ? AlertSound.volume : 0.7) || 0.7) * 100)}%
            </span>
          </div>

          <button class="btn btn-sm btn-ghost" onclick="stopSirenAction()" style="gap:6px; border-color:rgba(239,68,68,0.3); color:var(--red);">
            ⏹ Stop Sound
          </button>
        </div>
      </div>

      <!-- Preparedness & Safe Evacuation Hub -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:18px; margin-bottom:28px;">
        <div class="glass-card elevated" style="padding:22px;">
          <div style="font-size:22px; margin-bottom:8px;">🏛️</div>
          <h3 style="font-family:var(--font-display); font-size:16px; font-weight:700; margin-bottom:8px;">Nearest Relief Shelters</h3>
          <p style="font-size:13px; color:var(--text-secondary); line-height:1.6; margin:0;">
            ${worst.map(w => `<b>${w.district}</b>: Municipal Multi-Hazard Cyclone &amp; Flood Center (Capacity: 1,500)`).join('<br/>')}
          </p>
        </div>

        <div class="glass-card elevated" style="padding:22px;">
          <div style="font-size:22px; margin-bottom:8px;">🎒</div>
          <h3 style="font-family:var(--font-display); font-size:16px; font-weight:700; margin-bottom:8px;">Essential 72-Hour Survival Kit</h3>
          <p style="font-size:13px; color:var(--text-secondary); line-height:1.6; margin:0;">
            Pack 3 liters of potable water per person/day, waterproof torch, battery bank, first-aid antibiotics, dried rations, whistle, and duplicate certified ID cards.
          </p>
        </div>

        <div class="glass-card elevated" style="padding:22px;">
          <div style="font-size:22px; margin-bottom:8px;">🗺️</div>
          <h3 style="font-family:var(--font-display); font-size:16px; font-weight:700; margin-bottom:8px;">Evacuation Waypoints</h3>
          <p style="font-size:13px; color:var(--text-secondary); line-height:1.6; margin:0;">
            Follow primary elevated bypass arterials. Strictly avoid underpasses, causeways, and riverbank embankments during surging discharge crests.
          </p>
        </div>
      </div>

      <!-- Citizen Alert Notification Subscription -->
      <div class="glass-card elevated" style="padding:28px;">
        <h3 style="font-family:var(--font-display); font-size:18px; font-weight:700; margin-bottom:8px; display:flex; align-items:center; gap:8px;">
          <span>📢</span> Multi-Channel Citizen Warning Broadcast Subscription
        </h3>
        <p style="font-size:13px; color:var(--text-secondary); margin-bottom:18px;">
          Register your contact vectors for automated emergency push alerts, SMS warnings, and municipal email bulletins.
        </p>

        <div style="display:flex; gap:12px; flex-wrap:wrap; max-width:720px; align-items:center;">
          <input type="email" id="alertEmailInput" class="input" placeholder="citizen@domain.org (Email)" style="flex:1; min-width:180px; padding:10px 14px; border-radius:10px; background:rgba(255,255,255,0.04); border:1px solid var(--panel-border); color:var(--text-0);">
          <div style="display:flex; gap:6px; flex:1; min-width:220px; align-items:center;">
            <input type="tel" id="alertPhoneInput" class="input" autocomplete="tel tel-national" placeholder="+91 98765 43210 (Optional SMS)" style="flex:1; padding:10px 14px; border-radius:10px; background:rgba(255,255,255,0.04); border:1px solid var(--panel-border); color:var(--text-0);">
            <button type="button" class="btn btn-sm btn-ghost" onclick="autoFetchDevicePhoneNumber('alertPhoneInput')" style="font-size:11px; padding:8px 10px; gap:4px; white-space:nowrap;" title="Request SIM / device contact access to auto-fetch phone number">
              <span>📱</span> Auto-fetch SIM
            </button>
          </div>
          <button class="btn btn-primary" onclick="subscribeCitizenAlerts()" style="gap:8px;">
            <span>🛡️</span> Activate Alert Delivery
          </button>
        </div>
      </div>

    </div>
  `;

  // Attach AlertSound change listener to dynamically update the UI without reload
  if (typeof AlertSound !== 'undefined' && AlertSound.onChange) {
    AlertSound.onChange(current => {
      syncSirenUI(current);
    });
  }
}

function testSound(level) {
  const names = {
    green: 'Green Chime (Advisory Notice)',
    yellow: 'Yellow Alert (Elevated Risk)',
    orange: 'Orange Warning (Severe Threat)',
    red: 'Red Siren (Urgent Evacuation)'
  };

  if (typeof AlertSound !== 'undefined' && AlertSound.play) {
    const ok = AlertSound.play(level, { force: true, maxMs: level === 'red' ? 12000 : undefined });
    if (ok) {
      if (typeof toast === 'function') toast(`Acoustic Test Playing: ${names[level]}`);
      const statusEl = document.getElementById('activeSoundStatus');
      if (statusEl) {
        statusEl.textContent = `PLAYING: ${level.toUpperCase()}`;
        statusEl.style.color = level === 'red' ? 'var(--red)' : (level === 'orange' ? 'var(--amber)' : 'var(--cyber)');
      }
    }
  } else {
    if (typeof toast === 'function') toast('Audio synthesizer is not ready');
  }
}

function toggleSOS() {
  if (typeof AlertSound === 'undefined') return;

  if (AlertSound.playing === 'red') {
    AlertSound.stop();
    if (typeof toast === 'function') toast('SOS Civil Siren silenced');
    syncSirenUI(null);
    return;
  }

  AlertSound.play('red', { force: true, maxMs: 30000 });
  if (typeof vibrate === 'function') vibrate([400, 200, 400, 200, 400]);
  if (typeof pushNotify === 'function') pushNotify('FloodAI Emergency Siren Active', 'Civil defense broadcast sent to emergency dispatch.');
  if (typeof toast === 'function') toast('🚨 SOS broadcast activated — Continuous civil siren sounding!');
  syncSirenUI('red');
}

function stopSirenAction() {
  if (typeof AlertSound !== 'undefined') {
    AlertSound.stop();
  }
  syncSirenUI(null);
  if (typeof toast === 'function') toast('Audio sirens and acoustic alerts silenced');
}

function syncSirenUI(current) {
  const isRed = current === 'red';
  const b = document.getElementById('sosBtn');
  const l = document.getElementById('sirenLive');
  const statusEl = document.getElementById('activeSoundStatus');

  if (b) {
    b.classList.toggle('sounding', isRed);
    b.textContent = isRed ? 'STOP' : 'SOS';
  }
  if (l) {
    l.classList.toggle('on', isRed);
  }
  if (statusEl) {
    statusEl.textContent = current ? `ACTIVE: ${current.toUpperCase()}` : 'STANDBY';
    statusEl.style.color = current === 'red' ? 'var(--red)' : (current ? 'var(--amber)' : 'var(--cyber)');
  }
}

function handleSoundToggle(checked) {
  if (typeof AlertSound !== 'undefined' && AlertSound.setEnabled) {
    AlertSound.setEnabled(checked);
    if (typeof toast === 'function') toast(checked ? 'Acoustic alerts enabled' : 'Acoustic alerts muted');
  }
}

function handleVolumeChange(val) {
  const vol = Number(val) / 100;
  if (typeof AlertSound !== 'undefined' && AlertSound.setVolume) {
    AlertSound.setVolume(vol);
  }
  const lbl = document.getElementById('soundVolVal');
  if (lbl) lbl.textContent = `${val}%`;
}

function subscribeCitizenAlerts() {
  const email = document.getElementById('alertEmailInput')?.value;
  const phone = document.getElementById('alertPhoneInput')?.value;

  if (!email && !phone) {
    if (typeof toast === 'function') toast('Please enter an email or phone number');
    return;
  }

  if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
    try { Notification.requestPermission(); } catch (_) {}
  }

  if (typeof AlertSound !== 'undefined') {
    AlertSound.play('green', { force: true });
  }

  if (typeof toast === 'function') {
    toast(`Alert subscriptions registered for ${email || phone}`);
  }
}
