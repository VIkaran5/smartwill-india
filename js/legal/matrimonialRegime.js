/**
 * SmartWill India — Legal Engine 2.1
 * Matrimonial Ownership Engine: Goa Act 23 of 2016 (Section 219 & Exceptions)
 *
 * Implements asset-specific legal analysis for married testators governed by the Goa Act.
 * Distinguishes community property (bens comuns) from separate property (bens próprios).
 * Enforces Section 219 disposition limits and Section 82 spousal residence preference.
 */

export const MATRIMONIAL_REGIMES = {
  COMMUNITY_OF_PROPERTY: "COMMUNITY_OF_PROPERTY", // Default Comunhão Geral de Bens
  SEPARATION_OF_ASSETS: "SEPARATION_OF_ASSETS",     // Escritura de Convenção Antenupcial
  UNKNOWN: "UNKNOWN"
};

export const ASSET_LEGAL_CLASS = {
  COMMUNITY_ACQUEST: "COMMUNITY_ACQUEST",         // Subject to 50% moiety limit (Sec 219)
  SEPARATE_PRE_MARITAL: "SEPARATE_PRE_MARITAL",   // 100% separate if supported by antenuptial deed
  SEPARATE_INCOMMUNICABLE: "SEPARATE_INCOMMUNICABLE", // Gift/inheritance with incommunicability clause
  UNDIVIDED_INHERITANCE: "UNDIVIDED_INHERITANCE"  // Governed by Sec 16 & 220
};

/**
 * Evaluates the testator's legal interest in an asset under Goa Matrimonial Property Law.
 * @param {Object} asset - Asset details
 * @param {Object} matrimonialInfo - Matrimonial regime & contract details
 * @returns {Object} { legalClass, disposablePercentage, isCommunity, restrictions, section219Applies }
 */
export function evaluateAssetMatrimonialOwnership(asset = {}, matrimonialInfo = {}) {
  const regime = matrimonialInfo.regime || MATRIMONIAL_REGIMES.COMMUNITY_OF_PROPERTY;
  const isMarried = Boolean(matrimonialInfo.isMarried);
  const restrictions = [];

  // If unmarried, testator holds 100% legal interest (subject to general title/debts)
  if (!isMarried) {
    return {
      legalClass: "INDIVIDUAL_SOLE_OWNERSHIP",
      disposablePercentage: 100,
      isCommunity: false,
      restrictions: [],
      section219Applies: false
    };
  }

  // If separation of assets regime is proven by registered antenuptial deed
  if (regime === MATRIMONIAL_REGIMES.SEPARATION_OF_ASSETS && matrimonialInfo.hasAntenuptialDeed) {
    return {
      legalClass: "SEPARATE_ANTENUPTIAL_ESTATE",
      disposablePercentage: Number(asset.ownershipPercentage) || 100,
      isCommunity: false,
      restrictions: ["Separation of assets governed by registered Escritura de Convenção Antenupcial."],
      section219Applies: false
    };
  }

  // Asset-specific checks under Community of Property
  const isInherited = Boolean(asset.isInherited || (asset.desc && asset.desc.toLowerCase().includes('ancestral')) || asset.inheritanceStatus);
  const hasIncommunicabilityClause = Boolean(asset.hasIncommunicabilityClause);
  const acquiredBeforeMarriage = Boolean(asset.acquiredBeforeMarriage);

  // Exception 1: Gift or inheritance with express clause of incommunicability
  if (isInherited && hasIncommunicabilityClause) {
    return {
      legalClass: ASSET_LEGAL_CLASS.SEPARATE_INCOMMUNICABLE,
      disposablePercentage: Number(asset.ownershipPercentage) || 100,
      isCommunity: false,
      restrictions: ["Separate asset: Bequeathed/gifted with express cláusula de incomunicabilidade excluding community."],
      section219Applies: false
    };
  }

  // Exception 2: Property acquired before marriage where antenuptial contract specifically excluded it
  if (acquiredBeforeMarriage && matrimonialInfo.hasAntenuptialDeed) {
    return {
      legalClass: ASSET_LEGAL_CLASS.SEPARATE_PRE_MARITAL,
      disposablePercentage: 100,
      isCommunity: false,
      restrictions: ["Separate asset: Acquired prior to marriage and excluded from communion under antenuptial deed."],
      section219Applies: false
    };
  }

  // Undivided inheritance asset (not yet partitioned)
  if (isInherited && !asset.hasRegisteredPartitionDeed) {
    restrictions.push("Under Section 16 & Section 220 of Goa Act 23 of 2016, specific assets of an unpartitioned inheritance cannot be bequeathed in specie before allotment in partition.");
    return {
      legalClass: ASSET_LEGAL_CLASS.UNDIVIDED_INHERITANCE,
      disposablePercentage: 0, // Cannot dispose of specific physical parcel
      isCommunity: false,
      restrictions,
      section219Applies: false,
      requiresPartition: true
    };
  }

  // Default General Community Acquest (Sec 219 applies)
  restrictions.push("Section 219 applies: Asset constitutes community property (bens comuns). The Testator's testamentary disposition is legally restricted to the testator's undivided 50% moiety (meação) or disposable share.");
  return {
    legalClass: ASSET_LEGAL_CLASS.COMMUNITY_ACQUEST,
    disposablePercentage: 50,
    isCommunity: true,
    restrictions,
    section219Applies: true
  };
}
