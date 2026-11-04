/**
 * SmartWill India — Evidence Ticket Validator
 * 
 * Validates evidence records against authoritative server verification tickets
 * and mandatory authenticated server context.
 * 
 * Designed to run in both browser/client and server runtimes without exposing server secrets.
 * 
 * Version: 2.1.3 (Revision 12 Forensic Standard)
 */

import {
  AUTHORIZED_REVIEWER_ROLES,
  BAR_ENROLLMENT_REGEX,
  VALID_LAND_CLASSIFICATION_DOC_TYPES,
  VALID_PROPERTY_TERRITORY_DOC_TYPES
} from './evidenceConstants.js';

// Pluggable cryptographic ticket verifier hook (registered by server engine or test runtime)
let cryptographicTicketVerifier = null;

/**
 * Registers an authoritative server-side cryptographic ticket verifier.
 * Allows server-side runtimes to enforce HMAC-SHA256 signature verification.
 * @param {Function} verifier - (ticket) => boolean
 */
export function setCryptographicTicketVerifier(verifier) {
  cryptographicTicketVerifier = verifier;
}

/**
 * Validates whether an evidence record carries an authentic, untampered server verification ticket
 * bound to the authenticated server context.
 *
 * @param {Object} record - The evidence record supplied to the engine
 * @param {Object} context - Mandatory caller verification context
 * @param {string} context.userId - Authenticated user identifier
 * @param {string} context.willId - Authenticated will identifier
 * @param {string} [context.testatorName] - Expected testator name
 * @param {Array<string>} [context.parentNames] - Expected parent names
 * @param {string} [context.requiredSubject] - 'TESTATOR' or 'PARENTS'
 * @param {string} [context.parcelId] - Expected property survey/CTS/plot ID
 * @returns {Object} { isValid: boolean, blockerCode: string|null, reason: string|null, ticket: Object|null }
 */
export function validateEvidenceRecordAgainstServer(record, context = {}) {
  // 1. Mandatory Authenticated Server Context Validation
  if (!context || typeof context !== 'object' || !context.userId || typeof context.userId !== 'string' || context.userId.trim() === '' ||
      !context.willId || typeof context.willId !== 'string' || context.willId.trim() === '') {
    return {
      isValid: false,
      blockerCode: "ERR_UNAUTHENTICATED_EVIDENCE_CONTEXT",
      reason: "Evidence verification requires a verified authenticated server context with valid userId and willId. Client-derived or form-supplied identity is prohibited.",
      ticket: null
    };
  }

  const activeUserId = context.userId.trim();
  const activeWillId = context.willId.trim();

  if (!record || typeof record !== 'object') {
    return {
      isValid: false,
      blockerCode: "ERR_GOA_EVIDENCE_UNVERIFIED",
      reason: "Missing documentary evidence record.",
      ticket: null
    };
  }

  // 2. Locate Server Verification Ticket
  const ticket = record.serverVerificationTicket ||
    (record.verificationTicketId && record.serverSignature ? record : null);

  // REJECT UNVERIFIED CLIENT FLAGS: Client-supplied booleans without server ticket are strictly barred
  if (!ticket || !ticket.verificationTicketId) {
    return {
      isValid: false,
      blockerCode: "ERR_UNTRUSTED_CLIENT_EVIDENCE",
      reason: "Evidence record lacks a verified server verification ticket. Client-supplied verification booleans and hashes are untrusted without authoritative backend verification.",
      ticket: null
    };
  }

  // 3. Cryptographic Signature Format Check
  const sig = (ticket.serverSignature || '').toString().trim();
  if (!sig || !/^[a-f0-9]{64}$/i.test(sig)) {
    return {
      isValid: false,
      blockerCode: "ERR_FORGED_EVIDENCE_TICKET",
      reason: "Server verification ticket signature is missing, invalid, or malformed.",
      ticket: null
    };
  }

  // 4. Authoritative Cryptographic Verification (Fail-Closed)
  if (typeof cryptographicTicketVerifier !== 'function') {
    return {
      isValid: false,
      blockerCode: "ERR_CRYPTO_VERIFIER_UNAVAILABLE",
      reason: "Cryptographic ticket verifier is not initialized. Authoritative evidence signature verification is mandatory and cannot be skipped.",
      ticket: null
    };
  }

  const isCryptoValid = cryptographicTicketVerifier(ticket);
  if (!isCryptoValid) {
    return {
      isValid: false,
      blockerCode: "ERR_FORGED_EVIDENCE_TICKET",
      reason: "Server verification ticket signature failed cryptographic verification.",
      ticket: null
    };
  }

  // 5. Authenticated User Binding (Reject Cross-User Evidence Reuse)
  if (ticket.userId !== activeUserId) {
    return {
      isValid: false,
      blockerCode: "ERR_CROSS_USER_EVIDENCE_REUSE",
      reason: `Evidence belongs to user '${ticket.userId}', not authenticated user '${activeUserId}'. Cross-user evidence reuse is prohibited.`,
      ticket: null
    };
  }

  // 6. Will Binding (Reject Cross-Will Evidence Reuse)
  if (ticket.willId !== activeWillId) {
    return {
      isValid: false,
      blockerCode: "ERR_CROSS_WILL_EVIDENCE_REUSE",
      reason: `Evidence was verified for will '${ticket.willId}', but submitted for will '${activeWillId}'. Cross-will evidence reuse is prohibited.`,
      ticket: null
    };
  }

  // 7. Document Version Check (Reject Stale Verification Results)
  if (record.documentVersion && ticket.documentVersion && Number(record.documentVersion) !== Number(ticket.documentVersion)) {
    return {
      isValid: false,
      blockerCode: "ERR_DOCUMENT_VERSION_STALE",
      reason: `Document version '${record.documentVersion}' does not match verified server generation '${ticket.documentVersion}'. Evidence must be re-verified following changes.`,
      ticket: null
    };
  }

  // 8. Parcel Binding for Property Evidence
  if (context.parcelId) {
    const cleanExpectedParcel = context.parcelId.trim().toLowerCase();
    const cleanTicketParcel = (ticket.parcelId || '').trim().toLowerCase();
    if (!cleanTicketParcel || cleanTicketParcel !== cleanExpectedParcel) {
      return {
        isValid: false,
        blockerCode: "ERR_PARCEL_MISMATCH",
        reason: `Evidence parcel identifier '${ticket.parcelId || 'UNRECORDED'}' does not match required property parcel '${context.parcelId}'.`,
        ticket: null
      };
    }
  }

  // 9. Subject Identity Matching
  if (context.requiredSubject === 'PARENTS') {
    const parentNames = (context.parentNames || []).filter(Boolean);
    const vpLower = (ticket.verifiedParties || '').toLowerCase();
    const tNameLower = (context.testatorName || '').toLowerCase();

    // Reject testator's own name on parental record
    if (tNameLower && vpLower.includes(tNameLower) && !vpLower.includes('parent') && !vpLower.includes('father') && !vpLower.includes('mother')) {
      return {
        isValid: false,
        blockerCode: "ERR_PARTY_MISMATCH",
        reason: `Evidence record verified parties '${ticket.verifiedParties}' matches testator's name. Parental legal regime verification requires document issued in parents' name.`,
        ticket: null
      };
    }

    if (parentNames.length > 0) {
      const parentMatches = parentNames.some(pName => pName && vpLower.includes(pName.toLowerCase()));
      if (!parentMatches) {
        return {
          isValid: false,
          blockerCode: "ERR_PARTY_MISMATCH",
          reason: `Evidence record verified parties '${ticket.verifiedParties}' does not match required parental subjects (${parentNames.join(', ')}).`,
          ticket: null
        };
      }
    }
  } else if (context.requiredSubject === 'TESTATOR') {
    const tNameLower = (context.testatorName || '').toLowerCase();
    const vpLower = (ticket.verifiedParties || '').toLowerCase();
    const isGenericTestatorParty = vpLower.includes('testator') || vpLower.includes('declarant');
    if (tNameLower && !vpLower.includes(tNameLower) && !isGenericTestatorParty) {
      return {
        isValid: false,
        blockerCode: "ERR_PARTY_MISMATCH",
        reason: `Evidence record verified parties '${ticket.verifiedParties}' does not match testator '${context.testatorName}'.`,
        ticket: null
      };
    }
  }

  return {
    isValid: true,
    blockerCode: null,
    reason: null,
    ticket
  };
}

export {
  AUTHORIZED_REVIEWER_ROLES,
  BAR_ENROLLMENT_REGEX,
  VALID_LAND_CLASSIFICATION_DOC_TYPES,
  VALID_PROPERTY_TERRITORY_DOC_TYPES
};
