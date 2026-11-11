/* PetPoisonCalc offline support.
   Saves copies of this site's own pages and scripts in the browser's cache so the calculators
   keep working without a signal. It only handles requests to petpoisoncalc.com itself: ads,
   analytics, maps, and every other outside request are left alone. Nothing a visitor types
   into a calculator is stored or sent anywhere by this file.
   Strategy: network first (so medical content is always the latest when online), falling back
   to the saved copy when the network fails or takes longer than a few seconds. */
'use strict';
var VERSION = 'ppc-2026111202';
var PRECACHE = [
  '/',
  '/guides/index.html',
  '/pages/poison-proofing-checklist.html',
  '/pages/medical-disclaimer.html',
  '/pages/privacy.html',
  '/404.html',
  '/base.css',
  '/style.css',
  '/assets/site-shell.css',
  '/assets/mascot.svg',
  '/assets/favicon.svg',
  '/manifest.webmanifest',
  '/assets/icon-192.png',
  '/assets/email-signup.js',
  '/assets/er-vet.js',
  '/assets/fold.js',
  '/assets/home.js',
  '/assets/ingest-timer.js',
  '/assets/offline.js',
  '/assets/pet-profiles.js',
  '/assets/share-result.js',
  '/assets/shell.js',
  '/assets/fonts/Fraunces-var.woff2',
  '/assets/fonts/IBMPlexMono-600.woff2',
  '/assets/fonts/IBMPlexMono-700.woff2',
  '/assets/fonts/Inter-var.woff2',
  '/calculators/acetaminophen.html',
  '/calculators/antifreeze.html',
  '/calculators/aspirin.html',
  '/calculators/bromethalin.html',
  '/calculators/chocolate.html',
  '/calculators/grapes-raisins-cat.html',
  '/calculators/grapes-raisins.html',
  '/calculators/ibuprofen.html',
  '/calculators/lily-cats.html',
  '/calculators/macadamia-nuts.html',
  '/calculators/marijuana-thc.html',
  '/calculators/naproxen.html',
  '/calculators/nicotine.html',
  '/calculators/onions-garlic.html',
  '/calculators/rat-poison.html',
  '/calculators/salt-ice-melt.html',
  '/calculators/xylitol.html',
  '/calculators/acetaminophen.js',
  '/calculators/antifreeze.js',
  '/calculators/aspirin.js',
  '/calculators/bromethalin.js',
  '/calculators/chocolate.js',
  '/calculators/grapes-raisins-cat.js',
  '/calculators/grapes-raisins.js',
  '/calculators/ibuprofen.js',
  '/calculators/lily-cats.js',
  '/calculators/macadamia-nuts.js',
  '/calculators/marijuana-thc.js',
  '/calculators/naproxen.js',
  '/calculators/nicotine.js',
  '/calculators/onions-garlic.js',
  '/calculators/rat-poison.js',
  '/calculators/salt-ice-melt.js',
  '/calculators/xylitol.js',
  '/assets/img/thumb-acet-240.webp',
  '/assets/img/thumb-antifreeze-240.webp',
  '/assets/img/thumb-aspirin-240.webp',
  '/assets/img/thumb-brom-240.webp',
  '/assets/img/thumb-catgrape-240.webp',
  '/assets/img/thumb-chocolate-240.webp',
  '/assets/img/thumb-grapes-240.webp',
  '/assets/img/thumb-ibuprofen-240.webp',
  '/assets/img/thumb-lily-easter-240.webp',
  '/assets/img/thumb-macadamia-240.webp',
  '/assets/img/thumb-naproxen-240.webp',
  '/assets/img/thumb-nicotine-240.webp',
  '/assets/img/thumb-onion-240.webp',
  '/assets/img/thumb-rat-240.webp',
  '/assets/img/thumb-salt-240.webp',
  '/assets/img/thumb-thc-240.webp',
  '/assets/img/thumb-xylitol-240.webp'
];
var TIMEOUT_MS = 3500;

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(VERSION).then(function (cache) {
      return Promise.all(PRECACHE.map(function (url) {
        return fetch(url, { cache: 'no-cache' }).then(function (res) {
          if (res.ok) { return cache.put(url, res); }
        }).catch(function () {});
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k.indexOf('ppc-') === 0 && k !== VERSION; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

function cacheKey(url) {
  var u = new URL(url);
  var path = u.pathname === '/index.html' ? '/' : u.pathname;
  return u.origin + path;
}

function fromCache(request) {
  return caches.open(VERSION).then(function (cache) {
    return cache.match(cacheKey(request.url)).then(function (hit) {
      if (hit || request.mode !== 'navigate') { return hit; }
      return cache.match(self.location.origin + '/');
    });
  });
}

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') { return; }
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) { return; }

  event.respondWith(new Promise(function (resolve) {
    var settled = false;
    function done(res) { if (!settled && res) { settled = true; resolve(res); } }
    var network = fetch(req).then(function (res) {
      if (res && res.ok && res.type === 'basic') {
        var copy = res.clone();
        caches.open(VERSION).then(function (cache) { cache.put(cacheKey(req.url), copy); });
      }
      return res;
    });
    var timer = setTimeout(function () { fromCache(req).then(done); }, TIMEOUT_MS);
    network.then(function (res) { clearTimeout(timer); done(res); }).catch(function () {
      clearTimeout(timer);
      fromCache(req).then(function (hit) {
        if (hit) { done(hit); return; }
        settled = true;
        if (req.mode !== 'navigate') { resolve(Response.error()); return; }
        resolve(new Response('You are offline and this page has not been saved yet. Call ASPCA Animal Poison Control at (888) 426-4435 or Pet Poison Helpline at (855) 764-7661.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }));
      });
    });
    // If the cache had nothing at the timeout, keep waiting for the network.
    network.then(function (res) { done(res); }).catch(function () {});
  }));
});
