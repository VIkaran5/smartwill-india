/**
 * SmartWill India — Legal Engine 2.1
 * Personal Law & Statutory Regime Router
 *
 * Enforces five distinct statutory pathways:
 * 1. Goa Succession Act, 2012 (Goa Act 23 of 2016, Act 35 of 2023)
 * 2. Parsi Succession under Indian Succession Act, 1925 (Sections 50–56 & Part VI with Parsi statutory scope)
 * 3. Christian & Civil Marriages under Indian Succession Act, 1925 (Part VI - Sections 57, 58, 59, 63)
 * 4. Muslim Personal Law (Shariat) Application Act, 1937 (Sunni Hanafi vs Shia Ithna-Ashari Wasīyyat rules)
 * 5. Hindu Succession Act, 1956 (Section 30) read with Indian Succession Act, 1925 (Schedule III)
 */

import { classifyGoaJurisdiction, JURISDICTION_STATUS } from './goaJurisdiction.js';

export const PERSONAL_LAW_REGIMES = {
  GOA_UCC: "GOA_UCC",
  PARSI: "PARSI",
  CHRISTIAN_CIVIL: "CHRISTIAN_CIVIL",
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
  const jurisdiction = classifyGoaJurisdiction(p);

  // 1. Goa Uniform Civil Code Pathway
  if (jurisdiction.status === JURISDICTION_STATUS.GOA_ACT_APPLICABLE) {
    return {
      regime: PERSONAL_LAW_REGIMES.GOA_UCC,
      isGoa: true,
      isParsi: false,
      isChristian: false,
      isMuslim: false,
      isHindu: false,
      statuteCitation: "Goa Succession, Special Notaries and Inventory Proceeding Act, 2012 (Goa Act 23 of 2016 & Amendment Act 35 of 2023)",
      statutoryCrest: "GOVERNED BY THE GOA SUCCESSION ACT, 2012 (GOA ACT 23 OF 2016 & AMENDMENT ACT 35 OF 2023)",
      jurisdiction
    };
  }

  // Mandatory Gate: Unknown or missing religion must NEVER silently default to Hindu
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
      jurisdiction
    };
  }

  const religionLower = p.religion.trim().toLowerCase();
  const subSect = (p.sect || p.subSect || '').trim().toLowerCase();

  // 2. Parsi Pathway
  // Distinctly separates testamentary succession under Part VI from intestacy provisions (Sections 50–56)
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
      jurisdiction
    };
  }

  // 3. Muslim Pathway (Sunni vs Shia distinction with mandatory school verification)
  if (religionLower.includes('muslim') || religionLower.includes('islam')) {
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
        blockers: ["ISMAILI_BOHRA_SPECIAL_REVIEW_REQUIRED: Ismaili / Dawoodi Bohra testamentary rules require independent advocate certification."],
        jurisdiction
      };
    }

    const isShia = isExplicitShia;
    const regime = isShia ? PERSONAL_LAW_REGIMES.MUSLIM_SHIA : PERSONAL_LAW_REGIMES.MUSLIM_SUNNI;
    const sectName = isShia ? 'Shia (Ithna-Ashari)' : 'Sunni (Hanafi / Shafi / Maliki / Hanbali)';

    return {
      regime,
      isGoa: false,
      isParsi: false,
      isChristian: false,
      isMuslim: true,
      isShia,
      isHindu: false,
      sectName,
      requiresExpertLegalReview: true, // School-specific Wasīyyat rules require advocate verification
      statuteCitation: `Muslim Personal Law (Shariat) Application Act, 1937 (${sectName} Wasīyyat Law)`,
      statutoryCrest: `GOVERNED BY MUSLIM PERSONAL LAW (SHARIAT) — ${sectName.toUpperCase()}`,
      wasīyyatRules: isShia
        ? "Shia (Ithna-Ashari) Wasīyyat: Bequests up to one-third (1/3) of the net estate are valid to heirs or non-heirs without requiring consent; bequests exceeding 1/3 require consent of legal heirs."
        : "Sunni Wasīyyat: Bequests to non-heirs are valid up to one-third (1/3) of the net estate; bequests to legal heirs or exceeding 1/3 operate strictly subject to the consent of all surviving legal heirs following demise.",
      jurisdiction
    };
  }

  // 4. Christian & Civil Marriage Pathway
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
      jurisdiction
    };
  }

  // 5. Hindu, Buddhist, Jain, Sikh Pathway
  const isHinduBuddhistJainSikh = religionLower.includes('hindu') ||
    religionLower.includes('buddhist') ||
    religionLower.includes('buddhism') ||
    religionLower.includes('jain') ||
    religionLower.includes('sikh');

  if (isHinduBuddhistJainSikh) {
    return {
      regime: PERSONAL_LAW_REGIMES.HINDU,
      isGoa: false,
      isParsi: false,
      isChristian: false,
      isMuslim: false,
      isHindu: true,
      statuteCitation: "Hindu Succession Act, 1956 (Section 30) read with Indian Succession Act, 1925 (Schedule III)",
      statutoryCrest: "GOVERNED BY THE HINDU SUCCESSION ACT, 1956 & INDIAN SUCCESSION ACT, 1925 (SCHEDULE III)",
      coparcenaryNotice: "Testamentary power extends to testator's undivided coparcenary interest in Mitakshara coparcenary property pursuant to Section 30 of the Hindu Succession Act, 1956.",
      jurisdiction
    };
  }

  // Unrecognized Non-Empty Religion: Must NEVER silently default to Hindu!
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
