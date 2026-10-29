/**
 * FLOODAI — Application Bootstrap & Orchestrator
 * v2.8.0 — URL-driven startup, session restoration, and route persistence.
 *
 * Startup sequence:
 * 1. Attach popstate handler (Back / Forward support)
 * 2. Resolve initial page from browser URL
 * 3. Restore session from localStorage (already done in state.js)
 * 4. Validate JWT expiry; clear stale sessions
 * 5. Resolve and enforce access to the requested URL
 * 6. Render shell + page (correct screen, not always splash)
 * 7. Load dynamic data & re-render to populate live content
 * 8. Initialize Firebase Cloud Messaging
 */

(async function bootstrapApp() {
  console.log('[FloodAI] Initializing Modular Frontend Architecture v2.8...');

  // 0. Attach popstate handler immediately so Back/Forward work throughout the session
  if (typeof attachPopstateHandler === 'function') {
    attachPopstateHandler();
  }

  // 1. Resolve the page to display on startup from the browser URL
  //    resolveInitialPage() returns null for '/' (use default logic), or a page ID.
  let startPage = null;
  if (typeof resolveInitialPage === 'function') {
    startPage = resolveInitialPage();
  }

  // 2. Session validation — verify stored JWT isn't expired before using it
  if (state.token && state.user) {
    try {
      const parts = state.token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          // Expired — clear session silently
          console.warn('[FloodAI] Stored JWT is expired. Clearing session.');
          state.token = null;
          state.user = null;
          localStorage.removeItem('floodai-token');
          localStorage.removeItem('floodai-user');
        }
      }
    } catch (_) {}
  }

  // 3. Determine the effective start page
  if (!startPage || startPage === 'splash') {
    // No specific URL was requested — use role-based home or splash
    if (state.token && state.user && state.user.role) {
      const role = state.user.role;
      if (role === 'admin') {
        startPage = 'admin-ops';
      } else if (role === 'analyst') {
        startPage = 'analyst-predict';
      } else {
        startPage = 'resident-risk';
      }
    } else {
      startPage = 'splash'; // Unauthenticated: show splash/onboarding flow
    }
  } else {
    // A specific URL was requested (e.g. /admin, /resident, /analyst)
    // Apply access control: if the user isn't allowed, redirect appropriately
    if (typeof checkRouteAccess === 'function') {
      const check = checkRouteAccess(startPage);
      if (!check.allowed) {
        if (check.reason === 'unauthenticated') {
          // Save the requested page and redirect to login
          state.redirectAfterLogin = startPage;
          startPage = 'login';
        } else if (check.reason === 'unauthorized') {
          // Wrong role — send to their own home
          const role = state.user?.role || 'resident';
          startPage = (typeof getRoleHomeScreen === 'function')
            ? getRoleHomeScreen(role)
            : 'home';
        } else if (check.reason === 'expired') {
          state.redirectAfterLogin = startPage;
          startPage = 'login';
        }
      }
    }
  }

  // 4. Set state.page and replace the history entry to canonicalize the URL
  state.page = startPage;
  if (typeof replaceRoute === 'function') {
    replaceRoute(startPage);
  }

  // 5. Initial Shell & Page Render (Displays correct screen immediately)
  try {
    renderShell();
    renderPage();

    // If startup resolved to login and we have a redirect target, open auth modal
    if (startPage === 'login' && state.redirectAfterLogin) {
      if (typeof openAuthModal === 'function') {
        setTimeout(() => openAuthModal('login', state.redirectAfterLogin), 150);
      }
    }
  } catch (renderErr) {
    console.error('[FloodAI] Initial shell render error:', renderErr);
  }

  // 6. Check Backend API Connectivity
  try {
    await checkApiHealth();
  } catch (healthErr) {
    console.warn('[FloodAI] API Health check warning:', healthErr.message);
  }

  // 7. Dynamic Data Bootstrap (100% Data-Driven from MongoDB Atlas & ML microservice)
  try {
    await bootstrapDynamicData();
    console.log(`[FloodAI] Successfully bootstrapped ${DISTRICTS.length} monitored disaster sectors.`);

    // Refresh views now that dynamic data stores are populated
    renderShell();
    renderPage();
  } catch (bootstrapErr) {
    console.error('[FloodAI] Data bootstrap notice:', bootstrapErr.message);
  }

  // 8. Initialize Firebase Cloud Messaging
  try {
    initFirebase();
  } catch (fcmErr) {
    console.warn('[FloodAI] Firebase messaging init warning:', fcmErr.message);
  }

  // 9. Check System Permissions Badge
  try {
    updatePermissionsHeaderBadge();
  } catch (permErr) {
    console.warn('[FloodAI] Perms check warning:', permErr.message);
  }

  console.log('[FloodAI] Platform is live and operational.');
})();
