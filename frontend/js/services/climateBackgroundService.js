/**
 * FloodAI — Climate Background Service
 * 
 * Manages dynamic atmospheric environmental photography backgrounds.
 * Features:
 *  - 12 High-fidelity cinematic climate profiles (clear, cloudy, drizzle, rain,
 *    thunderstorm, snow, fog, windy, night, sunrise, sunset, hot)
 *  - Real-time weather condition resolver with solar phase & telemetry precedence
 *  - Dual-buffer crossfade DOM engine (zero flicker, pre-cached image swapping)
 *  - Seamless integration with AtmosphereController & ClimateParticleEngine
 */

(function (window) {
  'use strict';

  const CLIMATE_BACKGROUND_REGISTRY = {
    climate_clear: {
      id: 'climate_clear',
      label: 'Clear Skies',
      description: 'High visibility and clear atmospheric conditions',
      imagePath: 'assets/images/climate/climate_clear.jpg',
      fallbackColor: '#0a1d37',
      recommendedParticlePreset: 'clear'
    },
    climate_cloudy: {
      id: 'climate_cloudy',
      label: 'Overcast & Cloudy',
      description: 'Diffused sunlight and dense stratocumulus coverage',
      imagePath: 'assets/images/climate/climate_cloudy.jpg',
      fallbackColor: '#101c2b',
      recommendedParticlePreset: 'cloudy'
    },
    climate_drizzle: {
      id: 'climate_drizzle',
      label: 'Light Drizzle',
      description: 'Gentle mist and fine precipitation droplets',
      imagePath: 'assets/images/climate/climate_drizzle.jpg',
      fallbackColor: '#0e1d2c',
      recommendedParticlePreset: 'drizzle'
    },
    climate_rain: {
      id: 'climate_rain',
      label: 'Torrential Rainfall',
      description: 'Heavy precipitation, glistening urban runoff & flood surges',
      imagePath: 'assets/images/climate/climate_rain.jpg',
      fallbackColor: '#071522',
      recommendedParticlePreset: 'rain'
    },
    climate_thunderstorm: {
      id: 'climate_thunderstorm',
      label: 'Severe Thunderstorm',
      description: 'Atmospheric electrical discharge & cumulonimbus squall',
      imagePath: 'assets/images/climate/climate_thunderstorm.jpg',
      fallbackColor: '#120b24',
      recommendedParticlePreset: 'thunderstorm'
    },
    climate_snow: {
      id: 'climate_snow',
      label: 'Winter Snow Flurries',
      description: 'Sub-zero crystalline snowfall and iced river banks',
      imagePath: 'assets/images/climate/climate_snow.jpg',
      fallbackColor: '#14212f',
      recommendedParticlePreset: 'snow'
    },
    climate_fog: {
      id: 'climate_fog',
      label: 'Dense Coastal Fog',
      description: 'Low-lying river vapor, haze and reduced visual range',
      imagePath: 'assets/images/climate/climate_fog.jpg',
      fallbackColor: '#131e28',
      recommendedParticlePreset: 'fog'
    },
    climate_windy: {
      id: 'climate_windy',
      label: 'Gale-Force Surge',
      description: 'High-velocity wind gusts and churning coastal waters',
      imagePath: 'assets/images/climate/climate_windy.jpg',
      fallbackColor: '#091c25',
      recommendedParticlePreset: 'windy'
    },
    climate_night: {
      id: 'climate_night',
      label: 'Clear Nocturnal Sky',
      description: 'Deep midnight blue with tranquil moonlight reflections',
      imagePath: 'assets/images/climate/climate_night.jpg',
      fallbackColor: '#050c18',
      recommendedParticlePreset: 'night'
    },
    climate_sunrise: {
      id: 'climate_sunrise',
      label: 'Golden Hour Dawn',
      description: 'Warm peach and amber morning rays piercing wetland mist',
      imagePath: 'assets/images/climate/climate_sunrise.jpg',
      fallbackColor: '#2b1b1f',
      recommendedParticlePreset: 'clear'
    },
    climate_sunset: {
      id: 'climate_sunset',
      label: 'Twilight Dusk',
      description: 'Vibrant crimson and violet horizon over tidal estuaries',
      imagePath: 'assets/images/climate/climate_sunset.jpg',
      fallbackColor: '#291424',
      recommendedParticlePreset: 'clear'
    },
    climate_hot: {
      id: 'climate_hot',
      label: 'Scorching Heatwave',
      description: 'High-temperature arid climate and sun-baked soils',
      imagePath: 'assets/images/climate/climate_hot.jpg',
      fallbackColor: '#2d1e0d',
      recommendedParticlePreset: 'hot'
    }
  };

  const ClimateBackgroundService = {
    registry: CLIMATE_BACKGROUND_REGISTRY,
    currentBackgroundId: null,
    activeBufferIndex: 0, // 0 -> Buffer A, 1 -> Buffer B
    initialized: false,
    manualOverride: null,

    /**
     * Initialize background container and hook into DOM
     */
    init() {
      if (this.initialized) return;
      this.ensureDomElements();
      this.initialized = true;

      // Apply initial clear or night background
      const initialId = this.isCurrentTimeNight() ? 'climate_night' : 'climate_clear';
      this.applyBackground(initialId, true);

      console.log('[ClimateBackgroundService] Atmospheric background engine mounted.');
    },

    /**
     * Ensure Dual-Buffer DOM elements exist in the document
     */
    ensureDomElements() {
      let container = document.getElementById('climateBgContainer');
      if (!container) {
        container = document.createElement('div');
        container.id = 'climateBgContainer';
        container.className = 'climate-bg-container';
        container.setAttribute('aria-hidden', 'true');

        const bufferA = document.createElement('div');
        bufferA.id = 'climateBgBufferA';
        bufferA.className = 'climate-bg-buffer active';

        const bufferB = document.createElement('div');
        bufferB.id = 'climateBgBufferB';
        bufferB.className = 'climate-bg-buffer';

        const overlay = document.createElement('div');
        overlay.id = 'climateBgOverlay';
        overlay.className = 'climate-bg-overlay';

        container.appendChild(bufferA);
        container.appendChild(bufferB);
        container.appendChild(overlay);

        document.body.prepend(container);
      }
    },

    /**
     * Check if local time is currently night
     */
    isCurrentTimeNight(date = new Date()) {
      const hours = date.getHours();
      return hours < 6 || hours >= 19;
    },

    /**
     * Check if local time is near sunrise (e.g. 05:45 - 07:15)
     */
    isCurrentTimeSunrise(date = new Date()) {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const timeInMins = hours * 60 + minutes;
      return timeInMins >= (5 * 60 + 30) && timeInMins <= (7 * 60 + 15);
    },

    /**
     * Check if local time is near sunset (e.g. 17:30 - 19:00)
     */
    isCurrentTimeSunset(date = new Date()) {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const timeInMins = hours * 60 + minutes;
      return timeInMins >= (17 * 60 + 30) && timeInMins <= (19 * 60 + 15);
    },

    /**
     * Resolves appropriate background ID from climate state & telemetry
     */
    resolveBackgroundId(climateState) {
      if (this.manualOverride && this.registry[`climate_${this.manualOverride}`]) {
        return `climate_${this.manualOverride}`;
      }
      if (this.manualOverride && this.registry[this.manualOverride]) {
        return this.manualOverride;
      }

      if (!climateState) {
        return this.isCurrentTimeNight() ? 'climate_night' : 'climate_clear';
      }

      const weatherCode = climateState.weatherCode || climateState.code || climateState.raw?.weather?.[0]?.id || 800;
      const temp = typeof climateState.temperature === 'number' ? climateState.temperature : (climateState.raw?.main?.temp ?? 28);
      const windSpeed = typeof climateState.windSpeed === 'number' ? climateState.windSpeed : (climateState.raw?.wind?.speed ?? 3.5);
      const now = new Date();

      // 1. Severe Weather Precedence: Thunderstorm (2xx)
      if (weatherCode >= 200 && weatherCode < 300) {
        return 'climate_thunderstorm';
      }

      // 2. Snow / Ice Precedence (6xx)
      if (weatherCode >= 600 && weatherCode < 700) {
        return 'climate_snow';
      }

      // 3. Fog / Mist / Atmospheric Obscuration (7xx)
      if (weatherCode >= 700 && weatherCode < 800) {
        return 'climate_fog';
      }

      // 4. Heavy Rain (5xx)
      if (weatherCode >= 500 && weatherCode < 600) {
        return 'climate_rain';
      }

      // 5. Light Drizzle (3xx)
      if (weatherCode >= 300 && weatherCode < 400) {
        return 'climate_drizzle';
      }

      // 6. High Winds / Coastal Gale (Wind > 10 m/s or 36 km/h)
      if (windSpeed > 10) {
        return 'climate_windy';
      }

      // 7. Extreme Heatwave (>= 35°C)
      if (temp >= 35) {
        return 'climate_hot';
      }

      // 8. Solar Phase Diurnal Transitions (Sunrise / Sunset / Night)
      if (this.isCurrentTimeSunrise(now)) {
        return 'climate_sunrise';
      }
      if (this.isCurrentTimeSunset(now)) {
        return 'climate_sunset';
      }
      if (climateState.isNight || this.isCurrentTimeNight(now)) {
        return 'climate_night';
      }

      // 9. Standard Cloud Cover (801 - 804)
      if (weatherCode > 800) {
        return 'climate_cloudy';
      }

      // 10. Default Clear
      return 'climate_clear';
    },

    /**
     * Update background according to incoming climateState
     */
    update(climateState, manualCondition = null) {
      if (manualCondition !== undefined) {
        this.manualOverride = manualCondition;
      }
      const targetId = this.resolveBackgroundId(climateState);
      this.applyBackground(targetId, false);
    },

    /**
     * Perform dual-buffer crossfade transition
     */
    applyBackground(bgId, immediate = false) {
      const profile = this.registry[bgId] || this.registry.climate_clear;
      if (!profile) return;

      if (this.currentBackgroundId === bgId && !immediate) return;
      this.currentBackgroundId = bgId;

      this.ensureDomElements();

      const bufferA = document.getElementById('climateBgBufferA');
      const bufferB = document.getElementById('climateBgBufferB');
      if (!bufferA || !bufferB) return;

      const incomingBuffer = (this.activeBufferIndex === 0) ? bufferB : bufferA;
      const outgoingBuffer = (this.activeBufferIndex === 0) ? bufferA : bufferB;

      // Preload image before initiating transition to guarantee zero flicker
      const preloadImg = new Image();
      preloadImg.src = profile.imagePath;

      const triggerTransition = () => {
        incomingBuffer.style.backgroundImage = `url('${profile.imagePath}')`;
        incomingBuffer.style.backgroundColor = profile.fallbackColor;

        if (immediate) {
          incomingBuffer.classList.add('active');
          outgoingBuffer.classList.remove('active');
          incomingBuffer.style.transition = 'none';
          outgoingBuffer.style.transition = 'none';
          setTimeout(() => {
            incomingBuffer.style.transition = '';
            outgoingBuffer.style.transition = '';
          }, 50);
        } else {
          incomingBuffer.classList.add('active');
          outgoingBuffer.classList.remove('active');
        }

        this.activeBufferIndex = (this.activeBufferIndex === 0) ? 1 : 0;
      };

      if (preloadImg.complete) {
        triggerTransition();
      } else {
        preloadImg.onload = triggerTransition;
        preloadImg.onerror = () => {
          // In case of load issue, fallback gracefully
          incomingBuffer.style.backgroundImage = 'none';
          incomingBuffer.style.backgroundColor = profile.fallbackColor;
          incomingBuffer.classList.add('active');
          outgoingBuffer.classList.remove('active');
          this.activeBufferIndex = (this.activeBufferIndex === 0) ? 1 : 0;
        };
      }
    },

    /**
     * Override manual condition (e.g. from Climate Modal)
     */
    setManualOverride(condition) {
      this.manualOverride = condition || null;
      const targetId = this.resolveBackgroundId(window.AtmosphereController?.currentClimateState);
      this.applyBackground(targetId, false);
    }
  };

  // Expose globally
  window.ClimateBackgroundService = ClimateBackgroundService;

  // Auto-init on DOM readiness
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => ClimateBackgroundService.init());
    } else {
      ClimateBackgroundService.init();
    }
  }
})(typeof window !== 'undefined' ? window : this);
