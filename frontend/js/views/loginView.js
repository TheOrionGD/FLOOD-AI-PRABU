/**
 * loginView.js
 * Screen 11 — SaaS Authentication Split-Screen Layout
 * Features:
 *  - Premium Liquid Glass split layout (Brand / Security on left, Enterprise Auth on right)
 *  - Strict legal consent card & inspection requirement
 *  - Consent checkbox is disabled until the legal card has been opened/inspected
 *  - Login & Google buttons remain disabled until the checkbox is checked
 *  - Preserves 100% of existing Firebase Google auth and email/password handlers
 */

function renderLogin(root) {
  // Check if user already authenticated
  if (state.token && state.user) {
    const role = state.user.role || 'user';
    if (role === 'admin') return goTo('admin-ops');
    if (role === 'analyst') return goTo('analyst-predict');
    return goTo('resident-risk');
  }

  const isConsentCardUnlocked = state.consentModalViewed;
  const isCheckboxChecked = state.consentAccepted;

  root.innerHTML = `
    <div class="layout-public" style="min-height:92vh; display:flex; flex-direction:column; justify-content:center; padding:20px;">
      
      <div class="split-auth-container border-lightning">
        
        <!-- LEFT PANEL: Brand, Security, & Atmospheric Narrative -->
        <div class="split-auth-brand">
          <div>
            <div class="brand" onclick="goTo('home')" style="cursor:pointer; font-size:24px; margin-bottom:28px;">
              <span class="mark" style="width:40px; height:40px;">${iconWave()}</span> FloodAI
            </div>

            <span class="story-tag" style="background:rgba(51,199,255,0.12); color:var(--accent-primary); border-color:rgba(51,199,255,0.3);">
              ENTERPRISE DISASTER INTELLIGENCE
            </span>

            <h2 style="font-family:var(--font-display); font-size:32px; font-weight:700; line-height:1.2; margin:16px 0 14px; color:#ffffff;">
              Cryptographic Threat Sentinel &amp; Civil Defense
            </h2>
            <p style="font-size:14.5px; color:var(--text-secondary); line-height:1.7; max-width:400px;">
              Sign in with your authorized credentials to access dual-model inference engines, cadastral GIS inundation boundaries, and real-time emergency dispatch networks.
            </p>
          </div>

          <!-- Clearance Security Badges -->
          <div style="display:flex; flex-direction:column; gap:12px; margin-top:36px; border-top:1px solid rgba(255,255,255,0.08); padding-top:24px;">
            <div style="display:flex; align-items:center; gap:10px; font-size:12.5px; color:var(--text-muted);">
              <span>🛡️</span> <b>Strict RBAC:</b> Admin • Analyst • Resident Clearances
            </div>
            <div style="display:flex; align-items:center; gap:10px; font-size:12.5px; color:var(--text-muted);">
              <span>🔒</span> <b>Zero-Trust:</b> HMAC-SHA256 Signed JSON Web Tokens
            </div>
            <div style="display:flex; align-items:center; gap:10px; font-size:12.5px; color:var(--text-muted);">
              <span>🛰️</span> <b>Live Feed:</b> OpenWeather &amp; Open-Meteo Telemetry
            </div>
          </div>
        </div>

        <!-- RIGHT PANEL: Enterprise Sign-In with Strict Legal Consent Mechanism -->
        <div class="split-auth-form-wrap">
          
          <div style="margin-bottom:24px;">
            <h3 style="font-family:var(--font-display); font-size:24px; font-weight:700; margin-bottom:6px;">
              Welcome Back
            </h3>
            <p style="font-size:13.5px; color:var(--text-muted);">
              Authenticate to unlock your role-specific operational workspace
            </p>
          </div>

          <!-- MANDATORY LEGAL POLICY CARD -->
          <div class="glass-card ${isConsentCardUnlocked ? 'elevated' : 'border-lightning'}" 
            style="padding:16px 18px; margin-bottom:20px; border-radius:14px; background:${isConsentCardUnlocked ? 'rgba(31,224,168,0.06)' : 'rgba(51,199,255,0.06)'}; border-color:${isConsentCardUnlocked ? 'rgba(31,224,168,0.35)' : 'var(--glass-border-focus)'};">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
              <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:22px;">${isConsentCardUnlocked ? '✅' : '📑'}</span>
                <div>
                  <div style="font-size:13px; font-weight:700; color:var(--text-primary);">
                    ${isConsentCardUnlocked ? 'Compliance Agreement Reviewed' : 'Compliance & Legal Verification Required'}
                  </div>
                  <div style="font-size:11.5px; color:var(--text-muted);">
                    ${isConsentCardUnlocked ? 'Legal terms unlocked. Check agreement below to enable sign-in.' : 'Open and review Terms & Privacy Policy to unlock sign-in checkbox.'}
                  </div>
                </div>
              </div>
              <button type="button" class="glass-btn ${isConsentCardUnlocked ? 'btn-ghost' : 'btn-primary'}" onclick="openLegalConsentModal()" style="font-size:12px; padding:6px 14px; flex-shrink:0;">
                ${isConsentCardUnlocked ? 'Re-inspect' : 'Inspect Card →'}
              </button>
            </div>
          </div>

          <!-- Google Account Sign-In Button -->
          <button type="button" class="btn btn-ghost" onclick="handleGoogleSignInClick()" id="saasGoogleSignInBtn"
            ${(!isCheckboxChecked) ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''}
            style="width:100%; justify-content:center; gap:12px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.16); padding:13px; font-weight:600; border-radius:12px; transition:all 0.25s ease;">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.86c2.26-2.09 3.685-5.17 3.685-9.09z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.34 24 12 24z"/>
              <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/>
            </svg>
            <span>Sign In with Google Account</span>
          </button>

          <div style="display:flex; align-items:center; gap:12px; margin:16px 0;">
            <div style="flex:1; height:1px; background:var(--panel-border);"></div>
            <span style="font-size:11px; color:var(--text-2); font-family:var(--font-mono); letter-spacing:1px;">OR SIGN IN WITH EMAIL</span>
            <div style="flex:1; height:1px; background:var(--panel-border);"></div>
          </div>

          <!-- Standard Email/Password Form -->
          <form onsubmit="handleSaasLoginForm(event)" style="display:flex; flex-direction:column; gap:14px;">
            <div class="field">
              <label>Operator Email Address</label>
              <input type="email" id="loginEmail" required placeholder="analyst@floodai.org" autocomplete="username">
            </div>

            <div class="field">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <label style="margin:0;">Password</label>
                <button type="button" class="btn btn-sm btn-ghost" onclick="togglePasswordVisibility('loginPass', this)" style="font-size:11px; padding:2px 6px;">
                  Show 👁️
                </button>
              </div>
              <input type="password" id="loginPass" required placeholder="Enter your password" autocomplete="current-password" style="margin-top:6px;">
            </div>

            <!-- MANDATORY LEGAL CONSENT CHECKBOX -->
            <div style="margin:6px 0 12px; padding:12px 14px; border-radius:10px; background:rgba(255,255,255,0.03); border:1px solid ${isConsentCardUnlocked ? 'var(--glass-border)' : 'rgba(255,255,255,0.05)'};">
              <label class="glass-checkbox-wrap" style="align-items:flex-start;">
                <input type="checkbox" id="legalConsentCheckbox" 
                  ${!isConsentCardUnlocked ? 'disabled' : ''} 
                  ${isCheckboxChecked ? 'checked' : ''}
                  onchange="toggleLegalConsent(this.checked)">
                <span style="font-size:12.5px; line-height:1.5; color:${isConsentCardUnlocked ? 'var(--text-primary)' : 'var(--text-muted)'};">
                  I agree to the <a href="javascript:void(0)" onclick="goTo('terms')" style="color:var(--accent-primary); text-decoration:underline; font-weight:600;">Terms and Conditions</a> and acknowledge the <a href="javascript:void(0)" onclick="goTo('privacy')" style="color:var(--accent-primary); text-decoration:underline; font-weight:600;">Privacy Policy</a>.
                </span>
              </label>

              ${!isConsentCardUnlocked ? `
                <div style="font-size:11px; color:var(--amber); margin-top:6px; display:flex; align-items:center; gap:6px;">
                  <span>⚠️</span> Click 'Inspect Card' above to review legal documents and unlock this checkbox.
                </div>
              ` : (!isCheckboxChecked ? `
                <div style="font-size:11px; color:var(--text-muted); margin-top:6px;">
                  Check this box to enable the sign-in buttons.
                </div>
              ` : `
                <div style="font-size:11px; color:var(--ocean); margin-top:6px; font-weight:600;">
                  ✓ Consent verified. Authentication buttons enabled.
                </div>
              `)}
            </div>

            <!-- Submit Button (Disabled without checkbox) -->
            <button type="submit" class="glass-btn btn-primary" id="saasLoginSubmitBtn"
              ${(!isCheckboxChecked) ? 'disabled style="opacity:0.4; cursor:not-allowed; justify-content:center;"' : 'style="justify-content:center;"'}>
              Sign In to SaaS Workspace →
            </button>
          </form>

          <!-- Alternative Registration Switch & Public Link -->
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:20px; font-size:12.5px; color:var(--text-muted);">
            <div>
              New operator? <a href="javascript:void(0)" onclick="openAuthModal('register')" style="color:var(--accent-primary); font-weight:600;">Create Account</a>
            </div>
            <a href="javascript:void(0)" onclick="goTo('home')" style="color:var(--text-muted);">
              Return to Public Portal ↗
            </a>
          </div>

        </div>

      </div>

    </div>

    <!-- Legal Review Dialog Modal -->
    <div class="modal-overlay" id="legalConsentModal" onclick="if(event.target===this) closeLegalConsentModal()">
      <div class="glass-dialog border-lightning" style="max-width:680px; max-height:85vh; overflow-y:auto;">
        <button class="modal-close" onclick="closeLegalConsentModal()">✕</button>
        
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:14px;">
          <span style="font-size:28px;">📜</span>
          <div>
            <h3 style="font-family:var(--font-display); font-size:20px; font-weight:700;">
              FloodAI Platform Legal Terms &amp; Privacy Notice
            </h3>
            <div style="font-size:11.5px; color:var(--text-muted); font-family:var(--font-mono);">
              Civil Defense &amp; Machine Learning Inference Compliance
            </div>
          </div>
        </div>

        <div style="font-size:13px; color:var(--text-secondary); line-height:1.65; max-height:360px; overflow-y:auto; padding-right:8px; border:1px solid rgba(255,255,255,0.06); padding:16px; border-radius:12px; background:rgba(0,0,0,0.2); margin-bottom:20px;">
          <p><b>1. Machine Learning Hazard Disclaimer:</b> FloodAI prediction engines (XGBoost Gradient Boosting and Random Forest) generate predictive models based on live atmospheric sensor data and Digital Elevation Models. Outputs are probabilistic and intended to supplement official government disaster civil defense guidance.</p>
          <br>
          <p><b>2. Privacy &amp; Location Isolation:</b> Precise GPS triangulation coordinates are processed locally on the client and never commercialized. Location is used solely to calculate proximity flood danger margins and deliver localized warnings.</p>
          <br>
          <p><b>3. Multi-Channel Emergency Dispatch:</b> Authorized users agree that emergency warnings may be delivered via Firebase Web Push, transactional email, and SMS notifications when hazardous flood thresholds are triggered.</p>
          <br>
          <p><b>4. Enterprise Role Clearances:</b> Access to administrative controls and model explainability features requires verified role credentials (Admin or Analyst clearance).</p>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap;">
          <div style="display:flex; gap:10px;">
            <button class="glass-btn btn-ghost" onclick="closeLegalConsentModal(); goTo('terms');" style="font-size:12px;">
              Read Full Terms ↗
            </button>
            <button class="glass-btn btn-ghost" onclick="closeLegalConsentModal(); goTo('privacy');" style="font-size:12px;">
              Read Privacy Policy ↗
            </button>
          </div>
          <button class="glass-btn btn-primary" onclick="confirmLegalCardReviewed()" style="font-size:13px; padding:10px 22px;">
            I Have Reviewed • Unlock Consent Checkbox ✓
          </button>
        </div>
      </div>
    </div>
  `;
}

function openLegalConsentModal() {
  const modal = document.getElementById('legalConsentModal');
  if (modal) modal.classList.add('open');
}

function closeLegalConsentModal() {
  const modal = document.getElementById('legalConsentModal');
  if (modal) modal.classList.remove('open');
}

function confirmLegalCardReviewed() {
  state.consentModalViewed = true;
  closeLegalConsentModal();
  toast('Legal card reviewed. You may now check the consent checkbox.');
  renderLogin(document.getElementById('pageRoot'));
}

function toggleLegalConsent(checked) {
  state.consentAccepted = !!checked;
  const loginBtn = document.getElementById('saasLoginSubmitBtn');
  const googleBtn = document.getElementById('saasGoogleSignInBtn');

  if (loginBtn) {
    loginBtn.disabled = !checked;
    loginBtn.style.opacity = checked ? '1' : '0.4';
    loginBtn.style.cursor = checked ? 'pointer' : 'not-allowed';
  }
  if (googleBtn) {
    googleBtn.disabled = !checked;
    googleBtn.style.opacity = checked ? '1' : '0.4';
    googleBtn.style.cursor = checked ? 'pointer' : 'not-allowed';
  }
}

function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = 'Hide 👁️';
  } else {
    input.type = 'password';
    btn.textContent = 'Show 👁️';
  }
}

function handleGoogleSignInClick() {
  if (!state.consentAccepted) {
    toast('⚠️ Please accept the Terms and Conditions and Privacy Policy first.');
    return;
  }
  // Call the working Firebase Google Sign-In handler from authService.js
  initiateGoogleSignIn('login');
}

async function handleSaasLoginForm(e) {
  e.preventDefault();
  if (!state.consentAccepted) {
    toast('⚠️ Please accept the Terms and Conditions and Privacy Policy first.');
    return;
  }
  // Call the working handleLogin from authService.js
  handleLogin(e);
}
