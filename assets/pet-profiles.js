(function () {
  'use strict';
  /* My pets: saves a pet's name, species, and weight in this browser (localStorage) so
     calculators can fill in the weight in one tap. Nothing is sent to PetPoisonCalc or
     anyone else. Only runs when the visitor chooses to save a pet. */
  var weight = document.getElementById('weightInput');
  var lbs = document.getElementById('unitLbs');
  var kg = document.getElementById('unitKg');
  if (!weight || !lbs || !kg) { return; }
  var group = weight.closest('.field-group');
  if (!group) { return; }

  var KEY = 'ppc-pets-v1';
  var MAX = 8;
  var spDog = document.getElementById('spDog');
  var spCat = document.getElementById('spCat');
  var pageSpecies = (spDog && spCat) ? 'both' : 'dog';

  function load() {
    try {
      var list = JSON.parse(window.localStorage.getItem(KEY) || '[]');
      return Array.isArray(list) ? list.filter(function (p) { return p && p.name && p.weight > 0; }) : [];
    } catch (e) { return []; }
  }
  function save(list) {
    try { window.localStorage.setItem(KEY, JSON.stringify(list)); return true; } catch (e) { return false; }
  }
  function storageOk() {
    try { window.localStorage.setItem(KEY + '-test', '1'); window.localStorage.removeItem(KEY + '-test'); return true; } catch (e) { return false; }
  }
  if (!storageOk()) { return; }

  function currentUnit() { return kg.getAttribute('aria-pressed') === 'true' ? 'kg' : 'lbs'; }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) { e.className = cls; } if (text != null) { e.textContent = text; } return e; }

  var box = el('div', 'pet-profiles');
  box.setAttribute('role', 'group');
  box.setAttribute('aria-label', 'My saved pets');
  var head = el('div', 'pet-profiles-head');
  head.appendChild(el('span', 'field-label pet-profiles-title', 'My pets'));
  var addBtn = el('button', 'pet-link-btn', 'Save a pet');
  addBtn.type = 'button';
  addBtn.setAttribute('aria-expanded', 'false');
  head.appendChild(addBtn);
  box.appendChild(head);
  var chips = el('div', 'pet-chips');
  box.appendChild(chips);

  var form = el('div', 'pet-save-form');
  form.hidden = true;
  form.innerHTML =
    '<div class="pet-save-row">' +
      '<label class="pet-save-field"><span>Pet name</span><input type="text" id="petNameInput" maxlength="24" autocomplete="off" placeholder="e.g. Biscuit" /></label>' +
      '<label class="pet-save-field"><span>Species</span><select id="petSpeciesInput"><option value="dog">Dog</option><option value="cat">Cat</option></select></label>' +
      '<button type="button" class="pet-save-btn" id="petSaveBtn">Save</button>' +
    '</div>';
  box.appendChild(form);
  var status = el('p', 'field-hint pet-status');
  status.setAttribute('aria-live', 'polite');
  box.appendChild(status);
  box.appendChild(el('p', 'field-hint pet-privacy', 'Saved only in this browser on this device. Nothing is sent to PetPoisonCalc or anyone else. Always double-check the weight before calculating.'));
  group.parentNode.insertBefore(box, group);

  var nameInput = form.querySelector('#petNameInput');
  var speciesInput = form.querySelector('#petSpeciesInput');
  if (pageSpecies === 'both' && spCat.getAttribute('aria-pressed') === 'true') { speciesInput.value = 'cat'; }

  function fmt(p) { return p.weight + ' ' + p.unit; }

  function apply(p, auto) {
    chips.querySelectorAll('.pet-chip').forEach(function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-name') === p.name ? 'true' : 'false'); });
    if (pageSpecies === 'dog' && p.species === 'cat') {
      // Do not fill a cat's weight into a dog-only calculator.
      status.innerHTML = '';
      status.appendChild(document.createTextNode(p.name + ' is saved as a cat, but this calculator is for dogs only. Cats can react very differently. Call ASPCA Animal Poison Control at '));
      var a = el('a', null, '(888) 426-4435'); a.href = 'tel:8884264435';
      status.appendChild(a);
      status.appendChild(document.createTextNode(' or Pet Poison Helpline at '));
      var a2 = el('a', null, '(855) 764-7661'); a2.href = 'tel:8557647661';
      status.appendChild(a2);
      status.appendChild(document.createTextNode(' now.'));
      status.classList.add('pet-warn');
      return;
    }
    (p.unit === 'kg' ? kg : lbs).click();
    weight.value = p.weight;
    weight.dispatchEvent(new Event('input', { bubbles: true }));
    if (pageSpecies === 'both') { (p.species === 'cat' ? spCat : spDog).click(); }
    status.classList.remove('pet-warn');
    status.textContent = (auto ? 'Filled in from ' : 'Using ') + p.name + "'s saved weight (" + fmt(p) + '). Update it if it has changed.';
  }

  function render() {
    var list = load();
    chips.innerHTML = '';
    if (!list.length) {
      chips.appendChild(el('p', 'field-hint pet-empty', 'Save your pet once and every calculator can fill in the weight with one tap.'));
      return;
    }
    list.forEach(function (p) {
      var wrap = el('span', 'pet-chip-wrap');
      var b = el('button', 'pet-chip');
      b.type = 'button';
      b.setAttribute('data-name', p.name);
      b.setAttribute('aria-pressed', 'false');
      b.appendChild(el('strong', null, p.name));
      b.appendChild(el('span', null, (p.species === 'cat' ? 'Cat' : 'Dog') + ', ' + fmt(p)));
      b.addEventListener('click', function () { apply(p, false); });
      var x = el('button', 'pet-chip-remove', '\u00d7');
      x.type = 'button';
      x.setAttribute('aria-label', 'Remove ' + p.name);
      x.addEventListener('click', function () {
        save(load().filter(function (o) { return o.name !== p.name; }));
        status.classList.remove('pet-warn');
        status.textContent = p.name + ' removed from this device.';
        render();
      });
      wrap.appendChild(b);
      wrap.appendChild(x);
      chips.appendChild(wrap);
    });
  }

  addBtn.addEventListener('click', function () {
    form.hidden = !form.hidden;
    addBtn.setAttribute('aria-expanded', form.hidden ? 'false' : 'true');
    if (!form.hidden) {
      status.classList.remove('pet-warn');
      status.textContent = 'Enter the weight below first, then name your pet and tap Save.';
      nameInput.focus();
    }
  });

  form.querySelector('#petSaveBtn').addEventListener('click', function () {
    var name = nameInput.value.replace(/\s+/g, ' ').trim().slice(0, 24);
    var w = parseFloat(weight.value);
    status.classList.remove('pet-warn');
    if (!(w > 0)) { status.textContent = 'Enter your pet\u2019s weight in the weight box first, then tap Save.'; weight.focus(); return; }
    if (!name) { status.textContent = 'Enter a name for your pet.'; nameInput.focus(); return; }
    var list = load().filter(function (o) { return o.name.toLowerCase() !== name.toLowerCase(); });
    if (list.length >= MAX) { status.textContent = 'You can save up to ' + MAX + ' pets. Remove one first.'; return; }
    var pet = { name: name, species: speciesInput.value === 'cat' ? 'cat' : 'dog', weight: Math.round(w * 10) / 10, unit: currentUnit(), saved: new Date().toISOString().slice(0, 10) };
    list.push(pet);
    if (!save(list)) { status.textContent = 'Could not save. Your browser may be blocking storage.'; return; }
    nameInput.value = '';
    form.hidden = true;
    addBtn.setAttribute('aria-expanded', 'false');
    render();
    status.textContent = name + ' saved on this device (' + fmt(pet) + '). Next time, tap ' + name + ' to fill in the weight.';
  });
  nameInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); form.querySelector('#petSaveBtn').click(); } });

  render();
  // One saved pet that fits this calculator: fill it in automatically if the box is empty.
  var pets = load();
  if (pets.length === 1 && !weight.value && (pageSpecies === 'both' || pets[0].species === 'dog')) { apply(pets[0], true); }
})();
