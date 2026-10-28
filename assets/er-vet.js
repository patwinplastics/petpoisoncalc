(function () {
  'use strict';
  /* Find a 24/7 emergency vet near me.
     Opens a Google Maps search for emergency vets that are open 24 hours. PetPoisonCalc never
     asks for or sees your location: Maps uses whatever location you have already allowed in
     your own browser or Maps app. The only thing recorded here is an anonymous "er_vet_click"
     analytics event (no location, no pet details) so we can tell whether the button helps. */
  var URL = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('24 hour emergency vet');
  var NOTE = 'Opens Google Maps in a new tab. We never see your location.';

  function pinSvg() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22c5.5-4 8-7.5 8-12A8 8 0 0 0 4 10c0 4.5 2.5 8 8 12Z"/><circle cx="12" cy="10" r="3"/></svg>';
  }
  function track(where) {
    try { if (typeof window.gtag === 'function') { window.gtag('event', 'er_vet_click', { placement: where }); } } catch (e) { /* ignore */ }
  }
  function link(cls, where, html, label) {
    var a = document.createElement('a');
    a.className = cls;
    a.href = URL;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.setAttribute('data-er-vet', where);
    if (label) { a.setAttribute('aria-label', label); }
    a.innerHTML = html;
    return a;
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[data-er-vet]') : null;
    if (a) { track(a.getAttribute('data-er-vet')); }
  });

  // 1. Calculator results: add the button to every result's action list.
  var block = document.getElementById('actionBlock');
  if (block) {
    var add = function () {
      if (!block.children.length || block.querySelector('[data-er-vet]')) { return; }
      var a = link('call-btn er-vet-btn', 'result',
        pinSvg() + '<span><span class="call-title">Find a 24/7 emergency vet near me</span><span class="call-sub">' + NOTE + '</span></span>',
        'Find a 24/7 emergency vet near me (opens Google Maps in a new tab)');
      var hotlines = block.querySelectorAll('a[href^="tel:"]');
      var after = hotlines.length ? hotlines[hotlines.length - 1] : null;
      if (after && after.nextSibling) { block.insertBefore(a, after.nextSibling); } else { block.appendChild(a); }
    };
    new MutationObserver(add).observe(block, { childList: true });
    add();
  }

  // 2. Mobile sticky call bar (every page): a second, shorter button next to the call link.
  var bar = document.querySelector('.sticky-call-bar');
  if (bar && !bar.querySelector('[data-er-vet]')) {
    bar.appendChild(link('er-vet-sticky', 'sticky', pinSvg() + 'ER vet<span class="er-vet-more"> near me</span>', 'Find a 24/7 emergency vet near me (opens Google Maps in a new tab)'));
    var er = bar.querySelector('[data-er-vet]');
    var fit = function () {
      var a = bar.firstElementChild.getBoundingClientRect(), c = er.getBoundingClientRect();
      bar.classList.toggle('stacked', c.height > 0 && c.top >= a.bottom - 2);
    };
    fit();
    window.addEventListener('resize', fit);
    window.addEventListener('load', fit);
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(fit); }
  }
})();
