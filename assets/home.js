(function () {
  'use strict';
  // Seasonal banners: show only between data-start and data-end (MM-DD, inclusive, local date).
  var today = new Date();
  var md = ('0' + (today.getMonth() + 1)).slice(-2) + '-' + ('0' + today.getDate()).slice(-2);
  Array.prototype.forEach.call(document.querySelectorAll('.seasonal-banner[data-start][data-end]'), function (b) {
    if (md >= b.getAttribute('data-start') && md <= b.getAttribute('data-end')) { b.hidden = false; }
  });
  // Seasonal quick-pick chips: same idea, but a range may wrap past New Year (e.g. 11-04 to 01-06).
  Array.prototype.forEach.call(document.querySelectorAll('.eat-chip[data-start][data-end]'), function (c) {
    var a = c.getAttribute('data-start'), z = c.getAttribute('data-end');
    if (a <= z ? (md >= a && md <= z) : (md >= a || md <= z)) { c.hidden = false; }
  });
})();
(function () {
  'use strict';
  var input = document.getElementById('calcFilter');
  var grid = document.getElementById('calcGrid');
  var status = document.getElementById('calcFilterStatus');
  var form = document.getElementById('calcSearchForm');
  if (!input || !grid) { return; }
  function track(name, params) {
    try { if (typeof window.gtag === 'function') { window.gtag('event', name, params); } } catch (e) { /* ignore */ }
  }
  // Extra search words so common product and brand names find the right card.
  var KEYWORDS = {
    'chocolate': 'cocoa brownie candy bar baking dark milk halloween trick treat christmas holiday fudge gelt cookie',
    'grapes-raisins': 'raisin currant sultana trail mix fruit fruitcake stollen mince pie christmas',
    'xylitol': 'gum sugar-free mint peanut butter birch sugar candy',
    'onions-garlic': 'onion garlic leek chive shallot powder allium',
    'ibuprofen': 'advil motrin nsaid pain pill medicine',
    'naproxen': 'aleve naprosyn anaprox midol naproxen sodium nsaid pain pill medicine',
    'aspirin': 'bayer bufferin ecotrin excedrin baby low-dose 81 acetylsalicylic salicylate nsaid pain pill medicine cat',
    'marijuana-thc': 'weed cannabis pot edible gummy thc cbd brownie',
    'lily-cats': 'lily lilies flower plant pollen vase cat daylily easter bouquet christmas holiday',
    'acetaminophen': 'tylenol paracetamol pain pill medicine cold flu cat',
    'macadamia-nuts': 'nut nuts cookie',
    'rat-poison': 'mouse rodent bait rodenticide d-con bromethalin warfarin',
    'nicotine': 'cigarette butt cigar tobacco smoking vape vaping e-cigarette e-liquid juul pod gum lozenge patch pouch zyn snuff chew',
    'bromethalin': 'rat mouse poison rodent bait block pellet rodenticide tomcat',
    'grapes-raisins-cat': 'grape raisin currant sultana fruit kitten',
    'antifreeze': 'coolant radiator ethylene glycol engine car garage puddle leak drip snow globe brake fluid de-icer deicer winter prestone cabin toilet rv',
    'salt-ice-melt': 'salt rock salt ice melt icemelt ice-melt de-icer deicer sidewalk driveway snow winter paws calcium chloride magnesium chloride potassium chloride urea halite sea salt kosher table salt dough ornament playdough play-doh play dough christmas craft'
  };
  var cards = Array.prototype.slice.call(grid.querySelectorAll('.calc-picker-card'));
  cards.forEach(function (card) {
    var m = (card.getAttribute('href') || '').match(/calculators\/([a-z-]+)\.html/);
    card.setAttribute('data-search', (card.textContent + ' ' + (m ? KEYWORDS[m[1]] || '' : '')).toLowerCase());
  });
  var NO_MATCH = '<img class="no-results-mascot" src="./assets/mascot.svg?v=2026102003" width="88" height="64" alt="" /> No calculator matches yet. If your pet ate something toxic, call ASPCA Animal Poison Control at <a href="tel:8884264435">(888) 426-4435</a> or Pet Poison Helpline at <a href="tel:8557647661">(855) 764-7661</a>.';
  // Ambiguous words: when the query is exactly one of these, open the most common culprit first.
  var PREFER = { 'gum': 'xylitol', 'sugar free gum': 'xylitol', 'sugar-free gum': 'xylitol', 'mint': 'xylitol', 'mints': 'xylitol', 'candy': 'chocolate', 'brownie': 'chocolate', 'brownies': 'chocolate', 'cookie': 'chocolate', 'cookies': 'chocolate', 'rat poison': 'rat-poison', 'mouse poison': 'rat-poison', 'pill': 'ibuprofen', 'pills': 'ibuprofen' };
  var top = null;
  function titleOf(card) { var h = card.querySelector('h3'); return h ? h.textContent.trim() : ''; }
  // Filter the cards and pick the best match: a hit in the card title beats a keyword-only hit.
  function update() {
    var q = input.value.trim().toLowerCase();
    var words = q ? q.split(/\s+/) : [];
    var shown = 0, best = null, bestScore = -1;
    cards.forEach(function (card) {
      var match = !q || words.every(function (w) { return card.getAttribute('data-search').indexOf(w) !== -1; });
      card.hidden = !match;
      card.classList.remove('is-top-match');
      if (match) {
        shown++;
        if (q) {
          var t = titleOf(card).toLowerCase();
          var slug = ((card.getAttribute('href') || '').match(/calculators\/([a-z-]+)\.html/) || [])[1];
          var score = PREFER[q] === slug ? 4 : t.indexOf(q) === 0 ? 3 : (words.every(function (w) { return t.indexOf(w) !== -1; }) ? 2 : 1);
          if (score > bestScore) { best = card; bestScore = score; }
        }
      }
    });
    top = best;
    if (!q) {
      status.textContent = '';
    } else if (shown === 0) {
      status.innerHTML = NO_MATCH;
    } else {
      top.classList.add('is-top-match');
      status.textContent = 'Best match: ' + titleOf(top) + '. Press Check Risk to open it' + (shown > 1 ? ', or pick from the ' + shown + ' matches below.' : '.');
    }
  }
  input.addEventListener('input', update);
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      update();
      var q = input.value.trim();
      if (!q) {
        status.textContent = 'Type what your pet ate, or tap an item below.';
        input.focus();
        return;
      }
      if (top) {
        track('home_search_go', { query: q.slice(0, 40).toLowerCase(), calculator: top.getAttribute('href') });
        window.location.href = top.getAttribute('href');
      } else {
        track('home_search_no_match', { query: q.slice(0, 40).toLowerCase() });
      }
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll('.eat-chip'), function (chip) {
    chip.addEventListener('click', function () { track('home_chip_click', { calculator: chip.getAttribute('href') }); });
  });
})();
