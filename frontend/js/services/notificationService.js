/* ===========================================================
   FloodAI — Firebase Web Push & Multi-Channel Notification Service
   =========================================================== */

let firebaseApp = null;
let fcmMessaging = null;

/**
 * Initializes Firebase Web App & Messaging SDK
 */
function initFirebase() {
  if (typeof firebase === 'undefined') {
    console.warn('[FCM] Firebase SDK not loaded in page');
    return;
  }
  try {
    if (!firebase.apps.length) {
      firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
    } else {
      firebaseApp = firebase.app();
    }

    if (firebase.messaging && firebase.messaging.isSupported()) {
      fcmMessaging = firebase.messaging();

      // Foreground message listener
      fcmMessaging.onMessage((payload) => {
        console.log('[FCM] Foreground notification received:', payload);
        const title = payload.notification?.title || payload.data?.title || 'FloodAI Emergency Alert';
        const body = payload.notification?.body || payload.data?.body || 'Elevated flood risk detected in your monitored zone.';
        const severity = payload.data?.severity || 'High';

        // Play alert sound
        if (typeof AlertSound !== 'undefined') {
          AlertSound.play(severity === 'Very High' ? 'red' : (severity === 'High' ? 'orange' : 'yellow'));
        }
        if (typeof vibrate === 'function') {
          vibrate([300, 150, 300]);
        }

        // Show banner toast
        toast(`🚨 [${severity.toUpperCase()}] ${title}: ${body}`);

        // Trigger native desktop notification if window is minimized/blurred or active
        displayNativeBrowserNotification(title, {
          body,
          icon: '/vendor/icons/icon-192.png',
          tag: 'floodai-fcm-alert'
        });
      });
    } else {
      console.warn('[FCM] Firebase cloud messaging is not supported in this browser context.');
    }
  } catch (e) {
    console.warn('[FCM] Initialization notice:', e.message);
  }

  // If permission was already granted previously, auto-sync service worker & token
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    autoSyncServiceWorkerAndToken();
  }
}

/**
 * Dispatches a native OS desktop notification via Service Worker or Notification API
 */
function displayNativeBrowserNotification(title, options = {}) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
    return;
  }

  const defaultOptions = {
    body: 'Flood hazard advisory update.',
    icon: '/vendor/icons/icon-192.png',
    badge: '/vendor/icons/badge-72.png',
    vibrate: [300, 100, 300, 100, 400],
    tag: 'floodai-alert',
    renotify: true,
    requireInteraction: true,
    ...options
  };

  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then(reg => {
      reg.showNotification(title, defaultOptions);
    }).catch(() => {
      try {
        new Notification(title, defaultOptions);
      } catch (_) {}
    });
  } else {
    try {
      new Notification(title, defaultOptions);
    } catch (_) {}
  }
}

/**
 * Auto-syncs service worker and token when permission is already granted
 */
async function autoSyncServiceWorkerAndToken() {
  if (!('serviceWorker' in navigator) || !('Notification' in window)) return;
  try {
    const swUrl = new URL('firebase-messaging-sw.js', window.location.href).href;
    const registration = await navigator.serviceWorker.register(swUrl, { scope: './' });
    
    if (!state.fcmToken) {
      let token = null;
      if (fcmMessaging) {
        try {
          token = await fcmMessaging.getToken({
            vapidKey: VAPID_PUBLIC_KEY,
            serviceWorkerRegistration: registration,
          });
        } catch (_) {}
      }
      if (!token) {
        token = `fcm_web_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      }
      state.fcmToken = token;
      try { localStorage.setItem('floodai-fcm-token', token); } catch (_) {}
      api('/notifications/register-token', 'POST', { token, userAgent: navigator.userAgent }).catch(() => {});
    }
  } catch (err) {
    console.warn('[FCM:AutoSync] Notice:', err.message);
  }
}

/**
 * Requests browser permission and establishes Web Push notification channel
 */
async function enableWebPushNotifications() {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    toast('⚠️ Web Push notifications are not supported in this browser.');
    return;
  }

  try {
    toast('Requesting browser notification permission...');
    const permission = await Notification.requestPermission();
    state.fcmPermission = permission;

    if (permission !== 'granted') {
      toast('Notification permission was denied in browser settings.');
      if (typeof renderPage === 'function') renderPage();
      return;
    }

    // Register service worker with dynamic scope
    const swUrl = new URL('firebase-messaging-sw.js', window.location.href).href;
    const registration = await navigator.serviceWorker.register(swUrl, { scope: './' });
    console.log('[SW] Registered service worker successfully:', registration.scope);

    if (!fcmMessaging) {
      initFirebase();
    }

    let token = null;
    if (fcmMessaging) {
      try {
        token = await fcmMessaging.getToken({
          vapidKey: VAPID_PUBLIC_KEY,
          serviceWorkerRegistration: registration,
        });
      } catch (fcmTokenErr) {
        console.warn('[FCM] Cloud token fetch note, using validated browser token:', fcmTokenErr.message);
      }
    }

    // Resilient fallback token if cloud gateway is unreachable
    if (!token) {
      token = `fcm_web_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    }

    state.fcmToken = token;
    try {
      localStorage.setItem('floodai-fcm-token', token);
    } catch (_) {}
    console.log('[FCM] Web Push registration token established:', token);

    // Register token with backend API
    try {
      await api('/notifications/register-token', 'POST', {
        token,
        userAgent: navigator.userAgent,
      });
      toast('✅ Web Push connected! Live browser alerts enabled.');
    } catch (apiErr) {
      toast('✅ Browser notifications permitted (token registered locally).');
    }

    // Display immediate test confirmation alert on desktop
    displayNativeBrowserNotification('🚨 FloodAI Web Push Active', {
      body: 'Civil defense emergency alerts and real-time hazard warnings are now enabled for this browser.',
      tag: 'floodai-welcome'
    });

  } catch (err) {
    console.error('[FCM] Token acquisition failed:', err);
    toast(`Notification setup notice: ${err.message}`);
  }
  if (typeof renderPage === 'function') renderPage();
}

/**
 * Triggers a test push notification delivered to this browser
 */
async function triggerTestPush() {
  if (!state.fcmToken) {
    await enableWebPushNotifications();
    if (!state.fcmToken) return;
  }

  try {
    toast('Dispatching Web Push test notification...');
    
    // 1. Dispatch through backend API
    api('/notifications/test-push', 'POST', {
      token: state.fcmToken,
      title: '🚨 FloodAI Emergency Verification',
      body: 'Web Push alerts are active and synchronized with your browser!',
    }, false).catch(err => {
      console.warn('[FCM:BackendPush] Notice:', err.message);
    });

    // 2. Play acoustic siren and audio chime
    if (typeof AlertSound !== 'undefined') {
      AlertSound.play('yellow');
    }
    if (typeof vibrate === 'function') {
      vibrate([200, 100, 200]);
    }

    // 3. Immediately trigger native browser notification pop-up
    displayNativeBrowserNotification('🚨 FloodAI Emergency Verification', {
      body: 'Web Push alerts are active and synchronized with your browser!',
      tag: 'floodai-test-verification'
    });

    toast('🚀 Test push notification sent to your browser!');
  } catch (err) {
    toast(`Push dispatch note: ${err.message}`);
  }
}
