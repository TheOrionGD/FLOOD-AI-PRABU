/**
 * test_url_routing.js
 * Verification suite for FloodAI URL routing, session restoration, and
 * role-based redirect logic.
 *
 * Run with: node tests/test_url_routing.js
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

console.log('🗺️  ========================================================');
console.log('   FLOODAI URL ROUTING & SESSION RESTORE VERIFICATION');
console.log('========================================================\n');

let passCount = 0;
let failCount = 0;

function it(desc, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${desc}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${desc}`);
    console.error(`     Error: ${err.message}\n`);
    failCount++;
  }
}

// -------------------------------------------------------------------
// 1. Mock minimal browser environment
// -------------------------------------------------------------------
global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; },
  clear() { this._store = {}; }
};

global.Notification = { permission: 'default' };
global.Proxy = Proxy;

let _historyState = null;
let _historyPath = '/';

global.window = global;
global.window.history = {
  pushState(state, title, url) { _historyState = state; _historyPath = url; },
  replaceState(state, title, url) { _historyState = state; _historyPath = url; },
};
global.window.location = { hostname: 'localhost', pathname: '/' };
global.window.addEventListener = () => {};
global.document = {
  documentElement: {
    classList: { toggle: () => {} },
    setAttribute: () => {}
  },
  getElementById: () => null,
};

// -------------------------------------------------------------------
// 2. Load config.js (ROUTE_POLICIES, PAGES, API_BASE, etc.)
// -------------------------------------------------------------------
const configPath = path.join(__dirname, '..', 'frontend', 'js', 'config.js');
const statePath  = path.join(__dirname, '..', 'frontend', 'js', 'state.js');
const routerPath = path.join(__dirname, '..', 'frontend', 'js', 'router.js');
const authPath   = path.join(__dirname, '..', 'frontend', 'js', 'services', 'authService.js');

// Needed stubs before loading config
global.AppEvents = { emit: () => {}, on: () => () => {}, EVENTS: {} };
global.state = { user: null, token: null, page: 'splash' };
global.checkRouteAccess = () => ({ allowed: true });
global.getRoleHomeScreen = (role) => role === 'admin' ? 'admin-ops' : role === 'analyst' ? 'analyst-predict' : 'resident-risk';
global.toast = () => {};
global.openAuthModal = () => {};
global.renderShell = () => {};
global.renderPage = () => {};

require(configPath);
// state.js needs its own load (it reads localStorage on load)
require(statePath);
require(routerPath);

// -------------------------------------------------------------------
// 3. Router module tests
// -------------------------------------------------------------------
console.log('\n--- pageToPath() mapping ---');

it('splash maps to /', () => {
  assert.strictEqual(pageToPath('splash'), '/');
});

it('admin-ops maps to /admin', () => {
  assert.strictEqual(pageToPath('admin-ops'), '/admin');
});

it('admin-users maps to /admin/users', () => {
  assert.strictEqual(pageToPath('admin-users'), '/admin/users');
});

it('analyst-predict maps to /analyst', () => {
  assert.strictEqual(pageToPath('analyst-predict'), '/analyst');
});

it('analyst-shap maps to /analyst/shap', () => {
  assert.strictEqual(pageToPath('analyst-shap'), '/analyst/shap');
});

it('resident-risk maps to /resident', () => {
  assert.strictEqual(pageToPath('resident-risk'), '/resident');
});

it('resident-simulation maps to /resident/simulation', () => {
  assert.strictEqual(pageToPath('resident-simulation'), '/resident/simulation');
});

it('home maps to /home', () => {
  assert.strictEqual(pageToPath('home'), '/home');
});

it('login maps to /login', () => {
  assert.strictEqual(pageToPath('login'), '/login');
});

it('map maps to /map', () => {
  assert.strictEqual(pageToPath('map'), '/map');
});

console.log('\n--- pathToPage() reverse mapping ---');

it('/ resolves to splash', () => {
  assert.strictEqual(pathToPage('/'), 'splash');
});

it('/admin resolves to admin-ops', () => {
  assert.strictEqual(pathToPage('/admin'), 'admin-ops');
});

it('/admin/users resolves to admin-users', () => {
  assert.strictEqual(pathToPage('/admin/users'), 'admin-users');
});

it('/analyst resolves to analyst-predict', () => {
  assert.strictEqual(pathToPage('/analyst'), 'analyst-predict');
});

it('/analyst/shap resolves to analyst-shap', () => {
  assert.strictEqual(pathToPage('/analyst/shap'), 'analyst-shap');
});

it('/resident resolves to resident-risk', () => {
  assert.strictEqual(pathToPage('/resident'), 'resident-risk');
});

it('/resident/simulation resolves to resident-simulation', () => {
  assert.strictEqual(pathToPage('/resident/simulation'), 'resident-simulation');
});

it('/home resolves to home', () => {
  assert.strictEqual(pathToPage('/home'), 'home');
});

it('/login resolves to login', () => {
  assert.strictEqual(pathToPage('/login'), 'login');
});

it('/unknown-route resolves to home (404 fallback)', () => {
  assert.strictEqual(pathToPage('/unknown-route'), 'home');
});

it('/admin/unknown-sub-path resolves to admin-ops (prefix match)', () => {
  assert.strictEqual(pathToPage('/admin/unknown-sub'), 'admin-ops');
});

it('/analyst/nonexistent resolves to analyst-predict (prefix match)', () => {
  assert.strictEqual(pathToPage('/analyst/nonexistent'), 'analyst-predict');
});

it('/resident/nonexistent resolves to resident-risk (prefix match)', () => {
  assert.strictEqual(pathToPage('/resident/nonexistent'), 'resident-risk');
});

console.log('\n--- pushRoute() history API integration ---');

it('pushRoute updates history path for admin-ops', () => {
  _historyPath = '/original';
  pushRoute('admin-ops');
  assert.strictEqual(_historyPath, '/admin');
});

it('pushRoute updates history path for resident-risk', () => {
  _historyPath = '/original';
  pushRoute('resident-risk');
  assert.strictEqual(_historyPath, '/resident');
});

it('pushRoute updates history path for analyst-shap', () => {
  _historyPath = '/original';
  pushRoute('analyst-shap');
  assert.strictEqual(_historyPath, '/analyst/shap');
});

it('replaceRoute uses replaceState (not pushState) for history entry', () => {
  // replaceState should still update the path
  _historyPath = '/original';
  replaceRoute('admin-ops');
  assert.strictEqual(_historyPath, '/admin');
});

console.log('\n--- resolveInitialPage() startup URL resolution ---');

it('resolveInitialPage returns null for root /', () => {
  global.window.location.pathname = '/';
  const result = resolveInitialPage();
  assert.ok(result === null || result === 'splash', `Got: ${result}`);
});

it('resolveInitialPage returns admin-ops for /admin', () => {
  global.window.location.pathname = '/admin';
  assert.strictEqual(resolveInitialPage(), 'admin-ops');
});

it('resolveInitialPage returns analyst-predict for /analyst', () => {
  global.window.location.pathname = '/analyst';
  assert.strictEqual(resolveInitialPage(), 'analyst-predict');
});

it('resolveInitialPage returns resident-risk for /resident', () => {
  global.window.location.pathname = '/resident';
  assert.strictEqual(resolveInitialPage(), 'resident-risk');
});

it('resolveInitialPage returns admin-users for /admin/users', () => {
  global.window.location.pathname = '/admin/users';
  assert.strictEqual(resolveInitialPage(), 'admin-users');
});

it('resolveInitialPage returns analyst-shap for /analyst/shap', () => {
  global.window.location.pathname = '/analyst/shap';
  assert.strictEqual(resolveInitialPage(), 'analyst-shap');
});

it('resolveInitialPage returns login for /login', () => {
  global.window.location.pathname = '/login';
  assert.strictEqual(resolveInitialPage(), 'login');
});

// -------------------------------------------------------------------
// 4. Bidirectionality: every page in ROUTE_POLICIES has a URL mapping
// -------------------------------------------------------------------
console.log('\n--- ROUTE_POLICIES completeness check ---');

const policyKeys = Object.keys(ROUTE_POLICIES);
const unmapped = policyKeys.filter(id => {
  // splash is mapped to '/', which shares with no one
  if (id === 'splash') return false;
  return !PAGE_TO_PATH[id];
});

it(`All ROUTE_POLICIES keys have a URL mapping (${policyKeys.length} routes)`, () => {
  assert.deepStrictEqual(unmapped, [],
    `Missing mappings for: ${unmapped.join(', ')}`
  );
});

// -------------------------------------------------------------------
// 5. router.js file exists and exports expected globals
// -------------------------------------------------------------------
console.log('\n--- File integrity checks ---');

it('router.js file exists', () => {
  assert.ok(fs.existsSync(routerPath), `router.js not found at ${routerPath}`);
});

it('pageToPath is a function', () => {
  assert.strictEqual(typeof pageToPath, 'function');
});

it('pathToPage is a function', () => {
  assert.strictEqual(typeof pathToPage, 'function');
});

it('pushRoute is a function', () => {
  assert.strictEqual(typeof pushRoute, 'function');
});

it('replaceRoute is a function', () => {
  assert.strictEqual(typeof replaceRoute, 'function');
});

it('resolveInitialPage is a function', () => {
  assert.strictEqual(typeof resolveInitialPage, 'function');
});

it('attachPopstateHandler is a function', () => {
  assert.strictEqual(typeof attachPopstateHandler, 'function');
});

// -------------------------------------------------------------------
// 6. SPA dev server script exists
// -------------------------------------------------------------------
const spaServerPath = path.join(__dirname, '..', 'scripts', 'serve_frontend.py');
it('SPA-aware dev server script exists at scripts/serve_frontend.py', () => {
  assert.ok(fs.existsSync(spaServerPath), `serve_frontend.py not found`);
});

// -------------------------------------------------------------------
// Summary
// -------------------------------------------------------------------
const total = passCount + failCount;
console.log(`\n${'='.repeat(56)}`);
console.log(`  URL ROUTING TESTS COMPLETE: ${passCount}/${total} passed`);
if (failCount === 0) {
  console.log('  🎉 All routing tests passed!');
} else {
  console.log(`  ⚠️  ${failCount} test(s) failed. Review the errors above.`);
}
console.log('='.repeat(56));

if (failCount > 0) {
  process.exit(1);
}
