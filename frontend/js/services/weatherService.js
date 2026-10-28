/* ===========================================================
   FloodAI — WeatherService & WeatherRepository
   Robust OpenWeather client with in-memory & localStorage caching,
   deduplication of in-flight requests, abort-stale-response logic,
   exponential backoff retries, and comprehensive error handling.
   =========================================================== */

const WeatherService = {
  CACHE_TTL_MS: 15 * 60 * 1000, // 15 minutes TTL
  STALE_THRESHOLD_MS: 30 * 60 * 1000, // 30 minutes before considered completely stale

  // In-flight promise registry to deduplicate concurrent calls
  _pendingRequests: new Map(),
  // Request sequence counter to discard out-of-order stale responses
  _requestSequence: 0,
  _activeRequestId: 0,

  // Runtime fallback API key if backend proxy is offline
  _runtimeKey: '036939265f38b7943c9d6acc5a5db0b0',

  getApiBase() {
    if (typeof API_BASE !== 'undefined') return API_BASE;
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5000/api'
      : '/api';
  },

  /* ------------------- Cache Layer ------------------- */
  _getCache(key) {
    try {
      // Check localStorage
      const item = localStorage.getItem(`floodai-wcache-${key}`);
      if (!item) return null;
      const parsed = JSON.parse(item);
      const age = Date.now() - (parsed.cachedAt || 0);
      if (age > this.STALE_THRESHOLD_MS) {
        localStorage.removeItem(`floodai-wcache-${key}`);
        return null;
      }
      return {
        data: parsed.data,
        cachedAt: parsed.cachedAt,
        isStale: age > this.CACHE_TTL_MS,
        ageMinutes: Math.round(age / 60000)
      };
    } catch (e) {
      return null;
    }
  },

  _setCache(key, data) {
    try {
      localStorage.setItem(`floodai-wcache-${key}`, JSON.stringify({
        data,
        cachedAt: Date.now()
      }));
    } catch (e) {
      // Handle quota exceeded
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('floodai-wcache-')) {
            localStorage.removeItem(k);
          }
        }
      } catch (err) {}
    }
  },

  /* ------------------- Core Fetch Wrapper ------------------- */
  async _fetchWithRetry(url, options = {}, retries = 1, backoffMs = 1000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs || 8000);

    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMsg = json.error || json.detail || json.message || `HTTP ${res.status}`;
        const err = new Error(errorMsg);
        err.status = res.status;
        err.details = json;

        // Do not retry client auth/format errors
        if ([400, 401, 403, 404, 429].includes(res.status)) {
          throw err;
        }

        if (retries > 0) {
          await new Promise(r => setTimeout(r, backoffMs));
          return this._fetchWithRetry(url, options, retries - 1, backoffMs * 2);
        }
        throw err;
      }

      return json;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        const timeoutErr = new Error('Weather request timed out after 8s');
        timeoutErr.status = 504;
        throw timeoutErr;
      }
      if (retries > 0 && !err.status) {
        await new Promise(r => setTimeout(r, backoffMs));
        return this._fetchWithRetry(url, options, retries - 1, backoffMs * 2);
      }
      throw err;
    }
  },

  /* ------------------- Fetch Current Weather ------------------- */
  async fetchCurrentWeather(lat, lon, forceRefresh = false) {
    if (typeof lat !== 'number' || typeof lon !== 'number') {
      throw new Error('Valid latitude and longitude numbers are required.');
    }

    const rLat = lat.toFixed(3);
    const rLon = lon.toFixed(3);
    const cacheKey = `weather_${rLat}_${rLon}`;
    const dedupeKey = `req_${cacheKey}`;

    // Return cached if valid and not forcing refresh
    if (!forceRefresh) {
      const cached = this._getCache(cacheKey);
      if (cached && !cached.isStale) {
        return {
          success: true,
          source: 'cache',
          cachedAt: cached.cachedAt,
          isStale: false,
          data: cached.data
        };
      }
    }

    // Reuse in-flight request if identical
    if (this._pendingRequests.has(dedupeKey)) {
      return this._pendingRequests.get(dedupeKey);
    }

    const reqSeq = ++this._requestSequence;
    this._activeRequestId = reqSeq;

    const promise = (async () => {
      try {
        let weatherData = null;
        let sourceUsed = 'backend';

        // 1. Try Backend Proxy
        try {
          const res = await this._fetchWithRetry(`${this.getApiBase()}/weather?lat=${rLat}&lon=${rLon}`);
          if (res && res.data) {
            weatherData = res.data;
          }
        } catch (backendErr) {
          console.warn('[WeatherService] Backend proxy error, falling back to direct OpenWeather API:', backendErr.message);

          // 2. Direct fallback to OpenWeather API
          if (this._runtimeKey) {
            const directUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${rLat}&lon=${rLon}&units=metric&appid=${this._runtimeKey}`;
            const directRes = await this._fetchWithRetry(directUrl);
            if (directRes && directRes.weather) {
              weatherData = directRes;
              sourceUsed = 'direct_openweather';
            }
          } else {
            throw backendErr;
          }
        }

        // Ignore response if user switched locations in the meantime
        if (this._activeRequestId !== reqSeq) {
          const abortErr = new Error('Request superseded by newer location change.');
          abortErr.isStaleRequest = true;
          throw abortErr;
        }

        if (!weatherData || !weatherData.weather) {
          throw new Error('Malformed weather response received from provider.');
        }

        this._setCache(cacheKey, weatherData);

        return {
          success: true,
          source: sourceUsed,
          cachedAt: Date.now(),
          isStale: false,
          data: weatherData
        };
      } catch (err) {
        if (err.isStaleRequest) throw err;

        // If fetch failed, check if we have an older stale cached response to continue rendering
        const staleCached = this._getCache(cacheKey);
        if (staleCached) {
          console.warn('[WeatherService] Network failed, using stale cached telemetry.');
          return {
            success: true,
            source: 'cache_stale',
            cachedAt: staleCached.cachedAt,
            isStale: true,
            data: staleCached.data,
            lastError: err.message
          };
        }
        throw err;
      } finally {
        this._pendingRequests.delete(dedupeKey);
      }
    })();

    this._pendingRequests.set(dedupeKey, promise);
    return promise;
  },

  /* ------------------- Fetch Weather By City Name ------------------- */
  async fetchWeatherByCity(cityName, forceRefresh = false) {
    const cleanCity = String(cityName || '').trim().toLowerCase();
    if (!cleanCity) throw new Error('City name cannot be empty.');

    const cacheKey = `weather_city_${cleanCity}`;
    if (!forceRefresh) {
      const cached = this._getCache(cacheKey);
      if (cached && !cached.isStale) {
        return {
          success: true,
          source: 'cache',
          cachedAt: cached.cachedAt,
          isStale: false,
          data: cached.data
        };
      }
    }

    try {
      let weatherData = null;
      try {
        const res = await this._fetchWithRetry(`${this.getApiBase()}/weather?q=${encodeURIComponent(cleanCity)}`);
        if (res && res.data) weatherData = res.data;
      } catch (err) {
        if (this._runtimeKey) {
          const directUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cleanCity)}&units=metric&appid=${this._runtimeKey}`;
          weatherData = await this._fetchWithRetry(directUrl);
        } else {
          throw err;
        }
      }

      this._setCache(cacheKey, weatherData);
      return {
        success: true,
        source: 'api',
        cachedAt: Date.now(),
        isStale: false,
        data: weatherData
      };
    } catch (err) {
      const staleCached = this._getCache(cacheKey);
      if (staleCached) {
        return {
          success: true,
          source: 'cache_stale',
          cachedAt: staleCached.cachedAt,
          isStale: true,
          data: staleCached.data,
          lastError: err.message
        };
      }
      throw err;
    }
  },

  /* ------------------- Reverse Geocoding ------------------- */
  async reverseGeocode(lat, lon) {
    const rLat = lat.toFixed(3);
    const rLon = lon.toFixed(3);
    const cacheKey = `revgeo_${rLat}_${rLon}`;

    const cached = this._getCache(cacheKey);
    if (cached) return cached.data;

    try {
      let geo = null;
      try {
        const res = await this._fetchWithRetry(`${this.getApiBase()}/weather/reverse-geocode?lat=${rLat}&lon=${rLon}`);
        if (res && res.data) geo = res.data;
      } catch (err) {
        if (this._runtimeKey) {
          const directUrl = `https://api.openweathermap.org/geo/1.0/reverse?lat=${rLat}&lon=${rLon}&limit=1&appid=${this._runtimeKey}`;
          const arr = await this._fetchWithRetry(directUrl);
          if (Array.isArray(arr) && arr.length > 0) geo = arr[0];
        }
      }

      if (geo) this._setCache(cacheKey, geo);
      return geo;
    } catch (err) {
      console.warn('[WeatherService] Reverse geocode failed:', err.message);
      return null;
    }
  },

  /* ------------------- Direct Geocoding City Search ------------------- */
  async searchCities(query) {
    const cleanQ = String(query || '').trim();
    if (cleanQ.length < 2) return [];

    const cacheKey = `geosearch_${cleanQ.toLowerCase()}`;
    const cached = this._getCache(cacheKey);
    if (cached && !cached.isStale) return cached.data;

    try {
      let results = [];
      try {
        const res = await this._fetchWithRetry(`${this.getApiBase()}/weather/geosearch?q=${encodeURIComponent(cleanQ)}`);
        if (res && Array.isArray(res.data)) results = res.data;
      } catch (err) {
        if (this._runtimeKey) {
          const directUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cleanQ)}&limit=6&appid=${this._runtimeKey}`;
          const arr = await this._fetchWithRetry(directUrl);
          if (Array.isArray(arr)) results = arr;
        }
      }

      this._setCache(cacheKey, results);
      return results;
    } catch (err) {
      console.warn('[WeatherService] City search failed:', err.message);
      return [];
    }
  }
};

if (typeof window !== 'undefined') {
  window.WeatherService = WeatherService;
}
