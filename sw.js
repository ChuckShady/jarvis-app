// JARVIS away-mode service worker: keeps the app shell stored on the phone
// so it opens instantly anywhere, with or without the Mac or even internet.
const CACHE = 'jarvis-away-v4';
const SHELL = ['./', './index.html', './icon.png', './manifest.json'];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
    e.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);
    if (url.origin !== self.location.origin) return; // API calls: network only
    e.respondWith(
        fetch(e.request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
            return res;
        }).catch(() => caches.match(e.request, { ignoreSearch: true }))
    );
});

// Push notifications from JARVIS (news, big P/L, economic events).
self.addEventListener('push', (e) => {
    let data = { title: 'JARVIS', body: '' };
    try { data = e.data.json(); } catch (_) { try { data.body = e.data.text(); } catch (__) {} }
    e.waitUntil(self.registration.showNotification(data.title || 'JARVIS', {
        body: data.body || '',
        icon: './icon.png',
        badge: './icon.png',
        tag: data.tag || undefined
    }));
});
self.addEventListener('notificationclick', (e) => {
    e.notification.close();
    e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
        for (const c of list) { if ('focus' in c) return c.focus(); }
        if (self.clients.openWindow) return self.clients.openWindow('./');
    }));
});
