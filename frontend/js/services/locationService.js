/* ===========================================================
   FloodAI — Centralized Geolocation & Location Intelligence Service
   =========================================================== */

const GeoLocationService = {
  STATE: {
    IDLE: 'idle',
    REQUESTING: 'requesting',
    LOCATED: 'located',
    PERMISSION_DENIED: 'permission_denied',
    PERMISSION_PROMPT: 'permission_prompt',
    UNAVAILABLE: 'unavailable',
    TIMEOUT: 'timeout',
    ERROR: 'error'
  },

  status: 'idle',
  coords: null, // { lat, lon, accuracyMeters, timestamp, source: 'gps'|'manual'|'cached', district, cityName, country, stateName }
  error: null,
  permissionState: 'prompt', // 'granted' | 'prompt' | 'denied'
  listeners: [],
  initialized: false,

  init() {
    if (this.initialized) return;
    this.initialized = true;

    // Check permission status if browser supports Permissions API
    this.checkPermissionStatus();

    // Check if we have a recent cached location (valid for 60 minutes)
    this.loadCachedLocation();
  },

  async checkPermissionStatus() {
    if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        this.permissionState = result.state;
        result.onchange = () => {
          this.permissionState = result.state;
          if (result.state === 'denied' && this.status === this.STATE.REQUESTING) {
            this.status = this.STATE.PERMISSION_DENIED;
            this.notify();
          }
        };
      } catch (e) {
        // Permissions query not supported for geolocation in some browsers
      }
    }
  },

  loadCachedLocation() {
    try {
      const raw = localStorage.getItem('floodai-user-location');
      if (raw) {
        const saved = JSON.parse(raw);
        const age = Date.now() - (saved._savedAt || 0);
        // Valid for up to 2 hours
        if (age < 2 * 60 * 60 * 1000 && saved.lat && saved.lon) {
          const distList = (typeof DISTRICTS !== 'undefined' && DISTRICTS.length) ? DISTRICTS : (typeof DEFAULT_MONITORED_DISTRICTS !== 'undefined' ? DEFAULT_MONITORED_DISTRICTS : []);
          let nearest = saved.nearestDistrict || null;
          if (!nearest && distList.length && saved.lat && saved.lon) {
            let minDist = Infinity;
            distList.forEach(d => {
              if (typeof d.latitude === 'number' && typeof d.longitude === 'number') {
                const dist = Math.hypot(saved.lat - d.latitude, saved.lon - d.longitude);
                if (dist < minDist) {
                  minDist = dist;
                  nearest = d.district;
                }
              }
            });
          }

          this.coords = {
            lat: saved.lat,
            lon: saved.lon,
            accuracyMeters: saved.accuracyMeters || 1000,
            timestamp: saved.timestamp || new Date().toISOString(),
            source: saved.source === 'gps' ? 'cached' : saved.source,
            district: saved.district || null,
            cityName: saved.cityName || null,
            country: saved.country || null,
            stateName: saved.stateName || null,
            nearestDistrict: nearest,
            isCached: true
          };
          this.status = this.STATE.LOCATED;
          if (typeof state !== 'undefined') {
            state.userLocation = {
              lat: saved.lat,
              lon: saved.lon,
              cityName: saved.cityName,
              district: saved.district || nearest
            };
            state.locationAccuracyKm = (this.coords.accuracyMeters / 1000).toFixed(1);
          }
          return true;
        }
      }
    } catch (e) {
      console.warn('[GeoLocationService] Error reading cached location:', e);
    }
    return false;
  },

  saveLocationToCache(coords) {
    try {
      localStorage.setItem('floodai-user-location', JSON.stringify({
        ...coords,
        _savedAt: Date.now()
      }));
    } catch (e) {}
  },

  subscribe(listener) {
    this.listeners.push(listener);
    // Immediately invoke with current status
    try { listener(this.getStatus()); } catch (e) {}
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  },

  addListener(listener) {
    return this.subscribe(listener);
  },

  notify() {
    const s = this.getStatus();
    this.listeners.forEach(fn => {
      try { fn(s); } catch (e) { console.error('[GeoLocationService] Listener error:', e); }
    });
    if (typeof renderLocationHeaderWidget === 'function') {
      renderLocationHeaderWidget();
    }
  },

  getStatus() {
    return {
      status: this.status,
      coords: this.coords,
      error: this.error,
      permissionState: this.permissionState,
      isGps: this.coords?.source === 'gps',
      isManual: this.coords?.source === 'manual',
      isCached: this.coords?.source === 'cached'
    };
  },

  async requestDeviceLocation(showNotification = true) {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      this.status = this.STATE.UNAVAILABLE;
      this.error = 'Browser does not support geolocation hardware.';
      this.notify();
      if (showNotification && typeof toast === 'function') {
        toast('⚠️ Browser does not support geolocation.');
      }
      return false;
    }

    this.status = this.STATE.REQUESTING;
    this.error = null;
    this.notify();
    if (showNotification && typeof toast === 'function') {
      toast('🛰️ Requesting device GPS coordinates...');
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const accuracyMeters = Math.round(position.coords.accuracy);

          // Validate coordinate boundaries (-90 to +90, -180 to +180)
          if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            this.status = this.STATE.ERROR;
            this.error = 'Received non-finite or out-of-range coordinates.';
            this.notify();
            resolve(false);
            return;
          }

          this.status = this.STATE.LOCATED;
          this.permissionState = 'granted';
          this.coords = {
            lat,
            lon,
            accuracyMeters,
            timestamp: new Date().toISOString(),
            source: 'gps',
            district: null,
            cityName: null,
            country: null,
            stateName: null
          };

          if (typeof state !== 'undefined') {
            state.userLocation = { lat, lon };
            state.locationAccuracyKm = (accuracyMeters / 1000).toFixed(1);
          }

          // Reverse geocode to retrieve authoritative human-readable locality matching geospatial map
          let placeResolved = false;
          try {
            if (typeof api === 'function') {
              const geoIntel = await api(`/geospatial/climatic-intelligence?lat=${lat}&lon=${lon}`, 'GET', null, false);
              if (geoIntel && geoIntel.openstreetmap) {
                const osm = geoIntel.openstreetmap;
                const locName = osm.locality || osm.district || (osm.display_name ? osm.display_name.split(',')[0].trim() : null);
                if (locName) {
                  this.coords.cityName = locName;
                  this.coords.locality = locName;
                  this.coords.district = osm.district || locName;
                  this.coords.stateName = osm.state || '';
                  this.coords.country = osm.country || '';
                  this.coords.displayName = osm.display_name;
                  placeResolved = true;
                }
              }
            }
          } catch (intelErr) {
            console.warn('[GeoLocationService] Climatic intelligence reverse geocode notice:', intelErr.message);
          }

          // Fallback to WeatherService.reverseGeocode if not resolved
          if (!placeResolved) {
            try {
              if (typeof WeatherService !== 'undefined' && WeatherService.reverseGeocode) {
                const geoInfo = await WeatherService.reverseGeocode(lat, lon);
                if (geoInfo && geoInfo.name) {
                  this.coords.cityName = geoInfo.name;
                  this.coords.locality = geoInfo.name;
                  this.coords.country = geoInfo.country || '';
                  this.coords.stateName = geoInfo.state || '';
                }
              }
            } catch (geoErr) {
              console.warn('[GeoLocationService] OpenWeather reverse geocode notice:', geoErr.message);
            }
          }

          // Check nearest threat center if threat API available
          try {
            if (typeof api === 'function') {
              const intel = await api(`/threats/personal-intelligence?lat=${lat}&lon=${lon}`, 'GET', null, false);
              if (!this.coords.district) this.coords.district = intel.nearest_district;
              this.coords.distanceKm = intel.distance_km;
              this.coords.threat = intel;
            }
          } catch (e) {}

          // Auto-bind nearest monitored disaster district from DISTRICTS if not already linked
          if (typeof DISTRICTS !== 'undefined' && DISTRICTS.length) {
            let matched = DISTRICTS.find(d => 
              (this.coords.district && d.district.toLowerCase() === this.coords.district.toLowerCase()) ||
              (this.coords.cityName && d.district.toLowerCase() === this.coords.cityName.toLowerCase())
            );
            if (!matched) {
              let minDist = Infinity;
              DISTRICTS.forEach(d => {
                if (typeof d.latitude === 'number' && typeof d.longitude === 'number') {
                  const dist = Math.hypot(lat - d.latitude, lon - d.longitude);
                  if (dist < minDist) {
                    minDist = dist;
                    matched = d;
                  }
                }
              });
            }
            if (matched) {
              this.coords.nearestDistrict = matched.district;
              if (!this.coords.district) this.coords.district = matched.district;
            }
          }

          if (typeof state !== 'undefined') {
            state.userLocation = {
              lat,
              lon,
              cityName: this.coords.cityName,
              district: this.coords.district || this.coords.nearestDistrict
            };
            state.locationAccuracyKm = (accuracyMeters / 1000).toFixed(1);
          }

          this.saveLocationToCache(this.coords);

          const placeName = this.coords.cityName || this.coords.district || `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
          if (showNotification && typeof toast === 'function') {
            toast(`📍 Device GPS Locked: ${placeName} (±${accuracyMeters}m)`);
          }

          this.notify();

          if (typeof plotUserLocationOnMap === 'function') {
            plotUserLocationOnMap(lat, lon);
          }
          resolve(true);
        },
        (geoErr) => {
          if (geoErr.code === 1) {
            this.status = this.STATE.PERMISSION_DENIED;
            this.permissionState = 'denied';
            this.error = 'Location access permission was denied by user or browser policy.';
          } else if (geoErr.code === 2) {
            this.status = this.STATE.UNAVAILABLE;
            this.error = 'Position information unavailable from network/GPS sensors.';
          } else if (geoErr.code === 3) {
            this.status = this.STATE.TIMEOUT;
            this.error = 'Geolocation request timed out before receiving a satellite lock.';
          } else {
            this.status = this.STATE.ERROR;
            this.error = geoErr.message || 'Unknown geolocation error.';
          }

          if (showNotification && typeof toast === 'function') {
            toast(`⚠️ ${this.error} Please choose your city or sector manually.`);
          }
          this.notify();

          // Offer the non-intrusive location selector modal
          if (typeof openLocPickerModal === 'function') {
            openLocPickerModal();
          }
          resolve(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  },

  selectManualDistrict(districtName) {
    const distList = (typeof DISTRICTS !== 'undefined' && DISTRICTS.length) ? DISTRICTS : (typeof DEFAULT_MONITORED_DISTRICTS !== 'undefined' ? DEFAULT_MONITORED_DISTRICTS : []);
    const d = distList.find(item => item.district.toLowerCase() === String(districtName).toLowerCase());
    if (!d) return;

    this.status = this.STATE.LOCATED;
    this.coords = {
      lat: d.latitude,
      lon: d.longitude,
      accuracyMeters: 5000,
      timestamp: new Date().toISOString(),
      source: 'manual',
      district: d.district,
      cityName: d.district,
      stateName: d.state,
      country: 'IN',
      nearestDistrict: d.district,
      distanceKm: 0
    };

    if (typeof state !== 'undefined') {
      state.userLocation = {
        lat: d.latitude,
        lon: d.longitude,
        cityName: d.district,
        district: d.district
      };
      state.locationAccuracyKm = '5.0';
    }
    this.error = null;
    this.saveLocationToCache(this.coords);

    if (typeof toast === 'function') {
      toast(`📍 Monitoring Sector set to: ${d.district}, ${d.state} (Manual Selection)`);
    }

    this.notify();

    if (typeof plotUserLocationOnMap === 'function') {
      plotUserLocationOnMap(d.latitude, d.longitude);
    }
    if (typeof closeLocPickerModal === 'function') {
      closeLocPickerModal();
    }
    if (typeof state !== 'undefined' && (state.page === 'portal' || state.page === 'map')) {
      if (typeof renderPage === 'function') renderPage();
    }
  },

  selectManualLocation(locationData) {
    if (!locationData || typeof locationData.lat !== 'number' || typeof locationData.lon !== 'number') {
      return false;
    }

    const distList = (typeof DISTRICTS !== 'undefined' && DISTRICTS.length) ? DISTRICTS : (typeof DEFAULT_MONITORED_DISTRICTS !== 'undefined' ? DEFAULT_MONITORED_DISTRICTS : []);
    let nearest = distList.find(d => 
      d.district.toLowerCase() === String(locationData.name).toLowerCase()
    );
    if (!nearest && distList.length) {
      let minDist = Infinity;
      distList.forEach(d => {
        if (typeof d.latitude === 'number' && typeof d.longitude === 'number') {
          const dist = Math.hypot(locationData.lat - d.latitude, locationData.lon - d.longitude);
          if (dist < minDist) {
            minDist = dist;
            nearest = d;
          }
        }
      });
    }

    this.status = this.STATE.LOCATED;
    this.coords = {
      lat: locationData.lat,
      lon: locationData.lon,
      accuracyMeters: 3000,
      timestamp: new Date().toISOString(),
      source: 'manual',
      district: locationData.name,
      cityName: locationData.name,
      stateName: locationData.state || null,
      country: locationData.country || null,
      nearestDistrict: nearest ? nearest.district : null,
      distanceKm: 0
    };

    if (typeof state !== 'undefined') {
      state.userLocation = { lat: locationData.lat, lon: locationData.lon };
      state.locationAccuracyKm = '3.0';
    }
    this.error = null;
    this.saveLocationToCache(this.coords);

    const placeLabel = [locationData.name, locationData.state, locationData.country].filter(Boolean).join(', ');
    if (typeof toast === 'function') {
      toast(`📍 Location set to: ${placeLabel} (Manual Selection)`);
    }

    this.notify();

    if (typeof plotUserLocationOnMap === 'function') {
      plotUserLocationOnMap(locationData.lat, locationData.lon);
    }
    if (typeof closeLocPickerModal === 'function') {
      closeLocPickerModal();
    }
    return true;
  },

  refreshLocation() {
    return this.requestDeviceLocation(true);
  }
};

// Initialize on script execution
if (typeof window !== 'undefined') {
  window.GeoLocationService = GeoLocationService;
  GeoLocationService.init();
}

function detectUserLocation() {
  return GeoLocationService.requestDeviceLocation();
}
