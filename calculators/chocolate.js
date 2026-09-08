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
    chocolateType: 'dark', // 'baking' | 'dark' | 'milk' | 'white'
    amountUnit: 'oz' // 'oz' | 'g'
  };

  /* ============================================
     REFERENCE CONSTANTS (from Merck Veterinary Manual / MyFoodData)
     Theobromine content in mg per gram of chocolate, by type.
     Using the higher end of each range for a conservative estimate.
     ============================================ */
  var THEOBROMINE_MG_PER_G = {
    baking: 16.0,  // ~450 mg/oz -> 450/28.35
    dark: 8.1,     // ~230 mg/oz (70-85% cocoa) -> 230/28.35
    milk: 2.1,     // ~60 mg/oz -> 60/28.35
    white: 0.02    // negligible
  };

  // Clinical thresholds in mg theobromine per kg body weight (Merck Veterinary Manual)
  var THRESHOLD_MILD = 20;
  var THRESHOLD_CARDIOTOXIC = 40;
  var THRESHOLD_SEIZURE = 60;
  var THRESHOLD_LD50_LOW = 100;

  /* ============================================
     DOM REFS
     ============================================ */
  var weightInput = document.getElementById('weightInput');
  var weightUnitLabel = document.getElementById('weightUnitLabel');
  var weightError = document.getElementById('weightError');
  var unitLbsBtn = document.getElementById('unitLbs');
  var unitKgBtn = document.getElementById('unitKg');

  var typeBakingBtn = document.getElementById('typeBaking');
  var typeDarkBtn = document.getElementById('typeDark');
  var typeMilkBtn = document.getElementById('typeMilk');
  var typeWhiteBtn = document.getElementById('typeWhite');

  var amountInput = document.getElementById('amountInput');
  var amountUnitLabel = document.getElementById('amountUnitLabel');
  var amountUnitOzBtn = document.getElementById('amountUnitOz');
  var amountUnitGBtn = document.getElementById('amountUnitG');
  var amountError = document.getElementById('amountError');

  var form = document.getElementById('calcForm');
  var resultsWrap = document.getElementById('resultsWrap');
  var resultBanner = document.getElementById('resultBanner');
  var tierLabelText = document.getElementById('tierLabelText');
  var resultHeadline = document.getElementById('resultHeadline');
  var resultDetail = document.getElementById('resultDetail');
  var doseTheobromine = document.getElementById('doseTheobromine');
  var doseTotalMg = document.getElementById('doseTotalMg');
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

  function setAmountUnit(unit) {
    state.amountUnit = unit;
    amountUnitOzBtn.setAttribute('aria-pressed', unit === 'oz' ? 'true' : 'false');
    amountUnitGBtn.setAttribute('aria-pressed', unit === 'g' ? 'true' : 'false');
    amountUnitLabel.textContent = unit;
  }
  amountUnitOzBtn.addEventListener('click', function () { setAmountUnit('oz'); });
  amountUnitGBtn.addEventListener('click', function () { setAmountUnit('g'); });

  /* ============================================
     CHOCOLATE TYPE TOGGLE
     ============================================ */
  function setChocolateType(type) {
    state.chocolateType = type;
    typeBakingBtn.setAttribute('aria-pressed', type === 'baking' ? 'true' : 'false');
    typeDarkBtn.setAttribute('aria-pressed', type === 'dark' ? 'true' : 'false');
    typeMilkBtn.setAttribute('aria-pressed', type === 'milk' ? 'true' : 'false');
    typeWhiteBtn.setAttribute('aria-pressed', type === 'white' ? 'true' : 'false');
  }
  typeBakingBtn.addEventListener('click', function () { setChocolateType('baking'); });
  typeDarkBtn.addEventListener('click', function () { setChocolateType('dark'); });
  typeMilkBtn.addEventListener('click', function () { setChocolateType('milk'); });
  typeWhiteBtn.addEventListener('click', function () { setChocolateType('white'); });

  /* ============================================
     CORE CALCULATION
     ============================================ */
  function calculateRisk(weightRaw, weightUnit, chocolateType, amountRaw, amountUnit) {
    var weightKg = weightUnit === 'lbs' ? weightRaw * 0.453592 : weightRaw;
    var amountGrams = amountUnit === 'oz' ? amountRaw * 28.3495 : amountRaw;

    var mgPerGram = THEOBROMINE_MG_PER_G[chocolateType];
    var totalMg = amountGrams * mgPerGram;
    var mgPerKg = totalMg / weightKg;

    var tier;
    if (mgPerKg >= THRESHOLD_SEIZURE) {
      tier = 'emergency'; // seizure-range or higher
    } else if (mgPerKg >= THRESHOLD_CARDIOTOXIC) {
      tier = 'urgent'; // cardiotoxic range
    } else if (mgPerKg >= THRESHOLD_MILD) {
      tier = 'caution'; // mild clinical sign range
    } else {
      tier = 'caution'; // below documented thresholds, but still requires professional guidance
    }

    return {
      weightKg: weightKg,
      amountGrams: amountGrams,
      totalMg: totalMg,
      mgPerKg: mgPerKg,
      chocolateType: chocolateType,
      tier: tier,
      belowMildThreshold: mgPerKg < THRESHOLD_MILD
    };
  }

  /* ============================================
     RENDER RESULTS
     ============================================ */
  var TIER_COPY = {
    emergency: {
      label: 'Emergency — act now',
      headline: 'This estimated dose is in the range where seizures have been documented.',
      detail: 'Based on the weight, chocolate type, and amount entered, the estimated theobromine dose meets or exceeds 60 mg per kg body weight, the threshold associated with seizures in published veterinary data. Do not wait for symptoms. Call an emergency veterinarian or animal poison control immediately, and plan to have your dog seen in person right away.',
      actions: [
        { primary: true, tel: '8884264435', title: 'Call ASPCA Animal Poison Control', sub: '(888) 426-4435 · 24/7 · consultation fee applies' },
        { primary: false, tel: '8557647661', title: 'Call Pet Poison Helpline', sub: '(855) 764-7661 · 24/7 · consultation fee applies' },
        { primary: false, tel: null, title: 'Head to the nearest emergency vet', sub: 'Bring packaging or a sample of what was eaten if possible' }
      ]
    },
    urgent: {
      label: 'Urgent — contact a professional now',
      headline: 'This estimated dose falls in a range associated with cardiac effects.',
      detail: 'The estimated theobromine dose is at or above 40 mg per kg body weight, a range veterinary sources associate with abnormal heart rhythm and elevated heart rate. Individual sensitivity to theobromine varies, so this amount cannot be assumed safe. Call poison control or your veterinarian now, before symptoms start, so you have a documented case number and a treatment plan.',
      actions: [
        { primary: true, tel: '8884264435', title: 'Call ASPCA Animal Poison Control', sub: '(888) 426-4435 · 24/7 · consultation fee applies' },
        { primary: false, tel: '8557647661', title: 'Call Pet Poison Helpline', sub: '(855) 764-7661 · 24/7 · consultation fee applies' },
        { primary: false, tel: null, title: 'Call or message your regular veterinarian', sub: 'If after hours, use one of the hotlines above first' }
      ]
    },
    caution: {
      label: 'Contact a professional today',
      headline: 'This estimated dose is at or below the mild clinical sign threshold, but a professional check is still recommended.',
      detail: 'The estimated theobromine dose is in a lower range, but individual dogs vary in sensitivity, and mild signs such as vomiting, diarrhea, and excessive thirst have been documented starting around 20 mg per kg body weight. Chocolate type is easy to misjudge, so if there is any doubt about what was eaten, treat this as the more serious category. Call poison control or your vet today and watch closely for symptoms over the next 24 to 72 hours.',
      actions: [
        { primary: true, tel: '8884264435', title: 'Call ASPCA Animal Poison Control', sub: '(888) 426-4435 · 24/7 · consultation fee applies' },
        { primary: false, tel: '8557647661', title: 'Call Pet Poison Helpline', sub: '(855) 764-7661 · 24/7 · consultation fee applies' },
        { primary: false, tel: null, title: 'Monitor closely for 72 hours', sub: 'Vomiting, restlessness, panting, or abnormal heart rate warrant an immediate vet visit' }
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

    doseTheobromine.textContent = calc.mgPerKg.toFixed(1) + ' mg/kg';
    doseTotalMg.textContent = Math.round(calc.totalMg) + ' mg';

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

    var calc = calculateRisk(weightRaw, state.weightUnit, state.chocolateType, amountRaw, state.amountUnit);
    renderResults(calc);
  });
})();
