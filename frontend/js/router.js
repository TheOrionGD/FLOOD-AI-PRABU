/* ===========================================================
   FloodAI — Client-Side Router (History API + URL Persistence)
   v2.8.0

   Responsibilities:
   1. Bidirectional mapping: browser URL  <-->  internal page ID
   2. pushState on every goTo() call (URL reflects current screen)
   3. popstate handling (Back / Forward work correctly)
   4. Startup URL resolution: read the current pathname and derive
      the initial page instead of always starting at "splash"
   5. SPA fallback note for the Python dev server (handled by
      patching the startup logic here)

   Page ID → URL path mapping (adapted from ROUTE_POLICIES keys):
     splash             /
     onboarding         /onboarding
     landing            /landing
     home               /home          (also reachable at /)
     login              /login
     terms              /terms
     privacy            /privacy
     profile            /profile
     settings           /settings
     admin-ops          /admin
     admin-users        /admin/users
     admin-config       /admin/settings
     admin-alerts       /admin/alerts
     admin-audit        /admin/audit
     analyst-predict    /analyst
     analyst-shap       /analyst/shap
     analyst-comparison /analyst/comparison
     analyst-history    /analyst/history
     analyst-threat     /analyst/threat
     resident-risk      /resident
     resident-weather   /resident/weather
     resident-alerts    /resident/alerts
     resident-guide     /resident/guide
     resident-activity  /resident/activity
     resident-radar     /resident/radar
     resident-simulation /resident/simulation
     portal             /portal
     command            /command
     map                /map
     predict            /predict
     weather            /weather
     dashboard          /dashboard
     analytics          /analytics
     records            /records
     alerts             /alerts
   =========================================================== */

const PAGE_TO_PATH = {
  splash:               '/',
  onboarding:           '/onboarding',
  landing:              '/landing',
  home:                 '/home',
  login:                '/login',
  terms:                '/terms',
  privacy:              '/privacy',
  profile:              '/profile',
  settings:             '/settings',
  // Admin
  'admin-ops':          '/admin',
  'admin-users':        '/admin/users',
  'admin-config':       '/admin/settings',
  'admin-alerts':       '/admin/alerts',
  'admin-audit':        '/admin/audit',
  // Analyst
  'analyst-predict':    '/analyst',
  'analyst-shap':       '/analyst/shap',
  'analyst-comparison': '/analyst/comparison',
  'analyst-history':    '/analyst/history',
  'analyst-threat':     '/analyst/threat',
  // Resident
  'resident-risk':      '/resident',
  'resident-weather':   '/resident/weather',
  'resident-alerts':    '/resident/alerts',
  'resident-guide':     '/resident/guide',
  'resident-activity':  '/resident/activity',
  'resident-radar':     '/resident/radar',
  'resident-simulation':'/resident/simulation',
  // Preserved
  portal:               '/portal',
  command:              '/command',
  map:                  '/map',
  predict:              '/predict',
  weather:              '/weather',
  dashboard:            '/dashboard',
  analytics:            '/analytics',
  records:              '/records',
  alerts:               '/alerts',
};

// Reverse mapping: URL path → page ID
const PATH_TO_PAGE = {};
Object.keys(PAGE_TO_PATH).forEach(function(pageId) {
  const path = PAGE_TO_PATH[pageId];
  // Only register the first mapping for each path (e.g. 'splash' wins over 'home' for '/')
  if (!PATH_TO_PAGE[path]) {
    PATH_TO_PAGE[path] = pageId;
  }
});

/**
 * Convert an internal page ID to a URL pathname.
 * Falls back to '/<pageId>' for unmapped pages.
 */
function pageToPath(pageId) {
  return PAGE_TO_PATH[pageId] || ('/' + pageId);
}

/**
 * Convert a URL pathname to an internal page ID.
 * Falls back to 'home' for unknown paths.
 */
function pathToPage(pathname) {
  // Normalize: strip trailing slash except for root
  const norm = (pathname === '/' ? '/' : pathname.replace(/\/$/, ''));
  if (PATH_TO_PAGE[norm]) return PATH_TO_PAGE[norm];

  // Partial prefix matching for nested routes not explicitly mapped
  // e.g. /admin/unknown -> admin-ops
  if (norm.startsWith('/admin')) return 'admin-ops';
  if (norm.startsWith('/analyst')) return 'analyst-predict';
  if (norm.startsWith('/resident')) return 'resident-risk';

  // 404-equivalent: unknown routes default to home
  return 'home';
}

/**
 * Resolve the initial page from the current browser URL.
 * Called once at application startup BEFORE renderShell() / renderPage().
 *
 * Returns the page ID the app should display first.
 * Does NOT trigger any navigation side-effects itself.
 */
function resolveInitialPage() {
  try {
    const pathname = window.location.pathname || '/';
    const requestedPage = pathToPage(pathname);

    // Root / → use the default start page logic (splash or role home)
    if (pathname === '/' || requestedPage === 'splash') {
      return null; // caller uses its own defaultStartPage logic
    }

    return requestedPage;
  } catch (e) {
    return null;
  }
}

/**
 * Push a new history entry when the app navigates to a page.
 * Safe to call multiple times — deduplicates identical consecutive entries.
 *
 * @param {string} pageId  - Internal page ID (e.g. 'admin-ops')
 * @param {boolean} replace - If true, replace current history entry instead of pushing
 */
function pushRoute(pageId, replace) {
  try {
    const path = pageToPath(pageId);
    const currentPath = window.location.pathname;
    if (path === currentPath && !replace) return; // already there
    const stateObj = { page: pageId };
    if (replace) {
      window.history.replaceState(stateObj, '', path);
    } else {
      window.history.pushState(stateObj, '', path);
    }
  } catch (e) {
    console.warn('[Router] history API error:', e.message);
  }
}

/**
 * Replace current history entry (used after session restore so the
 * initially loaded URL doesn't create a duplicate entry).
 */
function replaceRoute(pageId) {
  pushRoute(pageId, true);
}

/**
 * Set up the popstate listener so Back / Forward buttons trigger correct renders.
 * Safe to call multiple times — guarded by a flag.
 */
let _popstateAttached = false;
function attachPopstateHandler() {
  if (_popstateAttached) return;
  _popstateAttached = true;

  window.addEventListener('popstate', function(event) {
    try {
      // Derive page from URL (most reliable source for popstate)
      const pageFromUrl = pathToPage(window.location.pathname);
      const pageId = (event.state && event.state.page) ? event.state.page : pageFromUrl;

      if (!pageId || pageId === state.page) return;

      // Use _navigateInternal to avoid pushing another history entry
      _navigateInternal(pageId);
    } catch (err) {
      console.warn('[Router] popstate handler error:', err.message);
    }
  });
}

/**
 * Internal navigation: update state and re-render WITHOUT pushing a new history entry.
 * Used by the popstate handler.
 */
function _navigateInternal(page) {
  const check = (typeof checkRouteAccess === 'function') ? checkRouteAccess(page) : { allowed: true };

  if (!check.allowed) {
    if (check.reason === 'unauthenticated') {
      state.redirectAfterLogin = page;
      state.page = 'login';
      if (typeof openAuthModal === 'function') openAuthModal('login', page);
    } else {
      // Unauthorized role: redirect to their own home
      const role = state.user?.role || 'resident';
      const home = (typeof getRoleHomeScreen === 'function') ? getRoleHomeScreen(role) : 'home';
      state.page = home;
    }
  } else {
    state.page = page;
  }

  if (typeof AppEvents !== 'undefined') {
    AppEvents.emit(AppEvents.EVENTS.PAGE_CHANGED, state.page);
  }

  if (typeof renderShell === 'function') renderShell();
  if (typeof renderPage === 'function') renderPage();
}

// Expose to global scope
if (typeof window !== 'undefined') {
  window.pageToPath       = pageToPath;
  window.pathToPage       = pathToPage;
  window.resolveInitialPage = resolveInitialPage;
  window.pushRoute        = pushRoute;
  window.replaceRoute     = replaceRoute;
  window.attachPopstateHandler = attachPopstateHandler;
  window._navigateInternal = _navigateInternal;
  window.PAGE_TO_PATH     = PAGE_TO_PATH;
  window.PATH_TO_PAGE     = PATH_TO_PAGE;
}
