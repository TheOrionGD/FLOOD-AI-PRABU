/* ===========================================================
   FloodAI — AtmosphereController
   Coordinates LocationService, WeatherService, ClimateStateResolver,
   and ClimateParticleEngine into a unified real-time atmospheric
   intelligence pipeline with intelligent refresh lifecycle.
   =========================================================== */

const AtmosphereController = {
  REFRESH_INTERVAL_MS: 15 * 60 * 1000, // 15 minutes auto-refresh

  currentLocation: null,
  currentClimateState: null,
  isRefreshing: false,
  lastError: null,
  refreshTimerId: null,
  unsubscribeLocation: null,
  mode: 'auto', // 'auto' (live weather) | 'manual' (preset override)
  initialized: false,

  /* ------------------- Lifecycle & Initialization ------------------- */
  async init() {
    if (this.initialized) return;
    this.initialized = true;

    // 1. Initialize with neutral ambient atmosphere first
    const initialNeutral = ClimateStateResolver.getNeutralClimateState({
      cityName: 'Locating...',
      source: 'idle'
    });
    this.currentClimateState = initialNeutral;
    if (window.climateParticleEngine) {
      window.climateParticleEngine.updateClimateState(initialNeutral, true);
    }
    if (window.ClimateBackgroundService) {
      window.ClimateBackgroundService.update(initialNeutral);
    }

    // 2. Subscribe to LocationService updates
    if (window.GeoLocationService) {
      this.unsubscribeLocation = window.GeoLocationService.subscribe((locStatus) => {
        this.handleLocationUpdate(locStatus);
      });
    }

    // 3. Setup periodic background refresh timer
    this.startRefreshTimer();

    // 4. Setup Visibility Lifecycle: Pause polling when hidden, refresh on foreground if stale
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.stopRefreshTimer();
        } else {
          this.startRefreshTimer();
          this.checkAndRefreshIfStale();
        }
      });
    }

    // 5. Initial resolution: if location is not yet located, request or use cached
    setTimeout(() => {
      if (window.GeoLocationService && window.GeoLocationService.status === 'idle') {
        window.GeoLocationService.requestDeviceLocation(false);
      }
    }, 600);
  },

  /* ------------------- Location Change Handler ------------------- */
  async handleLocationUpdate(locStatus) {
    if (!locStatus || !locStatus.coords) {
      if (locStatus?.status === 'permission_denied' && !this.currentClimateState?.raw) {
        // Fall back to first monitored sector if GPS was explicitly denied and no manual sector selected yet
        if (typeof DISTRICTS !== 'undefined' && DISTRICTS.length > 0) {
          const d = DISTRICTS[0];
          console.log('[AtmosphereController] Location denied, suggesting primary monitoring district:', d.district);
          // Set neutral state with district hint
          this.currentClimateState = ClimateStateResolver.getNeutralClimateState({
            district: d.district,
            stateName: d.state,
            lat: d.latitude,
            lon: d.longitude,
            source: 'denied'
          });
          if (window.climateParticleEngine) {
            window.climateParticleEngine.updateClimateState(this.currentClimateState, false);
          }
        }
      }
      return;
    }

    const coords = locStatus.coords;

    // Detect if coordinates meaningfully changed (more than ~500 meters or different manual district)
    const prev = this.currentLocation;
    const isNewLocation = !prev ||
      Math.abs(prev.lat - coords.lat) > 0.005 ||
      Math.abs(prev.lon - coords.lon) > 0.005 ||
      prev.source !== coords.source ||
      prev.cityName !== coords.cityName;

    this.currentLocation = coords;

    if (isNewLocation) {
      await this.fetchAndApplyWeather(coords.lat, coords.lon, false);
    }
  },

  /* ------------------- Core Weather Fetch & Transform Pipeline ------------------- */
  async fetchAndApplyWeather(lat, lon, isManualRefresh = false) {
    if (typeof lat !== 'number' || typeof lon !== 'number') return;

    this.isRefreshing = true;
    this.lastError = null;
    this.updateUI();

    try {
      const locMeta = {
        cityName: this.currentLocation?.cityName || this.currentLocation?.locality || null,
        locality: this.currentLocation?.locality || this.currentLocation?.cityName || null,
        district: this.currentLocation?.district || null,
        stateName: this.currentLocation?.stateName || null,
        country: this.currentLocation?.country || null,
        lat,
        lon,
        source: this.currentLocation?.source || 'gps'
      };

      // Call WeatherService with caching and dedup
      const response = await WeatherService.fetchCurrentWeather(lat, lon, isManualRefresh);

      if (response && response.data) {
        locMeta.isStale = Boolean(response.isStale);

        // Normalize weather response into internal climate state
        const climateState = ClimateStateResolver.normalizeWeatherResponse(response.data, locMeta);
        this.currentClimateState = climateState;

        if (typeof state !== 'undefined' && state.userLocation) {
          state.userLocation.cityName = climateState.location.name;
        }

        // Apply to dynamic particle engine & climate background
        if (window.climateParticleEngine) {
          window.climateParticleEngine.updateClimateState(climateState, false);
        }
        if (window.ClimateBackgroundService) {
          window.ClimateBackgroundService.update(climateState);
        }

        if (isManualRefresh && typeof toast === 'function') {
          const freshnessLabel = response.isStale ? '(Cached)' : '(Live)';
          toast(`🌤️ Weather updated: ${climateState.category} (${climateState.temperature}°C) in ${climateState.location.name} ${freshnessLabel}`);
        }
      }
    } catch (err) {
      console.warn('[AtmosphereController] Weather fetch notice:', err.message);
      this.lastError = err.message;

      // If we don't have a valid climate state yet, set honest neutral state
      if (!this.currentClimateState || !this.currentClimateState.raw) {
        this.currentClimateState = ClimateStateResolver.getNeutralClimateState({
          ...this.currentLocation,
          isStale: true
        });
        if (window.climateParticleEngine) {
          window.climateParticleEngine.updateClimateState(this.currentClimateState, false);
        }
      }

      if (isManualRefresh && typeof toast === 'function') {
        toast(`⚠️ Weather update notice: ${err.message}`);
      }
    } finally {
      this.isRefreshing = false;
      this.updateUI();
    }
  },

  /* ------------------- Auto-Refresh Lifecycle ------------------- */
  startRefreshTimer() {
    this.stopRefreshTimer();
    this.refreshTimerId = setInterval(() => {
      if (this.currentLocation && !document.hidden) {
        this.fetchAndApplyWeather(this.currentLocation.lat, this.currentLocation.lon, false);
      }
    }, this.REFRESH_INTERVAL_MS);
  },

  stopRefreshTimer() {
    if (this.refreshTimerId) {
      clearInterval(this.refreshTimerId);
      this.refreshTimerId = null;
    }
  },

  checkAndRefreshIfStale() {
    if (!this.currentLocation || !this.currentClimateState) return;
    const lastFetched = this.currentClimateState.lastFetchedAt || 0;
    const age = Date.now() - lastFetched;
    if (age > this.REFRESH_INTERVAL_MS) {
      this.fetchAndApplyWeather(this.currentLocation.lat, this.currentLocation.lon, false);
    }
  },

  /* ------------------- User Interaction Controls ------------------- */
  async refreshWeather() {
    if (!this.currentLocation) {
      if (window.GeoLocationService) {
        return window.GeoLocationService.requestDeviceLocation(true);
      }
      return;
    }
    return this.fetchAndApplyWeather(this.currentLocation.lat, this.currentLocation.lon, true);
  },

  setManualPreset(condition) {
    this.mode = condition ? 'manual' : 'auto';
    if (window.climateParticleEngine) {
      window.climateParticleEngine.setManualOverride(condition);
    }
    if (window.ClimateBackgroundService) {
      window.ClimateBackgroundService.setManualOverride(condition);
    }
    this.updateUI();
    if (typeof toast === 'function') {
      toast(condition ? `🎨 Atmosphere Override: ${condition.toUpperCase()}` : '🛰️ Reverted to Live OpenWeather Atmosphere');
    }
  },

  setDensity(density) {
    if (window.climateParticleEngine) {
      window.climateParticleEngine.setDensity(density);
    }
    this.updateUI();
  },

  setReducedMotion(enabled) {
    if (window.climateParticleEngine) {
      window.climateParticleEngine.setReducedMotion(enabled);
    }
    this.updateUI();
  },

  updateUI() {
    if (window.climateParticleEngine) {
      window.climateParticleEngine.updateUIBadge();
    }
    // Update climate modal body if currently open
    const modal = document.getElementById('climateModal');
    if (modal && modal.classList.contains('open') && typeof renderClimateModalBody === 'function') {
      renderClimateModalBody();
    }
  }
};

if (typeof window !== 'undefined') {
  window.AtmosphereController = AtmosphereController;
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AtmosphereController.init());
  } else {
    AtmosphereController.init();
  }
}
