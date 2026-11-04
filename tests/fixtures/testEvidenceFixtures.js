/**
 * SmartWill India — Test Evidence Fixtures & Authentication Helpers
 * 
 * Test-only module providing authoritative server-verified evidence fixtures
 * and test authentication contexts.
 * 
 * RESTRICTED: Test fixture only. Never bundled or exposed in client distribution.
 * 
 * Version: 2.1.3 (Revision 13 Forensic Standard)
 */

import crypto from 'node:crypto';

// Dynamically generate a cryptographically secure 256-bit test signing key for this test run process
// ZERO hardcoded secret literals are committed in source code or configuration
if (!process.env.SMARTWILL_EVIDENCE_SIGNING_KEY) {
  process.env.SMARTWILL_EVIDENCE_SIGNING_KEY = crypto.randomBytes(32).toString('hex');
}

import {
  registerAndVerifyEvidence,
  clearServerVerificationRegistry,
  verifyTicketSignature
} from '../../server/evidenceVerificationEngine.js';

import { setCryptographicTicketVerifier } from '../../js/legal/evidenceValidator.js';

// Register the authoritative cryptographic ticket verifier in the legal validator
setCryptographicTicketVerifier(verifyTicketSignature);

/**
 * Creates an authenticated test server context.
 * @param {Object} [options]
 * @param {string} [options.userId='usr-default-101']
 * @param {string} [options.willId='will-default-202']
 * @returns {Object} { userId, willId }
 */
export function createTestAuthContext(options = {}) {
  return {
    userId: options.userId || 'usr-default-101',
    willId: options.willId || 'will-default-202'
  };
}

/**
 * Helper to build an authentic server-verified evidence object for test suites.
 * Executes the genuine server verification pipeline.
 * 
 * @param {Object} [options]
 * @returns {Object} Server-verified evidence record
 */
export function createTrustedServerEvidenceFixture(options = {}) {
  const user = options.user || { uid: options.userId || 'usr-default-101', email: 'testator@smartwill.in' };
  const willId = options.willId || 'will-default-202';
  const documentStorageId = options.documentStorageId || `DOC-STORE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const fileBytes = options.documentBytes || Buffer.from(`SmartWill Statutory Document Content for ${documentStorageId} at ${new Date().toISOString()}`);

  const effectiveDate = options.issueDate || options.registrationDate || options.statutoryDate || "2020-01-15";
  const metadata = {
    documentType: options.documentType,
    documentRef: options.documentRef || `REF-${Date.now()}`,
    issuingAuthority: options.issuingAuthority || "Competent Authority of India",
    issueDate: options.issueDate || (options.registrationDate ? options.registrationDate : effectiveDate),
    registrationDate: options.registrationDate || (options.issueDate ? options.issueDate : effectiveDate),
    verifiedParties: options.verifiedParties || "Testator Name",
    ...options.documentMetadata
  };

  const reviewer = {
    verifiedBy: options.verifiedBy || "Advocate Tariq Khan, High Court of Allahabad",
    reviewerRole: options.reviewerRole || "ADVOCATE",
    enrollmentNumber: options.enrollmentNumber || "UP/789/1985",
    authoritativeRegistryConfirmed: true,
    ...options.reviewer
  };

  const ticket = registerAndVerifyEvidence({
    user,
    willId,
    documentStorageId,
    documentBytes: fileBytes,
    documentMetadata: metadata,
    reviewer,
    subjectId: options.subjectId || metadata.verifiedParties,
    parcelId: options.parcelId || null,
    documentVersion: options.documentVersion || 1,
    claimedStatutoryFact: options.claimedStatutoryFact || null
  });

  return {
    ...metadata,
    documentStorageId,
    documentHash: ticket.serverComputedHash,
    computedHash: ticket.serverComputedHash,
    documentBytesSha256Verified: true,
    verificationTicketId: ticket.verificationTicketId,
    verifiedBy: reviewer.verifiedBy,
    reviewerRole: reviewer.reviewerRole,
    enrollmentNumber: reviewer.enrollmentNumber,
    serverVerified: true,
    storageVerified: true,
    reviewerVerified: ticket.reviewer.credentialVerified,
    credentialVerified: ticket.reviewer.credentialVerified,
    statutoryFactEstablished: ticket.statutoryFactEstablished,
    verificationStatus: ticket.verificationStatus,
    documentVersion: ticket.documentVersion,
    auditSessionId: ticket.verificationTicketId,
    verificationDate: ticket.verifiedAt.split('T')[0],
    serverVerificationTicket: ticket
  };
}

/**
 * Creates a server-verified asset completeness declaration fixture for test suites.
 * 
 * @param {Object} [options]
 * @returns {Object} Structured asset inventory declaration with valid server ticket
 */
export function createTestCompletenessDeclaration(options = {}) {
  const userId = options.userId || 'usr-default-101';
  const willId = options.willId || 'will-default-202';
  const sessionId = options.auditSessionId || `AUDIT-SESS-${Date.now()}`;
  
  const ticket = registerAndVerifyEvidence({
    user: { uid: userId, email: 'testator@smartwill.in' },
    willId,
    documentStorageId: `AUDIT-STORE-${sessionId}`,
    documentBytes: Buffer.from(`Asset Completeness Audit Record for ${sessionId} on will ${willId}`),
    documentMetadata: {
      documentType: 'ASSET_COMPLETENESS_ATTESTATION',
      documentRef: sessionId,
      verifiedParties: options.testatorName || 'Testator Name'
    },
    reviewer: {
      verifiedBy: 'Advocate Tariq Khan, High Court of Allahabad',
      reviewerRole: 'ADVOCATE',
      enrollmentNumber: 'UP/789/1985',
      authoritativeRegistryConfirmed: true
    },
    claimedStatutoryFact: 'ASSET_COMPLETENESS'
  });

  return {
    hasNoAssets: options.hasNoAssets !== undefined ? options.hasNoAssets : true,
    hasNoImmovableProperty: options.hasNoImmovableProperty || false,
    declarationSigned: true,
    declarationDate: options.declarationDate || '2026-06-15',
    verifiedCompletenessAudit: true,
    auditSessionId: sessionId,
    completenessAttestationTicket: ticket,
    serverAuditTicket: ticket,
    serverVerificationTicket: ticket
  };
}

export {
  registerAndVerifyEvidence,
  clearServerVerificationRegistry
};
