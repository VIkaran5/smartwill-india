/**
 * SmartWill India — Evidence Verification API Endpoint (Vercel Serverless Function)
 * 
 * Authenticates client requests via Firebase ID token, validates document storage references,
 * computes cryptographic checksums, checks reviewer credentials, and returns an authoritative
 * server verification ticket.
 * 
 * POST /api/verify-evidence
 * Headers:
 *   Authorization: Bearer <Firebase_ID_Token>
 *   Content-Type: application/json
 * 
 * Body:
 *   {
 *     "willId": "will-123",
 *     "documentStorageId": "DOC-STORE-...",
 *     "documentBytes": "base64 or raw string",
 *     "documentMetadata": { "documentType": "...", ... },
 *     "reviewer": { "verifiedBy": "...", "reviewerRole": "...", "enrollmentNumber": "..." },
 *     "subjectId": "...",
 *     "parcelId": "...",
 *     "documentVersion": 1,
 *     "claimedStatutoryFact": "..."
 *   }
 */

const { handleCORS, enforcePost, verifyAuth, checkRateLimit } = require('./middleware');
const { registerAndVerifyEvidence } = require('../server/evidenceVerificationEngine.cjs');

module.exports = async function handler(req, res) {
  // 1. CORS Preflight
  if (handleCORS(req, res)) return res.status(200).end();

  // 2. Enforce POST
  if (enforcePost(req, res)) return;

  // 3. Authenticate User via Firebase ID Token
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

  try {
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
    } = req.body || {};

    const cleanStorageId = documentStorageId || storageId;
    if (!willId || typeof willId !== 'string' || willId.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Invalid request: willId is mandatory and must be a non-empty string.',
        blockerCode: 'ERR_WILL_BINDING_REQUIRED'
      });
    }

    if (!cleanStorageId || typeof cleanStorageId !== 'string' || cleanStorageId.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Invalid request: documentStorageId is mandatory.',
        blockerCode: 'ERR_INVALID_STORAGE_ID'
      });
    }

    // Call the trusted server verification engine
    const ticket = registerAndVerifyEvidence({
      user: { uid: auth.uid, email: auth.email },
      willId: willId.trim(),
      documentStorageId: cleanStorageId.trim(),
      documentBytes,
      documentMetadata: documentMetadata || {},
      reviewer: reviewer || {},
      subjectId,
      parcelId,
      documentVersion: Number(documentVersion) || 1,
      claimedStatutoryFact
    });

    return res.status(200).json({
      success: true,
      ticket
    });
  } catch (error) {
    console.error('[Evidence Verification Error]', error.message);
    const statusCode = error.message.startsWith('ERR_UNAUTHENTICATED') ? 401 :
      error.message.startsWith('ERR_UNAUTHORIZED') ? 403 : 400;

    return res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
};
