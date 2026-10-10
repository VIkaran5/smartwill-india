/**
 * SmartWill India - Gentle Session Inactivity Guardian
 *
 * Implements a privacy-focused 45-minute idle timeout with a 2-minute
 * countdown warning modal.
 *
 * Safety & Privacy Rules:
 * 1. Zero data loss: Auto-saves state to localStorage and cloudSync before lock.
 * 2. Mobile app exemption: Disabled on Capacitor Android (device PIN/biometrics handle security).
 * 3. Payment protection: Paused on Step 6 (Payment) and active checkout modal.
 * 4. User activity tracking: Throttled mouse/touch/key events (updates at most once per 10s).
 * 5. Gentle re-login: Draft remains intact on re-authentication.
 * 6. Sleep / Tab suspension resilient: Tracks elapsed wall-clock time via localStorage and visibilitychange.
 * 7. Multi-tab synchronization: Syncs activity and lock across all open tabs.
 */

import { showToast } from '../ui/toast.js';
import { getState } from '../state/store.js';
import { saveDraft } from '../state/storage.js';

let IDLE_TIMEOUT_MS = 45 * 60 * 1000;          // 45 minutes
let WARNING_DURATION_MS = 2 * 60 * 1000;       // 2 minutes
let THROTTLE_INTERVAL_MS = 10 * 1000;          // 10 seconds

const STORAGE_KEY_LAST_ACTIVITY = 'sw_last_activity_time';
const STORAGE_KEY_LOCKED = 'sw_session_locked_timestamp';

let lastActivityTime = Date.now();
let warningTimer = null;
let logoutTimer = null;
let countdownInterval = null;
let heartbeatInterval = null;
let isWarningShown = false;
let isGuardianActive = false;
let boundActivityHandler = null;
let boundVisibilityHandler = null;
let boundFocusHandler = null;
let boundStorageHandler = null;

/**
 * Checks if current runtime is a native Capacitor app (Android APK).
 */
export function isNativeApp() {
  if (typeof window === 'undefined') return false;
  return Boolean(
    window.Capacitor?.isNativePlatform?.() ||
    window.Capacitor?.getPlatform?.() === 'android' ||
    (window.location && (window.location.protocol === 'capacitor:' || window.location.protocol === 'ionic:'))
  );
}

/**
 * Checks if user is currently on the Payment Step or actively checking out.
 * Safe against hidden/inactive DOM containers.
 */
export function isPaymentStepActive() {
  if (typeof window === 'undefined') return false;
  try {
    const urlParams = new URLSearchParams(window.location.search || '');
    const stepParam = urlParams.get('step');
    if (stepParam === '6' || stepParam === '5' || stepParam === 'payment') return true;

    if (window.location && window.location.hash === '#step6') return true;

    // Check wizard store state
    try {
      const state = getState();
      if (state && state.currentStep === 6) return true;
    } catch (_) {}

    // Check DOM - must be explicitly active
    const step6 = document.getElementById('step6');
    if (step6 && step6.classList.contains('active')) return true;

    // Check Cashfree checkout modal
    const cfModal = document.getElementById('cf-checkout-container') || document.querySelector('[id*="cashfree"]');
    if (cfModal && (cfModal.offsetParent !== null || cfModal.classList.contains('active'))) return true;
  } catch (e) {}
  return false;
}

/**
 * Periodic check to evaluate elapsed real time.
 * Catches sleep wake-ups, background tab throtlling, and cross-tab sync.
 */
export function checkInactivity() {
  if (!isGuardianActive) return;
  if (isPaymentStepActive()) return;

  const now = Date.now();

  // Cross-tab check: sync with most recent activity in other tabs
  try {
    const stored = localStorage.getItem(STORAGE_KEY_LAST_ACTIVITY);
    if (stored) {
      const storedTime = Number(stored);
      if (storedTime > lastActivityTime && storedTime <= now) {
        lastActivityTime = storedTime;
        if (isWarningShown) {
          dismissWarningModal();
        }
      }
    }
  } catch (_) {}

  const elapsed = now - lastActivityTime;
  const warningThreshold = IDLE_TIMEOUT_MS - WARNING_DURATION_MS;

  if (elapsed >= IDLE_TIMEOUT_MS) {
    executeSessionLock();
  } else if (elapsed >= warningThreshold) {
    if (!isWarningShown) {
      const remainingSec = Math.max(1, Math.floor((IDLE_TIMEOUT_MS - elapsed) / 1000));
      showWarningModal(remainingSec);
    }
  }
}

/**
 * Record user activity. Throttled to avoid CPU spikes.
 * @param {boolean} forceReset - Immediately resets timer without throttling (e.g. clicking 'Keep Me Signed In')
 */
export function recordUserActivity(forceReset = false) {
  if (!isGuardianActive) return;

  const now = Date.now();
  const elapsed = now - lastActivityTime;

  // If user was away longer than the idle timeout (e.g. computer woke from sleep),
  // lock immediately rather than refreshing the session.
  if (elapsed >= IDLE_TIMEOUT_MS) {
    return executeSessionLock();
  }

  if (!forceReset && (elapsed < THROTTLE_INTERVAL_MS)) {
    return;
  }

  lastActivityTime = now;
  try {
    localStorage.setItem(STORAGE_KEY_LAST_ACTIVITY, now.toString());
  } catch (_) {}

  if (isWarningShown) {
    dismissWarningModal();
  }

  scheduleTimers();
}

/**
 * Starts the session inactivity guardian for an authenticated user.
 */
export function startSessionGuardian(user) {
  if (!user) return;
  if (isNativeApp()) {
    return;
  }

  isGuardianActive = true;

  // Restore last activity from localStorage or initialize
  const now = Date.now();
  let storedTime = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LAST_ACTIVITY);
    if (raw && !isNaN(Number(raw))) {
      storedTime = Number(raw);
    }
  } catch (_) {}

  // If user was inactive while away and elapsed time already exceeded timeout:
  if (storedTime && (now - storedTime >= IDLE_TIMEOUT_MS)) {
    return executeSessionLock();
  }

  if (storedTime && storedTime <= now && (now - storedTime < IDLE_TIMEOUT_MS)) {
    lastActivityTime = storedTime;
  } else {
    lastActivityTime = now;
    try {
      localStorage.setItem(STORAGE_KEY_LAST_ACTIVITY, now.toString());
    } catch (_) {}
  }

  // User input interaction listeners
  if (!boundActivityHandler && typeof window !== 'undefined') {
    boundActivityHandler = () => recordUserActivity(false);
    const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll'];
    events.forEach(evt => window.addEventListener(evt, boundActivityHandler, { passive: true }));
  }

  // Visibility and focus listeners (catches sleep wake-up & tab switching)
  if (!boundVisibilityHandler && typeof document !== 'undefined') {
    boundVisibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        checkInactivity();
      }
    };
    document.addEventListener('visibilitychange', boundVisibilityHandler);
  }

  if (!boundFocusHandler && typeof window !== 'undefined') {
    boundFocusHandler = () => checkInactivity();
    window.addEventListener('focus', boundFocusHandler);
  }

  // Cross-tab synchronization via localStorage events
  if (!boundStorageHandler && typeof window !== 'undefined') {
    boundStorageHandler = (e) => {
      if (e.key === STORAGE_KEY_LAST_ACTIVITY && e.newValue) {
        const remoteTime = Number(e.newValue);
        if (remoteTime > lastActivityTime) {
          lastActivityTime = remoteTime;
          if (isWarningShown) {
            dismissWarningModal();
          }
          scheduleTimers();
        }
      } else if (e.key === STORAGE_KEY_LOCKED) {
        executeSessionLock(true);
      }
    };
    window.addEventListener('storage', boundStorageHandler);
  }

  // Heartbeat check every 15s to bypass browser setTimeout throttling in background
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  heartbeatInterval = setInterval(() => {
    checkInactivity();
  }, 15000);

  // Expose easy testing helper on window for dev/console testing
  if (typeof window !== 'undefined') {
    window._smartwillTestSessionTimeout = (seconds = 5) => {
      console.log(`[SessionGuardian] Testing session timeout in ${seconds}s...`);
      _setTestConfig(seconds * 1000, Math.min(2000, Math.floor(seconds * 1000 / 2)), 500);
      recordUserActivity(true);
    };
  }

  scheduleTimers();
}

/**
 * Stops and clears all timers, intervals, and listeners.
 */
export function stopSessionGuardian() {
  isGuardianActive = false;
  clearTimers();
  dismissWarningModal();

  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }

  if (typeof window !== 'undefined') {
    if (boundActivityHandler) {
      const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll'];
      events.forEach(evt => window.removeEventListener(evt, boundActivityHandler));
      boundActivityHandler = null;
    }

    if (boundFocusHandler) {
      window.removeEventListener('focus', boundFocusHandler);
      boundFocusHandler = null;
    }

    if (boundStorageHandler) {
      window.removeEventListener('storage', boundStorageHandler);
      boundStorageHandler = null;
    }
  }

  if (typeof document !== 'undefined' && boundVisibilityHandler) {
    document.removeEventListener('visibilitychange', boundVisibilityHandler);
    boundVisibilityHandler = null;
  }
}

function clearTimers() {
  if (warningTimer) { clearTimeout(warningTimer); warningTimer = null; }
  if (logoutTimer) { clearTimeout(logoutTimer); logoutTimer = null; }
  if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
}

function scheduleTimers() {
  clearTimers();
  if (!isGuardianActive) return;

  if (isPaymentStepActive()) {
    // Security (NEW-003): Even during payment, enforce a 2-hour absolute max timeout.
    // Prevents indefinite session if user walks away on step 5/6.
    const PAYMENT_MAX_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours
    const elapsed = Date.now() - lastActivityTime;
    if (elapsed >= PAYMENT_MAX_TIMEOUT_MS) {
      executeSessionLock();
      return;
    }
    warningTimer = setTimeout(() => scheduleTimers(), 5 * 60 * 1000);
    return;
  }

  const now = Date.now();
  const elapsed = now - lastActivityTime;
  const warningThreshold = IDLE_TIMEOUT_MS - WARNING_DURATION_MS;

  if (elapsed >= IDLE_TIMEOUT_MS) {
    executeSessionLock();
    return;
  }

  const msUntilWarning = Math.max(0, warningThreshold - elapsed);
  const msUntilLogout = Math.max(0, IDLE_TIMEOUT_MS - elapsed);

  if (elapsed >= warningThreshold) {
    const remainingSec = Math.max(1, Math.floor((IDLE_TIMEOUT_MS - elapsed) / 1000));
    showWarningModal(remainingSec);
  } else {
    warningTimer = setTimeout(() => {
      if (isPaymentStepActive()) {
        scheduleTimers();
        return;
      }
      showWarningModal();
    }, msUntilWarning);
  }

  logoutTimer = setTimeout(() => {
    if (isPaymentStepActive()) {
      scheduleTimers();
      return;
    }
    executeSessionLock();
  }, msUntilLogout);
}

/**
 * Renders and shows the warning modal.
 * @param {number|null} initialRemainingSec - Optional remaining seconds to initialize countdown
 */
function showWarningModal(initialRemainingSec = null) {
  isWarningShown = true;
  let modal = document.getElementById('sessionWarningModal');

  if (!modal && typeof document !== 'undefined') {
    modal = document.createElement('div');
    modal.id = 'sessionWarningModal';
    modal.className = 'payment-modal-overlay';
    modal.style.zIndex = '10050';
    modal.innerHTML = `
      <div class="payment-modal-card session-warning-card" role="dialog" aria-modal="true" aria-labelledby="sessionWarningTitle">
        <div class="session-warning-icon">🔒</div>
        <h3 id="sessionWarningTitle" class="session-warning-title">Session Inactivity Warning</h3>
        <p class="session-warning-desc">
          For your legal and financial privacy, your session will automatically lock in 
          <span class="session-countdown-pill"><span id="sessionCountdownSec">120</span>s</span> 
          due to inactivity. Your Will draft is safely preserved.
        </p>
        <div class="session-progress-track">
          <div class="session-progress-fill" id="sessionProgressFill" style="width: 100%;"></div>
        </div>
        <div class="session-warning-actions">
          <button type="button" class="btn btn-gold btn-sm w-full" id="btnExtendSession" style="font-weight:700;">
            ✓ Keep Me Signed In
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const btnExtend = modal.querySelector('#btnExtendSession');
    if (btnExtend) {
      btnExtend.addEventListener('click', (e) => {
        e.stopPropagation();
        recordUserActivity(true);
      });
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        recordUserActivity(true);
      }
    });
  }

  if (modal) {
    modal.classList.remove('hidden');
  }

  const defaultSec = Math.floor(WARNING_DURATION_MS / 1000);
  let remainingSec = initialRemainingSec !== null ? initialRemainingSec : defaultSec;
  const totalSec = defaultSec;

  const secSpan = document.getElementById('sessionCountdownSec');
  const fillBar = document.getElementById('sessionProgressFill');

  if (secSpan) secSpan.textContent = remainingSec.toString();
  if (fillBar) fillBar.style.width = `${Math.min(100, Math.max(0, (remainingSec / totalSec) * 100))}%`;

  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    remainingSec -= 1;
    if (secSpan) secSpan.textContent = Math.max(0, remainingSec).toString();
    if (fillBar) {
      const pct = Math.max(0, (remainingSec / totalSec) * 100);
      fillBar.style.width = `${pct}%`;
    }

    if (remainingSec <= 0) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
  }, 1000);
}

/**
 * Dismisses the warning modal.
 */
function dismissWarningModal() {
  isWarningShown = false;
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  const modal = document.getElementById('sessionWarningModal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

/**
 * Executes safe session lock: preserves draft, signs out of Firebase, updates UI.
 * @param {boolean} isSilent - If true, suppresses toast (useful for cross-tab sync)
 */
export async function executeSessionLock(isSilent = false) {
  stopSessionGuardian();

  try {
    localStorage.removeItem(STORAGE_KEY_LAST_ACTIVITY);
    localStorage.setItem(STORAGE_KEY_LOCKED, Date.now().toString());
  } catch (_) {}

  // 1. Ensure draft is preserved in localStorage
  try {
    const currentState = getState();
    if (currentState && currentState.personal) {
      await saveDraft(currentState);
    }
  } catch (e) {
    console.warn('[Session Lock] Error saving draft:', e);
  }

  // 2. Perform gentle Firebase sign-out (without wiping local draft store)
  // Security (NEW-001): Use the exported handleSignOut or firebase.auth().signOut()
  // instead of window.firebaseAuth which was never assigned on window.
  try {
    if (typeof window !== 'undefined') {
      if (typeof window.handleSignOut === 'function') {
        await window.handleSignOut();
      } else if (typeof firebase !== 'undefined' && firebase.auth) {
        await firebase.auth().signOut();
      } else if (window.firebaseAuth && typeof window.firebaseAuth.signOut === 'function') {
        await window.firebaseAuth.signOut();
      }
    }
  } catch (e) {
    console.warn('[Session Lock] Sign-out warning:', e);
  }

  // 3. Clear window user state & update UI
  if (typeof window !== 'undefined') {
    if (window.currentUser) window.currentUser = null;
    if (typeof window.updateAuthUI === 'function') {
      window.updateAuthUI(null);
    }
    if (typeof window.closeDashboardModal === 'function') {
      window.closeDashboardModal();
    }

    // Security (NEW-002): Clear PII from all visible form fields and wizard step content
    // so a passerby cannot read personal details on the locked screen.
    try {
      document.querySelectorAll('input, textarea, select').forEach(el => {
        if (el.type !== 'hidden' && el.type !== 'submit' && el.type !== 'button' && el.type !== 'radio' && el.type !== 'checkbox') {
          el.value = '';
        }
      });
      // Clear rendered draft preview text (step 5 summary)
      const previewContainer = document.getElementById('draftPreviewContent') || document.getElementById('previewContent');
      if (previewContainer) previewContainer.innerHTML = '';
    } catch (_) {}
  }

  // 4. Notify user
  if (!isSilent) {
    showToast(
      'info',
      'Session Locked 🔒',
      'For your legal privacy, you were signed out after inactivity. Your draft is securely saved.'
    );
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('smartwill_session_locked'));
  }
}

/**
 * Testing helper: customize timeouts for unit tests.
 */
export function _setTestConfig(idleMs, warningMs, throttleMs, mockLastActivityTime = null) {
  IDLE_TIMEOUT_MS = idleMs;
  WARNING_DURATION_MS = warningMs;
  THROTTLE_INTERVAL_MS = throttleMs;
  if (mockLastActivityTime !== null) {
    lastActivityTime = mockLastActivityTime;
  }
}

export function _isGuardianActive() {
  return isGuardianActive;
}

export function _isWarningShown() {
  return isWarningShown;
}

if (typeof window !== 'undefined') {
  window.startSessionGuardian = startSessionGuardian;
  window.stopSessionGuardian = stopSessionGuardian;
  window.executeSessionLock = executeSessionLock;
}

