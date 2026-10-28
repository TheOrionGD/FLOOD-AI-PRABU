/**
 * FLOODAI — Application Bootstrap & Orchestrator
 * Fuses modular data stores, reactive state, REST APIs, ML microservices, and Web Push notifications.
 */

(async function bootstrapApp() {
  console.log('[FloodAI] Initializing Modular Frontend Architecture v2.5...');

  // 1. Initial Shell & Page Render (Displays immediate layout & skeleton states)
  try {
    renderShell();
    renderPage();
  } catch (renderErr) {
    console.error('[FloodAI] Initial shell render error:', renderErr);
  }

  // 2. Check Backend API Connectivity
  try {
    await checkApiHealth();
  } catch (healthErr) {
    console.warn('[FloodAI] API Health check warning:', healthErr.message);
  }

  // 3. Dynamic Data Bootstrap (100% Data-Driven from MongoDB Atlas & ML microservice)
  try {
    await bootstrapDynamicData();
    console.log(`[FloodAI] Successfully bootstrapped ${DISTRICTS.length} monitored disaster sectors.`);
    
    // Refresh views now that dynamic data stores are populated
    renderShell();
    renderPage();
  } catch (bootstrapErr) {
    console.error('[FloodAI] Data bootstrap notice:', bootstrapErr.message);
  }

  // 4. Initialize Firebase Cloud Messaging
  try {
    initFirebase();
  } catch (fcmErr) {
    console.warn('[FloodAI] Firebase messaging init warning:', fcmErr.message);
  }

  // 5. Check System Permissions Badge
  try {
    updatePermissionsHeaderBadge();
  } catch (permErr) {
    console.warn('[FloodAI] Perms check warning:', permErr.message);
  }

  console.log('[FloodAI] Platform is live and operational.');
})();
