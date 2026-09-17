'use strict';

/**
 * SmartWill India — Referral Helpers (shared module)
 *
 * This is the single source of truth for all referral financial logic.
 * Both verify-payment.js (primary path) and reconcileOrders.js (backstop)
 * use fetchCreditDocs() then applyCreditWrites() from here — no duplicate
 * implementations, and no Firestore read-after-write violations.
 *
 * ## Firestore transaction ordering rule
 * The Admin SDK requires ALL t.get() calls to complete before ANY t.update()
 * or t.set() is issued within a single runTransaction() callback.
 *
 * To enforce this, creditReferrer logic is split into two explicit phases:
 *
 *   Phase 1 — fetchCreditDocs(t, db, ...)   → reads only, no writes
 *   Phase 2 — applyCreditWrites(t, admin, ...) → writes only, no reads
 *
 * Call sites (verify-payment.js, reconcileOrders.js) must:
 *   1. Do ALL t.get() calls (order doc + credit docs via fetchCreditDocs)
 *   2. Then do ALL t.update()/t.set() calls (applyCreditWrites + their own writes)
 *
 * All pure functions are exported for direct unit testing so tests import
 * and execute the real shipped code, not hand-written reimplementations.
 */

// ─────────────────────────────────────────────────────────────
// 1. Pure predicates — safe to import in any context (tests, server)
// ─────────────────────────────────────────────────────────────

/**
 * Computes the credit discount and resulting expected amount.
 * Single source of truth — used by create-order.js and tests.
 *
 * @param {number} balance   User's current referralCredits balance
 * @param {number} basePrice Base will price (default 299)
 * @returns {{ creditRedeemed: number, expectedAmount: number }}
 */
function calculateReferralDiscount(balance = 0, basePrice = 299) {
  const creditRedeemed = balance >= 50 ? 50 : 0;
  const expectedAmount = basePrice - creditRedeemed;
  return { creditRedeemed, expectedAmount };
}

/**
 * Pure state transition for crediting a referrer.
 * Enforces deduplication via creditedOrderIds array.
 * Returns shouldCredit=false and the unchanged state if already credited.
 *
 * @param {object} existingData  Current referralCredits/{referrerUid} document data
 * @param {string} orderId       Order being credited
 * @returns {{ shouldCredit: boolean, state: object }}
 */
function processReferralRewardState(existingData = {}, orderId) {
  const credited = existingData.creditedOrderIds || [];
  if (credited.includes(orderId)) {
    return { shouldCredit: false, state: existingData };
  }
  return {
    shouldCredit: true,
    state: {
      balance: (existingData.balance || 0) + 50,
      totalEarned: (existingData.totalEarned || 0) + 50,
      totalReferred: (existingData.totalReferred || 0) + 1,
      creditedOrderIds: [...credited, orderId]
    }
  };
}

/**
 * Validates referrer input for attribution.
 * Exported so attach-referral.js uses this and tests import the real logic.
 *
 * @param {string} authUid      The signed-in user's UID
 * @param {string} referrerUid  The candidate referrer UID
 * @returns {boolean}
 */
function validateReferrerInput(authUid, referrerUid) {
  if (!referrerUid || typeof referrerUid !== 'string' || !referrerUid.trim()) return false;
  if (referrerUid.trim() === authUid) return false; // self-referral forbidden
  return true;
}

/**
 * Checks whether a localStorage referral entry is valid and not expired.
 * Mirrors the expiry logic in js/services/referral.js getActiveReferral().
 * Exported for unit testing so tests call this, not a hand-written copy.
 *
 * @param {object|null} storedData  Parsed object from localStorage (or null)
 * @param {number} currentTime      Date.now() equivalent
 * @returns {boolean}
 */
function isReferralStorageActive(storedData, currentTime) {
  if (!storedData || !storedData.ref || !storedData.expiresAt) return false;
  return currentTime < storedData.expiresAt;
}

// ─────────────────────────────────────────────────────────────
// 2. Two-phase transaction helpers
//    Phase 1: reads only  — fetchCreditDocs()
//    Phase 2: writes only — applyCreditWrites()
//
// Call sites must call fetchCreditDocs() before any t.update()/t.set(),
// then pass the returned docs into applyCreditWrites() after all other reads.
// ─────────────────────────────────────────────────────────────

/**
 * PHASE 1 — READ ONLY. No writes issued.
 *
 * Fetches whichever referralCredits documents the write phase will need,
 * so the caller can complete all t.get() calls before issuing any writes.
 *
 * @param {object} t            Firestore transaction object
 * @param {object} db           Firestore admin instance
 * @param {string} payerUid     UID of the paying user
 * @param {string|null} referredBy  UID of the referrer (null if none)
 * @param {number} creditRedeemed   Amount payer is redeeming (0 if none)
 * @param {boolean} isPaid      Whether payment was confirmed PAID
 * @returns {Promise<{ payerCreditDoc, referrerCreditDoc }>}
 *   payerCreditDoc    — DocumentSnapshot or null (null when no read needed)
 *   referrerCreditDoc — DocumentSnapshot or null (null when no read needed)
 */
async function fetchCreditDocs(t, db, { payerUid, referredBy, creditRedeemed, isPaid }) {
  let payerCreditDoc = null;
  let referrerCreditDoc = null;

  if (isPaid) {
    if (creditRedeemed > 0) {
      payerCreditDoc = await t.get(db.collection('referralCredits').doc(payerUid));
    }
    if (referredBy && referredBy !== payerUid) {
      referrerCreditDoc = await t.get(db.collection('referralCredits').doc(referredBy));
    }
  } else {
    // Failed/cancelled: only need payer doc to clear the pending intent marker
    if (creditRedeemed > 0) {
      payerCreditDoc = await t.get(db.collection('referralCredits').doc(payerUid));
    }
  }

  return { payerCreditDoc, referrerCreditDoc };
}

/**
 * PHASE 2 — WRITE ONLY. No t.get() calls. Must be called after all reads.
 *
 * Issues all referral-related t.update()/t.set() operations using the
 * pre-fetched document snapshots from fetchCreditDocs().
 *
 * @param {object} t                  Firestore transaction object
 * @param {object} db                 Firestore admin instance
 * @param {object} admin              firebase-admin module
 * @param {string} orderId            The order being processed
 * @param {string} payerUid           UID of the paying user
 * @param {string|null} referredBy    UID of the referrer (null if none)
 * @param {number} creditRedeemed     Amount payer is redeeming (0 if none)
 * @param {boolean} isPaid            Whether payment was confirmed PAID
 * @param {object|null} payerCreditDoc     Pre-fetched payer credit snapshot
 * @param {object|null} referrerCreditDoc  Pre-fetched referrer credit snapshot
 */
function applyCreditWrites(t, db, admin, {
  orderId, payerUid, referredBy, creditRedeemed, isPaid,
  payerCreditDoc, referrerCreditDoc
}) {
  if (isPaid) {
    // 1. Deduct redeemed credit from payer
    if (creditRedeemed > 0 && payerCreditDoc && payerCreditDoc.exists) {
      const curBalance = payerCreditDoc.data().balance || 0;
      t.update(db.collection('referralCredits').doc(payerUid), {
        balance: Math.max(0, curBalance - creditRedeemed),
        creditPendingOrderId: null,
        lastRedeemedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // 2. Reward referrer (idempotent via processReferralRewardState)
    if (referredBy && referredBy !== payerUid && referrerCreditDoc) {
      const refData = referrerCreditDoc.exists ? referrerCreditDoc.data() : {};
      const { shouldCredit } = processReferralRewardState(refData, orderId);
      if (shouldCredit) {
        t.set(db.collection('referralCredits').doc(referredBy), {
          balance: (refData.balance || 0) + 50,
          totalEarned: (refData.totalEarned || 0) + 50,
          totalReferred: (refData.totalReferred || 0) + 1,
          creditedOrderIds: admin.firestore.FieldValue.arrayUnion(orderId),
          lastCreditedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }
    }
  } else {
    // Payment failed/cancelled: clear the intent marker so balance is not locked
    if (creditRedeemed > 0 && payerCreditDoc && payerCreditDoc.exists
        && payerCreditDoc.data().creditPendingOrderId === orderId) {
      t.update(db.collection('referralCredits').doc(payerUid), {
        creditPendingOrderId: null
      });
    }
  }
}

module.exports = {
  calculateReferralDiscount,
  processReferralRewardState,
  validateReferrerInput,
  isReferralStorageActive,
  fetchCreditDocs,
  applyCreditWrites
};
