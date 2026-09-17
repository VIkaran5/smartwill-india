import { logger } from './logger.js';
import { showToast } from '../ui/toast.js';

const STORAGE_KEY = 'sw_referral';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Captures ?ref=<UID> from URL query parameters on page load.
 * Stores in localStorage with a 30-day expiration window.
 */
export function captureReferralFromURL() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref && typeof ref === 'string' && ref.trim().length > 0) {
      const cleanRef = ref.trim();
      const payload = {
        ref: cleanRef,
        expiresAt: Date.now() + THIRTY_DAYS_MS
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      logger.info(`[Referral] Captured referral code from URL: ${cleanRef}`);
    }
  } catch (err) {
    logger.warn('[Referral] Storage access note:', err.message);
  }
}

/**
 * Retrieves valid, unexpired referral code from localStorage.
 */
export function getActiveReferral() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data && data.ref && data.expiresAt && Date.now() < data.expiresAt) {
      return data.ref;
    }
    // Expired or malformed
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    logger.warn('[Referral] Read error:', err.message);
  }
  return null;
}

/**
 * Calls server-authoritative /api/attach-referral to attribute the user.
 * Cleans up localStorage once successfully processed.
 */
export async function syncReferralAttribution(user) {
  if (!user) return;
  const pendingRef = getActiveReferral();
  if (!pendingRef) return;

  // Don't attempt self-referral
  if (pendingRef === user.uid) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }

  try {
    const token = await user.getIdToken();
    const response = await fetch('/api/attach-referral', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ referrerUid: pendingRef })
    });

    const result = await response.json();
    if (response.ok) {
      logger.info('[Referral] Attribution response:', result);
      localStorage.removeItem(STORAGE_KEY);
    } else {
      logger.warn('[Referral] Attribution skipped/rejected:', result.error);
      // If referrer was not found or invalid, clear storage
      if (response.status === 404 || response.status === 400) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  } catch (err) {
    logger.warn('[Referral] Attribution sync network error:', err.message);
  }
}

/**
 * Returns the logged-in user's personalized referral link.
 */
export function getReferralShareUrl(user) {
  if (!user || !user.uid) return window.location.origin;
  const baseUrl = window.location.origin.includes('localhost')
    ? window.location.origin
    : 'https://smartwill-india.vercel.app';
  return `${baseUrl}/?ref=${user.uid}`;
}

/**
 * Fetches user referral credit balance and stats from Firestore.
 */
export async function fetchUserReferralData(user, db) {
  if (!user || !db) return { balance: 0, totalEarned: 0, totalReferred: 0 };
  try {
    const doc = await db.collection('referralCredits').doc(user.uid).get();
    if (doc.exists) {
      const data = doc.data() || {};
      return {
        balance: data.balance || 0,
        totalEarned: data.totalEarned || 0,
        totalReferred: data.totalReferred || 0
      };
    }
  } catch (err) {
    logger.warn('[Referral] Could not fetch referral balance:', err.message);
  }
  return { balance: 0, totalEarned: 0, totalReferred: 0 };
}

// Auto-capture on module load
captureReferralFromURL();
