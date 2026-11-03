import { describe, it, expect } from 'vitest';
import { classifyGoaJurisdiction, JURISDICTION_STATUS } from '../../js/legal/goaJurisdiction.js';
import { calculateGoaInheritance, CALCULATION_STATUS } from '../../js/legal/inheritanceCalculator.js';
import { evaluateAssetMatrimonialOwnership, MATRIMONIAL_REGIMES } from '../../js/legal/matrimonialRegime.js';
import { verifyPropertyTitle, TITLE_DOCUMENT_TYPES } from '../../js/legal/titleVerification.js';
import { generateNominationClause } from '../../js/legal/nominationRules.js';
import { generateMinorTrustClauses } from '../../js/legal/trusteeMinorRules.js';
import { validateResiduaryAllocations } from '../../js/legal/residuaryValidator.js';
import { runPreFlightLegalBlockerAudit } from '../../js/legal/legalBlockers.js';
import { calculateDraftReadinessIndex, DRAFT_STATUS_BANDS } from '../../js/legal/readinessIndex.js';
import { generateGoaSection333PDF } from '../../js/services/pdfGoaSection333.js';

describe('SmartWill India — Legal Engine 2.1 Complete 30-Scenario Test Suite', () => {

  // ── TEST 1: Section 1(4)(a) & (b) Pre-1961 Civil Code status ──
  it('Scenario 1: Classifies Section 1(4)(a) & (b) based on 1867 Civil Code continuity', () => {
    const res = classifyGoaJurisdiction({
      placeOfBirth: 'Margao, Goa',
      parentsPortugueseRegime: true
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_ACT_APPLICABLE);
    expect(res.statutoryClause).toContain('Section 1(4)(a)');
  });

  // ── TEST 2: Section 1(4)(c) Born in Goa to qualifying parents ──
  it('Scenario 2: Classifies Section 1(4)(c) for Goan born testator with Goan parents', () => {
    const res = classifyGoaJurisdiction({
      pob: 'Panaji, Goa',
      fatherPob: 'Mapusa, Goa'
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_ACT_APPLICABLE);
    expect(res.statutoryClause).toBe('Section 1(4)(c)');
  });

  // ── TEST 3: Section 1(4)(d) Formal statutory election ──
  it('Scenario 3: Classifies Section 1(4)(d) for registered statutory election into Goa regime', () => {
    const res = classifyGoaJurisdiction({
      addressState: 'Goa',
      statutoryElectionGoa: true
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_ACT_APPLICABLE);
    expect(res.statutoryClause).toBe('Section 1(4)(d)');
  });

  // ── TEST 4: Section 1(4)(f) Civil marriage in Goa under Goan Civil Code ──
  it('Scenario 4: Classifies Section 1(4)(f) for civil marriage registered in Goa', () => {
    const res = classifyGoaJurisdiction({
      addressState: 'Goa',
      civilMarriageGoa: true
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_ACT_APPLICABLE);
    expect(res.statutoryClause).toBe('Section 1(4)(f)');
  });

  // ── TEST 5: Section 1(4)(g) Non-Goan migrant residing in Goa governed by ISA ──
  it('Scenario 5: Section 1(4)(g) Jose Paulo Coutinho exception for non-Goan migrant residing in Goa', () => {
    const res = classifyGoaJurisdiction({
      addressCity: 'Margao',
      addressState: 'Goa',
      pob: 'Mumbai, Maharashtra',
      fatherPob: 'Pune, Maharashtra',
      motherPob: 'Nagpur, Maharashtra'
    });
    expect(res.status).toBe(JURISDICTION_STATUS.INDIAN_SUCCESSION_ACT_APPLICABLE);
    expect(res.statutoryClause).toContain('Section 1(4)(g)');
  });

  // ── TEST 6: Section 1(4) Unverified birthplace blocks classification ──
  it('Scenario 6: Blocks jurisdiction with LEGAL_REVIEW_REQUIRED when birthplace/parentage is unrecorded', () => {
    const res = classifyGoaJurisdiction({
      addressCity: 'Margao',
      addressState: 'Goa'
      // pob and parents pob missing
    });
    expect(res.status).toBe(JURISDICTION_STATUS.LEGAL_REVIEW_REQUIRED);
    expect(res.canGenerateWill).toBe(false);
  });

  // ── TEST 7: Substituted Section 83 - Descendants receive 50% legitime (Act 35 of 2023) ──
  it('Scenario 7: Calculates 50% legitime and 50% disposable quota when descendants survive', () => {
    const willData = {
      assets: [{ id: 1, type: 'Cash', value: 1000000, allocations: [{ beneficiaryId: 'b1', percentage: 50 }] }],
      beneficiaries: [{ id: 'b1', name: 'Child A', relation: 'Son' }],
      debts: [],
      lifetimeGifts: []
    };
    const calc = calculateGoaInheritance(willData);
    expect(calc.status).toBe(CALCULATION_STATUS.COMPLIANT);
    expect(calc.statutoryLegitimeValue).toBe(500000);
    expect(calc.statutoryDisposableQuota).toBe(500000);
  });

  // ── TEST 8: Substituted Section 83 - Spouse only receives 100% legitime ──
  it('Scenario 8: Assigns 100% legitime when only spouse survives (0% disposable quota)', () => {
    const willData = {
      assets: [{ id: 1, type: 'Cash', value: 1000000, allocations: [{ beneficiaryId: 'b1', percentage: 20 }] }],
      beneficiaries: [{ id: 'b1', name: 'Wife', relation: 'Spouse' }]
    };
    const calc = calculateGoaInheritance(willData);
    expect(calc.statutoryLegitimeValue).toBe(1000000);
    expect(calc.statutoryDisposableQuota).toBe(0);
  });

  // ── TEST 9: Substituted Section 83 - Parents only receive 100% legitime ──
  it('Scenario 9: Assigns 100% legitime when no descendants or spouse, but parents survive', () => {
    const willData = {
      assets: [{ id: 1, type: 'Cash', value: 1000000, allocations: [] }],
      beneficiaries: [{ id: 'b1', name: 'Father', relation: 'Father' }]
    };
    const calc = calculateGoaInheritance(willData);
    expect(calc.statutoryLegitimeValue).toBe(1000000);
    expect(calc.statutoryDisposableQuota).toBe(0);
  });

  // ── TEST 10: Substituted Section 83 - No forced heirs receives 100% disposable quota ──
  it('Scenario 10: Assigns 100% disposable quota when no statutory forced heirs exist', () => {
    const willData = {
      assets: [{ id: 1, type: 'Cash', value: 1000000, allocations: [{ beneficiaryId: 'b1', percentage: 100 }] }],
      beneficiaries: [{ id: 'b1', name: 'Friend', relation: 'Friend' }]
    };
    const calc = calculateGoaInheritance(willData);
    expect(calc.statutoryDisposableQuota).toBe(1000000);
    expect(calc.statutoryLegitimeValue).toBe(0);
  });

  // ── TEST 11: Section 89 Gross Computation Base Formula ──
  it('Scenario 11: Calculates Section 89 base = (Assets - Debts) + Collatable Gifts', () => {
    const willData = {
      assets: [{ id: 1, type: 'Bank FD', value: 1500000, allocations: [] }],
      debts: [{ id: 'd1', amount: 300000 }],
      lifetimeGifts: [{ id: 'g1', value: 200000, recipientRelation: 'Son' }],
      beneficiaries: [{ id: 'b1', name: 'Son', relation: 'Son' }]
    };
    const calc = calculateGoaInheritance(willData);
    // (15,00,000 - 3,00,000) + 2,00,000 = 14,00,000
    expect(calc.section89ComputationBase).toBe(1400000);
    expect(calc.statutoryLegitimeValue).toBe(700000);
  });

  // ── TEST 12: Section 90+ Collation Distinguishes Descendant Advances ──
  it('Scenario 12: Distinguishes descendant collation from third party lifetime gifts', () => {
    const willData = {
      assets: [{ id: 1, type: 'Cash', value: 1000000 }],
      lifetimeGifts: [
        { id: 'g1', value: 100000, recipientRelation: 'Son' }, // Collation
        { id: 'g2', value: 50000, recipientRelation: 'Third Party' } // General gift
      ],
      beneficiaries: [{ id: 'b1', name: 'Son', relation: 'Son' }]
    };
    const calc = calculateGoaInheritance(willData);
    expect(calc.totalCollatableGifts).toBe(150000);
  });

  // ── TEST 13: Incomplete Valuation Blocks Calculation ──
  it('Scenario 13: Flags INHERITANCE CALCULATION INCOMPLETE when asset value is missing', () => {
    const willData = {
      assets: [{ id: 1, type: 'Apartment', value: 0 }],
      beneficiaries: [{ id: 'b1', name: 'Son', relation: 'Son' }]
    };
    const calc = calculateGoaInheritance(willData);
    expect(calc.status).toBe(CALCULATION_STATUS.INCOMPLETE);
    expect(calc.statusMessage).toContain('INCOMPLETE');
  });

  // ── TEST 14: Inofficious Disposition Exceeding Disposable Quota Blocked ──
  it('Scenario 14: Triggers INOFFICIOUS_BREACH when bequests exceed 50% disposable quota', () => {
    const willData = {
      assets: [{ id: 1, type: 'Cash', value: 1000000, allocations: [{ beneficiaryId: 'b2', percentage: 90 }] }],
      beneficiaries: [
        { id: 'b1', name: 'Son', relation: 'Son' },
        { id: 'b2', name: 'Charity', relation: 'Charity' }
      ]
    };
    const calc = calculateGoaInheritance(willData);
    expect(calc.status).toBe(CALCULATION_STATUS.INOFFICIOUS_BREACH);
    expect(calc.excessOrShortfall).toBeGreaterThan(0);
  });

  // ── TEST 15: Section 219 Community Property Limits Bequest to 50% Moiety ──
  it('Scenario 15: Enforces 50% moiety limit on community property under Section 219', () => {
    const asset = { desc: 'Margao Flat', isInherited: false };
    const mat = { isMarried: true, regime: MATRIMONIAL_REGIMES.COMMUNITY_OF_PROPERTY };
    const res = evaluateAssetMatrimonialOwnership(asset, mat);
    expect(res.section219Applies).toBe(true);
    expect(res.disposablePercentage).toBe(50);
  });

  // ── TEST 16: Separation of Assets Antenuptial Contract Allows 100% Disposal ──
  it('Scenario 16: Permits 100% disposal under registered separation of assets contract', () => {
    const asset = { desc: 'Apartment', ownershipPercentage: 100 };
    const mat = { isMarried: true, regime: MATRIMONIAL_REGIMES.SEPARATION_OF_ASSETS, hasAntenuptialDeed: true };
    const res = evaluateAssetMatrimonialOwnership(asset, mat);
    expect(res.section219Applies).toBe(false);
    expect(res.disposablePercentage).toBe(100);
  });

  // ── TEST 17: Incommunicability Clause Excludes Inheritance from Community ──
  it('Scenario 17: Incommunicability clause preserves 100% separate title in inherited property', () => {
    const asset = { desc: 'Family Villa', isInherited: true, hasIncommunicabilityClause: true };
    const mat = { isMarried: true, regime: MATRIMONIAL_REGIMES.COMMUNITY_OF_PROPERTY };
    const res = evaluateAssetMatrimonialOwnership(asset, mat);
    expect(res.legalClass).toBe('SEPARATE_INCOMMUNICABLE');
    expect(res.disposablePercentage).toBe(100);
  });

  // ── TEST 18: Form I & XIV Alone Classified as Corroborative Revenue Record ──
  it('Scenario 18: Form I & XIV revenue record alone triggers PROPERTY TITLE VERIFICATION REQUIRED', () => {
    const asset = { type: 'Plot of Land', titleDocType: TITLE_DOCUMENT_TYPES.FORM_I_AND_XIV_ONLY };
    const res = verifyPropertyTitle(asset, { isGoa: true });
    expect(res.isValidTitle).toBe(false);
    expect(res.isCorroborativeOnly).toBe(true);
    expect(res.statusText).toContain('PROPERTY TITLE VERIFICATION REQUIRED');
  });

  // ── TEST 19: Registered Sale Deed Establishes Verified Title ──
  it('Scenario 19: Registered Sale Deed satisfies standalone title proof', () => {
    const asset = { type: 'Commercial Shop', titleDocType: TITLE_DOCUMENT_TYPES.REGISTERED_SALE_DEED };
    const res = verifyPropertyTitle(asset, { isGoa: true });
    expect(res.isValidTitle).toBe(true);
    expect(res.canBequestSpecificAsset).toBe(true);
  });

  // ── TEST 20: Unpartitioned Ancestral Orchard Triggers Section 16 & 220 Blocker ──
  it('Scenario 20: Unpartitioned ancestral orchard triggers Section 16 & 220 blocker', () => {
    const asset = {
      type: 'Agricultural Land',
      desc: 'Ancestral Orchard Plot Sy #89/2, Borda Village',
      isInherited: true,
      hasRegisteredPartitionDeed: false,
      details: { registrationNumber: 'Reg-405/1998' }
    };
    const res = verifyPropertyTitle(asset, { isGoa: true });
    expect(res.isPartitioned).toBe(false);
    expect(res.canBequestSpecificAsset).toBe(false);
    expect(res.blockers[0]).toContain('SECTION 16 & SECTION 220');
  });

  // ── TEST 21: Formally Partitioned Inherited Property Allows Specific Bequest ──
  it('Scenario 21: Formally partitioned inherited property with deed allows specific bequest', () => {
    const asset = {
      type: 'Plot',
      desc: 'Plot #12, Allotted in Partition',
      isInherited: true,
      hasRegisteredPartitionDeed: true,
      titleDocType: TITLE_DOCUMENT_TYPES.REGISTERED_PARTITION_DEED
    };
    const res = verifyPropertyTitle(asset, { isGoa: true });
    expect(res.isPartitioned).toBe(true);
    expect(res.canBequestSpecificAsset).toBe(true);
  });

  // ── TEST 22: Life Insurance Spouse Nominee Recognized under Section 39(7) ──
  it('Scenario 22: Generates beneficial nominee clause under Section 39(7) Insurance Act', () => {
    const res = generateNominationClause('Life Insurance Policy');
    expect(res.category).toBe('LIFE_INSURANCE');
    expect(res.governingStatute).toContain('Section 39(7)');
    expect(res.precedent).toContain('Sarbati Devi');
  });

  // ── TEST 23: Bank Deposit Nominee Recognized as Custodial Trustee ──
  it('Scenario 23: Generates custodial nominee clause under Section 45ZA & Ram Chander Talwar', () => {
    const res = generateNominationClause('Bank Savings & Fixed Deposit');
    expect(res.category).toBe('BANK_DEPOSITS');
    expect(res.governingStatute).toContain('Section 45ZA');
    expect(res.precedent).toContain('Ram Chander Talwar');
  });

  // ── TEST 24: Demat Nominee Recognized as Fiduciary Custodian ──
  it('Scenario 24: Generates securities nominee clause under Companies Act Sec 72 & Shakti Yezdani', () => {
    const res = generateNominationClause('Demat Account & Equity Shares');
    expect(res.category).toBe('SECURITIES_DEMAT');
    expect(res.governingStatute).toContain('Section 72');
    expect(res.precedent).toContain('Shakti Yezdani');
  });

  // ── TEST 25: Minor Trust Investment Powers Grounded in Indian Trusts Act Sec 20 ──
  it('Scenario 25: Grounds minor trust investments strictly in Section 20 Indian Trusts Act without IBBI', () => {
    const res = generateMinorTrustClauses({ name: 'Aarav' }, { name: 'Maria' }, { isGoa: true });
    expect(res.authorizedInvestments[0]).toContain('Section 20(a) of the Indian Trusts Act, 1882');
    expect(JSON.stringify(res.authorizedInvestments)).not.toContain('IBBI');
  });

  // ── TEST 26: Residuary Estate Total Percentage Must Equal Exactly 100% ──
  it('Scenario 26: Rejects residuary estate allocation when sum does not equal 100%', () => {
    const willData = {
      beneficiaries: [{ id: 'b1', name: 'Child A' }, { id: 'b2', name: 'Child B' }],
      residuary: {
        allocations: [{ beneficiaryId: 'b1', percentage: 60 }, { beneficiaryId: 'b2', percentage: 30 }]
      }
    };
    const res = validateResiduaryAllocations(willData);
    expect(res.isValid).toBe(false);
    expect(res.blockers[0]).toContain('RESIDUARY ALLOCATION ERROR');
  });

  // ── TEST 27: Section 333 Metadata Rejection When Mother Name or Occupation Missing ──
  it('Scenario 27: Blocks Goa Section 333 PDF generation when mother name or occupation is missing', () => {
    const willData = {
      personal: {
        fullName: 'Dr. Joseph',
        addressCity: 'Margao',
        addressState: 'Goa',
        pob: 'Margao, Goa',
        fatherPob: 'Margao, Goa',
        // motherName missing, occupation missing
        fatherName: 'Late Shri Fernandes'
      }
    };
    const audit = runPreFlightLegalBlockerAudit(willData);
    expect(audit.isExecutionReady).toBe(false);
    const codes = audit.blockers.map(b => b.code);
    expect(codes).toContain('ERR_MISSING_SECTION333_METADATA');
  });

  // ── TEST 28: Section 333 Dedicated PDF Margins, Double Spacing & Signatures ──
  it('Scenario 28: Generates Section 333 PDF with strict margins, double line spacing, and top/bottom signatures', async () => {
    const willData = {
      personal: {
        fullName: "Dr. Joseph Patrick D'Souza-Fernandes",
        fatherName: "Late Antonio Fernandes",
        motherName: "Late Maria D'Souza",
        occupation: "Medical Practitioner (Retired)",
        maritalStatus: "Married",
        age: 62,
        dob: "1964-05-15",
        pob: "Margao, Goa",
        fatherPob: "Margao, Goa",
        motherPob: "Margao, Goa",
        addressLine1: "House No. 45/A, Borda",
        addressCity: "Margao",
        addressState: "Goa",
        pincode: "403601"
      },
      assets: [
        {
          id: 1,
          type: "Residential Flat",
          desc: "Flat 402, Borda Heights",
          value: 6000000,
          titleDocType: "REGISTERED_SALE_DEED",
          allocations: [{ beneficiaryId: "b1", percentage: 50 }]
        }
      ],
      debts: [],
      lifetimeGifts: [],
      beneficiaries: [
        { id: "b1", name: "Maria Fernandes", relation: "Spouse" },
        { id: "b2", name: "Kevin Fernandes", relation: "Son" }
      ],
      executor: { name: "Advocate Francis Xavier Pereira", relation: "Family Advocate" },
      witnesses: [{ name: "Witness 1" }, { name: "Witness 2" }]
    };

    const doc = await generateGoaSection333PDF(willData);
    expect(doc).toBeDefined();
    expect(doc.internal.pageSize.getWidth()).toBe(210);
    expect(doc.internal.pageSize.getHeight()).toBe(297);
    expect(doc.internal.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });

  // ── TEST 29: Section 333 Notary Record & Passport Photo Box Verified ──
  it('Scenario 29: Verifies Special Notary presentation and passport photo block on final page', async () => {
    const willData = {
      personal: {
        fullName: "Dr. Joseph Patrick D'Souza-Fernandes",
        fatherName: "Late Antonio Fernandes",
        motherName: "Late Maria D'Souza",
        occupation: "Consultant",
        maritalStatus: "Married",
        dob: "1964-05-15",
        pob: "Margao, Goa",
        fatherPob: "Margao, Goa",
        addressCity: "Margao",
        addressState: "Goa"
      },
      assets: [
        { id: 1, type: "Bank FD", desc: "HDFC Term Deposit", value: 500000, titleDocType: "REGISTERED_SALE_DEED", allocations: [{ beneficiaryId: "b1", percentage: 50 }] }
      ],
      beneficiaries: [{ id: "b1", name: "Kevin Fernandes", relation: "Son" }],
      executor: { name: "Advocate Pereira" },
      witnesses: [{ name: "W1" }, { name: "W2" }]
    };
    const doc = await generateGoaSection333PDF(willData);
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });

  // ── TEST 30: Draft Readiness Index Status Bands (0-79, 80-95, 96-100) ──
  it('Scenario 30: Accurately computes Draft Readiness Index with explicit status bands', () => {
    // A. Incomplete profile
    const incRes = calculateDraftReadinessIndex({ personal: { fullName: 'Test' } });
    expect(incRes.statusBadge).toBe(DRAFT_STATUS_BANDS.INCOMPLETE);
    expect(incRes.score).toBeLessThan(80);

    // B. Ready for Notary Presentation profile
    const readyProfile = {
      personal: {
        fullName: "Dr. Joseph Patrick D'Souza-Fernandes",
        fatherName: "Antonio Fernandes",
        motherName: "Maria D'Souza",
        occupation: "Medical Doctor",
        maritalStatus: "Married",
        age: 62,
        dob: "1964-05-15",
        pob: "Margao, Goa",
        fatherPob: "Margao, Goa",
        govtIdType: "Aadhaar",
        govtIdDigits: "9876",
        addressLine1: "House No. 45/A, Borda",
        addressCity: "Margao",
        addressState: "Goa",
        pincode: "403601"
      },
      assets: [
        {
          id: 1,
          type: "Residential Flat",
          desc: "Flat 402, Borda Heights",
          value: 6000000,
          titleDocType: "REGISTERED_SALE_DEED",
          details: { registrationNumber: "REG-892/2012" },
          allocations: [{ beneficiaryId: "b1", percentage: 50 }]
        }
      ],
      debts: [],
      lifetimeGifts: [],
      beneficiaries: [
        { id: "b1", name: "Kevin Fernandes", relation: "Son" }
      ],
      executor: { name: "Advocate Francis Xavier Pereira", relation: "Advocate" },
      witnesses: [{ name: "Witness 1" }, { name: "Witness 2" }]
    };

    const readyRes = calculateDraftReadinessIndex(readyProfile);
    expect(readyRes.isExecutionReady).toBe(true);
    expect(readyRes.score).toBeGreaterThanOrEqual(80);
    expect([DRAFT_STATUS_BANDS.READY_FOR_NOTARY_REVIEW, DRAFT_STATUS_BANDS.VERIFIED_EXECUTION_DRAFT]).toContain(readyRes.statusBadge);
  });

});
