/**
 * SmartWill India — Legal Engine 2.1
 * Personal Law & Statutory Regime Router
 *
 * Enforces five distinct statutory pathways with strict jurisdiction priority:
 * 1. Goa Succession Act, 2012 (Goa Act 23 of 2016, Act 35 of 2023)
 *    - Jose Paulo Coutinho (2019) 20 SCC 85 & Ashabi Khan (2007) (4) ALL MR 604:
 *      Goa civil succession law governs Goan domiciles as special and local law.
 *      Religion does not divert away from the Goa Succession Act.
 * 2. Special Marriage Act, 1954 (Sections 21 & 21A):
 *    - Section 21A: Where both parties profess Hindu, Buddhist, Sikh or Jain religion,
 *      succession is regulated by Hindu Succession Act, 1956 & ISA Section 57.
 *    - Section 21: Otherwise, succession is governed by Indian Succession Act, 1925 (Part VI),
 *      without altering the individual's religious identity.
 * 3. Parsi Succession under Indian Succession Act, 1925 (Part VI with Section 58 scope & Sections 50–56 for Intestacy)
 * 4. Christian & Civil Marriages under Indian Succession Act, 1925 (Part VI — Sections 59, 63, 105, 109, 119)
 * 5. Muslim Personal Law (Shariat) Application Act, 1937 (Section 1(2), 2 agricultural land exclusion & Section 3 declaration audit)
 * 6. Hindu Succession Act, 1956 (Section 30) read with Indian Succession Act, 1925 (Section 57(a), (b), (c) & Schedule III)
 */

import {
  classifyGoaJurisdiction,
  JURISDICTION_STATUS,
  validateJurisdictionEvidence,
  JURISDICTION_DOCUMENT_TYPES,
  AUTHORIZED_REVIEWER_ROLES
} from './goaJurisdiction.js';

export const PERSONAL_LAW_REGIMES = {
  GOA_UCC: "GOA_UCC",
  PARSI: "PARSI",
  CHRISTIAN_CIVIL: "CHRISTIAN_CIVIL",
  MUSLIM_SHARIAT_SEC3: "MUSLIM_SHARIAT_SEC3",
  MUSLIM_SUNNI: "MUSLIM_SUNNI",
  MUSLIM_SHIA: "MUSLIM_SHIA",
  HINDU: "HINDU",
  LEGAL_REVIEW_REQUIRED: "LEGAL_REVIEW_REQUIRED"
};

export const HISTORICAL_PRESIDENCY_CODES = {
  BOMBAY_OOCJ: "HISTORICAL_PRESIDENCY_BOMBAY_OOCJ",
  MADRAS_OOCJ: "HISTORICAL_PRESIDENCY_MADRAS_OOCJ",
  BENGAL_LIEUTENANT_GOVERNOR: "HISTORICAL_BENGAL_LIEUTENANT_GOVERNOR"
};

const RECOGNIZED_SUNNI_SCHOOLS = ['hanafi', 'shafi', "shafi'i", 'maliki', 'hanbali'];
const RECOGNIZED_SHIA_TWELVER = ['shia', 'ithna-ashari', 'ithna ashari', 'twelver', "ja'fari", 'jafari'];
const CUSTOMARY_SHIA_SCHOOLS = ['ismaili', 'bohra', 'dawoodi bohra', 'khoja'];

const RECOGNIZED_SHARIAT_AUTHORITIES = [
  'DISTRICT MAGISTRATE',
  'COLLECTOR',
  'ADDITIONAL DISTRICT MAGISTRATE',
  'SUB-DIVISIONAL MAGISTRATE',
  'SDM',
  'ADM',
  'DM'
];

const EMPTY_STRING_SHA256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
const ALL_ZEROS_SHA256 = '0000000000000000000000000000000000000000000000000000000000000000';
const SHA256_HEX_REGEX = /^[a-f0-9]{64}$/i;

const AGRICULTURAL_KEYWORD_REGEX = /(\bagricultur|\bagri\b|\bpaddy\b|\borchard\b|\bcashew\b|\bplantation\b|\bcultivat|\bfarm\b|\bfarmland\b|\bkhasra\b|\bkrishi\b|\bcrop\b|\bland holding\b)/i;

/**
 * Validates a Section 3 Shariat declaration record against rigorous statutory criteria.
 * Naked booleans are strictly rejected.
 *
 * @param {Object} record - Declaration evidence record
 * @param {Object} personal - Personal data object
 * @returns {Object} { isValid: boolean, blockerCode: string, reason: string }
 */
export function validateShariatDeclarationRecord(record, personal = {}) {
  if (!record || typeof record !== 'object') {
    return {
      isValid: false,
      blockerCode: "ERR_MUSLIM_TESTAMENTARY_REGIME_UNCONFIRMED",
      reason: "Missing Section 3 declaration record. Shariat testamentary succession cannot be activated without verified filing."
    };
  }

  // 1. Immutable Document Storage Identifier
  const storageId = (record.documentStorageId || record.storageKey || record.uploadId || '').toString().trim();
  if (!storageId) {
    return {
      isValid: false,
      blockerCode: "ERR_SHARIAT_SEC3_DEFECTIVE",
      reason: "Missing uploaded document storage identifier (documentStorageId / storageKey). Declaration document must be uploaded to secure repository."
    };
  }

  // 2. Primary Reference / Registration Number
  const filingRef = (record.filingReference || record.documentRef || record.registrationNumber || '').toString().trim();
  if (!filingRef) {
    return {
      isValid: false,
      blockerCode: "ERR_SHARIAT_SEC3_DEFECTIVE",
      reason: "Missing declaration filing reference or registration number before prescribed authority."
    };
  }

  if (!record.declarationDate) {
    return {
      isValid: false,
      blockerCode: "ERR_SHARIAT_SEC3_DEFECTIVE",
      reason: "Missing statutory declaration filing date."
    };
  }

  // 3. Prescribed Statutory Authority
  const authority = (record.prescribedAuthority || '').trim().toUpperCase();
  if (!authority) {
    return {
      isValid: false,
      blockerCode: "ERR_SHARIAT_SEC3_DEFECTIVE",
      reason: "Missing prescribed authority before whom Section 3 declaration was executed."
    };
  }
  const isRecognizedAuth = RECOGNIZED_SHARIAT_AUTHORITIES.some(auth => authority.includes(auth));
  if (!isRecognizedAuth) {
    return {
      isValid: false,
      blockerCode: "ERR_SHARIAT_SEC3_DEFECTIVE",
      reason: `Prescribed authority '${record.prescribedAuthority}' is not a recognized Section 3 authority (must be District Magistrate, Collector, ADM, or SDM).`
    };
  }

  // 4. Prescribed Statutory Form
  const isPrescribedForm = record.prescribedForm === true || record.formType === 'FORM_A_SHARIAT_SECTION_3';
  if (!isPrescribedForm) {
    return {
      isValid: false,
      blockerCode: "ERR_SHARIAT_SEC3_DEFECTIVE",
      reason: "Declaration was not executed in the prescribed statutory form (FORM_A_SHARIAT_SECTION_3)."
    };
  }

  // 5. Contract Act Section 11 Competence (Age >= 18 AT DECLARATION DATE, Sound Mind, No Disqualification)
  // Naked boolean contractCompetent: true alone is insufficient without verified competence facts
  let isAdult = false;
  const declTime = new Date(record.declarationDate).getTime();
  if (personal.dob && !isNaN(declTime)) {
    const dobTime = new Date(personal.dob).getTime();
    const ageAtDeclYears = (declTime - dobTime) / (365.25 * 24 * 60 * 60 * 1000);
    if (ageAtDeclYears >= 18) {
      isAdult = true;
    }
  } else if (typeof record.ageAtDeclaration === 'number' && record.ageAtDeclaration >= 18) {
    isAdult = true;
  } else if (record.ageConfirmed18Plus === true || record.isAdult === true) {
    isAdult = true;
  } else if (typeof personal.age === 'number' && personal.age >= 18 && !personal.dob) {
    isAdult = true;
  }

  const isSoundMind = record.soundMindConfirmed === true || record.competenceFactsVerified === true;
  const isNotDisqualified = record.notDisqualifiedConfirmed === true || record.competenceFactsVerified === true;
  const competenceEstablished = isAdult && isSoundMind && isNotDisqualified && (record.contractCompetent === true || personal.contractCompetent === true);

  if (!competenceEstablished) {
    return {
      isValid: false,
      blockerCode: "ERR_SHARIAT_SEC3_INCOMPETENT",
      reason: "Declarant competence under Section 11 of the Indian Contract Act, 1872 is unverified or false. Declarant must be at least 18 years of age on the statutory declaration date, of sound mind, and not disqualified."
    };
  }

  // 6. Residence and Governing Regime Scope
  // Under Shariat Act Section 1(2), the Act extends to the whole of India (post-2019).
  // However, under Jose Paulo Coutinho (2019) 20 SCC 85 & Ashabi Khan (2007) (4) ALL MR 604,
  // Goa civil succession law governs Goan domiciles as special and local law.
  // Shariat Section 3 declaration is ineffective to alter Goan succession for a Goan-governed person.
  const isEstablishedNonGoan = personal.governingSuccessionRegime === 'INDIAN_SUCCESSION_ACT' ||
    personal.isGoanDomicile === false ||
    personal.parentsRestOfIndiaGoverned === true;

  const residenceTerritory = (record.residenceTerritory || personal.addressState || '').trim().toLowerCase();
  if (!residenceTerritory && !personal.addressState) {
    return {
      isValid: false,
      blockerCode: "ERR_SHARIAT_SEC3_RESIDENCE_UNVERIFIED",
      reason: "Declarant residence territory must be affirmatively recorded."
    };
  }

  if ((residenceTerritory.includes('goa') && !isEstablishedNonGoan) ||
      personal.governingSuccessionRegime === PERSONAL_LAW_REGIMES.GOA_UCC ||
      personal.isGoaGoverned === true) {
    return {
      isValid: false,
      blockerCode: "ERR_SHARIAT_SEC3_RESIDENCE_UNVERIFIED",
      reason: "Declarant resides in Goa and/or is governed by Goa civil succession law as special and local law (Jose Paulo Coutinho (2019) 20 SCC 85); Shariat Act Section 3 declaration is ineffective to alter Goan succession."
    };
  }

  // 7. Minor Children & Descendant Coverage Check (Section 3(1))
  // Section 3(1) statutorily specifies that the declaration applies to the declarant and all minor children and their descendants.
  if (record.hasMinorChildren === true && record.minorChildrenCovered === false) {
    return {
      isValid: false,
      blockerCode: "ERR_SHARIAT_SEC3_DEFECTIVE",
      reason: "Section 3(1) mandates that the declaration applies to the declarant and all minor children and their descendants."
    };
  }

  // 8. Strict Cryptographic File Hash Validation
  const docHash = (record.documentHash || record.sha256 || '').trim().toLowerCase();
  if (!docHash) {
    return {
      isValid: false,
      blockerCode: "ERR_EMPTY_OR_INVALID_FILE_HASH",
      reason: "Missing declaration file integrity hash (sha256)."
    };
  }
  if (!SHA256_HEX_REGEX.test(docHash)) {
    return {
      isValid: false,
      blockerCode: "ERR_EMPTY_OR_INVALID_FILE_HASH",
      reason: "Declaration document hash is not a valid 64-character hexadecimal SHA-256 string."
    };
  }
  if (docHash === EMPTY_STRING_SHA256) {
    return {
      isValid: false,
      blockerCode: "ERR_EMPTY_OR_INVALID_FILE_HASH",
      reason: "Declaration hash matches empty-file SHA-256 (e3b0c442...). Zero-byte files cannot serve as legal evidence."
    };
  }
  if (docHash === ALL_ZEROS_SHA256) {
    return {
      isValid: false,
      blockerCode: "ERR_EMPTY_OR_INVALID_FILE_HASH",
      reason: "Declaration hash is all zeros, representing an uncomputed or forged hash."
    };
  }

  // 9. Section 3(2) Appeal status
  if (record.appealFiled === true) {
    if (record.appealStatus === 'REFUSED') {
      return {
        isValid: false,
        blockerCode: "ERR_SHARIAT_SEC3_APPEAL_REFUSED",
        reason: "Declaration registration was refused and the statutory appeal under Section 3(2) was dismissed or refused."
      };
    }
    if (record.appealStatus !== 'ALLOWED') {
      return {
        isValid: false,
        blockerCode: "ERR_SHARIAT_SEC3_DEFECTIVE",
        reason: "Statutory appeal under Section 3(2) is pending or unconfirmed."
      };
    }
  }

  // 10. Authenticated Reviewer Credentials & Verification Status
  if (record.verificationStatus !== 'VERIFIED') {
    return {
      isValid: false,
      blockerCode: "ERR_MUSLIM_TESTAMENTARY_REGIME_UNCONFIRMED",
      reason: `Declaration verification outcome is '${record.verificationStatus}', expected 'VERIFIED'.`
    };
  }

  const verifier = (record.verifiedBy || '').trim();
  if (!verifier) {
    return {
      isValid: false,
      blockerCode: "ERR_SHARIAT_SEC3_DEFECTIVE",
      reason: "Missing verifying advocate identity."
    };
  }

  const reviewerRole = (record.reviewerRole || '').trim().toUpperCase();
  if (!reviewerRole || !AUTHORIZED_REVIEWER_ROLES.includes(reviewerRole)) {
    return {
      isValid: false,
      blockerCode: "ERR_SHARIAT_SEC3_DEFECTIVE",
      reason: `Unauthorized or missing reviewer role '${record.reviewerRole}'.`
    };
  }

  const enrollmentNo = (record.enrollmentNumber || record.barEnrollmentNumber || '').trim();
  if (!enrollmentNo) {
    return {
      isValid: false,
      blockerCode: "ERR_SHARIAT_SEC3_DEFECTIVE",
      reason: "Missing verifying advocate professional credentials or Bar enrollment number."
    };
  }

  if (!record.verificationDate) {
    return {
      isValid: false,
      blockerCode: "ERR_SHARIAT_SEC3_DEFECTIVE",
      reason: "Missing verification date on declaration record."
    };
  }

  const auditSessionId = (record.auditSessionId || record.auditRecordId || '').trim();
  if (!auditSessionId) {
    return {
      isValid: false,
      blockerCode: "ERR_SHARIAT_SEC3_DEFECTIVE",
      reason: "Missing verification audit session identifier."
    };
  }

  return {
    isValid: true,
    blockerCode: null,
    reason: "Section 3 declaration record fully authenticated by qualified advocate."
  };
}

/**
 * Authoritatively determines the personal law regime, statutory crest, and governing citation.
 * @param {Object} willData - Full will dataset
 * @returns {Object} Complete statutory routing metadata
 */
export function resolvePersonalLawRegime(willData = {}) {
  const p = willData.personal || {};
  const blockers = [];
  const reasons = [];

  // ── STEP 1: GOA JURISDICTION EVALUATED FIRST ──
  // Mandatory Fail-Closed: Missing evidence must never default to non-Goa personal law.
  const jurisdiction = classifyGoaJurisdiction(p);

  // 1A. Positive Establishment of Goa Succession Act (Jose Paulo Coutinho & Ashabi Khan)
  if (jurisdiction.status === JURISDICTION_STATUS.GOA_APPLICABLE) {
    const rawRel = (p.religion || '').trim().toLowerCase();
    const isMuslim = rawRel.includes('muslim') || rawRel.includes('islam');
    const isHindu = rawRel.includes('hindu');
    const isChristian = rawRel.includes('christian');
    const isParsi = rawRel.includes('parsi') || rawRel.includes('zoroastrian');

    return {
      regime: PERSONAL_LAW_REGIMES.GOA_UCC,
      governingSuccessionRegime: "GOA_SUCCESSION_ACT",
      isGoa: true,
      religion: p.religion || "Undeclared",
      isParsi,
      isChristian,
      isMuslim, // PRESERVES ACTUAL RELIGIOUS IDENTITY
      isHindu,
      shariatApplicable: false, // Shariat does not govern Goan succession!
      statuteCitation: "Goa Succession, Special Notaries and Inventory Proceeding Act, 2012 (Goa Act 23 of 2016 & Amendment Act 35 of 2023)",
      statutoryCrest: "GOVERNED BY THE GOA SUCCESSION ACT, 2012 (GOA ACT 23 OF 2016 & AMENDMENT ACT 35 OF 2023)",
      precedentAuthority: "Jose Paulo Coutinho v. Maria Luiza Valentina Pereira (2019) 20 SCC 85 & Mrs. Ashabi Khan v. Mrs. Pravin Khan 2007 (4) ALL MR 604: Goa civil succession law governs Goan domiciles as special and local law, prevailing over general personal laws.",
      reasons: ["Testator satisfies Section 1(4) criteria of Goa Act 23 of 2016. Governed exclusively by the Goa Succession Act."],
      blockers: [],
      jurisdiction
    };
  }

  // 1B. Undetermined / Incomplete Evidence: Fail-closed gate
  if (jurisdiction.status === JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED) {
    return {
      regime: PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED,
      isGoa: false,
      isParsi: false,
      isChristian: false,
      isMuslim: false,
      isHindu: false,
      requiresLegalReview: true,
      statuteCitation: "Goa Jurisdiction Status Undetermined — Advocate Review Required",
      statutoryCrest: "LEGAL REVIEW REQUIRED — JURISDICTION STATUS UNCONFIRMED",
      reasons: jurisdiction.reasons || ["Goa Section 1(4) applicability cannot be determined without affirmative documentary evidence."],
      blockers: jurisdiction.blockers.length > 0 ? jurisdiction.blockers : [
        "ERR_GOA_JURISDICTION_UNCONFIRMED: Succession jurisdiction status under Section 1(4) is unconfirmed. Pre-flight audit blocks generation."
      ],
      jurisdiction
    };
  }

  // ── STEP 2: REASONED NEGATIVE DETERMINATION (NON-GOA PERSONAL LAW ROUTING) ──
  // Only positively established GOA_NOT_APPLICABLE cases proceed to rest-of-India personal law routing.

  // 2A. Special Marriage Act, 1954 (Sections 21 & 21A) Priority Routing
  // Generic civil marriage cannot automatically activate SMA Section 21 without explicit regime declaration
  if (p.civilMarriage === true && p.marriageRegime !== 'SPECIAL_MARRIAGE_ACT_1954' && p.marriageAct !== 'SPECIAL_MARRIAGE_ACT' && p.isSpecialMarriageAct !== true) {
    return {
      regime: PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED,
      isGoa: false,
      isParsi: false,
      isChristian: false,
      isMuslim: false,
      isHindu: false,
      requiresLegalReview: true,
      statuteCitation: "Civil Marriage Statutory Regime Unconfirmed — Advocate Review Required",
      statutoryCrest: "LEGAL REVIEW REQUIRED — CIVIL MARRIAGE REGIME UNCONFIRMED",
      reasons: ["Generic civil marriage assertion without explicit declaration of Special Marriage Act, 1954 regime leaves governing succession law unconfirmed."],
      blockers: ["ERR_CIVIL_MARRIAGE_REGIME_UNCONFIRMED: Generic civil marriage declared without explicit Special Marriage Act, 1954 regime verification. Automated succession routing barred."],
      jurisdiction
    };
  }

  const isSMA = p.marriageRegime === 'SPECIAL_MARRIAGE_ACT_1954' ||
    p.isSpecialMarriageAct === true ||
    p.marriageAct === 'SPECIAL_MARRIAGE_ACT';

  if (isSMA) {
    const marriageRecord = p.marriageCertificateEvidence ||
      p.specialMarriageEvidence ||
      (p.jurisdictionEvidence && p.jurisdictionEvidence.marriageCertificate);

    const marriageCheck = validateJurisdictionEvidence(
      marriageRecord,
      [JURISDICTION_DOCUMENT_TYPES.SPECIAL_MARRIAGE_CERTIFICATE],
      { testatorName: p.fullName }
    );

    if (!marriageCheck.isValid) {
      return {
        regime: PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED,
        isGoa: false,
        isParsi: false,
        isChristian: false,
        isMuslim: false,
        isHindu: false,
        requiresLegalReview: true,
        statuteCitation: "Special Marriage Act, 1954 (Marriage Certificate Unverified)",
        statutoryCrest: "LEGAL REVIEW REQUIRED — SPECIAL MARRIAGE REGISTRATION UNVERIFIED",
        reasons: ["Marriage under the Special Marriage Act, 1954 requires verified marriage certificate to alter personal law succession routing."],
        blockers: [`ERR_SMA_MARRIAGE_CERTIFICATE_REQUIRED: Marriage under Special Marriage Act, 1954 requires verified marriage certificate to alter personal law succession routing. ${marriageCheck.reason}`],
        jurisdiction
      };
    }

    const tRel = (p.religion || '').trim().toLowerCase();
    const sRel = (p.spouseReligion || (p.spouse && p.spouse.religion) || '').trim().toLowerCase();
    const isTestatorHBSJ = ['hindu', 'buddhist', 'buddhism', 'sikh', 'jain'].some(r => tRel.includes(r));
    const isSpouseHBSJ = ['hindu', 'buddhist', 'buddhism', 'sikh', 'jain'].some(r => sRel.includes(r));

    // Section 21A Exception: Both spouses are Hindu, Buddhist, Sikh or Jain
    if (isTestatorHBSJ && isSpouseHBSJ) {
      // Under Section 21A, Section 21 does NOT apply; succession is regulated by Hindu Succession Act, 1956 & ISA Sec 57
      reasons.push("Special Marriage Act, 1954 Section 21A: Marriage solemnized under SMA between two persons professing Hindu/Buddhist/Sikh/Jain religion; succession is regulated by Hindu Succession Act, 1956 and ISA Section 57.");
      // Will proceed down to Hindu Section 57 evaluation below, preserving religion
    } else {
      // Section 21 General Rule: Governed by Indian Succession Act, 1925 (Part VI)
      // Crucially, preserve testator's actual religion (do NOT force isChristian: true)
      const isTestatorChristian = tRel.includes('christian');
      const isTestatorMuslim = tRel.includes('muslim') || tRel.includes('islam');
      const isTestatorParsi = tRel.includes('parsi') || tRel.includes('zoroastrian');

      reasons.push("Special Marriage Act, 1954 Section 21: Succession to property of person married under SMA (where Section 21A does not apply) is regulated by the Indian Succession Act, 1925 (Part VI).");

      return {
        regime: PERSONAL_LAW_REGIMES.CHRISTIAN_CIVIL,
        governingSuccessionRegime: "SPECIAL_MARRIAGE_ACT_SECTION_21",
        isGoa: false,
        isParsi: isTestatorParsi,
        isChristian: isTestatorChristian,
        isMuslim: isTestatorMuslim,
        isHindu: isTestatorHBSJ,
        religion: p.religion || "Civil Marriage (SMA)",
        statuteCitation: "Special Marriage Act, 1954 (Section 21) read with Indian Succession Act, 1925 (Part VI Testamentary Succession)",
        statutoryCrest: "GOVERNED BY SPECIAL MARRIAGE ACT, 1954 (SECTION 21) & INDIAN SUCCESSION ACT, 1925 (PART VI)",
        reasons,
        blockers: [],
        jurisdiction
      };
    }
  }

  // Mandatory Gate: Missing or empty religion declaration
  if (!p.religion || !p.religion.trim()) {
    return {
      regime: PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED,
      isGoa: false,
      isParsi: false,
      isChristian: false,
      isMuslim: false,
      isHindu: false,
      requiresLegalReview: true,
      statuteCitation: "Personal Law Unconfirmed — Qualified Legal Review Required",
      statutoryCrest: "LEGAL REVIEW REQUIRED — RELIGIOUS / CIVIL REGIME UNRECORDED",
      reasons: ["Personal law regime cannot be established without an explicit religious declaration or civil marriage registration under the Special Marriage Act."],
      blockers: ["ERR_PERSONAL_LAW_UNRECORDED: Missing religion or personal law declaration."],
      jurisdiction
    };
  }

  const religionLower = p.religion.trim().toLowerCase();
  const subSect = (p.sect || p.subSect || '').trim().toLowerCase();

  // 2B. Parsi Pathway (Indian Succession Act, 1925 Part VI with Section 58 Scope; Sections 50–56 for Intestacy)
  if (religionLower.includes('parsi') || religionLower.includes('zoroastrian')) {
    return {
      regime: PERSONAL_LAW_REGIMES.PARSI,
      governingSuccessionRegime: "INDIAN_SUCCESSION_ACT_PARSI",
      isGoa: false,
      isParsi: true,
      isChristian: false,
      isMuslim: false,
      isHindu: false,
      statuteCitation: "Indian Succession Act, 1925 (Part VI Testamentary Succession with Parsi Scope under Section 58; Sections 50–56 apply to Intestacy)",
      statutoryCrest: "GOVERNED BY THE INDIAN SUCCESSION ACT, 1925 (PARSI TESTAMENTARY SUCCESSION & PART VI)",
      reasons: ["Parsi testamentary succession is governed by Part VI of the Indian Succession Act, 1925 subject to Section 58 qualifications."],
      blockers: [],
      jurisdiction
    };
  }

  // 2C. Muslim Pathway (Shariat Act, 1937 Section 3 Audit & ISA Section 58 Exclusion)
  if (religionLower.includes('muslim') || religionLower.includes('islam')) {
    reasons.push("Indian Succession Act, 1925 Section 58 expressly excludes testamentary succession to the property of any Muhammadan from Part VI.");

    // Mandatory Muslim School / Sect Classification Check:
    if (!subSect) {
      return {
        regime: PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED,
        isGoa: false,
        isParsi: false,
        isChristian: false,
        isMuslim: true,
        isHindu: false,
        requiresLegalReview: true,
        statuteCitation: "Muslim Personal Law (Shariat) Application Act, 1937 (School Unverified)",
        statutoryCrest: "LEGAL REVIEW REQUIRED — MUSLIM SCHOOL OF JURISPRUDENCE UNVERIFIED",
        reasons: ["Muslim school of jurisprudence is unrecorded. Automated succession cannot default to Sunni. Verified legal school (Hanafi, Shafi, Maliki, Hanbali, or Ithna-Ashari) is mandatory."],
        blockers: ["ERR_MUSLIM_SCHOOL_UNVERIFIED: Unrecorded or unrecognized Muslim school of jurisprudence. Affirmative verification is required."],
        jurisdiction
      };
    }

    const isCustomaryShia = CUSTOMARY_SHIA_SCHOOLS.some(s => subSect.includes(s));
    if (isCustomaryShia) {
      return {
        regime: PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED,
        isGoa: false,
        isParsi: false,
        isChristian: false,
        isMuslim: true,
        isShia: true,
        isHindu: false,
        sectName: "Shia (Ismaili / Dawoodi Bohra)",
        requiresExpertLegalReview: true,
        statuteCitation: "Muslim Personal Law (Shariat) Application Act, 1937 (Ismaili / Dawoodi Bohra Customary & Special Succession Rules)",
        statutoryCrest: "LEGAL REVIEW REQUIRED — ISMAILI / DAWOODI BOHRA SUCCESSION LAW",
        reasons: ["Ismaili and Dawoodi Bohra communities possess distinct customary and personal succession rules distinct from general Ithna-Ashari principles, requiring qualified advocate review before execution."],
        blockers: ["ERR_ISMAILI_BOHRA_SPECIAL_REVIEW_REQUIRED: Ismaili / Dawoodi Bohra testamentary rules require independent advocate certification."],
        jurisdiction
      };
    }

    const isShiaTwelver = RECOGNIZED_SHIA_TWELVER.some(s => subSect.includes(s));
    const isSunniRecognized = RECOGNIZED_SUNNI_SCHOOLS.some(s => subSect.includes(s)) || subSect === 'sunni';

    if (!isShiaTwelver && !isSunniRecognized) {
      return {
        regime: PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED,
        isGoa: false,
        isParsi: false,
        isChristian: false,
        isMuslim: true,
        isHindu: false,
        requiresLegalReview: true,
        statuteCitation: "Muslim Personal Law (Shariat) Application Act, 1937 (School Unrecognized)",
        statutoryCrest: "LEGAL REVIEW REQUIRED — UNRECOGNIZED MUSLIM SCHOOL",
        reasons: [`The declared sect/school '${subSect}' is not an automated school of jurisprudence. Independent legal review is required.`],
        blockers: [`ERR_MUSLIM_SCHOOL_UNVERIFIED: Declared school '${subSect}' is not recognized for automated wasīyyat calculations.`],
        jurisdiction
      };
    }

    // Asset-Level Check: Agricultural Land Exclusion under Section 2 of Shariat Act, 1937
    // Broad scan covering agricultural, paddy, orchard, cashew, plantation, farm, khasra, etc.
    const assetsList = Array.isArray(willData.assets) ? willData.assets : [];
    const agriculturalAssets = assetsList.filter(a => {
      if (a.isAgriculturalLand === true) return true;
      const combined = `${a.type || ''} ${a.desc || ''} ${a.name || ''} ${a.details || ''} ${a.assetType || ''} ${a.landType || ''}`;
      return AGRICULTURAL_KEYWORD_REGEX.test(combined);
    });
    const hasAgri = agriculturalAssets.length > 0 || Boolean(p.hasAgriculturalLand || p.involvesAgriculturalLand);

    if (hasAgri) {
      return {
        regime: PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED,
        isGoa: false,
        isParsi: false,
        isChristian: false,
        isMuslim: true,
        isHindu: false,
        agriculturalAssets,
        requiresLegalReview: true,
        statuteCitation: "Muslim Personal Law (Shariat) Application Act, 1937 (Section 2 Agricultural Land Exclusion)",
        statutoryCrest: "LEGAL REVIEW REQUIRED — AGRICULTURAL LAND EXCLUDED UNDER SECTION 2",
        reasons: [
          "Questions relating to agricultural land are expressly excluded from Section 2 of the Shariat Act, 1937.",
          "Devolution of agricultural land is governed exclusively by state-specific tenancy and land revenue legislation.",
          "Automated testamentary distribution of agricultural assets under Shariat rules is prohibited."
        ],
        blockers: [
          "ERR_AGRICULTURAL_LAND_SHARIAT_EXCLUSION: Questions relating to agricultural land are expressly excluded from Section 2 of the Shariat Act, 1937 and are governed by state tenancy/land ceiling laws. Agricultural assets cannot be distributed under automated Shariat testamentary rules and require separate specialist advocate review."
        ],
        jurisdiction
      };
    }

    // Section 3 Declaration Verification (Genuine Evidence Validation):
    const declarationRecord = p.shariatDeclarationRecord;

    // Check naked boolean attempt:
    if (p.shariatSec3Declaration === true && (!declarationRecord || typeof declarationRecord !== 'object')) {
      return {
        regime: PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED,
        isGoa: false,
        isParsi: false,
        isChristian: false,
        isMuslim: true,
        isHindu: false,
        requiresLegalReview: true,
        statuteCitation: "Muslim Personal Law (Shariat) Application Act, 1937 (Section 3 Declaration Defective)",
        statutoryCrest: "LEGAL REVIEW REQUIRED — NAKED BOOLEAN DECLARATION INSUFFICIENT",
        reasons: ["A self-entered Boolean alone cannot activate Section 3. Actual verified declaration in prescribed form before prescribed authority is mandatory."],
        blockers: ["ERR_SHARIAT_SEC3_DEFECTIVE: Naked Boolean assertion is legally insufficient. Shariat Act Section 3 requires a verified declaration record in prescribed form filed before the prescribed authority."],
        jurisdiction
      };
    }

    const declValidation = validateShariatDeclarationRecord(declarationRecord, p);
    if (!declValidation.isValid) {
      return {
        regime: PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED,
        isGoa: false,
        isParsi: false,
        isChristian: false,
        isMuslim: true,
        isHindu: false,
        requiresLegalReview: true,
        statuteCitation: `Muslim Personal Law (Shariat) Application Act, 1937 (${declValidation.blockerCode})`,
        statutoryCrest: "LEGAL REVIEW REQUIRED — MUSLIM TESTAMENTARY REGIME UNCONFIRMED",
        reasons: [
          declValidation.reason,
          "Under Section 58 of the Indian Succession Act, Part VI is inapplicable to Muslim wills.",
          "Pre-existing personal law or customary testamentary regime must be affirmatively established by a qualified advocate."
        ],
        blockers: [
          `${declValidation.blockerCode}: ${declValidation.reason}`
        ],
        jurisdiction
      };
    }

    // Verified Section 3 Declaration Pathway
    const isShia = isShiaTwelver;
    const sectName = isShia ? 'Shia (Ithna-Ashari)' : `Sunni (${subSect.toUpperCase()})`;
    const regime = isShia ? PERSONAL_LAW_REGIMES.MUSLIM_SHIA : PERSONAL_LAW_REGIMES.MUSLIM_SUNNI;

    return {
      regime,
      governingSuccessionRegime: isShia ? "MUSLIM_SHIA_WASĪYYAT" : "MUSLIM_SUNNI_WASĪYYAT",
      isGoa: false,
      isParsi: false,
      isChristian: false,
      isMuslim: true,
      isShia,
      isHindu: false,
      sectName,
      shariatSec3Verified: true,
      statuteCitation: `Muslim Personal Law (Shariat) Application Act, 1937 (Section 3 Declaration Verified — ${sectName} Wasīyyat Law)`,
      statutoryCrest: `GOVERNED BY MUSLIM PERSONAL LAW (SHARIAT) — ${sectName.toUpperCase()}`,
      authorities: [
        "Mulla's Principles of Mahomedan Law (22nd Ed., Sections 115, 117, 118)",
        "Fyzee's Outlines of Muhammadan Law (5th Ed.)",
        "Shehammal v. Hasan Khani Rawther (2011) 9 SCC 223"
      ],
      wasīyyatRules: isShia
        ? "Shia (Ithna-Ashari) Wasīyyat: Bequests up to one-third (1/3) of the net estate are valid to heirs or non-heirs without requiring consent; bequests exceeding 1/3 require consent of legal heirs (Mulla, Section 117)."
        : "Sunni Wasīyyat: Bequests to non-heirs are valid up to one-third (1/3) of the net estate; bequests to legal heirs are inoperative and incapable of taking effect unless assented to by all other legal heirs following demise (Mulla, Sections 117 & 118).",
      reasons,
      blockers: [],
      jurisdiction
    };
  }

  // 2D-1. Jewish Pathway (Indian Succession Act, 1925 Part VI)
  if (religionLower.includes('jewish') || religionLower.includes('judaism')) {
    return {
      regime: PERSONAL_LAW_REGIMES.CHRISTIAN_CIVIL,
      governingSuccessionRegime: "INDIAN_SUCCESSION_ACT_PART_VI_JEWISH",
      isGoa: false,
      isParsi: false,
      isChristian: false,
      isJewish: true,
      isMuslim: false,
      isHindu: false,
      religion: p.religion || "Jewish",
      statuteCitation: "Indian Succession Act, 1925 (Part VI Testamentary Succession — Sections 59, 63, 105, 109, 119 applicable to Jewish Testators)",
      statutoryCrest: "GOVERNED BY THE INDIAN SUCCESSION ACT, 1925 (PART VI — JEWISH SUCCESSION)",
      reasons: ["Testamentary succession of Jewish persons in India is governed by Part VI of the Indian Succession Act, 1925, preserving distinct religious identity."],
      blockers: [],
      jurisdiction
    };
  }

  // 2D-2. Christian & Civil Marriage Pathway (Indian Succession Act Part VI — Sections 59, 63, 105, 109, 119)
  if (religionLower.includes('christian')) {
    return {
      regime: PERSONAL_LAW_REGIMES.CHRISTIAN_CIVIL,
      governingSuccessionRegime: "INDIAN_SUCCESSION_ACT_PART_VI",
      isGoa: false,
      isParsi: false,
      isChristian: true,
      isJewish: false,
      isMuslim: false,
      isHindu: false,
      religion: p.religion || "Christian",
      statuteCitation: "Indian Succession Act, 1925 (Part VI Testamentary Succession — Sections 59, 63, 105, 109, 119)",
      statutoryCrest: "GOVERNED BY THE INDIAN SUCCESSION ACT, 1925 (PART VI)",
      reasons: ["Testamentary succession of Christians is governed by Part VI of the Indian Succession Act, 1925."],
      blockers: [],
      jurisdiction
    };
  }

  // 2E. Hindu, Buddhist, Jain, Sikh Pathway (ISA Section 57 & HSA Section 30)
  const isHinduBuddhistJainSikh = religionLower.includes('hindu') ||
    religionLower.includes('buddhist') ||
    religionLower.includes('buddhism') ||
    religionLower.includes('jain') ||
    religionLower.includes('sikh');

  if (isHinduBuddhistJainSikh) {
    // Exact Execution Date Requirement: Never substitute current date!
    const execDateStr = (p.willExecutionDate || '').trim();
    if (!execDateStr) {
      return {
        regime: PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED,
        isGoa: false,
        isParsi: false,
        isChristian: false,
        isMuslim: false,
        isHindu: true,
        requiresLegalReview: true,
        statuteCitation: "Indian Succession Act, 1925 Section 57 (Execution Date Required)",
        statutoryCrest: "LEGAL REVIEW REQUIRED — WILL EXECUTION DATE MANDATORY",
        reasons: ["Will execution date is mandatory to evaluate statutory applicability under Section 57 of the Indian Succession Act, 1925. Substitution of current date is barred."],
        blockers: ["ERR_WILL_EXECUTION_DATE_REQUIRED: Will execution date is mandatory to evaluate Section 57(a), (b), or (c) applicability. Cannot assume current date."],
        jurisdiction
      };
    }

    const execDate = new Date(execDateStr);
    if (isNaN(execDate.getTime())) {
      return {
        regime: PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED,
        isGoa: false,
        isParsi: false,
        isChristian: false,
        isMuslim: false,
        isHindu: true,
        requiresLegalReview: true,
        statuteCitation: "Indian Succession Act, 1925 Section 57 (Invalid Execution Date)",
        statutoryCrest: "LEGAL REVIEW REQUIRED — INVALID EXECUTION DATE",
        reasons: ["Will execution date format is invalid."],
        blockers: ["ERR_INVALID_EXECUTION_DATE: Will execution date format is invalid."],
        jurisdiction
      };
    }

    // Historical Thresholds:
    const THRESHOLD_1870 = new Date('1870-09-01');
    const THRESHOLD_1927 = new Date('1927-01-01');

    if (execDate < THRESHOLD_1870) {
      return {
        regime: PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED,
        isGoa: false,
        isParsi: false,
        isChristian: false,
        isMuslim: false,
        isHindu: true,
        requiresLegalReview: true,
        statuteCitation: "Indian Succession Act, 1925 Section 57 (Pre-1870 Ineligible)",
        statutoryCrest: "LEGAL REVIEW REQUIRED — WILL EXECUTED PRIOR TO 1 SEPTEMBER 1870",
        reasons: ["Wills executed prior to 1 September 1870 are not governed by Section 57(a) or (b) and are ineligible for automated Section 57 routing."],
        blockers: ["ERR_PRE_1870_WILL_INELIGIBLE: Will executed prior to 1 September 1870 is ineligible for automated Section 57 routing."],
        jurisdiction
      };
    }

    // Territorial Ambiguity Check:
    if (p.isTerritoryAmbiguous === true) {
      return {
        regime: PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED,
        isGoa: false,
        isParsi: false,
        isChristian: false,
        isMuslim: false,
        isHindu: true,
        requiresLegalReview: true,
        statuteCitation: "Indian Succession Act, 1925 Section 57 (Territorial Ambiguity)",
        statutoryCrest: "LEGAL REVIEW REQUIRED — HISTORICAL TERRITORIAL BOUNDARY UNCERTAIN",
        reasons: ["Territorial boundaries for historical presidency town jurisdiction are uncertain; specialist advocate review is required."],
        blockers: ["ERR_TERRITORIAL_JURISDICTION_AMBIGUOUS: Territorial boundaries for historical presidency town jurisdiction are uncertain."],
        jurisdiction
      };
    }

    // Territorial Identification under Section 57(a) and (b):
    // Clause (a): Made on/after 1 Sept 1870 within historical Bengal LT-Governor territory or High Court OOCJ at Madras/Bombay
    const execPlaceCode = (p.historicalTerritoryCode || p.territorialJurisdictionCode || '').trim().toUpperCase();
    const isHistoricalPresidencyExec = execPlaceCode === HISTORICAL_PRESIDENCY_CODES.BOMBAY_OOCJ ||
      execPlaceCode === HISTORICAL_PRESIDENCY_CODES.MADRAS_OOCJ ||
      execPlaceCode === HISTORICAL_PRESIDENCY_CODES.BENGAL_LIEUTENANT_GOVERNOR;

    const execPlace = (p.willExecutionPlace || p.placeOfExecution || '').trim().toLowerCase();
    const matchesModernPresidencyCity = ['calcutta', 'kolkata', 'madras', 'chennai', 'bombay', 'mumbai'].some(t =>
      execPlace === t || execPlace.startsWith(t + ',') || execPlace.startsWith(t + ' ') || execPlace.includes(t)
    );

    // If modern presidency city is provided without verified historical territory code, emit ambiguity blocker
    if (matchesModernPresidencyCity && !isHistoricalPresidencyExec) {
      return {
        regime: PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED,
        isGoa: false,
        isParsi: false,
        isChristian: false,
        isMuslim: false,
        isHindu: true,
        requiresLegalReview: true,
        statuteCitation: "Indian Succession Act, 1925 Section 57(a) (Territorial Ambiguity)",
        statutoryCrest: "LEGAL REVIEW REQUIRED — MODERN PRESIDENCY CITY REQUIRES HISTORICAL CODE",
        reasons: ["Will execution place references a modern city historically linked to a presidency town without verified historical territory code (OOCJ / 1870 Bengal boundary). Independent advocate review is mandatory."],
        blockers: ["ERR_TERRITORIAL_JURISDICTION_AMBIGUOUS: Modern presidency city provided without verified historical territory code. Historical boundary limits cannot be assumed."],
        jurisdiction
      };
    }

    const hasPresidencyExecution = isHistoricalPresidencyExec;

    // Clause (b): Made outside those territories, so far as relates to immovable property situated within those territories
    // Evaluate each immovable asset individually (never rely on bare boolean or modern city name without historical code)
    const assetsList = Array.isArray(willData.assets) ? willData.assets : [];
    const immovableAssets = assetsList.filter(a => a.isImmovable === true || a.type === 'Real Estate' || a.type === 'Land' || a.type === 'House');

    // Check individual immovable assets for modern presidency city without historical code:
    const ambiguousImmovable = immovableAssets.find(a => {
      const code = (a.historicalTerritoryCode || a.territorialJurisdictionCode || '').trim().toUpperCase();
      if (code === HISTORICAL_PRESIDENCY_CODES.BOMBAY_OOCJ ||
          code === HISTORICAL_PRESIDENCY_CODES.MADRAS_OOCJ ||
          code === HISTORICAL_PRESIDENCY_CODES.BENGAL_LIEUTENANT_GOVERNOR) {
        return false;
      }
      const loc = `${a.location || ''} ${a.city || ''} ${a.addressCity || ''} ${a.state || ''} ${a.desc || ''}`.toLowerCase();
      return ['calcutta', 'kolkata', 'madras', 'chennai', 'bombay', 'mumbai'].some(t => loc.includes(t));
    });

    const immovLoc = (p.immovablePropertyLocation || '').trim().toLowerCase();
    const personalHistCode = (p.immovablePropertyHistoricalCode || '').trim().toUpperCase();
    const hasPersonalHistCode = personalHistCode === HISTORICAL_PRESIDENCY_CODES.BOMBAY_OOCJ ||
      personalHistCode === HISTORICAL_PRESIDENCY_CODES.MADRAS_OOCJ ||
      personalHistCode === HISTORICAL_PRESIDENCY_CODES.BENGAL_LIEUTENANT_GOVERNOR;

    const matchesModernImmovLocation = ['calcutta', 'kolkata', 'madras', 'chennai', 'bombay', 'mumbai'].some(t =>
      immovLoc === t || immovLoc.startsWith(t + ',') || immovLoc.startsWith(t + ' ') || immovLoc.includes(t)
    );

    if (ambiguousImmovable || (matchesModernImmovLocation && !hasPersonalHistCode)) {
      return {
        regime: PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED,
        isGoa: false,
        isParsi: false,
        isChristian: false,
        isMuslim: false,
        isHindu: true,
        requiresLegalReview: true,
        statuteCitation: "Indian Succession Act, 1925 Section 57(b) (Territorial Ambiguity)",
        statutoryCrest: "LEGAL REVIEW REQUIRED — IMMOVABLE PROPERTY HISTORICAL JURISDICTION UNVERIFIED",
        reasons: ["Immovable asset references a modern city historically linked to a presidency town without verified historical territory code. Independent advocate review is mandatory."],
        blockers: ["ERR_TERRITORIAL_JURISDICTION_AMBIGUOUS: Immovable asset located in modern presidency city without verified historical territory code. Historical boundary limits cannot be assumed."],
        jurisdiction
      };
    }

    const presidencyImmovableAssets = immovableAssets.filter(a => {
      const code = (a.historicalTerritoryCode || a.territorialJurisdictionCode || '').trim().toUpperCase();
      return code === HISTORICAL_PRESIDENCY_CODES.BOMBAY_OOCJ ||
        code === HISTORICAL_PRESIDENCY_CODES.MADRAS_OOCJ ||
        code === HISTORICAL_PRESIDENCY_CODES.BENGAL_LIEUTENANT_GOVERNOR;
    });

    const hasPresidencyImmovables = presidencyImmovableAssets.length > 0 || hasPersonalHistCode;

    let section57Clause = null;
    let scheduleIIIApplicable = false;

    if (hasPresidencyExecution) {
      section57Clause = "Section 57(a) (Presidency Town Execution on or after 1 September 1870)";
      scheduleIIIApplicable = true;
    } else if (hasPresidencyImmovables) {
      section57Clause = "Section 57(b) (Presidency Town Immovables on or after 1 September 1870)";
      scheduleIIIApplicable = true;
    } else if (execDate >= THRESHOLD_1927) {
      // Clause (c) is strictly residual: applies to wills not covered by (a) or (b) executed on or after 1 January 1927
      section57Clause = "Section 57(c) (Post-1927 Will outside Clauses (a) & (b))";
      scheduleIIIApplicable = true;
    } else {
      // Pre-1927 execution outside presidency towns without presidency immovables is NOT covered by Section 57(c)
      return {
        regime: PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED,
        isGoa: false,
        isParsi: false,
        isChristian: false,
        isMuslim: false,
        isHindu: true,
        requiresLegalReview: true,
        statuteCitation: "Indian Succession Act, 1925 Section 57(c) (Pre-1927 Non-Presidency)",
        statutoryCrest: "LEGAL REVIEW REQUIRED — PRE-1927 WILL OUTSIDE PRESIDENCY TOWNS",
        reasons: ["Will executed prior to 1 January 1927 outside presidency territories without presidency immovables is not governed by Section 57(c) and requires advocate review."],
        blockers: ["ERR_PRE_1927_NON_PRESIDENCY_WILL: Will executed prior to 1 January 1927 outside presidency towns is not governed by Section 57(c)."],
        jurisdiction
      };
    }

    return {
      regime: PERSONAL_LAW_REGIMES.HINDU,
      governingSuccessionRegime: "HINDU_SUCCESSION_ACT_SECTION_30",
      isGoa: false,
      isParsi: false,
      isChristian: false,
      isMuslim: false,
      isHindu: true,
      section57Clause,
      scheduleIIIApplicable,
      statuteCitation: "Hindu Succession Act, 1956 (Section 30) read with Indian Succession Act, 1925 (Sections 57 & 58, Schedule III)",
      statutoryCrest: "GOVERNED BY THE HINDU SUCCESSION ACT, 1956 & INDIAN SUCCESSION ACT, 1925 (SCHEDULE III)",
      coparcenaryNotice: "Testamentary power extends to testator's undivided coparcenary interest in Mitakshara coparcenary property pursuant to Section 30 of the Hindu Succession Act, 1956.",
      reasons: [
        ...reasons,
        `Evaluated under ${section57Clause}.`,
        "Pursuant to Section 58, Part VI applies to Hindu wills strictly subject to the restrictions and modifications set out in Schedule III.",
        "Undivided coparcenary interest may be bequeathed pursuant to Section 30 of the Hindu Succession Act, 1956."
      ],
      blockers: [],
      jurisdiction
    };
  }

  // 2E. Unrecognized / Atheist / Agnostic without Legal Regime:
  return {
    regime: PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED,
    isGoa: false,
    isParsi: false,
    isChristian: false,
    isMuslim: false,
    isHindu: false,
    requiresLegalReview: true,
    statuteCitation: `Unrecognized Personal Law (${p.religion}) — Advocate Review Required`,
    statutoryCrest: "LEGAL REVIEW REQUIRED — UNRECOGNIZED PERSONAL LAW REGIME",
    reasons: [`The declared religion/tradition '${p.religion}' does not correspond to an automated statutory succession pathway. Independent legal review by an advocate is required to establish testamentary rules.`],
    blockers: [`UNRECOGNIZED_PERSONAL_LAW: Religious declaration '${p.religion}' requires legal review.`],
    jurisdiction
  };
}
