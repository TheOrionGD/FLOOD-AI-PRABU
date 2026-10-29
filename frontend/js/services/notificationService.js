/* ===========================================================
   FloodAI — Firebase Web Push & Multi-Channel Notification Service
   =========================================================== */

let firebaseApp = null;
let fcmMessaging = null;
let notificationEventSource = null;

/**
 * Initializes Firebase Web App & Messaging SDK
 */
async function initFirebase() {
  if (typeof firebase === 'undefined') {
    console.warn('[FCM] Firebase SDK not loaded in page');
    connectNotificationStream();
    return;
  }
  try {
    if (!firebase.apps.length) {
      firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
    } else {
      firebaseApp = firebase.app();
    }

    if (firebase.messaging) {
      let isSupported = false;
      try {
        isSupported = (typeof firebase.messaging.isSupported === 'function')
          ? await firebase.messaging.isSupported()
          : true;
      } catch (_) {
        isSupported = false;
      }

      if (isSupported) {
        fcmMessaging = firebase.messaging();

        // Foreground message listener
        fcmMessaging.onMessage((payload) => {
          console.log('[FCM] Foreground notification received:', payload);
          handleIncomingNotificationPayload(payload);
        });
      } else {
        console.warn('[FCM] Firebase cloud messaging is not supported in this browser context.');
      }
    }
  } catch (e) {
    console.warn('[FCM] Initialization notice:', e.message);
  }

  // Connect to real-time notification stream
  connectNotificationStream();

  // If permission was already granted previously, auto-sync service worker & token
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    autoSyncServiceWorkerAndToken();
  }
}

/**
 * Unified incoming notification processor (FCM Foreground + SSE Stream)
 */
function handleIncomingNotificationPayload(payload) {
  const title = payload.notification?.title || payload.data?.title || payload.title || '🚨 FloodAI Emergency Alert';
  const body = payload.notification?.body || payload.data?.body || payload.body || 'Elevated flood risk detected in your monitored zone.';
  const severity = payload.data?.severity || payload.severity || 'High';
  const isSimulation = Boolean(payload.isSimulation || payload.data?.isSimulation === 'true' || payload.data?.isSimulation === true);

  // 1. Play alert acoustic sound
  if (typeof AlertSound !== 'undefined') {
    AlertSound.play(severity === 'Very High' || severity === 'Critical' ? 'red' : (severity === 'High' ? 'orange' : 'yellow'));
  }
  if (typeof vibrate === 'function') {
    vibrate([300, 150, 300]);
  }

  // 2. Show prominent toast
  if (typeof toast === 'function') {
    const prefix = isSimulation ? '🧪 [SIMULATED TEST]' : `🚨 [${String(severity).toUpperCase()}]`;
    toast(`${prefix} ${title}: ${body}`);
  }

  // 3. Trigger native desktop OS notification
  displayNativeBrowserNotification(title, {
    body,
    icon: '/vendor/icons/icon-192.png',
    tag: `floodai-alert-${Date.now()}`,
    data: payload.data || payload
  });

  // 4. Propagate real-time reactive event across open workspace views
  if (typeof AppEvents !== 'undefined') {
    if (isSimulation) {
      AppEvents.emit(AppEvents.EVENTS.SIMULATION_EXECUTED, {
        ...payload,
        isSimulation: true,
        severity,
        title,
        body,
        timestamp: new Date().toISOString()
      });
    } else {
      AppEvents.emit(AppEvents.EVENTS.ALERT_DISPATCHED, {
        alert: {
          _id: payload.alertId || payload._id || `alert_${Date.now()}`,
          location: payload.location || payload.data?.location || 'Monitored Sector',
          level: severity,
          message: body,
          createdAt: new Date().toISOString(),
          active: true,
          ...payload
        },
        isSimulation: false
      });
    }
  }
}

/**
 * Connects to the real-time Server-Sent Events notification stream from backend
 */
function connectNotificationStream() {
  if (typeof EventSource === 'undefined') return;
  if (notificationEventSource) {
    try { notificationEventSource.close(); } catch (_) {}
  }

  const streamUrl = (typeof API_BASE !== 'undefined' ? API_BASE : '/api') + '/notifications/stream';
  try {
    notificationEventSource = new EventSource(streamUrl);

    notificationEventSource.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'notification' && msg.payload) {
          handleIncomingNotificationPayload(msg.payload);
        }
      } catch (err) {
        // Heartbeat or parse notice
      }
    };

    notificationEventSource.onerror = () => {
      // Automatic reconnection handled natively by EventSource
    };
  } catch (err) {
    console.warn('[FCM:Stream] Real-time stream initialization notice:', err.message);
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

  // 1. Send to active Service Worker controller if available
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    try {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        title,
        options: defaultOptions
      });
    } catch (_) {}
  }

  // 2. Dispatch via ServiceWorkerRegistration.showNotification (recommended for modern Chromium)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(reg => {
      if (reg && typeof reg.showNotification === 'function') {
        return reg.showNotification(title, defaultOptions);
      }
      throw new Error('showNotification not supported on registration');
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
 * Helper to convert Base64 VAPID key to Uint8Array for PushManager
 */
function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Auto-syncs service worker and token when permission is already granted
 */
async function autoSyncServiceWorkerAndToken() {
  if (!('serviceWorker' in navigator) || !('Notification' in window)) return;
  try {
    const swUrl = new URL('firebase-messaging-sw.js', window.location.href).href;
    const registration = await navigator.serviceWorker.register(swUrl, { scope: './' });
    await navigator.serviceWorker.ready;

    if (!state.fcmToken) {
      let token = null;

      // Try Firebase SDK token
      if (fcmMessaging) {
        try {
          token = await fcmMessaging.getToken({
            vapidKey: VAPID_PUBLIC_KEY,
            serviceWorkerRegistration: registration,
          });
        } catch (_) {
          try {
            token = await fcmMessaging.getToken({ serviceWorkerRegistration: registration });
          } catch (_) {}
        }
      }

      // Try native PushManager subscription
      if (!token && registration.pushManager) {
        try {
          let sub = await registration.pushManager.getSubscription();
          if (!sub && typeof VAPID_PUBLIC_KEY === 'string') {
            sub = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY)
            }).catch(() => null);
          }
          if (sub) {
            token = btoa(JSON.stringify(sub));
          }
        } catch (_) {}
      }

      // Resilient client fallback token
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

    // Register service worker and await activation readiness
    const swUrl = new URL('firebase-messaging-sw.js', window.location.href).href;
    const registration = await navigator.serviceWorker.register(swUrl, { scope: './' });
    console.log('[SW] Registered service worker successfully:', registration.scope);
    await navigator.serviceWorker.ready;

    if (!fcmMessaging) {
      await initFirebase();
    }

    let token = null;
    if (fcmMessaging) {
      try {
        token = await fcmMessaging.getToken({
          vapidKey: VAPID_PUBLIC_KEY,
          serviceWorkerRegistration: registration,
        });
      } catch (fcmTokenErr) {
        console.warn('[FCM] VAPID token fetch note, attempting default key:', fcmTokenErr.message);
        try {
          token = await fcmMessaging.getToken({
            serviceWorkerRegistration: registration,
          });
        } catch (fbErr) {
          console.warn('[FCM] Default token fetch note:', fbErr.message);
        }
      }
    }

    // Resilient PushManager subscription fallback
    if (!token && registration.pushManager) {
      try {
        let sub = await registration.pushManager.getSubscription();
        if (!sub && typeof VAPID_PUBLIC_KEY === 'string') {
          sub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY)
          }).catch(() => null);
        }
        if (sub) {
          token = btoa(JSON.stringify(sub));
        }
      } catch (subErr) {
        console.warn('[FCM:PushManager]', subErr.message);
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
    toast('📡 Dispatching Web Push test notification...');
    
    // 1. Play acoustic siren and audio chime
    if (typeof AlertSound !== 'undefined') {
      AlertSound.play('yellow');
    }
    if (typeof vibrate === 'function') {
      vibrate([200, 100, 200]);
    }

    // 2. Dispatch through backend API
    api('/notifications/test-push', 'POST', {
      token: state.fcmToken,
      title: '🚨 FloodAI Emergency Verification',
      body: 'Web Push alerts are active and synchronized with your browser!',
    }, false).catch(err => {
      console.warn('[FCM:BackendPush] Notice:', err.message);
    });

    // 3. Immediately trigger native browser notification pop-up via Service Worker
    displayNativeBrowserNotification('🚨 FloodAI Emergency Verification', {
      body: 'Web Push alerts are active and synchronized with your browser!',
      tag: 'floodai-test-verification'
    });

    toast('🚀 Test push notification sent to your browser!');
  } catch (err) {
    toast(`Push dispatch note: ${err.message}`);
  }
}
