(function () {
  'use strict';
  // Theme toggle lives in /assets/shell.js.

  var ACT_ASPCA = { primary: true, tel: '8884264435', title: 'Call ASPCA Animal Poison Control', sub: '(888) 426-4435 · 24/7 · consultation fee applies' };
  var ACT_PPH = { primary: false, tel: '8557647661', title: 'Call Pet Poison Helpline', sub: '(855) 764-7661 · 24/7 · consultation fee applies' };

  function callBtnSvg() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z"/></svg>';
  }
  function pinSvg() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22c5.5-4 8-7.5 8-12A8 8 0 0 0 4 10c0 4.5 2.5 8 8 12Z"/><circle cx="12" cy="10" r="3"/></svg>';
  }
  function $(id) { return document.getElementById(id); }

  var state = { weightUnit: 'lbs' };
  function setUnit(u) {
    state.weightUnit = u;
    $('unitLbs').setAttribute('aria-pressed', u === 'lbs' ? 'true' : 'false');
    $('unitKg').setAttribute('aria-pressed', u === 'kg' ? 'true' : 'false');
    $('weightUnitLabel').textContent = u;
  }
  $('unitLbs').addEventListener('click', function () { setUnit('lbs'); });
  $('unitKg').addEventListener('click', function () { setUnit('kg'); });

  function segGroup(buttons, onPick) {
    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        buttons.forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
        onPick(b);
      });
    });
  }
  function showError(id, bad) { $(id).classList.toggle('visible', !!bad); return !bad; }

  function render(tier, copy, detailExtra, dose1, dose2) {
    $('resultBanner').className = 'result-banner tier-' + tier;
    $('tierLabelText').textContent = copy.label;
    $('resultHeadline').textContent = copy.headline;
    $('resultDetail').textContent = copy.detail + (detailExtra ? ' ' + detailExtra : '');
    $('doseMgKg').textContent = dose1;
    $('doseTotal').textContent = dose2;
    var block = $('actionBlock');
    block.innerHTML = '';
    copy.actions.forEach(function (a) {
      var el = document.createElement(a.tel ? 'a' : 'div');
      el.className = 'call-btn' + (a.primary ? ' primary-call' : '');
      if (a.tel) { el.href = 'tel:' + a.tel; }
      el.innerHTML = (a.tel ? callBtnSvg() : pinSvg()) + '<span><span class="call-title">' + a.title + '</span><span class="call-sub">' + a.sub + '</span></span>';
      block.appendChild(el);
    });
    $('resultsWrap').classList.add('visible');
    $('resultsWrap').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* Bromethalin. mg active = percent / 100 x grams x 1000 (0.01% bait = 0.1 mg per gram).
     Merck Veterinary Manual (Bromethalin Poisoning in Animals): toxic doses are widely accepted at one tenth
     of the lowest reported LD50. Dogs LD50 2.38 to 5.6 mg/kg (toxic about 0.238 mg/kg); doses at or above the
     average LD50 of about 3.54 mg/kg may cause a convulsant syndrome within 4 to 36 hours; lower doses may cause
     a paralytic syndrome 1 to 5 days later. Cats LD50 0.4 to 0.71 mg/kg (toxic about 0.04 mg/kg), paralytic
     syndrome regardless of dose. No antidote, so every result is labeled Emergency (matches the rat poison page). */
  var DOG_TOXIC = 0.238, DOG_LD50_LOW = 2.38, DOG_LD50_AVG = 3.54;
  var CAT_TOXIC = 0.04, CAT_LD50_LOW = 0.4;
  var OZ_G = 28.3495;

  var species = 'dog';
  segGroup([$('spDog'), $('spCat')], function (b) { species = b.getAttribute('data-v'); });

  var pct = 0.01;
  segGroup([$('c01'), $('c025'), $('cOther')], function (b) {
    var v = b.getAttribute('data-pct');
    $('customPctWrap').style.display = v === 'custom' ? '' : 'none';
    pct = v === 'custom' ? 'custom' : parseFloat(v);
  });

  var amtUnit = 'g';
  var SUFFIX = { g: 'g of bait', oz: 'oz of bait', blk: 'blocks or packs' };
  segGroup([$('aG'), $('aOz'), $('aBlk')], function (b) {
    amtUnit = b.getAttribute('data-u');
    $('amountSuffix').textContent = SUFFIX[amtUnit];
    $('blockWrap').style.display = amtUnit === 'blk' ? '' : 'none';
  });

  var ACTIONS = [ACT_ASPCA, ACT_PPH, { primary: false, tel: null, title: 'Go to the nearest emergency vet now', sub: 'Bring the bait package. Vomiting works best within about 4 hours' }];
  var LABEL = 'Emergency: act now';
  var NO_ANTIDOTE = 'There is no antidote for bromethalin, and signs can be delayed for days, so early decontamination by a vet is the main treatment.';

  function copyFor(sp, mgKg) {
    if (sp === 'cat') {
      if (mgKg >= CAT_LD50_LOW) return { h: 'This estimated dose is in the lethal range reported for cats.', d: 'The estimate is at or above 0.4 mg/kg, the lowest reported LD50 for cats (the dose that killed half the animals studied). Cats are the most sensitive pets to bromethalin and usually develop weakness and paralysis over 1 to 5 days. ' + NO_ANTIDOTE };
      if (mgKg >= CAT_TOXIC) return { h: 'This estimated dose is at or above the toxic dose for cats.', d: 'The estimate is at or above 0.04 mg/kg, the toxic dose for cats (one tenth of the lowest reported LD50). Cats usually develop weakness and paralysis over 1 to 5 days, regardless of dose. ' + NO_ANTIDOTE };
      return { h: 'This estimate is below the published toxic dose for cats, but bromethalin is never considered safe.', d: 'The estimate is under 0.04 mg/kg. Cats are very sensitive, bait amounts are hard to judge, and the margin of safety is narrow. Call poison control or an emergency vet now to decide whether your cat should be treated. ' + NO_ANTIDOTE };
    }
    if (mgKg >= DOG_LD50_AVG) return { h: 'This estimated dose is in the lethal range reported for dogs.', d: 'The estimate is at or above about 3.54 mg/kg, the average reported LD50 for dogs. Doses this high may cause tremors, seizures, and high body temperature within 4 to 36 hours. ' + NO_ANTIDOTE };
    if (mgKg >= DOG_LD50_LOW) return { h: 'This estimated dose is in the lethal range reported for dogs.', d: 'The estimate is at or above 2.38 mg/kg, the lowest reported LD50 for dogs (the dose that killed half the animals studied). Severe weakness, paralysis, or seizures are possible. ' + NO_ANTIDOTE };
    if (mgKg >= DOG_TOXIC) return { h: 'This estimated dose is at or above the toxic dose for dogs.', d: 'The estimate is at or above about 0.24 mg/kg, the toxic dose for dogs (one tenth of the lowest reported LD50). Doses below the LD50 can still cause weakness, wobbliness, and paralysis 1 to 5 days later. ' + NO_ANTIDOTE };
    return { h: 'This estimate is below the published toxic dose for dogs, but bromethalin is never considered safe.', d: 'The estimate is under about 0.24 mg/kg. Individual dogs vary, bait amounts are hard to judge, and severe cases have been reported below published doses. Call poison control or your vet now to decide whether your dog should be treated. ' + NO_ANTIDOTE };
  }

  $('calcForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var w = parseFloat($('weightInput').value);
    var amt = parseFloat($('amountInput').value);
    var p = pct === 'custom' ? parseFloat($('customPctInput').value) : pct;
    var ok = showError('weightError', !(w > 0));
    ok = showError('amountError', !(amt > 0)) && ok;
    ok = showError('customPctError', !(p > 0 && p < 100)) && ok;
    var blk = parseFloat($('blockSizeInput').value);
    ok = showError('blockSizeError', amtUnit === 'blk' && !(blk > 0)) && ok;
    if (!ok) { $('resultsWrap').classList.remove('visible'); return; }
    var grams = amtUnit === 'oz' ? amt * OZ_G : (amtUnit === 'blk' ? amt * blk : amt);
    var mg = p / 100 * grams * 1000;
    var kg = state.weightUnit === 'lbs' ? w * 0.453592 : w;
    var mgKg = mg / kg;
    var c = copyFor(species, mgKg);
    var extra = 'Bait eaten: about ' + (grams < 10 ? grams.toFixed(1) : Math.round(grams)) + ' g at ' + p + '%.';
    render('emergency', { label: LABEL, headline: c.h, detail: c.d, actions: ACTIONS }, extra,
      (mgKg < 1 ? mgKg.toFixed(3) : mgKg.toFixed(2)) + ' mg/kg', (mg < 10 ? mg.toFixed(2) : mg.toFixed(1)) + ' mg');
  });
})();
