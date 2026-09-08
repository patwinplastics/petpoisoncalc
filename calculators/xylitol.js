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
    productType: 'gum' // 'gum' | 'pb' | 'baked' | 'pure'
  };

  /* ============================================
     REFERENCE CONSTANTS
     Grams of xylitol per unit for each product type.
     Gum/mints: per piece. All others: per gram of product (conservative high end).
     ============================================ */
  var XYLITOL_G_PER_UNIT = {
    gum: 1.0,      // grams per piece, high end of 0.3-1g range
    pb: 0.13,      // grams per gram of product, high end of 5-13g/100g range
    baked: 0.10,   // grams per gram of product, conservative mid estimate since it varies widely
    pure: 1.0      // grams per gram of product (100% xylitol)
  };

  // Clinical thresholds in mg xylitol per kg body weight (Merck Veterinary Manual)
  var THRESHOLD_HYPOGLYCEMIA = 100;
  var THRESHOLD_HEPATIC = 500;

  /* ============================================
     DOM REFS
     ============================================ */
  var weightInput = document.getElementById('weightInput');
  var weightUnitLabel = document.getElementById('weightUnitLabel');
  var weightError = document.getElementById('weightError');
  var unitLbsBtn = document.getElementById('unitLbs');
  var unitKgBtn = document.getElementById('unitKg');

  var typeGumBtn = document.getElementById('typeGum');
  var typePBBtn = document.getElementById('typePB');
  var typeBakedBtn = document.getElementById('typeBaked');
  var typePureBtn = document.getElementById('typePure');

  var amountInput = document.getElementById('amountInput');
  var amountUnitLabel = document.getElementById('amountUnitLabel');
  var amountError = document.getElementById('amountError');
  var amountHint = document.getElementById('amountHint');

  var form = document.getElementById('calcForm');
  var resultsWrap = document.getElementById('resultsWrap');
  var resultBanner = document.getElementById('resultBanner');
  var tierLabelText = document.getElementById('tierLabelText');
  var resultHeadline = document.getElementById('resultHeadline');
  var resultDetail = document.getElementById('resultDetail');
  var doseMgKg = document.getElementById('doseMgKg');
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
     PRODUCT TYPE TOGGLE
     ============================================ */
  function setProductType(type) {
    state.productType = type;
    typeGumBtn.setAttribute('aria-pressed', type === 'gum' ? 'true' : 'false');
    typePBBtn.setAttribute('aria-pressed', type === 'pb' ? 'true' : 'false');
    typeBakedBtn.setAttribute('aria-pressed', type === 'baked' ? 'true' : 'false');
    typePureBtn.setAttribute('aria-pressed', type === 'pure' ? 'true' : 'false');

    if (type === 'gum') {
      amountUnitLabel.textContent = 'pieces';
      amountHint.textContent = 'Enter the number of pieces of gum or mints eaten.';
    } else {
      amountUnitLabel.textContent = 'grams';
      amountHint.textContent = 'Enter the total grams of product eaten (not just grams of xylitol), for example the weight of peanut butter or baked good consumed.';
    }
  }
  typeGumBtn.addEventListener('click', function () { setProductType('gum'); });
  typePBBtn.addEventListener('click', function () { setProductType('pb'); });
  typeBakedBtn.addEventListener('click', function () { setProductType('baked'); });
  typePureBtn.addEventListener('click', function () { setProductType('pure'); });

  /* ============================================
     CORE CALCULATION
     ============================================ */
  function calculateRisk(weightRaw, weightUnit, productType, amountRaw) {
    var weightKg = weightUnit === 'lbs' ? weightRaw * 0.453592 : weightRaw;

    var gPerUnit = XYLITOL_G_PER_UNIT[productType];
    var totalXylitolG = amountRaw * gPerUnit;
    var totalXylitolMg = totalXylitolG * 1000;
    var mgPerKg = totalXylitolMg / weightKg;

    var tier;
    if (mgPerKg >= THRESHOLD_HEPATIC) {
      tier = 'emergency';
    } else if (mgPerKg >= THRESHOLD_HYPOGLYCEMIA) {
      tier = 'urgent';
    } else {
      tier = 'caution';
    }

    return {
      weightKg: weightKg,
      totalXylitolG: totalXylitolG,
      mgPerKg: mgPerKg,
      productType: productType,
      tier: tier
    };
  }

  /* ============================================
     RENDER RESULTS
     ============================================ */
  var TIER_COPY = {
    emergency: {
      label: 'Emergency — act now',
      headline: 'This estimated dose is in the range associated with severe liver injury.',
      detail: 'Based on the weight and amount entered, the estimated xylitol dose meets or exceeds 500 mg per kg body weight, the threshold the Merck Veterinary Manual associates with severe hepatic (liver) insufficiency or failure, in addition to the hypoglycemia risk present at lower doses. Do not wait for symptoms. Call an emergency veterinarian or animal poison control immediately, and get your dog seen in person right away. Baseline liver enzyme testing and dextrose supplementation are typically needed even if your dog seems normal.',
      actions: [
        { primary: true, tel: '8884264435', title: 'Call ASPCA Animal Poison Control', sub: '(888) 426-4435 · 24/7 · consultation fee applies' },
        { primary: false, tel: '8557647661', title: 'Call Pet Poison Helpline', sub: '(855) 764-7661 · 24/7 · consultation fee applies' },
        { primary: false, tel: null, title: 'Head to the nearest emergency vet', sub: 'Bring packaging so the vet can confirm the xylitol content' }
      ]
    },
    urgent: {
      label: 'Urgent — contact a professional now',
      headline: 'This estimated dose is in the range associated with hypoglycemia.',
      detail: 'The estimated xylitol dose is at or above 100 mg per kg body weight, the threshold veterinary sources associate with hypoglycemia (dangerously low blood sugar). Signs can appear within 30 minutes. Call poison control or your veterinarian now, and plan to have your dog seen and have blood glucose checked as soon as possible, even before symptoms appear.',
      actions: [
        { primary: true, tel: '8884264435', title: 'Call ASPCA Animal Poison Control', sub: '(888) 426-4435 · 24/7 · consultation fee applies' },
        { primary: false, tel: '8557647661', title: 'Call Pet Poison Helpline', sub: '(855) 764-7661 · 24/7 · consultation fee applies' },
        { primary: false, tel: null, title: 'Head to a vet for a glucose check', sub: 'Do not wait for symptoms to appear before seeking care' }
      ]
    },
    caution: {
      label: 'Contact a professional now',
      headline: 'This estimated dose is below the documented hypoglycemia threshold, but professional guidance is still needed.',
      detail: 'The estimated xylitol dose is below the 100 mg per kg threshold typically associated with hypoglycemia, but xylitol content in many products is inconsistently labeled, and dose estimates from gum pieces or baked goods carry real uncertainty. Call poison control or your veterinarian now to confirm this estimate is accurate for the specific product involved, and watch closely for weakness, vomiting, or loss of coordination over the next several hours.',
      actions: [
        { primary: true, tel: '8884264435', title: 'Call ASPCA Animal Poison Control', sub: '(888) 426-4435 · 24/7 · consultation fee applies' },
        { primary: false, tel: '8557647661', title: 'Call Pet Poison Helpline', sub: '(855) 764-7661 · 24/7 · consultation fee applies' },
        { primary: false, tel: null, title: 'Monitor closely for the next 12 to 24 hours', sub: 'Weakness, vomiting, tremors, or collapse warrant an immediate vet visit' }
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

    doseMgKg.textContent = calc.mgPerKg.toFixed(1) + ' mg/kg';
    doseTotalG.textContent = calc.totalXylitolG.toFixed(2) + ' g';

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

    var calc = calculateRisk(weightRaw, state.weightUnit, state.productType, amountRaw);
    renderResults(calc);
  });
})();
