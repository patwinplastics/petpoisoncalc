/* Host-page resizer for PetPoisonCalc embeds.
   Listens for { type: "ppc-embed-resize", height } and sets the matching iframe height.
   Ignores every other origin. Does not set cookies, analytics, or ads.
   Does not register a service worker. */
(function () {
  'use strict';

  var MIN_HEIGHT = 560;
  var PROD_ORIGIN = 'https://petpoisoncalc.com';

  function frameOrigin(frame) {
    var raw = frame.getAttribute('src') || '';
    try {
      return new URL(raw, window.location.href).origin;
    } catch (err) {
      return '';
    }
  }

  function isLocalOrigin(origin) {
    try {
      var host = new URL(origin).hostname;
      return host === 'localhost' || host === '127.0.0.1';
    } catch (err) {
      return false;
    }
  }

  function originAllowed(eventOrigin, srcOrigin) {
    if (!eventOrigin || eventOrigin !== srcOrigin) return false;
    if (eventOrigin === PROD_ORIGIN) return true;
    /* Local test hosts only. A clinic page iframes petpoisoncalc.com, so a
       localhost message cannot resize that frame. */
    return isLocalOrigin(eventOrigin);
  }

  window.addEventListener('message', function (event) {
    var data = event.data;
    if (!data || typeof data !== 'object' || data.type !== 'ppc-embed-resize') return;
    var height = Number(data.height);
    if (!isFinite(height) || height <= 0) return;

    var frames = document.querySelectorAll('.ppc-embed iframe');
    for (var i = 0; i < frames.length; i++) {
      var frame = frames[i];
      if (frame.contentWindow !== event.source) continue;
      if (!originAllowed(event.origin, frameOrigin(frame))) continue;
      frame.style.height = Math.max(MIN_HEIGHT, Math.ceil(height)) + 'px';
    }
  });
})();
