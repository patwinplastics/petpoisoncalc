/* Tap-to-open sections: open the section that holds a linked #anchor, and open all of them for printing. */
(function () {
  'use strict';
  function openFor(hash) {
    if (!hash || hash.length < 2) { return; }
    var el;
    try { el = document.getElementById(decodeURIComponent(hash.slice(1))); } catch (e) { return; }
    if (!el) { return; }
    var d = el.closest ? el.closest('details') : null;
    var opened = false;
    while (d) { if (!d.open) { d.open = true; opened = true; } d = d.parentElement ? d.parentElement.closest('details') : null; }
    if (opened) { el.scrollIntoView(); }
  }
  openFor(location.hash);
  window.addEventListener('hashchange', function () { openFor(location.hash); });
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href*="#"]');
    if (!a || a.pathname !== location.pathname) { return; }
    openFor(a.hash);
  });
  window.addEventListener('beforeprint', function () {
    Array.prototype.forEach.call(document.querySelectorAll('details.fold'), function (d) { d.open = true; });
  });
})();
