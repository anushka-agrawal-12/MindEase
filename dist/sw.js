/* MindEase service worker: keeps the app shell available offline. Never touches /api. */
var V = 'mindease-v1', SHELL = ['/app', '/css/mindease.css', '/js/mo.js', '/js/i18n.js', '/js/sound.js', '/js/fx.js', '/js/app.js', '/js/you.js', '/js/extras.js', '/js/plan.js', '/js/share.js', '/js/account.js', '/fonts/fraunces.woff2', '/fonts/nunito.woff2'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(V).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== V; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener('fetch', function (e) {
  var r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || u.pathname.indexOf('/api/') === 0) return;
  // network first so updates show up, cache as the fallback when offline
  e.respondWith(fetch(r).then(function (res) { if (res.ok) { var cp = res.clone(); caches.open(V).then(function (c) { c.put(r, cp); }); } return res; }).catch(function () { return caches.match(r).then(function (m) { return m || caches.match('/app'); }); }));
});
