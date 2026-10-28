/* ===========================================================
   FloodAI — ClimateStateResolver
   Maps raw OpenWeather API telemetry to a normalized, strongly-typed
   climate state with strict precedence rules, solar phase determination,
   and precipitation normalization.
   =========================================================== */

const ClimateStateResolver = {
  // Compass bearings lookup (16 points)
  COMPASS_POINTS: ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'],

  getCompassBearing(deg) {
    if (typeof deg !== 'number' || isNaN(deg)) return 'VAR';
    const index = Math.round((deg % 360) / 22.5) % 16;
    return this.COMPASS_POINTS[index];
  },

  /**
   * Determine local solar phase ('day' | 'night' | 'sunrise' | 'sunset')
   * using OpenWeather sunrise/sunset timestamps and timezone offset.
   */
  calculateSolarPhase(sunriseSec, sunsetSec, timezoneOffsetSec = 0) {
    const nowSec = Math.floor(Date.now() / 1000);

    // If sunrise/sunset are missing or invalid, fall back to local client hour
    if (!sunriseSec || !sunsetSec || sunriseSec >= sunsetSec) {
      const hr = new Date().getHours();
      if (hr >= 5 && hr <= 7) return { phase: 'sunrise', progress: 0.5 };
      if (hr >= 17 && hr <= 19) return { phase: 'sunset', progress: 0.5 };
      if (hr >= 8 && hr <= 16) return { phase: 'day', progress: 0.5 };
      return { phase: 'night', progress: 0.0 };
    }

    // Sunrise window: 45 mins before sunrise to 75 mins after
    const sunriseStart = sunriseSec - 45 * 60;
    const sunriseEnd = sunriseSec + 75 * 60;

    // Sunset window: 75 mins before sunset to 45 mins after
    const sunsetStart = sunsetSec - 75 * 60;
    const sunsetEnd = sunsetSec + 45 * 60;

    if (nowSec >= sunriseStart && nowSec <= sunriseEnd) {
      const progress = (nowSec - sunriseStart) / (sunriseEnd - sunriseStart);
      return { phase: 'sunrise', progress: Math.max(0, Math.min(1, progress)) };
    }

    if (nowSec >= sunsetStart && nowSec <= sunsetEnd) {
      const progress = (nowSec - sunsetStart) / (sunsetEnd - sunsetStart);
      return { phase: 'sunset', progress: Math.max(0, Math.min(1, progress)) };
    }

    if (nowSec > sunriseEnd && nowSec < sunsetStart) {
      const dayLength = sunsetStart - sunriseEnd;
      const progress = (nowSec - sunriseEnd) / (dayLength || 1);
      return { phase: 'day', progress: Math.max(0, Math.min(1, progress)) };
    }

    return { phase: 'night', progress: 0.0 };
  },

  /**
   * Calculate normalized precipitation intensity (0.0 to 1.0)
   */
  calculatePrecipitationIntensity(weatherId, rainObj, snowObj) {
    // 1. Direct measurements in mm/h if present
    const rainMm = rainObj?.['1h'] || rainObj?.['3h'] / 3 || 0;
    const snowMm = snowObj?.['1h'] || snowObj?.['3h'] / 3 || 0;
    const maxMm = Math.max(rainMm, snowMm);

    if (maxMm > 0) {
      // 0 mm -> 0.1, 2.5 mm (light) -> 0.35, 7.5 mm (moderate) -> 0.65, 20+ mm (extreme) -> 1.0
      return Math.min(1.0, 0.2 + (maxMm / 20) * 0.8);
    }

    // 2. Condition code heuristics when volume not recorded
    if (weatherId >= 200 && weatherId <= 232) {
      // Thunderstorms
      if ([202, 212, 221].includes(weatherId)) return 0.95; // heavy thunderstorm
      if ([201, 211].includes(weatherId)) return 0.75;
      return 0.6;
    }
    if (weatherId >= 500 && weatherId <= 531) {
      // Rain
      if ([502, 503, 504, 522].includes(weatherId)) return 0.9; // heavy / extreme
      if ([501, 521].includes(weatherId)) return 0.65; // moderate
      if (weatherId === 500) return 0.35; // light
      return 0.5;
    }
    if (weatherId >= 300 && weatherId <= 321) {
      // Drizzle
      if ([302, 312, 314].includes(weatherId)) return 0.45;
      return 0.25;
    }
    if (weatherId >= 600 && weatherId <= 622) {
      // Snow
      if ([602, 622].includes(weatherId)) return 0.9; // heavy snow
      if ([601, 621].includes(weatherId)) return 0.6;
      return 0.35;
    }

    return 0.0;
  },

  /**
   * Resolve Condition Code & Secondary Indicators into Primary Climate Profile
   * Strict Precedence Rules:
   * Thunderstorm > Snow/Sleet > Rain > Drizzle > Fog/Mist/Haze > High Wind > Extreme Heat > Overcast/Cloudy > Clear
   */
  resolvePrimaryCondition(weatherId, tempC, windSpeedMs, cloudPct, visibilityM) {
    // 1. Thunderstorm (200 - 232)
    if (weatherId >= 200 && weatherId <= 232) {
      return { condition: 'thunderstorm', category: 'Thunderstorm', icon: '⛈️' };
    }

    // 2. Snow / Sleet (600 - 622)
    if (weatherId >= 600 && weatherId <= 622) {
      const isSleet = [611, 612, 613, 615, 616].includes(weatherId);
      return {
        condition: 'snow',
        category: isSleet ? 'Sleet' : 'Snow',
        icon: isSleet ? '🌨️' : '❄️',
        isSleet
      };
    }

    // 3. Rain (500 - 531)
    if (weatherId >= 500 && weatherId <= 531) {
      if (weatherId === 500 && cloudPct < 85) {
        return { condition: 'drizzle', category: 'Light Rain', icon: '🌦️' };
      }
      return { condition: 'rain', category: 'Rain', icon: '🌧️' };
    }

    // 4. Drizzle (300 - 321)
    if (weatherId >= 300 && weatherId <= 321) {
      return { condition: 'drizzle', category: 'Drizzle', icon: '🌦️' };
    }

    // 5. Atmosphere: Fog / Mist / Haze / Smoke (701 - 781)
    if (weatherId >= 701 && weatherId <= 781) {
      if (weatherId === 741 || visibilityM < 1500) {
        return { condition: 'fog', category: 'Fog', icon: '🌫️' };
      }
      if (weatherId === 721) {
        return { condition: 'haze', category: 'Haze', icon: '🌫️' };
      }
      return { condition: 'mist', category: 'Mist', icon: '🌫️' };
    }

    // 6. High Wind Conditions (Wind > 12 m/s or ~43 km/h and no heavy precipitation)
    if (windSpeedMs >= 12.0) {
      return { condition: 'wind', category: 'High Wind', icon: '💨' };
    }

    // 7. Extreme Heat / Hot & Dry (>= 38°C with moderate/low clouds)
    if (tempC >= 38.0 && cloudPct < 60) {
      return { condition: 'heat', category: 'Extreme Heat', icon: '🔥' };
    }

    // 8. Clouds / Overcast (801 - 804)
    if (weatherId >= 801 && weatherId <= 804) {
      const isOvercast = weatherId === 804 || cloudPct >= 75;
      return {
        condition: 'clouds',
        category: isOvercast ? 'Overcast' : 'Cloudy',
        icon: isOvercast ? '☁️' : '⛅'
      };
    }

    // 9. Clear Sky (800)
    if (weatherId === 800) {
      return { condition: 'clear', category: 'Clear Sky', icon: '☀️' };
    }

    // Default Fallback
    return { condition: 'clear', category: 'Clear', icon: '🌤️' };
  },

  /**
   * Normalize raw OpenWeather payload into complete ClimateState
   */
  normalizeWeatherResponse(rawPayload, locationMeta = {}) {
    if (!rawPayload || typeof rawPayload !== 'object') {
      return this.getNeutralClimateState(locationMeta);
    }

    const weatherEntry = Array.isArray(rawPayload.weather) && rawPayload.weather.length > 0
      ? rawPayload.weather[0]
      : { id: 800, main: 'Clear', description: 'clear sky' };

    const weatherId = Number(weatherEntry.id) || 800;
    const weatherDesc = String(weatherEntry.description || weatherEntry.main || 'Clear').toLowerCase();
    const tempC = typeof rawPayload.main?.temp === 'number' ? Math.round(rawPayload.main.temp * 10) / 10 : 25;
    const feelsLikeC = typeof rawPayload.main?.feels_like === 'number' ? Math.round(rawPayload.main.feels_like * 10) / 10 : tempC;
    const tempMinC = typeof rawPayload.main?.temp_min === 'number' ? Math.round(rawPayload.main.temp_min * 10) / 10 : tempC;
    const tempMaxC = typeof rawPayload.main?.temp_max === 'number' ? Math.round(rawPayload.main.temp_max * 10) / 10 : tempC;
    const humidity = typeof rawPayload.main?.humidity === 'number' ? rawPayload.main.humidity : 50;
    const pressure = typeof rawPayload.main?.pressure === 'number' ? rawPayload.main.pressure : 1013;

    const windSpeedMs = typeof rawPayload.wind?.speed === 'number' ? rawPayload.wind.speed : 2.5;
    const windSpeedKmh = Math.round(windSpeedMs * 3.6 * 10) / 10;
    const windDeg = typeof rawPayload.wind?.deg === 'number' ? rawPayload.wind.deg : 90;
    const windBearing = this.getCompassBearing(windDeg);
    const windAngleRad = (windDeg * Math.PI) / 180;

    const cloudCoverage = typeof rawPayload.clouds?.all === 'number' ? rawPayload.clouds.all : 20;
    const visibility = typeof rawPayload.visibility === 'number' ? rawPayload.visibility : 10000;

    const sunriseSec = rawPayload.sys?.sunrise;
    const sunsetSec = rawPayload.sys?.sunset;
    const timezoneOffsetSec = rawPayload.timezone || 0;

    const { phase: solarPhase, progress: solarProgress } = this.calculateSolarPhase(sunriseSec, sunsetSec, timezoneOffsetSec);

    const primary = this.resolvePrimaryCondition(weatherId, tempC, windSpeedMs, cloudCoverage, visibility);

    // Determine precipitation type
    let precipitationType = 'none';
    if (primary.condition === 'rain') precipitationType = 'rain';
    else if (primary.condition === 'drizzle') precipitationType = 'drizzle';
    else if (primary.condition === 'thunderstorm') precipitationType = 'rain';
    else if (primary.condition === 'snow') precipitationType = primary.isSleet ? 'sleet' : 'snow';

    const precipitationIntensity = this.calculatePrecipitationIntensity(weatherId, rawPayload.rain, rawPayload.snow);

    // Location info (prioritize accurate reverse-geocoded cadastral locality over coarse meteorological station name)
    const resolvedName = locationMeta.cityName || locationMeta.locality || locationMeta.district || rawPayload.name || 'Current Location';
    const resolvedCountry = rawPayload.sys?.country || locationMeta.country || '';
    const resolvedCoords = {
      lat: rawPayload.coord?.lat || locationMeta.lat || 0,
      lon: rawPayload.coord?.lon || locationMeta.lon || 0
    };

    // Observation timestamp
    const observedAtTimestamp = rawPayload.dt ? rawPayload.dt * 1000 : Date.now();
    const observedAtString = new Date(observedAtTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Solar icon adjustment for night
    let finalIcon = primary.icon;
    if (solarPhase === 'night' && (primary.condition === 'clear' || primary.condition === 'clouds')) {
      finalIcon = primary.condition === 'clear' ? '🌙' : '☁️';
    }

    return {
      condition: primary.condition,
      category: primary.category,
      weatherId,
      weatherDescription: weatherDesc,
      icon: finalIcon,
      temperature: tempC,
      feelsLike: feelsLikeC,
      tempMin: tempMinC,
      tempMax: tempMaxC,
      humidity,
      pressure,
      windSpeed: windSpeedMs,
      windSpeedKmh,
      windDirection: windDeg,
      windBearing,
      windAngleRad,
      cloudCoverage,
      visibility,
      precipitationType,
      precipitationIntensity,
      isSleet: Boolean(primary.isSleet),
      solarPhase,
      solarProgress,
      sunriseTime: sunriseSec ? new Date(sunriseSec * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
      sunsetTime: sunsetSec ? new Date(sunsetSec * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
      location: {
        name: resolvedName,
        country: resolvedCountry,
        state: locationMeta.stateName || '',
        lat: resolvedCoords.lat,
        lon: resolvedCoords.lon,
        source: locationMeta.source || 'gps'
      },
      observedAt: observedAtString,
      observedAtMs: observedAtTimestamp,
      dataFreshness: locationMeta.isStale ? 'stale' : 'live',
      lastFetchedAt: Date.now(),
      raw: rawPayload
    };
  },

  /**
   * Neutral ambient climate state for offline, ungranted permission, or initial state
   */
  getNeutralClimateState(locationMeta = {}) {
    const hr = new Date().getHours();
    const isNight = hr < 6 || hr >= 19;
    return {
      condition: 'neutral',
      category: 'Ambient Atmosphere',
      weatherId: 800,
      weatherDescription: 'ambient telemetry idle',
      icon: isNight ? '🌙' : '✨',
      temperature: 24.0,
      feelsLike: 24.0,
      tempMin: 22.0,
      tempMax: 26.0,
      humidity: 50,
      pressure: 1013,
      windSpeed: 2.0,
      windSpeedKmh: 7.2,
      windDirection: 90,
      windBearing: 'E',
      windAngleRad: Math.PI / 2,
      cloudCoverage: 15,
      visibility: 10000,
      precipitationType: 'none',
      precipitationIntensity: 0.0,
      isSleet: false,
      solarPhase: isNight ? 'night' : 'day',
      solarProgress: 0.5,
      sunriseTime: '06:00 AM',
      sunsetTime: '06:30 PM',
      location: {
        name: locationMeta.cityName || locationMeta.district || 'Unspecified Location',
        country: locationMeta.country || '',
        state: locationMeta.stateName || '',
        lat: locationMeta.lat || 0,
        lon: locationMeta.lon || 0,
        source: locationMeta.source || 'idle'
      },
      observedAt: 'Standby',
      observedAtMs: Date.now(),
      dataFreshness: 'offline',
      lastFetchedAt: null,
      raw: null
    };
  }
};

if (typeof window !== 'undefined') {
  window.ClimateStateResolver = ClimateStateResolver;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ClimateStateResolver;
}
