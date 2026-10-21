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

  /* Thresholds, mg naproxen per kg body weight, single acute ingestion, dogs.
     ASPCA APCC data: GI ulceration from 5 mg/kg and renal injury possible at 10 to 20 mg/kg
     (DeClementi, Clinician's Brief 2012); GI signs from 7 mg/kg and azotemia at 13 to 15 mg/kg
     (DeClementi, Veterinary Medicine 2013). The lower value of each pair is used.
     Merck Veterinary Manual: single 35 mg/kg dose caused severe GI signs. */
  var GI_MG_KG = 5;
  var RENAL_MG_KG = 10;
  var SEVERE_MG_KG = 35;

  var strength = 220;
  segGroup([$('str220'), $('str250'), $('str375'), $('str500'), $('strCustom')], function (b) {
    var mg = b.getAttribute('data-mg');
    $('customMgWrap').style.display = mg === 'custom' ? '' : 'none';
    strength = mg === 'custom' ? 'custom' : parseFloat(mg);
  });

  function calc(weightKg, mgPerTab, count, highRisk) {
    var total = mgPerTab * count;
    var mgKg = total / weightKg;
    var tier = mgKg >= RENAL_MG_KG ? 'emergency' : (mgKg >= GI_MG_KG ? 'urgent' : 'caution');
    var bumped = false;
    if (highRisk && tier === 'urgent') { tier = 'emergency'; bumped = true; }
    return { total: total, mgKg: mgKg, tier: tier, bumped: bumped };
  }

  var COPY = {
    emergency: {
      label: 'Emergency: act now',
      headline: 'This estimated dose is in the range linked to kidney injury in dogs.',
      detail: 'The estimated dose is at or above 10 mg per kg body weight, where ASPCA Animal Poison Control data show kidney injury is possible, in addition to stomach bleeding and ulcers. Naproxen stays in a dog\'s body for days. Do not wait for symptoms. Call animal poison control or an emergency vet immediately and plan to have your dog seen in person right away.',
      actions: [ACT_ASPCA, ACT_PPH, { primary: false, tel: null, title: 'Head to the nearest emergency vet', sub: 'Bring the pill bottle so the vet can confirm strength and count' }]
    },
    urgent: {
      label: 'Urgent: contact a professional now',
      headline: 'This estimated dose is in the range linked to stomach ulcers.',
      detail: 'The estimated dose is at or above 5 mg per kg body weight, where ASPCA Animal Poison Control data show stomach and gut ulceration can occur. Treatment works best when started early, before signs appear. Call poison control or your veterinarian now.',
      actions: [ACT_ASPCA, ACT_PPH, { primary: false, tel: null, title: 'Call or message your regular veterinarian', sub: 'If after hours, use one of the hotlines above first' }]
    },
    caution: {
      label: 'Contact a professional now',
      headline: 'This estimated dose is below the lowest documented ulcer threshold, but naproxen is not considered safe for dogs.',
      detail: 'The estimated dose is under 5 mg per kg. Single doses of 1 to 7 mg per kg have still caused vomiting and lethargy in dogs, and naproxen lasts for days in a dog\'s body. Call poison control or your vet now to confirm, and watch for vomiting, black stool, or reduced appetite over the next several days.',
      actions: [ACT_ASPCA, ACT_PPH, { primary: false, tel: null, title: 'Monitor closely for the next few days', sub: 'Vomiting, black or tarry stool, or changes in thirst or urination warrant a vet visit' }]
    }
  };

  $('calcForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var w = parseFloat($('weightInput').value);
    var count = parseFloat($('countInput').value);
    var mg = strength === 'custom' ? parseFloat($('customMgInput').value) : strength;
    var ok = showError('weightError', !(w > 0));
    ok = showError('countError', !(count > 0)) && ok;
    ok = showError('customMgError', !(mg > 0)) && ok;
    if (!ok) { $('resultsWrap').classList.remove('visible'); return; }
    var kg = state.weightUnit === 'lbs' ? w * 0.453592 : w;
    var r = calc(kg, mg, count, $('riskFactor').checked);
    var extra = '';
    if (r.bumped) {
      extra = 'This result was raised to Emergency because older dogs, dogs with kidney, liver, or stomach problems, and dogs on other NSAIDs or steroids are at higher risk of kidney injury at this dose.';
    } else if (r.mgKg >= SEVERE_MG_KG) {
      extra = 'This estimate is at or above 35 mg/kg, a single dose that has caused vomiting blood, black stool, and severe belly pain in a dog. Go to an emergency vet now.';
    }
    render(r.tier, COPY[r.tier], extra, r.mgKg.toFixed(1) + ' mg/kg', Math.round(r.total) + ' mg');
  });
})();
