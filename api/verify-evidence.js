/**
 * SmartWill India — Evidence Verification API Endpoint (Vercel Serverless Function)
 * 
 * Authenticates client requests via Firebase ID token, checks will ownership in Firestore,
 * downloads document bytes directly from private cloud storage, verifies reviewer credentials,
 * and records immutable verification tickets in Firestore.
 * 
 * POST /api/verify-evidence
 * Headers:
 *   Authorization: Bearer <Firebase_ID_Token>
 *   Content-Type: application/json
 * 
 * Body:
 *   {
 *     "willId": "will-123",
 *     "documentStorageId": "users/uid/wills/will-123/evidence/doc.pdf",
 *     "documentMetadata": { "documentType": "...", ... },
 *     "reviewer": { "verifiedBy": "...", "reviewerRole": "...", "enrollmentNumber": "..." },
 *     "subjectId": "...",
 *     "parcelId": "...",
 *     "documentVersion": 1,
 *     "claimedStatutoryFact": "..."
 *   }
 * 
 * Version: 2.1.3 (Revision 13 Forensic Standard)
 */

const { admin, db } = require('./firebase');
const { handleCORS, enforcePost, verifyAuth, checkRateLimit } = require('./middleware');
const { registerAndVerifyEvidence } = require('../functions/evidenceVerificationEngine.cjs');

async function handler(req, res) {
  // 1. CORS Preflight
  if (handleCORS(req, res)) return res.status(200).end();

  // 2. Enforce POST Method
  if (enforcePost(req, res)) return;

  // 3. Authenticate User via Firebase ID Token (P0-3)
  const auth = await verifyAuth(req, res);
  if (!auth) return;

  // 4. Rate Limiting (20 verification requests per minute per authenticated user)
  if (checkRateLimit(req, res, {
    windowMs: 60000,
    max: 20,
    keyPrefix: 'verify-evidence',
    identifier: auth.uid,
    message: 'Too many evidence verification requests. Please wait a moment before trying again.'
  })) return;

  // 5. Reject Client-Supplied Document Bytes (P0-2)
  if (req.body && req.body.documentBytes !== undefined) {
    return res.status(400).json({
      success: false,
      error: 'Invalid request: Submitting raw document bytes from client is prohibited. Documents must be retrieved from private cloud storage.',
      blockerCode: 'ERR_CLIENT_BYTES_PROHIBITED'
    });
  }

  try {
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
    } = req.body || {};

    const cleanWillId = (willId || '').trim();
    const cleanStorageId = (documentStorageId || storageId || '').trim();

    if (!cleanWillId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request: willId is mandatory and must be a non-empty string.',
        blockerCode: 'ERR_WILL_BINDING_REQUIRED'
      });
    }

    if (!cleanStorageId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request: documentStorageId is mandatory.',
        blockerCode: 'ERR_INVALID_STORAGE_ID'
      });
    }

    // 6. Firestore Will Ownership Verification (P0-3: Authorization)
    let willDoc;
    try {
      willDoc = await db.collection('wills').doc(cleanWillId).get();
    } catch (dbErr) {
      console.error('[Firestore Will Lookup Error]', dbErr.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to access will repository.',
        blockerCode: 'ERR_WILL_LOOKUP_FAILED'
      });
    }

    if (!willDoc.exists) {
      return res.status(404).json({
        success: false,
        error: `Will '${cleanWillId}' does not exist.`,
        blockerCode: 'ERR_WILL_NOT_FOUND'
      });
    }

    const willData = willDoc.data() || {};
    const willOwnerUid = willData.userId || willData.ownerId || willData.uid;
    if (willOwnerUid !== auth.uid) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: Authenticated user '${auth.uid}' is not the owner of will '${cleanWillId}'. Cross-user access is prohibited.`,
        blockerCode: 'ERR_FORBIDDEN_WILL_ACCESS'
      });
    }

    // 7. Private Cloud Storage Retrieval & Ownership Audit (P0-2, P0-3)
    let fileBytes;
    try {
      const bucket = admin.storage().bucket();
      const file = bucket.file(cleanStorageId);
      const [exists] = await file.exists();
      if (!exists) {
        return res.status(404).json({
          success: false,
          error: `Evidence document '${cleanStorageId}' was not found in private storage repository.`,
          blockerCode: 'ERR_STORAGE_OBJECT_NOT_FOUND'
        });
      }

      const [metadata] = await file.getMetadata();
      const customMeta = metadata.metadata || {};

      if (customMeta.userId && customMeta.userId !== auth.uid) {
        return res.status(403).json({
          success: false,
          error: `Storage object belongs to user '${customMeta.userId}', not authenticated user '${auth.uid}'.`,
          blockerCode: 'ERR_CROSS_USER_DOCUMENT_STORAGE'
        });
      }

      if (customMeta.willId && customMeta.willId !== cleanWillId) {
        return res.status(403).json({
          success: false,
          error: `Storage object is bound to will '${customMeta.willId}', not requested will '${cleanWillId}'.`,
          blockerCode: 'ERR_CROSS_WILL_DOCUMENT_STORAGE'
        });
      }

      const [downloaded] = await file.download();
      if (!downloaded || downloaded.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Stored document object contains 0 bytes.',
          blockerCode: 'ERR_EMPTY_DOCUMENT_BYTES'
        });
      }
      fileBytes = downloaded;
    } catch (storageErr) {
      console.error('[Cloud Storage Retrieval Error]', storageErr.message);
      return res.status(500).json({
        success: false,
        error: `Failed to retrieve document from private storage: ${storageErr.message}`,
        blockerCode: 'ERR_STORAGE_RETRIEVAL_FAILED'
      });
    }

    // 8. Authoritative Verification Engine with Firestore Persistence
    const ticket = await registerAndVerifyEvidence({
      user: { uid: auth.uid, email: auth.email },
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

    return res.status(200).json({
      success: true,
      ticket
    });
  } catch (error) {
    console.error('[Evidence Verification Error]', error.message);
    return res.status(500).json({
      success: false,
      error: error.message || 'Evidence verification failed.',
      blockerCode: 'ERR_VERIFICATION_FAILED'
    });
  }
}

module.exports = handler;
module.exports.default = handler;
