/**
 * SmartWill India — Legal Engine 2.1
 * Personal Law & Statutory Regime Router
 *
 * Enforces five distinct statutory pathways with strict jurisdiction priority:
 * 1. Goa Succession Act, 2012 (Goa Act 23 of 2016, Act 35 of 2023)
 *    - Jose Paulo Coutinho (2019) 20 SCC 85 & Ashabi Khan (2007) (4) ALL MR 604:
 *      Goa civil succession law governs Goan domiciles as special and local law.
 *      Religion does not divert away from the Goa Succession Act.
 * 2. Parsi Succession under Indian Succession Act, 1925 (Part VI with Section 58 scope & Sections 50–56 for Intestacy)
 * 3. Christian & Civil Marriages under Indian Succession Act, 1925 (Part VI — Sections 59, 63, 105, 109, 119)
 * 4. Muslim Personal Law (Shariat) Application Act, 1937 (Section 1(2), 2 & 3 declaration audit)
 * 5. Hindu Succession Act, 1956 (Section 30) read with Indian Succession Act, 1925 (Section 57(a), (b), (c) & Schedule III)
 */

import { classifyGoaJurisdiction, JURISDICTION_STATUS } from './goaJurisdiction.js';

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

const RECOGNIZED_SUNNI_SCHOOLS = ['hanafi', 'shafi', "shafi'i", 'maliki', 'hanbali'];
const RECOGNIZED_SHIA_TWELVER = ['shia', 'ithna-ashari', 'ithna ashari', 'twelver', "ja'fari", 'jafari'];
const CUSTOMARY_SHIA_SCHOOLS = ['ismaili', 'bohra', 'dawoodi bohra', 'khoja'];

const HISTORICAL_PRESIDENCY_TOWNS = ['calcutta', 'kolkata', 'madras', 'chennai', 'bombay', 'mumbai'];

/**
 * Validates a Section 3 Shariat declaration record against statutory criteria.
 * Naked booleans are strictly rejected.
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

  const authority = (record.prescribedAuthority || '').trim();
  if (!authority) {
    return {
      isValid: false,
      blockerCode: "ERR_SHARIAT_SEC3_DEFECTIVE",
      reason: "Missing prescribed authority before whom Section 3 declaration was executed."
    };
  }

  const isPrescribedForm = record.prescribedForm === true || record.formType === 'FORM_A_SHARIAT_SECTION_3';
  if (!isPrescribedForm) {
    return {
      isValid: false,
      blockerCode: "ERR_SHARIAT_SEC3_DEFECTIVE",
      reason: "Declaration was not executed in the prescribed statutory form."
    };
  }

  // Contract Act Section 11 Competence: Must be explicitly established (never default to true)
  if (record.contractCompetent !== true && personal.contractCompetent !== true) {
    return {
      isValid: false,
      blockerCode: "ERR_SHARIAT_SEC3_INCOMPETENT",
      reason: "Declarant competence under Section 11 of the Indian Contract Act, 1872 is unverified or false."
    };
  }

  // Residence in territory to which Shariat Act extends under Section 1(2)
  const residenceTerritory = (record.residenceTerritory || personal.addressState || '').trim().toLowerCase();
  if (!residenceTerritory || residenceTerritory.includes('goa')) {
    return {
      isValid: false,
      blockerCode: "ERR_SHARIAT_SEC3_RESIDENCE_UNVERIFIED",
      reason: "Declarant must reside in territory to which the Shariat Act extends (outside excluded special local jurisdictions such as Goa)."
    };
  }

  // Section 3(2) Appeal status:
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

  if (record.verificationStatus !== 'VERIFIED') {
    return {
      isValid: false,
      blockerCode: "ERR_MUSLIM_TESTAMENTARY_REGIME_UNCONFIRMED",
      reason: `Declaration verification outcome is '${record.verificationStatus}', expected 'VERIFIED'.`
    };
  }

  if (!record.verifiedBy || !record.verificationDate) {
    return {
      isValid: false,
      blockerCode: "ERR_SHARIAT_SEC3_DEFECTIVE",
      reason: "Missing verifying advocate identity or verification date on declaration record."
    };
  }

  return { isValid: true, blockerCode: null, reason: "Declaration record verified." };
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

  // 2A. Parsi Pathway (Indian Succession Act, 1925 Part VI with Section 58 Scope; Sections 50–56 for Intestacy)
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

  // 2B. Muslim Pathway (Shariat Act, 1937 Section 3 Audit & ISA Section 58 Exclusion)
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
    const assetsList = Array.isArray(willData.assets) ? willData.assets : [];
    const agriculturalAssets = assetsList.filter(a =>
      a.isAgriculturalLand === true ||
      (a.type && a.type.toString().toLowerCase().includes('agricultural')) ||
      (a.desc && a.desc.toString().toLowerCase().includes('agricultural'))
    );
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
    // Shariat Act Section 3 allows a competent Muslim residing in Shariat territory to declare that
    // Section 2 rules apply to wills and legacies. Naked boolean assertions are strictly barred.
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

  // 2C. Christian & Civil Marriage Pathway (Indian Succession Act Part VI — Sections 59, 63, 105, 109, 119)
  if (religionLower.includes('christian') || religionLower.includes('jewish') || religionLower.includes('special marriage')) {
    return {
      regime: PERSONAL_LAW_REGIMES.CHRISTIAN_CIVIL,
      governingSuccessionRegime: "INDIAN_SUCCESSION_ACT_PART_VI",
      isGoa: false,
      isParsi: false,
      isChristian: true,
      isMuslim: false,
      isHindu: false,
      statuteCitation: "Indian Succession Act, 1925 (Part VI Testamentary Succession — Sections 59, 63, 105, 109, 119)",
      statutoryCrest: "GOVERNED BY THE INDIAN SUCCESSION ACT, 1925 (PART VI)",
      reasons: ["Testamentary succession of Christians and civil marriages is governed by Part VI of the Indian Succession Act, 1925."],
      blockers: [],
      jurisdiction
    };
  }

  // 2D. Hindu, Buddhist, Jain, Sikh Pathway (ISA Section 57 & HSA Section 30)
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

    // Territorial Identification:
    const execPlace = (p.willExecutionPlace || p.placeOfExecution || '').trim().toLowerCase();
    const hasPresidencyExecution = HISTORICAL_PRESIDENCY_TOWNS.some(t =>
      execPlace === t || execPlace.startsWith(t + ',') || execPlace.startsWith(t + ' ') || execPlace.includes(t)
    );

    const immovableLocation = (p.immovablePropertyLocation || '').trim().toLowerCase();
    const hasPresidencyImmovables = HISTORICAL_PRESIDENCY_TOWNS.some(t =>
      immovableLocation === t || immovableLocation.startsWith(t + ',') || immovableLocation.startsWith(t + ' ') || immovableLocation.includes(t)
    ) || Boolean(p.hasPresidencyTownImmovable);

    let section57Clause = null;
    let scheduleIIIApplicable = false;

    if (hasPresidencyExecution) {
      section57Clause = "Section 57(a) (Presidency Town Execution on or after 1 September 1870)";
      scheduleIIIApplicable = true;
    } else if (hasPresidencyImmovables) {
      section57Clause = "Section 57(b) (Presidency Town Immoveables on or after 1 September 1870)";
      scheduleIIIApplicable = true;
    } else if (execDate >= THRESHOLD_1927) {
      // Clause (c) is strictly residual: applies to wills not covered by (a) or (b) executed on or after 1 January 1927
      section57Clause = "Section 57(c) (Post-1927 Will outside Clauses (a) & (b))";
      scheduleIIIApplicable = true;
    } else {
      // Pre-1927 execution outside presidency towns is NOT covered by Section 57(c)
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
        reasons: ["Will executed prior to 1 January 1927 outside presidency towns is not governed by Section 57(c) and requires advocate review."],
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
