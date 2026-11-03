/**
 * SmartWill India — Legal Engine 2.1
 * Personal Law & Statutory Regime Router
 *
 * Enforces five distinct statutory pathways with strict jurisdiction priority:
 * 1. Goa Succession Act, 2012 (Goa Act 23 of 2016, Act 35 of 2023)
 *    - Jose Paulo Coutinho (2019) 20 SCC 85 & Ashabi Khan (2007) (4) ALL MR 604:
 *      Goa civil succession law governs Goan domiciles as special and local law.
 *      Religion does not divert away from the Goa Succession Act.
 * 2. Parsi Succession under Indian Succession Act, 1925 (Sections 50–56 & Part VI with Parsi statutory scope)
 * 3. Christian & Civil Marriages under Indian Succession Act, 1925 (Part VI - Sections 57, 58, 59, 63)
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
    return {
      regime: PERSONAL_LAW_REGIMES.GOA_UCC,
      isGoa: true,
      isParsi: false,
      isChristian: false,
      isMuslim: false,
      isHindu: false,
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
      blockers: ["ERR_GOA_JURISDICTION_UNCONFIRMED: Succession jurisdiction status under Section 1(4) is unconfirmed. Pre-flight audit blocks generation."],
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

  // 2A. Parsi Pathway (Indian Succession Act, 1925 Part VI & Sections 50–56)
  if (religionLower.includes('parsi') || religionLower.includes('zoroastrian')) {
    return {
      regime: PERSONAL_LAW_REGIMES.PARSI,
      isGoa: false,
      isParsi: true,
      isChristian: false,
      isMuslim: false,
      isHindu: false,
      statuteCitation: "Indian Succession Act, 1925 (Part VI Testamentary Succession with Parsi Scope under Sections 57 & 58; Sections 50–56 apply to Intestacy)",
      statutoryCrest: "GOVERNED BY THE INDIAN SUCCESSION ACT, 1925 (PARSI TESTAMENTARY SUCCESSION & PART VI)",
      reasons: ["Parsi testamentary succession is governed by Part VI of the Indian Succession Act, 1925."],
      blockers: [],
      jurisdiction
    };
  }

  // 2B. Muslim Pathway (Shariat Act, 1937 Section 3 Audit & ISA Section 58 Exclusion)
  if (religionLower.includes('muslim') || religionLower.includes('islam')) {
    // ISA Section 58 exclusion notice
    reasons.push("Indian Succession Act, 1925 Section 58 expressly excludes testamentary succession to the property of any Muhammadan from Part VI.");

    const isExplicitShia = subSect.includes('shia') || subSect.includes('ithna');
    const isIsmailiOrBohra = subSect.includes('ismaili') || subSect.includes('bohra');

    if (isIsmailiOrBohra) {
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

    // Section 3 Declaration Verification:
    // Shariat Act Section 3 allows a competent Muslim residing in Shariat territory to declare that
    // Section 2 rules apply to wills and legacies. Section 2 excludes agricultural land.
    const hasSection3Declaration = Boolean(p.shariatSec3Declaration || (p.shariatDeclarationRecord && p.shariatDeclarationRecord.isVerified));
    const isContractCompetent = p.contractCompetent !== false; // Indian Contract Act Section 11 competence
    const hasAgriculturalLand = Boolean(p.hasAgriculturalLand || p.involvesAgriculturalLand);

    if (hasAgriculturalLand) {
      reasons.push("Shariat Act, 1937 Section 2 Exclusion: Questions relating to agricultural land are excluded from Section 2 and are governed by state tenancy/land revenue legislation.");
    }

    // Missing Section 3 declaration fallback:
    // When no Section 3 declaration is found, DO NOT automatically activate Shariat calculations,
    // nor assume Muslim testamentary law is inapplicable. Emit fail-closed review blocker.
    if (!hasSection3Declaration) {
      return {
        regime: PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED,
        isGoa: false,
        isParsi: false,
        isChristian: false,
        isMuslim: true,
        isHindu: false,
        requiresLegalReview: true,
        statuteCitation: "Muslim Personal Law (Shariat) Application Act, 1937 (Section 3 Declaration Unconfirmed)",
        statutoryCrest: "LEGAL REVIEW REQUIRED — MUSLIM TESTAMENTARY REGIME UNCONFIRMED",
        reasons: [
          "No verified declaration under Section 3 of the Muslim Personal Law (Shariat) Application Act, 1937 was produced.",
          "Under Section 58 of the Indian Succession Act, Part VI is inapplicable.",
          "Pre-existing personal law or customary testamentary regime must be affirmatively established by a qualified advocate."
        ],
        blockers: [
          "ERR_MUSLIM_TESTAMENTARY_REGIME_UNCONFIRMED: Missing Section 3 Shariat declaration or unconfirmed testamentary personal law basis. Pre-flight audit blocks generation."
        ],
        jurisdiction
      };
    }

    if (!isContractCompetent) {
      return {
        regime: PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED,
        isGoa: false,
        isParsi: false,
        isChristian: false,
        isMuslim: true,
        isHindu: false,
        requiresLegalReview: true,
        statuteCitation: "Muslim Personal Law (Shariat) Application Act, 1937 (Section 3 Incompetence)",
        statutoryCrest: "LEGAL REVIEW REQUIRED — CONTRACTUAL INCOMPETENCE UNDER SECTION 11",
        reasons: ["Declarant must be competent to contract under Section 11 of the Indian Contract Act, 1872 to make a valid Section 3 declaration."],
        blockers: [
          "ERR_SHARIAT_SEC3_INCOMPETENT: Declarant does not satisfy Indian Contract Act, 1872 Section 11 competence requirements."
        ],
        jurisdiction
      };
    }

    // Verified Section 3 Declaration Pathway
    const isShia = isExplicitShia;
    const sectName = isShia ? 'Shia (Ithna-Ashari)' : 'Sunni (Hanafi / Shafi / Maliki / Hanbali)';
    const regime = isShia ? PERSONAL_LAW_REGIMES.MUSLIM_SHIA : PERSONAL_LAW_REGIMES.MUSLIM_SUNNI;

    return {
      regime,
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

  // 2C. Christian & Civil Marriage Pathway (Indian Succession Act Part VI)
  if (religionLower.includes('christian') || religionLower.includes('jewish') || religionLower.includes('special marriage')) {
    return {
      regime: PERSONAL_LAW_REGIMES.CHRISTIAN_CIVIL,
      isGoa: false,
      isParsi: false,
      isChristian: true,
      isMuslim: false,
      isHindu: false,
      statuteCitation: "Indian Succession Act, 1925 (Part VI - Sections 57, 58, 59, 63, 105, 109, 119)",
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
    // Multi-tier Section 57 Evaluation:
    const execPlace = (p.willExecutionPlace || p.placeOfExecution || '').trim().toLowerCase();
    const hasPresidencyExecution = execPlace.includes('calcutta') || execPlace.includes('kolkata') ||
                                   execPlace.includes('madras') || execPlace.includes('chennai') ||
                                   execPlace.includes('bombay') || execPlace.includes('mumbai') ||
                                   execPlace.includes('bengal');

    const immovableLocation = (p.immovablePropertyLocation || '').trim().toLowerCase();
    const hasPresidencyImmovables = immovableLocation.includes('calcutta') || immovableLocation.includes('kolkata') ||
                                    immovableLocation.includes('madras') || immovableLocation.includes('chennai') ||
                                    immovableLocation.includes('bombay') || immovableLocation.includes('mumbai') ||
                                    immovableLocation.includes('bengal') || Boolean(p.hasPresidencyTownImmovable);

    const execDate = p.willExecutionDate ? new Date(p.willExecutionDate) : new Date();
    const isPost1927 = execDate >= new Date('1927-01-01');

    let section57Clause = null;
    let scheduleIIIApplicable = false;

    if (hasPresidencyExecution) {
      section57Clause = "Section 57(a) (Presidency Town Execution)";
      scheduleIIIApplicable = true;
    } else if (hasPresidencyImmovables) {
      section57Clause = "Section 57(b) (Presidency Town Immoveables)";
      scheduleIIIApplicable = true;
    } else if (isPost1927) {
      // Clause (c) is RESIDUAL: strictly applies to wills not covered by (a) or (b)
      section57Clause = "Section 57(c) (Post-1927 Will outside Clauses (a) & (b))";
      scheduleIIIApplicable = true;
    }

    return {
      regime: PERSONAL_LAW_REGIMES.HINDU,
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
        `Evaluated under ${section57Clause || 'Indian Succession Act, 1925 Section 57'}.`,
        "Pursuant to Section 58, Part VI applies to Hindu wills strictly subject to the restrictions and modifications set out in Schedule III.",
        "Undivided coparcenary interest may be bequeathed pursuant to Section 30 of the Hindu Succession Act, 1956."
      ],
      blockers: [],
      jurisdiction
    };
  }

  // 2E. Unrecognized / Atheist / Agnostic without Legal Regime:
  // Must NEVER silently default to Hindu or ISA Part VI!
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
