/**
 * SmartWill India — Legal Engine 2.1
 * Section 83 & Section 89 Estate Valuation, Collation & Legitime Calculator
 *
 * Implements strict statutory calculation under:
 * - Section 89(1) & (2): Calculation base includes net assets at death (assets - debts)
 *   PLUS the value of ALL assets gifted during the testator's lifetime.
 * - Sections 90 to 97: Collation (Colação) of advancements by descendants into the legitime pool.
 * - Sections 98 to 105: Reduction of inofficious testamentary bequests and lifetime gifts.
 * - Substituted Section 83 under Goa Amendment Act 35 of 2023:
 *   - Descendants survive: 50% Legitime (Quota Legítima), 50% Disposable Quota (Quota Disponível).
 *   - Spouse only: 100% Legitime.
 *   - Parents only: 100% Legitime.
 *   - Other ascendants: 1/3rd Legitime, 2/3rds Disposable Quota.
 */

import { evaluateAssetMatrimonialOwnership } from './matrimonialRegime.js';

export const CALCULATION_STATUS = {
  COMPLIANT: "COMPLIANT",
  INOFFICIOUS_BREACH: "INOFFICIOUS_BREACH",
  INCOMPLETE: "INCOMPLETE"
};

/**
 * Calculates Section 89 computation base and tests compliance with Substituted Section 83.
 * @param {Object} willData - Complete will dataset
 * @returns {Object} Comprehensive calculation audit report
 */
export function calculateGoaInheritance(willData = {}) {
  const assets = Array.isArray(willData.assets) ? willData.assets : [];
  const debts = Array.isArray(willData.debts) ? willData.debts : [];
  const lifetimeGifts = Array.isArray(willData.lifetimeGifts) ? willData.lifetimeGifts : [];
  const beneficiaries = Array.isArray(willData.beneficiaries) ? willData.beneficiaries : [];
  const matrimonialInfo = willData.matrimonial || {};

  const blockers = [];
  const warnings = [];

  // Check data completeness
  if (assets.length === 0) {
    return {
      status: CALCULATION_STATUS.INCOMPLETE,
      statusMessage: "INHERITANCE CALCULATION INCOMPLETE: No assets recorded for estate valuation.",
      blockers: ["No assets provided to compute estate base."]
    };
  }

  // 1. Calculate Assets at Death with Matrimonial Ownership Adjustments
  let grossAssetValue = 0;
  let testatorMoietyAssetValue = 0;
  let hasUnvaluedAsset = false;

  const itemizedAssets = assets.map((a, idx) => {
    const rawVal = Number(a.value);
    if (isNaN(rawVal) || rawVal <= 0) {
      hasUnvaluedAsset = true;
    }
    const assetVal = isNaN(rawVal) ? 0 : rawVal;
    grossAssetValue += assetVal;

    const ownership = evaluateAssetMatrimonialOwnership(a, matrimonialInfo);
    const testatorShareFraction = ownership.disposablePercentage / 100;
    const testatorVal = assetVal * testatorShareFraction;
    testatorMoietyAssetValue += testatorVal;

    return {
      id: a.id || idx,
      desc: a.desc || a.type || 'Asset',
      grossValue: assetVal,
      testatorPercentage: ownership.disposablePercentage,
      testatorValue: testatorVal,
      legalClass: ownership.legalClass,
      restrictions: ownership.restrictions
    };
  });

  if (hasUnvaluedAsset) {
    blockers.push("INHERITANCE CALCULATION INCOMPLETE: Every asset must have an estimated market valuation to compute Section 89 estate base and Section 83 legitime.");
    return {
      status: CALCULATION_STATUS.INCOMPLETE,
      statusMessage: "INHERITANCE CALCULATION INCOMPLETE",
      blockers,
      itemizedAssets
    };
  }

  // 2. Calculate Enforceable Debts of the Estate (Section 45(3) of Goa Act 23 of 2016)
  let totalDebts = 0;
  const debtsDeclared = Array.isArray(debts) && debts.length > 0;
  const noDebtsExplicitlyDeclared = Boolean(willData.hasNoEnforceableDebtsDeclared || willData.noDebtsDeclared);

  if (!debtsDeclared && !noDebtsExplicitlyDeclared) {
    warnings.push("Explicit Debt Declaration Recommended: No enforceable debts declared. Affirmative confirmation that estate has zero enforceable debts is recommended under Section 45.");
  }

  debts.forEach(d => {
    const val = Number(d.amount);
    if (!isNaN(val) && val > 0) {
      totalDebts += val;
    }
  });

  // 3. Section 89(1) & (2): Value of ALL Assets Gifted during Lifetime
  // Evaluated at the time of opening of inheritance (Section 89(2)).
  // Statutory Exception: Gifted property that perished without the fault of the donee is excluded.
  let totalAllLifetimeGifts = 0;
  let descendantCollationAdvancements = 0; // Collation under Sections 90-109
  let thirdPartyLifetimeGifts = 0;         // Subject to reduction under Sections 110-121
  const giftsDeclared = Array.isArray(lifetimeGifts) && lifetimeGifts.length > 0;
  const noGiftsExplicitlyDeclared = Boolean(willData.hasNoLifetimeGiftsDeclared || willData.noGiftsDeclared);

  if (!giftsDeclared && !noGiftsExplicitlyDeclared) {
    warnings.push("Explicit Lifetime Gift Declaration Recommended: No lifetime gifts declared. Affirmative confirmation that testator made no lifetime gifts is recommended under Section 89.");
  }

  lifetimeGifts.forEach(g => {
    // Section 89(2) Exception: Property perished without fault of the donee is excluded
    if (g.hasPerishedWithoutFault || g.perishedFortuitously) {
      warnings.push(`Section 89(2) Exemption: Gift of ${g.desc || 'property'} excluded from computation base because it perished fortuitously without donee's fault.`);
      return;
    }

    // Section 89(2): Value of gifted asset at opening of inheritance
    const rawVal = Number(g.valueAtOpeningOfInheritance || g.value);
    if (!isNaN(rawVal) && rawVal > 0) {
      totalAllLifetimeGifts += rawVal;

      const isDescendant = g.isForcedHeir ||
        g.recipientRelation?.toLowerCase().includes('child') ||
        g.recipientRelation?.toLowerCase().includes('son') ||
        g.recipientRelation?.toLowerCase().includes('daughter');

      if (isDescendant) {
        descendantCollationAdvancements += rawVal; // Sections 90-109 Collation
      } else {
        thirdPartyLifetimeGifts += rawVal; // Sections 110-121 Reduction
      }
    }
  });

  // 4. Section 89 Statutory Base Formula:
  // Base = (Assets at Death - Enforceable Debts) + ALL Lifetime Gifts
  const netAssetsAtDeath = testatorMoietyAssetValue - totalDebts;
  if (netAssetsAtDeath < 0) {
    blockers.push(`ESTATE DEFICIENCY DETECTED: Enforceable estate debts (₹${totalDebts.toLocaleString('en-IN')}) exceed the testator's moiety asset value (₹${testatorMoietyAssetValue.toLocaleString('en-IN')}) by ₹${Math.abs(netAssetsAtDeath).toLocaleString('en-IN')}. Under Section 45, estate is insolvent.`);
  }

  const section89ComputationBase = Math.max(0, netAssetsAtDeath) + totalAllLifetimeGifts;

  // 5. Section 83 Forced Share Hierarchy (Substituted by Goa Amendment Act 35 of 2023)
  // CRITICAL: Determine forced heirs from complete family structure (independent of Will beneficiaries)
  // to prevent intentionally omitted heirs from escaping forced legitime.
  const family = willData.familyStructure || {};
  const familyChildren = Array.isArray(family.children) ? family.children : [];
  const familyDescendants = Array.isArray(family.descendants) ? family.descendants : [];
  const familyParents = Array.isArray(family.parents) ? family.parents : [];
  const familyOtherAscendants = Array.isArray(family.otherAscendants) ? family.otherAscendants : [];

  const beneficiaryDescendants = beneficiaries.filter(b => b && b.relation && (
    b.relation.toLowerCase().includes('son') ||
    b.relation.toLowerCase().includes('daughter') ||
    b.relation.toLowerCase().includes('child') ||
    b.relation.toLowerCase().includes('grandchild')
  ));

  const hasDescendants = (familyChildren.length > 0) || (familyDescendants.length > 0) || (beneficiaryDescendants.length > 0);
  const hasSpouse = Boolean(family.hasSurvivingSpouse || family.spouse || beneficiaries.some(b => b && b.relation && b.relation.toLowerCase().includes('spouse')));
  const hasParents = (familyParents.length > 0) || beneficiaries.some(b => {
    if (!b || !b.relation) return false;
    const r = b.relation.toLowerCase();
    return (r === 'father' || r === 'mother') ||
      (r.includes('father') && !r.includes('grandfather') && !r.includes('forefather')) ||
      (r.includes('mother') && !r.includes('grandmother'));
  });
  const hasOtherAscendants = (familyOtherAscendants.length > 0) ||
    Boolean(family.hasOtherAscendants) ||
    beneficiaries.some(b => b && b.relation && (b.relation.toLowerCase().includes('grandparent') || b.relation.toLowerCase().includes('grandfather') || b.relation.toLowerCase().includes('grandmother') || b.relation.toLowerCase().includes('ascendant')));

  let legitimeRatio = 0.50;
  let legitimeDescription = "Descendants survive: Statutory legitime is 50% of the Section 89 computation base.";
  let disposableRatio = 0.50;

  if (hasDescendants) {
    legitimeRatio = 0.50;
    disposableRatio = 0.50;
    legitimeDescription = "Descendants survive: Collective forced legitime is 50% of the Section 89 computation base under substituted Section 83. Disposable quota is 50%.";
  } else if (hasSpouse) {
    legitimeRatio = 1.00;
    disposableRatio = 0.00;
    legitimeDescription = "No descendants; Spouse survives: Legitime constitutes the entire inheritance (100%) under substituted Section 83. Disposable quota is 0%.";
  } else if (hasParents) {
    legitimeRatio = 1.00;
    disposableRatio = 0.00;
    legitimeDescription = "No descendants or spouse; Parents survive: Legitime constitutes the entire inheritance (100%) under substituted Section 83. Disposable quota is 0%.";
  } else if (hasOtherAscendants) {
    // Section 83(d): Other ascendants survive
    legitimeRatio = 1 / 3;
    disposableRatio = 2 / 3;
    legitimeDescription = "No descendants, spouse, or parents; Other ascendants survive: Legitime is one-third (1/3) of the Section 89 computation base under substituted Section 83(d). Disposable quota is two-thirds (2/3).";
  } else {
    legitimeRatio = 0.00;
    disposableRatio = 1.00;
    legitimeDescription = "No statutory forced heirs surviving. Testator holds 100% disposable quota.";
  }

  const statutoryLegitimeValue = section89ComputationBase * legitimeRatio;
  const statutoryDisposableQuota = section89ComputationBase * disposableRatio;

  // 6. Test Testamentary Bequests against Statutory Disposable Quota
  let totalBequestValue = 0;
  assets.forEach(a => {
    const rawVal = Number(a.value) || 0;
    const ownership = evaluateAssetMatrimonialOwnership(a, matrimonialInfo);
    const testatorAssetVal = rawVal * (ownership.disposablePercentage / 100);

    const allocs = a.allocations || [];
    allocs.forEach(al => {
      const pct = Number(al.percentage) || 0;
      totalBequestValue += (testatorAssetVal * (pct / 100));
    });
  });

  const excess = totalBequestValue - statutoryDisposableQuota;
  const isCompliant = excess <= 0 || (disposableRatio === 0.50 && Math.abs(excess) < 1.0); // Allow rounding cents

  if (!isCompliant && disposableRatio < 1.0) {
    blockers.push(`INOFFICIOUS DISPOSITION (SECTION 83 BREACH): Total testamentary bequests (₹${totalBequestValue.toLocaleString('en-IN')}) exceed the statutory disposable quota of ₹${statutoryDisposableQuota.toLocaleString('en-IN')} by ₹${Math.round(excess).toLocaleString('en-IN')}. Subject to statutory reduction under Sections 110 to 121 (Section 111 legacies reduced first pro-rata; Section 113 inter vivos gifts reduced in reverse chronological order).`);
  }

  return {
    status: blockers.length > 0 ? CALCULATION_STATUS.INOFFICIOUS_BREACH : CALCULATION_STATUS.COMPLIANT,
    statusMessage: blockers.length > 0 ? "INOFFICIOUS DISPOSITION DETECTED" : "SECTION 83/89 COMPLIANCE VERIFIED",
    section89ComputationBase,
    statutoryLegitimeValue,
    statutoryDisposableQuota,
    totalBequestValue,
    excessOrShortfall: excess,
    legitimeDescription,
    itemizedAssets,
    totalDebts,
    totalAllLifetimeGifts,
    descendantCollationAdvancements,
    thirdPartyLifetimeGifts,
    blockers,
    warnings
  };
}
