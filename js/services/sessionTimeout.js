/**
 * SmartWill India - Gentle Session Inactivity Guardian
 *
 * Implements a privacy-focused 45-minute idle timeout with a 2-minute
 * countdown warning modal.
 *
 * Safety & Privacy Rules:
 * 1. Zero data loss: Auto-saves state to localStorage and cloudSync before lock.
 * 2. Mobile app exemption: Disabled on Capacitor Android (device PIN/biometrics handle security).
 * 3. Payment protection: Paused on Step 5 (Payment) and active checkout.
 * 4. User activity tracking: Throttled mouse/touch/key events (updates at most once per 10s).
 * 5. Gentle re-login: Draft remains intact on re-authentication.
 */

import { showToast } from '../ui/toast.js';
import { getState } from '../state/store.js';
import { saveDraft } from '../state/storage.js';

let IDLE_TIMEOUT_MS = 45 * 60 * 1000;          // 45 minutes
let WARNING_DURATION_MS = 2 * 60 * 1000;       // 2 minutes
let THROTTLE_INTERVAL_MS = 10 * 1000;          // 10 seconds

let lastActivityTime = Date.now();
let warningTimer = null;
let logoutTimer = null;
let countdownInterval = null;
let isWarningShown = false;
let isGuardianActive = false;
let boundActivityHandler = null;

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
 */
export function isPaymentStepActive() {
  if (typeof window === 'undefined') return false;
  try {
    const urlParams = new URLSearchParams(window.location.search || '');
    const stepParam = urlParams.get('step');
    if (stepParam === '6' || stepParam === '5') return true;
    const step6 = document.getElementById('step6');
    if (step6 && (step6.classList.contains('active') || !step6.classList.contains('hidden'))) return true;
    const cfModal = document.getElementById('cf-checkout-container') || document.querySelector('[id*="cashfree"]');
    if (cfModal) return true;
  } catch (e) {}
  return false;
}

/**
 * Record user activity. Throttled to avoid CPU spikes.
 * @param {boolean} forceReset - Immediately resets timer without throttling (e.g. clicking 'Keep Me Signed In')
 */
export function recordUserActivity(forceReset = false) {
  if (!isGuardianActive) return;

  const now = Date.now();
  if (!forceReset && (now - lastActivityTime < THROTTLE_INTERVAL_MS)) {
    return;
  }

  lastActivityTime = now;

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
  lastActivityTime = Date.now();

  if (!boundActivityHandler && typeof window !== 'undefined') {
    boundActivityHandler = () => recordUserActivity(false);
    const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll'];
    events.forEach(evt => window.addEventListener(evt, boundActivityHandler, { passive: true }));
  }

  scheduleTimers();
}

/**
 * Stops and clears all timers and listeners.
 */
export function stopSessionGuardian() {
  isGuardianActive = false;
  clearTimers();
  dismissWarningModal();

  if (boundActivityHandler && typeof window !== 'undefined') {
    const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll'];
    events.forEach(evt => window.removeEventListener(evt, boundActivityHandler));
    boundActivityHandler = null;
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
    warningTimer = setTimeout(() => scheduleTimers(), 5 * 60 * 1000);
    return;
  }

  const warningTimeMs = IDLE_TIMEOUT_MS - WARNING_DURATION_MS;

  warningTimer = setTimeout(() => {
    if (isPaymentStepActive()) {
      scheduleTimers();
      return;
    }
    showWarningModal();
  }, warningTimeMs);

  logoutTimer = setTimeout(() => {
    if (isPaymentStepActive()) {
      scheduleTimers();
      return;
    }
    executeSessionLock();
  }, IDLE_TIMEOUT_MS);
}

/**
 * Renders and shows the warning modal.
 */
function showWarningModal() {
  isWarningShown = true;
  let modal = document.getElementById('sessionWarningModal');

  if (!modal && typeof document !== 'undefined') {
    modal = document.createElement('div');
    modal.id = 'sessionWarningModal';
    modal.className = 'payment-modal-overlay';
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

  let remainingSec = Math.floor(WARNING_DURATION_MS / 1000);
  const totalSec = remainingSec;

  const secSpan = document.getElementById('sessionCountdownSec');
  const fillBar = document.getElementById('sessionProgressFill');

  if (secSpan) secSpan.textContent = remainingSec.toString();
  if (fillBar) fillBar.style.width = '100%';

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
 */
export async function executeSessionLock() {
  stopSessionGuardian();

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
  try {
    if (typeof window !== 'undefined' && window.firebaseAuth) {
      await window.firebaseAuth.signOut();
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
  }

  // 4. Notify user
  showToast(
    'info',
    'Session Locked 🔒',
    'For your legal privacy, you were signed out after inactivity. Your draft is securely saved.'
  );

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('smartwill_session_locked'));
  }
}

/**
 * Testing helper: customize timeouts for unit tests.
 */
export function _setTestConfig(idleMs, warningMs, throttleMs) {
  IDLE_TIMEOUT_MS = idleMs;
  WARNING_DURATION_MS = warningMs;
  THROTTLE_INTERVAL_MS = throttleMs;
}

export function _isGuardianActive() {
  return isGuardianActive;
}

export function _isWarningShown() {
  return isWarningShown;
}
