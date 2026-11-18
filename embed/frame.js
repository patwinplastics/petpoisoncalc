/* Inside the embed iframe. Theme, auto-height, species, and start over.
   Does not register a service worker, load analytics, or change calculator thresholds. */
(function () {
  'use strict';

  var CALC = {
    dog: '/calculators/grapes-raisins.js',
    cat: '/calculators/grapes-raisins-cat.js'
  };

  function params() {
    return new URLSearchParams(window.location.search);
  }

  function themeChoice() {
    var theme = params().get('theme');
    if (theme === 'light' || theme === 'dark' || theme === 'auto') return theme;
    return 'auto';
  }

  document.documentElement.setAttribute('data-theme', themeChoice());

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var nativeScroll = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function (arg) {
      if (arg && typeof arg === 'object') {
        try {
          arg = Object.assign({}, arg, { behavior: 'auto' });
        } catch (err) {
          arg = { behavior: 'auto', block: 'nearest' };
        }
      } else if (arg === 'smooth') {
        arg = 'auto';
      }
      return nativeScroll.call(this, arg);
    };
  }

  function postSize() {
    var root = document.getElementById('embed-root');
    var height = root ? root.offsetHeight : document.documentElement.scrollHeight;
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'ppc-embed-resize', height: height }, '*');
    }
  }

  var sizeQueued = false;
  function queueSize() {
    if (sizeQueued) return;
    sizeQueued = true;
    window.requestAnimationFrame(function () {
      sizeQueued = false;
      postSize();
    });
  }

  function withTheme(href, extra) {
    var url = new URL(href, window.location.href);
    url.searchParams.set('theme', themeChoice());
    if (extra) {
      Object.keys(extra).forEach(function (key) {
        url.searchParams.set(key, extra[key]);
      });
    }
    return url.pathname + url.search + url.hash;
  }

  function clearResult() {
    var wrap = document.getElementById('resultsWrap');
    if (wrap) wrap.classList.remove('visible');
    var errors = document.querySelectorAll('.error-msg.visible');
    for (var i = 0; i < errors.length; i++) errors[i].classList.remove('visible');
    queueSize();
  }

  function watchResults() {
    var results = document.getElementById('resultsWrap');
    if (!results) return;
    results.setAttribute('tabindex', '-1');
    var wasVisible = results.classList.contains('visible');
    var observer = new MutationObserver(function () {
      var visible = results.classList.contains('visible');
      if (visible && !wasVisible) {
        try {
          results.focus({ preventScroll: true });
        } catch (err) {
          results.focus();
        }
      }
      wasVisible = visible;
      queueSize();
    });
    observer.observe(results, { attributes: true, attributeFilter: ['class'] });
  }

  function bindStartOver() {
    var button = document.getElementById('startOver');
    if (!button) return;
    button.addEventListener('click', function () {
      var ids = ['weightInput', 'amountInput', 'cookieCountInput', 'countInput', 'gramInput'];
      ids.forEach(function (id) {
        var field = document.getElementById(id);
        if (field) field.value = '';
      });
      clearResult();
      var weight = document.getElementById('weightInput');
      if (weight) weight.focus();
    });
  }

  function keepThemeLinks() {
    var links = document.querySelectorAll('a.js-keep-theme');
    var fromPicker = params().get('from') === 'picker';
    for (var i = 0; i < links.length; i++) {
      var extra = fromPicker ? { from: 'picker' } : null;
      links[i].setAttribute('href', withTheme(links[i].getAttribute('href'), extra));
    }
  }

  function showPickerReturn() {
    if (params().get('from') !== 'picker') return;
    var back = document.getElementById('backToPicker');
    var link = document.getElementById('backToPickerLink');
    if (!back || !link) return;
    link.setAttribute('href', withTheme('index.html'));
    back.hidden = false;
  }

  function loadGrapes(species) {
    var script = document.createElement('script');
    script.src = CALC[species] || CALC.dog;
    script.onload = queueSize;
    document.body.appendChild(script);
  }

  function setupGrapes() {
    if (document.body.getAttribute('data-embed') !== 'grapes') return;
    var dogBtn = document.getElementById('speciesDog');
    var catBtn = document.getElementById('speciesCat');
    if (!dogBtn || !catBtn) return;

    var species = params().get('species') === 'cat' ? 'cat' : 'dog';
    dogBtn.setAttribute('aria-pressed', species === 'dog' ? 'true' : 'false');
    catBtn.setAttribute('aria-pressed', species === 'cat' ? 'true' : 'false');

    var heading = document.getElementById('embedTitle');
    var weightLabel = document.getElementById('weightLabel');
    var fruitLabel = document.getElementById('fruitLabel');
    var countLabel = document.getElementById('countLabel');
    var countHint = document.getElementById('countHint');
    var intro = document.getElementById('speciesIntro');
    var canonical = document.getElementById('canonicalLink');
    var credit = document.getElementById('creditLink');
    var doseDog = document.getElementById('doseDog');
    var doseCat = document.getElementById('doseCat');

    if (species === 'cat') {
      if (heading) heading.textContent = 'Did your cat eat grapes or raisins?';
      if (weightLabel) weightLabel.textContent = "Cat's weight";
      if (fruitLabel) fruitLabel.textContent = 'What did your cat eat?';
      if (countLabel) countLabel.textContent = 'How many did your cat eat?';
      if (countHint) countHint.textContent = 'Approximate is okay. If a bunch or box is open and you are unsure, use the highest reasonable estimate, not the lowest.';
      if (intro) intro.textContent = 'There is no known safe amount of grapes or raisins for cats. Any amount is treated as an emergency. The dose is an estimate to share with your vet.';
      if (canonical) canonical.setAttribute('href', 'https://petpoisoncalc.com/calculators/grapes-raisins-cat.html');
      if (credit) credit.setAttribute('href', 'https://petpoisoncalc.com/calculators/grapes-raisins-cat.html?utm_source=embed&utm_medium=referral&utm_campaign=widget&utm_content=inside');
      if (doseDog) doseDog.hidden = true;
      if (doseCat) doseCat.hidden = false;
      var weight = document.getElementById('weightInput');
      if (weight) weight.setAttribute('placeholder', 'e.g. 10');
      var count = document.getElementById('countInput');
      if (count) count.setAttribute('placeholder', 'e.g. 2');
    }

    function go(next) {
      if (next === species) return;
      var url = new URL(window.location.href);
      url.searchParams.set('species', next);
      url.searchParams.set('theme', themeChoice());
      window.location.assign(url.pathname + url.search);
    }
    dogBtn.addEventListener('click', function () { go('dog'); });
    catBtn.addEventListener('click', function () { go('cat'); });
    loadGrapes(species);
  }

  function setupPicker() {
    if (document.body.getAttribute('data-embed') !== 'picker') return;

    var dogList = document.getElementById('listDog');
    var catList = document.getElementById('listCat');
    var dogBtn = document.getElementById('speciesDog');
    var catBtn = document.getElementById('speciesCat');
    var species = params().get('species') === 'cat' ? 'cat' : 'dog';

    function show(next) {
      species = next;
      if (dogList) dogList.hidden = next !== 'dog';
      if (catList) catList.hidden = next !== 'cat';
      if (dogBtn) dogBtn.setAttribute('aria-pressed', next === 'dog' ? 'true' : 'false');
      if (catBtn) catBtn.setAttribute('aria-pressed', next === 'cat' ? 'true' : 'false');
      var links = document.querySelectorAll('#list' + (next === 'cat' ? 'Cat' : 'Dog') + ' a.js-keep-theme');
      for (var i = 0; i < links.length; i++) {
        links[i].setAttribute('href', withTheme(links[i].getAttribute('data-base') || links[i].getAttribute('href'), { from: 'picker' }));
      }
      queueSize();
    }

    if (dogBtn) dogBtn.addEventListener('click', function () { show('dog'); });
    if (catBtn) catBtn.addEventListener('click', function () { show('cat'); });
    show(species);

    var toxin = params().get('toxin') || '';
    if (!/^[a-z0-9-]+$/.test(toxin)) return;
    var scope = document.getElementById(species === 'cat' ? 'listCat' : 'listDog');
    if (!scope) return;
    var match = scope.querySelector('[data-toxin="' + toxin + '"]');
    if (!match) return;
    if (match.hasAttribute('data-embed-toxin')) {
      window.location.replace(match.getAttribute('href'));
      return;
    }
    match.classList.add('is-current');
    try { match.focus({ preventScroll: true }); } catch (err) { match.focus(); }
  }

  function ready() {
    keepThemeLinks();
    showPickerReturn();
    setupGrapes();
    setupPicker();
    bindStartOver();
    watchResults();

    var observed = document.querySelectorAll('.error-msg, #cookieFields, #chocolateFields, #gramInputWrap, #listDog, #listCat');
    if (observed.length && window.MutationObserver) {
      var layout = new MutationObserver(queueSize);
      for (var i = 0; i < observed.length; i++) {
        layout.observe(observed[i], { attributes: true, attributeFilter: ['class', 'hidden'] });
      }
    }
    if (window.ResizeObserver) {
      var root = document.getElementById('embed-root');
      if (root) new ResizeObserver(queueSize).observe(root);
    }
    window.addEventListener('resize', queueSize);
    window.addEventListener('load', function () {
      queueSize();
      /* embed.js is async on the host page, so repeat until it is listening. */
      [200, 600, 1200, 2000].forEach(function (ms) { setTimeout(queueSize, ms); });
    });
    queueSize();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready);
  } else {
    ready();
  }
})();
