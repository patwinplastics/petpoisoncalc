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

  /* Cats: no established safe or toxic dose. Merck Veterinary Manual mentions only anecdotal reports of kidney
     failure in cats; VPIS (Sutton et al. 2009) described acute renal failure in two cats; Dijkman et al. 2022
     (J Small Anim Pract, PMC9303671) found clinical signs in 2 of 13 cats and no acute kidney injury.
     Because no cat dose can be cited, ANY amount is Emergency. No Urgent tier, no lower tier, no safe tier.
     The g/kg readout uses average weights (5 g per grape, 1 g per raisin) and is shown only to share with a vet. */
  var AVG_GRAPE_G = 5, AVG_RAISIN_G = 1;

  var fruit = 'grape';
  segGroup([$('typeGrape'), $('typeRaisin')], function (b) {
    fruit = b.id === 'typeRaisin' ? 'raisin' : 'grape';
    $('countHint').textContent = fruit === 'grape'
      ? 'Approximate is okay. If a bunch is open and you are unsure, use the highest reasonable estimate, not the lowest.'
      : 'Approximate is okay. If a box or bag is open and you are unsure, use the highest reasonable estimate, not the lowest.';
  });
  $('countMinus').addEventListener('click', function () { $('countInput').value = Math.max(0, (parseFloat($('countInput').value) || 0) - 1); });
  $('countPlus').addEventListener('click', function () { $('countInput').value = (parseFloat($('countInput').value) || 0) + 1; });
  var useGrams = false;
  $('gramToggleBtn').addEventListener('click', function () {
    useGrams = !$('gramInputWrap').classList.contains('visible');
    $('gramInputWrap').classList.toggle('visible', useGrams);
    $('gramToggleBtn').textContent = useGrams ? 'Use a count instead of grams' : 'I know the weight in grams instead';
  });

  var COPY = {
    label: 'Emergency: act now',
    headline: 'Treat any amount of grapes or raisins as an emergency for your cat.',
    detail: 'There is no established safe or toxic dose of grapes or raisins for cats, so any amount is treated as an emergency. Evidence in cats is limited: only a few cat cases have been reported, including two cats with kidney failure in the UK. The dose shown is an estimate to share with your vet; it does not mean a smaller amount is safe. Call animal poison control or an emergency vet now. Do not try to make your cat vomit at home.',
    actions: [ACT_ASPCA, ACT_PPH, { primary: false, tel: null, title: 'Head to the nearest emergency vet', sub: 'Bring the packaging or a sample of what was eaten if possible' }]
  };

  $('calcForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var w = parseFloat($('weightInput').value);
    var count = parseFloat($('countInput').value) || 0;
    var grams = parseFloat($('gramInput').value) || 0;
    var ok = showError('weightError', !(w > 0));
    ok = showError('countError', !(count > 0 || grams > 0)) && ok;
    if (!ok) { $('resultsWrap').classList.remove('visible'); return; }
    var kg = state.weightUnit === 'lbs' ? w * 0.453592 : w;
    var avg = fruit === 'grape' ? AVG_GRAPE_G : AVG_RAISIN_G;
    var totalG = grams > 0 ? grams : count * avg;
    var units = grams > 0 ? grams / avg : count;
    var gKg = totalG / kg, unitsKg = units / kg;
    var name = fruit === 'grape' ? 'grape' : 'raisin';
    render('emergency', COPY, '', gKg.toFixed(2) + ' g/kg', unitsKg.toFixed(2) + ' ' + name + 's/kg');
  });
})();
