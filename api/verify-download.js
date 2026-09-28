const { db } = require('./firebase');
const { handleCORS, enforcePost, verifyAuth, generateRequestId, checkRateLimit } = require('./middleware');

module.exports = async function handler(req, res) {
  // 1. CORS & HTTP Method
  if (handleCORS(req, res)) return res.status(200).end();
  if (enforcePost(req, res)) return;

  // 2. Firebase Authentication Required
  const auth = await verifyAuth(req, res);
  if (!auth) return;

  // 3. Rate Limiting — Max 20 download verifications per 60s per user
  if (checkRateLimit(req, res, {
    windowMs: 60000,
    max: 20,
    keyPrefix: 'verify-download',
    identifier: auth.uid,
    message: 'Too many PDF download verification requests. Please wait a moment.'
  })) return;

  const requestId = generateRequestId();
  const reqOrderId = (req.body && (req.body.order_id || req.body.orderId)) ? String(req.body.order_id || req.body.orderId).trim() : null;

  try {
    if (!db) {
      // Security (VULN-001): Fail closed — never authorize without database verification
      console.error(`[Download Verify] requestId=${requestId}, uid=${auth.uid}, error=Firestore unavailable`);
      return res.status(503).json({ authorized: false, error: 'Payment verification service temporarily unavailable. Please try again.' });
    }

    let paidOrder = null;

    // Check specific orderId if supplied
    if (reqOrderId) {
      const orderDoc = await db.collection('orders').doc(reqOrderId).get();
      if (orderDoc.exists) {
        const data = orderDoc.data() || {};
        if (data.uid === auth.uid && data.status === 'PAID') {
          paidOrder = { orderId: orderDoc.id, ...data };
        } else if (data.uid !== auth.uid) {
          console.warn(`[Security Alert] User ${auth.uid} attempted to claim order ${reqOrderId} owned by ${data.uid}`);
          return res.status(403).json({ authorized: false, error: 'Forbidden: Order belongs to a different account.' });
        }
      }
    }

    // If no specific orderId or not matched yet, check if user has ANY paid order
    if (!paidOrder) {
      const querySnap = await db.collection('orders')
        .where('uid', '==', auth.uid)
        .where('status', '==', 'PAID')
        .limit(1)
        .get();

      if (!querySnap.empty) {
        const data = querySnap.docs[0].data() || {};
        paidOrder = { orderId: querySnap.docs[0].id, ...data };
      }
    }

    if (!paidOrder) {
      console.warn(`[Download Blocked] User ${auth.uid} attempted PDF download without verified payment. requestId=${requestId}`);
      return res.status(403).json({
        authorized: false,
        error: 'Payment required: No verified paid order was found for this account.'
      });
    }

    // Log the download event for compliance / audit trail
    const admin = require('firebase-admin');
    db.collection('auditLogs').add({
      event: 'Will PDF Download Verified',
      orderId: paidOrder.orderId,
      uid: auth.uid,
      email: auth.email || null,
      requestId: requestId,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    }).catch(err => {
      console.warn('[Audit Log Note] Non-blocking audit write exception:', err.message);
    });

    console.log(`[Download Authorized] uid=${auth.uid}, orderId=${paidOrder.orderId}, requestId=${requestId}`);

    return res.status(200).json({
      authorized: true,
      orderId: paidOrder.orderId,
      verifiedAt: Date.now()
    });

  } catch (error) {
    console.error(`[Download Verify Error] requestId=${requestId}, uid=${auth.uid}, error=${error.message}`);
    return res.status(500).json({ authorized: false, error: 'Internal server error verifying document authorization.' });
  }
};
