(function () {
  'use strict';

  /* Shared site shell: theme toggle. Safe on every page. */
  var root = document.documentElement;
  var themeToggle = document.getElementById('themeToggle');
  var currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  root.setAttribute('data-theme', currentTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', currentTheme);
    });
  }
})();
