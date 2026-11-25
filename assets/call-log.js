(function () {
  'use strict';
  /* "Poison control call notes" for calculator pages.
     When you tap a poison control number, the time is noted. After the call you can type the case
     number and what they told you. Vets ask for both, and in a panic they are easy to lose.
     Everything is kept only in this browser (localStorage) for 48 hours and then dropped. You can
     clear it at any time. Nothing you type here is sent to PetPoisonCalc or anyone else. The only
     thing recorded is an anonymous "call_notes_used" analytics event with no text and no time. */
  var form = document.getElementById('calcForm');
  var banner = document.getElementById('resultBanner');
  var actions = document.getElementById('actionBlock');
  if (!form || !banner || !actions) { return; }

  var KEY = 'ppc-callnotes-v1';
  var MAX_AGE = 48 * 60 * 60 * 1000;
  var LINES = { '8884264435': 'ASPCA Animal Poison Control', '8557647661': 'Pet Poison Helpline' };
  var state = load();

  function now() { return Date.now(); }
  function load() {
    try {
      var s = JSON.parse(window.localStorage.getItem(KEY) || 'null');
      if (s && typeof s.saved === 'number' && now() - s.saved < MAX_AGE) {
        return { calls: Array.isArray(s.calls) ? s.calls.slice(0, 10) : [], caseNo: String(s.caseNo || '').slice(0, 40), notes: String(s.notes || '').slice(0, 600), saved: s.saved };
      }
      if (s) { window.localStorage.removeItem(KEY); }
    } catch (e) { /* storage blocked: notes last until the page closes */ }
    return { calls: [], caseNo: '', notes: '', saved: now() };
  }
  function save() {
    state.saved = now();
    try {
      if (!state.calls.length && !state.caseNo && !state.notes) { window.localStorage.removeItem(KEY); }
      else { window.localStorage.setItem(KEY, JSON.stringify(state)); }
    } catch (e) { /* ignore */ }
  }
  function track() {
    try { if (typeof window.gtag === 'function') { window.gtag('event', 'call_notes_used'); } } catch (e) { /* ignore */ }
  }
  function clock(t) {
    var d = new Date(t), n = new Date();
    var s = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    if (d.toDateString() !== n.toDateString()) { s += ' ' + d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }); }
    return s;
  }

  var box = document.createElement('section');
  box.className = 'call-log';
  box.setAttribute('aria-labelledby', 'callLogTitle');
  box.innerHTML =
    '<h4 class="call-log-title" id="callLogTitle">Call notes <span class="call-log-optional">Optional</span></h4>' +
    '<p class="call-log-hint">Tap a poison control number above and the time is noted here. After the call, jot down the case number and what they said, so you can tell your vet.</p>' +
    '<ul class="call-log-calls" id="callLogCalls" aria-live="polite"></ul>' +
    '<label class="call-log-label" for="callCase">Case number</label>' +
    '<input type="text" id="callCase" class="call-log-input" maxlength="40" autocomplete="off" autocapitalize="characters" placeholder="From the poison control call" />' +
    '<label class="call-log-label" for="callNotes">What they told you</label>' +
    '<textarea id="callNotes" class="call-log-input" rows="3" maxlength="600" placeholder="Example: watch for vomiting, go to the ER if shaking starts"></textarea>' +
    '<div class="call-log-foot"><button type="button" class="call-log-clear" id="callLogClear">Clear notes</button>' +
    '<span class="call-log-privacy">Saved only on this device for 48 hours. Nothing is sent anywhere. Copy result and Share with my vet include these notes.</span></div>';
  var share = banner.querySelector('.share-result');
  var anchor = share || actions;
  anchor.parentNode.insertBefore(box, anchor.nextSibling);

  var list = box.querySelector('#callLogCalls');
  var caseInput = box.querySelector('#callCase');
  var notesInput = box.querySelector('#callNotes');

  function render() {
    list.innerHTML = '';
    state.calls.forEach(function (c) {
      var li = document.createElement('li');
      li.textContent = 'Called ' + c.n + ' at ' + clock(c.t);
      list.appendChild(li);
    });
    list.hidden = !state.calls.length;
    if (document.activeElement !== caseInput) { caseInput.value = state.caseNo; }
    if (document.activeElement !== notesInput) { notesInput.value = state.notes; }
  }

  var used = false;
  function used1() { if (!used) { used = true; track(); } }
  caseInput.addEventListener('input', function () { state.caseNo = caseInput.value.slice(0, 40); save(); used1(); });
  notesInput.addEventListener('input', function () { state.notes = notesInput.value.slice(0, 600); save(); used1(); });
  box.querySelector('#callLogClear').addEventListener('click', function () {
    state = { calls: [], caseNo: '', notes: '', saved: now() };
    save();
    render();
  });

  // Note the time when a poison control number is tapped (result buttons, top bar, sticky bar, footer).
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href^="tel:"]') : null;
    if (!a) { return; }
    var num = (a.getAttribute('href') || '').replace(/[^0-9]/g, '');
    var name = LINES[num];
    if (!name) { return; }
    var last = state.calls[state.calls.length - 1];
    if (last && last.n === name && now() - last.t < 60000) { return; }
    state.calls.push({ n: name, t: now() });
    if (state.calls.length > 10) { state.calls.shift(); }
    save();
    render();
    used1();
  }, true);

  // Used by share-result.js so the copied or shared summary includes the notes.
  window.PetPoisonCalcCallLines = function () {
    var out = [];
    state.calls.forEach(function (c) { out.push('Called ' + c.n + ' at ' + clock(c.t)); });
    if (state.caseNo) { out.push('Poison control case number: ' + state.caseNo.replace(/\s+/g, ' ').trim()); }
    if (state.notes) { out.push('What poison control said: ' + state.notes.replace(/\s+/g, ' ').trim()); }
    return out;
  };

  render();
})();
