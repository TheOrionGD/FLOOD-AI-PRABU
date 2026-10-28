/**
 * Test Suite: Light Theme Particle Engine Colors & Contrast Verification
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('==================================================================');
console.log('STARTING LIGHT THEME PARTICLE ENGINE VERIFICATION SUITE');
console.log('==================================================================');

// 1. Mock DOM environment
global.document = {
  documentElement: {
    classList: {
      _classes: new Set(['light']),
      contains(c) { return this._classes.has(c); },
      add(c) { this._classes.add(c); },
      remove(c) { this._classes.delete(c); }
    },
    getAttribute(attr) { return 'ocean'; }
  },
  getElementById(id) {
    return {
      id,
      style: {},
      getContext: () => mockCtx,
      innerHTML: '',
      classList: { contains: () => false, add: () => {}, remove: () => {} }
    };
  },
  createElement(tag) {
    return { id: '', style: {}, getContext: () => mockCtx };
  },
  body: { prepend: () => {} },
  addEventListener: () => {}
};

global.window = {
  addEventListener: () => {},
  matchMedia: () => ({ matches: false }),
  innerWidth: 1920,
  innerHeight: 1080
};

global.localStorage = {
  getItem: (k) => k === 'floodai-theme' ? 'light' : null,
  setItem: () => {}
};

global.performance = { now: () => Date.now() };
global.requestAnimationFrame = () => 1;
global.cancelAnimationFrame = () => {};

const mockCtx = {
  strokes: [],
  fills: [],
  linearGradients: [],
  radialGradients: [],
  createLinearGradient(x0, y0, x1, y1) {
    const stops = [];
    const grad = {
      addColorStop(offset, color) { stops.push({ offset, color }); },
      stops
    };
    mockCtx.linearGradients.push(grad);
    return grad;
  },
  createRadialGradient(x0, y0, r0, x1, y1, r1) {
    const stops = [];
    const grad = {
      addColorStop(offset, color) { stops.push({ offset, color }); },
      stops
    };
    mockCtx.radialGradients.push(grad);
    return grad;
  },
  clearRect() {},
  fillRect() {},
  setTransform() {},
  scale() {},
  beginPath() {},
  moveTo() {},
  lineTo() {},
  stroke() {},
  fill() {},
  arc() {},
  ellipse() {}
};

// Evaluate particleService.js in this sandbox
const code = fs.readFileSync(path.join(__dirname, '..', 'frontend/js/services/particleService.js'), 'utf8');
eval(code);

// Test 1: Light Theme Detection
const engine = window.climateParticleEngine;
assert.strictEqual(engine.isLightTheme(), true, 'Engine must detect light theme when html has light class');
console.log('[PASS] Engine accurately detects light theme');

// Test 2: Rain Particle Colors in Light Theme
mockCtx.linearGradients = [];
engine.renderRainParticle(mockCtx, {
  x: 100, y: 100, vx: 2, len: 25, size: 2, opacity: 0.8
});
assert(mockCtx.linearGradients.length > 0, 'Rain particle must generate a gradient');
const rainGrad = mockCtx.linearGradients[0];
const hasOceanBlue = rainGrad.stops.some(s => s.color.includes('2, 132, 199') || s.color.includes('3, 105, 161') || s.color.includes('12, 74, 110'));
assert(hasOceanBlue, 'Rain gradient must contain high-contrast ocean cerulean / maritime blue in light theme');
console.log('[PASS] Rain particle renders with high-contrast ocean cerulean in light theme');

// Test 3: Snow Particle in Light Theme
mockCtx.radialGradients = [];
engine.renderSnowParticle(mockCtx, {
  x: 150, y: 150, radius: 4, opacity: 0.7
});
assert(mockCtx.radialGradients.length > 0, 'Snow particle must generate a crystalline gradient');
const snowGrad = mockCtx.radialGradients[0];
const hasIceBlue = snowGrad.stops.some(s => s.color.includes('186, 230, 253') || s.color.includes('125, 170, 215'));
assert(hasIceBlue, 'Snow particle must use multi-tonal crystalline ice-blue gradient in light theme');
console.log('[PASS] Snow particle renders with crystalline multi-tonal ice gradient in light theme');

// Test 4: Fog Particle in Light Theme
mockCtx.radialGradients = [];
engine.renderFogParticle(mockCtx, {
  x: 200, y: 200, radius: 100, opacity: 0.05
});
const fogGrad = mockCtx.radialGradients[0];
const hasSlateMist = fogGrad.stops.some(s => s.color.includes('148, 163, 184') || s.color.includes('186, 205, 225'));
assert(hasSlateMist, 'Fog particle must use maritime slate-mist in light theme');
console.log('[PASS] Fog particle renders with maritime slate-mist gradient in light theme');

// Test 5: Heat Particle in Light Theme
mockCtx.radialGradients = [];
engine.renderHeatParticle(mockCtx, {
  x: 300, y: 300, radius: 3, opacity: 0.6, hue: 35, seed: 1
}, 10);
const heatGrad = mockCtx.radialGradients[0];
const hasAmberThermal = heatGrad.stops.some(s => s.color.includes('45%') || s.color.includes('38%'));
assert(hasAmberThermal, 'Heat particle must use deeper saturated amber/terracotta thermals in light theme');
console.log('[PASS] Heat particle renders with saturated amber/terracotta in light theme');

// Test 6: Mote Ambient Particle in Light Theme
mockCtx.radialGradients = [];
engine.renderMoteParticle(mockCtx, {
  x: 400, y: 400, radius: 3, opacity: 0.5, hue: 42, seed: 2
}, 10);
const moteGrad = mockCtx.radialGradients[0];
const hasGoldAura = moteGrad.stops.some(s => s.color.includes('45%') || s.color.includes('50%'));
assert(hasGoldAura, 'Mote particle must use warm golden sunlight aura in light theme');
console.log('[PASS] Ambient mote particle renders with warm golden sunlight core in light theme');

// Test 7: Splash Ripples in Light Theme
engine.splashPool = [{ active: false, x: 0, y: 0, rx: 0, ry: 0, maxR: 0, opacity: 0, color: '' }];
engine.activeSplashes = [];
engine.spawnSplash(250, 500, 0.8);
assert.strictEqual(engine.activeSplashes.length, 1);
assert(engine.activeSplashes[0].color.includes('2, 132, 199') || engine.activeSplashes[0].color.includes('3, 105, 161'), 'Splash ripple must use ocean blue in light theme');
console.log('[PASS] Surface splash ripples use high-contrast ocean blue in light theme');

// Test 8: UI Badge in Light Theme
const badgeElem = { innerHTML: '', title: '' };
document.getElementById = (id) => id === 'climateAtmospherePill' ? badgeElem : null;
engine.currentCondition = 'snow';
engine.climateState = { temperature: -2, location: { name: 'Ooty', source: 'gps' } };
engine.updateUIBadge();
assert(badgeElem.innerHTML.includes('#0284C7'), 'Snowfall label color must be #0284C7 for high contrast in light theme');
console.log('[PASS] UI Badge adopts high-contrast accessible typography colors in light theme');

// Test 9: Toggle back to Dark Theme
document.documentElement.classList.remove('light');
assert.strictEqual(engine.isLightTheme(), false, 'Engine must accurately detect dark theme when light class is removed');
engine.updateUIBadge();
assert(badgeElem.innerHTML.includes('#E0F2FE'), 'Snowfall label color reverts to soft cyan-white #E0F2FE in dark theme');
console.log('[PASS] Engine seamlessly transitions between Light and Dark themes dynamically');

console.log('==================================================================');
console.log('ALL 9 LIGHT THEME PARTICLE TESTS PASSED!');
console.log('==================================================================');
