/**
 * FLOODAI — Climate Trends & Historical Analytics View
 * 24-year aggregated climate trends (2000–2023) from MongoDB Atlas analytics pipeline.
 */

let climateCharts = [];

async function renderAnalytics(root) {
  root = root || document.getElementById('pageRoot');
  if (!root) return;

  climateCharts.forEach(c => c.destroy());
  climateCharts = [];

  root.innerHTML = `
    <div class="eyebrow">24-Year Climate Trend Analysis · 2000–2023 · MongoDB Atlas Pipeline</div>
    <h1 class="page-title">Climate Change Analytics</h1>
    <p class="page-sub">Historical precipitation, sea levels, flood occurrences, and cyclone frequencies across monitored disaster zones.</p>

    <!-- Data Freshness Bar -->
    <div style="margin-bottom:14px;">
      ${renderDataFreshnessBar({ label: 'Climate Historical Baseline (2000–2023)', timestamp: Date.now(), onRefresh: 'refreshAnalyticsData()' })}
    </div>

    <div class="chart-grid">
      <div class="glass chart-card border-scale card-glow"><h4>Average Rainfall Trend (mm)</h4><div style="height:220px;" id="c1Wrap"><canvas id="c1"></canvas></div></div>
      <div class="glass chart-card border-scale card-glow"><h4>Sea Level Trend (m)</h4><div style="height:220px;" id="c2Wrap"><canvas id="c2"></canvas></div></div>
      <div class="glass chart-card border-scale card-glow"><h4>Flood Events per Year</h4><div style="height:220px;" id="c3Wrap"><canvas id="c3"></canvas></div></div>
      <div class="glass chart-card border-scale card-glow"><h4>Cyclone Frequency per Year</h4><div style="height:220px;" id="c4Wrap"><canvas id="c4"></canvas></div></div>
    </div>
  `;

  if (YEARLY.length === 0) {
    try {
      const res = await api('/floods/analytics', 'GET', null, false);
      if (res && res.yearly_trends) {
        YEARLY = res.yearly_trends;
      }
    } catch (e) {
      console.warn('[Analytics] Failed to fetch yearly trends:', e.message);
    }
  }

  if (typeof Chart === 'undefined') {
    ['c1Wrap', 'c2Wrap', 'c3Wrap', 'c4Wrap'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = renderSkeletonChart({ title: 'Loading Chart Engine...', height: '220px' });
    });
    return;
  }

  const grid = getCss('--panel-border');
  const years = YEARLY.map(y => y.year);

  const ctx1 = document.getElementById('c1');
  if (ctx1) {
    climateCharts.push(new Chart(ctx1, {
      type: 'line',
      data: { labels: years, datasets: [{ data: YEARLY.map(y => y.avg_rainfall), borderColor: getCss('--cyber') || '#33C7FF', backgroundColor: 'rgba(51,199,255,0.12)', fill: true, tension: .35, pointRadius: 0 }] },
      options: baseChartOpts(grid)
    }));
  }

  const ctx2 = document.getElementById('c2');
  if (ctx2) {
    climateCharts.push(new Chart(ctx2, {
      type: 'line',
      data: { labels: years, datasets: [{ data: YEARLY.map(y => y.avg_sea_level), borderColor: getCss('--purple') || '#B18CFF', backgroundColor: 'rgba(177,140,255,0.12)', fill: true, tension: .35, pointRadius: 0 }] },
      options: baseChartOpts(grid)
    }));
  }

  const ctx3 = document.getElementById('c3');
  if (ctx3) {
    climateCharts.push(new Chart(ctx3, {
      type: 'bar',
      data: { labels: years, datasets: [{ data: YEARLY.map(y => y.flood_events), backgroundColor: getCss('--red') || '#FF4D6A' }] },
      options: baseChartOpts(grid)
    }));
  }

  const ctx4 = document.getElementById('c4');
  if (ctx4) {
    climateCharts.push(new Chart(ctx4, {
      type: 'bar',
      data: { labels: years, datasets: [{ data: YEARLY.map(y => y.cyclones), backgroundColor: getCss('--ocean') || '#1FE0A8' }] },
      options: baseChartOpts(grid)
    }));
  }
}

async function refreshAnalyticsData() {
  toast('Refreshing climate trends from MongoDB Atlas...');
  try {
    const res = await api('/floods/analytics', 'GET', null, false);
    if (res && res.yearly_trends) {
      YEARLY = res.yearly_trends;
      toast('✅ Climate analytics updated.');
      renderAnalytics();
    }
  } catch (err) {
    toast(`Failed to refresh analytics: ${err.message}`);
  }
}

function baseChartOpts(grid) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: grid }, ticks: { font: { size: 10 } } },
      y: { grid: { color: grid }, ticks: { font: { size: 10 } } },
    }
  };
}
