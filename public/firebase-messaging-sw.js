// HY3N Driver — FCM Service Worker
// Handles: FCM background push notifications + offline caching
// IMPORTANT: Must use v12 compat scripts to match the app's Firebase SDK version.

importScripts('https://www.gstatic.com/firebasejs/12.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.14.0/firebase-messaging-compat.js');

// ── Firebase init ──────────────────────────────────────────────────────────────
firebase.initializeApp({
  apiKey: "AIzaSyDYUm2xv_8er3oGwk6qVXzAT51hoS4N4dE",
  authDomain: "hy3n26.firebaseapp.com",
  projectId: "hy3n26",
  storageBucket: "hy3n26.firebasestorage.app",
  messagingSenderId: "362594902321",
  appId: "1:362594902321:web:9387b08590e7660216d010"
});

const messaging = firebase.messaging();

// ── Offline cache ──────────────────────────────────────────────────────────────
const CACHE_NAME = 'hy3n-driver-v3';
const PRECACHE = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      ),
    ])
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

// ── FCM background message handler ────────────────────────────────────────────
// The v12 compat SDK auto-displays notification payloads, so this handler is
// only needed for data-only messages (no notification field).
messaging.onBackgroundMessage((payload) => {
  console.log('[HY3N Driver FCM SW] Background message received:', payload);
  // Only manually show notification for data-only messages
  if (payload.notification) return; // SDK handles it automatically
  const title = payload.data?.title || 'HY3N Driver';
  const body = payload.data?.body || '';
  const icon = '/icon-192.png';
  const tag = payload.data?.tag || 'hy3n-driver';

  self.registration.showNotification(title, {
    body,
    icon,
    badge: '/icon-192.png',
    tag,
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: true,
    data: payload.data || {},
  });
});

// ── Notification click — open or focus the app ────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.action_url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          // Post a message to the page so it can refresh its ride state
          client.postMessage({ type: 'FCM_NOTIFICATION_CLICK', data: event.notification.data });
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
