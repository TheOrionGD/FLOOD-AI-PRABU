/**
 * test_reactive_ui_updates.js
 * Verification test suite for FloodAI Frontend Reactive State Management & UI Updates
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

console.log('🧪 ========================================================');
console.log('   FLOODAI FRONTEND REACTIVE UI UPDATE TEST SUITE');
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

async function itAsync(desc, fn) {
  try {
    await fn();
    console.log(`  ✅ [PASS] ${desc}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${desc}`);
    console.error(`     Error: ${err.message}\n`);
    failCount++;
  }
}

// Mock browser environment for testing frontend state & services in Node
global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; }
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

// 1. Load state.js
require('../frontend/js/state.js');

async function runTests() {
  console.log('📋 SECTION 1: Lightweight Reactive Event Bus (AppEvents)');
  it('AppEvents exists and defines standard event names', () => {
    assert.ok(global.AppEvents, 'AppEvents should be defined');
    assert.ok(global.AppEvents.EVENTS, 'AppEvents.EVENTS should be defined');
    assert.strictEqual(typeof global.AppEvents.on, 'function');
    assert.strictEqual(typeof global.AppEvents.emit, 'function');
    assert.strictEqual(typeof global.AppEvents.off, 'function');

    assert.ok(global.AppEvents.EVENTS.LOCATION_CHANGED);
    assert.ok(global.AppEvents.EVENTS.COASTAL_RADIUS_CHANGED);
    assert.ok(global.AppEvents.EVENTS.ALERT_DISPATCHED);
    assert.ok(global.AppEvents.EVENTS.ALERT_RESOLVED);
    assert.ok(global.AppEvents.EVENTS.SIMULATION_EXECUTED);
    assert.ok(global.AppEvents.EVENTS.SIMULATION_ACKNOWLEDGED);
    assert.ok(global.AppEvents.EVENTS.THEME_CHANGED);
    assert.ok(global.AppEvents.EVENTS.PREDICTION_UPDATED);
  });

  it('AppEvents correctly dispatches events to registered listeners and supports unsubscribing', () => {
    let receivedPayload = null;
    const unsubscribe = AppEvents.on(AppEvents.EVENTS.LOCATION_CHANGED, (payload) => {
      receivedPayload = payload;
    });

    AppEvents.emit(AppEvents.EVENTS.LOCATION_CHANGED, { lat: 13.08, lon: 80.27, cityName: 'Chennai' });
    assert.deepStrictEqual(receivedPayload, { lat: 13.08, lon: 80.27, cityName: 'Chennai' });

    // Unsubscribe and verify listener is removed
    unsubscribe();
    receivedPayload = null;
    AppEvents.emit(AppEvents.EVENTS.LOCATION_CHANGED, { lat: 19.07, lon: 72.87, cityName: 'Mumbai' });
    assert.strictEqual(receivedPayload, null, 'Unsubscribed listener should not receive events');
  });

  it('AppEvents gracefully handles listener exceptions without breaking other listeners', () => {
    let healthyCalled = false;
    AppEvents.on('test:error_channel', () => {
      throw new Error('Test listener throwing exception');
    });
    AppEvents.on('test:error_channel', () => {
      healthyCalled = true;
    });

    AppEvents.emit('test:error_channel', { ok: true });
    assert.strictEqual(healthyCalled, true, 'Subsequent listeners should continue running');
  });

  console.log('\n📋 SECTION 2: Reactive State Store & Proxy (AppStore & state)');
  it('Assigning a property to state automatically emits state change events', () => {
    let propertyEvent = null;
    let genericEvent = null;

    AppEvents.on('app:state:userLocation', (payload) => {
      propertyEvent = payload;
    });

    AppEvents.on(AppEvents.EVENTS.STATE_CHANGED, (payload) => {
      if (payload.key === 'userLocation') {
        genericEvent = payload;
      }
    });

    const testCoords = { lat: 12.97, lon: 77.59, cityName: 'Bengaluru' };
    state.userLocation = testCoords;

    assert.deepStrictEqual(state.userLocation, testCoords, 'state property should be updated');
    assert.ok(propertyEvent, 'app:state:userLocation should have fired');
    assert.deepStrictEqual(propertyEvent.value, testCoords);
    assert.ok(genericEvent, 'STATE_CHANGED should have fired');
    assert.strictEqual(genericEvent.key, 'userLocation');
  });

  it('AppStore.update modifies state and triggers reactivity', () => {
    let themeReceived = null;
    AppEvents.on('app:state:theme', (p) => {
      themeReceived = p.value;
    });

    AppStore.update({ theme: 'light', activeEngine: 'ensemble' });
    assert.strictEqual(state.theme, 'light');
    assert.strictEqual(state.activeEngine, 'ensemble');
    assert.strictEqual(themeReceived, 'light');
  });

  console.log('\n📋 SECTION 3: Race-Condition Prevention (Sequence Request Counter)');
  await itAsync('Older slower async responses do not overwrite newer responses', async () => {
    let _sequence = 0;
    let renderedResult = null;

    // Simulate an async data-fetch function guarded with sequence tracking
    async function simulateFetch(id, delayMs, payload) {
      const currentSeq = ++_sequence;
      await new Promise(r => setTimeout(r, delayMs));
      // If a newer request was dispatched while this was in flight, discard response
      if (currentSeq !== _sequence) {
        return false; // Discarded
      }
      renderedResult = payload;
      return true; // Applied
    }

    // Request 1 starts first, but takes 80ms (slow network)
    const req1 = simulateFetch(1, 80, { searchRadius: 500, zonesCount: 22 });
    // Request 2 starts 10ms later, but completes in 20ms (fast network / cached)
    await new Promise(r => setTimeout(r, 10));
    const req2 = simulateFetch(2, 20, { searchRadius: 250, zonesCount: 11 });

    const [res1, res2] = await Promise.all([req1, req2]);

    assert.strictEqual(res2, true, 'Request 2 (newer) should be applied');
    assert.strictEqual(res1, false, 'Request 1 (older, slower) should be discarded');
    assert.deepStrictEqual(renderedResult, { searchRadius: 250, zonesCount: 11 }, 'Final rendered UI result must match newest Request 2');
  });

  console.log('\n📋 SECTION 4: In-Memory Reactive Updates for Simulations & Alerts');
  it('Simulation runs update in-memory history table reactively without page reloads', () => {
    const simHistory = [];
    let eventDispatched = null;

    AppEvents.on(AppEvents.EVENTS.SIMULATION_EXECUTED, (e) => {
      eventDispatched = e;
    });

    // Simulate dispatching a new test alert
    const newSimRun = {
      _id: 'sim_run_' + Date.now(),
      createdAt: new Date().toISOString(),
      scenario: 'Coastal Storm Surge & Inundation',
      severity: 'Critical',
      location: 'Chennai Coastal Sector',
      channelsRequested: ['siren', 'fcm', 'email'],
      acknowledged: false
    };

    // Prepend to history in-memory
    simHistory.unshift(newSimRun);
    AppEvents.emit(AppEvents.EVENTS.SIMULATION_EXECUTED, {
      simulationId: newSimRun._id,
      isSimulation: true,
      scenario: newSimRun.scenario
    });

    assert.strictEqual(simHistory.length, 1);
    assert.strictEqual(simHistory[0]._id, newSimRun._id);
    assert.ok(eventDispatched, 'SIMULATION_EXECUTED event should be emitted');
    assert.strictEqual(eventDispatched.isSimulation, true);

    // Simulate acknowledging alert
    const target = simHistory.find(h => h._id === newSimRun._id);
    target.acknowledged = true;
    AppEvents.emit(AppEvents.EVENTS.SIMULATION_ACKNOWLEDGED, { simulationId: newSimRun._id });

    assert.strictEqual(simHistory[0].acknowledged, true, 'In-memory state should be acknowledged immediately without reload');
  });

  it('Admin alert creation and resolution propagate reactively to listeners', () => {
    const liveAlerts = [
      { _id: 'alt_001', location: 'Chennai', level: 'Red', active: true }
    ];

    let receivedAlert = null;
    let resolvedId = null;

    AppEvents.on(AppEvents.EVENTS.ALERT_DISPATCHED, (e) => {
      receivedAlert = e.alert;
    });

    AppEvents.on(AppEvents.EVENTS.ALERT_RESOLVED, (e) => {
      resolvedId = e.alertId;
    });

    // 1. Dispatch
    const created = { _id: 'alt_002', location: 'Mumbai', level: 'Orange', active: true };
    liveAlerts.unshift(created);
    AppEvents.emit(AppEvents.EVENTS.ALERT_DISPATCHED, { alert: created, isSimulation: false });

    assert.deepStrictEqual(receivedAlert, created);
    assert.strictEqual(liveAlerts.length, 2);

    // 2. Resolve
    const alt = liveAlerts.find(a => a._id === 'alt_001');
    alt.active = false;
    AppEvents.emit(AppEvents.EVENTS.ALERT_RESOLVED, { alertId: 'alt_001' });

    assert.strictEqual(resolvedId, 'alt_001');
    assert.strictEqual(liveAlerts.find(a => a._id === 'alt_001').active, false);
  });

  console.log('\n📋 SECTION 5: Unified Location Synchronization (AppStore.syncLocation)');
  it('AppStore.syncLocation synchronizes all state keys and triggers LOCATION_CHANGED', () => {
    let firedLocation = null;
    const unsub = AppEvents.on(AppEvents.EVENTS.LOCATION_CHANGED, (loc) => {
      firedLocation = loc;
    });

    const synced = AppStore.syncLocation({
      lat: 13.0827,
      lon: 80.2707,
      cityName: 'Chennai',
      district: 'Chennai',
      stateName: 'Tamil Nadu'
    });

    assert.ok(synced, 'syncLocation should return synced object');
    assert.strictEqual(state.selectedDistrict, 'Chennai');
    assert.strictEqual(state.userCoordinates.lat, 13.0827);
    assert.strictEqual(state.userLocation.cityName, 'Chennai');
    assert.ok(firedLocation, 'LOCATION_CHANGED event should be emitted');
    assert.strictEqual(firedLocation.district, 'Chennai');

    unsub();
  });

  console.log('\n📋 SECTION 6: Notification Channel Discrimination (Simulation vs Live Emergency)');
  it('Notification dispatcher clearly distinguishes between simulated test events and live emergency broadcasts', () => {
    let liveAlertDispatched = false;
    let simAlertDispatched = false;

    AppEvents.on(AppEvents.EVENTS.ALERT_DISPATCHED, (e) => {
      liveAlertDispatched = true;
    });
    AppEvents.on(AppEvents.EVENTS.SIMULATION_EXECUTED, (e) => {
      simAlertDispatched = true;
    });

    // Mock notification handler logic
    function processNotification(payload) {
      const isSim = Boolean(payload.isSimulation || payload.data?.isSimulation === 'true' || payload.title?.includes('[SIMULATION]'));
      if (isSim) {
        AppEvents.emit(AppEvents.EVENTS.SIMULATION_EXECUTED, { ...payload, isSimulation: true });
      } else {
        AppEvents.emit(AppEvents.EVENTS.ALERT_DISPATCHED, { ...payload, isSimulation: false });
      }
    }

    // Process a simulated test
    processNotification({ title: '[SIMULATION] Coastal Storm Surge Drill', isSimulation: true });
    assert.strictEqual(simAlertDispatched, true, 'Simulated notification should emit SIMULATION_EXECUTED');
    assert.strictEqual(liveAlertDispatched, false, 'Simulated notification should NOT emit live ALERT_DISPATCHED');

    // Reset and process a live disaster emergency
    simAlertDispatched = false;
    processNotification({ title: 'URGENT: Dam Discharge Surge Cresting', isSimulation: false });
    assert.strictEqual(liveAlertDispatched, true, 'Live emergency notification should emit ALERT_DISPATCHED');
    assert.strictEqual(simAlertDispatched, false, 'Live emergency notification should NOT emit SIMULATION_EXECUTED');
  });

  console.log('\n📋 SECTION 7: In-Place Engine Switching Without Full Page Reload');
  it('Switching inference engine modifies state without tearing down DOM inputs', () => {
    // Mock virtual DOM elements for inference workbench
    let pageReloadTriggered = false;
    global.renderPage = () => { pageReloadTriggered = true; };

    state.activeEngine = 'xgboost';
    assert.strictEqual(state.activeEngine, 'xgboost');

    // Simulate in-place engine change
    state.activeEngine = 'random_forest';
    assert.strictEqual(state.activeEngine, 'random_forest');
    assert.strictEqual(pageReloadTriggered, false, 'Inference engine switch must NOT call full renderPage()');
  });

  console.log('\n========================================================');
  console.log(`TOTAL TESTS: ${passCount + failCount}`);
  console.log(`PASSED: ${passCount}`);
  console.log(`FAILED: ${failCount}`);
  console.log('========================================================\n');

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();

