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
  /* mg elemental iron per kg (ASPCA APCC, Freed 2016; Albretsen 2006): <20 not expected,
     20-60 mild GI signs, >60 potentially serious, 100-200 potentially lethal. Applies to dogs and cats.
     Ferrous sulfate counted at 37% (anhydrous), the highest common form, to stay conservative. */
  var LOW = 20, HIGH = 60, factor = 1;
  segGroup([$('fElem'), $('fSulf'), $('fFum'), $('fGluc')], function (b) { factor = parseFloat(b.getAttribute('data-v')); });
  var COPY = {
    emergency: { label: 'Emergency: act now', headline: 'This exposure needs immediate veterinary care.',
      detail: 'Based on what you entered, this is above 60 mg of elemental iron per kg, the level where serious poisoning can develop, or your pet is already showing serious signs. Call animal poison control or an emergency vet now. Bring the bottle.',
      actions: [ACT_ASPCA, ACT_PPH, ER_ACT] },
    urgent: { label: 'Urgent: contact a professional now', headline: 'This amount is in the range where pets can get sick.',
      detail: 'The estimated dose is 20 to 60 mg of elemental iron per kg, where vomiting and diarrhea are possible. A vet may recommend making your pet vomit and checking iron levels. Call poison control or your vet now.',
      actions: [ACT_ASPCA, ACT_PPH, VET_ACT] },
    caution: { label: 'Contact a professional now', headline: 'This estimate is below doses linked to toxic effects, but professional guidance is still recommended.',
      detail: 'The estimated dose is under 20 mg of elemental iron per kg. Labels and counts are easy to get wrong. Call poison control or your vet to confirm, and watch for vomiting, diarrhea, or tiredness over the next day.',
      actions: [ACT_ASPCA, ACT_PPH, WATCH_ACT] }
  };
  $('calcForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var w = parseFloat($('weightInput').value), s = parseFloat($('strengthInput').value), n = parseFloat($('countInput').value);
    var ok = showError('weightError', !(w > 0));
    ok = showError('strengthInputError', !(s > 0)) && ok;
    ok = showError('countInputError', !(n > 0)) && ok;
    if (!ok) { $('resultsWrap').classList.remove('visible'); return; }
    var mg = s * n * factor, mgkg = mg / kgOf(w), notes = [];
    var tier = mgkg > HIGH ? 'emergency' : (mgkg >= LOW ? 'urgent' : 'caution');
    if ($('hasSigns').checked) { tier = 'emergency'; notes.push('Bloody vomit or stool, or weakness, needs a vet now whatever the dose.'); }
    if (mgkg >= 100) { notes.push('This is in the potentially lethal range without treatment.'); }
    render(tier, COPY[tier], notes.join(' '), fmt(mgkg, 1) + ' mg/kg', fmt(mg, 0) + ' mg');
  });
})();
