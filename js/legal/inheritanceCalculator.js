/**
 * SmartWill India — Legal Engine 2.1
 * Section 83 & Section 89 Estate Valuation, Collation & Legitime Calculator
 *
 * Implements mathematical and statutory calculation under:
 * - Goa Act 23 of 2016 Section 89 (Computation Base)
 * - Sections 90 to 97 (Collation of Lifetime Gifts to Forced Heirs)
 * - Sections 98 to 105 (Reduction of Inofficious Dispositions)
 * - Substituted Section 83 under Goa Amendment Act 35 of 2023 (Forced Shares)
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

  // 1. Calculate Assets at Death with Matrimonial Moiety Adjustments
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
    blockers.push("INHERITANCE CALCULATION INCOMPLETE: Every asset must have an estimated valuation to compute Section 89 estate base and Section 83 legitime.");
    return {
      status: CALCULATION_STATUS.INCOMPLETE,
      statusMessage: "INHERITANCE CALCULATION INCOMPLETE",
      blockers,
      itemizedAssets
    };
  }

  // 2. Calculate Enforceable Debts (Sections 45 & 46)
  let totalDebts = 0;
  debts.forEach(d => {
    const val = Number(d.amount);
    if (!isNaN(val) && val > 0) {
      totalDebts += val;
    }
  });

  // 3. Calculate Collation of Lifetime Gifts (Sections 90 onwards)
  let totalDescendantGiftsCollation = 0;
  let totalThirdPartyGifts = 0;

  lifetimeGifts.forEach(g => {
    const val = Number(g.value);
    if (!isNaN(val) && val > 0) {
      if (g.isForcedHeir || g.recipientRelation?.toLowerCase().includes('child') || g.recipientRelation?.toLowerCase().includes('son') || g.recipientRelation?.toLowerCase().includes('daughter')) {
        totalDescendantGiftsCollation += val; // Colação under Section 90
      } else {
        totalThirdPartyGifts += val; // Added to gross base under Sec 89
      }
    }
  });

  const totalCollatableGifts = totalDescendantGiftsCollation + totalThirdPartyGifts;

  // 4. Section 89 Computation Base Formula:
  // Gross Base = Net Estate at Death (Assets - Debts) + Collatable Lifetime Gifts
  const netAssetsAtDeath = Math.max(0, testatorMoietyAssetValue - totalDebts);
  const section89ComputationBase = netAssetsAtDeath + totalCollatableGifts;

  // 5. Section 83 Forced Share Hierarchy (Goa Amendment Act 35 of 2023)
  const descendants = beneficiaries.filter(b => b && b.relation && (
    b.relation.toLowerCase().includes('son') ||
    b.relation.toLowerCase().includes('daughter') ||
    b.relation.toLowerCase().includes('child')
  ));
  const hasSpouse = beneficiaries.some(b => b && b.relation && b.relation.toLowerCase().includes('spouse'));
  const hasParents = beneficiaries.some(b => b && b.relation && (b.relation.toLowerCase().includes('father') || b.relation.toLowerCase().includes('mother')));

  let legitimeRatio = 0.50; // Default 50% when descendants survive
  let legitimeDescription = "Descendants survive: Statutory legitime is 50% of the Section 89 computation base.";
  let disposableRatio = 0.50;

  if (descendants.length > 0) {
    legitimeRatio = 0.50;
    disposableRatio = 0.50;
    legitimeDescription = `Descendants (${descendants.length} surviving) receive 50% collective forced legitime under substituted Section 83. Disposable quota is 50%.`;
  } else if (hasSpouse) {
    legitimeRatio = 1.00;
    disposableRatio = 0.00;
    legitimeDescription = "No descendants; Spouse survives: Legitime constitutes the entire inheritance (100%) under substituted Section 83.";
  } else if (hasParents) {
    legitimeRatio = 1.00;
    disposableRatio = 0.00;
    legitimeDescription = "No descendants or spouse; Parents survive: Legitime constitutes the entire inheritance (100%) under substituted Section 83.";
  } else {
    legitimeRatio = 0.00;
    disposableRatio = 1.00;
    legitimeDescription = "No statutory forced heirs surviving. Testator holds 100% disposable quota.";
  }

  const statutoryLegitimeValue = section89ComputationBase * legitimeRatio;
  const statutoryDisposableQuota = section89ComputationBase * disposableRatio;

  // 6. Test Testamentary Bequests against Disposable Quota
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
    blockers.push(`INOFFICIOUS DISPOSITION (SECTION 83 BREACH): Total testamentary dispositions (₹${totalBequestValue.toLocaleString('en-IN')}) exceed the statutory disposable quota of ₹${statutoryDisposableQuota.toLocaleString('en-IN')} by ₹${Math.round(excess).toLocaleString('en-IN')}. Subject to reduction under Sections 98 onwards.`);
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
    totalCollatableGifts,
    blockers,
    warnings
  };
}
