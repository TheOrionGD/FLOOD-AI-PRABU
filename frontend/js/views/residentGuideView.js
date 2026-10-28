/**
 * residentGuideView.js
 * Resident Workspace Screen 04 — Disaster Preparedness Handbook
 * Real emergency checklists, shelter guidance, and survival protocols
 */

function renderResidentGuide(root) {
  root.innerHTML = `
    <div class="saas-page-container" style="max-width:1040px;">
      <div style="margin-bottom:28px;">
        <span class="story-tag" style="color:var(--ocean); border-color:rgba(31,224,168,0.3); background:rgba(31,224,168,0.1);">
          CITIZEN SAFETY HUB • CIVIL DEFENSE
        </span>
        <h1 style="font-family:var(--font-display); font-size:28px; font-weight:700; margin-top:6px;">
          Disaster Preparedness &amp; Survival Handbook
        </h1>
        <p style="font-size:13.5px; color:var(--text-secondary);">
          Authoritative survival guidance, emergency supply checklists, and evacuation protocols.
        </p>
      </div>

      <!-- Quick Action Directory -->
      <div class="grid-cards" style="grid-template-columns:repeat(3,1fr); gap:18px; margin-bottom:28px;">
        <div class="glass-card elevated" style="border-top:3px solid var(--red);">
          <div style="font-size:24px; margin-bottom:8px;">📞</div>
          <h3 style="font-size:16px; font-weight:700; margin-bottom:4px;">Disaster Helpline</h3>
          <div style="font-family:var(--font-mono); font-size:18px; font-weight:700; color:var(--red);">1070 / 112</div>
          <p style="font-size:12px; color:var(--text-muted); margin-top:6px;">National Emergency Response &amp; Flood Relief</p>
        </div>

        <div class="glass-card elevated" style="border-top:3px solid var(--accent-primary);">
          <div style="font-size:24px; margin-bottom:8px;">🏥</div>
          <h3 style="font-size:16px; font-weight:700; margin-bottom:4px;">Ambulance / Medical</h3>
          <div style="font-family:var(--font-mono); font-size:18px; font-weight:700; color:var(--accent-primary);">108</div>
          <p style="font-size:12px; color:var(--text-muted); margin-top:6px;">24/7 Paramedic &amp; Trauma Dispatch</p>
        </div>

        <div class="glass-card elevated" style="border-top:3px solid var(--ocean);">
          <div style="font-size:24px; margin-bottom:8px;">🚒</div>
          <h3 style="font-size:16px; font-weight:700; margin-bottom:4px;">Fire &amp; Water Rescue</h3>
          <div style="font-family:var(--font-mono); font-size:18px; font-weight:700; color:var(--ocean);">101</div>
          <p style="font-size:12px; color:var(--text-muted); margin-top:6px;">Inflatable Boat &amp; Lifeline Evacuations</p>
        </div>
      </div>

      <!-- Checklists & Protocols Grid -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px;">
        
        <!-- Emergency Go-Bag Checklist -->
        <div class="glass-card elevated" style="padding:28px;">
          <h3 style="font-size:17px; font-weight:700; margin-bottom:14px; display:flex; align-items:center; gap:8px;">
            <span>🎒</span> 72-Hour Evacuation Go-Bag Checklist
          </h3>
          <p style="font-size:13px; color:var(--text-secondary); line-height:1.6; margin-bottom:18px;">
            Pack these essential items in waterproof bags before monsoon surges arrive:
          </p>

          <div style="display:flex; flex-direction:column; gap:10px;">
            <label class="glass-checkbox-wrap">
              <input type="checkbox" checked>
              <span>Drinking Water (3 liters per person per day)</span>
            </label>
            <label class="glass-checkbox-wrap">
              <input type="checkbox" checked>
              <span>Non-perishable ready-to-eat dry rations (energy bars, biscuits)</span>
            </label>
            <label class="glass-checkbox-wrap">
              <input type="checkbox" checked>
              <span>Waterproof pouch for identity documents, passports &amp; deeds</span>
            </label>
            <label class="glass-checkbox-wrap">
              <input type="checkbox">
              <span>First aid kit, antiseptic wipes &amp; 14-day prescription medications</span>
            </label>
            <label class="glass-checkbox-wrap">
              <input type="checkbox">
              <span>High-lumen waterproof LED flashlight &amp; extra lithium cells</span>
            </label>
            <label class="glass-checkbox-wrap">
              <input type="checkbox">
              <span>20,000mAh Power bank and USB cables for mobile devices</span>
            </label>
            <label class="glass-checkbox-wrap">
              <input type="checkbox">
              <span>High-decibel emergency whistle for acoustic rescue signaling</span>
            </label>
          </div>
        </div>

        <!-- Inundation Survival Instructions -->
        <div class="glass-card elevated" style="padding:28px;">
          <h3 style="font-size:17px; font-weight:700; margin-bottom:14px; display:flex; align-items:center; gap:8px;">
            <span>🌊</span> Critical Water Inundation Protocols
          </h3>

          <div style="display:flex; flex-direction:column; gap:14px;">
            <div style="padding:12px 14px; border-radius:10px; background:rgba(255,77,106,0.08); border:1px solid rgba(255,77,106,0.25);">
              <b style="color:var(--red); font-size:13px;">⚠️ Never Walk or Drive in Floodwaters</b>
              <div style="font-size:12px; color:var(--text-secondary); margin-top:4px;">
                Just 15 cm (6 inches) of moving water can knock down an adult. 30 cm (12 inches) can sweep a passenger car into deep channels.
              </div>
            </div>

            <div style="padding:12px 14px; border-radius:10px; background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.25);">
              <b style="color:var(--amber); font-size:13px;">⚡ Disconnect Electrical Mains</b>
              <div style="font-size:12px; color:var(--text-secondary); margin-top:4px;">
                Switch off main circuit breaker before water reaches ground sockets to prevent electrocution and structural fires.
              </div>
            </div>

            <div style="padding:12px 14px; border-radius:10px; background:rgba(31,224,168,0.08); border:1px solid rgba(31,224,168,0.25);">
              <b style="color:var(--ocean); font-size:13px;">🏢 Seek Vertical High Ground</b>
              <div style="font-size:12px; color:var(--text-secondary); margin-top:4px;">
                If evacuation routes are blocked, move immediately to the highest floor or reinforced roof terrace. Take your emergency go-bag and flashlight.
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;
}
