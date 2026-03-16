/**
 * BBQ Architect — Service Worker
 *
 * Verantwoordelijkheden:
 * 1. Push-notificaties ontvangen en tonen (ook als app gesloten is)
 * 2. Notificatie-klik afhandelen (open juiste pagina)
 * 3. Basis offline-caching van de app shell
 */

var CACHE_NAME = 'bbq-architect-v2';
var APP_SHELL = [
    '/',
    '/agenda',
    '/events',
    '/offertes',
    '/facturen',
    '/recepten',
    '/logistiek',
    '/haccp',
    '/price-intelligence',
    '/foto-archief',
    '/logo.png',
];

// ── Installatie: cache de app shell ──────────────────────────────
self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            // Voeg elke URL afzonderlijk toe zodat één mislukking niet alles blokkeert
            return Promise.all(
                APP_SHELL.map(function (url) {
                    return cache.add(url).catch(function () {});
                })
            );
        })
    );
    self.skipWaiting();
});

// ── Activatie: verwijder oude caches ─────────────────────────────
self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(
                keys.filter(function (k) { return k !== CACHE_NAME; })
                    .map(function (k) { return caches.delete(k); })
            );
        })
    );
    self.clients.claim();
});

// ── Fetch: stale-while-revalidate voor pagina's, skip voor API ───
self.addEventListener('fetch', function (event) {
    var url = new URL(event.request.url);

    // API-routes en externe URLs altijd via netwerk (nooit cachen)
    if (url.pathname.startsWith('/api/') || url.origin !== self.location.origin) return;

    // Alleen GET-requests cachen
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.match(event.request).then(function (cached) {
                var networkFetch = fetch(event.request).then(function (response) {
                    // Sla succesvolle responses op in cache (geen opaque responses)
                    if (response && response.status === 200 && response.type !== 'opaque') {
                        cache.put(event.request, response.clone());
                    }
                    return response;
                }).catch(function () {
                    return null;
                });

                // Stale-while-revalidate: geef cache meteen terug en ververs op achtergrond
                return cached || networkFetch;
            });
        })
    );
});

// ── Push: toon notificatie ────────────────────────────────────────
self.addEventListener('push', function (event) {
    var data = {};
    try {
        data = event.data ? event.data.json() : {};
    } catch (e) {
        data = { title: 'BBQ Architect', body: event.data ? event.data.text() : '' };
    }

    var title = data.title || 'BBQ Architect';
    var options = {
        body: data.body || '',
        icon: data.icon || '/logo.png',
        badge: '/logo.png',
        tag: data.tag || 'bbq-architect',
        data: { url: data.url || '/' },
        vibrate: [200, 100, 200],
        requireInteraction: data.requireInteraction || false,
        actions: [
            { action: 'open', title: 'Bekijken' },
            { action: 'dismiss', title: 'Sluiten' },
        ],
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notificatie-klik: open de juiste pagina ───────────────────────
self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    if (event.action === 'dismiss') return;

    var targetUrl = (event.notification.data && event.notification.data.url) || '/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clients) {
            // Als er al een venster open is, focus dat
            for (var i = 0; i < clients.length; i++) {
                var client = clients[i];
                if (new URL(client.url).origin === self.location.origin) {
                    client.focus();
                    client.navigate(targetUrl);
                    return;
                }
            }
            // Anders: nieuw venster openen
            return self.clients.openWindow(targetUrl);
        })
    );
});
