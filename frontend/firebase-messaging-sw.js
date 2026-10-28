/**
 * firebase-messaging-sw.js
 * Root Service Worker for FloodAI Web Push background notifications.
 */

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// Initialize Firebase with the project credentials
const firebaseConfig = {
  apiKey: "AIzaSyCbk9iP9HPq4PhGqGLMHmv03OvUbh7rgfM",
  authDomain: "floodai-24a0f.firebaseapp.com",
  projectId: "floodai-24a0f",
  storageBucket: "floodai-24a0f.firebasestorage.app",
  messagingSenderId: "552262034830",
  appId: "1:552262034830:web:2acedc1e393a34f6be30df",
};

firebase.initializeApp(firebaseConfig);

let messaging = null;
try {
  messaging = firebase.messaging();
} catch (e) {
  console.warn("[SW] Firebase messaging unsupported in this environment:", e);
}

// Background push notification handler
if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    console.log("[SW] Background push notification received:", payload);

    const notificationTitle = payload.notification?.title || payload.data?.title || "FloodAI Emergency Alert";
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || "Elevated flood risk detected in your monitored zone.",
      icon: payload.notification?.icon || payload.data?.icon || "/vendor/icons/icon-192.png",
      badge: "/vendor/icons/badge-72.png",
      vibrate: [300, 100, 300, 100, 400],
      tag: payload.data?.district || "floodai-alert",
      renotify: true,
      requireInteraction: true,
      data: {
        url: payload.data?.url || "/#alerts",
        district: payload.data?.district,
        severity: payload.data?.severity,
        timestamp: new Date().toISOString(),
      },
      actions: [
        { action: "view_alert", title: "View Situation Map" },
        { action: "dismiss", title: "Dismiss" },
      ],
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
  });
}

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
