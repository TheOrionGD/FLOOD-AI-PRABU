/**
 * onboardingView.js
 * Screens 02–08 — Seven-Screen Guided Onboarding Immersion
 * Features:
 *  - Exactly seven structured educational screens
 *  - 5-second automatic progression per screen (35s sequence)
 *  - Full touch & pointer gesture support (swiping left / right)
 *  - Visibility API support (pauses when browser tab is hidden)
 *  - Interactive dots, prev/next buttons, skip, and "Explore FloodAI" CTA
 *  - Cleans up active timers when unmounted
 */

let _onboardingIndex = 0;
let _onboardingTimer = null;
let _onboardingSecondsRemaining = 5;
let _onboardingInterval = null;
let _isDraggingOnboarding = false;
let _touchStartX = 0;
let _touchEndX = 0;

const ONBOARDING_SLIDES = [
  {
    step: 1,
    tag: 'WELCOME TO FLOODAI',
    title: 'Disaster Threat Intelligence at Planetary Scale',
    desc: 'FloodAI bridges artificial intelligence, continuous atmospheric telemetry, and cadastral topographic modeling to predict inundation risks before floodwaters rise.',
    icon: '🌊',
    visualTitle: 'Autonomous Threat Sentinel',
    visualMetric: '10,000 Verified Ground-Truth Records',
    visualDetail: 'Empirical disaster catalog trained on 24-year meteorological historical records across vulnerable districts.',
  },
  {
    step: 2,
    tag: 'DUAL ML ARCHITECTURE',
    title: 'Dual-Engine ML Flood Prediction',
    desc: 'Engineered with XGBoost Gradient Boosted Trees and Random Forest ensembles running on an isolated microservice, computing flood probabilities with millisecond inference.',
    icon: '⚡',
    visualTitle: 'Inference Precision & Recall',
    visualMetric: 'XGBoost 94.2% ROC-AUC | Random Forest 91.8%',
    visualDetail: 'Evaluating 13 critical hydrologic indicators including rainfall volume, elevation, soil saturation, and coastal proximity.',
  },
  {
    step: 3,
    tag: 'EXPLAINABLE AI',
    title: 'Understand Why: SHAP Feature Attribution',
    desc: 'No black boxes. Every model inference generates SHAP (Shapley Additive Explanations) force values that identify the exact environmental variables driving local hazard severity.',
    icon: '📊',
    visualTitle: 'Shapley Contribution Vectors',
    visualMetric: '+32.4% Rainfall Surge | -18.2% Elevation Buffer',
    visualDetail: 'Empowering civil defense operators and emergency response directors to justify tactical evacuation decisions with verified evidence.',
  },
  {
    step: 4,
    tag: 'GEOSPATIAL GIS',
    title: 'Location-Aware Cadastral Intelligence',
    desc: 'Precision GPS triangulation and OpenStreetMap geospatial boundaries pinpoint your exact vulnerability sector without transmitting sensitive private coordinates.',
    icon: '🗺️',
    visualTitle: 'Cadastral GIS Inundation Grids',
    visualMetric: '10 High-Density Monitored Sectors',
    visualDetail: 'Sub-meter elevation contours and digital drainage profiles for major metropolitan disaster districts.',
  },
  {
    step: 5,
    tag: 'ATMOSPHERIC TELEMETRY',
    title: 'Real-Time Dynamic Weather Context',
    desc: 'Live telemetry ingestion from OpenWeather API and Open-Meteo satellite streams dynamically updates precipitation rates, barometric pressure, and atmospheric physics in real time.',
    icon: '🛰️',
    visualTitle: 'Live Sensor Synchronizer',
    visualMetric: 'Sub-15min Live Telemetry Polling',
    visualDetail: 'Atmospheric particles in the application canvas simulate current real-world rainfall and cloud cover over your sector.',
  },
  {
    step: 6,
    tag: 'EARLY WARNING DISPATCH',
    title: 'Multi-Channel Alert Dispatches',
    desc: 'Automated threat notifications broadcast across Firebase Web Push notifications, Brevo transactional emails, and carrier SMS gateways to ensure alerts reach every resident.',
    icon: '🚨',
    visualTitle: 'Civil-Defense Alarm Matrix',
    visualMetric: '3 Redundant Notification Channels',
    visualDetail: 'Tiered dispatch rules dispatch advisories from Low informational alerts up to High emergency evacuation sirens.',
  },
  {
    step: 7,
    tag: 'OPERATIONAL WORKSPACES',
    title: 'Tailored SaaS Experience by Role',
    desc: 'Dedicated Liquid Glass workspaces designed specifically for municipal Administrators, hydrologic Analysts, and localized Residents with strict role-based access control.',
    icon: '🛡️',
    visualTitle: 'Enterprise Clearance Controls',
    visualMetric: 'Admin • Analyst • Resident Workspaces',
    visualDetail: 'Full cryptographic JWT verification and data isolation ensuring operational safety and data integrity.',
  },
];

function renderOnboarding(root) {
  clearOnboardingTimers();
  _onboardingIndex = 0;
  _renderCurrentOnboardingSlide(root);
  _startOnboardingTimer(root);
  _setupOnboardingVisibilityListener(root);
}

function _renderCurrentOnboardingSlide(root) {
  if (!root) root = document.getElementById('pageRoot');
  if (!root) return;

  const slide = ONBOARDING_SLIDES[_onboardingIndex];
  const isFinalSlide = _onboardingIndex === ONBOARDING_SLIDES.length - 1;
  const progressPct = ((_onboardingIndex + 1) / ONBOARDING_SLIDES.length) * 100;

  root.innerHTML = `
    <div class="layout-public onboarding-wrapper" id="onboardingContainer"
      ontouchstart="handleOnboardingTouchStart(event)"
      ontouchend="handleOnboardingTouchEnd(event)"
      onmousedown="handleOnboardingMouseDown(event)"
      onmouseup="handleOnboardingMouseUp(event)">
      
      <div class="onboarding-card border-lightning">
        
        <!-- Top Status Bar & Skip -->
        <div>
          <div class="onboarding-progress-bar-wrap">
            <div class="onboarding-progress-fill" style="width:${progressPct}%;"></div>
          </div>

          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:18px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="story-tag" style="margin-bottom:0;">${slide.tag}</span>
              <span style="font-family:var(--font-mono); font-size:11px; color:var(--text-muted);">
                Screen 0${slide.step} / 07
              </span>
            </div>
            <button class="glass-btn btn-ghost" onclick="skipOnboarding()" style="font-size:12px; padding:4px 10px; color:var(--text-muted);" title="Skip onboarding sequence">
              Skip Tour ✕
            </button>
          </div>
        </div>

        <!-- Main Slide Educational Content -->
        <div style="display:grid; grid-template-columns:1.2fr 1fr; gap:36px; align-items:center; margin:20px 0;">
          <div>
            <div style="font-size:48px; margin-bottom:14px; animation:bounce 2s infinite ease-in-out;">
              ${slide.icon}
            </div>
            <h2 style="font-family:var(--font-display); font-size:28px; font-weight:700; line-height:1.25; margin-bottom:14px;">
              ${slide.title}
            </h2>
            <p style="font-size:15px; color:var(--text-secondary); line-height:1.65;">
              ${slide.desc}
            </p>
          </div>

          <!-- Glass Educational Graphic Surface -->
          <div class="glass-card elevated border-lightning" style="padding:28px 24px; border-radius:var(--radius-lg); background:var(--glass-secondary);">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;">
              <span style="font-family:var(--font-mono); font-size:11px; text-transform:uppercase; letter-spacing:1px; color:var(--accent-primary);">
                ${slide.visualTitle}
              </span>
              <span style="width:8px; height:8px; border-radius:50%; background:var(--ocean); box-shadow:0 0 8px var(--ocean);"></span>
            </div>
            
            <div style="font-family:var(--font-display); font-size:20px; font-weight:700; color:var(--text-primary); margin-bottom:10px;">
              ${slide.visualMetric}
            </div>
            
            <div style="font-size:13px; color:var(--text-secondary); line-height:1.55; margin-bottom:18px;">
              ${slide.visualDetail}
            </div>

            <!-- Auto-Advance Indicator -->
            <div style="display:flex; align-items:center; justify-content:space-between; font-size:11px; color:var(--text-muted); font-family:var(--font-mono); border-top:1px solid rgba(255,255,255,0.06); padding-top:12px;">
              <span>Auto-advance: <span id="onboardingCountdown" style="color:var(--accent-primary); font-weight:700;">${_onboardingSecondsRemaining}s</span></span>
              <span>Swipe ⇄ to navigate</span>
            </div>
          </div>
        </div>

        <!-- Bottom Controls & 7-Step Dots -->
        <div style="display:flex; align-items:center; justify-content:space-between; border-top:1px solid rgba(255,255,255,0.06); padding-top:24px; margin-top:16px;">
          
          <button class="glass-btn btn-ghost" onclick="prevOnboardingSlide()" ${_onboardingIndex === 0 ? 'disabled style="opacity:0.3; cursor:not-allowed;"' : ''} style="gap:6px;">
            ← Previous
          </button>

          <!-- 7-Step Dots -->
          <div class="onboarding-dots">
            ${ONBOARDING_SLIDES.map((s, idx) => `
              <div class="onboarding-dot ${idx === _onboardingIndex ? 'active' : ''}" onclick="jumpToOnboardingSlide(${idx})" title="Slide ${idx + 1}: ${s.title}"></div>
            `).join('')}
          </div>

          ${isFinalSlide ? `
            <button class="glass-btn btn-primary" onclick="completeOnboarding()" style="gap:8px; padding:10px 24px; box-shadow:0 0 20px var(--accent-glow);">
              <span>Explore FloodAI</span> →
            </button>
          ` : `
            <button class="glass-btn btn-secondary" onclick="nextOnboardingSlide()" style="gap:6px;">
              <span>Next</span> →
            </button>
          `}
        </div>

      </div>
    </div>
  `;
}

function _startOnboardingTimer(root) {
  clearOnboardingTimers();
  _onboardingSecondsRemaining = 5;

  _onboardingInterval = setInterval(() => {
    _onboardingSecondsRemaining -= 1;
    const el = document.getElementById('onboardingCountdown');
    if (el) el.textContent = `${_onboardingSecondsRemaining}s`;

    if (_onboardingSecondsRemaining <= 0) {
      if (_onboardingIndex < ONBOARDING_SLIDES.length - 1) {
        _onboardingIndex += 1;
        _renderCurrentOnboardingSlide(root);
        _startOnboardingTimer(root);
      } else {
        completeOnboarding();
      }
    }
  }, 1000);
}

function clearOnboardingTimers() {
  if (_onboardingInterval) {
    clearInterval(_onboardingInterval);
    _onboardingInterval = null;
  }
  if (_onboardingTimer) {
    clearTimeout(_onboardingTimer);
    _onboardingTimer = null;
  }
}

function nextOnboardingSlide() {
  if (_onboardingIndex < ONBOARDING_SLIDES.length - 1) {
    _onboardingIndex += 1;
    _renderCurrentOnboardingSlide();
    _startOnboardingTimer();
  } else {
    completeOnboarding();
  }
}

function prevOnboardingSlide() {
  if (_onboardingIndex > 0) {
    _onboardingIndex -= 1;
    _renderCurrentOnboardingSlide();
    _startOnboardingTimer();
  }
}

function jumpToOnboardingSlide(idx) {
  if (idx >= 0 && idx < ONBOARDING_SLIDES.length) {
    _onboardingIndex = idx;
    _renderCurrentOnboardingSlide();
    _startOnboardingTimer();
  }
}

function skipOnboarding() {
  completeOnboarding();
}

function completeOnboarding() {
  clearOnboardingTimers();
  state.onboardingCompleted = true;
  localStorage.setItem('floodai-onboarding-completed', 'true');
  toast('Welcome to FloodAI Platform');
  goTo('landing');
}

/* Gesture & Swiping Detection */
function handleOnboardingTouchStart(e) {
  if (e.touches && e.touches[0]) {
    _touchStartX = e.touches[0].clientX;
  }
}

function handleOnboardingTouchEnd(e) {
  if (e.changedTouches && e.changedTouches[0]) {
    _touchEndX = e.changedTouches[0].clientX;
    _handleSwipeGesture();
  }
}

function handleOnboardingMouseDown(e) {
  _isDraggingOnboarding = true;
  _touchStartX = e.clientX;
}

function handleOnboardingMouseUp(e) {
  if (_isDraggingOnboarding) {
    _isDraggingOnboarding = false;
    _touchEndX = e.clientX;
    _handleSwipeGesture();
  }
}

function _handleSwipeGesture() {
  const diff = _touchStartX - _touchEndX;
  const threshold = 50; // min 50px drag to count as swipe

  if (diff > threshold) {
    // Swiped left -> advance next
    nextOnboardingSlide();
  } else if (diff < -threshold) {
    // Swiped right -> go prev
    prevOnboardingSlide();
  }
}

/* Visibility API Listener (Pauses timer when tab is hidden) */
function _setupOnboardingVisibilityListener(root) {
  document.addEventListener('visibilitychange', () => {
    if (state.page !== 'onboarding') {
      clearOnboardingTimers();
      return;
    }
    if (document.hidden) {
      clearOnboardingTimers();
    } else {
      _startOnboardingTimer(root);
    }
  });
}
