(function () {
  'use strict';
  /* Adds "Copy result" and "Share with my vet" to a calculator result.
     The summary is built in the browser from what is on screen. Nothing is sent
     to PetPoisonCalc or anywhere else; sharing only happens if you choose an app. */
  var form = document.getElementById('calcForm');
  var banner = document.getElementById('resultBanner');
  var actions = document.getElementById('actionBlock');
  if (!form || !banner || !actions) { return; }

  function clean(t) { return (t || '').replace(/\s*[\u2014\u2013]\s*/g, ': ').replace(/\s+/g, ' ').trim(); }
  function visible(el) { return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length); }

  function buildSummary() {
    var lines = [];
    var h1 = document.querySelector('h1');
    lines.push('PetPoisonCalc result: ' + clean(h1 ? (h1.getAttribute('data-calc-name') || h1.textContent) : document.title));
    lines.push('Calculated: ' + new Date().toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }));
    lines.push('');
    lines.push('What I entered:');
    form.querySelectorAll('.field-group').forEach(function (group) {
      if (!visible(group)) { return; }
      var labelEl = group.querySelector('.field-label');
      var label = clean(labelEl ? labelEl.textContent : '');
      var values = [];
      group.querySelectorAll('.seg-btn[aria-pressed="true"]').forEach(function (b) {
        var s = b.querySelector('strong');
        values.push(clean(s ? s.textContent : b.textContent));
      });
      group.querySelectorAll('input[type="number"]').forEach(function (inp) {
        if (!inp.value || inp.disabled || !visible(inp)) { return; }
        var suffix = inp.parentNode.querySelector('.unit-suffix');
        values.push(inp.value + (suffix ? ' ' + clean(suffix.textContent) : ''));
      });
      group.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
        if (cb.checked) { values.push(clean(cb.parentNode.textContent)); }
      });
      if (values.length) { lines.push('- ' + (label ? label + ': ' : '') + values.join(', ')); }
    });
    // Custom-strength inputs that sit outside a field group
    form.querySelectorAll('[id^="customMgWrap"]').forEach(function (w) {
      var inp = w.querySelector('input');
      if (!w.closest('.field-group') && visible(w) && inp && inp.value) { lines.push('- Custom strength: ' + inp.value + ' mg per tablet'); }
    });
    lines.push('');
    var tier = document.getElementById('tierLabelText');
    var headline = document.getElementById('resultHeadline');
    lines.push('Result: ' + clean(tier ? tier.textContent : ''));
    if (headline) { lines.push(clean(headline.textContent)); }
    banner.querySelectorAll('.dose-stat').forEach(function (st) {
      var n = st.querySelector('.num'), l = st.querySelector('.lbl');
      if (n && l) { lines.push('- ' + clean(l.textContent) + ': ' + clean(n.textContent)); }
    });
    lines.push('');
    lines.push('Page: ' + location.href.split('#')[0].split('?')[0]);
    lines.push('This is an estimate from published veterinary data, not a diagnosis.');
    lines.push('ASPCA Animal Poison Control: (888) 426-4435. Pet Poison Helpline: (855) 764-7661.');
    return lines.join('\n');
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy') ? resolve() : reject(new Error('copy failed')); } catch (e) { reject(e); }
      document.body.removeChild(ta);
    });
  }

  var wrap = document.createElement('div');
  wrap.className = 'share-result';
  wrap.innerHTML =
    '<button type="button" class="share-btn" id="copyResultBtn">Copy result</button>' +
    '<button type="button" class="share-btn" id="shareResultBtn">Share with my vet</button>' +
    '<p class="share-note" id="shareStatus" aria-live="polite">Creates a text summary on your device. Nothing is sent from this site.</p>';
  actions.parentNode.insertBefore(wrap, actions.nextSibling);
  var status = wrap.querySelector('#shareStatus');

  wrap.querySelector('#copyResultBtn').addEventListener('click', function () {
    copyText(buildSummary()).then(function () {
      status.textContent = 'Copied. Paste it into a text or email to your vet.';
    }, function () {
      status.textContent = 'Could not copy automatically. Select and copy the result text above.';
    });
  });

  wrap.querySelector('#shareResultBtn').addEventListener('click', function () {
    var text = buildSummary();
    if (navigator.share) {
      navigator.share({ title: 'PetPoisonCalc result', text: text }).catch(function () {});
    } else {
      copyText(text).then(function () {
        status.textContent = 'Copied. Your browser cannot share directly, so paste it into a text or email to your vet.';
      }, function () {
        status.textContent = 'Could not copy automatically. Select and copy the result text above.';
      });
    }
  });

  window.PetPoisonCalcSummary = buildSummary;
})();
