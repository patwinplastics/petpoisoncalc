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

  /* Minimum lethal dose of undiluted ethylene glycol (Merck Veterinary Manual, Regehr 2022/2024):
     cats 1.4 mL/kg, dogs 4.4 to 6.6 mL/kg (low end used). Concentrate up to 95 to 100% EG,
     premix 50/50 (Merck; Pet Poison Helpline). Antidote window about 3 h cats, 8 to 12 h dogs
     (Pet Poison Helpline). Kidney injury can occur below the lethal dose and there is no
     published harmless dose, so EVERY result is Emergency, including unknown amounts.
     No caution or "safe" tier. */
  var MLD_ML_KG = { dog: 4.4, cat: 1.4 };

  var species = 'dog';
  segGroup([$('spDog'), $('spCat')], function (b) { species = b.getAttribute('data-v'); });

  var fraction = 1;
  segGroup([$('pConc'), $('pMix'), $('pPuddle'), $('pOther')], function (b) { fraction = parseFloat(b.getAttribute('data-v')); });

  var mlPerUnit = 4.92892;
  segGroup([$('uTsp'), $('uTbsp'), $('uMl'), $('uOz')], function (b) {
    mlPerUnit = parseFloat(b.getAttribute('data-ml'));
    $('amountUnitLabel').textContent = b.textContent;
  });

  $('amountUnknown').addEventListener('change', function () {
    $('amountInput').disabled = this.checked;
    if (this.checked) { $('amountError').classList.remove('visible'); }
  });

  var ER_ACTIONS = [ACT_ASPCA, ACT_PPH, { primary: false, tel: null, title: 'Head to the nearest emergency vet now', sub: 'Call a hotline on the way. Bring the bottle or a photo of the label' }];

  var WINDOW = {
    dog: 'For dogs, the antidote needs to be started within about 8 to 12 hours of drinking, and sooner is better.',
    cat: 'For cats, the antidote needs to be started within about 3 hours of drinking, so every minute counts.'
  };

  var COPY = {
    lethal: {
      label: 'Emergency: act now',
      headline: 'This estimated amount is at or above the published minimum lethal dose of ethylene glycol.',
      detail: 'Go to an emergency vet immediately and call poison control on the way. Ethylene glycol is absorbed within hours and damages the kidneys, and the antidote only works if it is given early.',
      actions: ER_ACTIONS
    },
    below: {
      label: 'Emergency: act now',
      headline: 'Treat any antifreeze your pet swallows as an emergency, even below the lethal dose.',
      detail: 'The estimate is under the published minimum lethal dose, but kidney injury can happen at lower doses, amounts swallowed are easy to underestimate, and there is no known harmless amount. Go to an emergency vet now and call poison control on the way.',
      actions: ER_ACTIONS
    },
    unknown: {
      label: 'Emergency: act now',
      headline: 'Any possible antifreeze exposure is an emergency, even if you do not know how much.',
      detail: 'As little as one teaspoon can be fatal to a cat, and a tablespoon or two to a dog (Pet Poison Helpline). A vet can run a blood test for ethylene glycol to find out. Go to an emergency vet now and call poison control on the way.',
      actions: ER_ACTIONS
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
    var winText = WINDOW[species];
    if (unknown) {
      render('emergency', COPY.unknown, winText, 'Unknown', 'Unknown');
      return;
    }
    var egMl = amt * mlPerUnit * fraction;
    var mlKg = egMl / kg;
    var mld = MLD_ML_KG[species];
    var extra = winText;
    if (mlKg >= mld) {
      extra += ' The minimum lethal dose is ' + mld + ' mL/kg for ' + (species === 'cat' ? 'cats' : 'dogs') + ' (Merck Veterinary Manual).';
    }
    render('emergency', mlKg >= mld ? COPY.lethal : COPY.below, extra, (mlKg < 10 ? mlKg.toFixed(2) : mlKg.toFixed(1)) + ' mL/kg', (egMl < 10 ? egMl.toFixed(1) : Math.round(egMl)) + ' mL');
  });
})();
