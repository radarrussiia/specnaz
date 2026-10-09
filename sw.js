const CACHE_NAME = 'specnaz-shell-v83-webpush-integrated';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/icon-192.png',
  './assets/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;
  // Dynamic PHP endpoints must never be served from the app-shell cache.
  if (sameOrigin && /\/(proxy|push-subscribe|push-cron)\.php$/.test(url.pathname)) {
    event.respondWith(fetch(request, {cache: 'no-store'}));
    return;
  }
  const isAppDocument = sameOrigin && (request.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname === '/');

  // For the app document use network-first so the 5-second version check can
  // see a newly deployed build; fall back to the cached app when offline.
  if (isAppDocument) {
    event.respondWith(
      fetch(request, {cache: 'no-store'}).then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy));
        }
        return response;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response && response.ok && sameOrigin) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});


// Web Push handler: the application server must send real push events to this worker.
self.addEventListener('push', event => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; }
  catch (e) { payload = { body: event.data ? event.data.text() : 'Поступило новое сообщение радара' }; }
  const title = payload.title || '🚨 Опасность!';
  const options = {
    body: String(payload.body || payload.message || 'Поступило новое сообщение радара').slice(0, 240),
    icon: payload.icon || './assets/icon-192.png',
    badge: payload.badge || './assets/icon-192.png',
    vibrate: [200, 100, 200],
    tag: String(payload.tag || payload.id || 'specnaz-danger'),
    renotify: false,
    data: { url: payload.url || './' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = new URL((event.notification.data && event.notification.data.url) || './', self.location.href).href;
  event.waitUntil(self.clients.matchAll({type:'window', includeUncontrolled:true}).then(clients => {
    for (const client of clients) {
      if (client.url === target && 'focus' in client) return client.focus();
    }
    if (self.clients.openWindow) return self.clients.openWindow(target);
  }));
});
