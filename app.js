(function () {
  'use strict';

  /* ============================================
     THEME TOGGLE
     ============================================ */
  var root = document.documentElement;
  var themeToggle = document.getElementById('themeToggle');
  var currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  root.setAttribute('data-theme', currentTheme);

  themeToggle.addEventListener('click', function () {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', currentTheme);
  });

  /* ============================================
     STATE
     ============================================ */
  var state = {
    unit: 'lbs', // 'lbs' | 'kg'
    fruitType: 'grape', // 'grape' | 'raisin'
    useGrams: false
  };

  /* ============================================
     REFERENCE CONSTANTS (from cited veterinary sources)
     ============================================ */
  // Average mass per unit fruit, in grams
  var AVG_GRAPE_MASS_G = 5; // typical seedless table grape ~4-6g
  var AVG_RAISIN_MASS_G = 1; // typical raisin ~0.5-1g

  // Lowest documented doses associated with AKI, in g of fruit per kg body weight
  // Grapes: ASPCA/Merck range ~9-19.6 g/kg; we use the conservative (lower) bound as the
  // threshold where documented reactions begin, since no safe floor exists.
  var GRAPE_LOWEST_DOCUMENTED_G_PER_KG = 9;
  var RAISIN_LOWEST_DOCUMENTED_G_PER_KG = 2.8;

  // Merck clinical marker: >1 grape/raisin per 10 lbs (4.5 kg) body weight = meaningful risk
  var MERCK_UNITS_PER_KG = 1 / 4.5;

  /* ============================================
     DOM REFS
     ============================================ */
  var weightInput = document.getElementById('weightInput');
  var weightUnitLabel = document.getElementById('weightUnitLabel');
  var weightError = document.getElementById('weightError');
  var unitLbsBtn = document.getElementById('unitLbs');
  var unitKgBtn = document.getElementById('unitKg');

  var typeGrapeBtn = document.getElementById('typeGrape');
  var typeRaisinBtn = document.getElementById('typeRaisin');

  var countInput = document.getElementById('countInput');
  var countMinus = document.getElementById('countMinus');
  var countPlus = document.getElementById('countPlus');
  var countError = document.getElementById('countError');
  var countHint = document.getElementById('countHint');

  var gramToggleBtn = document.getElementById('gramToggleBtn');
  var gramInputWrap = document.getElementById('gramInputWrap');
  var gramInput = document.getElementById('gramInput');

  var form = document.getElementById('calcForm');
  var resultsWrap = document.getElementById('resultsWrap');
  var resultBanner = document.getElementById('resultBanner');
  var tierLabelText = document.getElementById('tierLabelText');
  var resultHeadline = document.getElementById('resultHeadline');
  var resultDetail = document.getElementById('resultDetail');
  var doseGramsPerKg = document.getElementById('doseGramsPerKg');
  var doseTartaric = document.getElementById('doseTartaric');
  var actionBlock = document.getElementById('actionBlock');

  /* ============================================
     UNIT TOGGLE (weight)
     ============================================ */
  function setUnit(unit) {
    state.unit = unit;
    unitLbsBtn.setAttribute('aria-pressed', unit === 'lbs' ? 'true' : 'false');
    unitKgBtn.setAttribute('aria-pressed', unit === 'kg' ? 'true' : 'false');
    weightUnitLabel.textContent = unit;
  }
  unitLbsBtn.addEventListener('click', function () { setUnit('lbs'); });
  unitKgBtn.addEventListener('click', function () { setUnit('kg'); });

  /* ============================================
     FRUIT TYPE TOGGLE
     ============================================ */
  function setFruitType(type) {
    state.fruitType = type;
    typeGrapeBtn.setAttribute('aria-pressed', type === 'grape' ? 'true' : 'false');
    typeRaisinBtn.setAttribute('aria-pressed', type === 'raisin' ? 'true' : 'false');
    countHint.textContent = type === 'grape'
      ? 'Approximate is okay. If a whole bunch is missing, use the highest reasonable estimate, not the lowest.'
      : 'Approximate is okay. If a whole box or bag is missing, use the highest reasonable estimate, not the lowest.';
  }
  typeGrapeBtn.addEventListener('click', function () { setFruitType('grape'); });
  typeRaisinBtn.addEventListener('click', function () { setFruitType('raisin'); });

  /* ============================================
     COUNT STEPPER
     ============================================ */
  function bumpCount(delta) {
    var current = parseFloat(countInput.value) || 0;
    var next = Math.max(0, current + delta);
    countInput.value = next;
  }
  countMinus.addEventListener('click', function () { bumpCount(-1); });
  countPlus.addEventListener('click', function () { bumpCount(1); });

  /* ============================================
     GRAM INPUT TOGGLE
     ============================================ */
  gramToggleBtn.addEventListener('click', function () {
    var willShow = !gramInputWrap.classList.contains('visible');
    gramInputWrap.classList.toggle('visible', willShow);
    gramToggleBtn.textContent = willShow
      ? 'Use a count instead of grams'
      : 'I know the weight in grams instead';
    state.useGrams = willShow;
  });

  /* ============================================
     CORE CALCULATION
     ============================================ */
  function calculateRisk(weightRaw, unit, fruitType, count, grams) {
    var weightKg = unit === 'lbs' ? weightRaw * 0.453592 : weightRaw;

    var totalGrams;
    if (grams && grams > 0) {
      totalGrams = grams;
    } else {
      var avgMass = fruitType === 'grape' ? AVG_GRAPE_MASS_G : AVG_RAISIN_MASS_G;
      totalGrams = count * avgMass;
    }

    var doseGPerKg = totalGrams / weightKg;

    var lowestDocumented = fruitType === 'grape'
      ? GRAPE_LOWEST_DOCUMENTED_G_PER_KG
      : RAISIN_LOWEST_DOCUMENTED_G_PER_KG;

    // Merck marker: units per kg vs 1-per-10lb benchmark
    var unitsConsumed = grams && grams > 0
      ? totalGrams / (fruitType === 'grape' ? AVG_GRAPE_MASS_G : AVG_RAISIN_MASS_G)
      : count;
    var unitsPerKg = unitsConsumed / weightKg;
    var meetsMerckMarker = unitsPerKg >= MERCK_UNITS_PER_KG;

    var ratioToLowestDocumented = doseGPerKg / lowestDocumented;

    // Tiering logic. Because no safe dose exists, even the lowest tier
    // is never "no action" -- it is "contact a professional today."
    var tier;
    if (ratioToLowestDocumented >= 1 || (fruitType === 'raisin' && meetsMerckMarker)) {
      tier = 'emergency'; // at or above lowest dose ever linked to AKI
    } else if (ratioToLowestDocumented >= 0.25 || meetsMerckMarker) {
      tier = 'urgent'; // meaningful fraction of documented toxic dose, or meets clinical marker
    } else {
      tier = 'caution'; // below documented thresholds, but thresholds are not safety lines
    }

    return {
      weightKg: weightKg,
      totalGrams: totalGrams,
      doseGPerKg: doseGPerKg,
      lowestDocumented: lowestDocumented,
      ratioToLowestDocumented: ratioToLowestDocumented,
      unitsPerKg: unitsPerKg,
      meetsMerckMarker: meetsMerckMarker,
      unitsConsumed: unitsConsumed,
      fruitType: fruitType,
      tier: tier
    };
  }

  /* ============================================
     RENDER RESULTS
     ============================================ */
  var TIER_COPY = {
    emergency: {
      label: 'Emergency — act now',
      headline: 'This amount is at or above doses linked to kidney injury in dogs.',
      detail: 'Based on the weight and amount entered, the estimated dose meets or exceeds the lowest amounts documented to cause acute kidney injury in published veterinary case data. Do not wait for symptoms. Call an emergency veterinarian or animal poison control immediately, and plan to have your dog seen in person within the next hour if a professional advises it.',
      actions: [
        { primary: true, tel: '8884264435', title: 'Call ASPCA Animal Poison Control', sub: '(888) 426-4435 · 24/7 · consultation fee applies' },
        { primary: false, tel: '8557647661', title: 'Call Pet Poison Helpline', sub: '(855) 764-7661 · 24/7 · consultation fee applies' },
        { primary: false, tel: null, title: 'Head to the nearest emergency vet', sub: 'Bring packaging or a sample of what was eaten if possible' }
      ]
    },
    urgent: {
      label: 'Urgent — contact a professional now',
      headline: 'This amount falls in a range where reactions have been documented.',
      detail: 'The estimated dose is a meaningful fraction of amounts linked to kidney injury in some dogs, or meets the general clinical marker veterinarians use to flag risk. Individual sensitivity to grapes and raisins varies unpredictably, so this amount cannot be assumed safe. Call poison control or your veterinarian now, before symptoms start, so you have a documented case number and a treatment plan.',
      actions: [
        { primary: true, tel: '8884264435', title: 'Call ASPCA Animal Poison Control', sub: '(888) 426-4435 · 24/7 · consultation fee applies' },
        { primary: false, tel: '8557647661', title: 'Call Pet Poison Helpline', sub: '(855) 764-7661 · 24/7 · consultation fee applies' },
        { primary: false, tel: null, title: 'Call or message your regular veterinarian', sub: 'If after hours, use one of the hotlines above first' }
      ]
    },
    caution: {
      label: 'Contact a professional today',
      headline: 'This estimated amount is below commonly cited toxic thresholds, but no safe dose exists.',
      detail: 'Some dogs have developed acute kidney injury from very small amounts, including as few as four to five grapes, well below the general thresholds used in this estimate. A lower calculated dose only means the documented average risk is lower. It does not mean this ingestion is safe for your dog. Call poison control or your vet today and watch closely for any symptoms over the next 72 hours.',
      actions: [
        { primary: true, tel: '8884264435', title: 'Call ASPCA Animal Poison Control', sub: '(888) 426-4435 · 24/7 · consultation fee applies' },
        { primary: false, tel: '8557647661', title: 'Call Pet Poison Helpline', sub: '(855) 764-7661 · 24/7 · consultation fee applies' },
        { primary: false, tel: null, title: 'Monitor closely for 72 hours', sub: 'Vomiting, lethargy, appetite loss, or increased thirst/urination warrant an immediate vet visit' }
      ]
    }
  };

  function callBtnSvg() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z"/></svg>';
  }

  function pinSvg() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22c5.5-4 8-7.5 8-12A8 8 0 0 0 4 10c0 4.5 2.5 8 8 12Z"/><circle cx="12" cy="10" r="3"/></svg>';
  }

  function renderResults(calc) {
    resultBanner.className = 'result-banner tier-' + calc.tier;
    var copy = TIER_COPY[calc.tier];

    tierLabelText.textContent = copy.label;
    resultHeadline.textContent = copy.headline;

    var detail = copy.detail;
    if (calc.tier === 'emergency' && calc.meetsMerckMarker && calc.ratioToLowestDocumented < 1) {
      detail += ' Specifically, the amount eaten exceeds the general clinical marker of more than one grape or raisin per 10 lb of body weight, which veterinarians use as an early flag for renal risk, even though it falls under the highest documented case thresholds.';
    }
    resultDetail.innerHTML = detail;

    doseGramsPerKg.textContent = calc.doseGPerKg.toFixed(2) + ' g/kg';
    var unitLabel = calc.fruitType === 'grape' ? 'grape' : 'raisin';
    doseTartaric.textContent = calc.unitsPerKg.toFixed(2) + ' ' + unitLabel + (calc.unitsPerKg === 1 ? '' : 's') + '/kg';

    actionBlock.innerHTML = '';
    copy.actions.forEach(function (action) {
      var el = document.createElement(action.tel ? 'a' : 'div');
      el.className = 'call-btn' + (action.primary ? ' primary-call' : '');
      if (action.tel) {
        el.href = 'tel:' + action.tel;
      }
      el.innerHTML = (action.tel ? callBtnSvg() : pinSvg()) +
        '<span><span class="call-title">' + action.title + '</span>' +
        '<span class="call-sub">' + action.sub + '</span></span>';
      actionBlock.appendChild(el);
    });

    resultsWrap.classList.add('visible');
    resultsWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ============================================
     FORM SUBMIT
     ============================================ */
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var weightRaw = parseFloat(weightInput.value);
    var count = parseFloat(countInput.value) || 0;
    var grams = parseFloat(gramInput.value) || 0;

    var valid = true;

    if (!weightRaw || weightRaw <= 0) {
      weightError.classList.add('visible');
      valid = false;
    } else {
      weightError.classList.remove('visible');
    }

    var hasAmount = (grams > 0) || (count > 0);
    if (!hasAmount) {
      countError.classList.add('visible');
      valid = false;
    } else {
      countError.classList.remove('visible');
    }

    if (!valid) {
      resultsWrap.classList.remove('visible');
      return;
    }

    var calc = calculateRisk(weightRaw, state.unit, state.fruitType, count, grams);
    renderResults(calc);
  });
})();
