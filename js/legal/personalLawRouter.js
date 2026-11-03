/**
 * SmartWill India — Legal Engine 2.1
 * Personal Law & Statutory Regime Router
 *
 * Enforces decoupled personal law routing across:
 * 1. Goa Succession Act, 2012 (Goa Act 23 of 2016)
 * 2. Hindu Succession Act, 1956 (with ISA 1925 Schedule III)
 * 3. Muslim Personal Law (Shariat) (Wasīyyat with 1/3 non-heir limit & heir consents)
 * 4. Indian Succession Act, 1925 (Part VI - Christian, Parsi, Civil marriages)
 */

import { classifyGoaJurisdiction, JURISDICTION_STATUS } from './goaJurisdiction.js';

export const PERSONAL_LAW_REGIMES = {
  GOA_UCC: "GOA_UCC",
  HINDU: "HINDU",
  MUSLIM_SHARIAT: "MUSLIM_SHARIAT",
  ISA_CHRISTIAN_PARSI: "ISA_CHRISTIAN_PARSI",
  ISA_GENERAL: "ISA_GENERAL"
};

/**
 * Determines the authoritative personal law regime for the testator.
 * @param {Object} willData - Full will data
 * @returns {Object} { regime, statutoryCrest, statuteCitation, isGoa, isHindu, isMuslim, isChristianParsi }
 */
export function resolvePersonalLawRegime(willData = {}) {
  const p = willData.personal || {};
  const jurisdiction = classifyGoaJurisdiction(p);

  // If established under Section 1(4) of Goa Act 23 of 2016
  if (jurisdiction.status === JURISDICTION_STATUS.GOA_ACT_APPLICABLE) {
    return {
      regime: PERSONAL_LAW_REGIMES.GOA_UCC,
      isGoa: true,
      isHindu: false,
      isMuslim: false,
      isChristianParsi: false,
      statuteCitation: "Goa Succession, Special Notaries and Inventory Proceeding Act, 2012 (Goa Act 23 of 2016)",
      statutoryCrest: "GOVERNED BY THE GOA SUCCESSION ACT, 2012 (GOA ACT 23 OF 2016 & AMENDMENT ACT 35 OF 2023)",
      jurisdiction
    };
  }

  const religionLower = (p.religion || 'Hindu').trim().toLowerCase();

  // Muslim Personal Law
  if (religionLower.includes('muslim') || religionLower.includes('islam')) {
    return {
      regime: PERSONAL_LAW_REGIMES.MUSLIM_SHARIAT,
      isGoa: false,
      isHindu: false,
      isMuslim: true,
      isChristianParsi: false,
      statuteCitation: "Muslim Personal Law (Shariat) Application Act, 1937 & Indian Succession Act, 1925",
      statutoryCrest: "GOVERNED BY MUSLIM PERSONAL LAW (SHARIAT) & THE INDIAN SUCCESSION ACT, 1925",
      jurisdiction
    };
  }

  // Christian, Parsi, Jewish
  if (religionLower.includes('christian') || religionLower.includes('parsi') || religionLower.includes('jewish')) {
    return {
      regime: PERSONAL_LAW_REGIMES.ISA_CHRISTIAN_PARSI,
      isGoa: false,
      isHindu: false,
      isMuslim: false,
      isChristianParsi: true,
      statuteCitation: "Indian Succession Act, 1925 (Part VI - Sections 57, 59, 63, 105, 109, 119)",
      statutoryCrest: "GOVERNED BY THE INDIAN SUCCESSION ACT, 1925 (PART VI)",
      jurisdiction
    };
  }

  // Hindu, Buddhist, Jain, Sikh
  return {
    regime: PERSONAL_LAW_REGIMES.HINDU,
    isGoa: false,
    isHindu: true,
    isMuslim: false,
    isChristianParsi: false,
    statuteCitation: "Hindu Succession Act, 1956 (Section 30) & Indian Succession Act, 1925 (Schedule III)",
    statutoryCrest: "GOVERNED BY THE HINDU SUCCESSION ACT, 1956 & INDIAN SUCCESSION ACT, 1925",
    jurisdiction
  };
}
