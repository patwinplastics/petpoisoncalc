(function () {
  'use strict';
  var input = document.getElementById('calcFilter');
  var grid = document.getElementById('calcGrid');
  var status = document.getElementById('calcFilterStatus');
  if (!input || !grid) { return; }
  // Extra search words so common product and brand names find the right card.
  var KEYWORDS = {
    'chocolate': 'cocoa brownie candy bar baking dark milk',
    'grapes-raisins': 'raisin currant sultana trail mix fruit',
    'xylitol': 'gum sugar-free mint peanut butter birch sugar candy',
    'onions-garlic': 'onion garlic leek chive shallot powder allium',
    'ibuprofen': 'advil motrin nsaid pain pill medicine',
    'naproxen': 'aleve naprosyn anaprox midol naproxen sodium nsaid pain pill medicine',
    'marijuana-thc': 'weed cannabis pot edible gummy thc cbd brownie',
    'lily-cats': 'lily lilies flower plant pollen vase cat daylily easter',
    'acetaminophen': 'tylenol paracetamol pain pill medicine cold flu cat',
    'macadamia-nuts': 'nut nuts cookie',
    'rat-poison': 'mouse rodent bait rodenticide d-con bromethalin warfarin'
  };
  var cards = Array.prototype.slice.call(grid.querySelectorAll('.calc-picker-card'));
  cards.forEach(function (card) {
    var m = (card.getAttribute('href') || '').match(/calculators\/([a-z-]+)\.html/);
    card.setAttribute('data-search', (card.textContent + ' ' + (m ? KEYWORDS[m[1]] || '' : '')).toLowerCase());
  });
  input.addEventListener('input', function () {
    var q = input.value.trim().toLowerCase();
    var shown = 0;
    cards.forEach(function (card) {
      var match = !q || q.split(/\s+/).every(function (w) { return card.getAttribute('data-search').indexOf(w) !== -1; });
      card.hidden = !match;
      if (match) { shown++; }
    });
    if (!q) {
      status.textContent = '';
    } else if (shown === 0) {
      status.innerHTML = '<img class="no-results-mascot" src="./assets/mascot.svg?v=2026102003" width="88" height="64" alt="" /> No calculator matches yet. If your pet ate something toxic, call ASPCA Animal Poison Control at <a href="tel:8884264435">(888) 426-4435</a> or Pet Poison Helpline at <a href="tel:8557647661">(855) 764-7661</a>.';
    } else {
      status.textContent = shown + (shown === 1 ? ' calculator matches.' : ' calculators match.');
    }
  });
})();
