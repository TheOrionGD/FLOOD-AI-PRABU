/**
 * splashView.js
 * Screen 01 — Introductory Liquid Glass Splash Experience
 * Checks session state, initial service health, and transitions to onboarding or landing/workspace.
 */

let _splashTimer = null;

function renderSplash(root) {
  if (_splashTimer) clearTimeout(_splashTimer);

  root.innerHTML = `
    <div class="layout-public" style="min-height:92vh; display:flex; align-items:center; justify-content:center; padding:24px; position:relative;">
      <div class="glass-dialog border-lightning" style="max-width:540px; width:100%; text-align:center; padding:52px 36px; border-radius:28px;">
        
        <!-- Animated Water Rippling Logo Mark -->
        <div style="margin:0 auto 24px; width:72px; height:72px; border-radius:20px; display:grid; place-items:center; background:conic-gradient(from 180deg, var(--accent-primary), var(--accent-secondary), var(--accent-tertiary, #B18CFF), var(--accent-primary)); box-shadow:0 0 36px var(--accent-glow); position:relative;">
          <div style="position:absolute; inset:2px; background:var(--flood-bg); border-radius:18px; display:grid; place-items:center;">
            <span style="font-size:32px;">🌊</span>
          </div>
        </div>

        <h1 style="font-family:var(--font-display); font-size:32px; font-weight:700; letter-spacing:-0.5px; margin-bottom:8px;">
          FloodAI
        </h1>
        <div style="font-family:var(--font-mono); font-size:12px; letter-spacing:1.8px; text-transform:uppercase; color:var(--accent-primary); font-weight:600; margin-bottom:24px;">
          AI Flood Prediction &amp; Threat Intelligence
        </div>

        <p style="font-size:14px; color:var(--text-secondary); line-height:1.6; max-width:420px; margin:0 auto 32px;">
          Initializing dual-model ML inference engines, atmospheric weather telemetry streams, and geospatial GIS boundaries...
        </p>

        <!-- Dynamic Progress Bar -->
        <div style="width:100%; height:6px; background:rgba(255,255,255,0.08); border-radius:6px; overflow:hidden; margin-bottom:14px; position:relative;">
          <div id="splashProgressFill" style="height:100%; width:15%; background:linear-gradient(90deg, var(--accent-primary), var(--accent-secondary)); border-radius:6px; transition:width 0.4s ease;"></div>
        </div>

        <div id="splashStatusText" style="font-family:var(--font-mono); font-size:11.5px; color:var(--text-muted);">
          Establishing encrypted API channel...
        </div>

        <!-- Quick Access Bypass CTA -->
        <div style="margin-top:28px;">
          <button class="glass-btn btn-ghost" onclick="bypassSplash()" style="font-size:12px; padding:6px 16px; color:var(--text-muted);">
            Skip Initialization →
          </button>
        </div>
      </div>
    </div>
  `;

  // Progressive initialization sequence
  const progressFill = document.getElementById('splashProgressFill');
  const statusText = document.getElementById('splashStatusText');

  setTimeout(() => {
    if (progressFill) progressFill.style.width = '45%';
    if (statusText) statusText.textContent = 'Verifying cryptographic session tokens...';
  }, 400);

  setTimeout(() => {
    if (progressFill) progressFill.style.width = '85%';
    if (statusText) statusText.textContent = 'Loading cadastral inundation telemetry...';
  }, 900);

  _splashTimer = setTimeout(() => {
    if (progressFill) progressFill.style.width = '100%';
    if (statusText) statusText.textContent = 'Ready.';
    setTimeout(bypassSplash, 250);
  }, 1400);
}

function bypassSplash() {
  if (_splashTimer) {
    clearTimeout(_splashTimer);
    _splashTimer = null;
  }

  // Navigate according to authentication state and onboarding history
  if (state.token && state.user) {
    const role = state.user.role || 'user';
    if (role === 'admin') {
      goTo('admin-ops');
    } else if (role === 'analyst') {
      goTo('analyst-predict');
    } else {
      goTo('resident-risk');
    }
  } else if (!state.onboardingCompleted) {
    goTo('onboarding');
  } else {
    goTo('landing');
  }
}
