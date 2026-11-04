(function () {
  'use strict';
  /* "When did it happen?" timer for calculator pages.
     Vets and poison control ask first how long ago a pet ate something, and for some poisons
     (antifreeze, xylitol, NSAIDs) the time decides the treatment. You pick a time, and a running
     clock shows in the result and in the "Copy result" / "Share with my vet" summary.
     The time is kept only in this browser tab (sessionStorage) so a reload does not lose it,
     and it is gone when the tab closes. It is never sent to PetPoisonCalc or anyone else.
     The only thing recorded is an anonymous "ingest_time_set" analytics event saying which kind
     of button was used (preset, clock, or not sure), with no time or pet details, so we can tell
     whether the feature helps. */
  var form = document.getElementById('calcForm');
  var calcBtn = document.getElementById('calcBtn');
  var actions = document.getElementById('actionBlock');
  if (!form || !calcBtn) { return; }

  var KEY = 'ppc-ingest-v1:' + location.pathname;
  var MAX_AGE = 48 * 60 * 60 * 1000;
  var PRESETS = [
    { min: 0, label: 'Just now' },
    { min: 15, label: '15 min ago' },
    { min: 30, label: '30 min ago' },
    { min: 60, label: '1 hr ago' },
    { min: 120, label: '2 hrs ago' },
    { min: 240, label: '4+ hrs ago', atLeast: true }
  ];
  var state = null; // { t: ms timestamp, atLeast: bool } or { unsure: true }

  function track(kind) {
    try { if (typeof window.gtag === 'function') { window.gtag('event', 'ingest_time_set', { method: kind }); } } catch (e) { /* ignore */ }
  }
  function save() {
    try {
      if (state) { sessionStorage.setItem(KEY, JSON.stringify(state)); } else { sessionStorage.removeItem(KEY); }
    } catch (e) { /* storage blocked: the timer still works until the page is closed */ }
  }
  function load() {
    try {
      var s = JSON.parse(sessionStorage.getItem(KEY) || 'null');
      if (s && (s.unsure || (typeof s.t === 'number' && Date.now() - s.t < MAX_AGE && s.t <= Date.now() + 60000))) { return s; }
    } catch (e) { /* ignore */ }
    return null;
  }

  function clock(t) {
    var d = new Date(t), now = new Date();
    var opts = { hour: 'numeric', minute: '2-digit' };
    var s = d.toLocaleTimeString(undefined, opts);
    if (d.toDateString() !== now.toDateString()) {
      s += ' ' + d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    }
    return s;
  }
  function elapsed(t) {
    var m = Math.max(0, Math.floor((Date.now() - t) / 60000));
    if (m < 1) { return 'less than 1 min'; }
    if (m < 60) { return m + ' min'; }
    var h = Math.floor(m / 60), r = m % 60;
    return h + ' hr' + (h === 1 ? '' : 's') + (r ? ' ' + r + ' min' : '');
  }
  function describe() {
    if (!state) { return ''; }
    if (state.unsure) { return 'Not sure when it happened'; }
    return (state.atLeast ? 'At least ' : 'About ') + elapsed(state.t) + ' ago (at ' + clock(state.t) + ')';
  }

  // ---- Form block ----
  var box = document.createElement('div');
  box.className = 'ingest-timer';
  box.setAttribute('role', 'group');
  box.setAttribute('aria-labelledby', 'ingestLabel');
  var html = '<p class="field-label" id="ingestLabel">When did it happen? <span class="ingest-optional">Optional</span></p>' +
    '<div class="ingest-btns">';
  PRESETS.forEach(function (p, i) {
    html += '<button type="button" class="ingest-btn" data-i="' + i + '" aria-pressed="false">' + p.label + '</button>';
  });
  html += '<button type="button" class="ingest-btn" data-unsure="1" aria-pressed="false">Not sure</button></div>' +
    '<div class="ingest-row"><label class="ingest-time-label" for="ingestTime">Or enter the time</label>' +
    '<input type="time" id="ingestTime" class="ingest-time" />' +
    '<button type="button" class="ingest-clear" id="ingestClear" hidden>Clear</button></div>' +
    '<p class="ingest-status" id="ingestStatus"></p>' +
    '<p class="field-hint">Vets and poison control ask this first, and with some poisons the time changes the treatment. Kept only in this browser tab. Nothing is sent anywhere.</p>';
  box.innerHTML = html;
  calcBtn.parentNode.insertBefore(box, calcBtn);

  var btns = box.querySelectorAll('.ingest-btn');
  var timeInput = box.querySelector('#ingestTime');
  var clearBtn = box.querySelector('#ingestClear');
  var status = box.querySelector('#ingestStatus');

  // ---- Result block ----
  var res = null;
  if (actions) {
    res = document.createElement('div');
    res.className = 'ingest-result';
    res.hidden = true;
    res.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>' +
      '<div><strong class="ingest-result-title"></strong><span class="ingest-result-sub"></span></div>';
    actions.parentNode.insertBefore(res, actions);
  }

  function render() {
    btns.forEach(function (b) {
      var on = false;
      if (state && state.unsure) { on = !!b.getAttribute('data-unsure'); }
      else if (state && state.preset != null) { on = b.getAttribute('data-i') === String(state.preset); }
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    clearBtn.hidden = !state;
    status.textContent = state ? (state.unsure ? 'Not sure when. Tell the vet when your pet was last seen normal.' : describe() + '. The clock keeps running.') : '';
    if (res) {
      res.hidden = !state;
      if (state) {
        res.querySelector('.ingest-result-title').textContent = state.unsure ? 'Time it happened: not sure' : 'Time since it happened: ' + (state.atLeast ? 'at least ' : '') + elapsed(state.t);
        res.querySelector('.ingest-result-sub').textContent = state.unsure
          ? 'Tell the vet or poison control when your pet was last seen acting normal, and when you found the problem.'
          : 'Since ' + clock(state.t) + '. Tell the vet or poison control this time. Copy result and Share with my vet include it.';
      }
    }
  }
  function set(s, kind) {
    state = s;
    save();
    render();
    if (kind) { track(kind); }
  }

  btns.forEach(function (b) {
    b.addEventListener('click', function () {
      if (b.getAttribute('data-unsure')) { timeInput.value = ''; set({ unsure: true }, 'unsure'); return; }
      var i = +b.getAttribute('data-i'), p = PRESETS[i];
      timeInput.value = '';
      set({ t: Date.now() - p.min * 60000, atLeast: !!p.atLeast, preset: i }, 'preset');
    });
  });
  timeInput.addEventListener('change', function () {
    var v = timeInput.value;
    if (!/^\d{1,2}:\d{2}/.test(v)) { return; }
    var parts = v.split(':'), d = new Date();
    d.setHours(+parts[0], +parts[1], 0, 0);
    // A time later than now means yesterday (for example 11:30 PM entered at 1 AM).
    if (d.getTime() > Date.now() + 60000) { d.setDate(d.getDate() - 1); }
    set({ t: d.getTime(), atLeast: false }, 'clock');
  });
  clearBtn.addEventListener('click', function () { timeInput.value = ''; set(null); });

  state = load();
  render();
  setInterval(function () { if (state && !state.unsure) { render(); } }, 20000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { render(); } });

  // Used by share-result.js so the copied or shared summary includes the time.
  window.PetPoisonCalcIngestLine = function () {
    if (!state) { return ''; }
    if (state.unsure) { return 'When it happened: not sure'; }
    return 'When it happened: ' + describe().charAt(0).toLowerCase() + describe().slice(1);
  };
})();
