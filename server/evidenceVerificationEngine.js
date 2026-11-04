/**
 * SmartWill India — Authoritative Backend Evidence Verification Engine (ESM)
 * 
 * Re-exports the authoritative CommonJS server verification engine for ESM consumers.
 */

import cjsModule from './evidenceVerificationEngine.cjs';

export const {
  getSigningKey,
  computeSha256,
  canonicalizeTicketPayload,
  computeTicketSignature,
  verifyTicketSignature,
  verifyReviewerCredentials,
  registerAndVerifyEvidence,
  persistTicketToFirestore,
  getTicketFromFirestore,
  validateEvidenceRecordAgainstServer,
  clearServerVerificationRegistry,
  AUTHORIZED_REVIEWER_ROLES,
  BAR_ENROLLMENT_REGEX,
  VALID_LAND_CLASSIFICATION_DOC_TYPES,
  VALID_PROPERTY_TERRITORY_DOC_TYPES
} = cjsModule;

export default cjsModule;
