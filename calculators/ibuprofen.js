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

  /* Thresholds, mg ibuprofen per kg body weight, single acute ingestion.
     Merck Veterinary Manual; ASPCA APCC Toxicology Briefs (Dunayer 2004; Meadows & Gwaltney-Brant 2006). */
  var GI_MG_KG = 25;     // vomiting / GI ulceration reported from 25 mg/kg
  var RENAL_MG_KG = 175; // acute kidney injury risk increases
  var CNS_MG_KG = 400;   // seizures, ataxia, coma
  var LETHAL_MG_KG = 600;

  var strength = 200;
  segGroup([$('str200'), $('str400'), $('str600'), $('str800'), $('strCustom')], function (b) {
    var mg = b.getAttribute('data-mg');
    $('customMgWrap').style.display = mg === 'custom' ? '' : 'none';
    strength = mg === 'custom' ? 'custom' : parseFloat(mg);
  });

  function calc(weightKg, mgPerTab, count) {
    var total = mgPerTab * count;
    var mgKg = total / weightKg;
    var tier = mgKg >= RENAL_MG_KG ? 'emergency' : (mgKg >= GI_MG_KG ? 'urgent' : 'caution');
    return { total: total, mgKg: mgKg, tier: tier };
  }

  var COPY = {
    emergency: {
      label: 'Emergency: act now',
      headline: 'This estimated dose is in the range linked to kidney injury in dogs.',
      detail: 'The estimated dose is at or above 175 mg per kg body weight, where veterinary sources report an increased risk of acute kidney injury in addition to stomach bleeding and ulcers. Do not wait for symptoms. Call animal poison control or an emergency vet immediately and plan to have your dog seen in person right away.',
      actions: [ACT_ASPCA, ACT_PPH, { primary: false, tel: null, title: 'Head to the nearest emergency vet', sub: 'Bring the pill bottle so the vet can confirm strength and count' }]
    },
    urgent: {
      label: 'Urgent: contact a professional now',
      headline: 'This estimated dose is in the range linked to stomach ulcers and vomiting.',
      detail: 'The estimated dose is at or above 25 mg per kg body weight, where vomiting, diarrhea, and stomach ulceration have been reported in dogs. Treatment is most effective when started early, before signs appear. Call poison control or your veterinarian now.',
      actions: [ACT_ASPCA, ACT_PPH, { primary: false, tel: null, title: 'Call or message your regular veterinarian', sub: 'If after hours, use one of the hotlines above first' }]
    },
    caution: {
      label: 'Contact a professional now',
      headline: 'This estimated dose is below the documented single-dose threshold, but ibuprofen is not considered safe for dogs.',
      detail: 'The estimated dose is under 25 mg per kg, the lowest single dose commonly cited for stomach and gut signs. Ibuprofen has a narrow margin of safety in dogs, ulcers have occurred at lower doses given over time, and older dogs or dogs with kidney disease are more sensitive. Call poison control or your vet now to confirm, and watch for vomiting, black stool, or reduced appetite over the next several days.',
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
    var r = calc(kg, mg, count);
    var extra = '';
    if (r.mgKg > LETHAL_MG_KG) {
      extra = 'This estimate is above 600 mg/kg, a dose described as potentially lethal. Seizures and coma can occur. Go to an emergency vet now.';
    } else if (r.mgKg > CNS_MG_KG) {
      extra = 'This estimate is also above 400 mg/kg, where seizures, wobbliness, and coma have been reported.';
    }
    render(r.tier, COPY[r.tier], extra, r.mgKg.toFixed(1) + ' mg/kg', Math.round(r.total) + ' mg');
  });
})();
