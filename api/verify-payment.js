const { db } = require('./firebase');
const { handleCORS, enforcePost, getCashfreeCredentials, verifyAuth, generateRequestId, checkRateLimit } = require('./middleware');
const { fetchCreditDocs, applyCreditWrites } = require('./referral-helpers');
const { validateVerifyPaymentPayload } = require('./validation/verifyPaymentSchema');

const WILL_PRICE_INR = 299;

module.exports = async function handler(req, res) {
  // 1. CORS
  if (handleCORS(req, res)) return res.status(200).end();
  if (enforcePost(req, res)) return;

  // 2. Cashfree credentials check
  const cashfree = getCashfreeCredentials(res);
  if (!cashfree) return;

  // 3. Zod Payload Validation
  const validation = validateVerifyPaymentPayload(req.body || {});
  if (!validation.success) {
    return res.status(400).json({ error: 'Invalid payload: order_id is required.' });
  }
  const { orderId } = validation.data;

  // 4. Firebase Authentication
  const auth = await verifyAuth(req, res);
  if (!auth) return;

  // 4b. Rate Limiting — Max 15 verification polls per 60s per user
  if (checkRateLimit(req, res, {
    windowMs: 60000,
    max: 15,
    keyPrefix: 'verify-payment',
    identifier: auth.uid,
    message: 'Too many payment verification attempts. Please wait a moment before trying again.'
  })) return;

  const requestId = generateRequestId();

  try {
    // 5. Ownership & Idempotency Check in Firestore
    if (db) {
      const orderRef = db.collection('orders').doc(orderId);
      const existingDoc = await orderRef.get();

      if (existingDoc.exists) {
        const orderData = existingDoc.data() || {};
        
        // Ownership Check
        if (orderData.uid && orderData.uid !== auth.uid) {
          console.warn(`[Forbidden Access] User ${auth.uid} attempted to access order belonging to ${orderData.uid}`);
          return res.status(403).json({ error: 'Unauthorized: Order belongs to a different user session.' });
        }

        // Idempotency Guard
        if (orderData.status === 'PAID') {
          console.log(`[Verify Idempotency] Order ${orderId} already marked PAID. requestId=${requestId}, uid=${auth.uid}`);
          return res.status(200).json({
            order_id: orderId,
            status: 'PAID',
            is_paid: true,
            amount: orderData.amount || WILL_PRICE_INR
          });
        }
      }
    }

    // 6. Fetch Order Status from Cashfree API
    const response = await fetch(`https://api.cashfree.com/pg/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'x-client-id': cashfree.appId,
        'x-client-secret': cashfree.secretKey,
        'x-api-version': '2023-08-01',
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`[Cashfree Verify Error] requestId=${requestId}, orderId=${orderId}, message=${result.message || 'Verification failed'}`);
      return res.status(response.status || 400).json({ error: result.message || 'Verification failed' });
    }

    // Use order-specific expectedAmount (stored at creation, after any discount) rather
    // than a hardcoded floor — prevents a ₹299 payment validating a ₹699 family-plan
    // order, or a discounted ₹249 payment failing its own legitimate verify check.
    const existingData = (db && (await db.collection('orders').doc(orderId).get()).data()) || {};
    const expectedAmount = existingData.expectedAmount || WILL_PRICE_INR;
    const isPaid = checkPaymentValid(result.order_status, result.order_amount, result.order_currency, expectedAmount);


    // 7. Atomic Transaction in Firestore
    if (db) {
      const admin = require('firebase-admin');
      const orderRef = db.collection('orders').doc(orderId);
      const auditLogRef = db.collection('auditLogs').doc(orderId);

      try {
        await db.runTransaction(async (t) => {
          // ── PHASE 1: ALL READS ──────────────────────────────────────────
          // Firestore Admin SDK requires all t.get() calls to complete before
          // any t.update() or t.set() is issued within the same transaction.
          const doc = await t.get(orderRef);
          const orderDocData = doc.exists ? doc.data() : {};
          const creditRedeemed = orderDocData.creditRedeemed || 0;
          const referredBy = orderDocData.referredBy || null;

          const creditParams = { payerUid: auth.uid, referredBy, creditRedeemed, isPaid };
          const { payerCreditDoc, referrerCreditDoc } = await fetchCreditDocs(t, db, creditParams);

          // ── PHASE 2: ALL WRITES ─────────────────────────────────────────
          if (doc.exists) {
            t.update(orderRef, {
              status: isPaid ? 'PAID' : result.order_status,
              amount_paid: result.order_amount,
              currency: result.order_currency,
              verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
              paidAt: isPaid ? admin.firestore.FieldValue.serverTimestamp() : null
            });
          } else {
            t.set(orderRef, {
              orderId: orderId,
              uid: auth.uid,
              email: auth.email || null,
              status: isPaid ? 'PAID' : result.order_status,
              amount: result.order_amount,
              currency: result.order_currency,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
              paidAt: isPaid ? admin.firestore.FieldValue.serverTimestamp() : null
            });
          }

          applyCreditWrites(t, db, admin, {
            orderId, ...creditParams, payerCreditDoc, referrerCreditDoc
          });

          t.set(auditLogRef, {
            event: isPaid ? 'Payment Success & Verified' : 'Payment Verification Failed',
            orderId: orderId,
            status: result.order_status,
            amount: result.order_amount,
            currency: result.order_currency,
            isPaidConfirmed: isPaid,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        });

      } catch (dbError) {
        console.error(`[Firestore Exception] requestId=${requestId}, orderId=${orderId}, error=${dbError.message}`);
      }
    }

    console.log(`[Order Verified] requestId=${requestId}, uid=${auth.uid}, orderId=${orderId}, status=${result.order_status}, isPaid=${isPaid}`);

    return res.status(200).json({
      order_id: result.order_id,
      status: result.order_status,
      is_paid: isPaid,
      amount: result.order_amount
    });

  } catch (error) {
    console.error(`[Serverless Exception] requestId=${requestId}, orderId=${orderId}, error=${error.message}`);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

/**
 * Pure payment validity predicate — exported for direct unit testing.
 * No Firebase, no network calls. Tests import this function directly so
 * tests cover the actual shipped code, not a reimplementation of it.
 *
 * @param {string} cfStatus       - Cashfree order_status ('PAID', 'ACTIVE', etc.)
 * @param {string|number} cfAmount - Cashfree order_amount
 * @param {string} cfCurrency     - Cashfree order_currency
 * @param {number} expectedAmount  - Amount stored on order doc at creation (post-discount)
 * @returns {boolean}
 */
function checkPaymentValid(cfStatus, cfAmount, cfCurrency, expectedAmount) {
  return cfStatus === 'PAID'
    && Number(cfAmount) === expectedAmount
    && cfCurrency === 'INR';
}

// Note: calculateReferralDiscount and processReferralRewardState live in
// referral-helpers.js — the single source of truth for referral financial logic.
module.exports.checkPaymentValid = checkPaymentValid;


