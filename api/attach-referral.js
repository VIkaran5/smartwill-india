const { db } = require('./firebase');
const { handleCORS, enforcePost, verifyAuth, generateRequestId, checkRateLimit } = require('./middleware');
const { validateReferrerInput } = require('./referral-helpers');

/**
 * Server-authoritative referral attribution endpoint.
 *
 * Rules enforced:
 * 1. Must be authenticated with a valid Firebase ID token.
 * 2. Cannot refer oneself (referrerUid !== auth.uid).
 * 3. Referrer UID must exist as an actual user in Firestore.
 * 4. Write-once: if user already has `referredBy` set, it cannot be overwritten.
 */
module.exports = async function handler(req, res) {
  if (handleCORS(req, res)) return res.status(200).end();
  if (enforcePost(req, res)) return;

  const auth = await verifyAuth(req, res);
  if (!auth) return;

  // Rate Limiting — Max 6 attempts per 60s per user (prevents brute-forcing)
  if (checkRateLimit(req, res, {
    windowMs: 60000,
    max: 6,
    keyPrefix: 'attach-referral',
    identifier: auth.uid,
    message: 'Too many referral code attempts. Please wait a minute before trying again.'
  })) return;

  const requestId = generateRequestId();
  const { referrerUid } = req.body || {};

  // Use validateReferrerInput from referral-helpers — single source of truth
  if (!validateReferrerInput(auth.uid, referrerUid)) {
    const reason = !referrerUid ? 'referrerUid is required.' : 'Self-referral is not allowed.';
    return res.status(400).json({ error: `Validation Error: ${reason}` });
  }

  const cleanReferrer = referrerUid.trim();

  if (!db) {
    return res.status(500).json({ error: 'Database service unavailable.' });
  }


  try {
    const admin = require('firebase-admin');
    const userRef = db.collection('users').doc(auth.uid);
    const referrerRef = db.collection('users').doc(cleanReferrer);

    // Validate referrer exists
    const referrerDoc = await referrerRef.get();
    if (!referrerDoc.exists) {
      return res.status(404).json({ error: 'Referrer not found.' });
    }

    // Atomic write-once check
    let attached = false;
    await db.runTransaction(async (t) => {
      const userDoc = await t.get(userRef);
      if (userDoc.exists && userDoc.data().referredBy) {
        // Already attributed — do not overwrite
        return;
      }

      t.set(userRef, {
        referredBy: cleanReferrer,
        referredAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      attached = true;
    });

    console.log(`[Referral Attached] requestId=${requestId}, user=${auth.uid}, referrer=${cleanReferrer}, attached=${attached}`);

    return res.status(200).json({
      success: true,
      attached: attached,
      message: attached ? 'Referral successfully attached.' : 'Referral already set previously.'
    });

  } catch (err) {
    console.error(`[Referral Attach Exception] requestId=${requestId}, error=${err.message}`);
    return res.status(500).json({ error: 'Failed to process referral attribution.' });
  }
};
