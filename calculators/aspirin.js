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

  /* Thresholds, mg aspirin (acetylsalicylic acid) per kg body weight, single acute ingestion.
     Dogs: GI signs alone may occur at 50 mg/kg; toxicity may result from acute ingestion of
     100 mg/kg, with severe signs reported over 100 to 500 mg/kg (Small Animal Critical Care
     Medicine, Salicylates chapter). Merck Veterinary Manual: acute 450 mg/kg can cause
     hyperthermia, panting, seizures, or coma.
     Cats: toxicosis may occur above 50 mg/kg; any exposure above 100 mg/kg is serious and
     potentially lethal (Small Animal Critical Care Medicine). Cats clear aspirin very slowly
     (half-life about 37.5 hours, Merck), so any feline ingestion is treated as an emergency. */
  var DOG_GI_MG_KG = 50;
  var DOG_TOXIC_MG_KG = 100;
  var DOG_SEVERE_MG_KG = 450;
  var CAT_TOXIC_MG_KG = 50;
  var CAT_SERIOUS_MG_KG = 100;

  var species = 'dog';
  segGroup([$('spDog'), $('spCat')], function (b) { species = b.getAttribute('data-v'); });

  var strength = 325;
  segGroup([$('str81'), $('str325'), $('str500'), $('strCustom')], function (b) {
    var mg = b.getAttribute('data-mg');
    $('customMgWrap').style.display = mg === 'custom' ? '' : 'none';
    strength = mg === 'custom' ? 'custom' : parseFloat(mg);
  });

  function calcDog(mgKg, highRisk) {
    var tier = mgKg >= DOG_TOXIC_MG_KG ? 'emergency' : (mgKg >= DOG_GI_MG_KG ? 'urgent' : 'caution');
    var bumped = false;
    if (highRisk && tier === 'urgent') { tier = 'emergency'; bumped = true; }
    return { tier: tier, bumped: bumped };
  }

  var COPY = {
    cat: {
      label: 'Emergency: act now',
      headline: 'Treat any aspirin a cat eats as an emergency.',
      detail: 'Cats lack much of the liver enzyme that clears aspirin, so it stays in their body for well over a day (a half-life of about 37.5 hours). Veterinary references report toxicity in cats above 50 mg per kg, and cats have reacted to much smaller repeated doses. Call animal poison control or an emergency vet now. If your vet prescribed aspirin for your cat and you think a dose was repeated or doubled, call your vet now.',
      actions: [ACT_ASPCA, ACT_PPH, { primary: false, tel: null, title: 'Go to the nearest emergency vet', sub: 'Bring the bottle so the vet can confirm strength and count' }]
    },
    emergency: {
      label: 'Emergency: act now',
      headline: 'This estimated dose is in the range where serious aspirin poisoning is reported in dogs.',
      detail: 'The estimated dose is at or above 100 mg per kg body weight. Veterinary references report that an acute ingestion at this level may cause toxicity, with severe signs reported from 100 to 500 mg per kg, including stomach bleeding, fever, fast breathing, and a dangerous acid imbalance. There is no antidote, so early treatment matters. Call animal poison control or an emergency vet immediately.',
      actions: [ACT_ASPCA, ACT_PPH, { primary: false, tel: null, title: 'Head to the nearest emergency vet', sub: 'Bring the pill bottle so the vet can confirm strength and count' }]
    },
    urgent: {
      label: 'Urgent: contact a professional now',
      headline: 'This estimated dose is in the range where vomiting and stomach upset are reported.',
      detail: 'The estimated dose is at or above 50 mg per kg body weight, where veterinary references report stomach and gut signs in dogs. Individual dogs vary and the exact toxic dose is not well established. Call poison control or your veterinarian now; treatment works best before signs appear.',
      actions: [ACT_ASPCA, ACT_PPH, { primary: false, tel: null, title: 'Call or message your regular veterinarian', sub: 'If after hours, use one of the hotlines above first' }]
    },
    caution: {
      label: 'Contact a professional now',
      headline: 'This estimated dose is below the lowest documented threshold for stomach signs in dogs, but aspirin is not considered safe to eat.',
      detail: 'The estimated dose is under 50 mg per kg. Sources agree the toxic dose varies between dogs, and aspirin can irritate the stomach and affect blood clotting even at lower doses. Call poison control or your vet now to confirm, and watch for vomiting, black stool, or reduced appetite.',
      actions: [ACT_ASPCA, ACT_PPH, { primary: false, tel: null, title: 'Monitor closely for the next few days', sub: 'Vomiting, black or tarry stool, heavy panting, or weakness warrant a vet visit' }]
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
      if (mgKg > CAT_SERIOUS_MG_KG) { extra = 'This estimate is above 100 mg/kg, a level veterinary references describe as serious and potentially lethal for cats.'; }
      else if (mgKg > CAT_TOXIC_MG_KG) { extra = 'This estimate is above 50 mg/kg, where toxicity is reported in cats.'; }
    } else {
      var r = calcDog(mgKg, $('riskFactor').checked);
      key = r.tier;
      if (r.bumped) {
        extra = 'This result was raised to Emergency because older dogs, dogs with kidney, liver, or stomach problems, and dogs on other NSAIDs or steroids are at higher risk of stomach ulcers and kidney injury.';
      } else if (mgKg >= DOG_SEVERE_MG_KG) {
        extra = 'This estimate is at or above 450 mg/kg, a single dose that can cause high body temperature, panting, seizures, or coma in dogs. Go to an emergency vet now.';
      }
    }
    render(key === 'cat' ? 'emergency' : key, COPY[key], extra, mgKg.toFixed(1) + ' mg/kg', Math.round(total) + ' mg');
  });
})();
