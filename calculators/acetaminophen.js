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

  /* mg acetaminophen per kg. Merck Veterinary Manual; ASPCA APCC (Richardson 2000).
     Cats: signs reported at 10 mg/kg, no safe dose -> always Emergency.
     Dogs: signs/liver injury > 100 mg/kg; methemoglobinemia > 200 mg/kg.
     50 mg/kg Urgent cutoff is a conservative margin chosen by PetPoisonCalc. */
  var DOG_URGENT = 50, DOG_LIVER = 100, DOG_METHB = 200, CAT_SIGNS = 10;

  var species = 'dog', strength = 325;
  segGroup([$('spDog'), $('spCat')], function (b) { species = b.getAttribute('data-v'); });
  segGroup([$('ap325'), $('ap500'), $('ap650'), $('ap160'), $('apCustom')], function (b) {
    var v = b.getAttribute('data-v');
    $('customMgWrap').style.display = v === 'custom' ? '' : 'none';
    strength = v === 'custom' ? 'custom' : parseFloat(v);
  });

  var COPY = {
    cat: {
      label: 'Emergency: act now',
      headline: 'Any amount of acetaminophen is an emergency for a cat.',
      detail: 'Cats lack the liver enzymes to process acetaminophen safely, and clinical signs have been reported at doses as low as 10 mg per kg, less than a quarter of a regular tablet for an average cat. Damage to red blood cells can begin within a few hours. Call an emergency vet or animal poison control now and head in.',
      actions: [ACT_ASPCA, ACT_PPH, { primary: false, tel: null, title: 'Go to the nearest emergency vet now', sub: 'Bring the packaging' }]
    },
    emergency: {
      label: 'Emergency: act now',
      headline: 'This estimated dose is in the range linked to liver injury in dogs.',
      detail: 'The estimated dose is at or above 100 mg per kg, where veterinary sources report clinical signs and possible liver injury in dogs. Do not wait for symptoms. Call animal poison control or an emergency vet immediately. An antidote is available and works best when started early.',
      actions: [ACT_ASPCA, ACT_PPH, { primary: false, tel: null, title: 'Head to the nearest emergency vet', sub: 'Bring the bottle so the vet can confirm strength and count' }]
    },
    urgent: {
      label: 'Urgent: contact a professional now',
      headline: 'This estimated dose is approaching the range linked to liver injury.',
      detail: 'The estimated dose is at or above 50 mg per kg, half of the 100 mg/kg level where liver injury is reported in dogs. Individual sensitivity, repeated doses, and combination products can lower the toxic dose. Call poison control or your veterinarian now.',
      actions: [ACT_ASPCA, ACT_PPH, { primary: false, tel: null, title: 'Call or message your regular veterinarian', sub: 'If after hours, use one of the hotlines above first' }]
    },
    caution: {
      label: 'Contact a professional now',
      headline: 'This estimated dose is below documented toxic thresholds for dogs, but professional guidance is still needed.',
      detail: 'The estimated dose is under 50 mg per kg. Single doses at this level are not typically associated with toxicity in dogs, but repeated doses, liver disease, and combination products change the picture. Call poison control or your vet now to confirm, and watch for vomiting, brown gums, or swelling of the face or paws.',
      actions: [ACT_ASPCA, ACT_PPH, { primary: false, tel: null, title: 'Monitor closely for 72 hours', sub: 'Vomiting, brown or yellow gums, or swelling warrant an immediate vet visit' }]
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
    var total = mg * count, mgKg = total / kg, extra = '', key;
    if (species === 'cat') {
      key = 'cat';
      if (mgKg >= CAT_SIGNS) { extra = 'This estimate is at or above 10 mg/kg, where signs have been reported in cats.'; }
    } else {
      key = mgKg >= DOG_LIVER ? 'emergency' : (mgKg >= DOG_URGENT ? 'urgent' : 'caution');
      if (mgKg > DOG_METHB) { extra = 'This estimate is also above 200 mg/kg, where damage to red blood cells (methemoglobinemia) has been reported.'; }
    }
    render(key === 'cat' ? 'emergency' : key, COPY[key], extra, mgKg.toFixed(1) + ' mg/kg', Math.round(total) + ' mg');
  });
})();
