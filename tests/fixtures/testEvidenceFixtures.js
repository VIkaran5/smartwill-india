/**
 * SmartWill India — Test Evidence Fixtures & Authentication Helpers
 * 
 * Test-only module providing authoritative server-verified evidence fixtures
 * and test authentication contexts.
 * 
 * RESTRICTED: Test fixture only. Never bundled or exposed in client distribution.
 * 
 * Version: 2.1.3 (Revision 12 Forensic Standard)
 */

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
    reviewerVerified: true,
    credentialVerified: true,
    statutoryFactEstablished: true,
    verificationStatus: 'VERIFIED',
    documentVersion: ticket.documentVersion,
    auditSessionId: ticket.verificationTicketId,
    verificationDate: ticket.verifiedAt.split('T')[0],
    serverVerificationTicket: ticket
  };
}

export {
  registerAndVerifyEvidence,
  clearServerVerificationRegistry
};
