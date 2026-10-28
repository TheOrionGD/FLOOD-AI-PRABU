/**
 * legalView.js
 * Dedicated Terms & Conditions and Privacy Policy Views
 * Integrated with the legal consent verification flow.
 */

function renderTerms(root) {
  root.innerHTML = `
    <div class="layout-public" style="padding:40px 24px; max-width:960px; margin:0 auto;">
      <div style="margin-bottom:24px;">
        <button class="glass-btn btn-ghost" onclick="window.history.length > 1 ? window.history.back() : goTo('home')">
          ← Back
        </button>
      </div>

      <div class="glass-card elevated" style="padding:48px 40px; border-radius:var(--radius-xl);">
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
          <span style="font-size:28px;">📄</span>
          <span class="story-tag" style="margin-bottom:0;">LEGAL AGREEMENT</span>
        </div>
        
        <h1 style="font-family:var(--font-display); font-size:32px; font-weight:700; margin-bottom:8px;">
          Terms and Conditions
        </h1>
        <div style="font-size:12.5px; color:var(--text-muted); font-family:var(--font-mono); margin-bottom:28px;">
          Effective Date: October 2026 • Platform Version 2.6.0
        </div>

        <div style="font-size:14px; color:var(--text-secondary); line-height:1.75; display:flex; flex-direction:column; gap:22px;">
          <section>
            <h3 style="color:var(--text-primary); font-size:17px; margin-bottom:8px;">1. Operational Nature of Threat Intelligence</h3>
            <p>
              FloodAI is an artificial intelligence-driven disaster threat intelligence, hydrologic simulation, and early warning platform. The system generates predictive risk indices based on mathematical models (including XGBoost and Random Forest ensembles), atmospheric sensor telemetry, and Digital Elevation Models. While FloodAI strives for maximum scientific accuracy, machine learning outputs represent probabilistic hazard assessments and must be evaluated alongside official directives issued by government civil defense authorities, national disaster response forces, and state meteorological departments.
            </p>
          </section>

          <section>
            <h3 style="color:var(--text-primary); font-size:17px; margin-bottom:8px;">2. Authorized User Roles &amp; Operational Clearance</h3>
            <p>
              Access to FloodAI is governed by Role-Based Access Control (RBAC). Users registered under the <b>Resident</b> role receive localized proximity alerts, flood-risk assessments, and preparedness guidance. Users with <b>Analyst</b> clearance are authorized to perform dual-model parameter simulations, examine SHAP explainability matrices, and evaluate tactical threat models. Users with <b>Administrator</b> clearance possess platform-wide supervisory authority including user management, alert broadcasts, and operational configuration. Users agree never to attempt unauthorized role elevation or tamper with cryptographic authentication tokens.
            </p>
          </section>

          <section>
            <h3 style="color:var(--text-primary); font-size:17px; margin-bottom:8px;">3. Emergency Siren &amp; Broadcast Dispatch</h3>
            <p>
              The platform provides multi-channel emergency dispatches via Firebase Web Push, Brevo email, and telecom SMS gateways. Emergency SOS broadcasts and Siren operations triggered through Threat Command represent emergency actions intended for high-severity hazards. Abuse or falsification of emergency broadcasts is strictly prohibited and subject to immediate account revocation and applicable statutory penalties.
            </p>
          </section>

          <section>
            <h3 style="color:var(--text-primary); font-size:17px; margin-bottom:8px;">4. Limitation of Liability</h3>
            <p>
              Under no circumstances shall the FloodAI maintainers, data providers, or disaster intelligence partners be liable for indirect, incidental, or consequential damages resulting from telecommunication delays, power interruptions, extreme environmental sensor failure, or decisions made on the basis of model inference.
            </p>
          </section>

          <section>
            <h3 style="color:var(--text-primary); font-size:17px; margin-bottom:8px;">5. Amendments &amp; Continued Consent</h3>
            <p>
              We reserve the right to refine these Terms to maintain compliance with disaster response regulations and data protection standards. Continued use of the platform after updates signifies acceptance of the revised Terms.
            </p>
          </section>
        </div>

        <div style="margin-top:36px; padding-top:24px; border-top:1px solid rgba(255,255,255,0.06); display:flex; justify-content:space-between; align-items:center;">
          <button class="glass-btn btn-primary" onclick="markLegalViewedAndReturn()">
            Acknowledge &amp; Return to Sign In →
          </button>
          <button class="glass-btn btn-ghost" onclick="goTo('privacy')">
            Read Privacy Policy →
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderPrivacy(root) {
  root.innerHTML = `
    <div class="layout-public" style="padding:40px 24px; max-width:960px; margin:0 auto;">
      <div style="margin-bottom:24px;">
        <button class="glass-btn btn-ghost" onclick="window.history.length > 1 ? window.history.back() : goTo('home')">
          ← Back
        </button>
      </div>

      <div class="glass-card elevated" style="padding:48px 40px; border-radius:var(--radius-xl);">
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
          <span style="font-size:28px;">🔒</span>
          <span class="story-tag" style="margin-bottom:0;">DATA PROTECTION</span>
        </div>
        
        <h1 style="font-family:var(--font-display); font-size:32px; font-weight:700; margin-bottom:8px;">
          Privacy Policy
        </h1>
        <div style="font-size:12.5px; color:var(--text-muted); font-family:var(--font-mono); margin-bottom:28px;">
          Effective Date: October 2026 • Platform Version 2.6.0
        </div>

        <div style="font-size:14px; color:var(--text-secondary); line-height:1.75; display:flex; flex-direction:column; gap:22px;">
          <section>
            <h3 style="color:var(--text-primary); font-size:17px; margin-bottom:8px;">1. Information We Process</h3>
            <p>
              FloodAI processes only the minimum data required to deliver reliable flood hazard warnings and model inference:
            </p>
            <ul style="margin-left:20px; margin-top:8px; display:flex; flex-direction:column; gap:6px;">
              <li><b>Identity Data:</b> Display name, email address, and optional phone number (for verified SMS alerts).</li>
              <li><b>Authentication Credentials:</b> Cryptographically hashed passwords (via bcrypt) or verified Firebase Google account UIDs.</li>
              <li><b>Geographic Telemetry:</b> Client-side GPS coordinates (only when explicitly permitted by user) or manually selected disaster sectors (e.g., Chennai, Mumbai).</li>
              <li><b>Notification Tokens:</b> Firebase Cloud Messaging (FCM) web push subscription tokens for emergency advisory dispatch.</li>
            </ul>
          </section>

          <section>
            <h3 style="color:var(--text-primary); font-size:17px; margin-bottom:8px;">2. Privacy-Preserving Location Handling</h3>
            <p>
              Your precise geographic coordinates are never shared with advertising networks or third-party commercial aggregators. Coordinates are used strictly to calculate proximity danger margins relative to monitored river basins, elevation contours, and weather radar stations. Users may switch to manual sector selection at any time in Profile or Settings.
            </p>
          </section>

          <section>
            <h3 style="color:var(--text-primary); font-size:17px; margin-bottom:8px;">3. Cryptographic Data Isolation &amp; Storage</h3>
            <p>
              All platform data is stored within encrypted MongoDB Atlas database clusters utilizing TLS 1.3 in transit and AES-256 at rest. Authentication sessions utilize tamper-proof HMAC-SHA256 signed JSON Web Tokens with strict expiration lifecycles.
            </p>
          </section>

          <section>
            <h3 style="color:var(--text-primary); font-size:17px; margin-bottom:8px;">4. User Rights &amp; Preference Control</h3>
            <p>
              Users retain full autonomy over their emergency alert subscriptions. Delivery channels (Web Push, Email, SMS) and alert radius thresholds can be modified or disabled at any time through the Settings dashboard.
            </p>
          </section>
        </div>

        <div style="margin-top:36px; padding-top:24px; border-top:1px solid rgba(255,255,255,0.06); display:flex; justify-content:space-between; align-items:center;">
          <button class="glass-btn btn-primary" onclick="markLegalViewedAndReturn()">
            Acknowledge &amp; Return to Sign In →
          </button>
          <button class="glass-btn btn-ghost" onclick="goTo('terms')">
            Read Terms &amp; Conditions →
          </button>
        </div>
      </div>
    </div>
  `;
}

function markLegalViewedAndReturn() {
  state.consentModalViewed = true;
  // If user was on login, return to login with legal card unlocked
  goTo('login');
}
