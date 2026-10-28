/**
 * FLOODAI — Dynamic Climate Atmosphere & Location-Aware Weather Particle Engine
 * High-performance, multi-layered HTML5 Canvas atmospheric rendering system.
 * Features:
 *  - 10 Climate Profiles: Clear/Sunny, Clouds/Overcast, Rain, Drizzle, Thunderstorm,
 *    Snow, Sleet, Fog/Mist/Haze, High Wind, Extreme Heat.
 *  - Solar Phase Lighting: Night, Sunrise, Sunset, Day integration.
 *  - Object pooling to eliminate garbage collection stutters.
 *  - Frame-rate independent delta-time physics.
 *  - 3-tier depth layering (Background, Midground, Foreground).
 *  - Smooth parameter transitions & crossfades without scene reloads.
 *  - Page Visibility API lifecycle pause/resume.
 *  - Full accessibility with prefers-reduced-motion support.
 */

class ClimateParticleEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.width = 0;
    this.height = 0;
    this.dpr = 1;

    // Active Climate State
    this.climateState = null;
    this.currentCondition = 'neutral'; // 'clear' | 'clouds' | 'drizzle' | 'rain' | 'thunderstorm' | 'snow' | 'fog' | 'mist' | 'haze' | 'wind' | 'heat' | 'neutral'
    this.solarPhase = 'day'; // 'day' | 'night' | 'sunrise' | 'sunset'

    // Particle Object Pools
    this.MAX_PARTICLES = 300;
    this.particlePool = [];
    this.activeParticles = [];

    this.MAX_SPLASHES = 35;
    this.splashPool = [];
    this.activeSplashes = [];

    // Wind and Physics state
    this.windVector = { x: -1.5, y: 0, speed: 2.5, angleRad: Math.PI };
    this.targetWindVector = { x: -1.5, y: 0, speed: 2.5, angleRad: Math.PI };

    // Environmental lighting & transition state
    this.transition = {
      progress: 1.0,
      durationMs: 2500,
      startTime: 0,
      fromCondition: 'neutral',
      toCondition: 'neutral',
      fromSolar: 'day',
      toSolar: 'day'
    };

    // Thunderstorm lightning state
    this.lightning = {
      active: false,
      flashIntensity: 0,
      lastStrikeTime: 0,
      nextStrikeDelay: 12000, // ms
      duration: 120, // ms
      startTime: 0
    };

    // User Configuration & Performance Settings
    this.settings = {
      density: localStorage.getItem('floodai-particle-density') || 'balanced', // 'off' | 'low' | 'balanced' | 'high'
      isReducedMotion: false,
      allowLightning: true,
      manualOverrideCondition: null // null for auto-detect or 'rain'/'sunny'/etc.
    };

    this.animId = null;
    this.lastTime = 0;
    this.isPaused = false;
    this.initialized = false;
  }

  /* ================= 1. INITIALIZATION & LIFECYCLE ================= */
  init() {
    if (this.initialized || typeof document === 'undefined') return;

    // Detect OS reduced motion preference
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.settings.isReducedMotion = true;
    }

    // Get or create canvas element
    this.canvas = document.getElementById('climateParticleCanvas');
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'climateParticleCanvas';
      this.canvas.style.position = 'fixed';
      this.canvas.style.top = '0';
      this.canvas.style.left = '0';
      this.canvas.style.width = '100vw';
      this.canvas.style.height = '100vh';
      this.canvas.style.pointerEvents = 'none';
      this.canvas.style.zIndex = '0';
      this.canvas.style.opacity = '1';
      document.body.prepend(this.canvas);
    }

    this.ctx = this.canvas.getContext('2d', { alpha: true });
    this.buildObjectPools();
    this.resize();

    window.addEventListener('resize', () => this.resize(), { passive: true });

    // Page Visibility API lifecycle handling
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    });

    // Theme (light/dark) and Accent change observer
    if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined' && document.documentElement) {
      this.themeObserver = new MutationObserver(() => {
        this.updateUIBadge();
      });
      this.themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class', 'data-accent']
      });
    }

    this.initialized = true;
    this.lastTime = performance.now();
    this.animate = this.animate.bind(this);
    this.animId = requestAnimationFrame(this.animate);
  }

  isLightTheme() {
    if (typeof document !== 'undefined' && document.documentElement) {
      return document.documentElement.classList.contains('light');
    }
    if (typeof state !== 'undefined' && state.theme) {
      return state.theme === 'light';
    }
    try {
      if (typeof localStorage !== 'undefined' && localStorage.getItem('floodai-theme')) {
        return localStorage.getItem('floodai-theme') === 'light';
      }
    } catch (_) {}
    return false;
  }

  getAccentColor() {
    let accent = 'ocean';
    if (typeof document !== 'undefined' && document.documentElement) {
      accent = document.documentElement.getAttribute('data-accent') || accent;
    }
    if (typeof state !== 'undefined' && state.accent) {
      accent = state.accent;
    }
    try {
      if (typeof localStorage !== 'undefined' && localStorage.getItem('floodai-accent')) {
        accent = localStorage.getItem('floodai-accent');
      }
    } catch (_) {}

    const accentMap = {
      ocean: { primary: '#0284c7', secondary: '#0d9488', glow: 'rgba(2, 132, 199, 0.35)', hue: 199 },
      electric: { primary: '#2563eb', secondary: '#4f46e5', glow: 'rgba(37, 99, 235, 0.35)', hue: 220 },
      emerald: { primary: '#059669', secondary: '#0d9488', glow: 'rgba(5, 150, 105, 0.35)', hue: 160 },
      violet: { primary: '#7c3aed', secondary: '#9333ea', glow: 'rgba(124, 58, 237, 0.35)', hue: 262 },
      amber: { primary: '#d97706', secondary: '#ea580c', glow: 'rgba(217, 119, 6, 0.35)', hue: 38 },
      coral: { primary: '#ea580c', secondary: '#e11d48', glow: 'rgba(234, 88, 12, 0.35)', hue: 20 },
      rose: { primary: '#e11d48', secondary: '#be123c', glow: 'rgba(225, 29, 72, 0.35)', hue: 345 }
    };
    return accentMap[accent] || accentMap.ocean;
  }

  buildObjectPools() {
    this.particlePool = [];
    this.activeParticles = [];
    for (let i = 0; i < this.MAX_PARTICLES; i++) {
      this.particlePool.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        len: 0,
        radius: 0,
        opacity: 0,
        targetOpacity: 0,
        depth: 0.5, // 0.2 to 1.0
        seed: Math.random() * Math.PI * 2,
        rotation: 0,
        vRot: 0,
        hue: 200,
        type: 'mote', // 'mote' | 'rain' | 'drizzle' | 'snow' | 'sleet' | 'fog' | 'dust' | 'heat'
        size: 2
      });
    }

    this.splashPool = [];
    this.activeSplashes = [];
    for (let i = 0; i < this.MAX_SPLASHES; i++) {
      this.splashPool.push({
        active: false,
        x: 0,
        y: 0,
        rx: 0,
        ry: 0,
        maxR: 8,
        opacity: 0,
        color: 'rgba(51, 199, 255, 0.6)'
      });
    }
  }

  resize() {
    if (!this.canvas) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);

    if (this.ctx) {
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.scale(this.dpr, this.dpr);
    }
    this.reconfigureActiveParticles();
  }

  pause() {
    this.isPaused = true;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.lastTime = performance.now();
    if (!this.animId) {
      this.animId = requestAnimationFrame(this.animate);
    }
  }

  /* ================= 2. CLIMATE STATE INTEGRATION & TRANSITIONS ================= */

  /**
   * Updates climate state from normalized ClimateStateResolver model.
   * Interpolates parameters over transition duration.
   */
  updateClimateState(normalizedClimate, immediate = false) {
    if (!normalizedClimate) return;
    this.climateState = normalizedClimate;

    const targetCondition = this.settings.manualOverrideCondition || normalizedClimate.condition || 'neutral';
    const targetSolar = normalizedClimate.solarPhase || 'day';

    // Calculate wind vector from windSpeed and windDirection
    const speed = normalizedClimate.windSpeed || 2.5;
    const angleRad = normalizedClimate.windAngleRad || Math.PI;
    // Map meteorological wind (direction wind is blowing from) to drift velocity
    const vx = -Math.sin(angleRad) * (speed * 0.45);
    const vy = Math.cos(angleRad) * (speed * 0.08);

    this.targetWindVector = { x: vx, y: vy, speed, angleRad };

    if (immediate || this.currentCondition === targetCondition) {
      this.currentCondition = targetCondition;
      this.solarPhase = targetSolar;
      this.windVector = { ...this.targetWindVector };
      this.transition.progress = 1.0;
      this.reconfigureActiveParticles();
    } else {
      // Start smooth transition crossfade
      this.transition = {
        progress: 0.0,
        durationMs: 2200,
        startTime: performance.now(),
        fromCondition: this.currentCondition,
        toCondition: targetCondition,
        fromSolar: this.solarPhase,
        toSolar: targetSolar
      };
      this.reconfigureActiveParticles();
    }

    this.updateUIBadge();
  }

  /**
   * Set user manual override condition (or null to revert to live weather)
   */
  setManualOverride(cond) {
    this.settings.manualOverrideCondition = cond;
    if (this.climateState) {
      this.updateClimateState(this.climateState, false);
    } else {
      this.currentCondition = cond || 'neutral';
      this.reconfigureActiveParticles();
      this.updateUIBadge();
    }
  }

  setDensity(density) {
    if (!['off', 'low', 'balanced', 'high'].includes(density)) return;
    this.settings.density = density;
    localStorage.setItem('floodai-particle-density', density);
    this.reconfigureActiveParticles();
  }

  setReducedMotion(enabled) {
    this.settings.isReducedMotion = Boolean(enabled);
    this.reconfigureActiveParticles();
  }

  /* ================= 3. PARTICLE CONFIGURATION & SPAWNING ================= */

  getDensityMultiplier() {
    if (this.settings.density === 'off') return 0;
    if (this.settings.density === 'low') return 0.4;
    if (this.settings.density === 'high') return 1.35;
    return 0.85; // 'balanced'
  }

  reconfigureActiveParticles() {
    // Return all particles to pool
    this.activeParticles = [];
    this.activeSplashes = [];

    const mult = this.getDensityMultiplier();
    if (mult === 0 || this.settings.isReducedMotion) {
      if (this.settings.isReducedMotion) {
        // Reduced motion: spawn minimal gentle static motes
        this.spawnParticles('mote', Math.floor(12 * mult), { isStatic: true });
      }
      return;
    }

    const cond = this.currentCondition;
    const solar = this.solarPhase;

    if (cond === 'rain') {
      const count = Math.min(Math.floor((this.width / 14) * mult), 140);
      this.spawnParticles('rain', count);
    } else if (cond === 'drizzle') {
      const count = Math.min(Math.floor((this.width / 18) * mult), 90);
      this.spawnParticles('drizzle', count);
    } else if (cond === 'thunderstorm') {
      const count = Math.min(Math.floor((this.width / 11) * mult), 175);
      this.spawnParticles('rain', count, { isHeavy: true });
    } else if (cond === 'snow') {
      const count = Math.min(Math.floor((this.width / 18) * mult), 110);
      this.spawnParticles(this.climateState?.isSleet ? 'sleet' : 'snow', count);
    } else if (cond === 'fog' || cond === 'mist' || cond === 'haze') {
      const count = Math.min(Math.floor((this.width / 45) * mult), 32);
      this.spawnParticles('fog', count);
    } else if (cond === 'wind') {
      const count = Math.min(Math.floor((this.width / 22) * mult), 75);
      this.spawnParticles('dust', count);
    } else if (cond === 'heat') {
      const count = Math.min(Math.floor((this.width / 24) * mult), 60);
      this.spawnParticles('heat', count);
    } else if (cond === 'clouds') {
      const count = Math.min(Math.floor((this.width / 50) * mult), 28);
      this.spawnParticles('fog', count, { isCloud: true });
    } else {
      // Clear sky or Neutral ambient
      const count = Math.min(Math.floor((this.width / 22) * mult), 65);
      this.spawnParticles('mote', count);
    }
  }

  spawnParticles(type, count, options = {}) {
    for (let i = 0; i < count; i++) {
      const p = this.particlePool[i];
      if (!p) break;

      p.active = true;
      p.type = type;
      p.depth = 0.2 + Math.random() * 0.8; // Depth layering
      p.x = Math.random() * (this.width + 160) - 80;
      p.y = Math.random() * this.height;
      p.seed = Math.random() * Math.PI * 2;
      p.rotation = Math.random() * Math.PI * 2;
      p.vRot = (Math.random() - 0.5) * 0.04;

      if (type === 'rain') {
        const speedBase = options.isHeavy ? 14 : 9;
        p.len = (14 + Math.random() * 18) * p.depth;
        p.vy = (speedBase + Math.random() * 8) * (0.8 + p.depth * 0.4);
        p.vx = this.windVector.x * (1.2 + p.depth * 0.6);
        p.size = (1.0 + Math.random() * 1.4) * p.depth;
        p.opacity = (0.25 + Math.random() * 0.45) * p.depth;
      } else if (type === 'drizzle') {
        p.len = (6 + Math.random() * 10) * p.depth;
        p.vy = (5 + Math.random() * 4) * (0.8 + p.depth * 0.4);
        p.vx = this.windVector.x * 0.8;
        p.size = (0.7 + Math.random() * 0.8) * p.depth;
        p.opacity = (0.2 + Math.random() * 0.35) * p.depth;
      } else if (type === 'snow') {
        p.radius = (1.5 + Math.random() * 3.5) * p.depth;
        p.vy = (1.0 + Math.random() * 1.8) * (0.6 + p.depth * 0.4);
        p.vx = (Math.random() - 0.5) * 0.8 + this.windVector.x * 0.4;
        p.opacity = (0.3 + Math.random() * 0.5) * p.depth;
      } else if (type === 'sleet') {
        p.radius = (1.0 + Math.random() * 1.8) * p.depth;
        p.vy = (7.0 + Math.random() * 5.0) * p.depth;
        p.vx = this.windVector.x * 0.8;
        p.opacity = (0.3 + Math.random() * 0.4) * p.depth;
      } else if (type === 'fog') {
        p.radius = (90 + Math.random() * 140) * (0.6 + p.depth * 0.6);
        p.vx = (0.15 + Math.random() * 0.35) + this.windVector.x * 0.15;
        p.vy = (Math.random() - 0.5) * 0.08;
        p.opacity = options.isCloud ? (0.03 + Math.random() * 0.06) : (0.04 + Math.random() * 0.08);
      } else if (type === 'dust') {
        p.radius = (1.2 + Math.random() * 2.5) * p.depth;
        p.vx = this.windVector.x * (1.5 + Math.random() * 0.8);
        p.vy = (Math.random() - 0.5) * 0.6;
        p.opacity = (0.2 + Math.random() * 0.4) * p.depth;
      } else if (type === 'heat') {
        p.radius = (1.0 + Math.random() * 2.2) * p.depth;
        p.vy = (-0.6 - Math.random() * 0.8) * p.depth;
        p.vx = (Math.random() - 0.5) * 0.3;
        p.opacity = (0.15 + Math.random() * 0.35) * p.depth;
        p.hue = 30 + Math.random() * 18;
      } else {
        // Mote / Floating sunlight or stellar dust
        p.radius = (1.4 + Math.random() * 3.2) * p.depth;
        p.vy = options.isStatic ? 0 : (-0.25 - Math.random() * 0.5) * p.depth;
        p.vx = (Math.random() - 0.5) * 0.3;
        p.opacity = (0.2 + Math.random() * 0.5) * p.depth;
        p.hue = this.solarPhase === 'night' ? (200 + Math.random() * 30) : (42 + Math.random() * 12);
      }

      this.activeParticles.push(p);
    }
  }

  /* ================= 4. MAIN ANIMATION & RENDERING LOOP ================= */

  animate(now) {
    this.animId = requestAnimationFrame(this.animate);
    if (!this.ctx || this.isPaused) return;

    // Delta-time calculation capped at 0.1s to avoid physics explosions during tab freezes
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;
    const timeFactor = dt * 60; // normalized to 60fps

    // Update smooth transition progress
    if (this.transition.progress < 1.0) {
      const elapsed = now - this.transition.startTime;
      this.transition.progress = Math.min(1.0, elapsed / this.transition.durationMs);
      if (this.transition.progress >= 1.0) {
        this.currentCondition = this.transition.toCondition;
        this.solarPhase = this.transition.toSolar;
      }
    }

    // Smoothly interpolate wind vector
    this.windVector.x += (this.targetWindVector.x - this.windVector.x) * 0.05 * timeFactor;
    this.windVector.y += (this.targetWindVector.y - this.windVector.y) * 0.05 * timeFactor;

    // Clear Canvas
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Render Atmospheric Background Lighting & Volumetric Wash
    this.renderAtmosphericLighting(now);

    // Update and Render Particles
    this.updateAndRenderParticles(now, timeFactor);

    // Render Surface Splash Ripples
    this.updateAndRenderSplashes(timeFactor);

    // Update Lightning in Thunderstorm
    if (this.currentCondition === 'thunderstorm' && !this.settings.isReducedMotion && this.settings.allowLightning) {
      this.updateAndRenderLightning(now);
    }
  }

  /* ================= 5. ATMOSPHERIC LIGHTING & VOLUMETRIC WASH ================= */

  renderAtmosphericLighting(now) {
    const ctx = this.ctx;
    const cond = this.currentCondition;
    const solar = this.solarPhase;
    const isLight = this.isLightTheme();

    // Base volumetric wash according to solar phase and weather profile
    if (solar === 'night') {
      const grad = ctx.createLinearGradient(0, 0, 0, this.height);
      if (isLight) {
        // Subtle cool twilight indigo wash on light theme
        grad.addColorStop(0, 'rgba(15, 23, 42, 0.12)');
        grad.addColorStop(1, 'rgba(30, 41, 59, 0.22)');
      } else {
        // Subtle cool midnight indigo wash on dark theme
        grad.addColorStop(0, 'rgba(10, 16, 32, 0.22)');
        grad.addColorStop(1, 'rgba(5, 10, 20, 0.38)');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.width, this.height);
    } else if (solar === 'sunrise') {
      const grad = ctx.createRadialGradient(this.width * 0.2, this.height * 0.9, 10, this.width * 0.2, this.height * 0.9, this.height * 0.9);
      if (isLight) {
        // Warm rose & dawn amber glow with clear distinction on light surfaces
        grad.addColorStop(0, 'rgba(244, 63, 94, 0.12)');
        grad.addColorStop(0.5, 'rgba(249, 115, 22, 0.07)');
        grad.addColorStop(1, 'transparent');
      } else {
        grad.addColorStop(0, 'rgba(255, 140, 60, 0.09)');
        grad.addColorStop(0.5, 'rgba(255, 90, 100, 0.04)');
        grad.addColorStop(1, 'transparent');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.width, this.height);
    } else if (solar === 'sunset') {
      const grad = ctx.createRadialGradient(this.width * 0.8, this.height * 0.9, 10, this.width * 0.8, this.height * 0.9, this.height * 0.9);
      if (isLight) {
        // Warm golden-orange & crimson sunset wash
        grad.addColorStop(0, 'rgba(234, 88, 12, 0.13)');
        grad.addColorStop(0.6, 'rgba(219, 39, 119, 0.06)');
        grad.addColorStop(1, 'transparent');
      } else {
        grad.addColorStop(0, 'rgba(255, 130, 40, 0.11)');
        grad.addColorStop(0.6, 'rgba(230, 60, 80, 0.04)');
        grad.addColorStop(1, 'transparent');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.width, this.height);
    } else if (cond === 'clear') {
      // Sunny Radiance: Dynamic sunray wash from top-right
      const sunGrad = ctx.createRadialGradient(this.width * 0.85, 0, 20, this.width * 0.85, 0, this.height * 0.75);
      if (isLight) {
        sunGrad.addColorStop(0, 'rgba(245, 158, 11, 0.10)');
        sunGrad.addColorStop(0.4, 'rgba(251, 191, 36, 0.04)');
        sunGrad.addColorStop(1, 'transparent');
      } else {
        sunGrad.addColorStop(0, 'rgba(255, 215, 90, 0.08)');
        sunGrad.addColorStop(0.4, 'rgba(255, 185, 70, 0.03)');
        sunGrad.addColorStop(1, 'transparent');
      }
      ctx.fillStyle = sunGrad;
      ctx.fillRect(0, 0, this.width, this.height);
    } else if (cond === 'heat') {
      // Warm Amber convection wash
      const heatGrad = ctx.createLinearGradient(0, 0, 0, this.height);
      if (isLight) {
        heatGrad.addColorStop(0, 'rgba(234, 88, 12, 0.06)');
        heatGrad.addColorStop(1, 'rgba(220, 38, 38, 0.10)');
      } else {
        heatGrad.addColorStop(0, 'rgba(255, 120, 40, 0.03)');
        heatGrad.addColorStop(1, 'rgba(255, 90, 30, 0.08)');
      }
      ctx.fillStyle = heatGrad;
      ctx.fillRect(0, 0, this.width, this.height);
    } else if (cond === 'fog' || cond === 'mist' || cond === 'haze') {
      // Soft diffused mist veil
      const fogGrad = ctx.createLinearGradient(0, 0, 0, this.height);
      if (isLight) {
        fogGrad.addColorStop(0, 'rgba(148, 163, 184, 0.12)');
        fogGrad.addColorStop(1, 'rgba(100, 116, 139, 0.16)');
      } else {
        fogGrad.addColorStop(0, 'rgba(180, 205, 225, 0.05)');
        fogGrad.addColorStop(1, 'rgba(160, 190, 215, 0.09)');
      }
      ctx.fillStyle = fogGrad;
      ctx.fillRect(0, 0, this.width, this.height);
    } else if (cond === 'thunderstorm') {
      // Dark atmospheric storm veil
      const stormGrad = ctx.createLinearGradient(0, 0, 0, this.height);
      if (isLight) {
        stormGrad.addColorStop(0, 'rgba(30, 41, 59, 0.24)');
        stormGrad.addColorStop(1, 'rgba(51, 65, 85, 0.18)');
      } else {
        stormGrad.addColorStop(0, 'rgba(15, 20, 35, 0.18)');
        stormGrad.addColorStop(1, 'rgba(25, 30, 50, 0.12)');
      }
      ctx.fillStyle = stormGrad;
      ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  /* ================= 6. PARTICLES UPDATE & RENDERING ================= */

  updateAndRenderParticles(now, timeFactor) {
    const ctx = this.ctx;
    const cond = this.currentCondition;
    const t = now * 0.0015;

    for (let i = 0; i < this.activeParticles.length; i++) {
      const p = this.activeParticles[i];
      if (!p.active) continue;

      // Update positions with delta-time factor
      p.x += p.vx * timeFactor;
      p.y += p.vy * timeFactor;

      // Type-specific motion & drawing
      if (p.type === 'rain' || p.type === 'drizzle') {
        this.renderRainParticle(ctx, p);

        // Ground collision & splash spawn
        if (p.y > this.height) {
          if (this.activeSplashes.length < this.MAX_SPLASHES && Math.random() > 0.45) {
            this.spawnSplash(p.x, this.height - 2 - Math.random() * 4, p.depth);
          }
          p.y = -p.len - Math.random() * 20;
          p.x = Math.random() * (this.width + 160) - 80;
        }
      } else if (p.type === 'snow' || p.type === 'sleet') {
        p.x += Math.sin(t + p.seed) * (p.type === 'snow' ? 0.7 : 0.2) * timeFactor;
        p.rotation += p.vRot * timeFactor;
        this.renderSnowParticle(ctx, p);

        if (p.y > this.height + 10) {
          p.y = -10;
          p.x = Math.random() * this.width;
        }
      } else if (p.type === 'fog') {
        p.y += Math.sin(t * 0.5 + p.seed) * 0.15 * timeFactor;
        this.renderFogParticle(ctx, p);

        if (p.x - p.radius > this.width) {
          p.x = -p.radius;
          p.y = Math.random() * this.height;
        }
      } else if (p.type === 'dust') {
        p.y += Math.sin(t * 2 + p.seed) * 0.4 * timeFactor;
        this.renderDustParticle(ctx, p);

        if (p.x > this.width + 20) {
          p.x = -20;
          p.y = Math.random() * this.height;
        }
      } else if (p.type === 'heat') {
        p.x += Math.sin(t * 3 + p.seed) * 0.5 * timeFactor;
        this.renderHeatParticle(ctx, p, t);

        if (p.y < -15) {
          p.y = this.height + 15;
          p.x = Math.random() * this.width;
        }
      } else {
        // Mote (Clear Sky / Neutral)
        p.x += Math.sin(t + p.seed) * 0.4 * timeFactor;
        this.renderMoteParticle(ctx, p, t);

        if (p.y < -15) {
          p.y = this.height + 15;
          p.x = Math.random() * this.width;
        }
      }
    }
  }

  renderRainParticle(ctx, p) {
    const isLight = this.isLightTheme();
    const tiltX = p.vx * 1.5;
    const grad = ctx.createLinearGradient(p.x, p.y, p.x + tiltX, p.y + p.len);

    if (isLight) {
      // Light theme: high-contrast hydrodynamic ocean cerulean / maritime blue
      grad.addColorStop(0, `rgba(3, 105, 161, ${p.opacity * 0.4})`);
      grad.addColorStop(0.7, `rgba(2, 132, 199, ${p.opacity * 0.9})`);
      grad.addColorStop(1, `rgba(12, 74, 110, ${Math.min(1, p.opacity * 1.3)})`);
      ctx.lineWidth = p.size * 1.25;
    } else {
      // Dark theme: glowing cyan-white
      grad.addColorStop(0, `rgba(51, 199, 255, ${p.opacity * 0.15})`);
      grad.addColorStop(1, `rgba(195, 240, 255, ${p.opacity})`);
      ctx.lineWidth = p.size;
    }

    ctx.strokeStyle = grad;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + tiltX, p.y + p.len);
    ctx.stroke();
  }

  renderSnowParticle(ctx, p) {
    const isLight = this.isLightTheme();

    if (isLight) {
      // Multi-tonal daylight ice crystal with contrasting halo and crystalline core
      ctx.fillStyle = `rgba(100, 135, 175, ${p.opacity * 0.45})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      const iceGrad = ctx.createRadialGradient(p.x - p.radius * 0.25, p.y - p.radius * 0.25, 0, p.x, p.y, p.radius);
      iceGrad.addColorStop(0, `rgba(255, 255, 255, ${p.opacity * 0.95})`);
      iceGrad.addColorStop(0.55, `rgba(186, 230, 253, ${p.opacity * 0.9})`);
      iceGrad.addColorStop(1, `rgba(125, 170, 215, ${p.opacity * 0.85})`);

      ctx.fillStyle = iceGrad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(51, 65, 85, ${p.opacity * 0.45})`;
      ctx.lineWidth = 0.75;
      ctx.stroke();
    } else {
      ctx.fillStyle = `rgba(235, 248, 255, ${p.opacity})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      // Subtle soft halo
      ctx.fillStyle = `rgba(180, 230, 255, ${p.opacity * 0.35})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 2.0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderFogParticle(ctx, p) {
    const isLight = this.isLightTheme();
    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);

    if (isLight) {
      grad.addColorStop(0, `rgba(148, 163, 184, ${p.opacity * 1.5})`);
      grad.addColorStop(0.55, `rgba(186, 205, 225, ${p.opacity * 0.85})`);
      grad.addColorStop(1, 'transparent');
    } else {
      grad.addColorStop(0, `rgba(185, 215, 240, ${p.opacity})`);
      grad.addColorStop(0.65, `rgba(160, 195, 225, ${p.opacity * 0.35})`);
      grad.addColorStop(1, 'transparent');
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  renderDustParticle(ctx, p) {
    const isLight = this.isLightTheme();

    if (isLight) {
      ctx.fillStyle = `rgba(180, 120, 60, ${p.opacity * 0.8})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(217, 119, 6, ${p.opacity * 0.38})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 1.8, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = `rgba(220, 235, 250, ${p.opacity})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderHeatParticle(ctx, p, t) {
    const isLight = this.isLightTheme();
    const pulse = 0.75 + 0.25 * Math.sin(t * 3 + p.seed);
    const alpha = p.opacity * pulse;

    const radGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 2.2);

    if (isLight) {
      radGrad.addColorStop(0, `hsla(${p.hue}, 95%, 45%, ${alpha * 1.15})`);
      radGrad.addColorStop(0.7, `hsla(${p.hue}, 90%, 38%, ${alpha * 0.55})`);
      radGrad.addColorStop(1, 'transparent');
    } else {
      radGrad.addColorStop(0, `hsla(${p.hue}, 100%, 70%, ${alpha})`);
      radGrad.addColorStop(0.7, `hsla(${p.hue}, 90%, 55%, ${alpha * 0.3})`);
      radGrad.addColorStop(1, 'transparent');
    }

    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius * 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  renderMoteParticle(ctx, p, t) {
    const isLight = this.isLightTheme();
    const pulse = 0.7 + 0.3 * Math.sin(t * 2 + p.seed);
    const alpha = p.opacity * pulse;

    const radGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 2.4);

    if (isLight) {
      if (this.solarPhase === 'night') {
        radGrad.addColorStop(0, `rgba(30, 64, 175, ${alpha * 0.85})`);
        radGrad.addColorStop(0.6, `rgba(59, 130, 246, ${alpha * 0.4})`);
        radGrad.addColorStop(1, 'transparent');
      } else {
        const hue = (p.hue !== undefined && p.hue < 100) ? p.hue : 40;
        radGrad.addColorStop(0, `hsla(${hue}, 95%, 45%, ${alpha * 0.95})`);
        radGrad.addColorStop(0.6, `hsla(${hue}, 90%, 50%, ${alpha * 0.4})`);
        radGrad.addColorStop(1, 'transparent');
      }

      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 2.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = this.solarPhase === 'night'
        ? `rgba(30, 58, 138, ${alpha * 0.95})`
        : `rgba(217, 119, 6, ${alpha * 0.95})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 0.6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      radGrad.addColorStop(0, `hsla(${p.hue}, 100%, 75%, ${alpha})`);
      radGrad.addColorStop(0.5, `hsla(${p.hue}, 95%, 55%, ${alpha * 0.4})`);
      radGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 2.4, 0, Math.PI * 2);
      ctx.fill();

      // Sharp luminous core
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.85})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* ================= 7. SPLASH RIPPLES ================= */

  spawnSplash(x, y, depth) {
    const isLight = this.isLightTheme();
    for (let i = 0; i < this.splashPool.length; i++) {
      const s = this.splashPool[i];
      if (!s.active) {
        s.active = true;
        s.x = x;
        s.y = y;
        s.rx = 1;
        s.ry = 0.4;
        s.maxR = (5 + Math.random() * 8) * depth;
        s.opacity = 0.65 * depth;
        if (isLight) {
          s.color = depth > 0.6 ? 'rgba(2, 132, 199, 0.75)' : 'rgba(3, 105, 161, 0.55)';
        } else {
          s.color = depth > 0.6 ? 'rgba(80, 215, 255, 0.7)' : 'rgba(51, 199, 255, 0.4)';
        }
        this.activeSplashes.push(s);
        break;
      }
    }
  }

  updateAndRenderSplashes(timeFactor) {
    const isLight = this.isLightTheme();
    const ctx = this.ctx;
    for (let i = this.activeSplashes.length - 1; i >= 0; i--) {
      const s = this.activeSplashes[i];
      s.rx += 0.85 * timeFactor;
      s.ry += 0.32 * timeFactor;
      s.opacity -= 0.04 * timeFactor;

      if (s.opacity <= 0 || s.rx > s.maxR) {
        s.active = false;
        this.activeSplashes.splice(i, 1);
        continue;
      }

      ctx.strokeStyle = isLight
        ? `rgba(2, 132, 199, ${s.opacity * 1.15})`
        : `rgba(51, 199, 255, ${s.opacity})`;
      ctx.lineWidth = isLight ? 1.3 : 1;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, s.rx, s.ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  /* ================= 8. THUNDERSTORM LIGHTNING ================= */

  updateAndRenderLightning(now) {
    const l = this.lightning;

    // Check if it's time for a new lightning strike
    if (!l.active && now - l.lastStrikeTime > l.nextStrikeDelay) {
      l.active = true;
      l.startTime = now;
      l.flashIntensity = 0.22 + Math.random() * 0.18; // soft restrained ambient flash
      l.duration = 80 + Math.random() * 70; // 80ms - 150ms
      l.lastStrikeTime = now;
      // Infrequent strikes: 9 to 18 seconds
      l.nextStrikeDelay = 9000 + Math.random() * 9000;
    }

    if (l.active) {
      const progress = (now - l.startTime) / l.duration;
      if (progress >= 1.0) {
        l.active = false;
      } else {
        const isLight = this.isLightTheme();
        const flashAlpha = Math.sin(progress * Math.PI) * l.flashIntensity;

        if (isLight) {
          // Dramatic daytime squall lightning flash with electric violet-blue burst
          this.ctx.fillStyle = `rgba(79, 70, 229, ${flashAlpha * 0.75})`;
          this.ctx.fillRect(0, 0, this.width, this.height);
          this.ctx.fillStyle = `rgba(14, 165, 233, ${flashAlpha * 0.45})`;
          this.ctx.fillRect(0, 0, this.width, this.height);
        } else {
          // Double-peak realistic pulse with fast exponential decay
          this.ctx.fillStyle = `rgba(215, 235, 255, ${flashAlpha})`;
          this.ctx.fillRect(0, 0, this.width, this.height);
        }
      }
    }
  }

  /* ================= 9. UI BADGE SYNCHRONIZATION ================= */

  updateUIBadge() {
    const badge = document.getElementById('climateAtmospherePill');
    if (!badge) return;

    const cond = this.currentCondition;
    const isOverride = Boolean(this.settings.manualOverrideCondition);
    const tempText = this.climateState && typeof this.climateState.temperature === 'number'
      ? `${this.climateState.temperature}°C`
      : '';

    const locText = this.climateState?.location?.name || 'Local';
    const sourceIcon = this.climateState?.location?.source === 'gps' ? '🛰️' : '📍';
    const isLight = this.isLightTheme();

    const darkMeta = {
      clear: { icon: '☀️', label: 'Clear Sky', color: '#FFB84D' },
      clouds: { icon: '☁️', label: 'Cloudy', color: '#B5C8D5' },
      drizzle: { icon: '🌦️', label: 'Drizzle', color: '#5CD2E6' },
      rain: { icon: '🌧️', label: 'Rain', color: 'var(--cyber)' },
      thunderstorm: { icon: '⛈️', label: 'Thunderstorm', color: '#A388EE' },
      snow: { icon: '❄️', label: 'Snowfall', color: '#E0F2FE' },
      fog: { icon: '🌫️', label: 'Fog Mist', color: '#94A3B8' },
      mist: { icon: '🌫️', label: 'Mist', color: '#94A3B8' },
      haze: { icon: '🌫️', label: 'Haze', color: '#CBD5E1' },
      wind: { icon: '💨', label: 'High Wind', color: '#38BDF8' },
      heat: { icon: '🔥', label: 'Extreme Heat', color: '#F97316' },
      neutral: { icon: '✨', label: 'Atmosphere', color: 'var(--text-1)' }
    };

    const lightMeta = {
      clear: { icon: '☀️', label: 'Clear Sky', color: '#D97706' },
      clouds: { icon: '☁️', label: 'Cloudy', color: '#475569' },
      drizzle: { icon: '🌦️', label: 'Drizzle', color: '#0284C7' },
      rain: { icon: '🌧️', label: 'Rain', color: '#0369A1' },
      thunderstorm: { icon: '⛈️', label: 'Thunderstorm', color: '#6D28D9' },
      snow: { icon: '❄️', label: 'Snowfall', color: '#0284C7' },
      fog: { icon: '🌫️', label: 'Fog Mist', color: '#475569' },
      mist: { icon: '🌫️', label: 'Mist', color: '#475569' },
      haze: { icon: '🌫️', label: 'Haze', color: '#64748B' },
      wind: { icon: '💨', label: 'High Wind', color: '#0284C7' },
      heat: { icon: '🔥', label: 'Extreme Heat', color: '#EA580C' },
      neutral: { icon: '✨', label: 'Atmosphere', color: 'var(--text-primary)' }
    };

    const meta = isLight ? lightMeta : darkMeta;
    const cur = meta[cond] || meta.neutral;
    const solarIcon = this.solarPhase === 'night' && cond === 'clear' ? '🌙' : cur.icon;

    badge.innerHTML = `
      <span style="font-size:14px;">${solarIcon}</span>
      <span style="font-weight:600; color:${cur.color};">${cur.label}</span>
      ${tempText ? `<span style="font-size:11px; font-weight:700; color:${isLight ? 'var(--text-primary)' : 'var(--text-0)'}; margin-left:1px;">${tempText}</span>` : ''}
      <span style="font-size:10px; color:${isLight ? 'var(--text-secondary)' : 'var(--text-2)'}; margin-left:3px; opacity:0.85;">${sourceIcon} ${locText}</span>
    `;

    badge.title = `Current Atmosphere: ${cur.label} ${tempText} in ${locText} (${isOverride ? 'Manual Preset' : 'Live OpenWeather'}). Click to open Atmosphere & Weather Intelligence Control.`;
  }
}

// Global instance
const climateParticleEngine = new ClimateParticleEngine();

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => climateParticleEngine.init());
  } else {
    climateParticleEngine.init();
  }
}

if (typeof window !== 'undefined') {
  window.climateParticleEngine = climateParticleEngine;
  window.cycleClimateEffect = () => {
    if (typeof openClimateModal === 'function') {
      openClimateModal();
    }
  };
  window.setClimateEffect = (cond) => {
    climateParticleEngine.setManualOverride(cond);
  };
}
