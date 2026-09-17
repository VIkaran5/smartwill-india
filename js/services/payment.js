/* Cashfree Production Payment Gateway Service for SmartWill India */
import { getState } from '../state/store.js';
import { showToast } from '../ui/toast.js';
import { logger } from './logger.js';
import { t } from '../i18n/index.js';
import { WILL_PRICE_INR } from '../config/constants.js';

let activeOrderSession = null;
let activeOrderTimestamp = 0;
const SESSION_MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes

export function initPaymentService() {
  const payNowBtn = document.getElementById('payNowBtn');
  // Bug #3 Fix: Defer checkReturnPayment until Firebase Auth has resolved.
  // Calling it immediately at page load means the auth token is not yet available,
  // causing the verify API to return 401 even after a successful payment redirect.
  waitForAuthThenCheckReturn();

  if (payNowBtn) {
    payNowBtn.addEventListener('click', async () => {
      if (payNowBtn.disabled) return;

      payNowBtn.disabled = true;
      payNowBtn.innerHTML = `<i data-lucide="loader-2" class="spin"></i> ${t('toast.pincodeDetecting')}`;
      if (window.lucide) window.lucide.createIcons();

      const state = getState();
      const personal = state.personal || {};
      const customerName = personal.fullName || 'SmartWill Customer';
      const customerEmail = personal.email || 'customer@smartwill.in';
      const rawPhone = (personal.phone || '9999999999').replace(/\D/g, '');
      const customerPhone = rawPhone.length === 10 ? rawPhone : '9999999999';
      const uid = (typeof window.currentUser !== 'undefined' && window.currentUser) ? window.currentUser.uid : null;
      if (!uid) {
        resetPayNowBtn();
        showToast('warning', 'Authentication Required', 'Please sign in to your account before proceeding to payment.');
        return;
      }

      logger.info('Payment started');

      try {
        let sessionData = getValidActiveSession();

        if (!sessionData) {
          sessionData = await createCashfreeOrderSession(customerName, customerEmail, customerPhone, uid);
          if (sessionData && sessionData.payment_session_id) {
            activeOrderSession = sessionData;
            activeOrderTimestamp = Date.now();
          }
        }

        if (sessionData && sessionData.payment_session_id) {

          // ── Android Native Path: use Capacitor Browser (Chrome Custom Tab) ──
          const nativeBridge = window.SmartWillNative;
          if (nativeBridge && nativeBridge.isAndroid && typeof nativeBridge.openPayment === 'function') {
            logger.info('Payment: Android native browser path');
            // Bug #2 Fix: Only use the real order_id from the backend — never
            // generate a client-side fallback ID for verification, as Cashfree
            // won't recognise it and verification will always fail.
            const orderId = sessionData.order_id;
            if (!orderId) {
              resetPayNowBtn();
              showToast('error', 'Payment Error', 'Could not retrieve order reference. Please try again.');
              return;
            }

            const handled = await nativeBridge.openPayment(sessionData.payment_session_id, orderId);
            if (handled) {
              resetPayNowBtn();
              activeOrderSession = null;
              // Persist orderId so we can recover if user returns manually
              // (e.g. deep-link fails or app is backgrounded during payment)
              localStorage.setItem('sw_pending_order_id', orderId);
              // Verify when browser closes — from deep-link (has orderId in detail)
              // OR from manual close (uses locally-scoped orderId as fallback)
              window.addEventListener('cashfree_browser_closed', (e) => {
                const verifyId = (e.detail && e.detail.orderId) ? e.detail.orderId : orderId;
                logger.info('Native browser closed — verifying payment', verifyId);
                verifyPaymentWithBackoff(verifyId);
              }, { once: true });
              return;
            }
          }

          // ── Web Fallback Path: standard Cashfree JS SDK ──────────────────
          if (typeof window.Cashfree === 'undefined') {
            resetPayNowBtn();
            showToast('error', 'Payment Gateway Error', 'Could not initialize Cashfree checkout.');
            return;
          }

          const cashfree = window.Cashfree({ mode: 'production' });
          cashfree.checkout({
            paymentSessionId: sessionData.payment_session_id,
            redirectTarget: '_self'
          }).then((result) => {
            resetPayNowBtn();
            if (result.error) {
              logger.info('Payment cancelled');
              if (result.error.message && result.error.message.includes('expired')) {
                activeOrderSession = null;
              }
              showToast('warning', 'Payment Cancelled', 'Payment was not completed. Please try again.');
            }
            if (result.paymentDetails) {
              logger.info('Payment success callback received');
              // Bug #7 Fix: Capture order_id before the async callback executes.
              // Using sessionData.order_id directly inside the .then() callback risks
              // a stale closure if sessionData is reassigned. The fallback Date.now()
              // was also generating an ID Cashfree doesn't know about.
              if (sessionData.order_id) {
                verifyPaymentWithBackoff(sessionData.order_id);
              } else {
                showToast('error', 'Verification Error', 'Could not retrieve order ID. Please contact support.');
              }
            }
          }).catch((chkError) => {
            resetPayNowBtn();
            activeOrderSession = null;
            logger.warn('Cashfree checkout session failed, retrying with new order', chkError);
            showToast('error', 'Checkout Error', 'Session expired. Please click Pay again.');
          });

        } else {
          resetPayNowBtn();
          const errMsg = (sessionData && sessionData.error) ? sessionData.error : 'Could not initialize Cashfree checkout.';
          showToast('error', 'Payment Gateway Error', errMsg);
        }
      } catch (err) {
        logger.error('Cashfree checkout connection error', err);
        resetPayNowBtn();
        showToast('error', 'Connection Error', 'Unable to reach payment gateway. Please check your connection.');
      }
    });
  }
}

function getValidActiveSession() {
  if (activeOrderSession && (Date.now() - activeOrderTimestamp < SESSION_MAX_AGE_MS)) {
    return activeOrderSession;
  }
  activeOrderSession = null;
  return null;
}

export function resetPayNowBtn() {
  const payNowBtn = document.getElementById('payNowBtn');
  if (payNowBtn) {
    payNowBtn.disabled = false;
    payNowBtn.innerHTML = `<i data-lucide="lock"></i> <span data-i18n="form.payBtn">${t('form.payBtn')}</span>`;
    if (window.lucide) window.lucide.createIcons();
  }
}

export async function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (window.currentUser && typeof window.currentUser.getIdToken === 'function') {
    try {
      const idToken = await window.currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${idToken}`;
    } catch (e) {
      // Proceed without token if fetch fails
    }
  }
  return headers;
}

function getApiBaseUrl() {
  if (typeof window !== 'undefined' && window.location) {
    if (window.location.protocol === 'capacitor:' || window.location.protocol === 'file:' || (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform())) {
      return 'https://smartwill-india.vercel.app';
    }
  }
  return '';
}

export async function createCashfreeOrderSession(name, email, phone, uid) {
  try {
    const headers = await getAuthHeaders();
    const apiRes = await fetch(`${getApiBaseUrl()}/api/create-order`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ name, email, phone, uid })
    });

    const data = await apiRes.json();
    if (apiRes.ok && data.payment_session_id) {
      return data;
    } else {
      logger.error('Create-order API error');
      return { error: data.error || 'Serverless function error' };
    }
  } catch (e) {
    // Show exact error name + message so we can diagnose on Android
    const errDetail = `${e.name}: ${e.message}`;
    logger.error('API call failed', e);
    return { error: `Network error: ${errDetail}` };
  }
}

// Bounded exponential backoff verification schedule (Attempt 1: immediate, Retry 1: +1s, Retry 2: +2s, Retry 3: +4s)
export async function verifyPaymentWithBackoff(orderId) {
  showToast('loading', 'Verifying Payment...', 'Please wait while we confirm your transaction securely.');

  const delays = [0, 1000, 2000, 4000];

  for (let attempt = 0; attempt < delays.length; attempt++) {
    if (delays[attempt] > 0) {
      await new Promise(r => setTimeout(r, delays[attempt]));
    }

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${getApiBaseUrl()}/api/verify-payment`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ order_id: orderId })
      });

      const data = await res.json();

      if (res.ok && data.is_paid) {
        logger.info('Payment verified');
        unlockPostPaymentUI(orderId);
        return true;
      } else if (attempt === delays.length - 1) {
        showToast('error', 'Payment Pending / Unverified', data.error || 'Payment status could not be confirmed. Please contact support.');
        return false;
      }
    } catch (e) {
      if (attempt === delays.length - 1) {
        logger.error('Verification error max retries reached', e);
        showToast('error', 'Verification Connection Error', 'Could not reach server to verify payment. If amount was deducted, please contact support.');
        return false;
      }
    }
  }

  return false;
}

export function unlockPostPaymentUI(orderId, isSilent = false) {
  const prePaymentState = document.getElementById('prePaymentState');
  const postPaymentState = document.getElementById('postPaymentState');
  const txnIdEl = document.getElementById('txnId');

  if (prePaymentState) prePaymentState.classList.add('hidden');
  if (postPaymentState) postPaymentState.classList.remove('hidden');

  if (txnIdEl && orderId) {
    const cleanId = orderId.replace(/^SW_/, '');
    const shortRef = cleanId.slice(-8).toUpperCase();
    txnIdEl.textContent = `SW-${shortRef}`;
  }

  window.isPaymentUnlocked = true;
  localStorage.removeItem('sw_pending_order_id');
  if (orderId) {
    try {
      localStorage.setItem('sw_last_paid_order_id', orderId);
      localStorage.setItem('sw_is_paid', '1');
      if (window.currentUser && window.currentUser.uid) {
        localStorage.setItem('sw_paid_order_' + window.currentUser.uid, JSON.stringify({ orderId, status: 'PAID' }));
      }
    } catch (e) {}
  }
  logger.info('PDF unlocked');
  if (!isSilent) {
    showToast('success', 'Payment Successful! 🎉', 'You have unlocked your official Will document. Download your PDF below.');
  }
}

/**
 * Checks if the signed-in user already owns a paid order in Firestore or localStorage.
 */
export async function checkExistingPaidOrder(user) {
  if (!user) return false;

  // 1. Authoritative check: Query Firestore orders collection (server-governed via firestore.rules)
  if (typeof window.firebase !== 'undefined' && window.firebase.firestore) {
    try {
      const db = window.firebase.firestore();
      const snap = await db.collection('orders')
        .where('uid', '==', user.uid)
        .where('status', '==', 'PAID')
        .limit(1)
        .get();

      if (!snap.empty) {
        const orderData = snap.docs[0].data();
        const orderId = orderData.orderId || snap.docs[0].id;
        try {
          localStorage.setItem('sw_paid_order_' + user.uid, JSON.stringify({ orderId, ...orderData }));
          localStorage.setItem('sw_is_paid', '1');
          localStorage.setItem('sw_last_paid_order_id', orderId);
        } catch (e) {}
        unlockPostPaymentUI(orderId, true);
        return true;
      } else {
        // If Firestore confirms no paid order exists for this authenticated UID,
        // actively purge any spoofed or tampered localStorage keys to prevent bypass
        try {
          localStorage.removeItem('sw_paid_order_' + user.uid);
          localStorage.removeItem('sw_is_paid');
          localStorage.removeItem('sw_last_paid_order_id');
        } catch (e) {}
        return false;
      }
    } catch (err) {
      logger.warn('[Payment] Firestore check failed, fallback to verified cache:', err.message);
    }
  }

  // 2. Offline Fallback: Only used when network/Firestore is unreachable
  try {
    const cached = localStorage.getItem('sw_paid_order_' + user.uid);
    if (cached) {
      const order = JSON.parse(cached);
      if (order && order.orderId && order.status === 'PAID') {
        unlockPostPaymentUI(order.orderId, true);
        return true;
      }
    }
  } catch (e) {}

  return false;
}

export function checkReturnPayment() {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('order_id');
  if (orderId) {
    window.history.replaceState({}, document.title, window.location.pathname);
    verifyPaymentWithBackoff(orderId);
  }
}

/**
 * Wait for Firebase Auth to resolve before processing payment return or checking paid order.
 */
function waitForAuthThenCheckReturn() {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('order_id');
  const shouldDownload = urlParams.get('download') === '1';
  const targetStep = urlParams.get('step');

  if (targetStep && window.goToStep) {
    setTimeout(() => window.goToStep(Number(targetStep)), 300);
  }

  // Clear the URL param immediately to prevent re-processing on refresh
  if (orderId) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  const handleResolvedUser = async (user) => {
    if (orderId) {
      logger.info('Auth resolved — verifying return payment', { orderId });
      await verifyPaymentWithBackoff(orderId);
    } else {
      const isPaid = await checkExistingPaidOrder(user);
      if (isPaid && shouldDownload) {
        setTimeout(async () => {
          if (typeof window.generateWillPDF === 'function') {
            await window.generateWillPDF(getState());
          }
        }, 800);
      }
    }
  };

  if (typeof window.firebase !== 'undefined' && window.firebase.auth) {
    const unsubscribe = window.firebase.auth().onAuthStateChanged(async (user) => {
      unsubscribe();
      if (user) {
        await handleResolvedUser(user);
      } else if (orderId) {
        showToast('warning', 'Authentication Required', 'Please sign in again to verify your payment.');
      }
    });
  } else {
    // Fallback: poll for currentUser up to 5s, then proceed anyway
    let attempts = 0;
    const poll = setInterval(async () => {
      attempts++;
      if (window.currentUser || attempts >= 10) {
        clearInterval(poll);
        if (window.currentUser) {
          await handleResolvedUser(window.currentUser);
        } else if (orderId) {
          verifyPaymentWithBackoff(orderId);
        }
      }
    }, 500);
  }
}

/**
 * Recovery: called on app start/resume.
 * If the user paid but the app didn't verify (e.g. they manually closed the
 * Chrome Custom Tab), localStorage holds the pending orderId. Re-verify it.
 */
export function checkPendingPaymentOnResume() {
  const pendingOrderId = localStorage.getItem('sw_pending_order_id');
  if (!pendingOrderId) return;

  logger.info('Pending payment found on resume — re-verifying', { pendingOrderId });
  showToast('info', 'Verifying Payment...', 'We found a pending payment. Checking status now...');

  if (typeof window.firebase !== 'undefined' && window.firebase.auth) {
    const unsubscribe = window.firebase.auth().onAuthStateChanged((user) => {
      unsubscribe();
      if (user) {
        verifyPaymentWithBackoff(pendingOrderId);
      } else {
        showToast('warning', 'Sign In Required', 'Please sign in to recover your payment.');
      }
    });
  } else {
    let attempts = 0;
    const poll = setInterval(() => {
      attempts++;
      if (window.currentUser || attempts >= 10) {
        clearInterval(poll);
        verifyPaymentWithBackoff(pendingOrderId);
      }
    }, 500);
  }
}

// Global window attachments
window.createCashfreeOrderSession = createCashfreeOrderSession;
window.verifyPaymentWithBackoff = verifyPaymentWithBackoff;
window.checkPendingPaymentOnResume = checkPendingPaymentOnResume;
window.checkExistingPaidOrder = checkExistingPaidOrder;
