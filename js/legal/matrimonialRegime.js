/**
 * SmartWill India — Legal Engine 2.1
 * Matrimonial Ownership Engine: Goa Act 23 of 2016 (Section 219 & 4 Statutory Exceptions)
 *
 * Implements Section 219 restriction on disposition of specific community assets,
 * with exact statutory evaluation of the four statutory exceptions:
 *
 * Exception 1 (Sec 219(a)): Asset subsequently allotted to the disposing spouse in partition.
 * Exception 2 (Sec 219(b)): Asset does not form part of the community (bens próprios / separate asset).
 * Exception 3 (Sec 219(c)): Disposition is made by one spouse in favour of the other.
 * Exception 4 (Sec 219(d)): Other spouse consents to the disposition in a document drawn by a Special Notary.
 */

export const MATRIMONIAL_REGIMES = {
  COMMUNITY_OF_PROPERTY: "COMMUNITY_OF_PROPERTY", // Default Comunhão Geral de Bens
  SEPARATION_OF_ASSETS: "SEPARATION_OF_ASSETS",     // Registered Escritura de Convenção Antenupcial
  UNKNOWN: "UNKNOWN"
};

export const SECTION_219_EXCEPTIONS = {
  ALLOTTED_IN_PARTITION: "EXCEPTION_219_A_ALLOTTED_IN_PARTITION",
  NOT_PART_OF_COMMUNITY: "EXCEPTION_219_B_NOT_PART_OF_COMMUNITY",
  DISPOSITION_IN_FAVOR_OF_SPOUSE: "EXCEPTION_219_C_DISPOSITION_TO_SPOUSE",
  SPOUSE_NOTARIAL_CONSENT: "EXCEPTION_219_D_SPOUSE_SPECIAL_NOTARY_CONSENT"
};

/**
 * Evaluates asset matrimonial ownership and tests applicability of Section 219 restrictions and 4 exceptions.
 * @param {Object} asset - Asset details including allocations and title documents
 * @param {Object} matrimonialInfo - Matrimonial regime & contract details
 * @returns {Object} { legalClass, disposablePercentage, isCommunity, applicableException, restrictions, section219Applies }
 */
export function evaluateAssetMatrimonialOwnership(asset = {}, matrimonialInfo = {}) {
  const regime = matrimonialInfo.regime || MATRIMONIAL_REGIMES.COMMUNITY_OF_PROPERTY;
  const isMarried = Boolean(matrimonialInfo.isMarried);
  const restrictions = [];

  // 1. Unmarried testators: not subject to Section 219 community restrictions
  if (!isMarried) {
    return {
      legalClass: "INDIVIDUAL_SOLE_OWNERSHIP",
      disposablePercentage: 100,
      isCommunity: false,
      applicableException: null,
      restrictions: [],
      section219Applies: false
    };
  }

  // 2. Exception 2 (Sec 219(b)): Registered Separation of Assets Antenuptial Contract
  if (regime === MATRIMONIAL_REGIMES.SEPARATION_OF_ASSETS && matrimonialInfo.hasAntenuptialDeed) {
    return {
      legalClass: "SEPARATE_ANTENUPTIAL_ESTATE",
      disposablePercentage: Number(asset.ownershipPercentage) || 100,
      isCommunity: false,
      applicableException: SECTION_219_EXCEPTIONS.NOT_PART_OF_COMMUNITY,
      restrictions: ["Governed by registered Escritura de Convenção Antenupcial (Separation of Assets)."],
      section219Applies: false
    };
  }

  const isInherited = Boolean(asset.isInherited || (asset.desc && asset.desc.toLowerCase().includes('ancestral')) || asset.inheritanceStatus);
  const hasIncommunicabilityClause = Boolean(asset.hasIncommunicabilityClause);
  const hasPartitionDeed = Boolean(asset.hasRegisteredPartitionDeed || (asset.details && asset.details.hasPartitionDeed));
  const hasSpouseNotarialConsent = Boolean(asset.hasSpouseNotarialConsent || matrimonialInfo.spouseConsentsBySpecialNotaryDeed);

  // Check if bequest is made 100% in favor of the surviving spouse
  const allocs = asset.allocations || [];
  const isSolelyBequeathedToSpouse = allocs.length === 1 && Boolean(allocs[0].isSpouse || (allocs[0].relation && allocs[0].relation.toLowerCase().includes('spouse')));

  // ── STATUTORY EXCEPTION 1: Section 219(a) Allotted in partition ──
  if (hasPartitionDeed) {
    return {
      legalClass: "PARTITIONED_SPECIFIC_ALLOTMENT",
      disposablePercentage: 100,
      isCommunity: false,
      applicableException: SECTION_219_EXCEPTIONS.ALLOTTED_IN_PARTITION,
      restrictions: ["Section 219(a) Exception: Asset was partitioned and specifically allotted to the testator."],
      section219Applies: false
    };
  }

  // ── STATUTORY EXCEPTION 2: Section 219(b) Asset does not form part of community (separate asset) ──
  if (isInherited && hasIncommunicabilityClause) {
    return {
      legalClass: "SEPARATE_INCOMMUNICABLE_ASSET",
      disposablePercentage: Number(asset.ownershipPercentage) || 100,
      isCommunity: false,
      applicableException: SECTION_219_EXCEPTIONS.NOT_PART_OF_COMMUNITY,
      restrictions: ["Section 219(b) Exception: Asset is separate property (bens próprios) excluded by express incommunicability clause."],
      section219Applies: false
    };
  }

  // ── STATUTORY EXCEPTION 3: Section 219(c) Disposition in favour of the other spouse ──
  if (isSolelyBequeathedToSpouse) {
    return {
      legalClass: "COMMUNITY_ASSET_DISPOSED_TO_SPOUSE",
      disposablePercentage: 100,
      isCommunity: true,
      applicableException: SECTION_219_EXCEPTIONS.DISPOSITION_IN_FAVOR_OF_SPOUSE,
      restrictions: ["Section 219(c) Exception: Disposition of community asset made by one spouse in favour of the other spouse."],
      section219Applies: false
    };
  }

  // ── STATUTORY EXCEPTION 4: Section 219(d) Consented by other spouse in Special Notary document ──
  if (hasSpouseNotarialConsent) {
    return {
      legalClass: "COMMUNITY_ASSET_NOTARIAL_CONSENT",
      disposablePercentage: 100,
      isCommunity: true,
      applicableException: SECTION_219_EXCEPTIONS.SPOUSE_NOTARIAL_CONSENT,
      restrictions: ["Section 219(d) Exception: Other spouse consented to disposition in a document drawn by Special Notary."],
      section219Applies: false
    };
  }

  // ── DEFAULT RULE (Section 219): Community Acquest without Exception ──
  // Under Section 219 general rule: specific community asset cannot be disposed of before partition.
  // Testator's testamentary disposition is limited to their undivided 50% moiety (meação) in value.
  restrictions.push("Section 219 General Restriction: Constitutes community property (bens comuns). Disposition of specific physical asset prior to partition is restricted; disposition is legally confined to the testator's undivided 50% moiety (meação).");
  return {
    legalClass: "COMMUNITY_ACQUEST",
    disposablePercentage: 50,
    isCommunity: true,
    applicableException: null,
    restrictions,
    section219Applies: true
  };
}
