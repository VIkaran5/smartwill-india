/**
 * SmartWill India — Micro-interactions & Scroll Animations
 * MOTION_INTENSITY: 4  (trust-first, subtle — not cinematic)
 *
 * Zero dependencies — Intersection Observer + rAF + CSS transitions.
 * Easing: cubic-bezier(0.16, 1, 0.3, 1) approximates a spring (no overshoot).
 * Fully bails out when prefers-reduced-motion is set.
 */
(function () {
  'use strict';

  // Respect prefers-reduced-motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const SPRING = 'cubic-bezier(0.16, 1, 0.3, 1)';
  const BOUNCE = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  // 1. HERO ENTRANCE — staggered children on page load
  function initHeroEntrance() {
    const heroContent = document.querySelector('.hero-content');
    const heroVisual  = document.querySelector('.hero-visual');
    if (!heroContent) return;

    const children = Array.from(heroContent.children);
    children.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(22px)';
      el.style.transition = 'opacity 0.7s ' + SPRING + ', transform 0.7s ' + SPRING;
    });
    if (heroVisual) {
      heroVisual.style.opacity = '0';
      heroVisual.style.transition = 'opacity 0.9s ' + SPRING;
    }

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        children.forEach(function (el, i) {
          setTimeout(function () {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
          }, i * 90);
        });
        if (heroVisual) {
          setTimeout(function () { heroVisual.style.opacity = '1'; }, 180);
        }
      });
    });
  }

  // 2. SCROLL REVEAL — fade-up with stagger per group
  function initScrollReveal() {
    var GROUPS = [
      '.hero-stats-grid .stat-card',
      '.problem-stack .problem-card',
      '.hiw-flow .step-card',
      '.features-grid .glass-card',
      '.faq-accordion .faq-item',
    ];
    var SINGLES = [
      '.section-header',
      '.problem-featured',
      '.table-container',
      '.pricing-card',
    ];

    function hide(el, delayMs) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(28px)';
      el.style.transition = 'opacity 0.65s ' + delayMs + 'ms ' + SPRING + ', transform 0.65s ' + delayMs + 'ms ' + SPRING;
    }
    function show(el) {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          show(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

    GROUPS.forEach(function (selector) {
      document.querySelectorAll(selector).forEach(function (el, i) {
        hide(el, i * 100);
        observer.observe(el);
      });
    });
    SINGLES.forEach(function (selector) {
      document.querySelectorAll(selector).forEach(function (el) {
        hide(el, 0);
        observer.observe(el);
      });
    });

    // HIW connectors — spring scale-pop
    document.querySelectorAll('.hiw-connector').forEach(function (el, i) {
      el.style.opacity = '0';
      el.style.transform = 'scale(0.4)';
      el.style.transition = 'opacity 0.4s ' + (180 + i * 180) + 'ms ease, transform 0.45s ' + (180 + i * 180) + 'ms ' + BOUNCE;
      observer.observe(el);
    });
  }

  // 3. STAT COUNT-UP (70% and 10 Mins)
  function initStatCountUp() {
    function countUp(el, target, format, duration) {
      var start = performance.now();
      (function tick(now) {
        var p = Math.min((now - start) / duration, 1);
        el.textContent = format(Math.round(easeOutCubic(p) * target));
        if (p < 1) requestAnimationFrame(tick);
      })(start);
    }

    var statObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var key = el.dataset.i18n;
        if (key === 'hero.stat2') countUp(el, 70, function (v) { return v + '%'; }, 1400);
        if (key === 'hero.stat3') countUp(el, 10, function (v) { return v + ' Mins'; }, 1200);
        statObserver.unobserve(el);
      });
    }, { threshold: 0.8 });

    document.querySelectorAll('[data-i18n="hero.stat2"], [data-i18n="hero.stat3"]')
      .forEach(function (el) { statObserver.observe(el); });
  }

  // 4. CARD HOVER LIFT — gold glow on mouseenter
  function initCardHover() {
    document.querySelectorAll('.glass-card').forEach(function (card) {
      card.addEventListener('mouseenter', function () {
        card.style.transform = 'translateY(-4px)';
        card.style.borderColor = 'rgba(245, 158, 11, 0.28)';
        card.style.boxShadow = '0 20px 48px rgba(0,0,0,0.45), 0 0 24px rgba(245,158,11,0.07)';
        card.style.transition = 'transform 0.3s ' + SPRING + ', border-color 0.3s ease, box-shadow 0.3s ease';
      });
      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
        card.style.borderColor = '';
        card.style.boxShadow = '';
      });
    });
  }

  // 5. CTA TACTILE PRESS — spring snap-back
  function initCTAPress() {
    document.querySelectorAll('.btn-gold, .btn-primary').forEach(function (btn) {
      btn.addEventListener('mousedown', function () {
        btn.style.transition = 'transform 0.1s ease';
        btn.style.transform = 'scale(0.97) translateY(1px)';
      });
      ['mouseup', 'mouseleave'].forEach(function (evt) {
        btn.addEventListener(evt, function () {
          btn.style.transition = 'transform 0.35s ' + BOUNCE;
          btn.style.transform = '';
        });
      });
    });
  }

  // Init
  function init() {
    initHeroEntrance();
    initScrollReveal();
    initStatCountUp();
    initCardHover();
    initCTAPress();
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();

})();
