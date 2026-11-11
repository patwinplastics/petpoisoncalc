(function () {
  'use strict';
  /* Offline support: registers /sw.js, shows a calm banner when the device is offline, and
     runs the "Keep it on your phone" box on the homepage. Everything stays on this device. */
  var swOk = 'serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1');

  if (swOk) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () {});
    });
  }

  // Offline banner on every page.
  var banner = null;
  function showOffline() {
    if (banner) { banner.hidden = false; return; }
    banner = document.createElement('div');
    banner.className = 'offline-banner';
    banner.setAttribute('role', 'status');
    banner.innerHTML = '<strong>You are offline.</strong> Saved calculators still work. Phone calls do not need internet: ASPCA Animal Poison Control <a href="tel:8884264435">(888) 426-4435</a>, Pet Poison Helpline <a href="tel:8557647661">(855) 764-7661</a>.';
    var nav = document.querySelector('.site-nav');
    if (nav && nav.parentNode) { nav.parentNode.insertBefore(banner, nav.nextSibling); } else { document.body.insertBefore(banner, document.body.firstChild); }
  }
  function hideOffline() { if (banner) { banner.hidden = true; } }
  window.addEventListener('offline', showOffline);
  window.addEventListener('online', hideOffline);
  if (navigator.onLine === false) {
    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', showOffline); } else { showOffline(); }
  }

  // Homepage box.
  function initBox() {
    var box = document.getElementById('offlineBox');
    if (!box) { return; }
    var status = document.getElementById('offlineStatus');
    var btn = document.getElementById('installBtn');
    var hint = document.getElementById('installHint');
    var standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
    var ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (!swOk) {
      status.textContent = 'This browser cannot save the calculators for offline use. Bookmark this page and save the poison control numbers in your contacts instead.';
    } else {
      status.textContent = 'Saving the calculators to this device...';
      navigator.serviceWorker.ready.then(function () {
        status.textContent = 'Saved on this device. All calculators, the guides list, and the poison-proofing checklist now open without internet in this browser.';
        box.classList.add('is-ready');
      });
    }

    if (standalone) {
      hint.hidden = false;
      hint.textContent = 'You are using the installed app. It opens from your home screen, even offline.';
      return;
    }
    var deferred = null;
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferred = e;
      btn.hidden = false;
      hint.hidden = true;
    });
    btn.addEventListener('click', function () {
      if (!deferred) { return; }
      deferred.prompt();
      deferred.userChoice.then(function () { deferred = null; btn.hidden = true; });
    });
    window.addEventListener('appinstalled', function () {
      btn.hidden = true;
      hint.hidden = false;
      hint.textContent = 'Installed. Look for the PetPoisonCalc icon on your home screen.';
      if (typeof window.gtag === 'function') { window.gtag('event', 'app_installed'); }
    });
    hint.hidden = false;
    hint.textContent = ios
      ? 'On iPhone or iPad: tap the Share button in Safari, then Add to Home Screen.'
      : 'To add an icon to your home screen, open your browser menu and choose Install app or Add to Home screen.';
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initBox); } else { initBox(); }
})();
