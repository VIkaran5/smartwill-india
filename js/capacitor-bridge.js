/**
 * capacitor-bridge.js
 * SmartWill India — Capacitor Native Integration Layer
 *
 * Responsibilities:
 *   1. Detect whether running inside a Capacitor Android WebView or plain browser
 *   2. Wire up Android hardware Back Button → Wizard step navigation
 *   3. Bridge Capacitor Network events → existing cloudSync window events
 *   4. Configure StatusBar styling
 *   5. Route Cashfree payment through @capacitor/browser (Android-safe)
 *   6. Expose window.SmartWillNative API for use by other modules
 */

/* ─── Guard: only run if Capacitor is available ─────────────────────────── */
const IS_CAPACITOR = !!(window.Capacitor && window.Capacitor.isNativePlatform());
const IS_ANDROID   = IS_CAPACITOR && window.Capacitor.getPlatform() === 'android';

window.SmartWillNative = {
  isNative:   IS_CAPACITOR,
  isAndroid:  IS_ANDROID,
  plugins:    {},
};

if (!IS_CAPACITOR) {
  // Running in a normal browser — nothing to do.
  console.info('[CapBridge] Running in browser mode. Native bridge inactive.');
} else {
  console.info(`[CapBridge] Running on Capacitor (${window.Capacitor.getPlatform()}). Bridge active.`);
  initCapacitorBridge();
}

/* ─── Main initializer ──────────────────────────────────────────────────── */
async function initCapacitorBridge() {
  try {
    // ── CORRECT WAY to access Capacitor plugins in a non-bundled app ──────
    // Plugins are registered by the native runtime when capacitor.js loads.
    // DO NOT import from CDN — that fails silently in native WebView.
    const Plugins    = window.Capacitor.Plugins;
    const App        = Plugins.App;
    const Network    = Plugins.Network;
    const StatusBar  = Plugins.StatusBar;
    const Browser    = Plugins.Browser;
    const SplashScreen = Plugins.SplashScreen;
    const Filesystem = Plugins.Filesystem;
    const Share      = Plugins.Share;

    window.SmartWillNative.plugins = { App, Network, StatusBar, Browser, SplashScreen, Filesystem, Share };

    if (StatusBar) await setupStatusBar(StatusBar);
    if (Network)   await setupNetworkListener(Network);
    if (App)       setupBackButton(App);
    if (App)       setupDeepLinkHandler(App);
    if (Browser)   setupPaymentBridge(Browser);

    // Hide splash screen after a brief moment to let page render
    setTimeout(async () => {
      try { if (SplashScreen) await SplashScreen.hide(); } catch (_) {}
    }, 500);

    console.info('[CapBridge] All native integrations initialized.');
  } catch (err) {
    console.error('[CapBridge] Initialization failed:', err);
  }
}

/* ─── 1. StatusBar ──────────────────────────────────────────────────────── */
async function setupStatusBar(StatusBar) {
  try {
    await StatusBar.setStyle({ style: 'DARK' });
    await StatusBar.setBackgroundColor({ color: '#0f0f23' });
    await StatusBar.setOverlaysWebView({ overlay: false });
    console.info('[CapBridge] StatusBar configured.');
  } catch (err) {
    console.warn('[CapBridge] StatusBar setup failed:', err.message);
  }
}

/* ─── 2. Network → cloudSync bridge ────────────────────────────────────── */
async function setupNetworkListener(Network) {
  try {
    // Get initial status and dispatch it
    const status = await Network.getStatus();
    dispatchNetworkEvent(status.connected);

    // Listen for changes
    Network.addListener('networkStatusChange', (status) => {
      console.info(`[CapBridge] Network status changed: connected=${status.connected} (${status.connectionType})`);
      dispatchNetworkEvent(status.connected);
    });

    console.info('[CapBridge] Network listener active.');
  } catch (err) {
    console.warn('[CapBridge] Network listener failed:', err.message);
  }
}

/**
 * Dispatch browser-standard online/offline events so cloudSync.js
 * reacts without any changes — it already listens to window 'online'/'offline'.
 */
function dispatchNetworkEvent(isConnected) {
  const eventName = isConnected ? 'online' : 'offline';
  window.dispatchEvent(new Event(eventName));

  // Also update navigator.onLine shim for any code that reads it directly
  Object.defineProperty(navigator, 'onLine', {
    get: () => isConnected,
    configurable: true,
  });
}

/* ─── 3. Android Back Button → Wizard navigation ───────────────────────── */
function setupBackButton(App) {
  App.addListener('backButton', ({ canGoBack }) => {
    console.info('[CapBridge] Hardware back button pressed');

    // If a modal/overlay is open, close it first
    if (closeOpenModal()) return;

    // If we're inside the wizard (app.html), navigate steps
    if (isOnAppPage()) {
      handleWizardBack();
      return;
    }

    // On landing page (index.html) — show exit dialog
    if (!canGoBack) {
      showExitDialog(App);
    }
  });

  console.info('[CapBridge] Back button listener active.');
}

/** Returns true and closes any visible modal/toast overlay */
function closeOpenModal() {
  // Close any open full-screen overlays (auth modals, etc.)
  const modal = document.querySelector('.modal-overlay.active, .auth-modal.active');
  if (modal) {
    modal.classList.remove('active');
    return true;
  }
  return false;
}

/** Returns true if the current page is app.html (wizard) */
function isOnAppPage() {
  return window.location.pathname.includes('app.html') ||
         document.getElementById('step1') !== null;
}

/**
 * Navigate the wizard one step back.
 * At step 1, show exit dialog instead of going back.
 */
function handleWizardBack() {
  // Use the existing global goToStep if available (set in app.js)
  const currentStep = getCurrentWizardStep();

  if (currentStep > 1) {
    if (typeof window.goToStep === 'function') {
      window.goToStep(currentStep - 1);
    } else {
      // Fallback: click the prev button
      const prevBtn = document.getElementById('prevBtn');
      if (prevBtn && !prevBtn.disabled) prevBtn.click();
    }
  } else {
    // Step 1 — ask if user wants to exit
    showExitDialog(window.SmartWillNative.plugins.App);
  }
}

function getCurrentWizardStep() {
  // Read from the active step element
  const activeStep = document.querySelector('.wizard-step.active');
  if (activeStep && activeStep.id) {
    const match = activeStep.id.match(/step(\d+)/);
    if (match) return parseInt(match[1], 10);
  }
  return 1;
}

/** Shows a native-style exit confirmation dialog */
function showExitDialog(App) {
  // Check if a dialog is already shown
  if (document.getElementById('sw-exit-dialog')) return;

  const dialog = document.createElement('div');
  dialog.id = 'sw-exit-dialog';
  dialog.innerHTML = `
    <div class="sw-exit-backdrop"></div>
    <div class="sw-exit-box">
      <h3>Exit SmartWill India?</h3>
      <p>Your draft is saved. You can continue later.</p>
      <div class="sw-exit-actions">
        <button id="sw-exit-cancel" class="btn btn-outline">Stay</button>
        <button id="sw-exit-confirm" class="btn btn-primary">Exit</button>
      </div>
    </div>
  `;

  // Inline styles so it works without external CSS dependency
  Object.assign(dialog.style, {
    position: 'fixed', inset: '0', zIndex: '99999',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  });

  const backdrop = dialog.querySelector('.sw-exit-backdrop');
  Object.assign(backdrop.style, {
    position: 'absolute', inset: '0',
    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
  });

  const box = dialog.querySelector('.sw-exit-box');
  Object.assign(box.style, {
    position: 'relative', background: '#1a1a3e',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px',
    padding: '28px 24px', maxWidth: '320px', width: '90%',
    textAlign: 'center', color: '#fff',
  });

  const actions = dialog.querySelector('.sw-exit-actions');
  Object.assign(actions.style, {
    display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '20px',
  });

  document.body.appendChild(dialog);

  dialog.querySelector('#sw-exit-cancel').addEventListener('click', () => {
    dialog.remove();
  });

  dialog.querySelector('#sw-exit-confirm').addEventListener('click', async () => {
    dialog.remove();
    try { await App.exitApp(); } catch (_) { window.history.back(); }
  });

  dialog.querySelector('.sw-exit-backdrop').addEventListener('click', () => {
    dialog.remove();
  });
}

/* ─── 4. Cashfree Payment Bridge ────────────────────────────────────────── */
/**
 * On Android, we open a relay page (pay.html) in a Chrome Custom Tab.
 * pay.html uses the Cashfree JS SDK to initialize the checkout UI properly
 * (the direct payments.cashfree.com/#sessionId URL format doesn't work for
 * API version 2023-08-01). After payment, Cashfree redirects to
 * pay.html?order_id=xxx, which then deep-links back to this app via:
 * com.smartwillindia.app://payment?order_id=xxx
 * Android intercepts that URL, closes the Chrome Custom Tab, and fires appUrlOpen.
 */
// Track browserFinished handle so we don't stack listeners
let _browserFinishedHandle = null;

function setupPaymentBridge(Browser) {
  // openPayment now accepts both session ID and order ID
  window.SmartWillNative.openPayment = async function(paymentSessionId, orderId) {
    if (!IS_ANDROID) {
      return false; // Browser: let normal Cashfree SDK handle it
    }

    try {
      // Open pay.html relay (hosted on whitelisted Vercel domain).
      // pay.html uses the Cashfree JS SDK so the origin is
      // https://smartwill-india.vercel.app — already approved in Cashfree.
      const relayUrl = `https://smartwill-india.vercel.app/pay.html?session_id=${encodeURIComponent(paymentSessionId)}&order_id=${encodeURIComponent(orderId || '')}`;
      await Browser.open({
        url: relayUrl,
        presentationStyle: 'popover',
        toolbarColor: '#0f0f23',
      });

      // Remove stale listener before adding a fresh one
      if (_browserFinishedHandle) {
        try { _browserFinishedHandle.remove(); } catch (_) {}
        _browserFinishedHandle = null;
      }

      _browserFinishedHandle = await Browser.addListener('browserFinished', () => {
        console.info('[CapBridge] Payment browser closed — triggering verification');
        window.dispatchEvent(new CustomEvent('cashfree_browser_closed'));
        if (_browserFinishedHandle) {
          try { _browserFinishedHandle.remove(); } catch (_) {}
          _browserFinishedHandle = null;
        }
      });

      return true;
    } catch (err) {
      console.error('[CapBridge] Native payment browser failed:', err);
      return false; // Fall back to WebView SDK
    }
  };

  console.info('[CapBridge] Payment bridge ready.');
}

/* ─── 5. Deep-link handler (payment return via custom scheme) ────────────── */
/**
 * When Cashfree redirects to pay.html?order_id=xxx, that page redirects to:
 * com.smartwillindia.app://payment?order_id=xxx
 * Android intercepts this custom scheme, closes Chrome Custom Tab, and fires
 * App.addListener('appUrlOpen', ...) with the deep-link URL.
 * We extract the order_id and trigger payment verification.
 */
function setupDeepLinkHandler(App) {
  App.addListener('appUrlOpen', ({ url }) => {
    console.info('[CapBridge] App opened via deep link:', url);
    try {
      // Parse: com.smartwillindia.app://payment?order_id=SW_xxx
      if (!url || !url.startsWith('com.smartwillindia.app://payment')) return;
      const queryStr = url.includes('?') ? url.split('?')[1] : '';
      const params = new URLSearchParams(queryStr);
      const orderId = params.get('order_id');

      if (orderId) {
        console.info('[CapBridge] Payment return detected, order_id:', orderId);
        // Close the Chrome Custom Tab (it may already be closed, but be safe)
        const Browser = window.SmartWillNative.plugins.Browser;
        if (Browser) { try { Browser.close(); } catch (_) {} }

        // Fire cashfree_browser_closed with orderId so payment.js can verify
        window.dispatchEvent(new CustomEvent('cashfree_browser_closed', {
          detail: { orderId }
        }));
      }
    } catch (err) {
      console.error('[CapBridge] Deep link handling error:', err);
    }
  });

  console.info('[CapBridge] Deep-link handler active.');
}
