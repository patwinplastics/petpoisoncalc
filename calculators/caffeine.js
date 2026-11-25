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

  /* Caffeine toxicosis. Sources:
     Dogs: Merck Veterinary Manual, "Chocolate Toxicosis in Animals" (Hayes, 2024) gives methylxanthine
     (theobromine and caffeine) effects by dose: mild signs about 20 mg/kg, cardiotoxic 40 to 50 mg/kg,
     seizures 60 mg/kg and above. Caffeine alone: reported lethal dose about 140 mg/kg (ACVP "Caffeine";
     Gugler et al. 2013). Pet Poison Helpline: fatality is common with caffeine pills.
     Cats: toxic doses 80 to 150 mg/kg are listed and cats are slightly more sensitive, but no cutoff for
     signs is established, so any amount is an emergency.
     Caffeine content (always the high end of the published range, so the dose is not underestimated):
       brewed coffee 247 mg per 12 fl oz, energy drink 246 mg per 12 fl oz, caffeinated soft drink 83 mg per
       12 fl oz, black tea 71 mg per 12 fl oz (FDA, "Spilling the Beans");
       coffee beans and grounds 570 mg per ounce (Gugler et al. 2013, range 280 to 570).
     Pills: mg per pill is entered from the label.
     Thresholds applied here: dogs 40 mg/kg and above = Emergency (seizure-range note at 60), below 40 = Urgent.
     Unknown amount and any cat = Emergency. No "safe" tier. */
  var DOG_EMERGENCY_MG_KG = 40;
  var DOG_SEIZURE_MG_KG = 60;
  var MG_PER_FLOZ = { coffee: 247 / 12, energy: 246 / 12, soda: 83 / 12, tea: 71 / 12 };
  var MG_PER_OZ_BEANS = 570;
  var OZ_G = 28.3495;
  var FLOZ = { floz: 1, cup: 8, can: 12 };

  var species = 'dog';
  segGroup([$('spDog'), $('spCat')], function (b) { species = b.getAttribute('data-v'); });

  var unit = 'oz';
  var unitBtns = [$('uOz'), $('uG'), $('uFlOz'), $('uCup'), $('uCan'), $('uPill')];
  segGroup(unitBtns, function (b) { unit = b.getAttribute('data-u'); $('amountUnitLabel').textContent = b.getAttribute('data-u') === 'floz' ? 'fl oz' : b.getAttribute('data-u') === 'cup' ? 'cups' : b.getAttribute('data-u') === 'can' ? 'cans' : b.getAttribute('data-u') === 'pill' ? 'pills' : b.getAttribute('data-u'); });
  function pickUnit(u) {
    unitBtns.forEach(function (o) { o.setAttribute('aria-pressed', o.getAttribute('data-u') === u ? 'true' : 'false'); });
    unit = u;
    $('amountUnitLabel').textContent = u === 'floz' ? 'fl oz' : u === 'cup' ? 'cups' : u === 'can' ? 'cans' : u === 'pill' ? 'pills' : u;
  }

  var product = 'beans';
  function showUnits(list, def) {
    unitBtns.forEach(function (o) { o.hidden = list.indexOf(o.getAttribute('data-u')) < 0; });
    pickUnit(def);
  }
  segGroup([$('pBeans'), $('pPill'), $('pCoffee'), $('pEnergy'), $('pSoda'), $('pTea')], function (b) {
    product = b.getAttribute('data-v');
    var drink = product === 'coffee' || product === 'energy' || product === 'soda' || product === 'tea';
    $('drinkNote').hidden = !drink;
    $('pillMgGroup').hidden = product !== 'pill';
    if (product === 'beans') { showUnits(['oz', 'g'], 'oz'); }
    else if (product === 'pill') { showUnits(['pill'], 'pill'); }
    else { showUnits(['floz', 'cup', 'can'], product === 'soda' || product === 'energy' ? 'can' : 'cup'); }
  });
  showUnits(['oz', 'g'], 'oz');

  $('amountUnknown').addEventListener('change', function () {
    $('amountInput').disabled = this.checked;
    if (this.checked) { $('amountError').classList.remove('visible'); }
  });

  var ER_ACTIONS = [ACT_ASPCA, ACT_PPH, { primary: false, tel: null, title: 'Head to the nearest emergency vet', sub: 'Call a hotline on the way. Bring the package, the cup, or a photo of the label' }];
  var URGENT_ACTIONS = [ACT_ASPCA, ACT_PPH, { primary: false, tel: null, title: 'Call or message your regular veterinarian', sub: 'If after hours, use one of the hotlines above first. Signs usually start within 1 to 2 hours' }];

  var COPY = {
    cat: {
      label: 'Emergency: act now',
      headline: 'Treat any caffeine a cat swallows as an emergency.',
      detail: 'No firm toxic cutoff has been set for cats, cats are somewhat more sensitive to caffeine than dogs, and they are small, so a little goes a long way. Call animal poison control or an emergency vet now, even if your cat seems normal. Signs usually start within 1 to 2 hours.',
      actions: ER_ACTIONS
    },
    seizure: {
      label: 'Emergency: act now',
      headline: 'This estimated dose is in the range where seizures are reported in dogs.',
      detail: 'The estimate is at or above 60 mg of caffeine per kg of body weight, the dose linked to seizures for methylxanthines. A racing heart, tremors, high body temperature, and collapse are possible. Go to an emergency vet now and call poison control on the way.',
      actions: ER_ACTIONS
    },
    emergency: {
      label: 'Emergency: act now',
      headline: 'This estimated dose is in the range where heart effects are reported in dogs.',
      detail: 'The estimate is at or above 40 mg of caffeine per kg of body weight, where a fast or abnormal heart rhythm is reported. Treatment works best before signs start. Call animal poison control or an emergency vet now.',
      actions: ER_ACTIONS
    },
    unknownAmount: {
      label: 'Emergency: act now',
      headline: 'If you cannot tell how much your pet ate or drank, treat it as an emergency.',
      detail: 'Coffee grounds, beans, and pills hold a lot of caffeine, and the amount missing is easy to underestimate. Call animal poison control or an emergency vet now.',
      actions: ER_ACTIONS
    },
    mild: {
      label: 'Urgent: contact a professional now',
      headline: 'This estimated dose is in the range where mild to moderate signs are reported in dogs, so call now.',
      detail: 'The estimate is between 20 and 40 mg of caffeine per kg. Vomiting, restlessness, panting, thirst, and a fast heart rate are reported in this range, and the product strength is easy to misjudge. Call poison control or your vet now, keep your dog calm and quiet, and watch for tremors or a racing heart.',
      actions: URGENT_ACTIONS
    },
    urgent: {
      label: 'Urgent: contact a professional now',
      headline: 'This estimated dose is below the lowest dose where signs are reported in dogs, but it still needs a call.',
      detail: 'The estimate is under 20 mg of caffeine per kg. Individual dogs vary, product strength varies, and the amount eaten is easy to underestimate. Call poison control or your vet now for advice, and watch for restlessness, panting, vomiting, shaking, or a racing heart over the next several hours.',
      actions: URGENT_ACTIONS
    }
  };

  $('pillMg').addEventListener('input', function () { $('pillMgError').classList.remove('visible'); });

  $('calcForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var w = parseFloat($('weightInput').value);
    var unknown = $('amountUnknown').checked;
    var ok = showError('weightError', !(w > 0));
    var amt = parseFloat($('amountInput').value);
    if (!unknown) { ok = showError('amountError', !(amt > 0)) && ok; }
    var pillMg = parseFloat($('pillMg').value);
    if (product === 'pill') { ok = showError('pillMgError', !(pillMg > 0)) && ok; } else { $('pillMgError').classList.remove('visible'); }
    if (!ok) { $('resultsWrap').classList.remove('visible'); return; }
    var kg = state.weightUnit === 'lbs' ? w * 0.453592 : w;
    if (unknown) {
      render('emergency', species === 'cat' ? COPY.cat : COPY.unknownAmount, '', 'Unknown', 'Unknown');
      return;
    }
    var mg;
    if (product === 'beans') {
      mg = (unit === 'g' ? amt / OZ_G : amt) * MG_PER_OZ_BEANS;
    } else if (product === 'pill') {
      mg = amt * pillMg;
    } else {
      mg = amt * (FLOZ[unit] || 1) * MG_PER_FLOZ[product];
    }
    var mgKg = mg / kg;
    var key;
    if (species === 'cat') { key = 'cat'; }
    else if (mgKg >= DOG_SEIZURE_MG_KG) { key = 'seizure'; }
    else if (mgKg >= DOG_EMERGENCY_MG_KG) { key = 'emergency'; }
    else if (mgKg >= 20) { key = 'mild'; }
    else { key = 'urgent'; }
    var extra = '';
    if (product === 'pill' && species === 'dog') { extra = 'Pet Poison Helpline notes that fatality is common when dogs eat caffeine pills, so do not wait for signs.'; }
    if (product === 'beans') { extra = 'Dry beans and grounds are counted at the high end of the published range, 570 mg per ounce.'; }
    var tier = (key === 'urgent' || key === 'mild') ? 'urgent' : 'emergency';
    render(tier, COPY[key], extra, (mgKg < 10 ? mgKg.toFixed(1) : Math.round(mgKg)) + ' mg/kg', Math.round(mg) + ' mg');
  });
})();
