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

  // Evidence-backed Partition Allotment (Section 219(a))
  // A mere registered partition deed is insufficient unless the specific asset is affirmatively allotted to the disposing testator.
  const partitionDetails = asset.partitionDetails || asset.partitionAllotmentDetails || asset.details?.partitionDetails || {};
  const isAllottedToTestator = asset.isAllottedToTestator === true || asset.details?.isAllottedToTestator === true || partitionDetails.isAllottedToTestator === true;
  const hasPartitionDeed = Boolean(asset.hasRegisteredPartitionDeed || (asset.details && asset.details.hasPartitionDeed) || partitionDetails.registrationNumber);

  // Evidence-backed Notarial Consent (Section 219(d))
  // Requires verified Special Notary document record, not a mere naked boolean
  const consentRecord = asset.spouseConsentDetails || matrimonialInfo.spouseConsentDeed || matrimonialInfo.spouseConsentRecord || {};
  const hasVerifiedNotarialConsent = Boolean(
    (asset.hasSpouseNotarialConsent || matrimonialInfo.spouseConsentsBySpecialNotaryDeed) &&
    (consentRecord.isSpecialNotaryDocument || consentRecord.specialNotaryOffice || consentRecord.registrationNumber || consentRecord.notaryOffice || consentRecord.isVerified === true)
  );

  // Check if bequest is made 100% in favor of the surviving spouse
  const allocs = asset.allocations || [];
  const isSolelyBequeathedToSpouse = allocs.length === 1 && Boolean(allocs[0].isSpouse || (allocs[0].relation && allocs[0].relation.toLowerCase().includes('spouse')));

  // ── STATUTORY EXCEPTION 1: Section 219(a) Allotted in partition ──
  if (hasPartitionDeed && isAllottedToTestator) {
    return {
      legalClass: "PARTITIONED_SPECIFIC_ALLOTMENT",
      disposablePercentage: 100,
      isCommunity: false,
      applicableException: SECTION_219_EXCEPTIONS.ALLOTTED_IN_PARTITION,
      restrictions: ["Section 219(a) Exception: Asset was partitioned and specifically allotted to the disposing testator under registered partition deed or final decree."],
      section219Applies: false,
      isDispositionProhibited: false
    };
  } else if (hasPartitionDeed && !isAllottedToTestator) {
    restrictions.push("Section 219(a) Non-Compliance: Although a partition deed is referenced, documentary allotment of this specific asset exclusively to the testator is unverified. Under Section 219, disposition remains prohibited.");
  }

  // ── STATUTORY EXCEPTION 2: Section 219(b) Asset does not legally form part of the community ──
  // Broader than express exclusion: includes assets excluded by law or contract from the community
  const isSeparatePropertyByLaw = Boolean(
    asset.isSeparateProperty ||
    (isInherited && hasIncommunicabilityClause) ||
    asset.legalExclusionFromCommunity
  );

  if (isSeparatePropertyByLaw) {
    return {
      legalClass: "SEPARATE_ASSET_OUTSIDE_COMMUNITY",
      disposablePercentage: Number(asset.ownershipPercentage) || 100,
      isCommunity: false,
      applicableException: SECTION_219_EXCEPTIONS.NOT_PART_OF_COMMUNITY,
      restrictions: ["Section 219(b) Exception: Asset does not legally form part of the community under the applicable matrimonial regime."],
      section219Applies: false,
      isDispositionProhibited: false
    };
  }

  // ── STATUTORY EXCEPTION 3: Section 219(c) Disposition in favour of the other spouse ──
  if (isSolelyBequeathedToSpouse) {
    return {
      legalClass: "COMMUNITY_ASSET_DISPOSED_TO_SPOUSE",
      disposablePercentage: 100,
      isCommunity: true,
      applicableException: SECTION_219_EXCEPTIONS.DISPOSITION_IN_FAVOR_OF_SPOUSE,
      restrictions: ["Section 219(c) Exception: Disposition of specific community asset is made exclusively in favour of the surviving spouse."],
      section219Applies: false,
      isDispositionProhibited: false
    };
  }

  // ── STATUTORY EXCEPTION 4: Section 219(d) Consented by other spouse in Special Notary document ──
  if (hasVerifiedNotarialConsent) {
    return {
      legalClass: "COMMUNITY_ASSET_NOTARIAL_CONSENT",
      disposablePercentage: 100,
      isCommunity: true,
      applicableException: SECTION_219_EXCEPTIONS.SPOUSE_NOTARIAL_CONSENT,
      restrictions: ["Section 219(d) Exception: Non-disposing spouse consented to the disposition in a verified document drawn by a Special Notary."],
      section219Applies: false,
      isDispositionProhibited: false
    };
  } else if (asset.hasSpouseNotarialConsent || matrimonialInfo.spouseConsentsBySpecialNotaryDeed) {
    restrictions.push("Section 219(d) Non-Compliance: Spouse consent under Section 219(d) strictly requires execution in a document drawn by a Special Notary. Unverified declarations or informal non-notarial consent are null and void.");
  }

  // ── NULLITY RULE (Section 219 Main Injunction): Specific Community Asset without Exception ──
  // Under Section 219, a testamentary disposition of a specific, determined asset of the community
  // prior to partition is NULL AND VOID unless one of the four statutory exceptions applies.
  // The testator cannot bequeath a specific parcel or flat to third parties prior to partition.
  restrictions.push("Section 219 Statutory Prohibition: Disposition of a specific and determined asset of the community of property prior to partition is NULL AND VOID unless allotted in partition, legally excluded from community, made solely to spouse, or consented by spouse before a Special Notary.");
  return {
    legalClass: "COMMUNITY_SPECIFIC_ASSET_RESTRICTED",
    disposablePercentage: 0, // Cannot dispose of specific parcel prior to partition
    isCommunity: true,
    applicableException: null,
    restrictions,
    section219Applies: true,
    isDispositionProhibited: true
  };
}
