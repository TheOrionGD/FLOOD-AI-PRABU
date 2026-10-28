const express = require("express");
const router = express.Router();
const axios = require("axios");

// Simple in-memory LRU-like cache for weather and geocode responses to prevent rate-limit exhaustion
const cache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes TTL

function getCache(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

function setCache(key, data) {
  // Cap cache size at 500 entries
  if (cache.size > 500) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
  cache.set(key, { data, timestamp: Date.now() });
}

function getApiKey() {
  return process.env.OPENWEATHER_API_KEY || process.env.VITE_WEATHER_API_KEY || "036939265f38b7943c9d6acc5a5db0b0";
}

// Helper to handle OpenWeather errors and forward appropriate status codes
function handleWeatherError(err, res, defaultMsg = "Weather request failed") {
  if (err.response) {
    const status = err.response.status;
    const message = err.response.data?.message || err.response.statusText || defaultMsg;
    return res.status(status >= 400 && status < 600 ? status : 502).json({
      success: false,
      error: message,
      status,
      detail: err.response.data || null,
    });
  }
  if (err.code === "ECONNABORTED" || err.message.includes("timeout")) {
    return res.status(504).json({
      success: false,
      error: "OpenWeather API request timed out",
      detail: err.message,
    });
  }
  return res.status(502).json({
    success: false,
    error: defaultMsg,
    detail: err.message,
  });
}

// GET /api/weather?lat=..&lon=.. or ?q=Chennai
router.get("/", async (req, res) => {
  const { lat, lon, q } = req.query;
  const API_KEY = getApiKey();

  let cacheKey;
  let url;

  if (lat && lon) {
    const parsedLat = parseFloat(lat);
    const parsedLon = parseFloat(lon);
    if (isNaN(parsedLat) || isNaN(parsedLon) || parsedLat < -90 || parsedLat > 90 || parsedLon < -180 || parsedLon > 180) {
      return res.status(400).json({ success: false, error: "Invalid latitude or longitude coordinates" });
    }
    // Round coordinates to 3 decimals (~110m) for cache efficiency
    const rLat = parsedLat.toFixed(3);
    const rLon = parsedLon.toFixed(3);
    cacheKey = `weather_${rLat}_${rLon}`;
    url = `https://api.openweathermap.org/data/2.5/weather?lat=${rLat}&lon=${rLon}&units=metric&appid=${API_KEY}`;
  } else if (q) {
    const cleanQ = String(q).trim().toLowerCase();
    if (!cleanQ) {
      return res.status(400).json({ success: false, error: "City query parameter 'q' cannot be empty" });
    }
    cacheKey = `weather_q_${cleanQ}`;
    url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cleanQ)}&units=metric&appid=${API_KEY}`;
  } else {
    // Default to Chennai coordinates
    cacheKey = "weather_13.083_80.271";
    url = `https://api.openweathermap.org/data/2.5/weather?lat=13.0827&lon=80.2707&units=metric&appid=${API_KEY}`;
  }

  // Check cache
  const cached = getCache(cacheKey);
  if (cached) {
    return res.json({
      success: true,
      source: "OpenWeatherMap API (cached)",
      cached: true,
      data: cached,
    });
  }

  try {
    const { data } = await axios.get(url, { timeout: 7000 });
    setCache(cacheKey, data);
    res.json({
      success: true,
      source: "OpenWeatherMap API",
      cached: false,
      data,
    });
  } catch (err) {
    handleWeatherError(err, res, "Weather fetch failed");
  }
});

// GET /api/weather/forecast?lat=..&lon=.. or ?q=Chennai
router.get("/forecast", async (req, res) => {
  const { lat, lon, q } = req.query;
  const API_KEY = getApiKey();

  let cacheKey;
  let url;

  if (lat && lon) {
    const parsedLat = parseFloat(lat);
    const parsedLon = parseFloat(lon);
    if (isNaN(parsedLat) || isNaN(parsedLon) || parsedLat < -90 || parsedLat > 90 || parsedLon < -180 || parsedLon > 180) {
      return res.status(400).json({ success: false, error: "Invalid coordinates for forecast" });
    }
    const rLat = parsedLat.toFixed(3);
    const rLon = parsedLon.toFixed(3);
    cacheKey = `forecast_${rLat}_${rLon}`;
    url = `https://api.openweathermap.org/data/2.5/forecast?lat=${rLat}&lon=${rLon}&units=metric&appid=${API_KEY}`;
  } else {
    const cleanQ = String(q || "Chennai").trim().toLowerCase();
    cacheKey = `forecast_q_${cleanQ}`;
    url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cleanQ)}&units=metric&appid=${API_KEY}`;
  }

  const cached = getCache(cacheKey);
  if (cached) {
    return res.json({
      success: true,
      source: "OpenWeatherMap Forecast API (cached)",
      cached: true,
      data: cached,
    });
  }

  try {
    const { data } = await axios.get(url, { timeout: 7000 });
    setCache(cacheKey, data);
    res.json({
      success: true,
      source: "OpenWeatherMap Forecast API",
      cached: false,
      data,
    });
  } catch (err) {
    handleWeatherError(err, res, "Forecast fetch failed");
  }
});

// GET /api/weather/reverse-geocode?lat=..&lon=..
router.get("/reverse-geocode", async (req, res) => {
  const { lat, lon } = req.query;
  const parsedLat = parseFloat(lat);
  const parsedLon = parseFloat(lon);

  if (isNaN(parsedLat) || isNaN(parsedLon) || parsedLat < -90 || parsedLat > 90 || parsedLon < -180 || parsedLon > 180) {
    return res.status(400).json({ success: false, error: "Valid lat and lon query parameters required" });
  }

  const API_KEY = getApiKey();
  const rLat = parsedLat.toFixed(3);
  const rLon = parsedLon.toFixed(3);
  const cacheKey = `revgeo_${rLat}_${rLon}`;

  const cached = getCache(cacheKey);
  if (cached) {
    return res.json({
      success: true,
      source: "OpenWeatherMap Reverse Geocoding (cached)",
      cached: true,
      data: cached,
    });
  }

  try {
    const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${rLat}&lon=${rLon}&limit=1&appid=${API_KEY}`;
    const { data } = await axios.get(url, { timeout: 6000 });
    const location = (Array.isArray(data) && data.length > 0) ? data[0] : null;
    setCache(cacheKey, location);
    res.json({
      success: true,
      source: "OpenWeatherMap Reverse Geocoding",
      cached: false,
      data: location,
    });
  } catch (err) {
    handleWeatherError(err, res, "Reverse geocoding failed");
  }
});

// GET /api/weather/geosearch?q=..
router.get("/geosearch", async (req, res) => {
  const { q } = req.query;
  const cleanQ = String(q || "").trim();

  if (!cleanQ || cleanQ.length < 2) {
    return res.status(400).json({ success: false, error: "Search query 'q' must have at least 2 characters" });
  }

  const API_KEY = getApiKey();
  const cacheKey = `geosearch_${cleanQ.toLowerCase()}`;

  const cached = getCache(cacheKey);
  if (cached) {
    return res.json({
      success: true,
      source: "OpenWeatherMap Direct Geocoding (cached)",
      cached: true,
      data: cached,
    });
  }

  try {
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cleanQ)}&limit=6&appid=${API_KEY}`;
    const { data } = await axios.get(url, { timeout: 6000 });
    setCache(cacheKey, data);
    res.json({
      success: true,
      source: "OpenWeatherMap Direct Geocoding",
      cached: false,
      data: Array.isArray(data) ? data : [],
    });
  } catch (err) {
    handleWeatherError(err, res, "City geocoding search failed");
  }
});

// GET /api/weather/tiles
router.get("/tiles", (req, res) => {
  const API_KEY = getApiKey();
  res.json({
    provider: "OpenWeatherMap Tile Services",
    layers: {
      precipitation: `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${API_KEY}`,
      rain: `https://tile.openweathermap.org/map/rain_new/{z}/{x}/{y}.png?appid=${API_KEY}`,
      clouds: `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${API_KEY}`,
      wind: `https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${API_KEY}`,
      pressure: `https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid=${API_KEY}`,
    },
    attribution: "&copy; OpenWeatherMap &copy; OpenStreetMap",
  });
});

module.exports = router;
