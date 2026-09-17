const { db } = require('./firebase');
const { handleCORS, enforcePost, getCashfreeCredentials, verifyAuth, generateRequestId, checkRateLimit } = require('./middleware');
const { validateCreateOrderPayload } = require('./validation/createOrderSchema');
const { calculateReferralDiscount } = require('./referral-helpers');

const WILL_PRICE_INR = 299;
const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

module.exports = async function handler(req, res) {
  // 1. CORS
  if (handleCORS(req, res)) return res.status(200).end();
  if (enforcePost(req, res)) return;

  // 2. Cashfree credentials check
  const cashfree = getCashfreeCredentials(res);
  if (!cashfree) return;

  // 3. Firebase Authentication
  const auth = await verifyAuth(req, res);
  if (!auth) return;

  // 3b. Rate Limiting — Max 5 order creation attempts per 60s per user
  if (checkRateLimit(req, res, {
    windowMs: 60000,
    max: 5,
    keyPrefix: 'create-order',
    identifier: auth.uid,
    message: 'Too many order creation attempts. Please wait a minute before trying again.'
  })) return;

  // 4. Schema Validation with Zod
  const validation = validateCreateOrderPayload(req.body || {});
  if (!validation.success) {
    return res.status(400).json({
      error: 'Validation Error: Invalid payload attributes.',
      details: validation.error.flatten().fieldErrors
    });
  }

  const { name: customerName, phone: customerPhone, email: bodyEmail } = validation.data;
  const finalEmail = auth.email || bodyEmail || 'customer@smartwill.in';
  const requestId = generateRequestId();

  // 5. Idempotency Check — Reuse valid PENDING orders created < 15 mins ago
  // NOTE: Skipped for Android (https://localhost origin) because Android needs
  // a fresh order with a different return_url pointing to the pay.html relay page.
  const requestOrigin = req.headers.origin || '';
  const isAndroid = requestOrigin === 'https://localhost' || requestOrigin === 'capacitor://localhost';

  if (!isAndroid) {
    try {
      if (db) {
        const existingOrdersSnap = await db.collection('orders')
          .where('uid', '==', auth.uid)
          .where('status', '==', 'PENDING')
          .where('amount', '==', WILL_PRICE_INR)
          .where('currency', '==', 'INR')
          .limit(3)
          .get();

        if (!existingOrdersSnap.empty) {
          for (const doc of existingOrdersSnap.docs) {
            const order = doc.data();
            const createdAtMs = order.createdAt ? (order.createdAt.toMillis ? order.createdAt.toMillis() : Date.now()) : 0;

            if (Date.now() - createdAtMs < FIFTEEN_MINUTES_MS && order.cashfreeSessionId) {
              console.log(`[Idempotency Match] Reusing active pending order. requestId=${requestId}, uid=${auth.uid}, orderId=${doc.id}`);
              return res.status(200).json({
                payment_session_id: order.cashfreeSessionId,
                order_id: doc.id,
                reused: true
              });
            }
          }
        }
      }
    } catch (idempotencyErr) {
      console.warn('[Idempotency Note] Non-blocking read exception:', idempotencyErr.message);
    }
  }

  // 6. Create New Cashfree Payment Order
  try {
    const orderId = 'SW_' + require('crypto').randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase();
    const requestOriginHeader = req.headers.origin || '';
    const isAndroidReq = requestOriginHeader === 'https://localhost' || requestOriginHeader === 'capacitor://localhost';
    const appBaseUrl = 'https://smartwill-india.vercel.app';
    // Android uses Chrome Custom Tab with pay.html relay → return to pay.html
    // Web uses direct checkout → return to app.html
    const returnUrl = isAndroidReq
      ? `${appBaseUrl}/pay.html?order_id={order_id}`
      : `${appBaseUrl}/app.html?order_id={order_id}`;

    // Compute expectedAmount AFTER any discount logic (Gap 3).
    // calculateReferralDiscount in referral-helpers.js is the single source of
    // truth — create-order.js does not contain a copy of the discount math.
    let creditRedeemed = 0;
    let expectedAmount = WILL_PRICE_INR; // default: full price, no credit
    let referredBy = null;

    if (db) {
      try {
        // 1. Read user profile for attribution (server-authoritative)
        const userDoc = await db.collection('users').doc(auth.uid).get();
        if (userDoc.exists) {
          const userData = userDoc.data() || {};
          // Reject self-referral
          if (userData.referredBy && userData.referredBy !== auth.uid) {
            referredBy = userData.referredBy;
          }
        }

        // 2. Check user's referral credit balance.
        // Calls the shared calculateReferralDiscount — no inline copy.
        const creditDoc = await db.collection('referralCredits').doc(auth.uid).get();
        if (creditDoc.exists) {
          const availableBalance = (creditDoc.data() || {}).balance || 0;
          ({ creditRedeemed, expectedAmount } = calculateReferralDiscount(availableBalance, WILL_PRICE_INR));
        }
      } catch (err) {
        console.warn(`[Referral Check Note] requestId=${requestId}, error=${err.message}`);
      }
    }


    const payload = {
      order_id: orderId,
      order_amount: expectedAmount,
      order_currency: 'INR',
      customer_details: {
        customer_id: auth.uid,
        customer_name: customerName,
        customer_email: finalEmail,
        customer_phone: customerPhone
      },
      order_meta: {
        return_url: returnUrl
      }
    };

    const cfResponse = await fetch('https://api.cashfree.com/pg/orders', {
      method: 'POST',
      headers: {
        'x-client-id': cashfree.appId,
        'x-client-secret': cashfree.secretKey,
        'x-api-version': '2023-08-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const cfResult = await cfResponse.json();

    if (!cfResponse.ok) {
      console.error(`[Cashfree Error] requestId=${requestId}, uid=${auth.uid}, message=${cfResult.message || 'Payment session creation failed'}`);
      return res.status(cfResponse.status || 400).json({ error: cfResult.message || cfResult.type || 'Cashfree payment error' });
    }

    console.log(`[Order Created] requestId=${requestId}, uid=${auth.uid}, orderId=${orderId}, expectedAmount=${expectedAmount}, creditRedeemed=${creditRedeemed}, referredBy=${referredBy}`);

    // Persist pending order to Firestore
    if (db) {
      const admin = require('firebase-admin');
      await db.collection('orders').doc(orderId).set({
        orderId: orderId,
        uid: auth.uid,
        email: finalEmail,
        amount: expectedAmount,
        expectedAmount: expectedAmount,
        creditRedeemed: creditRedeemed,
        referredBy: referredBy,
        currency: 'INR',
        status: 'PENDING',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        cashfreeSessionId: cfResult.payment_session_id
      });

      // Intent marker on credit doc (reservation lifecycle resolved: no balance deducted yet)
      if (creditRedeemed > 0) {
        await db.collection('referralCredits').doc(auth.uid).set({
          creditPendingOrderId: orderId
        }, { merge: true });
      }
    }

    return res.status(200).json({
      payment_session_id: cfResult.payment_session_id,
      order_id: cfResult.order_id
    });
  } catch (error) {
    console.error(`[Serverless Exception] requestId=${requestId}, uid=${auth.uid}, error=${error.message}`);
    return res.status(500).json({ error: 'Internal server error processing payment request.' });
  }
}
