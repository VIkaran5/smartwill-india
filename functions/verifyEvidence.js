/**
 * SmartWill India — Evidence Verification Cloud Function
 * 
 * Firebase Cloud Function (Callable & HTTP) for trusted backend evidence verification.
 * Authenticates user tokens, checks will context, computes SHA-256 binary hash,
 * validates reviewer credentials, and returns an authoritative verification ticket.
 * 
 * Version: 2.1.3 (Revision 12 Forensic Standard)
 */

let functions;
try {
  functions = require('firebase-functions');
} catch (e) {
  // Graceful fallback for root unit test environments where functions/ has separate package.json
  functions = {
    https: {
      onCall: (fn) => {
        const handler = (data, context) => fn(data, context);
        handler.run = fn;
        return handler;
      },
      HttpsError: class HttpsError extends Error {
        constructor(code, message) {
          super(message);
          this.code = code;
          this.name = 'HttpsError';
        }
      }
    }
  };
}
const admin = require('firebase-admin');
const { registerAndVerifyEvidence } = require('../server/evidenceVerificationEngine.cjs');

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Callable Cloud Function: verifyEvidence
 * Usage from Firebase Web/Mobile Client:
 *   const verifyEvidenceFn = httpsCallable(functions, 'verifyEvidence');
 *   const result = await verifyEvidenceFn({ willId: '...', documentStorageId: '...', ... });
 */
exports.verifyEvidence = functions.https.onCall(async (data, context) => {
  // 1. Mandatory Firebase Authentication
  if (!context.auth || !context.auth.uid) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'ERR_UNAUTHENTICATED_REQUEST: Evidence verification requires an authenticated Firebase user session.'
    );
  }

  const {
    willId,
    documentStorageId,
    storageId,
    documentBytes,
    documentMetadata,
    reviewer,
    subjectId,
    parcelId,
    documentVersion,
    claimedStatutoryFact
  } = data || {};

  const cleanStorageId = documentStorageId || storageId;
  if (!willId || typeof willId !== 'string' || willId.trim() === '') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'ERR_WILL_BINDING_REQUIRED: Evidence must be bound to a specific will identifier.'
    );
  }

  if (!cleanStorageId || typeof cleanStorageId !== 'string' || cleanStorageId.trim() === '') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'ERR_INVALID_STORAGE_ID: Storage identifier is mandatory.'
    );
  }

  try {
    let fileBytes = documentBytes;

    // If documentBytes is not directly supplied in payload, attempt fetching from Cloud Storage bucket
    if (!fileBytes && admin.storage) {
      try {
        const bucket = admin.storage().bucket();
        const file = bucket.file(cleanStorageId);
        const [downloaded] = await file.download();
        fileBytes = downloaded;
      } catch (storageErr) {
        console.warn('[Cloud Storage Fetch Warning]', storageErr.message);
      }
    }

    const ticket = registerAndVerifyEvidence({
      user: { uid: context.auth.uid, email: context.auth.token.email || '' },
      willId: willId.trim(),
      documentStorageId: cleanStorageId.trim(),
      documentBytes: fileBytes,
      documentMetadata: documentMetadata || {},
      reviewer: reviewer || {},
      subjectId,
      parcelId,
      documentVersion: Number(documentVersion) || 1,
      claimedStatutoryFact
    });

    return {
      success: true,
      ticket
    };
  } catch (err) {
    console.error('[Cloud Function Evidence Verification Error]', err.message);
    throw new functions.https.HttpsError('internal', err.message);
  }
});
