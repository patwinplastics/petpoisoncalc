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
    if ($('statPart')) { $('statPart').textContent = dose2; }
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

  /* No dose math: for cats, any exposure to a true lily (Lilium), daylily (Hemerocallis),
     lily of the valley, or an unidentified lily is an emergency (US FDA; ASPCA APCC). */
  var NAMES = { 'true': 'True lily (Lilium)', day: 'Daylily (Hemerocallis)', valley: 'Lily of the valley', other: 'Peace / calla / Peruvian', unknown: 'Unknown type' };
  var PARTS = { plant: 'Plant material', pollen: 'Pollen', water: 'Vase water', unsure: 'Possible contact' };
  var type = 'true', part = 'plant';
  segGroup([$('lilyTrue'), $('lilyDay'), $('lilyValley'), $('lilyOther'), $('lilyUnknown')], function (b) { type = b.getAttribute('data-v'); });
  segGroup([$('partPlant'), $('partPollen'), $('partWater'), $('partUnsure')], function (b) { part = b.getAttribute('data-v'); });

  var COPY = {
    emergency: {
      label: 'Emergency: act now',
      headline: 'Any exposure to this type of lily is a medical emergency for cats.',
      detail: 'Even a small bite of a leaf or petal, a few grains of pollen licked from fur, or a drink of vase water can cause fatal kidney failure in cats. Treatment is most effective when started within hours, before signs appear. Call an emergency vet or animal poison control now and head in. Bring the plant or a photo.',
      actions: [ACT_ASPCA, ACT_PPH, { primary: false, tel: null, title: 'Go to the nearest emergency vet now', sub: 'Do not wait for vomiting or other signs' }]
    },
    caution: {
      label: 'Contact a professional now',
      headline: 'This plant is not a true lily, but it can still irritate your cat\'s mouth and stomach.',
      detail: 'Peace lilies and calla lilies contain oxalate crystals that can cause drooling, pawing at the mouth, and vomiting, but they are not known to cause the kidney failure that true lilies do. Peruvian lilies generally cause only mild stomach upset. Plant identification is easy to get wrong, so call poison control or your vet now to confirm, and go in right away if you are not certain of the type.',
      actions: [ACT_ASPCA, ACT_PPH, { primary: false, tel: null, title: 'Confirm the plant type', sub: 'Take a photo of the plant and its label if you have one' }]
    }
  };

  $('calcForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var tier = type === 'other' ? 'caution' : 'emergency';
    var extra = '';
    if (type === 'valley') { extra = 'Lily of the valley affects the heart rather than the kidneys and can cause dangerous heart rhythm problems.'; }
    if (type === 'unknown') { extra = 'Because the lily type is unknown, it must be treated as a true lily until a vet confirms otherwise.'; }
    render(tier, COPY[tier], extra, NAMES[type], PARTS[part]);
  });
})();
