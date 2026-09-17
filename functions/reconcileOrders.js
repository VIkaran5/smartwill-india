/**
 * SmartWill India - Payment Reconciliation Cloud Function
 *
 * Runs hourly to reconcile orders stuck in PENDING because the user never
 * returned to trigger client-side verification (tab closed, app crash,
 * redirect failure). This is the server-side safety net alongside the
 * client-pull primary path in verify-payment.js.
 *
 * Design notes:
 * - Status update and referral credit are in ONE transaction. If the process
 *   crashes mid-function the order stays PENDING and the next run retries both.
 * - fetchCreditDocs/applyCreditWrites are imported from api/referral-helpers.js
 *   — the single source of truth shared with verify-payment.js.
 * - Transaction ordering: ALL t.get() calls (order doc + credit docs) happen
 *   before ANY t.update()/t.set(). This satisfies the Firestore Admin SDK
 *   constraint that reads must precede writes within a transaction.
 *
 * Deploy: firebase deploy --only functions:reconcileOrders
 *
 * NOTE: The composite Firestore query (status==PENDING + createdAt<cutoff)
 * requires a composite index. On first deploy, Firestore will throw an error
 * with a direct link to create it in the Firebase console - click it once.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { fetchCreditDocs, applyCreditWrites } = require('../api/referral-helpers');

if (!admin.apps.length) { admin.initializeApp(); }
const db = admin.firestore();

const STALE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes
const MAX_PER_RUN = 50; // cost + rate-limit protection

exports.reconcileOrders = functions.pubsub
  .schedule('every 60 minutes')
  .onRun(async (context) => {
    const runId = `reconcile_${Date.now()}`;
    console.log(`[Reconcile Start] runId=${runId}`);

    const cutoff = admin.firestore.Timestamp.fromMillis(Date.now() - STALE_THRESHOLD_MS);

    let staleSnap;
    try {
      staleSnap = await db.collection('orders')
        .where('status', '==', 'PENDING')
        .where('createdAt', '<', cutoff)
        .limit(MAX_PER_RUN)
        .get();
    } catch (err) {
      console.error(`[Reconcile] Query failed: ${err.message}`);
      return null;
    }

    if (staleSnap.empty) {
      console.log(`[Reconcile] No stale orders. runId=${runId}`);
      return null;
    }

    console.log(`[Reconcile] ${staleSnap.size} stale order(s). runId=${runId}`);

    // Use same env var names as middleware.js
    const appId = process.env.CASHFREE_CLIENT_ID || process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    if (!appId || !secretKey) {
      console.error('[Reconcile] Missing Cashfree credentials (CASHFREE_APP_ID / CASHFREE_SECRET_KEY)');
      return null;
    }

    const results = { reconciled: 0, failed: 0, skipped: 0 };

    for (const doc of staleSnap.docs) {
      const orderId = doc.id;
      const orderData = doc.data();

      try {
        const cfRes = await fetch(`https://api.cashfree.com/pg/orders/${orderId}`, {
          method: 'GET',
          headers: {
            'x-client-id': appId,
            'x-client-secret': secretKey,
            'x-api-version': '2023-08-01',
            'Content-Type': 'application/json'
          }
        });

        if (!cfRes.ok) {
          console.warn(`[Reconcile] Cashfree ${cfRes.status} for ${orderId} - skipping`);
          results.skipped++;
          continue;
        }

        const cfData = await cfRes.json();
        const cfStatus = cfData.order_status;

        // Cashfree still processing - not ready to close yet
        if (cfStatus === 'ACTIVE') { results.skipped++; continue; }

        // Use order-specific expectedAmount (stored at creation, post-discount)
        const expectedAmount = orderData.expectedAmount || 299;
        const isPaid = cfStatus === 'PAID'
          && Number(cfData.order_amount) === expectedAmount
          && cfData.order_currency === 'INR';

        const finalStatus = isPaid ? 'PAID' : (cfStatus === 'EXPIRED' ? 'EXPIRED' : cfStatus);

        const orderRef = db.collection('orders').doc(orderId);
        const auditRef = db.collection('auditLogs').doc(`reconcile_${orderId}`);

        const creditParams = {
          payerUid: orderData.uid,
          referredBy: orderData.referredBy || null,
          creditRedeemed: orderData.creditRedeemed || 0,
          isPaid
        };

        // Single transaction: status update + referral credit are one atomic commit.
        // Transaction ordering strictly enforced: ALL reads first, then ALL writes.
        await db.runTransaction(async (t) => {
          // ── PHASE 1: ALL READS ──────────────────────────────────────────
          const fresh = await t.get(orderRef);
          // Guard: client-pull (verify-payment.js) may have resolved this
          // concurrently. If status is no longer PENDING, skip silently.
          if (fresh.exists && fresh.data().status !== 'PENDING') return;

          // Pre-fetch whichever credit docs the write phase will need
          const { payerCreditDoc, referrerCreditDoc } = await fetchCreditDocs(t, db, creditParams);

          // ── PHASE 2: ALL WRITES ─────────────────────────────────────────
          t.update(orderRef, {
            status: finalStatus,
            amount_paid: cfData.order_amount,
            reconciledAt: admin.firestore.FieldValue.serverTimestamp(),
            paidAt: isPaid ? admin.firestore.FieldValue.serverTimestamp() : null
          });

          t.set(auditRef, {
            event: `Reconciliation: ${finalStatus}`,
            orderId, runId, cashfreeStatus: cfStatus, isPaid,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });

          // Referral credit writes — same logic as verify-payment.js (primary path),
          // one implementation, two callers.
          applyCreditWrites(t, db, admin, {
            orderId, ...creditParams, payerCreditDoc, referrerCreditDoc
          });
        });

        console.log(`[Reconcile] ${orderId} -> ${finalStatus}. runId=${runId}`);
        results.reconciled++;

      } catch (err) {
        console.error(`[Reconcile] Error on ${orderId}: ${err.message}`);
        results.failed++;
      }
    }

    console.log(`[Reconcile Done] runId=${runId}`, results);
    return null;
  });
