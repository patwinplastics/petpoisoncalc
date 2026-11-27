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
  if ($('unitLbs')) {
    $('unitLbs').addEventListener('click', function () { setUnit('lbs'); });
    $('unitKg').addEventListener('click', function () { setUnit('kg'); });
  }

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
    if ($('doseMgKg')) { $('doseMgKg').textContent = dose1; }
    if ($('doseTotal')) { $('doseTotal').textContent = dose2; }
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

  var RANK = { caution: 0, urgent: 1, emergency: 2 };
  function atLeast(t, min) { return RANK[t] >= RANK[min] ? t : min; }
  var sp = 'dog';
  if ($('spDog')) { segGroup([$('spDog'), $('spCat')], function (b) { sp = b.getAttribute('data-v'); }); }
  function kgOf(w) { return state.weightUnit === 'lbs' ? w * 0.453592 : w; }
  function fmt(n, d) { if (!isFinite(n)) { return '-'; } var f = Math.pow(10, d); return String(Math.round(n * f) / f); }
  var ER_ACT = { primary: false, tel: null, title: 'Head to the nearest emergency vet', sub: 'Bring the packaging, plant, or a photo' };
  var VET_ACT = { primary: false, tel: null, title: 'Call or message your regular veterinarian', sub: 'If after hours, use one of the hotlines above first' };
  var WATCH_ACT = { primary: false, tel: null, title: 'Keep watching closely', sub: 'Any new signs mean a vet visit now' };
  function unitGroup(ids, onPick) {
    var btns = ids.map(function (i) { return $(i); });
    btns.forEach(function (b) { b.addEventListener('click', function () { btns.forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); }); onPick(b.getAttribute('data-u'), b.textContent); }); });
  }
  /* mg of cholecalciferol per kg. Merck: signs as low as 0.1 mg/kg; marked hypercalcemia and
     mineralization above 0.5 mg/kg. 1 IU = 0.025 mcg. Cats more sensitive (PPH), no cutoff:
     any amount is an emergency. Calcipotriene/calcitriol creams and D3 bait: any amount = emergency. */
  var LOW = 0.1, HIGH = 0.5, prod = 'supp', sUnit = 'iu';
  segGroup([$('pSupp'), $('pCream'), $('pBait')], function (b) { prod = b.getAttribute('data-v'); $('suppFields').hidden = prod !== 'supp'; });
  unitGroup(['uIU', 'uMcg'], function (u, t) { sUnit = u; $('strengthInputUnit').textContent = t; });
  var COPY = {
    emergency: { label: 'Emergency: act now', headline: 'This exposure needs immediate veterinary care.',
      detail: 'Based on what you entered, this is at or above the vitamin D dose linked to dangerous calcium levels, your pet is a cat, or the product is a high-potency cream or rodent bait. Call animal poison control or an emergency vet now. Bring the bottle or tube.',
      actions: [ACT_ASPCA, ACT_PPH, ER_ACT] },
    urgent: { label: 'Urgent: contact a professional now', headline: 'This amount is in the range where dogs have shown signs.',
      detail: 'The estimated dose is at or above 0.1 mg per kg (4,000 IU per kg), the lowest dose linked to signs. A vet may recommend making your dog vomit and checking calcium over the next few days. Call poison control or your vet now.',
      actions: [ACT_ASPCA, ACT_PPH, VET_ACT] },
    caution: { label: 'Contact a professional now', headline: 'This estimate is below doses linked to signs, but professional guidance is still recommended.',
      detail: 'The estimated dose is under 0.1 mg per kg. Labels, counts, and individual dogs vary. Call poison control or your vet to confirm, and watch for vomiting, not eating, or extra thirst over the next 2 to 3 days.',
      actions: [ACT_ASPCA, ACT_PPH, WATCH_ACT] }
  };
  $('calcForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var w = parseFloat($('weightInput').value), ok = showError('weightError', !(w > 0)), notes = [];
    if (prod !== 'supp') {
      showError('strengthInputError', false); showError('countInputError', false);
      if (!ok) { $('resultsWrap').classList.remove('visible'); return; }
      notes.push(prod === 'cream' ? 'Calcipotriene and calcitriol are many times stronger than vitamin pills, so any amount is an emergency.' : 'Any rodent bait is an emergency. The rat poison calculator explains each bait type.');
      render('emergency', COPY.emergency, notes.join(' '), 'Any amount', prod === 'cream' ? 'Cream' : 'Bait');
      return;
    }
    var s = parseFloat($('strengthInput').value), n = parseFloat($('countInput').value);
    ok = showError('strengthInputError', !(s > 0)) && ok;
    ok = showError('countInputError', !(n > 0)) && ok;
    if (!ok) { $('resultsWrap').classList.remove('visible'); return; }
    var iu = (sUnit === 'iu' ? s : s * 40) * n, mg = iu * 0.000025, mgkg = mg / kgOf(w);
    var tier = mgkg >= HIGH ? 'emergency' : (mgkg >= LOW ? 'urgent' : 'caution');
    if (sp === 'cat') { tier = 'emergency'; notes.push('Cats are more sensitive to vitamin D than dogs and have no established cutoff, so any amount is treated as an emergency.'); }
    notes.push('If it was a gummy, check the label for xylitol too.');
    render(tier, COPY[tier], notes.join(' '), fmt(mgkg, 3) + ' mg/kg', Math.round(iu).toLocaleString('en-US') + ' IU');
  });
})();
