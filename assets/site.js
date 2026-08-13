/* ==========================================================================
   FITLYTIX — shared site behaviour
   Small progressive enhancements that apply to every page: mobile navigation,
   the footer year, and marking the current page in the nav.
   ========================================================================== */

(function () {
  'use strict';

  function initMobileNav() {
    var toggle = document.querySelector('.nav-toggle');
    var links = document.querySelector('.nav-links');
    if (!toggle || !links) return;

    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });

    // Tapping a link navigates, but same-page anchors do not, so close manually.
    links.addEventListener('click', function (event) {
      if (event.target.closest('a')) {
        links.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && links.classList.contains('is-open')) {
        links.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  function initFooterYear() {
    var year = String(new Date().getFullYear());
    document.querySelectorAll('[data-year]').forEach(function (el) {
      el.textContent = year;
    });
  }

  // Flags the nav link matching the current path so it can be styled.
  function initCurrentNavLink() {
    var path = window.location.pathname.replace(/index\.html$/, '');
    if (path.length > 1) path = path.replace(/\/$/, '');

    document.querySelectorAll('.nav-link[href]').forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href || href.charAt(0) === '#') return;

      var linkPath = new URL(href, window.location.origin).pathname.replace(/index\.html$/, '');
      if (linkPath.length > 1) linkPath = linkPath.replace(/\/$/, '');

      if (linkPath === path) link.setAttribute('aria-current', 'page');
    });
  }

  function init() {
    initMobileNav();
    initFooterYear();
    initCurrentNavLink();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
