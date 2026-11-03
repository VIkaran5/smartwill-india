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
  HINDU: "HINDU"
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

  const religionLower = (p.religion || 'Hindu').trim().toLowerCase();
  const subSect = (p.sect || p.subSect || '').trim().toLowerCase();

  // 2. Parsi Pathway
  if (religionLower.includes('parsi') || religionLower.includes('zoroastrian')) {
    return {
      regime: PERSONAL_LAW_REGIMES.PARSI,
      isGoa: false,
      isParsi: true,
      isChristian: false,
      isMuslim: false,
      isHindu: false,
      statuteCitation: "Indian Succession Act, 1925 (Sections 50–56 & Part VI with Parsi Testamentary Scope under Sections 57 & 58)",
      statutoryCrest: "GOVERNED BY THE INDIAN SUCCESSION ACT, 1925 (PARSI TESTAMENTARY SUCCESSION & PART VI)",
      jurisdiction
    };
  }

  // 3. Muslim Pathway (Sunni vs Shia distinction)
  if (religionLower.includes('muslim') || religionLower.includes('islam')) {
    const isShia = subSect.includes('shia') || subSect.includes('ithna') || subSect.includes('ismaili') || subSect.includes('bohra');
    const regime = isShia ? PERSONAL_LAW_REGIMES.MUSLIM_SHIA : PERSONAL_LAW_REGIMES.MUSLIM_SUNNI;
    const sectName = isShia ? 'Shia (Ithna-Ashari)' : 'Sunni (Hanafi/Shafi)';

    return {
      regime,
      isGoa: false,
      isParsi: false,
      isChristian: false,
      isMuslim: true,
      isShia,
      isHindu: false,
      sectName,
      statuteCitation: `Muslim Personal Law (Shariat) Application Act, 1937 (${sectName} Testamentary Law / Wasīyyat)`,
      statutoryCrest: `GOVERNED BY MUSLIM PERSONAL LAW (SHARIAT) — ${sectName.toUpperCase()} SUCCESSION`,
      wasīyyatRules: isShia
        ? "Bequests up to one-third (1/3) of the net estate are valid whether in favor of an heir or non-heir without requiring consent; bequests exceeding one-third require post-demise consent of legal heirs."
        : "Bequests to non-heirs are valid up to one-third (1/3) of the net estate; bequests to legal heirs or bequests exceeding one-third operate strictly subject to the consent (express or implied) of all other surviving legal heirs following demise.",
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
  return {
    regime: PERSONAL_LAW_REGIMES.HINDU,
    isGoa: false,
    isParsi: false,
    isChristian: false,
    isMuslim: false,
    isHindu: true,
    statuteCitation: "Hindu Succession Act, 1956 (Section 30) read with Indian Succession Act, 1925 (Schedule III)",
    statutoryCrest: "GOVERNED BY THE HINDU SUCCESSION ACT, 1956 & INDIAN SUCCESSION ACT, 1925 (SCHEDULE III)",
    jurisdiction
  };
}
