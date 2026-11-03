/**
 * SmartWill India — Legal Engine 2.1
 * Section 83 & Section 89 Estate Valuation, Collation & Legitime Calculator
 *
 * Implements strict statutory calculation under:
 * - Section 89(1) & (2): Calculation base includes net assets at death (assets - debts)
 *   PLUS the value of ALL assets gifted during the testator's lifetime.
 * - Sections 90 to 109: Collation (Colação) of advancements by descendants into the legitime pool.
 * - Sections 110 to 121: Reduction of inofficious testamentary bequests and lifetime gifts (Redução das Liberalidades Inoficiosas).
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
  ESTATE_INSOLVENT: "ESTATE_INSOLVENT",
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
  const noDebtsExplicitlyDeclared = Boolean(willData.hasNoEnforceableDebtsDeclared || willData.noDebtsDeclared || willData.hasNoEnforceableDebts);

  if (!debtsDeclared && !noDebtsExplicitlyDeclared) {
    blockers.push("MANDATORY STATUTORY DECLARATION REQUIRED: Under Section 45 & Section 89 of Goa Act 23 of 2016, the estate base cannot be computed without an affirmative debt declaration (either specify enforceable debts or explicitly declare zero enforceable debts).");
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
  const noGiftsExplicitlyDeclared = Boolean(willData.hasNoLifetimeGiftsDeclared || willData.noGiftsDeclared || willData.hasNoLifetimeGifts);

  if (!giftsDeclared && !noGiftsExplicitlyDeclared) {
    blockers.push("MANDATORY STATUTORY DECLARATION REQUIRED: Under Section 89 of Goa Act 23 of 2016, the computation base includes all assets gifted during the testator's lifetime. An affirmative gift declaration (either specify lifetime gifts or explicitly declare zero lifetime gifts) is mandatory.");
  }

  const processedLifetimeGifts = [];

  lifetimeGifts.forEach((g, idx) => {
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

      const isExemptFromCollation = Boolean(g.dispensationFromCollation || g.isExemptFromCollation);

      if (isDescendant && !isExemptFromCollation) {
        descendantCollationAdvancements += rawVal; // Sections 90-109 Collation
      } else {
        thirdPartyLifetimeGifts += rawVal; // Sections 110-121 Reduction
      }

      processedLifetimeGifts.push({
        id: g.id || `gift_${idx + 1}`,
        desc: g.desc || 'Lifetime Gift',
        date: g.date || 'Unspecified Date',
        value: rawVal,
        isDescendant,
        isSubjectToCollation: isDescendant && !isExemptFromCollation,
        isSubjectToReduction: !isDescendant || isExemptFromCollation
      });
    }
  });

  // 4. Section 89 Statutory Base Formula:
  // Base = (Assets at Death - Enforceable Debts) + ALL Lifetime Gifts
  const netAssetsAtDeath = testatorMoietyAssetValue - totalDebts;
  const isEstateInsolvent = netAssetsAtDeath < 0;

  if (isEstateInsolvent) {
    blockers.push(`ESTATE DEFICIENCY DETECTED: Enforceable estate debts (₹${totalDebts.toLocaleString('en-IN')}) exceed the testator's moiety asset value (₹${testatorMoietyAssetValue.toLocaleString('en-IN')}) by ₹${Math.abs(netAssetsAtDeath).toLocaleString('en-IN')}. Under Section 45, estate is insolvent.`);
    return {
      status: CALCULATION_STATUS.ESTATE_INSOLVENT,
      statusMessage: "ESTATE INSOLVENT: Debts exceed asset value",
      section89ComputationBase: 0,
      statutoryLegitimeValue: 0,
      statutoryDisposableQuota: 0,
      totalDebts,
      testatorMoietyAssetValue,
      netAssetsAtDeath,
      totalAllLifetimeGifts,
      blockers,
      warnings
    };
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
  // All assets must be fully accounted for (specific allocations + residuary/default allocations)
  let totalBequestValue = 0;
  const itemizedBequests = [];

  assets.forEach((a, idx) => {
    const rawVal = Number(a.value) || 0;
    const ownership = evaluateAssetMatrimonialOwnership(a, matrimonialInfo);
    const testatorAssetVal = rawVal * (ownership.disposablePercentage / 100);

    const allocs = a.allocations || [];
    if (allocs.length === 0) {
      totalBequestValue += testatorAssetVal;
      itemizedBequests.push({
        assetId: a.id || idx,
        desc: a.desc || a.type || `Asset ${idx + 1}`,
        bequestValue: testatorAssetVal,
        percentage: 100,
        beneficiary: "Designated Heir / Residuary"
      });
    } else {
      let sumPct = 0;
      allocs.forEach(al => {
        const pct = Number(al.percentage) || 0;
        const val = testatorAssetVal * (pct / 100);
        totalBequestValue += val;
        itemizedBequests.push({
          assetId: a.id || idx,
          desc: a.desc || a.type || `Asset ${idx + 1}`,
          bequestValue: val,
          percentage: pct,
          beneficiary: al.beneficiaryName || al.beneficiaryId || "Beneficiary"
        });
      });
    }
  });

  // Dispositions impairing legitime = (Total testamentary bequests + Third-party lifetime gifts)
  // Collation gifts to descendants are hotchpot additions to the legitime pool under Sections 90–109.
  const totalDispositionsSubjectToQuota = totalBequestValue + thirdPartyLifetimeGifts;
  const excess = totalDispositionsSubjectToQuota - statutoryDisposableQuota;
  const isCompliant = excess <= 0 || (disposableRatio === 0.50 && Math.abs(excess) < 1.0); // Allow rounding cents

  // 7. Sections 110 to 121 Executable Reduction Schedule
  let reductionSchedule = null;

  if (!isCompliant && disposableRatio < 1.0) {
    blockers.push(`INOFFICIOUS DISPOSITION (SECTION 83 & SECTION 110 BREACH): Total dispositions subject to quota (₹${Math.round(totalDispositionsSubjectToQuota).toLocaleString('en-IN')}) exceed the statutory disposable quota of ₹${Math.round(statutoryDisposableQuota).toLocaleString('en-IN')} by ₹${Math.round(excess).toLocaleString('en-IN')}. Subject to statutory reduction under Sections 110 to 121 (Section 111 legacies reduced first pro-rata; Section 113 inter vivos gifts reduced in reverse chronological order).`);

    let remainingExcessToReduce = excess;

    // Step 1 (Section 111 & 112): Reduce testamentary bequests / legacies pro-rata first
    const totalReductionFromLegacies = Math.min(totalBequestValue, remainingExcessToReduce);
    remainingExcessToReduce -= totalReductionFromLegacies;

    const legacyReductionRatio = totalBequestValue > 0 ? (totalReductionFromLegacies / totalBequestValue) : 0;
    const reducedLegacies = itemizedBequests.map(b => {
      const redAmount = b.bequestValue * legacyReductionRatio;
      return {
        assetId: b.assetId,
        desc: b.desc,
        beneficiary: b.beneficiary,
        originalValue: b.bequestValue,
        reductionAmount: redAmount,
        netValueAfterReduction: b.bequestValue - redAmount,
        reductionPercentage: legacyReductionRatio * 100,
        statutorySection: "Section 111 & 112 (Pro-Rata Reduction of Legacies)"
      };
    });

    // Step 2 (Section 111, 113, 114): If legacies are exhausted, reduce inter vivos gifts
    // in reverse chronological order (most recent gift reduced first)
    const reductionFromGifts = [];
    let totalReductionFromGifts = 0;

    if (remainingExcessToReduce > 0) {
      const giftsForReduction = processedLifetimeGifts
        .filter(g => g.isSubjectToReduction)
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

      for (const gift of giftsForReduction) {
        if (remainingExcessToReduce <= 0) {
          reductionFromGifts.push({
            id: gift.id,
            desc: gift.desc,
            date: gift.date,
            originalValue: gift.value,
            reductionAmount: 0,
            netValueAfterReduction: gift.value,
            isReduced: false,
            statutorySection: "Section 113"
          });
        } else {
          const redAmt = Math.min(gift.value, remainingExcessToReduce);
          remainingExcessToReduce -= redAmt;
          totalReductionFromGifts += redAmt;
          reductionFromGifts.push({
            id: gift.id,
            desc: gift.desc,
            date: gift.date,
            originalValue: gift.value,
            reductionAmount: redAmt,
            netValueAfterReduction: gift.value - redAmt,
            isReduced: true,
            statutorySection: "Section 113 (Reverse Chronological Reduction of Inter Vivos Gifts)"
          });
        }
      }
    }

    reductionSchedule = {
      excess,
      statutoryDisposableQuota,
      totalDispositionsSubjectToQuota,
      totalReductionFromLegacies,
      totalReductionFromGifts,
      unabsorbedExcess: remainingExcessToReduce,
      legacies: reducedLegacies,
      lifetimeGifts: reductionFromGifts
    };
  }

  return {
    status: blockers.length > 0 ? CALCULATION_STATUS.INOFFICIOUS_BREACH : CALCULATION_STATUS.COMPLIANT,
    statusMessage: blockers.length > 0 ? "INOFFICIOUS DISPOSITION DETECTED" : "SECTION 83/89 COMPLIANCE VERIFIED",
    section89ComputationBase,
    statutoryLegitimeValue,
    statutoryDisposableQuota,
    totalBequestValue,
    totalDispositionsSubjectToQuota,
    excessOrShortfall: excess,
    reductionSchedule,
    legitimeDescription,
    itemizedAssets,
    itemizedBequests,
    totalDebts,
    totalAllLifetimeGifts,
    descendantCollationAdvancements,
    thirdPartyLifetimeGifts,
    blockers,
    warnings
  };
}
