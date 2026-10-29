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

  /* Nicotine content per item uses the high end of published ranges:
     cigarette 9 to 30 mg, butt 5 to 7 mg, cigar 15 to 40 mg (FDA; Veterinary Medicine Tox Brief 2004),
     gum or lozenge 2 or 4 mg per piece, patch 8.3 to 114 mg (Veterinary Medicine 2004),
     e-liquid about 8 to 59 mg/mL (Pet Poison Helpline).
     Dogs: clinical signs reported at doses as low as 1 mg/kg (Novotny et al., Tobacco Control 2011;
     MSPCA-Angell; VPIS treats 1 mg/kg as potentially toxic). Minimum lethal dose 9.2 mg/kg
     (Tobacco Control 2011). FDA: eating a whole cigarette, more than one butt, or e-liquid is an emergency.
     Cats: no established threshold, so any amount is an emergency. No caution or "safe" tier. */
  var DOG_SIGNS_MG_KG = 1;
  var DOG_LETHAL_MG_KG = 9.2;
  var MG_PER = { butt: 7, cig: 30, cigar: 40, patch: 114 };
  var SUFFIX = { butt: 'butts', cig: 'cigarettes', cigar: 'cigars', gum: 'pieces', patch: 'patches' };

  var species = 'dog';
  segGroup([$('spDog'), $('spCat')], function (b) { species = b.getAttribute('data-v'); });

  var product = 'butt';
  segGroup([$('pButt'), $('pCig'), $('pCigar'), $('pGum'), $('pPatch'), $('pLiquid'), $('pMg')], function (b) {
    product = b.getAttribute('data-v');
    var counted = product !== 'liquid' && product !== 'mg';
    $('countWrap').style.display = counted ? '' : 'none';
    $('gumWrap').style.display = product === 'gum' ? '' : 'none';
    $('liquidWrap').style.display = product === 'liquid' ? '' : 'none';
    $('mgWrap').style.display = product === 'mg' ? '' : 'none';
    if (counted) { $('countSuffix').textContent = SUFFIX[product]; }
  });
  $('countSuffix').textContent = SUFFIX.butt;

  var gumMg = 4;
  segGroup([$('gum2'), $('gum4')], function (b) { gumMg = parseFloat(b.getAttribute('data-mg')); });

  var URGENT_ACTIONS = [ACT_ASPCA, ACT_PPH, { primary: false, tel: null, title: 'Call or message your regular veterinarian', sub: 'If after hours, use one of the hotlines above first. Signs can start within an hour' }];
  var ER_ACTIONS = [ACT_ASPCA, ACT_PPH, { primary: false, tel: null, title: 'Head to the nearest emergency vet', sub: 'Bring the packaging so the vet can confirm the nicotine strength' }];

  var COPY = {
    cat: {
      label: 'Emergency: act now',
      headline: 'Treat any nicotine a cat eats as an emergency.',
      detail: 'There is no established toxic dose of nicotine for cats, and cats in poison control case data were reported at doses of about 1.7 mg per kg and higher. Nicotine acts within minutes to an hour and there is no antidote. Call animal poison control or an emergency vet now, even if your cat seems normal.',
      actions: ER_ACTIONS
    },
    emergency: {
      label: 'Emergency: act now',
      headline: 'This estimated dose is in the range where nicotine poisoning signs are reported in dogs.',
      detail: 'The estimated dose is at or above 1 mg of nicotine per kg body weight, the lowest dose at which clinical signs such as vomiting, tremors, a racing heart, and seizures have been reported. Signs can start within 15 to 90 minutes and there is no antidote. Call animal poison control or an emergency vet immediately.',
      actions: ER_ACTIONS
    },
    emergencyProduct: {
      label: 'Emergency: act now',
      headline: 'The FDA calls this kind of nicotine exposure an emergency for pets.',
      detail: 'The estimated dose is under 1 mg per kg, but the FDA advises that eating a whole cigarette, more than one cigarette butt, or any e-liquid is an emergency, and cigars and patches hold even more nicotine. Product strength varies, so the real dose may be higher than this estimate. Call animal poison control or an emergency vet now.',
      actions: ER_ACTIONS
    },
    urgent: {
      label: 'Urgent: contact a professional now',
      headline: 'This estimated dose is below the lowest dose where signs are reported, but no amount of nicotine is considered safe.',
      detail: 'The estimated dose is under 1 mg per kg. Nicotine content varies between products, the margin of safety is narrow, and Pet Poison Helpline advises that home care is not appropriate even for small exposures. Call poison control or your vet now, and watch closely for vomiting, drooling, shaking, or agitation over the next few hours.',
      actions: URGENT_ACTIONS
    }
  };

  $('calcForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var w = parseFloat($('weightInput').value);
    var ok = showError('weightError', !(w > 0));
    var total = NaN, count = NaN;
    if (product === 'liquid') {
      var ml = parseFloat($('liquidMlInput').value), mgml = parseFloat($('liquidStrengthInput').value);
      ok = showError('liquidError', !(ml > 0 && mgml > 0)) && ok;
      total = ml * mgml;
    } else if (product === 'mg') {
      total = parseFloat($('mgInput').value);
      ok = showError('mgError', !(total > 0)) && ok;
    } else {
      count = parseFloat($('countInput').value);
      ok = showError('countError', !(count > 0)) && ok;
      total = count * (product === 'gum' ? gumMg : MG_PER[product]);
    }
    if (!ok) { $('resultsWrap').classList.remove('visible'); return; }
    var kg = state.weightUnit === 'lbs' ? w * 0.453592 : w;
    var mgKg = total / kg, extra = '', key;
    if (species === 'cat') {
      key = 'cat';
    } else if (mgKg >= DOG_SIGNS_MG_KG) {
      key = 'emergency';
    } else if (product === 'cig' || product === 'cigar' || product === 'patch' || product === 'liquid' || (product === 'butt' && count > 1)) {
      key = 'emergencyProduct';
    } else {
      key = 'urgent';
    }
    if (mgKg >= DOG_LETHAL_MG_KG) {
      extra = 'This estimate is at or above 9.2 mg/kg, reported as the minimum lethal dose in dogs. Go to an emergency vet now.';
    }
    if (product === 'gum') {
      extra += (extra ? ' ' : '') + 'Check the gum or lozenge label for xylitol. If it is listed, tell poison control and also use the xylitol calculator.';
    }
    if (product === 'liquid') {
      extra += (extra ? ' ' : '') + 'If your pet chewed the device itself, the battery can also burn the mouth and throat.';
    }
    render(key === 'urgent' ? 'urgent' : 'emergency', COPY[key], extra, (mgKg < 10 ? mgKg.toFixed(2) : mgKg.toFixed(1)) + ' mg/kg', (total < 10 ? total.toFixed(1) : Math.round(total)) + ' mg');
  });
})();
