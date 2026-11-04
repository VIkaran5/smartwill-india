/**
 * SmartWill India — Evidence Ticket Validation Endpoint (Vercel Serverless Function)
 * 
 * Authoritative production endpoint for client applications to validate evidence tickets
 * against backend cryptographic signatures and user ownership without exposing server secrets.
 * 
 * POST /api/validate-ticket
 * Headers:
 *   Authorization: Bearer <Firebase_ID_Token>
 *   Content-Type: application/json
 * 
 * Body:
 *   {
 *     "ticket": { ...serverVerificationTicket... }
 *   }
 * 
 * Version: 2.1.4 (Revision 14 Forensic Standard)
 */

const { admin, db } = require('./firebase');
const { handleCORS, enforcePost, verifyAuth, checkRateLimit } = require('./middleware');
const { verifyTicketSignature, getTicketFromFirestore } = require('../functions/evidenceVerificationEngine.cjs');

async function handler(req, res, testInjections = {}) {
  // 1. CORS Preflight
  if (handleCORS(req, res)) return res.status(200).end();

  // 2. Enforce POST Method
  if (enforcePost(req, res)) return;

  // 3. Authenticate User via Firebase ID Token
  const auth = (testInjections && testInjections.auth) || 
               (process.env.NODE_ENV === 'test' && req && req.auth) || 
               (await verifyAuth(req, res));
  if (!auth) return;

  // 4. Rate Limiting
  if (checkRateLimit(req, res, {
    windowMs: 60000,
    max: 60,
    keyPrefix: 'validate-ticket',
    identifier: auth.uid,
    message: 'Too many ticket validation requests. Please wait.'
  })) return;

  try {
    const { ticket } = req.body || {};
    if (!ticket || typeof ticket !== 'object' || !ticket.verificationTicketId) {
      return res.status(400).json({
        isValid: false,
        error: 'Invalid request: ticket object with verificationTicketId is required.',
        blockerCode: 'ERR_MALFORMED_TICKET'
      });
    }

    // 5. Authoritative Cryptographic Signature Verification
    const isSignatureValid = verifyTicketSignature(ticket);
    if (!isSignatureValid) {
      return res.status(403).json({
        isValid: false,
        error: 'Ticket failed cryptographic signature verification. Tampering detected.',
        blockerCode: 'ERR_FORGED_EVIDENCE_TICKET'
      });
    }

    // 6. User Identity Binding (Reject cross-user ticket reuse)
    if (ticket.userId !== auth.uid) {
      return res.status(403).json({
        isValid: false,
        error: `Ticket belongs to user '${ticket.userId}', not authenticated caller '${auth.uid}'.`,
        blockerCode: 'ERR_CROSS_USER_EVIDENCE_REUSE'
      });
    }

    // 7. Optional Firestore Persisted Record Check
    const firestoreDb = (testInjections && testInjections.db !== undefined) ? testInjections.db : (process.env.NODE_ENV === 'test' ? null : db);
    if (firestoreDb) {
      try {
        const stored = await getTicketFromFirestore(ticket.verificationTicketId, firestoreDb);
        if (stored && stored.serverSignature !== ticket.serverSignature) {
          return res.status(403).json({
            isValid: false,
            error: 'Ticket does not match immutable record stored in Firestore.',
            blockerCode: 'ERR_PERSISTED_TICKET_TAMPERED'
          });
        }
      } catch (dbErr) {
        if (dbErr.message && dbErr.message.includes('ERR_PERSISTED_TICKET_TAMPERED')) {
          return res.status(403).json({
            isValid: false,
            error: 'Stored ticket in Firestore has been tampered with.',
            blockerCode: 'ERR_PERSISTED_TICKET_TAMPERED'
          });
        }
        // If other non-critical Firestore network issues occur, log warning
        console.warn('[Firestore Persisted Ticket Check Warning]', dbErr.message);
      }
    }

    return res.status(200).json({
      isValid: true,
      ticketId: ticket.verificationTicketId,
      statutoryFactEstablished: ticket.statutoryFactEstablished === true,
      verificationStatus: ticket.verificationStatus
    });
  } catch (error) {
    console.error('[Ticket Validation Error]', error.message);
    return res.status(500).json({
      isValid: false,
      error: error.message || 'Ticket validation failed.',
      blockerCode: 'ERR_VALIDATION_FAILED'
    });
  }
}

module.exports = handler;
module.exports.default = handler;
