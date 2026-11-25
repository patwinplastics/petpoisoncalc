(function () {
  'use strict';
  /* "Ate several things" helper. The planner page lets a visitor tick several items and enter a
     weight once; each calculator then opens with that weight filled in, and a small bar on the
     calculator shows what is left to check. The list lives in sessionStorage (this tab only,
     cleared when the tab closes) and the weight rides in the calculator link. Nothing is sent
     to PetPoisonCalc or anyone else. This file never changes how any calculator scores a dose. */
  var KEY = 'ppc-several-v1';
  // slug: [label, has a dog calculator, has a cat calculator]
  var ITEMS = [
    ['chocolate', 'Chocolate or cocoa', 1, 0],
    ['grapes-raisins', 'Grapes or raisins', 1, 0],
    ['grapes-raisins-cat', 'Grapes or raisins', 0, 1],
    ['lily-cats', 'Lilies (flower, leaf, pollen, vase water)', 0, 1],
    ['xylitol', 'Xylitol (sugar-free gum, mints, some peanut butter)', 1, 0],
    ['onions-garlic', 'Onions or garlic', 1, 0],
    ['macadamia-nuts', 'Macadamia nuts', 1, 0],
    ['ibuprofen', 'Ibuprofen (Advil, Motrin)', 1, 0],
    ['naproxen', 'Naproxen (Aleve)', 1, 0],
    ['aspirin', 'Aspirin', 1, 1],
    ['acetaminophen', 'Acetaminophen (Tylenol)', 1, 1],
    ['marijuana-thc', 'Marijuana or THC edibles', 1, 0],
    ['nicotine', 'Nicotine (vapes, pouches, cigarettes, gum)', 1, 1],
    ['rat-poison', 'Rat or mouse poison (blood thinner type)', 1, 0],
    ['bromethalin', 'Bromethalin rat or mouse bait', 1, 1],
    ['antifreeze', 'Antifreeze or coolant', 1, 1],
    ['salt-ice-melt', 'Salt, ice melt, or salt dough', 1, 1],
    ['caffeine', 'Caffeine (coffee grounds, pills, energy drinks)', 1, 1]
  ];
  var NO_WEIGHT = { 'lily-cats': 1, 'rat-poison': 1 };
  var PAIN = { ibuprofen: 1, naproxen: 1, aspirin: 1, acetaminophen: 1 };
  var CAT_EMERGENCY = { 'grapes-raisins-cat': 1, aspirin: 1, acetaminophen: 1, antifreeze: 1, nicotine: 1, 'salt-ice-melt': 1, caffeine: 1 };
  var DOG_EMERGENCY = { antifreeze: 1 };
  function find(slug) { for (var i = 0; i < ITEMS.length; i++) { if (ITEMS[i][0] === slug) { return ITEMS[i]; } } return null; }
  function load() { try { var p = JSON.parse(window.sessionStorage.getItem(KEY) || 'null'); return p && p.items && p.items.length ? p : null; } catch (e) { return null; } }
  function save(p) { try { window.sessionStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { /* storage off: links still carry the weight */ } }
  function clear() { try { window.sessionStorage.removeItem(KEY); } catch (e) { /* ignore */ } }
  function link(base, p, slug) {
    var q = [];
    if (p.w > 0 && !NO_WEIGHT[slug]) { q.push('w=' + encodeURIComponent(p.w), 'u=' + (p.u === 'kg' ? 'kg' : 'lbs')); }
    q.push('sp=' + (p.sp === 'cat' ? 'cat' : 'dog'), 'from=several');
    return base + slug + '.html?' + q.join('&');
  }
  function css(text) { var s = document.createElement('style'); s.textContent = text; document.head.appendChild(s); }
  css('.multi-items{border:0;padding:0;margin-left:0;margin-right:0;min-width:0}' +
    '.multi-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:var(--space-2);margin-top:var(--space-2)}' +
    '.multi-grid label{display:flex;gap:var(--space-2);align-items:center;padding:var(--space-2) var(--space-3);border:1px solid var(--color-divider);border-radius:var(--radius-md);cursor:pointer;min-height:44px}' +
    '.multi-grid input{width:20px;height:20px;flex:0 0 auto}' +
    '.multi-list{padding-left:var(--space-5);margin:var(--space-3) 0}.multi-list li{margin:var(--space-2) 0}' +
    '.multi-list a{font-weight:700}.multi-tag{display:inline-block;margin-left:var(--space-2);font-size:var(--text-xs);font-weight:700;color:var(--color-error,#b42318)}' +
    '.multi-done{color:var(--color-text-muted);font-size:var(--text-sm);margin-left:var(--space-2)}' +
    '.multi-bar{display:flex;flex-wrap:wrap;gap:var(--space-2) var(--space-4);align-items:center;padding:var(--space-3) var(--space-4);margin:0 0 var(--space-4);border:2px solid var(--color-primary);border-radius:var(--radius-md);font-size:var(--text-sm)}' +
    '.multi-bar a{font-weight:700}');

  /* ---------- Planner page ---------- */
  var form = document.getElementById('multiForm');
  if (form) {
    var sp = 'dog', unit = 'lbs';
    var dogB = document.getElementById('mSpDog'), catB = document.getElementById('mSpCat');
    var lbsB = document.getElementById('mLbs'), kgB = document.getElementById('mKg');
    var wIn = document.getElementById('mWeight'), wUnit = document.getElementById('mWeightUnit');
    var grid = document.getElementById('mItems'), plan = document.getElementById('mPlan'), list = document.getElementById('mList');
    var wErr = document.getElementById('mWeightError'), iErr = document.getElementById('mItemsError');
    function renderItems(checked) {
      grid.innerHTML = '';
      ITEMS.forEach(function (it) {
        if (sp === 'dog' ? !it[2] : !it[3]) { return; }
        var l = document.createElement('label');
        var c = document.createElement('input'); c.type = 'checkbox'; c.value = it[0]; c.checked = !!(checked && checked.indexOf(it[0]) !== -1);
        l.appendChild(c); l.appendChild(document.createTextNode(it[1])); grid.appendChild(l);
      });
      document.getElementById('mCatNote').hidden = sp !== 'cat';
    }
    function setSp(v) { sp = v; dogB.setAttribute('aria-pressed', v === 'dog'); catB.setAttribute('aria-pressed', v === 'cat'); renderItems([]); }
    function setUnit(v) { unit = v; lbsB.setAttribute('aria-pressed', v === 'lbs'); kgB.setAttribute('aria-pressed', v === 'kg'); wUnit.textContent = v; }
    dogB.addEventListener('click', function () { setSp('dog'); });
    catB.addEventListener('click', function () { setSp('cat'); });
    lbsB.addEventListener('click', function () { setUnit('lbs'); });
    kgB.addEventListener('click', function () { setUnit('kg'); });
    function showPlan(p) {
      list.innerHTML = '';
      var pain = 0;
      p.items.forEach(function (slug) {
        var it = find(slug); if (!it) { return; }
        if (PAIN[slug]) { pain++; }
        var li = document.createElement('li');
        var a = document.createElement('a'); a.href = link('../calculators/', p, slug); a.textContent = 'Check ' + it[1] + ' \u2192';
        li.appendChild(a);
        if ((p.sp === 'cat' ? CAT_EMERGENCY : DOG_EMERGENCY)[slug]) { var t = document.createElement('span'); t.className = 'multi-tag'; t.textContent = 'Any amount: emergency'; li.appendChild(t); }
        if (p.done && p.done.indexOf(slug) !== -1) { var d = document.createElement('span'); d.className = 'multi-done'; d.textContent = '\u2713 opened'; li.appendChild(d); }
        list.appendChild(li);
      });
      var note = p.items.length + (p.items.length === 1 ? ' item' : ' items') + ' for your ' + p.sp + '. Open each one, enter the amount, and tell poison control every result.';
      if (pain > 1) { note += ' More than one pain reliever: say so on the call.'; }
      document.getElementById('mPlanNote').textContent = note;
      plan.hidden = false;
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var items = Array.prototype.map.call(grid.querySelectorAll('input:checked'), function (c) { return c.value; });
      var w = parseFloat(wIn.value);
      var needW = items.some(function (s) { return !NO_WEIGHT[s]; });
      iErr.classList.toggle('visible', !items.length);
      wErr.classList.toggle('visible', needW && !(w > 0));
      if (!items.length || (needW && !(w > 0))) { return; }
      var p = { sp: sp, w: w > 0 ? w : 0, u: unit, items: items, done: [] };
      save(p); showPlan(p);
      plan.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    document.getElementById('mReset').addEventListener('click', function () { clear(); plan.hidden = true; list.innerHTML = ''; wIn.value = ''; setSp('dog'); setUnit('lbs'); wIn.focus(); });
    var saved = load();
    if (saved) { sp = saved.sp; dogB.setAttribute('aria-pressed', sp === 'dog'); catB.setAttribute('aria-pressed', sp === 'cat'); setUnit(saved.u); if (saved.w) { wIn.value = saved.w; } renderItems(saved.items); showPlan(saved); }
    else { renderItems([]); }
    return;
  }

  /* ---------- Calculator pages ---------- */
  var m = window.location.pathname.match(/calculators\/([a-z-]+)\.html/);
  if (!m) { return; }
  var slug = m[1];
  var params;
  try { params = new URLSearchParams(window.location.search); } catch (e) { return; }
  if (params.get('from') !== 'several') { return; }
  var w = parseFloat(params.get('w'));
  var u = params.get('u') === 'kg' ? 'kg' : 'lbs';
  if (params.get('sp') === 'cat') { var c = document.getElementById('spCat'); if (c && c.getAttribute('aria-pressed') !== 'true') { c.click(); } }
  var wIn2 = document.getElementById('weightInput');
  if (wIn2 && w > 0 && w < 1000) {
    var ub = document.getElementById(u === 'kg' ? 'unitKg' : 'unitLbs');
    if (ub && ub.getAttribute('aria-pressed') !== 'true') { ub.click(); }
    wIn2.value = String(w);
    wIn2.dispatchEvent(new Event('input', { bubbles: true }));
    wIn2.dispatchEvent(new Event('change', { bubbles: true }));
  }
  var p = load();
  if (!p || p.items.indexOf(slug) === -1) { return; }
  if (!p.done) { p.done = []; }
  if (p.done.indexOf(slug) === -1) { p.done.push(slug); save(p); }
  var idx = p.items.indexOf(slug);
  var next = null;
  for (var i = 1; i < p.items.length; i++) { var s = p.items[(idx + i) % p.items.length]; if (p.done.indexOf(s) === -1) { next = s; break; } }
  var bar = document.createElement('div');
  bar.className = 'multi-bar no-print';
  bar.setAttribute('role', 'note');
  var t = document.createElement('span');
  t.textContent = 'Checking ' + p.items.length + ' things: ' + (idx + 1) + ' of ' + p.items.length + '.';
  bar.appendChild(t);
  if (next) { var a = document.createElement('a'); a.href = link('./', p, next); a.textContent = 'Next: ' + find(next)[1] + ' \u2192'; bar.appendChild(a); }
  var back = document.createElement('a'); back.href = '../pages/ate-several-things.html'; back.textContent = 'Back to my list'; bar.appendChild(back);
  var h1 = document.querySelector('.site-header h1');
  if (h1) { h1.parentNode.insertBefore(bar, h1.nextSibling); }
})();
