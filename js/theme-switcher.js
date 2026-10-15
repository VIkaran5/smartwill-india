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

    var changed = false;
    buttons.forEach(function(btn) {
      var textEl = btn.querySelector('.toggle-text');
      // If label text already matches, avoid dirtying the DOM needlessly
      if (textEl && textEl.textContent.trim() === labelText) {
        return;
      }
      btn.setAttribute('aria-label', ariaLabel);
      btn.setAttribute('title', ariaLabel);
      btn.innerHTML = '<span class="toggle-icon"><i data-lucide="' + iconName + '"></i></span><span class="toggle-text">' + labelText + '</span>';
      changed = true;
    });

    if (changed && window.lucide && typeof window.lucide.createIcons === 'function') {
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

  // Universal Navbar Scroll Guardian (rAF debounced, zero forced reflow on initial load)
  var navTicking = false;
  function handleNavbarScroll() {
    if (navTicking) return;
    navTicking = true;
    window.requestAnimationFrame(function() {
      var nav = document.querySelector('.navbar');
      if (nav) {
        if (window.scrollY > 20) {
          nav.classList.add('scrolled');
        } else {
          nav.classList.remove('scrolled');
        }
      }
      navTicking = false;
    });
  }
  window.addEventListener('scroll', handleNavbarScroll, { passive: true });

  // Universal Mobile Sticky Conversion Bar Scroll Reveal
  function initMobileStickyBar() {
    var bar = document.getElementById('mobileStickyBar');
    if (!bar || bar.dataset.stickyBound === 'true') return;
    bar.dataset.stickyBound = 'true';
    var ticking = false;
    window.addEventListener('scroll', function() {
      if (!ticking) {
        window.requestAnimationFrame(function() {
          if (window.scrollY > 380) {
            bar.classList.add('visible');
            document.body.classList.add('sticky-bar-active');
          } else {
            bar.classList.remove('visible');
            document.body.classList.remove('sticky-bar-active');
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  // Universal Mobile Hamburger Menu Guardian
  function initMobileMenu() {
    var hamburger = document.getElementById('navHamburger');
    var mobileMenu = document.getElementById('navMobileMenu') || document.querySelector('.nav-mobile-menu') || document.querySelector('.mobile-menu');
    if (!hamburger || !mobileMenu) return;
    if (hamburger.dataset.menuBound === 'true') return;
    hamburger.dataset.menuBound = 'true';

    hamburger.addEventListener('click', function(e) {
      e.stopPropagation();
      mobileMenu.classList.toggle('open');
      mobileMenu.classList.toggle('active');
      hamburger.classList.toggle('active');
    });

    mobileMenu.querySelectorAll('a').forEach(function(el) {
      el.addEventListener('click', function() {
        mobileMenu.classList.remove('open');
        mobileMenu.classList.remove('active');
        hamburger.classList.remove('active');
      });
    });

    document.addEventListener('click', function(e) {
      if ((mobileMenu.classList.contains('open') || mobileMenu.classList.contains('active')) &&
          !mobileMenu.contains(e.target) && !hamburger.contains(e.target)) {
        mobileMenu.classList.remove('open');
        mobileMenu.classList.remove('active');
        hamburger.classList.remove('active');
      }
    });
  }

  // Initialize button state and features during idle time to eliminate forced reflow during paint
  function initThemeUI() {
    var current = document.documentElement.getAttribute('data-theme') || getPreferredTheme();
    updateToggleButtons(current);
    initMobileStickyBar();
    initMobileMenu();
  }

  function scheduleThemeInit() {
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(initThemeUI, { timeout: 2500 });
    } else {
      setTimeout(initThemeUI, 300);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleThemeInit);
  } else {
    scheduleThemeInit();
  }
})();

