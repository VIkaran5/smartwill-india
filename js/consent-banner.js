/**
 * Global DPDP Act 2023 & Analytics Consent Banner for SmartWill India
 * Injected on all pages to ensure lawful, transparent consent prior to analytics execution.
 */
(function () {
  const CONSENT_KEY = 'sw_analytics_consent';
  const GA_ID = 'G-HGQ9XHMEWH';
  const ALT_GA_ID = 'G-1QEJP9NTE1';
  const DEV_EXCLUDE_KEY = 'sw_exclude_analytics';

  // Founder/Developer Exclusion Switch: ?dev=exclude_me or ?dev=include_me
  try {
    if (typeof window !== 'undefined' && window.location && window.location.search) {
      const params = new URLSearchParams(window.location.search);
      function renderNotification(title, text, color) {
        const div = document.createElement('div');
        div.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:9999999;background:#0f172a;border:2px solid ' + color + ';border-radius:12px;padding:18px 24px;color:#f8fafc;box-shadow:0 12px 35px rgba(0,0,0,0.85);max-width:92%;width:420px;text-align:center;font-family:-apple-system,BlinkMacSystemFont,sans-serif;animation:swBannerSlideUp 0.3s ease;';
        div.innerHTML = '<div style="font-size:1.15rem;font-weight:700;color:' + color + ';margin-bottom:8px;">' + title + '</div><div style="font-size:0.9rem;color:#cbd5e1;margin-bottom:14px;line-height:1.4;">' + text + '</div><button onclick="this.parentElement.remove()" style="background:' + color + ';color:#042f2e;border:none;padding:8px 20px;border-radius:8px;font-weight:700;cursor:pointer;font-size:0.92rem;">✓ OK, Got it!</button>';
        const attach = () => { if (document.body && !document.getElementById('swFounderNotice')) { div.id = 'swFounderNotice'; document.body.appendChild(div); } };
        if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', attach); } else { attach(); }
      }

      if (params.get('dev') === 'exclude_me' || params.get('dev') === 'disable_analytics') {
        localStorage.setItem(DEV_EXCLUDE_KEY, 'true');
        console.log('🛡️ [SmartWill] Founder device detected: Google Analytics disabled for this browser.');
        renderNotification('🛡️ SmartWill Founder Mode Active', 'Google Analytics has been <strong>DISABLED</strong> on this device.<br>Your visits, clicks, and test orders will NO LONGER be tracked.', '#10b981');
      } else if (params.get('dev') === 'include_me' || params.get('dev') === 'enable_analytics') {
        localStorage.removeItem(DEV_EXCLUDE_KEY);
        console.log('🛡️ [SmartWill] Developer mode cleared: Google Analytics re-enabled.');
        renderNotification('📊 Google Analytics Re-enabled', 'Analytics tracking has been <strong>RE-ENABLED</strong> for this device.', '#38bdf8');
      }
    }
  } catch (e) {}

  function isDevExcluded() {
    try {
      return localStorage.getItem(DEV_EXCLUDE_KEY) === 'true';
    } catch (e) {
      return false;
    }
  }

  function loadGA() {
    if (isDevExcluded()) {
      window.gtag = function() {}; // Safe stub to prevent any reference errors
      return;
    }
    if (window._gaLoaded) return;
    window._gaLoaded = true;
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_ID);
    if (ALT_GA_ID && ALT_GA_ID !== GA_ID) {
      gtag('config', ALT_GA_ID);
    }
  }
  window.loadGA = loadGA;

  function initConsent() {
    if (isDevExcluded()) {
      window.gtag = function() {};
      return;
    }
    const isApp = window.location.pathname.includes('app.html') || window.location.pathname === '/app';
    const currentConsent = localStorage.getItem(CONSENT_KEY);

    // On app wizard, load GA to capture checkout funnel conversions
    if (isApp || currentConsent === 'accepted') {
      loadGA();
      return;
    }

    if (currentConsent === 'declined') {
      // User opted out; do not load GA
      return;
    }

    // No preference recorded yet — render modern floating banner
    renderBanner();
  }

  function renderBanner() {
    if (document.getElementById('swConsentBanner')) return;

    const banner = document.createElement('div');
    banner.id = 'swConsentBanner';
    banner.innerHTML = `
      <div class="sw-banner-inner">
        <div class="sw-banner-text">
          <span class="sw-banner-icon">🛡️</span>
          <div>
            <strong>Your Privacy & Consent (DPDP Act 2023):</strong>
            We use secure local storage to keep your Will draft encrypted on your device. We use optional analytics to improve our service. By clicking "Accept All", you consent to non-essential analytics tracking. You can review your rights in our <a href="/privacy" class="sw-banner-link">Privacy Policy</a> and <a href="/terms" class="sw-banner-link">Terms</a>.
          </div>
        </div>
        <div class="sw-banner-actions">
          <button id="swBtnAcceptConsent" class="sw-banner-btn sw-banner-btn-primary">Accept All</button>
          <button id="swBtnDeclineConsent" class="sw-banner-btn sw-banner-btn-secondary">Decline Optional</button>
        </div>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      #swConsentBanner {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        width: calc(100% - 32px);
        max-width: 960px;
        z-index: 99999;
        background: rgba(10, 14, 39, 0.96);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(245, 158, 11, 0.35);
        border-radius: 14px;
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.65), 0 0 24px rgba(245, 158, 11, 0.12);
        padding: 1rem 1.25rem;
        animation: swBannerSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        transition: bottom 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }
      body.sticky-bar-active #swConsentBanner {
        bottom: 78px;
      }
      @keyframes swBannerSlideUp {
        from { opacity: 0; transform: translate(-50%, 20px); }
        to { opacity: 1; transform: translate(-50%, 0); }
      }
      .sw-banner-inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1.25rem;
        flex-wrap: wrap;
      }
      .sw-banner-text {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        font-size: 0.85rem;
        line-height: 1.5;
        color: rgba(248, 250, 252, 0.9);
        flex: 1;
        min-width: 280px;
      }
      .sw-banner-icon {
        font-size: 1.3rem;
        line-height: 1;
        flex-shrink: 0;
        margin-top: 2px;
      }
      .sw-banner-link {
        color: #f59e0b;
        text-decoration: underline;
        font-weight: 600;
      }
      .sw-banner-link:hover {
        color: #fcd34d;
      }
      .sw-banner-actions {
        display: flex;
        gap: 0.5rem;
        flex-shrink: 0;
      }
      .sw-banner-btn {
        padding: 8px 16px;
        font-size: 0.825rem;
        font-weight: 600;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
      }
      .sw-banner-btn-primary {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: #0a0e27;
        border: none;
        box-shadow: 0 4px 14px rgba(245, 158, 11, 0.3);
      }
      .sw-banner-btn-primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(245, 158, 11, 0.45);
      }
      .sw-banner-btn-secondary {
        background: transparent;
        color: rgba(248, 250, 252, 0.75);
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
      .sw-banner-btn-secondary:hover {
        background: rgba(255, 255, 255, 0.06);
        color: #fff;
        border-color: rgba(255, 255, 255, 0.4);
      }
      @media (max-width: 640px) {
        .sw-banner-inner { flex-direction: column; align-items: stretch; }
        .sw-banner-actions { justify-content: flex-end; }
        .sw-banner-btn { flex: 1; text-align: center; }
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(banner);

    document.getElementById('swBtnAcceptConsent').addEventListener('click', function () {
      localStorage.setItem(CONSENT_KEY, 'accepted');
      banner.remove();
      loadGA();
    });

    document.getElementById('swBtnDeclineConsent').addEventListener('click', function () {
      localStorage.setItem(CONSENT_KEY, 'declined');
      banner.remove();
    });
  }

  // Expose globally so users can trigger or review cookie preferences at any time
  window.openCookieConsent = function (force = true) {
    if (force) {
      const existing = document.getElementById('swConsentBanner');
      if (existing) {
        existing.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      renderBanner();
      return;
    }
    initConsent();
  };

  window.resetCookieConsent = function () {
    localStorage.removeItem(CONSENT_KEY);
    window.openCookieConsent(true);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initConsent);
  } else {
    initConsent();
  }
})();
