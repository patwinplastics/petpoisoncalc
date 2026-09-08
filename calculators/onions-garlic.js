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
    weightUnit: 'lbs', // 'lbs' | 'kg'
    foodType: 'onionRaw' // 'onionRaw' | 'onionPowder' | 'garlicRaw' | 'garlicPowder'
  };

  /* ============================================
     REFERENCE CONSTANTS (Merck Veterinary Manual)
     Potency multiplier relative to raw onion (baseline = 1x).
     Garlic is 3-5x more toxic than onion per gram; using 5x (conservative).
     Powder/dehydrated forms are treated as ~3x more concentrated than fresh
     equivalent by weight, reflecting moisture loss concentration.
     Threshold used: 15 g/kg raw onion (low/conservative end of 15-30 g/kg range)
     expressed as a garlic-equivalent grams-per-kg scale.
     ============================================ */
  var POTENCY_MULTIPLIER = {
    onionRaw: 1,
    onionPowder: 3,
    garlicRaw: 5,
    garlicPowder: 15 // 5x garlic potency x 3x concentration
  };

  // Conservative threshold in grams per kg body weight, expressed in raw-onion-equivalent terms
  var THRESHOLD_CAUTION = 15;   // low end of documented raw onion range (15-30 g/kg)
  var THRESHOLD_URGENT = 30;    // high end of documented raw onion range
  // Emergency tier: garlic-equivalent dose crosses well past the documented range

  /* ============================================
     DOM REFS
     ============================================ */
  var weightInput = document.getElementById('weightInput');
  var weightUnitLabel = document.getElementById('weightUnitLabel');
  var weightError = document.getElementById('weightError');
  var unitLbsBtn = document.getElementById('unitLbs');
  var unitKgBtn = document.getElementById('unitKg');

  var typeOnionRawBtn = document.getElementById('typeOnionRaw');
  var typeOnionPowderBtn = document.getElementById('typeOnionPowder');
  var typeGarlicRawBtn = document.getElementById('typeGarlicRaw');
  var typeGarlicPowderBtn = document.getElementById('typeGarlicPowder');

  var amountInput = document.getElementById('amountInput');
  var amountError = document.getElementById('amountError');

  var form = document.getElementById('calcForm');
  var resultsWrap = document.getElementById('resultsWrap');
  var resultBanner = document.getElementById('resultBanner');
  var tierLabelText = document.getElementById('tierLabelText');
  var resultHeadline = document.getElementById('resultHeadline');
  var resultDetail = document.getElementById('resultDetail');
  var doseGKg = document.getElementById('doseGKg');
  var doseTotalG = document.getElementById('doseTotalG');
  var actionBlock = document.getElementById('actionBlock');

  /* ============================================
     UNIT TOGGLES
     ============================================ */
  function setWeightUnit(unit) {
    state.weightUnit = unit;
    unitLbsBtn.setAttribute('aria-pressed', unit === 'lbs' ? 'true' : 'false');
    unitKgBtn.setAttribute('aria-pressed', unit === 'kg' ? 'true' : 'false');
    weightUnitLabel.textContent = unit;
  }
  unitLbsBtn.addEventListener('click', function () { setWeightUnit('lbs'); });
  unitKgBtn.addEventListener('click', function () { setWeightUnit('kg'); });

  /* ============================================
     FOOD TYPE TOGGLE
     ============================================ */
  function setFoodType(type) {
    state.foodType = type;
    typeOnionRawBtn.setAttribute('aria-pressed', type === 'onionRaw' ? 'true' : 'false');
    typeOnionPowderBtn.setAttribute('aria-pressed', type === 'onionPowder' ? 'true' : 'false');
    typeGarlicRawBtn.setAttribute('aria-pressed', type === 'garlicRaw' ? 'true' : 'false');
    typeGarlicPowderBtn.setAttribute('aria-pressed', type === 'garlicPowder' ? 'true' : 'false');
  }
  typeOnionRawBtn.addEventListener('click', function () { setFoodType('onionRaw'); });
  typeOnionPowderBtn.addEventListener('click', function () { setFoodType('onionPowder'); });
  typeGarlicRawBtn.addEventListener('click', function () { setFoodType('garlicRaw'); });
  typeGarlicPowderBtn.addEventListener('click', function () { setFoodType('garlicPowder'); });

  /* ============================================
     CORE CALCULATION
     ============================================ */
  function calculateRisk(weightRaw, weightUnit, foodType, amountGrams) {
    var weightKg = weightUnit === 'lbs' ? weightRaw * 0.453592 : weightRaw;

    var multiplier = POTENCY_MULTIPLIER[foodType];
    var onionEquivalentGrams = amountGrams * multiplier;
    var gPerKg = onionEquivalentGrams / weightKg;

    var tier;
    if (gPerKg >= THRESHOLD_URGENT) {
      tier = 'emergency';
    } else if (gPerKg >= THRESHOLD_CAUTION) {
      tier = 'urgent';
    } else {
      tier = 'caution';
    }

    return {
      weightKg: weightKg,
      amountGrams: amountGrams,
      gPerKg: gPerKg,
      foodType: foodType,
      tier: tier
    };
  }

  /* ============================================
     RENDER RESULTS
     ============================================ */
  var TIER_COPY = {
    emergency: {
      label: 'Emergency — act now',
      headline: 'This estimated dose is well within the documented toxic range.',
      detail: 'Based on the weight, food type, and amount entered, the estimated dose (adjusted for garlic and concentrated-form potency) meets or exceeds the higher end of the documented toxic range for dogs. Red blood cell damage can begin within hours even though visible symptoms often take days to appear. Call an emergency veterinarian or animal poison control immediately and plan for bloodwork now, not just if symptoms develop.',
      actions: [
        { primary: true, tel: '8884264435', title: 'Call ASPCA Animal Poison Control', sub: '(888) 426-4435 · 24/7 · consultation fee applies' },
        { primary: false, tel: '8557647661', title: 'Call Pet Poison Helpline', sub: '(855) 764-7661 · 24/7 · consultation fee applies' },
        { primary: false, tel: null, title: 'Head to the nearest emergency vet', sub: 'Ask about a CBC and Heinz body blood smear' }
      ]
    },
    urgent: {
      label: 'Urgent — contact a professional now',
      headline: 'This estimated dose falls within the documented toxic range for dogs.',
      detail: 'The estimated dose (adjusted for garlic and concentrated-form potency) is within the 15 to 30 gram per kilogram range the Merck Veterinary Manual associates with toxicity in dogs. Because clinical signs of hemolytic anemia often do not appear for 3 to 5 days, a normal-looking dog right now does not rule out a problem developing. Call poison control or your veterinarian now to establish a monitoring and bloodwork plan.',
      actions: [
        { primary: true, tel: '8884264435', title: 'Call ASPCA Animal Poison Control', sub: '(888) 426-4435 · 24/7 · consultation fee applies' },
        { primary: false, tel: '8557647661', title: 'Call Pet Poison Helpline', sub: '(855) 764-7661 · 24/7 · consultation fee applies' },
        { primary: false, tel: null, title: 'Schedule bloodwork within 24 to 72 hours', sub: 'Even if your dog currently looks and acts normal' }
      ]
    },
    caution: {
      label: 'Contact a professional today',
      headline: 'This estimated dose is below the typical documented toxic threshold, but monitoring is still important.',
      detail: 'The estimated dose is below the lower end of the range typically associated with toxicity in dogs, but individual sensitivity varies, and garlic and concentrated onion products are easy to underestimate. Call poison control or your vet today to confirm this estimate, and watch for lethargy, pale gums, or dark urine over the next 5 days, since effects from Allium ingestion are frequently delayed.',
      actions: [
        { primary: true, tel: '8884264435', title: 'Call ASPCA Animal Poison Control', sub: '(888) 426-4435 · 24/7 · consultation fee applies' },
        { primary: false, tel: '8557647661', title: 'Call Pet Poison Helpline', sub: '(855) 764-7661 · 24/7 · consultation fee applies' },
        { primary: false, tel: null, title: 'Watch closely for the next 5 days', sub: 'Lethargy, pale or yellow gums, or dark urine warrant an immediate vet visit' }
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
    resultDetail.innerHTML = copy.detail;

    doseGKg.textContent = calc.gPerKg.toFixed(1) + ' g/kg';
    doseTotalG.textContent = calc.amountGrams.toFixed(1) + ' g';

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
    var amountRaw = parseFloat(amountInput.value);

    var valid = true;

    if (!weightRaw || weightRaw <= 0) {
      weightError.classList.add('visible');
      valid = false;
    } else {
      weightError.classList.remove('visible');
    }

    if (!amountRaw || amountRaw <= 0) {
      amountError.classList.add('visible');
      valid = false;
    } else {
      amountError.classList.remove('visible');
    }

    if (!valid) {
      resultsWrap.classList.remove('visible');
      return;
    }

    var calc = calculateRisk(weightRaw, state.weightUnit, state.foodType, amountRaw);
    renderResults(calc);
  });
})();
