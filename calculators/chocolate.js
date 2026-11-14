(function () {
  'use strict';

  // Theme toggle lives in /assets/shell.js.

  /* ============================================
     STATE
     ============================================ */
  var state = {
    weightUnit: 'lbs', // 'lbs' | 'kg'
    chocolateType: 'dark', // 'baking' | 'dark' | 'milk' | 'white'
    amountUnit: 'oz', // 'oz' | 'g'
    inputMode: 'chocolate', // 'chocolate' | 'cookie'
    cookieType: 'chip',
    cookieSize: 'regular'
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
     COOKIE ESTIMATES
     Each entry is grams of a calculator chocolate type (almost always
     dark) for ONE cookie, already rounded UP. Semisweet chips are
     counted as dark chocolate, the darker type, because this
     calculator has no semisweet category and already tells users to
     choose dark when unsure between dark and semi-sweet.

     Size ratios used when a published large or small recipe is not
     available for that cookie:
       small = 10/16 = 0.625
         USDA SR Legacy homemade chocolate chip, medium, 2-1/4 inch
         diameter, is 16 g (FDC 174955). USDA commercial medium
         cookie, same diameter, is 10 g (FDC 172716).
       large = 3.75
         Official large (1/4-cup scoop) cookie uses 6 oz (170 g)
         semisweet chips for 8 cookies. Official regular (rounded
         tablespoon) cookie uses 12 oz (340 g) chips for 60 cookies.
         (170/8) / (340/60) = 3.75.

     Package weights use 12 oz = 340 g as printed on the 12-ounce
     bag. Cocoa "1 cup" = 86 g from USDA FDC 169593 (unsweetened
     cocoa powder). Theobromine in that cocoa record is 1769 mg per
     86 g. Milk-chocolate topping uses this page's 1.55 oz bar and
     the existing milk constant (2.1 mg/g), converted into dark grams
     with the existing dark constant (8.1 mg/g).
     ============================================ */
  // grams of chocolate type, per one cookie, rounded up
  var COOKIE_GRAMS = {
    // Chocolate chip, counted as dark (semisweet chips, darker type).
    // Regular: 340 g chips / 60 cookies = 5.667 g, rounded up to 6 g.
    //   Source: standard published recipe, 12 oz (340 g) semisweet
    //   chips, yield 5 dozen, drop by rounded tablespoon.
    //   https://www.verybestbaking.com/toll-house/recipes/original-nestle-toll-house-chocolate-chip-cookies/
    // Small: 5.667 * 0.625 = 3.542 g, rounded up to 4 g.
    // Large: 170 g chips / 8 cookies = 21.25 g, rounded up to 22 g.
    //   Source: same recipe family, "small batch" method: 6 oz chips,
    //   yield 8 large cookies, drop with a 1/4-cup measuring cup.
    //   https://www.verybestbaking.com/toll-house/recipes/original-nestle-toll-house-chocolate-chip-cookies-small-batch/
    chip: { type: 'dark', small: 4, regular: 6, large: 22 },

    // S'mores cookie, counted as dark.
    // Regular: a regular chocolate-chip cookie (5.667 g semisweet,
    // counted as dark) plus 1/4 of a 1.55 oz milk chocolate bar
    // (this page already uses 1.55 oz as a standard bar).
    //   1.55 oz * 28.3495 g/oz / 4 = 10.989 g milk chocolate
    //   * 2.1 / 8.1 = 2.849 g dark-equivalent
    //   5.667 + 2.849 = 8.516 g, rounded up to 9 g.
    // Graham cracker and marshmallow are not theobromine sources;
    // chocolate is the concern. Small and large use the same size
    // ratios as chocolate chip cookies (0.625 and 3.75).
    // Small: 8.516 * 0.625 = 5.322 g, rounded up to 6 g.
    // Large: 8.516 * 3.75 = 31.935 g, rounded up to 32 g.
    smores: { type: 'dark', small: 6, regular: 9, large: 32 },

    // Double chocolate / chocolate cookie, counted as dark.
    // Regular: published recipe, 1/2 cup unsweetened cocoa plus
    // 12 oz (340 g) semisweet chips, yield 54 cookies (4 1/2 dozen),
    // drop by rounded tablespoon.
    //   https://www.verybestbaking.com/toll-house/recipes/double-chocolate-dream-cookies/
    //   Chips: 340/54 = 6.296 g, counted as dark.
    //   Cocoa: 1/2 cup = 43 g (USDA FDC 169593, 1 cup = 86 g) / 54
    //   = 0.796 g cocoa * (1769 mg / 86 g) = 16.38 mg theobromine
    //   / 8.1 mg/g dark = 2.022 g dark-equivalent.
    //   6.296 + 2.022 = 8.318 g, rounded up to 9 g.
    // Small: 8.318 * 0.625 = 5.199 g, rounded up to 6 g.
    // Large: 8.318 * 3.75 = 31.193 g, rounded up to 32 g.
    double: { type: 'dark', small: 6, regular: 9, large: 32 },

    // Cream-filled chocolate sandwich cookie, counted as dark.
    // USDA SR Legacy FDC 172718, "Cookies, chocolate sandwich, with
    // creme filling, regular": 184 mg theobromine per 100 g (MyFoodData
    // lists 66.2 mg in a 36 g serving of 3 cookies). One regular
    // cookie is 12 g: 66.2/3 = 22.067 mg theobromine / 8.1 = 2.724 g
    // dark-equivalent, rounded up to 3 g.
    // Small: 12 g * 0.625 = 7.5 g cookie, 13.792 mg / 8.1 = 1.703 g,
    // rounded up to 2 g.
    // Large: 12 g * 3.75 = 45 g cookie, 82.75 mg / 8.1 = 10.216 g,
    // rounded up to 11 g. No published bakery sandwich yield was
    // found, so large uses the same 3.75 size ratio as chocolate
    // chip cookies.
    sandwich: { type: 'dark', small: 2, regular: 3, large: 11 },

    // Chocolate-dipped or fudge-covered cookie, counted as dark.
    // Uses the higher USDA coated-cookie theobromine density:
    // FDC 174088, "Cookies, sugar wafer, chocolate-covered",
    // 51.6 mg theobromine in 29 g (3 cookies), or 177.9 mg/100 g.
    // (FDC 174958 chocolate-coated graham crackers are lower:
    // 23.8 mg in 27 g / 3 pieces, 88 mg/100 g.)
    // Small: one USDA covered wafer, 29/3 g, 17.2 mg / 8.1 = 2.123 g,
    // rounded up to 3 g.
    // Regular: 16 g (USDA homemade medium cookie weight, FDC 174955)
    // * 51.6/29 = 28.47 mg / 8.1 = 3.515 g, rounded up to 4 g.
    // Large: 16 g * 3.75 = 60 g * 51.6/29 = 106.76 mg / 8.1 = 13.180 g,
    // rounded up to 14 g.
    dipped: { type: 'dark', small: 3, regular: 4, large: 14 },

    // Brownie, counted as dark.
    // Small and regular use USDA SR Legacy FDC 172713, "Cookies,
    // brownies, commercially prepared", 78 mg theobromine per 100 g.
    // Small: USDA 1 oz portion (MyFoodData 28 g, 22.2 mg) / 8.1 =
    // 2.741 g, rounded up to 3 g.
    // Regular: USDA "1 square, large (2-3/4 inch sq x 7/8 inch)",
    // 56 g, 43.7 mg / 8.1 = 5.395 g, rounded up to 6 g.
    // Large / bakery: homemade brownies made with unsweetened baking
    // chocolate can be much stronger than packaged ones. A published
    // 13x9-inch recipe uses 4 oz unsweetened chocolate
    // (https://www.kraftheinz.com/bakers/recipes/506344-bakers-one-bowl-brownies).
    // That page lists the pan and the 4 oz chocolate but not a cut
    // count. Large is counted as 1/12 of that pan:
    //   4 oz * 28.3495 g/oz / 12 = 9.450 g baking chocolate
    //   * 16.0 / 8.1 = 18.666 g dark-equivalent, rounded up to 19 g.
    // If the brownie was homemade or you are not sure, "I'm not sure"
    // uses a higher estimate (the large double chocolate cookie).
    brownie: { type: 'dark', small: 3, regular: 6, large: 19 },

    // I'm not sure: worst-case reasonable cookie in this table, the
    // large double chocolate cookie (32 g dark). The large s'mores
    // cookie rounds to the same 32 g. A large homemade brownie in
    // this table is 19 g dark, which is lower.
    unsure: { type: 'dark', small: 6, regular: 9, large: 32 }
  };

  var COOKIE_LABELS = {
    chip: 'chocolate chip cookie',
    smores: "s'mores cookie",
    double: 'double chocolate cookie',
    sandwich: 'cream-filled chocolate sandwich cookie',
    dipped: 'chocolate-dipped or fudge-covered cookie',
    brownie: 'brownie',
    unsure: 'cookie (highest reasonable estimate)'
  };

  var SIZE_LABELS = {
    small: 'small',
    regular: 'regular',
    large: 'large or bakery',
    unsure: 'unsure, counted as large or bakery'
  };

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
  var cookieNote = document.getElementById('cookieNote');

  var chocolateFields = document.getElementById('chocolateFields');
  var cookieFields = document.getElementById('cookieFields');
  var cookieCountInput = document.getElementById('cookieCountInput');
  var cookieCountError = document.getElementById('cookieCountError');
  var cookieEstimate = document.getElementById('cookieEstimate');
  var modeChocolateBtn = document.getElementById('modeChocolate');
  var modeCookieBtn = document.getElementById('modeCookie');

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
     INPUT MODE AND COOKIE PICKERS
     ============================================ */
  function cookieSizeKey() {
    return state.cookieSize === 'unsure' ? 'large' : state.cookieSize;
  }

  function cookieEstimateData() {
    var row = COOKIE_GRAMS[state.cookieType] || COOKIE_GRAMS.unsure;
    var size = cookieSizeKey();
    return {
      type: row.type,
      gramsEach: row[size],
      size: size
    };
  }

  function typeWord(type) {
    if (type === 'baking') return 'baking / unsweetened chocolate';
    if (type === 'dark') return 'dark chocolate';
    if (type === 'milk') return 'milk chocolate';
    return 'white chocolate';
  }

  var smoresHint = document.getElementById('smoresHint');

  function updateCookieEstimate() {
    if (!cookieEstimate) return;
    var count = parseFloat(cookieCountInput && cookieCountInput.value);
    var data = cookieEstimateData();
    var each = data.gramsEach;
    var typeName = typeWord(data.type);
    if (count && count > 0) {
      var total = each * count;
      var totalText = (Math.round(total * 10) / 10) + ' g';
      cookieEstimate.textContent = 'Counted as ' + totalText + ' of ' + typeName +
        ' (' + each + ' g each).';
    } else {
      cookieEstimate.textContent = 'Each ' + SIZE_LABELS[state.cookieSize] + ' ' +
        COOKIE_LABELS[state.cookieType] + ' is counted as ' + each + ' g of ' +
        typeName + '.';
    }
    if (smoresHint) smoresHint.hidden = state.cookieType !== 'smores';
  }

  function setInputMode(mode) {
    state.inputMode = mode;
    if (modeChocolateBtn) {
      modeChocolateBtn.setAttribute('aria-pressed', mode === 'chocolate' ? 'true' : 'false');
    }
    if (modeCookieBtn) {
      modeCookieBtn.setAttribute('aria-pressed', mode === 'cookie' ? 'true' : 'false');
    }
    if (chocolateFields) chocolateFields.hidden = mode !== 'chocolate';
    if (cookieFields) cookieFields.hidden = mode !== 'cookie';
    if (mode === 'cookie') {
      if (amountError) amountError.classList.remove('visible');
      updateCookieEstimate();
    } else if (cookieCountError) {
      cookieCountError.classList.remove('visible');
    }
  }

  if (modeChocolateBtn) {
    modeChocolateBtn.addEventListener('click', function () { setInputMode('chocolate'); });
  }
  if (modeCookieBtn) {
    modeCookieBtn.addEventListener('click', function () { setInputMode('cookie'); });
  }

  function bindSegGroup(selector, key, after) {
    var buttons = Array.prototype.slice.call(document.querySelectorAll(selector));
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        state[key] = btn.getAttribute('data-v');
        buttons.forEach(function (b) {
          b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
        });
        if (after) after();
      });
    });
  }

  bindSegGroup('.cookie-type', 'cookieType', updateCookieEstimate);
  bindSegGroup('.cookie-size', 'cookieSize', updateCookieEstimate);
  if (cookieCountInput) {
    cookieCountInput.addEventListener('input', updateCookieEstimate);
  }

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
      label: 'Emergency: act now',
      headline: 'This estimated dose is in the range where seizures have been documented.',
      detail: 'Based on the weight, chocolate type, and amount entered, the estimated theobromine dose meets or exceeds 60 mg per kg body weight, the threshold associated with seizures in published veterinary data. Do not wait for symptoms. Call an emergency veterinarian or animal poison control immediately, and plan to have your dog seen in person right away.',
      actions: [
        { primary: true, tel: '8884264435', title: 'Call ASPCA Animal Poison Control', sub: '(888) 426-4435 · 24/7 · consultation fee applies' },
        { primary: false, tel: '8557647661', title: 'Call Pet Poison Helpline', sub: '(855) 764-7661 · 24/7 · consultation fee applies' },
        { primary: false, tel: null, title: 'Head to the nearest emergency vet', sub: 'Bring packaging or a sample of what was eaten if possible' }
      ]
    },
    urgent: {
      label: 'Urgent: contact a professional now',
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

    if (cookieNote) {
      if (calc.cookieSummary) {
        cookieNote.hidden = false;
        cookieNote.textContent = calc.cookieSummary;
      } else {
        cookieNote.hidden = true;
        cookieNote.textContent = '';
      }
    }

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
    var valid = true;

    if (!weightRaw || weightRaw <= 0) {
      weightError.classList.add('visible');
      valid = false;
    } else {
      weightError.classList.remove('visible');
    }

    var chocolateType = state.chocolateType;
    var amountRaw;
    var amountUnit;
    var cookieSummary = '';

    if (state.inputMode === 'cookie') {
      if (amountError) amountError.classList.remove('visible');
      var count = parseFloat(cookieCountInput.value);
      if (!count || count <= 0) {
        cookieCountError.classList.add('visible');
        valid = false;
      } else {
        cookieCountError.classList.remove('visible');
      }
      if (!valid) {
        resultsWrap.classList.remove('visible');
        return;
      }
      var data = cookieEstimateData();
      chocolateType = data.type;
      amountRaw = data.gramsEach * count;
      amountUnit = 'g';
      var countLabel = count === 1 ? '1 ' + SIZE_LABELS[state.cookieSize] + ' ' + COOKIE_LABELS[state.cookieType] :
        count + ' ' + SIZE_LABELS[state.cookieSize] + ' ' + COOKIE_LABELS[state.cookieType] + 's';
      if (state.cookieType === 'unsure') {
        countLabel = count === 1 ? '1 cookie, using the highest reasonable estimate' :
          count + ' cookies, using the highest reasonable estimate';
        if (state.cookieSize !== 'regular' && state.cookieSize !== 'small') {
          countLabel += ' at large or bakery size';
        } else {
          countLabel += ' at ' + SIZE_LABELS[state.cookieSize] + ' size';
        }
      }
      cookieSummary = 'Counted ' + countLabel + ' as ' +
        (Math.round(amountRaw * 10) / 10) + ' g of ' + typeWord(chocolateType) + '.';
    } else {
      if (cookieCountError) cookieCountError.classList.remove('visible');
      amountRaw = parseFloat(amountInput.value);
      amountUnit = state.amountUnit;
      if (!amountRaw || amountRaw <= 0) {
        amountError.classList.add('visible');
        valid = false;
      } else {
        amountError.classList.remove('visible');
      }
    }

    if (!valid) {
      resultsWrap.classList.remove('visible');
      return;
    }

    var calc = calculateRisk(weightRaw, state.weightUnit, chocolateType, amountRaw, amountUnit);
    calc.cookieSummary = cookieSummary;
    renderResults(calc);
  });

  function applyCookiesHash() {
    if (location.hash === '#cookies') {
      setInputMode('cookie');
      var el = document.getElementById('cookies');
      if (el && el.scrollIntoView) {
        el.scrollIntoView({ block: 'start' });
      }
    }
  }
  setInputMode('chocolate');
  applyCookiesHash();
  window.addEventListener('hashchange', applyCookiesHash);
})();
