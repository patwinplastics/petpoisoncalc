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

  /* Salt (sodium chloride) toxicosis in dogs (Merck Veterinary Manual, Thompson 2022/2024):
     clinical signs can appear after 2 to 3 g/kg, acute oral lethal dose about 4 g/kg.
     Pet Poison Helpline and the ASPCA ice melt Toxicology Brief (Veterinary Medicine, 2000) also
     give 4 g/kg as potentially lethal in dogs. Today's Veterinary Nurse: signs at 2 g/kg,
     homemade play dough holds about 8 g of salt per tablespoon.
     Table salt weighs 6 g per tsp, 18 g per tbsp, 292 g per cup (USDA FoodData Central 173468).
     Coarse rock salt weighs less per spoonful, so these figures overestimate rather than underestimate.
     Cats: no cat-specific toxic dose is published, so any amount is an emergency.
     Non-sodium ice melts (calcium chloride, potassium chloride, magnesium chloride, urea, CMA) and
     unknown ice melts have no published toxic dose, so any amount is an emergency.
     No caution or "safe" tier. */
  var DOG_SIGNS_G_KG = 2;
  var DOG_LETHAL_G_KG = 4;
  var SALT_G = { tsp: 6, tbsp: 18, cup: 292, g: 1 };
  var DOUGH_G = { tsp: 8 / 3, tbsp: 8, cup: 128 };

  var species = 'dog';
  segGroup([$('spDog'), $('spCat')], function (b) { species = b.getAttribute('data-v'); });

  var unit = 'tsp';
  var unitBtns = [$('uTsp'), $('uTbsp'), $('uCup'), $('uG')];
  segGroup(unitBtns, function (b) {
    unit = b.getAttribute('data-u');
    $('amountUnitLabel').textContent = b.textContent;
  });
  function pickUnit(u) {
    unitBtns.forEach(function (o) { o.setAttribute('aria-pressed', o.getAttribute('data-u') === u ? 'true' : 'false'); });
    unit = u;
    $('amountUnitLabel').textContent = u;
  }

  var product = 'rock';
  segGroup([$('pRock'), $('pTable'), $('pDough'), $('pOther'), $('pUnknown')], function (b) {
    product = b.getAttribute('data-v');
    var dough = product === 'dough';
    $('uG').hidden = dough;
    if (dough && unit === 'g') { pickUnit('tbsp'); }
    $('doughNote').hidden = !dough;
    $('otherNote').hidden = product !== 'other';
  });

  $('amountUnknown').addEventListener('change', function () {
    $('amountInput').disabled = this.checked;
    if (this.checked) { $('amountError').classList.remove('visible'); }
  });

  var URGENT_ACTIONS = [ACT_ASPCA, ACT_PPH, { primary: false, tel: null, title: 'Call or message your regular veterinarian', sub: 'If after hours, use one of the hotlines above first. Vomiting often starts within a few hours' }];
  var ER_ACTIONS = [ACT_ASPCA, ACT_PPH, { primary: false, tel: null, title: 'Head to the nearest emergency vet', sub: 'Call a hotline on the way. Bring the bag, the dough, or a photo of the label' }];

  var COPY = {
    cat: {
      label: 'Emergency: act now',
      headline: 'Treat any salt, salt dough, or ice melt a cat swallows as an emergency.',
      detail: 'There is no published toxic dose of salt for cats, cats are small, and they swallow whatever they lick off their paws and fur while grooming. Call animal poison control or an emergency vet now, even if your cat seems normal.',
      actions: ER_ACTIONS
    },
    lethal: {
      label: 'Emergency: act now',
      headline: 'This estimated dose is in the range reported as potentially lethal for dogs.',
      detail: 'The estimate is at or above 4 g of salt per kg of body weight, the acute lethal dose reported for dogs. Too much sodium pulls water out of the brain and can cause tremors, seizures, and death. Go to an emergency vet now and call poison control on the way.',
      actions: ER_ACTIONS
    },
    emergency: {
      label: 'Emergency: act now',
      headline: 'This estimated dose is in the range where salt poisoning signs are reported in dogs.',
      detail: 'The estimate is at or above 2 g of salt per kg of body weight, where vomiting, wobbliness, tremors, and seizures can start. Salt poisoning needs blood tests and a slow, careful fluid plan in the hospital. Call animal poison control or an emergency vet now.',
      actions: ER_ACTIONS
    },
    noDose: {
      label: 'Emergency: act now',
      headline: 'There is no published toxic dose for this kind of ice melt, so treat any amount as an emergency.',
      detail: 'Calcium chloride and other calcium salts are the harshest irritants in ice melts, potassium chloride can cause bloody vomiting or diarrhea, and urea and magnesium products can still cause problems in large amounts (Pet Poison Helpline). Call animal poison control or an emergency vet now and have the bag or a photo of the ingredient list ready.',
      actions: ER_ACTIONS
    },
    unknownProduct: {
      label: 'Emergency: act now',
      headline: 'If you do not know what is in the ice melt, treat it as an emergency.',
      detail: 'Most ice melts are sodium chloride, but many contain calcium, potassium, or magnesium salts, which have no published toxic dose and can burn the mouth and stomach. The dose shown assumes the product is all sodium chloride. Call animal poison control or an emergency vet now.',
      actions: ER_ACTIONS
    },
    unknownAmount: {
      label: 'Emergency: act now',
      headline: 'If you cannot tell how much your pet ate, treat it as an emergency.',
      detail: 'Salt amounts are easy to underestimate, especially with salt dough and ice melt. A vet can check blood sodium to find out. Call animal poison control or an emergency vet now.',
      actions: ER_ACTIONS
    },
    urgent: {
      label: 'Urgent: contact a professional now',
      headline: 'This estimated dose is below the lowest dose where salt poisoning signs are reported in dogs, but it still needs a call.',
      detail: 'The estimate is under 2 g of salt per kg. Smaller amounts often cause vomiting and diarrhea, the amount eaten is easy to underestimate, and ASPCA says even a small amount of salt dough could be dangerous. Call poison control or your vet now, make sure fresh water is available, and watch for vomiting, heavy thirst, wobbliness, or shaking.',
      actions: URGENT_ACTIONS
    }
  };

  $('calcForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var w = parseFloat($('weightInput').value);
    var unknown = $('amountUnknown').checked;
    var ok = showError('weightError', !(w > 0));
    var amt = parseFloat($('amountInput').value);
    if (!unknown) { ok = showError('amountError', !(amt > 0)) && ok; }
    if (!ok) { $('resultsWrap').classList.remove('visible'); return; }
    var kg = state.weightUnit === 'lbs' ? w * 0.453592 : w;
    if (unknown) {
      render('emergency', species === 'cat' ? COPY.cat : COPY.unknownAmount, '', 'Unknown', 'Unknown');
      return;
    }
    if (product === 'other') {
      render('emergency', COPY.noDose, species === 'cat' ? 'Cats also groom ice melt off their paws and fur, so wipe paws with a damp cloth.' : '', 'Not calculated', 'No published dose');
      return;
    }
    var saltG = amt * (product === 'dough' ? DOUGH_G[unit] : SALT_G[unit]);
    var gKg = saltG / kg;
    var key, extra = '';
    if (species === 'cat') {
      key = 'cat';
    } else if (product === 'unknown') {
      key = 'unknownProduct';
    } else if (gKg >= DOG_LETHAL_G_KG) {
      key = 'lethal';
    } else if (gKg >= DOG_SIGNS_G_KG) {
      key = 'emergency';
    } else {
      key = 'urgent';
    }
    if (key !== 'lethal' && species === 'dog' && gKg >= DOG_LETHAL_G_KG) {
      extra = 'This estimate is at or above 4 g/kg, reported as the acute lethal dose in dogs. Go to an emergency vet now.';
    }
    if (product === 'dough') {
      extra += (extra ? ' ' : '') + 'Dried ornaments hold more salt per spoonful than fresh dough, so the real dose may be higher than this estimate.';
    }
    var tier = key === 'urgent' ? 'urgent' : 'emergency';
    render(tier, COPY[key], extra, (gKg < 10 ? gKg.toFixed(2) : gKg.toFixed(1)) + ' g/kg', (saltG < 10 ? saltG.toFixed(1) : Math.round(saltG)) + ' g');
  });
})();
