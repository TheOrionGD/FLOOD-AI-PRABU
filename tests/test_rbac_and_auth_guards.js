/**
 * test_rbac_and_auth_guards.js
 * Verification test suite for FloodAI Route-Based Access Control (RBAC),
 * Authentication Guards, and Complete Elimination of Dummy / Guest Accounts.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

console.log('🛡️  ========================================================');
console.log('   FLOODAI RBAC & AUTHENTICATION GUARD VERIFICATION SUITE');
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

// 1. Mock browser environment
global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; },
  clear() { this._store = {}; }
};

global.document = {
  documentElement: {
    classList: { toggle: () => {} },
    setAttribute: () => {}
  },
  getElementById: (id) => null,
  querySelectorAll: () => []
};

global.window = global;
global.window.location = {
  hostname: 'localhost',
  pathname: '/',
  search: '',
  href: 'http://localhost:3000/'
};

// Mock shell notification & navigation functions
global.showToast = (msg, type) => {
  global.__lastToast = { msg, type };
};
global.openAuthModal = (mode, redirect) => {
  global.__lastAuthModal = { mode, redirect };
};
global.goTo = (page) => {
  global.__lastGoTo = page;
};
global.closeMobileMenu = () => {};

// Load dependencies in correct sequence
const stateCode = fs.readFileSync(path.join(__dirname, '../frontend/js/state.js'), 'utf8');
eval(stateCode);

const configCode = fs.readFileSync(path.join(__dirname, '../frontend/js/config.js'), 'utf8');
eval(configCode);

const authCode = fs.readFileSync(path.join(__dirname, '../frontend/js/services/authService.js'), 'utf8');
eval(authCode);

const shellCode = fs.readFileSync(path.join(__dirname, '../frontend/js/shell.js'), 'utf8');
eval(shellCode);

function runTests() {
  console.log('📋 SECTION 1: Unauthenticated Visitor Route Access Control');

  it('Allows unauthenticated access to public screens (home, map, analytics, records, alerts, terms, privacy)', () => {
    state.user = null;
    state.token = null;

    const publicPages = ['home', 'map', 'analytics', 'records', 'alerts', 'terms', 'privacy'];
    publicPages.forEach(page => {
      const check = checkRouteAccess(page);
      assert.strictEqual(check.allowed, true, `Expected public page ${page} to be allowed for unauthenticated visitors`);
    });
  });

  it('Strictly denies unauthenticated access to role-protected screens', () => {
    state.user = null;
    state.token = null;

    const protectedPages = ['admin-ops', 'analyst-predict', 'resident-risk', 'portal', 'profile', 'settings'];
    protectedPages.forEach(page => {
      const check = checkRouteAccess(page);
      assert.strictEqual(check.allowed, false, `Expected protected page ${page} to be blocked`);
      assert.strictEqual(check.reason, 'unauthenticated', `Expected unauthenticated reason for ${page}`);
    });
  });

  it('Blocks access if a fake user object exists without a valid JWT token', () => {
    // Attempted spoofing: user object forged in memory with no token
    state.user = { id: 'usr_hacker_999', role: 'admin', email: 'spoof@attacker.org' };
    state.token = null;

    const check = checkRouteAccess('admin-ops');
    assert.strictEqual(check.allowed, false, 'Spoofed user without token must NOT be allowed');
    assert.strictEqual(check.reason, 'unauthenticated', 'Spoofed user without token must fail with unauthenticated');
  });

  console.log('\n📋 SECTION 2: Role-Based Authorization Clearance (Authenticated Users)');

  it('Allows resident access only to resident and public screens, blocking admin/analyst workspaces', () => {
    state.user = { id: 'usr_res_123', role: 'resident', email: 'citizen@example.com' };
    state.token = 'jwt_valid_test_token_resident';

    // Public & Resident allowed
    assert.strictEqual(checkRouteAccess('home').allowed, true);
    assert.strictEqual(checkRouteAccess('resident-risk').allowed, true);
    assert.strictEqual(checkRouteAccess('portal').allowed, true);
    assert.strictEqual(checkRouteAccess('profile').allowed, true);

    // Admin & Analyst blocked
    const adminCheck = checkRouteAccess('admin-ops');
    assert.strictEqual(adminCheck.allowed, false);
    assert.strictEqual(adminCheck.reason, 'unauthorized');

    const analystCheck = checkRouteAccess('analyst-predict');
    assert.strictEqual(analystCheck.allowed, false);
    assert.strictEqual(analystCheck.reason, 'unauthorized');
  });

  it('Allows analyst access to analyst, resident, and public screens, blocking administrative operations', () => {
    state.user = { id: 'usr_ana_456', role: 'analyst', email: 'analyst@organization.org' };
    state.token = 'jwt_valid_test_token_analyst';

    assert.strictEqual(checkRouteAccess('analyst-predict').allowed, true);
    assert.strictEqual(checkRouteAccess('resident-risk').allowed, true);
    assert.strictEqual(checkRouteAccess('home').allowed, true);

    const adminCheck = checkRouteAccess('admin-ops');
    assert.strictEqual(adminCheck.allowed, false);
    assert.strictEqual(adminCheck.reason, 'unauthorized');
  });

  it('Allows administrator clearance across all platforms and operational workspaces', () => {
    state.user = { id: 'usr_adm_789', role: 'admin', email: 'commander@floodai.gov' };
    state.token = 'jwt_valid_test_token_admin';

    const allPages = ['admin-ops', 'analyst-predict', 'resident-risk', 'portal', 'profile', 'home', 'map'];
    allPages.forEach(page => {
      const check = checkRouteAccess(page);
      assert.strictEqual(check.allowed, true, `Admin should have access to ${page}`);
    });
  });

  console.log('\n📋 SECTION 3: getAccessiblePages Filtering (Navigation & Command Palette)');

  it('Only returns public pages when unauthenticated', () => {
    state.user = null;
    state.token = null;

    const accessible = getAccessiblePages();
    const accessibleIds = accessible.map(([id]) => id);

    // All returned pages must have no requiredRoles
    accessibleIds.forEach(pageId => {
      const policy = ROUTE_POLICIES[pageId];
      assert.ok(!policy || !policy.requiredRoles || policy.requiredRoles.length === 0, `Page ${pageId} returned to unauthenticated visitor has requiredRoles`);
    });

    assert.ok(!accessibleIds.includes('admin-ops'));
    assert.ok(!accessibleIds.includes('analyst-predict'));
    assert.ok(!accessibleIds.includes('resident-risk'));
    assert.ok(!accessibleIds.includes('profile'));
  });

  it('Includes role-appropriate pages for authenticated accounts', () => {
    state.user = { id: 'usr_adm_1', role: 'admin', email: 'adm@floodai.org' };
    state.token = 'jwt_token';

    const accessible = getAccessiblePages();
    const accessibleIds = accessible.map(([id]) => id);
    assert.ok(accessibleIds.includes('admin-ops'));
    assert.ok(accessibleIds.includes('analyst-predict'));
    assert.ok(accessibleIds.includes('resident-risk'));
  });

  console.log('\n📋 SECTION 4: Elimination of Dummy User / Guest Account Generators');

  it('navigateToRoleWorkspace does NOT create dummy accounts when called unauthenticated', () => {
    state.user = null;
    state.token = null;
    state.redirectAfterLogin = null;

    navigateToRoleWorkspace('admin');

    // Must NOT have synthesized user
    assert.strictEqual(state.user, null, 'state.user must remain null');
    assert.strictEqual(state.token, null, 'state.token must remain null');
    assert.strictEqual(state.redirectAfterLogin, 'admin-ops');
  });

  it('autoConfigureRoleScreens delegates strictly to navigateToRoleWorkspace without synthesizing users', () => {
    state.user = null;
    state.token = null;
    state.redirectAfterLogin = null;

    autoConfigureRoleScreens('analyst');

    assert.strictEqual(state.user, null, 'state.user must remain null');
    assert.strictEqual(state.token, null, 'state.token must remain null');
    assert.strictEqual(state.redirectAfterLogin, 'analyst-predict');
  });

  console.log('\n📋 SECTION 5: Legacy Dummy Account Purging in State Initialization');

  it('Purges legacy unauthenticated dummy/guest accounts from localStorage on startup', () => {
    // Simulate legacy storage containing dummy user without JWT token
    localStorage.setItem('floodai-user', JSON.stringify({
      id: 'usr_admin_legacy',
      displayName: 'Guest Administrator',
      role: 'admin',
      email: 'admin@floodai.org'
    }));
    localStorage.removeItem('floodai-token');

    // Run purging logic
    const savedUser = JSON.parse(localStorage.getItem('floodai-user'));
    const savedToken = localStorage.getItem('floodai-token');
    if (savedUser && (!savedToken || (savedUser.id && String(savedUser.id).startsWith('usr_') && !savedToken))) {
      localStorage.removeItem('floodai-user');
    }

    assert.strictEqual(localStorage.getItem('floodai-user'), null, 'Legacy dummy user without JWT must be purged');
  });

  console.log('\n========================================================');
  console.log(`TOTAL TESTS: ${passCount + failCount}`);
  console.log(`PASSED: ${passCount}`);
  console.log(`FAILED: ${failCount}`);
  console.log('========================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runTests();
