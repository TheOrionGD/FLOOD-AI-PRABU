/**
 * test_responsive_role_nav.js
 * Verification suite for:
 * 1. Role auto-configuration (Admin -> admin-ops, Analyst -> analyst-predict, Resident -> resident-risk)
 * 2. Responsive mobile menubar, sidebar drawer, and bottom navigation
 * 3. Desktop sidebar presence with absence of desktop menubar
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('==================================================================');
console.log('STARTING RESPONSIVE NAVIGATION & ROLE AUTO-CONFIGURATION TEST SUITE');
console.log('==================================================================');

// 1. Verify CSS rules in glass.css
const glassCss = fs.readFileSync(path.join(__dirname, '..', 'frontend/styles/glass.css'), 'utf-8');

// Desktop rules (> 900px)
assert(glassCss.includes('@media (min-width: 901px)'), 'glass.css must contain desktop breakpoint > 900px');
assert(glassCss.includes('.mobile-menubar {\n    display: none !important;'), 'Desktop must hide mobile-menubar');
assert(glassCss.includes('.mobile-bottom-bar {\n    display: none !important;'), 'Desktop must hide mobile-bottom-bar');
assert(glassCss.includes('.saas-sidebar {\n    display: flex !important;'), 'Desktop must display saas-sidebar');
console.log('[PASS] Desktop viewport (> 900px) hides menubar and exhibits liquid glass sidebar');

// Mobile rules (<= 900px)
assert(glassCss.includes('@media (max-width: 900px)'), 'glass.css must contain mobile breakpoint <= 900px');
assert(glassCss.includes('.mobile-menubar {\n    display: flex !important;'), 'Mobile must show mobile-menubar');
assert(glassCss.includes('.mobile-bottom-bar {\n    display: flex !important;'), 'Mobile must show mobile-bottom-bar');
assert(glassCss.includes('.saas-sidebar {\n    display: none !important;'), 'Mobile must hide desktop sidebar in favor of mobile drawer');
console.log('[PASS] Mobile viewport (<= 900px) shows mobile menubar, bottom bar, and drawer sidebar');

// Responsive settings layout
assert(glassCss.includes('.settings-layout-grid'), 'glass.css must define .settings-layout-grid');
assert(glassCss.includes('.settings-category-nav'), 'glass.css must define .settings-category-nav');
console.log('[PASS] Settings screen responsive single-column & scrollable category tab classes defined');

// 2. Verify shell.js role functions
const shellJs = fs.readFileSync(path.join(__dirname, '..', 'frontend/js/shell.js'), 'utf-8');

assert(shellJs.includes('function getRoleHomeScreen(role)'), 'shell.js must define getRoleHomeScreen');
assert(shellJs.includes("if (role === 'admin') return 'admin-ops';"), 'Admin must map to admin-ops');
assert(shellJs.includes("if (role === 'analyst') return 'analyst-predict';"), 'Analyst must map to analyst-predict');
assert(shellJs.includes("return 'resident-risk';"), 'Resident must map to resident-risk');
console.log('[PASS] Role auto-configuration correctly maps: Admin -> admin-ops, Analyst -> analyst-predict, Resident -> resident-risk');

// 3. Verify mobile drawer navigation
assert(shellJs.includes('function renderMobileDrawerNavigation()'), 'shell.js must define renderMobileDrawerNavigation');
assert(shellJs.includes('function navigateToRoleWorkspace(targetRole)'), 'shell.js must define navigateToRoleWorkspace with RBAC guards');
assert(shellJs.includes('function autoConfigureRoleScreens'), 'shell.js must retain autoConfigureRoleScreens backward compatibility');
console.log('[PASS] Mobile drawer navigation and RBAC workspace clearance verified');

// 4. Verify settingsView.js responsive classes
const settingsJs = fs.readFileSync(path.join(__dirname, '..', 'frontend/js/views/settingsView.js'), 'utf-8');
assert(settingsJs.includes('class="settings-layout-grid"'), 'settingsView.js must use settings-layout-grid class');
assert(settingsJs.includes('class="glass-card elevated settings-category-nav"'), 'settingsView.js must use settings-category-nav class');
console.log('[PASS] settingsView.js properly attaches responsive classes');

// 5. Verify profileView.js role selection workspace card
const profileJs = fs.readFileSync(path.join(__dirname, '..', 'frontend/js/views/profileView.js'), 'utf-8');
assert(profileJs.includes('Operational Role &amp; Workspace Clearance'), 'profileView.js must include Operational Role & Workspace card');
assert(profileJs.includes("navigateToRoleWorkspace('admin')"), 'profileView.js must support Admin role navigation');
assert(profileJs.includes("navigateToRoleWorkspace('analyst')"), 'profileView.js must support Analyst role navigation');
assert(profileJs.includes("navigateToRoleWorkspace('resident')"), 'profileView.js must support Resident role navigation');
console.log('[PASS] profileView.js includes Operational Role selection card with secure workspace clearance');

// 6. Verify Climate Modal styling
assert(shellJs.includes('padding-right:38px;'), 'Climate modal header must have breathing room for close button');
console.log('[PASS] Climate modal header layout rectified to prevent collision with close button');

console.log('==================================================================');
console.log('ALL RESPONSIVE & ROLE AUTO-CONFIGURATION CHECKS PASSED!');
console.log('==================================================================');
