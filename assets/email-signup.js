(function () {
  'use strict';
  /* Email signup (prepared, OFF until a provider form is connected).

     HOW TO TURN IT ON (one line):
       1. In Kit (kit.com, free plan), create a Form, open Embed > HTML, and copy the
          action URL. It looks like https://app.kit.com/forms/1234567/subscriptions
       2. Paste it between the quotes of FORM_ACTION below, commit, and push.
     While FORM_ACTION is empty, nothing is shown and nothing is sent anywhere.

     When it is on: the email address goes straight from the visitor's browser to Kit
     (a normal form post, opened in a new tab so the visitor keeps this page). PetPoisonCalc
     does not store it. Google Analytics gets one anonymous "email_signup_submit" event with
     only the page placement, never the address. Only https Kit form URLs are accepted. */
  var FORM_ACTION = '';
  var FIELD_NAME = 'email_address';

  var slots = document.querySelectorAll('[data-email-signup]');
  if (!slots.length) { return; }
  if (!/^https:\/\/app\.(kit|convertkit)\.com\/forms\/\d+\/subscriptions$/.test(FORM_ACTION)) { return; }

  var privacyHref = (location.pathname.indexOf('/guides/') !== -1 || location.pathname.indexOf('/pages/') !== -1 || location.pathname.indexOf('/calculators/') !== -1) ? '../pages/privacy.html' : './pages/privacy.html';

  function track(where) {
    try { if (typeof window.gtag === 'function') { window.gtag('event', 'email_signup_submit', { placement: where }); } } catch (e) { /* ignore */ }
  }

  slots.forEach(function (slot, i) {
    // Never on calculator pages: those stay focused on the emergency.
    if (location.pathname.indexOf('/calculators/') !== -1) { return; }
    var where = slot.getAttribute('data-email-signup') || 'page';
    var id = 'emailSignup' + i;
    slot.className = 'email-signup';
    slot.innerHTML =
      '<div class="email-signup-text">' +
        '<h2 class="email-signup-title" id="' + id + 'Title">Get seasonal pet poison alerts</h2>' +
        '<p>A short email before the risky seasons (holidays, winter antifreeze, spring lilies, summer cookouts) plus the printable poison-proofing checklist. Free. Unsubscribe anytime.</p>' +
      '</div>' +
      '<form class="email-signup-form" method="post" target="_blank" rel="noopener" action="' + FORM_ACTION + '" aria-labelledby="' + id + 'Title">' +
        '<label class="email-signup-label" for="' + id + 'Email">Email address</label>' +
        '<div class="email-signup-row">' +
          '<input type="email" id="' + id + 'Email" name="' + FIELD_NAME + '" required autocomplete="email" inputmode="email" placeholder="you@example.com" />' +
          '<button type="submit" class="btn-primary email-signup-btn">Sign up</button>' +
        '</div>' +
        '<p class="email-signup-note">Sent to our email provider, Kit, which will ask you to confirm. Not a substitute for emergency care. See our <a href="' + privacyHref + '#email">privacy policy</a>.</p>' +
      '</form>';
    slot.hidden = false;
    slot.querySelector('form').addEventListener('submit', function () { track(where); });
  });
})();
