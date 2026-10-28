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

  /* grams of nuts per kg body weight. Literature does not support precise cutoffs:
     signs reported from 0.7 g/kg (Cortinovis & Caloni 2016) and 2.2-2.4 g/kg (ASPCA APCC; Merck);
     20 g/kg experimentally caused marked weakness (ASPCA APCC). Conservative tiers. */
  var G_PER_NUT = 3, LOW = 0.7, HIGH = 20;
  var form = 'plain', unit = 'nuts';
  segGroup([$('fPlain'), $('fChoc'), $('fBaked')], function (b) { form = b.getAttribute('data-v'); });
  function setAmt(u) {
    unit = u;
    $('amtNuts').setAttribute('aria-pressed', u === 'nuts' ? 'true' : 'false');
    $('amtGrams').setAttribute('aria-pressed', u === 'grams' ? 'true' : 'false');
    $('amountUnitLabel').textContent = u;
  }
  $('amtNuts').addEventListener('click', function () { setAmt('nuts'); });
  $('amtGrams').addEventListener('click', function () { setAmt('grams'); });

  var RANK = { caution: 0, urgent: 1, emergency: 2 };
  function atLeast(t, min) { return RANK[t] >= RANK[min] ? t : min; }

  var COPY = {
    emergency: {
      label: 'Emergency: act now',
      headline: 'This exposure needs immediate veterinary care.',
      detail: 'Based on what you entered, this is a large dose of macadamia nuts for your dog\'s size (at or above the 20 g/kg dose that caused marked weakness in a study), or the product contains xylitol. Call animal poison control or an emergency vet now.',
      actions: [ACT_ASPCA, ACT_PPH, { primary: false, tel: null, title: 'Head to the nearest emergency vet', sub: 'Bring the packaging' }]
    },
    urgent: {
      label: 'Urgent: contact a professional now',
      headline: 'This amount is in the range where dogs have developed weakness and vomiting.',
      detail: 'The estimated dose is at or above 0.7 g per kg, the lowest dose linked to signs in published reports, or the nuts were chocolate-covered or in baked goods. A vet may recommend inducing vomiting if the nuts were eaten recently. Call poison control or your veterinarian now.',
      actions: [ACT_ASPCA, ACT_PPH, { primary: false, tel: null, title: 'Call or message your regular veterinarian', sub: 'If after hours, use one of the hotlines above first' }]
    },
    caution: {
      label: 'Contact a professional now',
      headline: 'This estimated amount is below doses linked to signs, but professional guidance is still recommended.',
      detail: 'The estimated dose is under 0.7 g per kg. Published data is limited and individual dogs vary. Call poison control or your vet to confirm, and watch for weakness in the back legs, vomiting, tremors, or fever over the next 12 hours.',
      actions: [ACT_ASPCA, ACT_PPH, { primary: false, tel: null, title: 'Monitor closely for 12 to 48 hours', sub: 'Weakness, wobbliness, vomiting, or fever warrant a vet visit' }]
    }
  };

  $('calcForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var w = parseFloat($('weightInput').value);
    var amt = parseFloat($('amountInput').value);
    var ok = showError('weightError', !(w > 0));
    ok = showError('amountError', !(amt > 0)) && ok;
    if (!ok) { $('resultsWrap').classList.remove('visible'); return; }
    var kg = state.weightUnit === 'lbs' ? w * 0.453592 : w;
    var grams = unit === 'nuts' ? amt * G_PER_NUT : amt;
    var gkg = grams / kg, notes = [];
    var tier = gkg >= HIGH ? 'emergency' : (gkg >= LOW ? 'urgent' : 'caution');
    if (form === 'choc') { tier = atLeast(tier, 'urgent'); notes.push('Chocolate adds separate, often more serious risk. Use the chocolate calculator too and tell your vet.'); }
    if (form === 'baked') { tier = atLeast(tier, 'urgent'); notes.push('Baked goods may also contain chocolate, raisins, or xylitol. Check the ingredients.'); }
    if ($('hasXylitol').checked) { tier = 'emergency'; notes.push('Xylitol can cause a dangerous blood sugar drop within 30 minutes. This alone makes it an emergency.'); }
    render(tier, COPY[tier], notes.join(' '), gkg.toFixed(2) + ' g/kg', (Math.round(grams * 10) / 10) + ' g');
  });
})();
