/* ===========================================================
   FloodAI — API Client & Dynamic Data Ingestion
   =========================================================== */

async function api(endpoint, method = 'GET', body = null, requireAuth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (requireAuth && state.token) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `HTTP error ${res.status}`);
    }
    state.apiHealthy = true;
    return data;
  } catch (err) {
    console.warn(`[API] ${method} ${endpoint} notice:`, err.message);
    throw err;
  }
}

async function checkApiHealth() {
  try {
    const h = await api('/health', 'GET', null, false);
    state.apiHealthy = true;
    console.log('[FloodAI] Connected to backend API:', h.service);
    return true;
  } catch (e) {
    state.apiHealthy = false;
    console.warn('[FloodAI] Backend API not reachable:', e.message);
    return false;
  }
}

async function bootstrapDynamicData(forceRefresh = false) {
  if (isDataBootstrapped && !forceRefresh && DISTRICTS.length > 0) {
    return { districts: DISTRICTS, yearly: YEARLY, stats: FLOOD_STATS, metrics: MODEL_METRICS };
  }
  if (dataBootstrapPromise && !forceRefresh) {
    return dataBootstrapPromise;
  }

  dataBootstrapPromise = (async () => {
    try {
      const [analyticsRes, statsRes, metricsRes] = await Promise.allSettled([
        api('/floods/analytics', 'GET', null, false),
        api('/floods/stats', 'GET', null, false),
        api('/predict/comparison', 'GET', null, false),
      ]);

      if (analyticsRes.status === 'fulfilled' && analyticsRes.value) {
        DISTRICTS = analyticsRes.value.district_summary || [];
        YEARLY = analyticsRes.value.yearly_trends || [];
      }

      if (statsRes.status === 'fulfilled' && statsRes.value) {
        FLOOD_STATS = statsRes.value;
      }

      if (metricsRes.status === 'fulfilled' && metricsRes.value) {
        MODEL_METRICS = metricsRes.value;
        state.comparisonData = metricsRes.value;
      }

      // If backend was offline, seamlessly load ground-truth data from frontend_data.json
      if (!DISTRICTS || DISTRICTS.length === 0) {
        try {
          const staticRes = await fetch('frontend_data.json');
          if (staticRes.ok) {
            const staticData = await staticRes.json();
            DISTRICTS = staticData.district_summary || [];
            YEARLY = staticData.yearly_trends || [];
            if (staticData.sample_rows) {
              window.ROWS = staticData.sample_rows;
            }
            if (!MODEL_METRICS && staticData.model_metrics) {
              MODEL_METRICS = staticData.model_metrics;
              state.comparisonData = staticData.model_metrics;
            }
            console.log('[DynamicData] Fallback ground-truth dataset ingested:', DISTRICTS.length, 'districts.');
          }
        } catch (_) {}
      }

      if (DISTRICTS.length > 0) {
        if (!predictInputs.district || !DISTRICTS.some(d => d.district === predictInputs.district)) {
          predictInputs.district = DISTRICTS[0].district;
        }
      }

      isDataBootstrapped = true;
      return { districts: DISTRICTS, yearly: YEARLY, stats: FLOOD_STATS, metrics: MODEL_METRICS };
    } catch (err) {
      console.error('[DynamicData] Bootstrap notice:', err);
      isDataBootstrapped = false;
      return { districts: DISTRICTS, yearly: YEARLY, stats: FLOOD_STATS, metrics: MODEL_METRICS };
    } finally {
      dataBootstrapPromise = null;
    }
  })();

  return dataBootstrapPromise;
}
