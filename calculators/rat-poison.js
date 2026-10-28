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
    if ($('statType')) { $('statType').textContent = dose1; }
    if ($('statTiming')) { $('statTiming').textContent = dose2; }
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

  /* No dose math: every rodenticide ingestion is an emergency (Merck Veterinary Manual:
     narrow margins of safety, variable bait concentrations, delayed signs). */
  var INFO = {
    anti: ['Anticoagulant', '2–5 days (bleeding)', 'Anticoagulants stop blood from clotting. Dogs often look normal for several days before bleeding starts. Vitamin K1 is the antidote, but a vet must decide on decontamination, testing, and treatment length.'],
    brom: ['Bromethalin', 'Hours to 7 days (neurologic)', 'Bromethalin is a nerve toxin with no antidote. High doses can cause tremors and seizures within hours; lower doses can cause back-leg weakness or paralysis days later. Early decontamination is the key treatment.'],
    chol: ['Cholecalciferol (D3)', '18–72 hours (high calcium)', 'Cholecalciferol raises blood calcium and phosphorus and can damage the kidneys. There is no antidote, and treatment and monitoring may last weeks.'],
    zinc: ['Zinc / aluminum phosphide', 'Minutes to hours', 'Phosphides release toxic phosphine gas in the stomach. Signs start quickly. Vomit can release gas that is dangerous to people: do not induce vomiting at home, and drive to the vet with the windows open.'],
    unknown: ['Unknown', 'Varies: minutes to 7 days', 'Bait color and shape cannot identify the poison. Bring the package or a photo of the active ingredient and EPA registration number so the vet can choose the right treatment.']
  };
  var type = 'anti';
  segGroup([$('rAnti'), $('rBrom'), $('rChol'), $('rZinc'), $('rUnknown')], function (b) { type = b.getAttribute('data-v'); });

  var COPY = {
    label: 'Emergency: act now',
    headline: 'Any rat or mouse poison ingestion is an emergency for dogs.',
    detail: 'Rodenticides are designed to kill mammals, the margin of safety is narrow, and the most dangerous types often cause no signs until treatment is harder. Call animal poison control or an emergency vet now and head in. Bring the package.',
    actions: [ACT_ASPCA, ACT_PPH, { primary: false, tel: null, title: 'Go to the nearest emergency vet now', sub: 'Do not wait for signs. Bring the package or a photo of the label' }]
  };

  $('calcForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var i = INFO[type];
    render('emergency', COPY, i[2], i[0], i[1]);
  });
})();
