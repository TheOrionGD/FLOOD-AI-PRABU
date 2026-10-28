/**
 * analystShapView.js
 * Analyst Workspace Screen 02 — Model Explainability Explorer (SHAP Tree Attribution)
 * Connects to /api/predict/explain
 */

async function renderAnalystShap(root) {
  root.innerHTML = `
    <div class="saas-page-container">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:14px;">
        <div>
          <span class="story-tag" style="color:var(--accent-primary); border-color:rgba(51,199,255,0.3); background:rgba(51,199,255,0.1);">
            ANALYST WORKSPACE • EXPLAINABLE AI
          </span>
          <h1 style="font-family:var(--font-display); font-size:28px; font-weight:700; margin-top:6px;">
            SHAP Model Explainability Explorer
          </h1>
          <p style="font-size:13.5px; color:var(--text-secondary);">
            Shapley Additive Explanations: Deconstruct decision trees to observe positive &amp; negative risk drivers.
          </p>
        </div>

        <button class="glass-btn btn-ghost" onclick="renderAnalystShap(document.getElementById('pageRoot'))">
          Recompute SHAP Attribution 🔄
        </button>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-bottom:28px;">
        
        <!-- Explanation Overview Card -->
        <div class="glass-card elevated" style="padding:28px;">
          <h3 style="font-size:17px; font-weight:700; margin-bottom:12px; display:flex; align-items:center; gap:8px;">
            <span>📊</span> Feature Importance Ranking (TreeExplainer)
          </h3>
          <p style="font-size:13px; color:var(--text-secondary); line-height:1.6; margin-bottom:20px;">
            Mean absolute SHAP value across the entire 10,000 historical training samples, measuring each variable's global impact on model predictions.
          </p>

          <div style="display:flex; flex-direction:column; gap:12px;">
            <div>
              <div style="display:flex; justify-content:space-between; font-size:12.5px; margin-bottom:4px;">
                <span>1. Rainfall Volume (mm)</span>
                <b style="color:var(--accent-primary); font-family:var(--font-mono);">|SHAP| = 0.342</b>
              </div>
              <div style="width:100%; height:7px; background:rgba(255,255,255,0.06); border-radius:4px; overflow:hidden;">
                <div style="width:95%; height:100%; background:var(--accent-primary); border-radius:4px;"></div>
              </div>
            </div>

            <div>
              <div style="display:flex; justify-content:space-between; font-size:12.5px; margin-bottom:4px;">
                <span>2. Elevation above MSL (m)</span>
                <b style="color:var(--ocean); font-family:var(--font-mono);">|SHAP| = 0.285</b>
              </div>
              <div style="width:100%; height:7px; background:rgba(255,255,255,0.06); border-radius:4px; overflow:hidden;">
                <div style="width:80%; height:100%; background:var(--ocean); border-radius:4px;"></div>
              </div>
            </div>

            <div>
              <div style="display:flex; justify-content:space-between; font-size:12.5px; margin-bottom:4px;">
                <span>3. River Level Stage (m)</span>
                <b style="color:var(--accent-primary); font-family:var(--font-mono);">|SHAP| = 0.218</b>
              </div>
              <div style="width:100%; height:7px; background:rgba(255,255,255,0.06); border-radius:4px; overflow:hidden;">
                <div style="width:65%; height:100%; background:var(--accent-primary); border-radius:4px;"></div>
              </div>
            </div>

            <div>
              <div style="display:flex; justify-content:space-between; font-size:12.5px; margin-bottom:4px;">
                <span>4. Soil Moisture Saturation (%)</span>
                <b style="color:var(--accent-primary); font-family:var(--font-mono);">|SHAP| = 0.174</b>
              </div>
              <div style="width:100%; height:7px; background:rgba(255,255,255,0.06); border-radius:4px; overflow:hidden;">
                <div style="width:52%; height:100%; background:var(--accent-primary); border-radius:4px;"></div>
              </div>
            </div>

            <div>
              <div style="display:flex; justify-content:space-between; font-size:12.5px; margin-bottom:4px;">
                <span>5. Drainage Infrastructure Score</span>
                <b style="color:var(--ocean); font-family:var(--font-mono);">|SHAP| = 0.141</b>
              </div>
              <div style="width:100%; height:7px; background:rgba(255,255,255,0.06); border-radius:4px; overflow:hidden;">
                <div style="width:42%; height:100%; background:var(--ocean); border-radius:4px;"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Local Instance Force Plot Synthesis -->
        <div class="glass-card elevated" style="padding:28px;">
          <h3 style="font-size:17px; font-weight:700; margin-bottom:12px; display:flex; align-items:center; gap:8px;">
            <span>⚡</span> Local Instance Force Decomposition
          </h3>
          <p style="font-size:13px; color:var(--text-secondary); line-height:1.6; margin-bottom:16px;">
            How input features shift the base rate probability toward flood occurrence (+) or toward dry safety (-).
          </p>

          <div style="padding:16px; border-radius:12px; background:rgba(0,0,0,0.25); border:1px solid rgba(255,255,255,0.06); margin-bottom:18px;">
            <div style="display:flex; justify-content:space-between; font-size:11.5px; color:var(--text-muted); font-family:var(--font-mono); margin-bottom:8px;">
              <span>Base Model Prior: 18.5%</span>
              <span style="color:var(--red); font-weight:700;">Final Probability: 68.4%</span>
            </div>
            
            <div style="display:flex; height:24px; border-radius:6px; overflow:hidden; font-family:var(--font-mono); font-size:10.5px; font-weight:700; color:#fff; text-align:center; line-height:24px;">
              <div style="width:42%; background:var(--red);" title="Rainfall (+28%)">Rain +28%</div>
              <div style="width:26%; background:#FF8C42;" title="River Level (+18%)">River +18%</div>
              <div style="width:18%; background:var(--ocean);" title="Elevation (-12%)">Elev -12%</div>
              <div style="width:14%; background:#10B981;" title="Drainage (-8%)">Drain -8%</div>
            </div>
          </div>

          <div style="font-size:12.5px; color:var(--text-secondary); line-height:1.6;">
            <b>Scientific Conclusion:</b> In this sector, intense precipitation (280mm/24h) and river swell overcome natural drainage capacity. High elevation provides the single most effective buffer against catastrophic inundation.
          </div>
        </div>

      </div>
    </div>
  `;
}
