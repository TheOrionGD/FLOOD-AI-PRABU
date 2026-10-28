/**
 * firebase-messaging-sw.js
 * Root Service Worker for FloodAI Web Push background notifications.
 */

try {
  importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
  importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");
} catch (importErr) {
  console.warn("[SW] Firebase CDN scripts could not be imported in worker:", importErr);
}

// Initialize Firebase with the project credentials
const firebaseConfig = {
  apiKey: "AIzaSyCbk9iP9HPq4PhGqGLMHmv03OvUbh7rgfM",
  authDomain: "floodai-24a0f.firebaseapp.com",
  projectId: "floodai-24a0f",
  storageBucket: "floodai-24a0f.firebasestorage.app",
  messagingSenderId: "552262034830",
  appId: "1:552262034830:web:2acedc1e393a34f6be30df",
};

let messaging = null;
try {
  if (typeof firebase !== "undefined") {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    if (firebase.messaging && typeof firebase.messaging.isSupported === "function") {
      messaging = firebase.messaging();
    }
  }
} catch (e) {
  console.warn("[SW] Firebase messaging unsupported in this worker context:", e);
}

function buildNotificationOptions(payload) {
  const notificationTitle = payload.notification?.title || payload.data?.title || payload.title || "🚨 FloodAI Emergency Alert";
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || payload.body || "Elevated flood hazard advisory detected in your monitored zone.",
    icon: payload.notification?.icon || payload.data?.icon || payload.icon || "/vendor/icons/icon-192.png",
    badge: "/vendor/icons/badge-72.png",
    vibrate: [300, 100, 300, 100, 400],
    tag: payload.data?.district || payload.district || "floodai-alert",
    renotify: true,
    requireInteraction: true,
    data: {
      url: payload.data?.url || payload.url || "/#alerts",
      district: payload.data?.district || payload.district,
      severity: payload.data?.severity || payload.severity,
      timestamp: new Date().toISOString(),
    },
    actions: [
      { action: "view_alert", title: "View Situation Map" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };
  return { title: notificationTitle, options: notificationOptions };
}

// 1. Firebase background push message handler
if (messaging && typeof messaging.onBackgroundMessage === "function") {
  try {
    messaging.onBackgroundMessage((payload) => {
      console.log("[SW:FCM] Background push notification received:", payload);
      const { title, options } = buildNotificationOptions(payload);
      return self.registration.showNotification(title, options);
    });
  } catch (bgErr) {
    console.warn("[SW:FCM] onBackgroundMessage hook notice:", bgErr);
  }
}

// 2. Standard W3C native Push event handler (catches all Web Push dispatches)
self.addEventListener("push", (event) => {
  console.log("[SW:Push] Raw push event received:", event);
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch (_) {
      payload = { body: event.data.text() };
    }
  }
  const { title, options } = buildNotificationOptions(payload);
  event.waitUntil(self.registration.showNotification(title, options));
});

// 3. Client window cross-message handler
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SHOW_NOTIFICATION") {
    const title = event.data.title || "🚨 FloodAI Disaster Alert";
    const options = event.data.options || {};
    event.waitUntil(self.registration.showNotification(title, options));
  }
});

// Handle notification click event
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") {
    return;
  }

  const targetUrl = event.notification.data?.url || "/#alerts";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Check if a FloodAI window is already open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});
