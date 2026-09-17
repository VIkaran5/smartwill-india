import { showToast } from '../ui/toast.js';
import { escapeHTML } from '../utils/sanitizer.js';
import { getState, updateState, resetState } from '../state/store.js';
import { logger } from './logger.js';
import { t } from '../i18n/index.js';
import { initCloudSync, initUserSync } from './cloudSync.js';
import { syncReferralAttribution, getReferralShareUrl, fetchUserReferralData } from './referral.js';
import { startSessionGuardian, stopSessionGuardian } from './sessionTimeout.js';

const firebaseConfig = {
  apiKey: "AIzaSyAFUIL7CyBs85Wq52-3Ax87qdzi2prGbV4",
  authDomain: "smartwill-india.firebaseapp.com",
  projectId: "smartwill-india",
  storageBucket: "smartwill-india.firebasestorage.app",
  messagingSenderId: "809704555018",
  appId: "1:809704555018:web:dfc747e0bdd796a5ad15f3",
  measurementId: "G-HGQ9XHMEWH"
};

let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;
export let currentUser = null;
let authListenerAttached = false;
let isSubmitting = false;

export function initAuthService() {
  if (typeof window.firebase !== 'undefined') {
    try {
      if (!window.firebase.apps.length) {
        firebaseApp = window.firebase.initializeApp(firebaseConfig);
      } else {
        firebaseApp = window.firebase.app();
      }
      firebaseAuth = window.firebase.auth();
      firebaseDb = window.firebase.firestore();
      logger.info('Firebase initialized successfully');

      // Fix 3: Properly handle redirect result — fires on page reload when
      // signInWithRedirect() is used as a fallback on mobile browsers.
      if (firebaseAuth.getRedirectResult) {
        firebaseAuth.getRedirectResult().then(async (result) => {
          if (result && result.user) {
            await handleGoogleSignInSuccess(result.user);
          }
        }).catch((redirectErr) => {
          // Suppress no-op / storage-partitioned noise; only log real errors
          if (redirectErr.code && redirectErr.code !== 'auth/no-current-user') {
            logger.warn('[Firebase Auth] Redirect result error:', redirectErr.message || redirectErr);
          }
        });
      }

      initCloudSync(firebaseDb);

      if (!authListenerAttached) {
        authListenerAttached = true;
        firebaseAuth.onAuthStateChanged((user) => {
          currentUser = user;
          window.currentUser = user;
          updateAuthUI(user);
          initUserSync(user);
          if (user) {
            closeAuthModal();
            syncUserWillData(user);
            syncReferralAttribution(user);
            startSessionGuardian(user);
          } else {
            stopSessionGuardian();
          }
        });
      }
    } catch (e) {
      logger.warn('Firebase init warning', e);
    }
  }
}

export function updateAuthUI(user) {
  const authNavContainers = document.querySelectorAll('.auth-nav-box, .auth-nav-box-mobile');

  authNavContainers.forEach(container => {
    if (user) {
      const rawDisplayName = user.displayName || (user.email ? user.email.split('@')[0] : 'User');
      const displayName = escapeHTML(rawDisplayName);
      const safeEmail = escapeHTML(user.email || '');
      const photoURL = user.photoURL ? escapeHTML(user.photoURL) : `https://ui-avatars.com/api/?name=${encodeURIComponent(rawDisplayName)}&background=2563eb&color=fff`;

      const isUnverified = user.providerData && user.providerData[0] && user.providerData[0].providerId === 'password' && !user.emailVerified;
      const statusBadge = isUnverified 
        ? `<div class="mt-2 pt-2 flex align-center justify-between gap-2" style="border-top:1px solid var(--border-light);">
             <span class="text-xs flex align-center gap-1" style="color:#f59e0b; font-weight:600; font-size:0.75rem;">⚠️ Unverified</span>
             <button type="button" class="btn btn-gold text-xs" style="font-size:0.7rem; padding:3px 8px; border-radius:4px;" onclick="resendEmailVerificationLink()">📩 Resend Link</button>
           </div>`
        : `<div class="mt-1"><span class="text-xs" style="color:#10b981; font-weight:600; font-size:0.75rem;">✓ Email Verified</span></div>`;

      container.innerHTML = `
        <div class="user-profile-menu flex align-center gap-2">
          <div class="cloud-sync-badge"></div>
          <button type="button" class="user-profile-btn btn btn-outline btn-sm flex align-center gap-2">
            <img src="${photoURL}" alt="${displayName}" class="user-avatar-img" style="width:24px;height:24px;border-radius:50%;">
            <span class="user-name-text">${displayName}</span>
            <i data-lucide="chevron-down" style="width:14px; height:14px;"></i>
          </button>
          <div class="user-dropdown-menu hidden">
            <div class="dropdown-header mb-2 pb-2">
              <p class="font-bold text-sm" style="color:var(--text-main); margin:0 0 2px;">${displayName}</p>
              <p class="text-xs text-muted" style="margin:0;">${safeEmail}</p>
              ${statusBadge}
            </div>
            <button type="button" class="dropdown-item btn btn-outline btn-sm w-full mb-2 flex align-center gap-2" style="text-align:left; justify-content:flex-start;" onclick="openDashboardModal()">
              <i data-lucide="layout-dashboard" style="width:16px; height:16px; color:var(--accent-gold);"></i>
              <span style="font-weight:600;">My Dashboard</span>
            </button>
            <a href="app.html" class="dropdown-item btn btn-outline btn-sm w-full mb-2 flex align-center gap-2" style="text-align:left; justify-content:flex-start; text-decoration:none;">
              <i data-lucide="file-text" style="width:16px; height:16px; color:var(--text-muted);"></i>
              <span>Edit Will Form</span>
            </a>
            <button type="button" class="dropdown-item btn btn-danger btn-sm w-full flex align-center gap-2" style="text-align:left; justify-content:flex-start; background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.4); color:#ef4444;" onclick="handleSignOut()">
              <i data-lucide="log-out" style="width:16px; height:16px; color:#ef4444;"></i>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      `;
      
      const emailInput = document.getElementById('email');
      if (emailInput && !emailInput.value) emailInput.value = user.email;
      
      const nameInput = document.getElementById('fullName');
      if (nameInput && !nameInput.value && user.displayName) nameInput.value = user.displayName;

    } else {
      container.innerHTML = `
        <button type="button" class="btn btn-outline btn-sm" onclick="openAuthModal('signin')">
          Sign In
        </button>
        <button type="button" class="btn btn-primary btn-sm" onclick="openAuthModal('signup')">
          Sign Up
        </button>
      `;
    }
  });

  if (window.lucide) window.lucide.createIcons();
  bindDropdownEvents();
}

function bindDropdownEvents() {
  document.querySelectorAll('.user-profile-menu').forEach(menuContainer => {
    const btn = menuContainer.querySelector('.user-profile-btn');
    const menu = menuContainer.querySelector('.user-dropdown-menu');
    if (btn && menu) {
      btn.onclick = (e) => {
        e.stopPropagation();
        document.querySelectorAll('.user-dropdown-menu').forEach(m => {
          if (m !== menu) m.classList.add('hidden');
        });
        menu.classList.toggle('hidden');
      };
    }
  });

  document.onclick = (e) => {
    if (!e.target.closest('.user-profile-menu')) {
      document.querySelectorAll('.user-dropdown-menu').forEach(m => m.classList.add('hidden'));
    }
  };
}

export function openAuthModal(mode = 'signin') {
  const modal = document.getElementById('authModal');
  if (!modal) return;

  // GUARD: If already signed in, block the modal — show helpful toast instead
  if (currentUser) {
    showToast('info', 'Already Signed In ✅', `You are signed in as ${escapeHTML(currentUser.email || currentUser.displayName || 'User')}. Tap your profile to sign out first.`);
    return;
  }

  const title = document.getElementById('authModalTitle');
  const tabSignin = document.getElementById('tabSignin');
  const tabSignup = document.getElementById('tabSignup');
  const formSignin = document.getElementById('formSignin');
  const formSignup = document.getElementById('formSignup');

  if (mode === 'signup') {
    if (title) title.textContent = 'Create Your SmartWill Account';
    if (tabSignin) tabSignin.classList.remove('active');
    if (tabSignup) tabSignup.classList.add('active');
    if (formSignin) formSignin.classList.add('hidden');
    if (formSignup) formSignup.classList.remove('hidden');
  } else {
    if (title) title.textContent = 'Sign In to SmartWill India';
    if (tabSignin) tabSignin.classList.add('active');
    if (tabSignup) tabSignup.classList.remove('active');
    if (formSignin) formSignin.classList.remove('hidden');
    if (formSignup) formSignup.classList.add('hidden');
  }

  // Clear previous form inputs when reopening
  const emailInput = document.getElementById('signinEmail');
  const passInput = document.getElementById('signinPassword');
  if (emailInput) emailInput.value = '';
  if (passInput) passInput.value = '';

  modal.classList.remove('hidden');
}

export function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.add('hidden');
}

export async function openDashboardModal() {
  const modal = document.getElementById('dashboardModal');
  if (!modal) return;

  const content = document.getElementById('dashboardWillList');
  if (content) {
    const state = getState();
    const p = state.personal || {};
    const user = currentUser || (firebaseAuth && firebaseAuth.currentUser);
    const shareUrl = user ? getReferralShareUrl(user) : window.location.origin;
    const refData = user && firebaseDb ? await fetchUserReferralData(user, firebaseDb) : { balance: 0, totalEarned: 0, totalReferred: 0 };
    const waText = encodeURIComponent(`Hi! I created my legally valid Will online in 10 minutes with SmartWill India. Protect your family's assets here: ${shareUrl}`);

    const displayName = user ? (user.displayName || p.fullName || 'Registered User') : (p.fullName || 'Guest User');
    const userEmail = user ? (user.email || p.email || 'Active Account') : (p.email || 'Local Draft Session');
    const initial = displayName ? displayName.charAt(0).toUpperCase() : 'U';
    const isVerified = user ? Boolean(user.emailVerified) : false;

    // ── Check for Paid Order in Firestore or LocalStorage ──
    let paidOrder = null;
    if (user && firebaseDb) {
      try {
        const ordersSnap = await firebaseDb.collection('orders')
          .where('uid', '==', user.uid)
          .where('status', '==', 'PAID')
          .limit(1)
          .get();
        if (!ordersSnap.empty) {
          paidOrder = ordersSnap.docs[0].data();
          const orderId = paidOrder.orderId || ordersSnap.docs[0].id;
          try {
            localStorage.setItem('sw_paid_order_' + user.uid, JSON.stringify({ orderId, ...paidOrder }));
            localStorage.setItem('sw_is_paid', '1');
            localStorage.setItem('sw_last_paid_order_id', orderId);
          } catch (e) {}
        }
      } catch (err) {
        logger.warn('Error querying user orders:', err);
      }
    }

    if (!paidOrder && user) {
      try {
        const cached = localStorage.getItem('sw_paid_order_' + user.uid);
        if (cached) paidOrder = JSON.parse(cached);
      } catch (e) {}
    }

    const isPaid = !!paidOrder;
    const paidOrderId = paidOrder ? (paidOrder.orderId || '') : '';
    const cleanRef = paidOrderId ? paidOrderId.replace(/^SW_/, '').slice(-8).toUpperCase() : '';
    const paidAmount = paidOrder ? (paidOrder.amount || 299) : 299;
    const isDiscounted = isPaid && paidAmount < 299;

    const willTitle = p.fullName 
      ? `${escapeHTML(p.fullName)}'s ${isPaid ? 'Legal Will & Testament' : 'Draft Will'}` 
      : (isPaid ? "Official Legal Will & Testament" : "Draft Legal Will & Testament");
    const assetCount = (state.assets || []).length;
    const benCount = (state.beneficiaries || []).length;
    const executorName = (state.executor && state.executor.name) ? escapeHTML(state.executor.name) : 'Not Specified';
    const city = p.addressCity ? escapeHTML(p.addressCity) : 'India';

    const statusBadge = isPaid
      ? `<span class="dashboard-badge-paid">✓ Paid &amp; Legally Validated</span>`
      : `<span class="dashboard-badge-active-draft">Active Draft</span>`;

    const docCountLabel = isPaid ? '1 Official Will' : '1 Active Draft';

    const willActions = isPaid
      ? `
        <button type="button" class="btn btn-gold btn-sm" style="display:inline-flex; align-items:center; gap:6px; font-weight:700;" onclick="handleDashboardDownload()">
          📥 Download Official PDF Document
        </button>
        <a href="app.html" class="btn btn-outline btn-sm" style="display:inline-flex; align-items:center; gap:6px;">
          ✏️ Edit &amp; Update Will
        </a>
      `
      : `
        <a href="app.html" class="btn btn-gold btn-sm" style="display:inline-flex; align-items:center; gap:6px; font-weight:600;">
          ✏️ Continue Editing Will
        </a>
        <button type="button" class="btn btn-outline btn-sm" style="display:inline-flex; align-items:center; gap:6px;" onclick="handleDashboardDownload()">
          📥 Download PDF Document
        </button>
      `;

    const paidMetaTags = isPaid
      ? `
        <span class="dashboard-will-meta-tag" style="color:var(--accent-emerald); font-weight:600;">🧾 Ref: SW-${cleanRef}</span>
        <span class="dashboard-will-meta-tag" style="color:var(--accent-emerald); font-weight:600;">💳 Paid ₹${paidAmount}</span>
      `
      : '';

    const discountNotice = isDiscounted
      ? `
        <div class="dashboard-discount-note">
          <span>💡 ₹${299 - paidAmount} referral discount redeemed on Order SW-${cleanRef}</span>
        </div>
      `
      : '';

    const userCodeSnippet = user && user.uid ? user.uid.slice(0, 10) : '';

    content.innerHTML = `
      <!-- User Profile Header -->
      <div class="dashboard-user-profile">
        <div class="dashboard-avatar">${initial}</div>
        <div class="dashboard-user-info">
          <h3>
            ${escapeHTML(displayName)}
            ${isVerified ? '<span class="dashboard-badge-verified">✓ Verified</span>' : ''}
          </h3>
          <p>${escapeHTML(userEmail)}</p>
        </div>
      </div>

      <!-- Quick Stats Strip -->
      <div class="dashboard-stats-strip">
        <div class="dashboard-stat-pill">
          <span class="label">📄 Documents</span>
          <span class="val">${docCountLabel}</span>
        </div>
        <div class="dashboard-stat-pill">
          <span class="label">🎁 Credits</span>
          <span class="val gold">₹${refData.balance}</span>
        </div>
        <div class="dashboard-stat-pill">
          <span class="label">🛡️ Security</span>
          <span class="val emerald">256-Bit SSL</span>
        </div>
      </div>

      <!-- Active Will Card -->
      <div class="dashboard-will-card">
        <div class="dashboard-will-header">
          <div class="dashboard-will-title-row">
            <div class="dashboard-will-title">📄 ${willTitle}</div>
            ${statusBadge}
          </div>
          <div class="dashboard-will-meta">
            <span class="dashboard-will-meta-tag">📍 ${city}</span>
            <span class="dashboard-will-meta-tag">📦 ${assetCount} Asset${assetCount === 1 ? '' : 's'}</span>
            <span class="dashboard-will-meta-tag">👥 ${benCount} Beneficiar${benCount === 1 ? 'y' : 'ies'}</span>
            <span class="dashboard-will-meta-tag">🛡️ Executor: ${executorName}</span>
            ${paidMetaTags}
          </div>
        </div>

        <div class="dashboard-will-actions">
          ${willActions}
        </div>
      </div>

      <!-- Referral Rewards Program Card -->
      <div class="dashboard-referral-box">
        <div class="dashboard-referral-header">
          <div>
            <h4>🎁 Invite Friends &amp; Earn ₹50 per Will</h4>
            <p>Share your personal invite link. When friends or family create their Will, they save ₹50 and you earn ₹50 credit towards your next Will!</p>
            ${discountNotice}
          </div>
          <div class="dashboard-referral-credit-pill">
            <div style="font-size:0.7rem; color:var(--text-subtle); text-transform:uppercase; font-weight:700;">Balance</div>
            <div class="amt">₹${refData.balance}</div>
            <div style="font-size:0.7rem; color:var(--text-muted);">(${refData.totalReferred} referred)</div>
          </div>
        </div>

        <div class="dashboard-referral-sharebar">
          <input type="text" id="referralShareInput" readonly value="${shareUrl}" class="dashboard-referral-input" onclick="this.select()">
          <button type="button" class="btn btn-outline btn-sm" onclick="copyReferralShareLink()" style="white-space:nowrap;">
            📋 Copy Link
          </button>
          <a href="https://api.whatsapp.com/send?text=${waText}" target="_blank" class="dashboard-btn-whatsapp">
            💬 Share on WhatsApp
          </a>
        </div>
        ${userCodeSnippet ? `<div style="font-size:0.75rem; color:var(--text-muted); margin-top:8px; display:flex; align-items:center; gap:6px;"><span>Your Code:</span> <code style="font-family:var(--font-mono); font-weight:700; color:var(--text-main); background:var(--bg-card); padding:2px 6px; border-radius:4px; border:1px solid var(--border-light);">${userCodeSnippet}</code></div>` : ''}
      </div>

      <!-- Account Management & Data Rights Footer -->
      <div class="dashboard-modal-footer">
        <div class="dashboard-data-rights">
          <button type="button" class="btn btn-outline btn-sm" onclick="handleDownloadMyData()">
            📥 Download My Data (JSON)
          </button>
          <button type="button" class="btn btn-outline btn-sm text-rose" style="border-color:rgba(244,63,94,0.35);" onclick="handleDeleteMyAccount()">
            🗑️ Delete Account &amp; Data
          </button>
        </div>
        <button type="button" class="btn btn-outline btn-sm" style="color:var(--text-muted);" onclick="handleSignOut()">
          🚪 Sign Out
        </button>
      </div>
    `;
  }
  modal.classList.remove('hidden');
}

export function copyReferralShareLink() {
  const input = document.getElementById('referralShareInput');
  if (input) {
    input.select();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(input.value).then(() => {
        showToast('success', 'Referral Link Copied! 📋', 'Share it with your friends & family.');
      }).catch(() => {
        document.execCommand('copy');
        showToast('success', 'Referral Link Copied! 📋', 'Share it with your friends & family.');
      });
    } else {
      document.execCommand('copy');
      showToast('success', 'Referral Link Copied! 📋', 'Share it with your friends & family.');
    }
  }
}

window.handleDashboardDownload = function () {
  if (typeof window.generateWillPDF === 'function') {
    const currentState = window.getWillState ? window.getWillState() : getState();
    window.generateWillPDF(currentState);
  } else {
    window.location.href = 'app.html?step=6&download=1';
  }
};

window.handleDownloadMyData = function () {
  const data = getState();
  const exportPayload = {
    meta: {
      exporter: 'SmartWill India',
      compliance: 'DPDP Act 2023 (Section 11 - Right to Access)',
      exportedAt: new Date().toISOString()
    },
    userData: data
  };
  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `smartwill-my-data-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('success', 'Data Exported! 📥', 'Your complete data has been downloaded as a JSON file.');
};

window.handleDeleteMyAccount = async function () {
  const firstConfirm = confirm('Are you sure you want to permanently delete your account and all stored Will data? This action cannot be undone.');
  if (!firstConfirm) return;
  const secondConfirm = confirm('FINAL CONFIRMATION: Your encrypted local draft and any cloud data will be permanently wiped.');
  if (!secondConfirm) return;

  try {
    localStorage.removeItem('smartwill_draft');
    localStorage.removeItem('sw_dpdp_consent');
    localStorage.removeItem('sw_pending_order_id');
    localStorage.removeItem('sw_last_paid_order_id');
    localStorage.removeItem('sw_is_paid');
    if (firebaseAuth && firebaseAuth.currentUser) {
      localStorage.removeItem('sw_paid_order_' + firebaseAuth.currentUser.uid);
    }
    resetState();

    if (firebaseAuth) {
      const user = firebaseAuth.currentUser;
      if (user) {
        if (firebaseDb) {
          try {
            await firebaseDb.collection('users').doc(user.uid).delete();
          } catch (_) {}
        }
        try {
          await user.delete();
        } catch (_) {}
      }
    }

    showToast('success', 'Account & Data Deleted', 'All your stored information has been permanently removed.');
    setTimeout(() => { window.location.href = '/'; }, 1200);
  } catch (err) {
    console.error('Account deletion error', err);
    showToast('error', 'Deletion Notice', 'Local data cleared. For cloud profile deletion, email smartwillindia.help@gmail.com');
  }
};


export function closeDashboardModal() {
  const modal = document.getElementById('dashboardModal');
  if (modal) modal.classList.add('hidden');
}

export async function handleSignOut() {
  stopSessionGuardian();
  try {
    if (firebaseAuth) {
      await firebaseAuth.signOut();
    }
  } catch (err) {
    logger.warn('Sign out error', err);
  }
  currentUser = null;
  window.currentUser = null;
  resetState(); // Reset local store state (clears personal info, assets, beneficiaries)
  updateAuthUI(null);
  closeAuthModal();
  closeDashboardModal();
  showToast('info', 'Signed Out 👋', 'You have been signed out successfully.');
}

export async function resendEmailVerificationLink() {
  if (!firebaseAuth || !firebaseAuth.currentUser) {
    showToast('error', 'Not Signed In', 'Please sign in to resend verification email.');
    return;
  }
  const user = firebaseAuth.currentUser;
  showToast('loading', 'Sending Email...', `Dispatching verification link to ${user.email}`);
  try {
    await user.sendEmailVerification();
    showToast('success', 'Verification Link Sent! 📩', `Check your inbox (${user.email}) or spam folder for the link.`);
  } catch (err) {
    logger.error('Resend verification error', err);
    showToast('error', 'Could Not Send', err.message || 'Error sending verification link');
  }
}

function getLocalizedAuthErrorMessage(errorCode) {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return t('auth.error.emailInUse');
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return t('auth.error.wrongPassword');
    case 'auth/user-not-found':
      return t('auth.error.userNotFound');
    case 'auth/weak-password':
      return t('auth.error.weakPassword');
    case 'auth/invalid-email':
      return t('auth.error.invalidEmail');
    case 'auth/popup-closed-by-user':
      return t('auth.error.popupClosed');
    case 'auth/unauthorized-domain':
      return 'Sign-in blocked: open Firebase Console → Authentication → Settings → Authorized Domains → Add "localhost".';
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is not enabled. Go to Firebase Console → Authentication → Sign-in method → Enable Email/Password.';
    case 'auth/network-request-failed':
      return 'No internet connection. Check your WiFi or mobile data and try again.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please wait a few minutes then try again.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please create a new account first.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again or reset your password.';
    default:
      if (typeof errorCode === 'string' && (errorCode.includes('storage-partitioned') || errorCode.includes('missing initial state') || errorCode.includes('sessionStorage'))) {
        return 'Google Sign-In is restricted in mobile browser mode by privacy rules. Please use Email & Password below.';
      }
      return t('auth.error.generic');
  }
}

export async function handleEmailSignUp(email, password, fullName) {
  if (isSubmitting) return;
  if (!firebaseAuth) {
    showToast('error', 'Auth Error', 'Authentication service unavailable.');
    return;
  }

  const submitBtn = document.querySelector('#formSignup button[type="submit"]');
  const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Create Account';

  try {
    isSubmitting = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `⏳ Creating Account...`;
    }

    const credential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
    const user = credential.user;

    if (fullName && user.updateProfile) {
      await user.updateProfile({ displayName: fullName });
    }

    // Update store state with the new user's information
    updateState({
      personal: {
        fullName: fullName || '',
        email: email || ''
      }
    });

    try {
      await user.sendEmailVerification();
    } catch (verr) {
      logger.warn('Initial verification email failed', verr);
    }

    if (firebaseDb && user) {
      await firebaseDb.collection('users').doc(user.uid).set({
        fullName: fullName || '',
        email: email || '',
        updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }

    showToast('success', 'Account Created! 🎉', 'Welcome to SmartWill India. Check your inbox for verification link.');
    closeAuthModal();
  } catch (err) {
    logger.error('Registration failed', err);
    const localizedMsg = getLocalizedAuthErrorMessage(err.code);
    showToast('error', 'Registration Failed', localizedMsg);
  } finally {
    isSubmitting = false;
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  }
}

export async function handleEmailSignIn(email, password) {
  if (isSubmitting) return;
  if (!firebaseAuth) {
    showToast('error', 'Auth Error', 'Authentication service unavailable.');
    return;
  }

  const submitBtn = document.querySelector('#formSignin button[type="submit"]');
  const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Sign In';

  try {
    isSubmitting = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `⏳ Signing In...`;
    }

    await firebaseAuth.signInWithEmailAndPassword(email, password);
    showToast('success', 'Signed In! 👋', 'Welcome back to SmartWill India.');
    closeAuthModal();
  } catch (err) {
    logger.error('Sign-in failed', err);
    const localizedMsg = getLocalizedAuthErrorMessage(err.code);
    showToast('error', 'Sign In Failed', localizedMsg);
  } finally {
    isSubmitting = false;
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  }
}

export async function handleGoogleSignIn() {
  if (isSubmitting) return;
  if (!firebaseAuth) {
    showToast('error', 'Auth Error', 'Authentication service unavailable.');
    return;
  }

  const googleBtn = document.querySelector('#authModal button[onclick="handleGoogleSignIn()"]') || document.getElementById('googleSignInBtn');
  const originalBtnText = googleBtn ? googleBtn.innerHTML : 'Continue with Google';

  try {
    isSubmitting = true;
    if (googleBtn) {
      googleBtn.disabled = true;
      googleBtn.innerHTML = `⏳ Connecting to Google...`;
    }

    const isNativeAndroid = !!(window.Capacitor && (window.Capacitor.isNativePlatform ? window.Capacitor.isNativePlatform() : window.Capacitor.platform === 'android'));

    let user = null;

    if (isNativeAndroid) {
      // ── Native Android App Google Auth ───────────────────────────────────
      try {
        const GoogleAuth = (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.GoogleAuth) ||
                           (window.Capacitor && window.Capacitor.CustomPlugins && window.Capacitor.CustomPlugins.GoogleAuth) ||
                           window.GoogleAuth;

        if (GoogleAuth) {
          // Fix 5: Do NOT pass clientId to initialize() — let capacitor.config.json's
          // serverClientId be used. Overriding it with the web client ID caused DEVELOPER_ERROR.
          if (typeof GoogleAuth.initialize === 'function') {
            await GoogleAuth.initialize({
              scopes: ['profile', 'email'],
              grantOfflineAccess: true
            });
          }
          const googleUser = await GoogleAuth.signIn();
          const idToken = (googleUser && googleUser.authentication && googleUser.authentication.idToken) || (googleUser && googleUser.idToken);

          if (idToken) {
            const credential = window.firebase.auth.GoogleAuthProvider.credential(idToken);
            const result = await firebaseAuth.signInWithCredential(credential);
            user = result.user;
          }
        } else {
          throw new Error('GoogleAuth plugin not found');
        }
      } catch (nativeErr) {
        logger.warn('Native Google Auth note:', nativeErr);
        const errorMsg = nativeErr.message || 'Google Sign-In canceled or unavailable. Please use Email Sign-In.';
        showToast('info', 'Google Sign-In', errorMsg);
        return;
      }
    } else {
      // ── Standard Web Browser (Desktop / Mobile Chrome) ──────────────────
      const provider = new window.firebase.auth.GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      try {
        const result = await firebaseAuth.signInWithPopup(provider);
        user = result.user;
      } catch (popupErr) {
        // Fix 2: Fallback to redirect when popup is blocked (common on mobile browsers).
        // The user is redirected to Google and returns to this page; the result is
        // then handled by getRedirectResult() in initAuthService().
        if (
          popupErr.code === 'auth/popup-blocked' ||
          popupErr.code === 'auth/operation-not-supported-in-this-environment'
        ) {
          showToast('info', 'Redirecting to Google... 🔄', 'Opening Google Sign-In. You will be brought back automatically.');
          await new Promise(resolve => setTimeout(resolve, 1200));
          await firebaseAuth.signInWithRedirect(provider);
          return; // Page reloads — result handled by getRedirectResult in initAuthService
        }
        // User simply closed the popup — gentle message, no redirect needed
        if (popupErr.code === 'auth/popup-closed-by-user') {
          showToast('info', 'Sign-In Cancelled', 'Google Sign-In window was closed. Try again or use Email below.');
          return;
        }
        throw popupErr;
      }
    }

    if (user) {
      await handleGoogleSignInSuccess(user);
    }
  } catch (err) {
    logger.error('Google sign-in failed', err);
    const localizedMsg = getLocalizedAuthErrorMessage(err.code || err.message);
    showToast('error', 'Google Sign-In Failed', localizedMsg);
  } finally {
    isSubmitting = false;
    if (googleBtn) {
      googleBtn.disabled = false;
      googleBtn.innerHTML = originalBtnText;
    }
  }
}

/**
 * Shared success handler for Google Sign-In (popup OR redirect flow).
 * Saves user data to Firestore and shows the welcome toast.
 */
async function handleGoogleSignInSuccess(user) {
  if (firebaseDb && user) {
    await firebaseDb.collection('users').doc(user.uid).set({
      fullName: user.displayName || '',
      email: user.email || '',
      photoURL: user.photoURL || '',
      updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }
  showToast('success', 'Google Sign-In Success! 🎉', `Welcome back, ${user.displayName || user.email}!`);
  closeAuthModal();
}

function syncUserWillData(user) {
  if (!user) return;
  try {
    if (firebaseDb) {
      firebaseDb.collection('users').doc(user.uid).collection('wills').doc('latest').get().then((doc) => {
        if (doc && doc.exists) {
          logger.info('Synced cloud draft Will.');
        }
      }).catch((e) => {
        logger.warn('Cloud draft sync note (Firestore API disabled or offline):', e.message || e);
      });
    }
  } catch (e) {
    logger.warn('Sync error', e);
  }
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initAuthService());
} else {
  initAuthService();
}

// Global window attachments
window.initAuthService = initAuthService;
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.handleSignOut = handleSignOut;
window.openDashboardModal = openDashboardModal;
window.closeDashboardModal = closeDashboardModal;
window.resendEmailVerificationLink = resendEmailVerificationLink;
window.handleEmailSignUp = handleEmailSignUp;
window.handleEmailSignIn = handleEmailSignIn;
window.handleGoogleSignIn = handleGoogleSignIn;
window.copyReferralShareLink = copyReferralShareLink;
window.updateAuthUI = updateAuthUI;
