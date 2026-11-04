/**
 * SmartWill India — Evidence Verification Cloud Function
 * 
 * Firebase Cloud Function for trusted backend evidence verification.
 * Authenticates user tokens, verifies Firestore will ownership, verifies Cloud Storage
 * object ownership, retrieves raw bytes from private bucket, verifies reviewer credentials,
 * and records immutable verification tickets in Firestore.
 * 
 * Version: 2.1.3 (Revision 13 Forensic Standard)
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
// Self-contained import inside functions/ package (no ../ parent directory traversal)
const { registerAndVerifyEvidence } = require('./evidenceVerificationEngine.cjs');

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Callable Cloud Function: verifyEvidence
 * 
 * Enforces:
 * 1. Mandatory Firebase Authentication
 * 2. Firestore Will Ownership Verification (Authorization)
 * 3. Rejection of client-supplied document bytes
 * 4. Private Storage retrieval & ownership audit
 * 5. Immutable ticket persistence in Firestore
 */
exports.verifyEvidence = functions.https.onCall(async (data, context) => {
  // 1. Mandatory Firebase Authentication
  if (!context.auth || !context.auth.uid) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'ERR_UNAUTHENTICATED_REQUEST: Evidence verification requires an authenticated Firebase user session.'
    );
  }

  // 2. Reject client-supplied raw bytes unconditionally (P0-2)
  if (data && data.documentBytes !== undefined) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'ERR_CLIENT_BYTES_PROHIBITED: Submitting raw document bytes from client payload is strictly prohibited. Documents must be retrieved from private cloud storage.'
    );
  }

  const {
    willId,
    documentStorageId,
    storageId,
    documentMetadata,
    reviewer,
    subjectId,
    parcelId,
    documentVersion,
    claimedStatutoryFact
  } = data || {};

  const cleanWillId = (willId || '').trim();
  const cleanStorageId = (documentStorageId || storageId || '').trim();

  if (!cleanWillId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'ERR_WILL_BINDING_REQUIRED: Evidence must be bound to a specific will identifier.'
    );
  }

  if (!cleanStorageId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'ERR_INVALID_STORAGE_ID: Storage identifier is mandatory.'
    );
  }

  const db = (context && context.db) || (data && data._testDb) || admin.firestore();

  // 3. Firestore Will Ownership Verification (P0-3: Authorization)
  let willDoc;
  try {
    willDoc = await db.collection('wills').doc(cleanWillId).get();
  } catch (err) {
    console.error('[Firestore Will Lookup Error]', err.message);
    throw new functions.https.HttpsError('internal', 'ERR_WILL_LOOKUP_FAILED: Failed to verify will record.');
  }

  if (!willDoc.exists) {
    throw new functions.https.HttpsError(
      'not-found',
      `ERR_WILL_NOT_FOUND: Will '${cleanWillId}' does not exist.`
    );
  }

  const willData = willDoc.data() || {};
  const willOwnerUid = willData.userId || willData.ownerId || willData.uid;
  if (willOwnerUid !== context.auth.uid) {
    throw new functions.https.HttpsError(
      'permission-denied',
      `ERR_FORBIDDEN_WILL_ACCESS: Authenticated user '${context.auth.uid}' is not the owner of will '${cleanWillId}'. Cross-user access is prohibited.`
    );
  }

  // 4. Private Cloud Storage Retrieval & Ownership Audit (P0-2, P0-3)
  let fileBytes;
  try {
    const bucket = (context && context.bucket) || (data && data._testBucket) || admin.storage().bucket();
    const file = bucket.file(cleanStorageId);
    const [exists] = await file.exists();
    if (!exists) {
      throw new functions.https.HttpsError(
        'not-found',
        `ERR_STORAGE_OBJECT_NOT_FOUND: Evidence document '${cleanStorageId}' was not found in private storage repository.`
      );
    }

    const [metadata] = await file.getMetadata();
    const customMeta = metadata.metadata || {};

    // Verify storage object ownership matches authenticated user and will
    if (customMeta.userId && customMeta.userId !== context.auth.uid) {
      throw new functions.https.HttpsError(
        'permission-denied',
        `ERR_CROSS_USER_DOCUMENT_STORAGE: Storage object belongs to user '${customMeta.userId}', not authenticated user '${context.auth.uid}'.`
      );
    }
    if (customMeta.willId && customMeta.willId !== cleanWillId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        `ERR_CROSS_WILL_DOCUMENT_STORAGE: Storage object is bound to will '${customMeta.willId}', not requested will '${cleanWillId}'.`
      );
    }

    const [downloaded] = await file.download();
    if (!downloaded || downloaded.length === 0) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'ERR_EMPTY_DOCUMENT_BYTES: Stored document object contains 0 bytes.'
      );
    }
    fileBytes = downloaded;
  } catch (storageErr) {
    if (storageErr.code && storageErr.message && storageErr.message.startsWith('ERR_')) {
      throw storageErr;
    }
    console.error('[Cloud Storage Retrieval Error]', storageErr.message);
    throw new functions.https.HttpsError('internal', `ERR_STORAGE_RETRIEVAL_FAILED: ${storageErr.message}`);
  }

  // 5. Authoritative Verification Pipeline with Firestore Persistence
  try {
    const ticket = await registerAndVerifyEvidence({
      user: { uid: context.auth.uid, email: context.auth.token?.email || '' },
      willId: cleanWillId,
      documentStorageId: cleanStorageId,
      documentBytes: fileBytes,
      documentMetadata: documentMetadata || {},
      reviewer: reviewer || {},
      subjectId,
      parcelId,
      documentVersion: Number(documentVersion) || 1,
      claimedStatutoryFact,
      db
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
