/**
 * SmartWill India — Legal Engine 2.1
 * Statutory Jurisdiction Classifier: Section 1(4)(a)–(g) of Goa Act 23 of 2016
 *
 * Implements the exact statutory categories under Section 1(4) of the Goa Succession,
 * Special Notaries and Inventory Proceeding Act, 2012 (Goa Act 23 of 2016):
 *
 * Clause (a): Persons governed by Portuguese Civil Code of 1867 before 20 December 1961
 * Clause (b): Persons born in Goa to parents governed by that Civil Code
 * Clause (c): Persons born outside Goa to parents governed by that Code, subject to statutory opt-out
 *             executed before the Special Notary within statutory 3-year deadlines
 * Clause (d): Persons born in Goa to parents governed by corresponding laws in the rest of India,
 *             subject to permanent residence and statutory election requirements
 *             (Proviso: Consular, diplomatic, or military postings do not constitute permanent residence)
 * Clause (e): Persons born in Goa to foreign-citizen parents satisfying Sections 3 & 4 of the Citizenship Act, 1955
 * Clause (f): Persons born in Goa of unknown parents or unknown nationality
 * Clause (g): Persons adopted by parents governed by the specified Code or Act
 */

export const JURISDICTION_STATUS = {
  GOA_APPLICABLE: "GOA_APPLICABLE",
  GOA_NOT_APPLICABLE: "GOA_NOT_APPLICABLE",
  GOA_STATUS_UNDETERMINED: "GOA_STATUS_UNDETERMINED",
  // Backwards compatibility aliases
  GOA_ACT_APPLICABLE: "GOA_APPLICABLE",
  INDIAN_SUCCESSION_ACT_APPLICABLE: "GOA_NOT_APPLICABLE",
  LEGAL_REVIEW_REQUIRED: "GOA_STATUS_UNDETERMINED"
};

export const GOA_SECTION_1_4_CLAUSES = {
  CLAUSE_A: "Section 1(4)(a): Governed by Portuguese Civil Code of 1867 before 20 December 1961",
  CLAUSE_B: "Section 1(4)(b): Born in Goa to parents governed by the Portuguese Civil Code",
  CLAUSE_C: "Section 1(4)(c): Born outside Goa to parents governed by the Code (no valid opt-out declaration)",
  CLAUSE_D: "Section 1(4)(d): Born in Goa to rest-of-India parents, with verified permanent residence and statutory election",
  CLAUSE_E: "Section 1(4)(e): Born in Goa to foreign parents satisfying Sections 3 & 4 of Citizenship Act, 1955",
  CLAUSE_F: "Section 1(4)(f): Born in Goa of unknown parents or unknown nationality",
  CLAUSE_G: "Section 1(4)(g): Adopted by parents governed by the specified Code or Act"
};

export const JURISDICTION_DOCUMENT_TYPES = {
  HISTORICAL_PORTUGUESE_CIVIL_RECORD: "HISTORICAL_PORTUGUESE_CIVIL_RECORD",
  PORTUGUESE_BIRTH_REGISTRATION_ASSENTO: "PORTUGUESE_BIRTH_REGISTRATION_ASSENTO",
  PARENTS_PORTUGUESE_CIVIL_REGISTRATION: "PARENTS_PORTUGUESE_CIVIL_REGISTRATION",
  SPECIAL_NOTARY_OPT_OUT_DEED: "SPECIAL_NOTARY_OPT_OUT_DEED",
  SPECIAL_NOTARY_ELECTION_DEED: "SPECIAL_NOTARY_ELECTION_DEED",
  PERMANENT_RESIDENCE_CERTIFICATE: "PERMANENT_RESIDENCE_CERTIFICATE",
  CITIZENSHIP_ACT_VERIFICATION_CERTIFICATE: "CITIZENSHIP_ACT_VERIFICATION_CERTIFICATE",
  FOUNDLING_CIVIL_REGISTRATION: "FOUNDLING_CIVIL_REGISTRATION",
  REGISTERED_ADOPTION_DEED: "REGISTERED_ADOPTION_DEED",
  REST_OF_INDIA_CIVIL_RECORD: "REST_OF_INDIA_CIVIL_RECORD",
  REST_OF_INDIA_DOMICILE_CERTIFICATE: "REST_OF_INDIA_DOMICILE_CERTIFICATE",
  GOVERNMENT_POSTING_RECORD: "GOVERNMENT_POSTING_RECORD",
  MILITARY_POSTING_RECORD: "MILITARY_POSTING_RECORD",
  DIPLOMATIC_POSTING_RECORD: "DIPLOMATIC_POSTING_RECORD",
  SPECIAL_MARRIAGE_CERTIFICATE: "SPECIAL_MARRIAGE_CERTIFICATE"
};

export const AUTHORIZED_REVIEWER_ROLES = [
  'ADVOCATE',
  'SPECIAL_NOTARY',
  'CIVIL_REGISTRAR',
  'SUB_REGISTRAR',
  'GOVERNMENT_AUTHORITY'
];

// SHA-256 hash of an empty input (must never be accepted as valid file hash)
const EMPTY_STRING_SHA256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
const ALL_ZEROS_SHA256 = '0000000000000000000000000000000000000000000000000000000000000000';
const SHA256_HEX_REGEX = /^[a-f0-9]{64}$/i;
const BAR_ENROLLMENT_REGEX = /^[A-Z]{1,4}\/\d+\/\d{4}$/i;

/**
 * Strict ISO 8601 Calendar Date Validator (YYYY-MM-DD).
 * Prevents JavaScript normalization quirks (e.g. 2020-02-31 turning into 2020-03-02)
 * and invalid date strings from silently passing comparisons.
 *
 * @param {string} dateStr
 * @returns {boolean}
 */
export function isValidIsoDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const trimmed = dateStr.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return false;
  const d = new Date(trimmed + 'T00:00:00Z');
  if (isNaN(d.getTime())) return false;
  const parts = trimmed.split('-').map(Number);
  return d.getUTCFullYear() === parts[0] &&
         (d.getUTCMonth() + 1) === parts[1] &&
         d.getUTCDate() === parts[2];
}

/**
 * Validates whether an evidentiary record satisfies rigorous forensic standards.
 * Standalone Boolean flags are strictly barred from establishing jurisdiction.
 * Cryptographic hash confirms binary file integrity; legal authenticity is certified by authenticated advocate credentials.
 *
 * @param {Object} record - Structured evidence record
 * @param {Array<string>} expectedDocTypes - Allowed document type strings
 * @param {Object} context - Optional verification context (testatorName, requiredSubject)
 * @returns {Object} { isValid: boolean, blockerCode: string, reason: string }
 */
export function validateJurisdictionEvidence(record, expectedDocTypes = [], context = {}) {
  if (!record || typeof record !== 'object') {
    return {
      isValid: false,
      blockerCode: "ERR_GOA_EVIDENCE_UNVERIFIED",
      reason: "Missing documentary evidence record. A self-entered Boolean alone cannot establish jurisdiction."
    };
  }

  // 1. Immutable Document Storage Identifier & Trusted Storage Verification
  const storageId = (record.documentStorageId || record.storageKey || record.uploadId || '').toString().trim();
  const invalidStorageIds = ['mock', 'fake', 'test', 'string', 'null', 'undefined', 'invalid', 'dummy'];
  if (!storageId || invalidStorageIds.includes(storageId.toLowerCase())) {
    return {
      isValid: false,
      blockerCode: "ERR_GOA_EVIDENCE_UNVERIFIED",
      reason: "Missing or invalid uploaded document storage identifier (documentStorageId / storageKey). Document must be uploaded to secure repository."
    };
  }
  if (record.storageVerified !== true) {
    return {
      isValid: false,
      blockerCode: "ERR_GOA_EVIDENCE_UNVERIFIED",
      reason: `Document storage identifier '${storageId}' has not been resolved against a verified uploaded file in the secure repository.`
    };
  }

  // 2. Primary Reference / Registration Number
  const docRef = (record.documentRef || record.registrationNumber || record.certificateNumber || '').toString().trim();
  if (!docRef) {
    return {
      isValid: false,
      blockerCode: "ERR_GOA_EVIDENCE_UNVERIFIED",
      reason: "Missing document reference or certificate registration number."
    };
  }

  // 3. Document Type Classification
  const docType = (record.documentType || '').trim();
  if (!docType) {
    return {
      isValid: false,
      blockerCode: "ERR_GOA_EVIDENCE_UNVERIFIED",
      reason: "Missing document type classification."
    };
  }
  if (expectedDocTypes.length > 0 && !expectedDocTypes.includes(docType)) {
    return {
      isValid: false,
      blockerCode: "ERR_GOA_EVIDENCE_UNVERIFIED",
      reason: `Unrecognized document type '${docType}' for this statutory category.`
    };
  }

  // 4. Issuing Authority
  const issuingAuthority = (record.issuingAuthority || '').trim();
  if (!issuingAuthority) {
    return {
      isValid: false,
      blockerCode: "ERR_GOA_EVIDENCE_UNVERIFIED",
      reason: "Missing issuing authority on evidence record."
    };
  }

  // 5. Statutory Date
  const statutoryDate = record.issueDate || record.registrationDate || record.statutoryDate;
  if (!statutoryDate) {
    return {
      isValid: false,
      blockerCode: "ERR_GOA_EVIDENCE_UNVERIFIED",
      reason: "Missing statutory registration or issue date."
    };
  }

  // 6. Verified Parties & Facts with Subject-Specific Matching
  const verifiedParties = (record.verifiedParties || record.verifiedSubject || record.subjectName || '').trim();
  if (!verifiedParties && !record.verifiedFacts) {
    return {
      isValid: false,
      blockerCode: "ERR_GOA_EVIDENCE_UNVERIFIED",
      reason: "Missing verified parties or facts in evidence record."
    };
  }

  const vpLower = verifiedParties.toLowerCase();

  // Subject-specific matching: Distinguishes parental records from testator records
  if (context.requiredSubject === 'PARENTS') {
    const parentNames = (context.parentNames || []).filter(Boolean);
    const tNameLower = (context.testatorName || '').toLowerCase();

    // 1. If parental names are explicitly provided in context, enforce strict matching
    if (parentNames.length > 0) {
      const parentMatches = parentNames.some(pName => pName && vpLower.includes(pName.toLowerCase()));
      if (!parentMatches) {
        return {
          isValid: false,
          blockerCode: "ERR_PARTY_MISMATCH",
          reason: `Evidence record verified parties '${verifiedParties}' does not match required parental subjects (${parentNames.join(', ')}). Testator's own record cannot satisfy parental legal regime verification.`
        };
      }
    } else {
      // 2. If parental names not provided in context, ensure document is not merely the testator's personal record
      if (tNameLower && vpLower.includes(tNameLower) && !vpLower.includes('parent') && !vpLower.includes('father') && !vpLower.includes('mother')) {
        return {
          isValid: false,
          blockerCode: "ERR_PARTY_MISMATCH",
          reason: `Evidence record verified parties '${verifiedParties}' appears to be testator's personal record. Parental legal regime verification requires document issued in parents' name.`
        };
      }
    }
  } else if (context.requiredSubject === 'TESTATOR') {
    const tNameLower = (context.testatorName || '').toLowerCase();
    if (tNameLower && !vpLower.includes(tNameLower)) {
      return {
        isValid: false,
        blockerCode: "ERR_PARTY_MISMATCH",
        reason: `Evidence record verified parties '${verifiedParties}' does not match testator '${context.testatorName}'.`
      };
    }
  } else if (context.testatorName && verifiedParties) {
    const tNameLower = context.testatorName.toLowerCase();
    const parentMatches = (context.parentNames || []).some(pName => pName && vpLower.includes(pName.toLowerCase()));

    // Strict testator match
    if (context.strictTestatorMatch === true && !vpLower.includes(tNameLower) && !parentMatches) {
      return {
        isValid: false,
        blockerCode: "ERR_PARTY_MISMATCH",
        reason: `Evidence record verified parties '${verifiedParties}' does not match testator '${context.testatorName}' or parents.`
      };
    }
  }

  // 7. Strict Cryptographic File Hash & Server Byte Verification
  const docHash = (record.documentHash || record.sha256 || '').trim().toLowerCase();
  if (!docHash) {
    return {
      isValid: false,
      blockerCode: "ERR_EMPTY_OR_INVALID_FILE_HASH",
      reason: "Missing document file integrity hash (sha256)."
    };
  }
  if (!SHA256_HEX_REGEX.test(docHash)) {
    return {
      isValid: false,
      blockerCode: "ERR_EMPTY_OR_INVALID_FILE_HASH",
      reason: "Document hash is not a valid 64-character hexadecimal SHA-256 string."
    };
  }
  if (docHash === EMPTY_STRING_SHA256) {
    return {
      isValid: false,
      blockerCode: "ERR_EMPTY_OR_INVALID_FILE_HASH",
      reason: "Document hash matches empty-file SHA-256 (e3b0c442...). Zero-byte files cannot serve as legal evidence."
    };
  }
  if (docHash === ALL_ZEROS_SHA256) {
    return {
      isValid: false,
      blockerCode: "ERR_EMPTY_OR_INVALID_FILE_HASH",
      reason: "Document hash is all zeros, representing an uncomputed or forged hash."
    };
  }

  if (record.documentBytesSha256Verified !== true) {
    return {
      isValid: false,
      blockerCode: "ERR_EMPTY_OR_INVALID_FILE_HASH",
      reason: "Document file bytes SHA-256 integrity has not been verified against actual uploaded file on secure server."
    };
  }

  if (record.computedHash && record.computedHash.trim().toLowerCase() !== docHash) {
    return {
      isValid: false,
      blockerCode: "ERR_EMPTY_OR_INVALID_FILE_HASH",
      reason: "Document hash does not match computed SHA-256 hash of server document bytes."
    };
  }

  // 8. Authenticated Reviewer Credentials, Enrolment & Authoritative Verification
  const verifier = (record.verifiedBy || '').trim();
  if (!verifier) {
    return {
      isValid: false,
      blockerCode: "ERR_GOA_EVIDENCE_UNVERIFIED",
      reason: "Missing verifying advocate or authority identity."
    };
  }

  const reviewerRole = (record.reviewerRole || '').trim().toUpperCase();
  if (!reviewerRole || !AUTHORIZED_REVIEWER_ROLES.includes(reviewerRole)) {
    return {
      isValid: false,
      blockerCode: "ERR_GOA_EVIDENCE_UNVERIFIED",
      reason: `Unauthorized or missing reviewer role '${record.reviewerRole}'. Reviewer must be an ADVOCATE, SPECIAL_NOTARY, or CIVIL_REGISTRAR.`
    };
  }

  const enrollmentNo = (record.enrollmentNumber || record.barEnrollmentNumber || record.officerCredentials || '').trim();
  if (!enrollmentNo) {
    return {
      isValid: false,
      blockerCode: "ERR_GOA_EVIDENCE_UNVERIFIED",
      reason: "Missing reviewer professional credentials or Bar enrollment number."
    };
  }

  if (reviewerRole === 'ADVOCATE' && !BAR_ENROLLMENT_REGEX.test(enrollmentNo)) {
    return {
      isValid: false,
      blockerCode: "ERR_GOA_EVIDENCE_UNVERIFIED",
      reason: `Reviewer Bar enrollment number '${enrollmentNo}' does not match statutory Bar Council format (e.g., MAH/1234/2005 or GOA/123/2005).`
    };
  }

  if (record.reviewerVerified !== true) {
    return {
      isValid: false,
      blockerCode: "ERR_GOA_EVIDENCE_UNVERIFIED",
      reason: "Verifying reviewer identity has not been authenticated by secure server audit system."
    };
  }

  if (record.credentialVerified !== true) {
    return {
      isValid: false,
      blockerCode: "ERR_GOA_EVIDENCE_UNVERIFIED",
      reason: `Reviewer credentials or Bar enrollment '${enrollmentNo}' has not been authoritatively authenticated against the Bar Council registry.`
    };
  }

  // 9. Tamper-Resistant Verification Status & Audit Record
  if (record.verificationStatus !== 'VERIFIED') {
    return {
      isValid: false,
      blockerCode: "ERR_GOA_EVIDENCE_UNVERIFIED",
      reason: `Document verification outcome is '${record.verificationStatus}', expected 'VERIFIED'.`
    };
  }

  const verDate = (record.verificationDate || record.verificationTimestamp || '').trim();
  if (!verDate) {
    return {
      isValid: false,
      blockerCode: "ERR_GOA_EVIDENCE_UNVERIFIED",
      reason: "Missing verification timestamp."
    };
  }

  const auditSessionId = (record.auditSessionId || record.auditRecordId || record.auditHash || '').trim();
  if (!auditSessionId) {
    return {
      isValid: false,
      blockerCode: "ERR_GOA_EVIDENCE_UNVERIFIED",
      reason: "Missing tamper-resistant verification audit record identifier."
    };
  }

  // 10. Statutory Fact Substantive Check
  if (record.statutoryFactEstablished === false) {
    return {
      isValid: false,
      blockerCode: "ERR_GOA_EVIDENCE_UNVERIFIED",
      reason: "Verified record does not establish the claimed statutory fact or civil code subjection."
    };
  }

  // 11. Server Synchronization & Final Authenticated State Check
  // Fail-Closed: Never return isValid: true if server synchronization is pending or uncompleted!
  if (record.verificationPendingServerSync === true || record.serverVerified !== true) {
    return {
      isValid: false,
      blockerCode: "ERR_GOA_EVIDENCE_PENDING_SERVER_SYNC",
      metadataFormatVerified: true,
      verificationPendingServerSync: Boolean(record.verificationPendingServerSync),
      integrityVerified: false,
      reason: "Evidence verification pending server synchronization. Document bytes must be verified against server repository."
    };
  }

  return {
    isValid: true,
    blockerCode: null,
    metadataFormatVerified: true,
    verificationPendingServerSync: false,
    serverVerified: true,
    integrityVerified: true,
    reason: "Documentary evidence authenticated by authorized legal reviewer. Cryptographic hash confirms file integrity."
  };
}

/**
 * Classifies the governing succession jurisdiction strictly under Section 1(4)(a)–(g) criteria.
 * Fail-Closed: Missing or unverified evidence must NEVER default to GOA_NOT_APPLICABLE.
 *
 * @param {Object} p - Personal data object
 * @returns {Object} { status, statutoryClause, applicableAct, reasons, blockers, canGenerateWill }
 */
export function classifyGoaJurisdiction(p = {}) {
  const reasons = [];
  const blockers = [];

  const rawAddr = `${p.addressLine1 || ''} ${p.addressLine2 || ''} ${p.addressCity || ''} ${p.addressState || ''}`.toLowerCase();
  const isGoaResident = rawAddr.includes('goa') || rawAddr.includes('margao') || rawAddr.includes('panaji') || rawAddr.includes('vasco') || rawAddr.includes('mapusa');

  const testatorPob = (p.pob || p.placeOfBirth || '').trim().toLowerCase();
  const isTestatorBornGoa = testatorPob.includes('goa') || testatorPob.includes('margao') || testatorPob.includes('panaji') || testatorPob.includes('vasco') || testatorPob.includes('mapusa');

  // Daman and Diu Check: Daman & Diu succession matters are governed by their own local succession regime
  // and are NOT automatically governed by Goa Act 23 of 2016.
  const isDamanOrDiu = rawAddr.includes('daman') || rawAddr.includes('diu') || testatorPob.includes('daman') || testatorPob.includes('diu') || Boolean(p.isDamanOrDiuConnection);
  if (isDamanOrDiu) {
    blockers.push("ERR_GOA_JURISDICTION_UNCONFIRMED: Daman and Diu succession matters are governed by their own local/inherited succession regime and are not automatically governed by Goa Act 23 of 2016. Specialist advocate review is required.");
    return {
      status: JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED,
      statutoryClause: "Daman and Diu Separate Succession Regime",
      applicableAct: "Unconfirmed (Daman & Diu Local Law)",
      reasons: ["Daman and Diu are outside the automatic territorial routing of Goa Act 23 of 2016."],
      blockers,
      canGenerateWill: false
    };
  }

  // Spurious / Unsupported claims check:
  // Ten-year residency is NOT a Section 1(4) qualification route
  if (p.tenYearResidencyClaim === true) {
    blockers.push("ERR_INVALID_JURISDICTION_CRITERIA: Ten-year residency is not a valid statutory category under Section 1(4) of Goa Act 23 of 2016.");
    return {
      status: JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED,
      statutoryClause: "Invalid Jurisdiction Claim (Ten-Year Residency)",
      applicableAct: "Unconfirmed",
      reasons: ["Section 1(4) does not recognise mere duration of residency as a standalone qualification route."],
      blockers,
      canGenerateWill: false
    };
  }

  // Marriage of non-Goan to Goan is NOT a Section 1(4) qualification route
  if (p.marriageToGoanClaim === true) {
    blockers.push("ERR_INVALID_JURISDICTION_CRITERIA: Marriage to a person governed by the Portuguese Civil Code is not an independent qualification route under Section 1(4) of Goa Act 23 of 2016.");
    return {
      status: JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED,
      statutoryClause: "Invalid Jurisdiction Claim (Marriage to Goan)",
      applicableAct: "Unconfirmed",
      reasons: ["Marriage is governed under matrimonial conflict-of-laws principles and does not by itself confer Section 1(4) applicability."],
      blockers,
      canGenerateWill: false
    };
  }

  const jurEv = p.jurisdictionEvidence || {};
  const parentNames = [p.fatherName, p.motherName, p.parentName].filter(Boolean);
  const verificationContext = {
    testatorName: p.fullName,
    parentNames,
    strictTestatorMatch: true
  };

  // ── Clause (g): Adopted by parents governed by the specified Code or Act ──
  if (p.isAdopted) {
    // 1. Validate registered adoption deed:
    const adoptionRecord = p.clauseGEvidence || p.adoptionEvidence || jurEv.clauseG;
    const adoptionCheck = validateJurisdictionEvidence(adoptionRecord, [JURISDICTION_DOCUMENT_TYPES.REGISTERED_ADOPTION_DEED], verificationContext);

    if (!adoptionCheck.isValid) {
      blockers.push(`ERR_GOA_EVIDENCE_UNVERIFIED: Section 1(4)(g) requires verified registered adoption deed. ${adoptionCheck.reason}`);
      return {
        status: JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED,
        statutoryClause: "Section 1(4)(g) Adoption Deed Unverified",
        applicableAct: "Unconfirmed",
        reasons: ["Documentary verification of adoption deed is mandatory."],
        blockers,
        canGenerateWill: false
      };
    }

    // 2. Validate separate evidence of adoptive parents' legal status (never accept bare booleans):
    const adoptiveParentsRecord = p.adoptiveParentsEvidence || (adoptionRecord && adoptionRecord.adoptiveParentsEvidence) || jurEv.adoptiveParents;
    const adoptiveParentsGoanCheck = validateJurisdictionEvidence(adoptiveParentsRecord, [
      JURISDICTION_DOCUMENT_TYPES.PARENTS_PORTUGUESE_CIVIL_REGISTRATION,
      JURISDICTION_DOCUMENT_TYPES.HISTORICAL_PORTUGUESE_CIVIL_RECORD
    ]);

    if (adoptiveParentsGoanCheck.isValid) {
      reasons.push("Section 1(4)(g): Person adopted by parents affirmatively verified as governed by the Portuguese Civil Code of 1867 or Goa Act 23 of 2016.");
      return {
        status: JURISDICTION_STATUS.GOA_APPLICABLE,
        statutoryClause: GOA_SECTION_1_4_CLAUSES.CLAUSE_G,
        applicableAct: "Goa Act 23 of 2016",
        reasons,
        blockers: [],
        canGenerateWill: true
      };
    }

    // Check if adoptive parents have verified rest-of-India status:
    const adoptiveParentsRoiCheck = validateJurisdictionEvidence(adoptiveParentsRecord, [
      JURISDICTION_DOCUMENT_TYPES.REST_OF_INDIA_CIVIL_RECORD,
      JURISDICTION_DOCUMENT_TYPES.REST_OF_INDIA_DOMICILE_CERTIFICATE
    ]);

    if (adoptiveParentsRoiCheck.isValid) {
      reasons.push("Section 1(4)(g) Not Applicable: Adoptive parents verified as governed by rest-of-India personal law under documented evidence.");
      return {
        status: JURISDICTION_STATUS.GOA_NOT_APPLICABLE,
        statutoryClause: "Indian Succession Act (Adoption Under Rest-of-India Law)",
        applicableAct: "Indian Succession Act, 1925",
        reasons,
        blockers: [],
        canGenerateWill: true
      };
    }

    // If adoptive parents' legal status is unverified or reliant on bare boolean:
    blockers.push("ERR_GOA_EVIDENCE_UNVERIFIED: Section 1(4)(g) requires separate documentary verification of adoptive parents' civil code subjection. Reliance on naked Boolean assertions is prohibited.");
    return {
      status: JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED,
      statutoryClause: "Section 1(4)(g) Adoptive Parents Regime Unverified",
      applicableAct: "Unconfirmed",
      reasons: ["Documentary evidence establishing adoptive parents' governing succession regime is mandatory."],
      blockers,
      canGenerateWill: false
    };
  }

  // ── Clause (a): Governed by Portuguese Civil Code before 20 December 1961 ──
  const claimsClauseA = Boolean(p.pre1961PortugueseRegime || p.governedByCivilCode1867);
  const bornBefore1961InGoa = Boolean(p.dob && new Date(p.dob) < new Date('1961-12-20') && isTestatorBornGoa);

  if (claimsClauseA || bornBefore1961InGoa) {
    const clauseARecord = p.clauseAEvidence || p.pre1961Evidence || jurEv.clauseA;
    const clauseACheck = validateJurisdictionEvidence(clauseARecord, [
      JURISDICTION_DOCUMENT_TYPES.HISTORICAL_PORTUGUESE_CIVIL_RECORD,
      JURISDICTION_DOCUMENT_TYPES.PORTUGUESE_BIRTH_REGISTRATION_ASSENTO
    ], verificationContext);

    if (!clauseACheck.isValid) {
      blockers.push(`${clauseACheck.blockerCode || 'ERR_GOA_EVIDENCE_UNVERIFIED'}: Section 1(4)(a) requires verified documentary proof of subjection to the Portuguese Civil Code of 1867 prior to 20 December 1961. ${clauseACheck.reason}`);
      return {
        status: JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED,
        statutoryClause: "Section 1(4)(a) Verification Required",
        applicableAct: "Unconfirmed",
        reasons: ["Historical civil registration under the Portuguese Civil Code of 1867 must be independently verified by an advocate."],
        blockers,
        canGenerateWill: false
      };
    }

    reasons.push("Section 1(4)(a): Affirmative statutory record establishing testator was personally governed by the Portuguese Civil Code of 1867 prior to 20 December 1961.");
    return {
      status: JURISDICTION_STATUS.GOA_APPLICABLE,
      statutoryClause: GOA_SECTION_1_4_CLAUSES.CLAUSE_A,
      applicableAct: "Goa Act 23 of 2016",
      reasons,
      blockers: [],
      canGenerateWill: true
    };
  }

  // Parents' 1867 Civil Code status:
  const claimsParentsPortuguese = Boolean(p.parentsPortugueseRegime === true || p.parentsCivilCode1867 === true || (p.fatherPortugueseRegime === true && p.motherPortugueseRegime === true));
  const claimsParentsRestOfIndia = Boolean(p.parentsRestOfIndiaGoverned === true || p.parentsGovernedByRestOfIndiaLaw === true || p.parentsPortugueseRegime === false);
  const parentsStatusUnrecorded = (p.parentsPortugueseRegime === undefined && p.parentsCivilCode1867 === undefined && p.parentsRestOfIndiaGoverned === undefined);

  // ── Clause (b): Born in Goa to parents governed by the Civil Code ──
  if (isTestatorBornGoa && claimsParentsPortuguese) {
    const clauseBRecord = p.clauseBEvidence || p.parentsCivilCodeEvidence || jurEv.clauseB;
    const parentVerificationContext = {
      requiredSubject: 'PARENTS',
      testatorName: p.fullName,
      parentNames,
      strictSubjectMatch: true
    };
    const clauseBCheck = validateJurisdictionEvidence(clauseBRecord, [
      JURISDICTION_DOCUMENT_TYPES.PARENTS_PORTUGUESE_CIVIL_REGISTRATION,
      JURISDICTION_DOCUMENT_TYPES.PORTUGUESE_BIRTH_REGISTRATION_ASSENTO
    ], parentVerificationContext);

    if (!clauseBCheck.isValid) {
      blockers.push(`${clauseBCheck.blockerCode || 'ERR_GOA_EVIDENCE_UNVERIFIED'}: Section 1(4)(b) requires verified civil registration records establishing parents were governed by the Portuguese Civil Code of 1867. ${clauseBCheck.reason}`);
      return {
        status: JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED,
        statutoryClause: "Section 1(4)(b) Verification Required",
        applicableAct: "Unconfirmed",
        reasons: ["Documentary evidence of parents' civil registration under Portuguese Civil Code is mandatory."],
        blockers,
        canGenerateWill: false
      };
    }

    reasons.push("Section 1(4)(b): Testator was born in Goa to parents affirmatively verified as governed by the Portuguese Civil Code of 1867.");
    return {
      status: JURISDICTION_STATUS.GOA_APPLICABLE,
      statutoryClause: GOA_SECTION_1_4_CLAUSES.CLAUSE_B,
      applicableAct: "Goa Act 23 of 2016",
      reasons,
      blockers: [],
      canGenerateWill: true
    };
  }

  // ── Clause (c): Born outside Goa to parents governed by the Code, subject to statutory opt-out ──
  if (!isTestatorBornGoa && claimsParentsPortuguese) {
    const clauseBRecord = p.clauseBEvidence || p.parentsCivilCodeEvidence || jurEv.clauseB;
    const parentVerificationContext = {
      requiredSubject: 'PARENTS',
      testatorName: p.fullName,
      parentNames,
      strictSubjectMatch: true
    };
    const clauseBCheck = validateJurisdictionEvidence(clauseBRecord, [
      JURISDICTION_DOCUMENT_TYPES.PARENTS_PORTUGUESE_CIVIL_REGISTRATION,
      JURISDICTION_DOCUMENT_TYPES.PORTUGUESE_BIRTH_REGISTRATION_ASSENTO
    ], parentVerificationContext);

    if (!clauseBCheck.isValid) {
      blockers.push(`${clauseBCheck.blockerCode || 'ERR_GOA_EVIDENCE_UNVERIFIED'}: Section 1(4)(c) requires verified civil registration records establishing parents were governed by the Portuguese Civil Code of 1867. ${clauseBCheck.reason}`);
      return {
        status: JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED,
        statutoryClause: "Section 1(4)(c) Parental Verification Required",
        applicableAct: "Unconfirmed",
        reasons: ["Documentary evidence of parents' civil registration under Portuguese Civil Code is mandatory."],
        blockers,
        canGenerateWill: false
      };
    }

    // Check opt-out declaration:
    const claimsOptOut = Boolean(p.statutoryOptOutClauseC || p.optOutDeclarationDate);
    if (claimsOptOut) {
      const optOutRecord = p.clauseCEvidence || p.optOutEvidence || jurEv.clauseC;
      const optOutCheck = validateJurisdictionEvidence(optOutRecord, [JURISDICTION_DOCUMENT_TYPES.SPECIAL_NOTARY_OPT_OUT_DEED], verificationContext);

      if (!optOutCheck.isValid || !p.optOutBeforeSpecialNotary) {
        blockers.push(`ERR_GOA_JURISDICTION_UNCONFIRMED: Section 1(4)(c) opt-out declaration requires verified Special Notary registration within the statutory 3-year deadline. Unverified or disputed opt-out leaves jurisdiction undetermined. ${optOutCheck.reason}`);
        return {
          status: JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED,
          statutoryClause: "Section 1(4)(c) Opt-Out Unverified",
          applicableAct: "Unconfirmed",
          reasons: ["Statutory opt-out declaration before the Special Notary must be affirmatively verified."],
          blockers,
          canGenerateWill: false
        };
      }

      // Validate 3-year deadline with strict date validation:
      if (!isValidIsoDate(p.dob)) {
        blockers.push("ERR_GOA_JURISDICTION_UNCONFIRMED: Section 1(4)(c) statutory opt-out deadline validation requires a valid date of birth (YYYY-MM-DD). Missing or invalid date of birth blocks opt-out clearance.");
        return {
          status: JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED,
          statutoryClause: "Section 1(4)(c) Opt-Out DOB Mandatory",
          applicableAct: "Unconfirmed",
          reasons: ["Valid date of birth is mandatory to determine the 3-year statutory opt-out window after majority."],
          blockers,
          canGenerateWill: false
        };
      }

      const optOutDateStr = (optOutRecord.issueDate || optOutRecord.registrationDate || optOutRecord.statutoryDate || p.optOutDeclarationDate || '').toString().trim();
      if (!isValidIsoDate(optOutDateStr)) {
        blockers.push("ERR_GOA_JURISDICTION_UNCONFIRMED: Section 1(4)(c) statutory opt-out requires a valid registration date (YYYY-MM-DD). Missing or invalid opt-out date blocks clearance.");
        return {
          status: JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED,
          statutoryClause: "Section 1(4)(c) Opt-Out Date Mandatory",
          applicableAct: "Unconfirmed",
          reasons: ["Valid opt-out registration date is mandatory to evaluate statutory compliance."],
          blockers,
          canGenerateWill: false
        };
      }

      const declDate = new Date(optOutDateStr);
      const majorityPlus3 = new Date(p.dob);
      majorityPlus3.setFullYear(majorityPlus3.getFullYear() + 21); // 18 + 3 = 21 years
      let deadlineDate = majorityPlus3;

      if (p.dateOfArrivalInGoa) {
        if (!isValidIsoDate(p.dateOfArrivalInGoa)) {
          blockers.push("ERR_GOA_JURISDICTION_UNCONFIRMED: Section 1(4)(c) arrival date format is invalid.");
          return {
            status: JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED,
            statutoryClause: "Section 1(4)(c) Invalid Arrival Date",
            applicableAct: "Unconfirmed",
            reasons: ["Arrival date must be a valid ISO date."],
            blockers,
            canGenerateWill: false
          };
        }
        const arrivalDeadline = new Date(p.dateOfArrivalInGoa);
        arrivalDeadline.setFullYear(arrivalDeadline.getFullYear() + 3);
        if (arrivalDeadline > deadlineDate) {
          deadlineDate = arrivalDeadline;
        }
      }

      if (declDate > deadlineDate) {
        blockers.push("ERR_GOA_JURISDICTION_UNCONFIRMED: Opt-out declaration was executed after the statutory 3-year limitation window under Section 1(4)(c). Status undetermined pending judicial determination.");
        return {
          status: JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED,
          statutoryClause: "Section 1(4)(c) Opt-Out Limitation Expired",
          applicableAct: "Unconfirmed",
          reasons: ["Opt-out declaration was filed outside the statutory 3-year deadline."],
          blockers,
          canGenerateWill: false
        };
      }

      reasons.push("Section 1(4)(c) Opt-Out: Testator born outside Goa executed a verified statutory declaration opting out before the Special Notary within the prescribed three-year statutory deadline.");
      return {
        status: JURISDICTION_STATUS.GOA_NOT_APPLICABLE,
        statutoryClause: "Section 1(4)(c) Opt-Out (Special Notary Declaration)",
        applicableAct: "Indian Succession Act, 1925",
        reasons,
        blockers: [],
        canGenerateWill: true
      };
    }

    // No opt-out claimed: Governed by Goa Act under Clause (c)
    reasons.push("Section 1(4)(c): Testator born outside Goa to parents governed by the Portuguese Civil Code without an executed statutory opt-out before the Special Notary within the three-year window.");
    return {
      status: JURISDICTION_STATUS.GOA_APPLICABLE,
      statutoryClause: GOA_SECTION_1_4_CLAUSES.CLAUSE_C,
      applicableAct: "Goa Act 23 of 2016",
      reasons,
      blockers: [],
      canGenerateWill: true
    };
  }

  // ── Clause (f): Born in Goa of unknown parents or unknown nationality ──
  if (isTestatorBornGoa && p.unknownParentsOrNationality) {
    const foundlingRecord = p.clauseFEvidence || p.foundlingEvidence || jurEv.clauseF;
    const foundlingCheck = validateJurisdictionEvidence(foundlingRecord, [JURISDICTION_DOCUMENT_TYPES.FOUNDLING_CIVIL_REGISTRATION]);

    if (!foundlingCheck.isValid) {
      blockers.push(`ERR_GOA_EVIDENCE_UNVERIFIED: Section 1(4)(f) requires verified foundling registration or official civil certificate of unknown parentage. ${foundlingCheck.reason}`);
      return {
        status: JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED,
        statutoryClause: "Section 1(4)(f) Verification Required",
        applicableAct: "Unconfirmed",
        reasons: ["Documentary evidence of foundling status or unknown parentage is mandatory."],
        blockers,
        canGenerateWill: false
      };
    }

    reasons.push("Section 1(4)(f): Testator born in Goa of unknown parents or unknown nationality (verified by official civil registration).");
    return {
      status: JURISDICTION_STATUS.GOA_APPLICABLE,
      statutoryClause: GOA_SECTION_1_4_CLAUSES.CLAUSE_F,
      applicableAct: "Goa Act 23 of 2016",
      reasons,
      blockers: [],
      canGenerateWill: true
    };
  }

  // ── Clause (e): Born in Goa to foreign parents satisfying Citizenship Act Sections 3 & 4 ──
  if (isTestatorBornGoa && (p.foreignParentsCitizenshipFulfilled || p.citizenshipActSec3or4Fulfilled)) {
    const citizenshipRecord = p.clauseEEvidence || p.citizenshipEvidence || jurEv.clauseE;
    const citizenshipCheck = validateJurisdictionEvidence(citizenshipRecord, [JURISDICTION_DOCUMENT_TYPES.CITIZENSHIP_ACT_VERIFICATION_CERTIFICATE]);

    if (!citizenshipCheck.isValid) {
      blockers.push(`ERR_GOA_EVIDENCE_UNVERIFIED: Section 1(4)(e) requires verified proof of compliance with Sections 3 & 4 of the Citizenship Act, 1955. ${citizenshipCheck.reason}`);
      return {
        status: JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED,
        statutoryClause: "Section 1(4)(e) Verification Required",
        applicableAct: "Unconfirmed",
        reasons: ["Documentary proof of citizenship compliance is mandatory."],
        blockers,
        canGenerateWill: false
      };
    }

    reasons.push("Section 1(4)(e): Testator born in Goa to foreign-citizen parents, satisfying Sections 3 and 4 of the Citizenship Act, 1955 (verified).");
    return {
      status: JURISDICTION_STATUS.GOA_APPLICABLE,
      statutoryClause: GOA_SECTION_1_4_CLAUSES.CLAUSE_E,
      applicableAct: "Goa Act 23 of 2016",
      reasons,
      blockers: [],
      canGenerateWill: true
    };
  }

  // ── Clause (d): Born in Goa to rest-of-India parents ──
  if (isTestatorBornGoa) {
    if (parentsStatusUnrecorded) {
      blockers.push("ERR_GOA_JURISDICTION_UNCONFIRMED: Testator born in Goa, but parents' legal regime (Portuguese Civil Code vs. rest-of-India personal laws) is unrecorded. Cannot route to Indian Succession Act or Goa Act without verification.");
      return {
        status: JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED,
        statutoryClause: "Section 1(4) Parental Regime Unconfirmed",
        applicableAct: "Unconfirmed",
        reasons: ["Documentary evidence establishing whether parents were governed by the Portuguese Civil Code or rest-of-India personal laws is mandatory."],
        blockers,
        canGenerateWill: false
      };
    }

    if (claimsParentsRestOfIndia) {
      // CRITICAL REVISION 7 FIX: Negative Boolean cannot establish rest-of-India status!
      // Must require verified documentary evidence of parents' rest-of-India status under Section 1(4)(d).
      const parentsRoiRecord = p.parentsRestOfIndiaEvidence || p.clauseDEvidence?.parentsEvidence || jurEv.parentsRestOfIndia;
      const parentsRoiCheck = validateJurisdictionEvidence(parentsRoiRecord, [
        JURISDICTION_DOCUMENT_TYPES.REST_OF_INDIA_CIVIL_RECORD,
        JURISDICTION_DOCUMENT_TYPES.REST_OF_INDIA_DOMICILE_CERTIFICATE
      ]);

      if (!parentsRoiCheck.isValid) {
        blockers.push(`ERR_GOA_JURISDICTION_UNCONFIRMED: For a testator born in Goa, negative subjection to the Portuguese Civil Code cannot be established by a self-entered Boolean. Documentary evidence establishing parents' rest-of-India legal regime is mandatory. ${parentsRoiCheck.reason}`);
        return {
          status: JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED,
          statutoryClause: "Section 1(4)(d) Parents' Rest-of-India Evidence Required",
          applicableAct: "Unconfirmed",
          reasons: ["Documentary proof of parents' rest-of-India civil origin or domicile is mandatory."],
          blockers,
          canGenerateWill: false
        };
      }

      // Check Government / Consular / Military Posting Proviso:
      const claimsPosting = Boolean(p.isConsularOrDiplomaticPosting || p.isTemporaryMilitaryPosting || p.isGovernmentPosting);
      if (claimsPosting) {
        const postingRecord = p.postingEvidence || jurEv.posting;
        const postingCheck = validateJurisdictionEvidence(postingRecord, [
          JURISDICTION_DOCUMENT_TYPES.GOVERNMENT_POSTING_RECORD,
          JURISDICTION_DOCUMENT_TYPES.MILITARY_POSTING_RECORD,
          JURISDICTION_DOCUMENT_TYPES.DIPLOMATIC_POSTING_RECORD
        ]);

        if (!postingCheck.isValid) {
          blockers.push(`ERR_GOA_EVIDENCE_UNVERIFIED: Section 1(4) posting proviso requires verified government/military posting orders. ${postingCheck.reason}`);
          return {
            status: JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED,
            statutoryClause: "Section 1(4) Proviso Evidence Unverified",
            applicableAct: "Unconfirmed",
            reasons: ["Documentary evidence of official posting is mandatory to invoke the Section 1(4) proviso."],
            blockers,
            canGenerateWill: false
          };
        }

        reasons.push("Section 1(4) Proviso: Verified government service, diplomatic posting, or armed forces assignment in Goa excludes from permanent residence under Clause (d). Governed by personal law under Jose Paulo Coutinho (2019) 20 SCC 85.");
        return {
          status: JURISDICTION_STATUS.GOA_NOT_APPLICABLE,
          statutoryClause: "Indian Succession Act (Proviso: Posting Excluded from Permanent Residence)",
          applicableAct: "Indian Succession Act, 1925",
          reasons,
          blockers: [],
          canGenerateWill: true
        };
      }

      const claimsElection = Boolean(p.statutoryElectionClauseD || p.statutoryElectionGoa);
      if (claimsElection) {
        const electionRecord = p.clauseDEvidence || p.electionEvidence || jurEv.clauseD;
        const electionCheck = validateJurisdictionEvidence(electionRecord, [JURISDICTION_DOCUMENT_TYPES.SPECIAL_NOTARY_ELECTION_DEED], verificationContext);

        const residenceRecord = p.permanentResidenceEvidence || jurEv.residence;
        const residenceCheck = validateJurisdictionEvidence(residenceRecord, [JURISDICTION_DOCUMENT_TYPES.PERMANENT_RESIDENCE_CERTIFICATE], verificationContext);

        if (!electionCheck.isValid || !residenceCheck.isValid) {
          blockers.push(`ERR_GOA_EVIDENCE_UNVERIFIED: Section 1(4)(d) statutory election and permanent residence require verified Special Notary registration and verified residence proof. ${electionCheck.isValid ? residenceCheck.reason : electionCheck.reason}`);
          return {
            status: JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED,
            statutoryClause: "Section 1(4)(d) Evidence Incomplete",
            applicableAct: "Unconfirmed",
            reasons: ["Both statutory election deed and permanent residence proof must be verified by an advocate."],
            blockers,
            canGenerateWill: false
          };
        }

        // Section 1(4)(d) Statutory Deadline: Election must be executed within 3 years of attaining majority (age 21)
        if (!isValidIsoDate(p.dob)) {
          blockers.push("ERR_GOA_JURISDICTION_UNCONFIRMED: Section 1(4)(d) statutory election deadline validation requires a valid date of birth (YYYY-MM-DD). Missing or invalid date of birth blocks election clearance.");
          return {
            status: JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED,
            statutoryClause: "Section 1(4)(d) Election DOB Mandatory",
            applicableAct: "Unconfirmed",
            reasons: ["Valid date of birth is mandatory to determine the 3-year statutory election window after majority."],
            blockers,
            canGenerateWill: false
          };
        }

        const electDateStr = (electionRecord.issueDate || electionRecord.registrationDate || electionRecord.statutoryDate || p.electionDate || '').toString().trim();
        if (!isValidIsoDate(electDateStr)) {
          blockers.push("ERR_GOA_JURISDICTION_UNCONFIRMED: Section 1(4)(d) statutory election requires a valid registration date (YYYY-MM-DD). Missing or invalid election date blocks election clearance.");
          return {
            status: JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED,
            statutoryClause: "Section 1(4)(d) Election Date Mandatory",
            applicableAct: "Unconfirmed",
            reasons: ["Valid election registration date is mandatory to evaluate statutory compliance."],
            blockers,
            canGenerateWill: false
          };
        }

        const electionDate = new Date(electDateStr);
        const majorityPlus3 = new Date(p.dob);
        majorityPlus3.setFullYear(majorityPlus3.getFullYear() + 21); // 18 + 3 = 21 years
        if (electionDate > majorityPlus3) {
          blockers.push("ERR_GOA_ELECTION_DEADLINE_EXPIRED: Section 1(4)(d) statutory election must be executed within 3 years of attaining majority (before age 21). Late election leaves Goa Act applicability unconfirmed.");
          return {
            status: JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED,
            statutoryClause: "Section 1(4)(d) Election Deadline Expired",
            applicableAct: "Unconfirmed",
            reasons: ["Statutory election before Special Notary was executed after statutory 3-year deadline following majority."],
            blockers,
            canGenerateWill: false
          };
        }

        reasons.push("Section 1(4)(d): Testator born in Goa to rest-of-India parents, satisfying permanent residence requirement and having declared verified statutory election before Special Notary.");
        return {
          status: JURISDICTION_STATUS.GOA_APPLICABLE,
          statutoryClause: GOA_SECTION_1_4_CLAUSES.CLAUSE_D,
          applicableAct: "Goa Act 23 of 2016",
          reasons,
          blockers: [],
          canGenerateWill: true
        };
      } else {
        reasons.push("Section 1(4)(d) Non-Electing: Testator born in Goa to parents verified as governed by rest-of-India law, without statutory election. Governed by their personal law pursuant to Jose Paulo Coutinho (2019) 20 SCC 85.");
        return {
          status: JURISDICTION_STATUS.GOA_NOT_APPLICABLE,
          statutoryClause: "Indian Succession Act (Non-Electing Section 1(4)(d))",
          applicableAct: "Indian Succession Act, 1925",
          reasons,
          blockers: [],
          canGenerateWill: true
        };
      }
    }
  }

  // ── Ambiguity Gate: Goa connection / residence with unrecorded birthplace or parentage ──
  if (isGoaResident) {
    blockers.push("ERR_GOA_JURISDICTION_UNCONFIRMED: Residence or domicile in Goa alone does not establish legal regime under Section 1(4). Affirmative documentary proof of parents' legal status or statutory declaration is mandatory.");
    return {
      status: JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED,
      statutoryClause: "Section 1(4) Verification Required",
      applicableAct: "Unconfirmed",
      reasons: ["Current residence in Goa alone is legally insufficient to establish Section 1(4) applicability."],
      blockers,
      canGenerateWill: false
    };
  }

  // ── Mandatory Fail-Closed Parental Origin Inquiry for Outside-Goa Applicants ──
  // Under Section 1(4)(c), any person born outside Goa to parents governed by the Portuguese Civil Code
  // of 1867 is governed by the Goa Succession Act unless a valid opt-out was executed before the Special Notary.
  // Therefore, parental succession regime must be affirmatively declared and established.
  // Missing parental status or a bare negative Boolean without rest-of-India origin cannot rule out Section 1(4)(c).
  const isTestatorBornOutsideGoa = Boolean(testatorPob) && !isTestatorBornGoa;
  const hasGoaAncestralConnection = Boolean(p.hasGoaAncestryClaim || p.hasGoaProperty);

  if (isTestatorBornOutsideGoa || hasGoaAncestralConnection) {
    if (parentsStatusUnrecorded) {
      blockers.push("ERR_GOA_JURISDICTION_UNCONFIRMED: Testator born outside Goa (or declaring Goa ancestral nexus), but parental succession status is unrecorded. Section 1(4)(c) applicability cannot be ruled out without affirmative parental regime declaration.");
      return {
        status: JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED,
        statutoryClause: "Section 1(4)(c) Parental Origin Inquiry",
        applicableAct: "Unconfirmed",
        reasons: ["Parental civil code status must be affirmatively declared under Section 1(4)(c)."],
        blockers,
        canGenerateWill: false
      };
    }

    if (claimsParentsRestOfIndia) {
      // REVISION 9 FIX: Self-entered boolean (parentsRestOfIndiaGoverned: true / parentsPortugueseRegime: false)
      // CANNOT establish rest-of-India governing regime under Section 1(4)(c) without verified documentary evidence!
      const parentsRoiRecord = p.parentsRestOfIndiaEvidence || jurEv.parentsRestOfIndia;
      if (!parentsRoiRecord) {
        blockers.push("ERR_GOA_JURISDICTION_UNCONFIRMED: For a testator born outside Goa (or claiming Goa ancestral nexus), a self-entered Boolean (parentsRestOfIndiaGoverned: true / parentsPortugueseRegime: false) is legally insufficient. Documentary evidence establishing parents' rest-of-India governing law is mandatory under Section 1(4)(c).");
        return {
          status: JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED,
          statutoryClause: "Section 1(4)(c) Parental Origin Inquiry",
          applicableAct: "Unconfirmed",
          reasons: ["Documentary proof of parents' rest-of-India civil origin or domicile is mandatory to rule out Section 1(4)(c)."],
          blockers,
          canGenerateWill: false
        };
      }

      const parentRoiContext = {
        requiredSubject: 'PARENTS',
        testatorName: p.fullName,
        parentNames,
        strictSubjectMatch: true
      };
      const parentsRoiCheck = validateJurisdictionEvidence(parentsRoiRecord, [
        JURISDICTION_DOCUMENT_TYPES.REST_OF_INDIA_CIVIL_RECORD,
        JURISDICTION_DOCUMENT_TYPES.REST_OF_INDIA_DOMICILE_CERTIFICATE
      ], parentRoiContext);

      if (!parentsRoiCheck.isValid) {
        blockers.push(`${parentsRoiCheck.blockerCode || 'ERR_GOA_JURISDICTION_UNCONFIRMED'}: Parents' rest-of-India evidence under Section 1(4)(c) is invalid or unverified. ${parentsRoiCheck.reason}`);
        return {
          status: JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED,
          statutoryClause: "Section 1(4)(c) Parental Origin Inquiry",
          applicableAct: "Unconfirmed",
          reasons: ["Documentary proof of parents' rest-of-India legal regime is unverified."],
          blockers,
          canGenerateWill: false
        };
      }
    }
  }

  // Unknown personal law gate: If personal law data is completely absent, trigger legal review
  if (!p.religion && !p.personalLaw && !p.applicablePersonalLaw) {
    blockers.push("ERR_PERSONAL_LAW_UNRECORDED: Succession regime cannot be inferred without declaring personal law or ancestral civil code subjection.");
    return {
      status: JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED,
      statutoryClause: "Personal Law Unconfirmed",
      applicableAct: "Unconfirmed",
      reasons: ["Personal law and ancestral succession origin must be declared."],
      blockers,
      canGenerateWill: false
    };
  }

  // Conclusive Reasoned Rest-of-India Jurisdiction
  reasons.push("Governed under the Indian Succession Act, 1925 and applicable personal law (reasoned rest-of-India determination with no Section 1(4) Goa nexus).");
  return {
    status: JURISDICTION_STATUS.GOA_NOT_APPLICABLE,
    statutoryClause: "Indian Succession Act, 1925 (Part VI)",
    applicableAct: "Indian Succession Act, 1925",
    reasons,
    blockers: [],
    canGenerateWill: true
  };
}
