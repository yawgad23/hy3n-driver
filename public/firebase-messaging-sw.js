// HY3N Driver — FCM Service Worker
// Handles: FCM background push notifications + offline caching

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

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
const CACHE_NAME = 'hy3n-driver-v2';
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
messaging.onBackgroundMessage((payload) => {
  console.log('[HY3N Driver FCM SW] Background message received:', payload);
  const title = payload.notification?.title || payload.data?.title || 'HY3N Driver';
  const body = payload.notification?.body || payload.data?.body || '';
  const icon = payload.notification?.icon || '/icon-192.png';
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
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
