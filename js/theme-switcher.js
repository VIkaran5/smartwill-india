/**
 * SmartWill India — Theme Switcher Engine (Perf-Optimized v2)
 * Supports dual themes:
 *   - 'light': Dayos Brutalist Editorial Showroom (Warm Canvas, Flat Paper White, Mint & Voltage Yellow)
 *   - 'dark': Classic Editorial Luxury (Obsidian Navy, Warm Champagne Brass, Newsreader Serif)
 *
 * PERF: No forced reflow. All DOM reads are batched before writes.
 *       Scroll handlers are passive + rAF gated.
 *       Theme toggle buttons updated via requestIdleCallback only.
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
    // Defer toggle button update to idle time to avoid forced reflow during critical path
    scheduleButtonUpdate(theme);
    window.dispatchEvent(new CustomEvent('sw-theme-change', { detail: { theme: theme } }));
  }

  // ── PERF: Batch DOM reads before writes, use rIC to avoid forced reflow ──
  function scheduleButtonUpdate(theme) {
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(function() { updateToggleButtons(theme); }, { timeout: 1000 });
    } else {
      setTimeout(function() { updateToggleButtons(theme); }, 100);
    }
  }

  function updateToggleButtons(theme) {
    var buttons = document.querySelectorAll('.theme-toggle-btn');
    if (!buttons || buttons.length === 0) return;

    var nextTheme = theme === 'dark' ? 'light' : 'dark';
    var iconName = nextTheme === 'dark' ? 'moon' : 'sun';
    var labelText = nextTheme === 'dark' ? 'Dark' : 'Light';
    var ariaLabel = 'Switch to ' + labelText + ' Mode';
    var newHTML = '<span class="toggle-icon"><i data-lucide="' + iconName + '"></i></span><span class="toggle-text">' + labelText + '</span>';

    // PERF: Batch all reads first (textContent), then all writes (innerHTML)
    var toUpdate = [];
    buttons.forEach(function(btn) {
      var textEl = btn.querySelector('.toggle-text');
      if (!textEl || textEl.textContent.trim() !== labelText) {
        toUpdate.push(btn);
      }
    });

    if (toUpdate.length === 0) return;

    // Now batch all writes in one rAF to avoid multiple forced reflows
    requestAnimationFrame(function() {
      toUpdate.forEach(function(btn) {
        btn.setAttribute('aria-label', ariaLabel);
        btn.setAttribute('title', ariaLabel);
        btn.innerHTML = newHTML;
      });
      // PERF: Don't call lucide.createIcons() here — it causes forced reflow on all icons.
      // index.html already schedules createIcons() via requestIdleCallback after page load.
      // Only re-init the specific buttons we just updated, not the entire page.
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        toUpdate.forEach(function(btn) {
          window.lucide.createIcons({ nodes: btn.querySelectorAll('[data-lucide]') });
        });
      }
    });
  }

  var lastToggleTime = 0;

  window.toggleTheme = function() {
    var now = Date.now();
    if (now - lastToggleTime < 150) return;
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

  // ── PERF: Navbar scroll — passive + rAF gated, cache nav element ──
  var navTicking = false;
  var cachedNav = null;
  function handleNavbarScroll() {
    if (navTicking) return;
    navTicking = true;
    requestAnimationFrame(function() {
      // Cache nav element lookup — querySelector is slow if called every scroll
      if (!cachedNav) cachedNav = document.querySelector('.navbar');
      if (cachedNav) {
        // Read scrollY (single read) then write classList (no interleaving)
        var scrolled = window.scrollY > 20;
        if (scrolled) {
          cachedNav.classList.add('scrolled');
        } else {
          cachedNav.classList.remove('scrolled');
        }
      }
      navTicking = false;
    });
  }
  window.addEventListener('scroll', handleNavbarScroll, { passive: true });

  // ── PERF: Mobile Sticky Bar — passive + rAF gated, no offsetHeight read ──
  function initMobileStickyBar() {
    var bar = document.getElementById('mobileStickyBar');
    if (!bar || bar.dataset.stickyBound === 'true') return;
    bar.dataset.stickyBound = 'true';

    var ticking = false;
    // Read body class state in rAF — no layout thrashing
    function checkScroll() {
      var visible = window.scrollY > 300;
      // Batch write: classList changes don't trigger reflow if CSS uses transform
      if (visible) {
        bar.classList.add('visible');
        document.body.classList.add('sticky-bar-active');
      } else {
        bar.classList.remove('visible');
        document.body.classList.remove('sticky-bar-active');
      }
      ticking = false;
    }
    window.addEventListener('scroll', function() {
      if (!ticking) {
        requestAnimationFrame(checkScroll);
        ticking = true;
      }
    }, { passive: true });
    // Initial check deferred to avoid forced layout on load
    requestAnimationFrame(checkScroll);
  }

  // ── Universal Mobile Hamburger Menu Guardian ──
  function initMobileMenu() {
    var hamburger = document.getElementById('navHamburger');
    var mobileMenu = document.getElementById('navMobileMenu')
      || document.querySelector('.nav-mobile-menu')
      || document.querySelector('.mobile-menu');
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

  // ── PERF: Separate UI init from scroll init. Scroll init is synchronous
  //    (must be attached ASAP). Toggle button update is deferred to rIC. ──
  function initScrollFeatures() {
    initMobileStickyBar();
    initMobileMenu();
  }

  function initThemeUI() {
    var current = document.documentElement.getAttribute('data-theme') || getPreferredTheme();
    updateToggleButtons(current);
  }

  function scheduleThemeInit() {
    // Scroll features: immediate (attach listeners ASAP — zero layout cost)
    initScrollFeatures();
    // Toggle button text: defer to idle (involves DOM reads — potential reflow)
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(initThemeUI, { timeout: 2000 });
    } else {
      setTimeout(initThemeUI, 400);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleThemeInit);
  } else {
    scheduleThemeInit();
  }
})();
