/**
 * SmartWill India — Theme Switcher Engine
 * Supports dual themes:
 *   - 'light': Dayos Brutalist Editorial Showroom (Warm Canvas, Flat Paper White, Mint & Voltage Yellow)
 *   - 'dark': Classic Editorial Luxury (Obsidian Navy, Warm Champagne Brass, Newsreader Serif)
 */

(function() {
  'use strict';

  var THEME_KEY = 'sw_theme';

  function getStoredTheme() {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch (e) {
      return null;
    }
  }

  function getPreferredTheme() {
    var stored = getStoredTheme();
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    // Default to 'light' to showcase the new brutalist design, but respect system if set to dark
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  function applyTheme(theme, save) {
    if (theme !== 'light' && theme !== 'dark') theme = 'light';
    document.documentElement.setAttribute('data-theme', theme);
    if (save) {
      try {
        localStorage.setItem(THEME_KEY, theme);
      } catch (e) {}
    }
    updateToggleButtons(theme);
    window.dispatchEvent(new CustomEvent('sw-theme-change', { detail: { theme: theme } }));
  }

  function updateToggleButtons(theme) {
    var buttons = document.querySelectorAll('.theme-toggle-btn');
    if (!buttons || buttons.length === 0) return;

    var nextTheme = theme === 'dark' ? 'light' : 'dark';
    var iconName = nextTheme === 'dark' ? 'moon' : 'sun';
    var labelText = nextTheme === 'dark' ? 'Dark' : 'Light';
    var ariaLabel = 'Switch to ' + labelText + ' Mode';

    buttons.forEach(function(btn) {
      btn.setAttribute('aria-label', ariaLabel);
      btn.setAttribute('title', ariaLabel);
      btn.innerHTML = '<span class="toggle-icon"><i data-lucide="' + iconName + '"></i></span><span class="toggle-text">' + labelText + '</span>';
    });

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  var lastToggleTime = 0;

  window.toggleTheme = function() {
    var now = Date.now();
    if (now - lastToggleTime < 150) return; // Debounce against accidental double-invocation
    lastToggleTime = now;
    var current = document.documentElement.getAttribute('data-theme') || getPreferredTheme();
    var next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next, true);
  };

  window.setTheme = function(theme) {
    applyTheme(theme, true);
  };

  window.getTheme = function() {
    return document.documentElement.getAttribute('data-theme') || getPreferredTheme();
  };

  // Global click delegation for any .theme-toggle-btn without inline onclick
  document.addEventListener('click', function(e) {
    var btn = e.target && e.target.closest && e.target.closest('.theme-toggle-btn');
    if (btn) {
      if (!btn.getAttribute('onclick')) {
        e.preventDefault();
        window.toggleTheme();
      }
    }
  });

  // Listen for storage events across other tabs
  window.addEventListener('storage', function(e) {
    if (e.key === THEME_KEY && (e.newValue === 'light' || e.newValue === 'dark')) {
      applyTheme(e.newValue, false);
    }
  });

  // Universal Navbar Scroll Guardian
  function handleNavbarScroll() {
    var nav = document.querySelector('.navbar');
    if (!nav) return;
    if (window.scrollY > 20) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }
  window.addEventListener('scroll', handleNavbarScroll, { passive: true });
  handleNavbarScroll();

  // Initialize button state as soon as DOM is interactive
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      var current = document.documentElement.getAttribute('data-theme') || getPreferredTheme();
      updateToggleButtons(current);
      handleNavbarScroll();
    });
  } else {
    var current = document.documentElement.getAttribute('data-theme') || getPreferredTheme();
    updateToggleButtons(current);
    handleNavbarScroll();
  }
})();

