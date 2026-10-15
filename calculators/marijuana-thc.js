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

  /* THC thresholds, mg THC per kg body weight. Merck Veterinary Manual reports mild signs
     at 0.3-0.5 mg/kg and moderate signs above 2-3 mg/kg. Published data does not support precise
     cutoffs, so tiers are conservative (lower ends used) and there is no "safe" tier. */
  var MILD_MG_KG = 0.3;
  var MODERATE_MG_KG = 2;

  var productType = 'gummy';
  segGroup([$('typeGummy'), $('typeBaked'), $('typePlant'), $('typeConc')], function (b) {
    productType = b.getAttribute('data-type');
  });
  $('thcUnknown').addEventListener('change', function () {
    $('thcInput').disabled = this.checked;
  });

  var RANK = { caution: 0, urgent: 1, emergency: 2 };
  function atLeast(t, min) { return RANK[t] >= RANK[min] ? t : min; }

  var COPY = {
    emergency: {
      label: 'Emergency — act now',
      headline: 'This exposure needs immediate veterinary care.',
      detail: 'Based on what you entered, this falls in the highest-risk group: a THC dose at or above the range where moderate to severe signs are reported, or an edible that also contains xylitol. Call animal poison control or an emergency vet immediately and plan to have your dog seen in person now. Tell the vet exactly what was eaten; they are there to help, not to judge.',
      actions: [ACT_ASPCA, ACT_PPH, { primary: false, tel: null, title: 'Head to the nearest emergency vet', sub: 'Bring the packaging so the vet can see THC content and ingredients' }]
    },
    urgent: {
      label: 'Urgent — contact a professional now',
      headline: 'This amount is in the range where dogs commonly show signs.',
      detail: 'The estimated THC dose is at or above the range where clinical signs such as wobbliness, sleepiness, and dribbling urine are reported, or the THC amount is unknown, the product is a concentrate, or it contains chocolate. Product labels are often inaccurate. Call poison control or your veterinarian now.',
      actions: [ACT_ASPCA, ACT_PPH, { primary: false, tel: null, title: 'Call or message your regular veterinarian', sub: 'If after hours, use one of the hotlines above first' }]
    },
    caution: {
      label: 'Contact a professional now',
      headline: 'This estimated dose is below the lowest dose linked to signs, but no amount of THC is considered safe for dogs.',
      detail: 'The estimated dose is under 0.3 mg per kg, the low end of where mild signs are reported. THC labels are often wrong, and some dogs are more sensitive. Call poison control or your vet now to confirm, and watch for wobbliness, unusual sleepiness, or dribbling urine over the next 24 hours.',
      actions: [ACT_ASPCA, ACT_PPH, { primary: false, tel: null, title: 'Keep your dog supervised for 24 hours', sub: 'Wobbliness, tremors, vomiting, or trouble waking warrant an immediate vet visit' }]
    }
  };

  $('calcForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var w = parseFloat($('weightInput').value);
    var count = parseFloat($('countInput').value);
    var unknown = $('thcUnknown').checked;
    var mgPer = parseFloat($('thcInput').value);
    var ok = showError('weightError', !(w > 0));
    ok = showError('countError', !(count > 0)) && ok;
    ok = showError('thcError', !unknown && !(mgPer > 0)) && ok;
    if (!ok) { $('resultsWrap').classList.remove('visible'); return; }
    var kg = state.weightUnit === 'lbs' ? w * 0.453592 : w;
    var tier, d1 = 'Unknown', d2 = 'Unknown', notes = [];
    if (unknown) {
      tier = 'urgent';
      notes.push('Because the THC amount is unknown, this estimate assumes the dose could be significant.');
    } else {
      var total = mgPer * count, mgKg = total / kg;
      tier = mgKg >= MODERATE_MG_KG ? 'emergency' : (mgKg >= MILD_MG_KG ? 'urgent' : 'caution');
      d1 = mgKg.toFixed(2) + ' mg/kg'; d2 = (Math.round(total * 10) / 10) + ' mg';
    }
    if (productType === 'concentrate') { tier = atLeast(tier, 'urgent'); notes.push('Concentrates (oils, wax, vape cartridges) are very potent and more likely to cause severe signs.'); }
    if ($('hasChocolate').checked || productType === 'baked') {
      tier = atLeast(tier, 'urgent');
      notes.push('Chocolate or butter in baked edibles adds separate risks; use the chocolate calculator too and tell your vet.');
    }
    if ($('hasXylitol').checked) { tier = 'emergency'; notes.push('Xylitol can cause a dangerous blood sugar drop within 30 minutes. This alone makes it an emergency.'); }
    render(tier, COPY[tier], notes.join(' '), d1, d2);
  });
})();
