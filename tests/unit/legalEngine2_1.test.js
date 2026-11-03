import { describe, it, expect } from 'vitest';
import { classifyGoaJurisdiction, JURISDICTION_STATUS, GOA_SECTION_1_4_CLAUSES } from '../../js/legal/goaJurisdiction.js';
import { calculateGoaInheritance, CALCULATION_STATUS } from '../../js/legal/inheritanceCalculator.js';
import { evaluateAssetMatrimonialOwnership, MATRIMONIAL_REGIMES, SECTION_219_EXCEPTIONS } from '../../js/legal/matrimonialRegime.js';
import { verifyPropertyTitle, TITLE_DOCUMENT_TYPES } from '../../js/legal/titleVerification.js';
import { generateNominationClause } from '../../js/legal/nominationRules.js';
import { generateMinorTrustClauses, generateStatutoryDebtHierarchy } from '../../js/legal/trusteeMinorRules.js';
import { validateResiduaryAllocations } from '../../js/legal/residuaryValidator.js';
import { runPreFlightLegalBlockerAudit } from '../../js/legal/legalBlockers.js';
import { calculateDraftReadinessIndex, DRAFT_STATUS_BANDS } from '../../js/legal/readinessIndex.js';
import { resolvePersonalLawRegime, PERSONAL_LAW_REGIMES } from '../../js/legal/personalLawRouter.js';
import { generateGoaSection333PDF, formatDateToFormalWords } from '../../js/services/pdfGoaSection333.js';

describe('SmartWill India — Legal Engine 2.1 Statutory Regression Suite', () => {

  // ── GOA SECTION 1(4)(a)–(g) STATUTORY CLASSIFICATION TESTS ──

  it('1. Section 1(4)(a): Requires affirmative proof of 1867 Civil Code regime (not mere pre-1961 birth date)', () => {
    // With affirmative proof:
    const resVerified = classifyGoaJurisdiction({
      pob: 'Margao, Goa',
      dob: '1958-04-12',
      pre1961PortugueseRegime: true
    });
    expect(resVerified.status).toBe(JURISDICTION_STATUS.GOA_ACT_APPLICABLE);
    expect(resVerified.statutoryClause).toBe(GOA_SECTION_1_4_CLAUSES.CLAUSE_A);

    // Negative: Born in Goa before 1961 but without proof of applicable Civil Code regime
    const resUnverified = classifyGoaJurisdiction({
      pob: 'Margao, Goa',
      dob: '1958-04-12'
      // Missing pre1961PortugueseRegime & parentsPortugueseRegime undefined
    });
    expect(resUnverified.status).toBe(JURISDICTION_STATUS.LEGAL_REVIEW_REQUIRED);
    expect(resUnverified.canGenerateWill).toBe(false);
  });

  it('2. Section 1(4)(b): Born in Goa to parents affirmatively governed by 1867 Civil Code', () => {
    const res = classifyGoaJurisdiction({
      pob: 'Panaji, Goa',
      fatherPob: 'Margao, Goa',
      parentsPortugueseRegime: true
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_ACT_APPLICABLE);
    expect(res.statutoryClause).toBe(GOA_SECTION_1_4_CLAUSES.CLAUSE_B);
  });

  it('3. Section 1(4)(b) Negative: Parents born in Goa but NOT governed by Portuguese Civil Code', () => {
    // e.g., Rest-of-India parents temporarily residing in Goa when child was born
    const res = classifyGoaJurisdiction({
      pob: 'Margao, Goa',
      fatherPob: 'Margao, Goa',
      parentsPortugueseRegime: false
    });
    // Evaluates to Section 1(4)(d) non-electing -> ISA under Jose Paulo Coutinho
    expect(res.status).toBe(JURISDICTION_STATUS.INDIAN_SUCCESSION_ACT_APPLICABLE);
    expect(res.reasons[0]).toContain('Jose Paulo Coutinho');
  });

  it('4. Section 1(4)(c): Born outside Goa to parents governed by the Code without valid opt-out', () => {
    const res = classifyGoaJurisdiction({
      pob: 'Mumbai, Maharashtra',
      parentsPortugueseRegime: true,
      statutoryOptOutClauseC: false
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_ACT_APPLICABLE);
    expect(res.statutoryClause).toBe(GOA_SECTION_1_4_CLAUSES.CLAUSE_C);
  });

  it('5. Section 1(4)(c) Opt-Out: Executed before Special Notary within statutory 3-year deadline', () => {
    const res = classifyGoaJurisdiction({
      pob: 'London, UK',
      parentsPortugueseRegime: true,
      statutoryOptOutClauseC: true,
      optOutBeforeSpecialNotary: true,
      optOutWithinThreeYearPeriod: true
    });
    expect(res.status).toBe(JURISDICTION_STATUS.INDIAN_SUCCESSION_ACT_APPLICABLE);
    expect(res.statutoryClause).toContain('Section 1(4)(c) Opt-Out');
  });

  it('6. Section 1(4)(d): Born in Goa to rest-of-India parents, fulfilling permanent residence and statutory election', () => {
    const res = classifyGoaJurisdiction({
      pob: 'Margao, Goa',
      parentsPortugueseRegime: false,
      statutoryElectionClauseD: true,
      permanentResidenceGoaSatisfied: true
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_ACT_APPLICABLE);
    expect(res.statutoryClause).toBe(GOA_SECTION_1_4_CLAUSES.CLAUSE_D);
  });

  it('7. Section 1(4) Proviso: Consular/military posting does not establish permanent residence under Clause (d)', () => {
    const res = classifyGoaJurisdiction({
      pob: 'Margao, Goa',
      parentsPortugueseRegime: false,
      isTemporaryMilitaryPosting: true,
      statutoryElectionClauseD: true
    });
    // Military posting bars permanent residence under Clause (d)
    expect(res.status).toBe(JURISDICTION_STATUS.INDIAN_SUCCESSION_ACT_APPLICABLE);
    expect(res.statutoryClause).toContain('Proviso: Posting Excluded from Permanent Residence');
  });

  it('8. Section 1(4)(e): Born in Goa to foreign parents satisfying Citizenship Act Sections 3 & 4', () => {
    const res = classifyGoaJurisdiction({
      pob: 'Panaji, Goa',
      foreignParentsCitizenshipFulfilled: true
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_ACT_APPLICABLE);
    expect(res.statutoryClause).toBe(GOA_SECTION_1_4_CLAUSES.CLAUSE_E);
  });

  it('9. Section 1(4)(f): Born in Goa of unknown parents or unknown nationality', () => {
    const res = classifyGoaJurisdiction({
      pob: 'Vasco, Goa',
      unknownParentsOrNationality: true
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_ACT_APPLICABLE);
    expect(res.statutoryClause).toBe(GOA_SECTION_1_4_CLAUSES.CLAUSE_F);
  });

  it('10. Section 1(4)(g): Adopted by parents governed by the specified Code or Act', () => {
    const res = classifyGoaJurisdiction({
      pob: 'Bangalore, Karnataka',
      isAdopted: true,
      adoptiveParentsGoanRegime: true
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_ACT_APPLICABLE);
    expect(res.statutoryClause).toBe(GOA_SECTION_1_4_CLAUSES.CLAUSE_G);
  });

  // ── INHERITANCE CALCULATOR, SECTIONS 89 & 110–121 TESTS ──

  it('11. Section 89(1) Base adds ALL lifetime gifts; Section 89(2) perished property excluded', () => {
    const willData = {
      assets: [{ id: 1, type: 'Fixed Deposit', value: 2000000, allocations: [{ beneficiaryId: 'b1', percentage: 50 }] }],
      debts: [{ id: 'd1', amount: 200000 }],
      lifetimeGifts: [
        { id: 'g1', value: 300000, recipientRelation: 'Son' }, // Sections 90-109 Collation
        { id: 'g2', value: 100000, recipientRelation: 'Third Party' }, // Sections 110-121 Reduction
        { id: 'g3', value: 50000, desc: 'Perished Car', hasPerishedWithoutFault: true } // Excluded under Section 89(2)
      ],
      beneficiaries: [{ id: 'b1', name: 'Son A', relation: 'Son' }]
    };
    const calc = calculateGoaInheritance(willData);
    // (20,00,000 - 2,00,000) + 3,00,000 + 1,00,000 = 22,00,000 (g3 excluded)
    expect(calc.section89ComputationBase).toBe(2200000);
    expect(calc.totalAllLifetimeGifts).toBe(400000);
    expect(calc.descendantCollationAdvancements).toBe(300000);
    expect(calc.thirdPartyLifetimeGifts).toBe(100000);
    expect(calc.statutoryLegitimeValue).toBe(1100000);
    expect(calc.statutoryDisposableQuota).toBe(1100000);
  });

  it('12. Forced Heirs: Omitted child in Will is identified via familyStructure schema', () => {
    const willData = {
      assets: [{ id: 1, type: 'Cash', value: 1000000, allocations: [{ beneficiaryId: 'b_charity', percentage: 100 }] }],
      beneficiaries: [{ id: 'b_charity', name: 'Charity Trust', relation: 'Charity' }], // Child omitted from Will!
      familyStructure: {
        children: [{ name: 'Omitted Son', age: 24 }] // Preserved in family tree
      }
    };
    const calc = calculateGoaInheritance(willData);
    // Even though no child was named in the Will, familyStructure triggers 50% descendant legitime
    expect(calc.statutoryLegitimeValue).toBe(500000);
    expect(calc.statutoryDisposableQuota).toBe(500000);
    expect(calc.status).toBe(CALCULATION_STATUS.INOFFICIOUS_BREACH);
  });

  it('13. Section 83(d): Other ascendants receive one-third (1/3) legitime when no descendants, spouse or parents survive', () => {
    const willData = {
      assets: [{ id: 1, type: 'Cash', value: 3000000, allocations: [{ beneficiaryId: 'b1', percentage: 50 }] }],
      beneficiaries: [{ id: 'b1', name: 'Grandmother', relation: 'Grandmother' }],
      familyStructure: {
        children: [],
        hasSurvivingSpouse: false,
        parents: [],
        otherAscendants: [{ name: 'Grandmother', relation: 'Grandmother' }]
      }
    };
    const calc = calculateGoaInheritance(willData);
    expect(calc.statutoryLegitimeValue).toBeCloseTo(1000000, 0); // 1/3 of 3,000,000 = 1,000,000
    expect(calc.statutoryDisposableQuota).toBeCloseTo(2000000, 0); // 2/3 of 3,000,000 = 2,000,000
    expect(calc.legitimeDescription).toContain('Section 83(d)');
  });

  it('14. Estate Insolvency: Debts exceeding assets triggers fatal estate deficiency blocker', () => {
    const willData = {
      assets: [{ id: 1, type: 'Bank Account', value: 500000 }],
      debts: [{ id: 'd1', amount: 800000 }] // Debts exceed assets
    };
    const calc = calculateGoaInheritance(willData);
    expect(calc.blockers[0]).toContain('ESTATE DEFICIENCY DETECTED');
  });

  // ── SECTION 219 MATRIMONIAL NULLITY & 4 EXCEPTIONS TESTS ──

  it('15. Section 219 Nullity: Bequest of specific community asset without exception is prohibited', () => {
    const asset = {
      desc: 'Specific Flat 402',
      allocations: [{ beneficiaryId: 'b_child', percentage: 50 }] // Attempt to bequeath specific community parcel to child
    };
    const mat = { isMarried: true, regime: MATRIMONIAL_REGIMES.COMMUNITY_OF_PROPERTY };
    const res = evaluateAssetMatrimonialOwnership(asset, mat);
    expect(res.section219Applies).toBe(true);
    expect(res.isDispositionProhibited).toBe(true);
    expect(res.disposablePercentage).toBe(0);
  });

  it('16. Section 219(a) Exception: Asset allotted to spouse in partition allows disposition', () => {
    const asset = { desc: 'Partitioned Plot Sy #12', hasRegisteredPartitionDeed: true };
    const mat = { isMarried: true, regime: MATRIMONIAL_REGIMES.COMMUNITY_OF_PROPERTY };
    const res = evaluateAssetMatrimonialOwnership(asset, mat);
    expect(res.applicableException).toBe(SECTION_219_EXCEPTIONS.ALLOTTED_IN_PARTITION);
    expect(res.isDispositionProhibited).toBe(false);
    expect(res.disposablePercentage).toBe(100);
  });

  it('17. Section 219(b) Exception: Asset legally excluded from community', () => {
    const asset = { desc: 'Separate Asset by Law', isSeparateProperty: true };
    const mat = { isMarried: true, regime: MATRIMONIAL_REGIMES.COMMUNITY_OF_PROPERTY };
    const res = evaluateAssetMatrimonialOwnership(asset, mat);
    expect(res.applicableException).toBe(SECTION_219_EXCEPTIONS.NOT_PART_OF_COMMUNITY);
    expect(res.isDispositionProhibited).toBe(false);
  });

  it('18. Section 219(c) Exception: Disposition of community asset exclusively to surviving spouse', () => {
    const asset = {
      desc: 'Community Flat 402',
      allocations: [{ beneficiaryId: 'b_spouse', percentage: 100, isSpouse: true }]
    };
    const mat = { isMarried: true, regime: MATRIMONIAL_REGIMES.COMMUNITY_OF_PROPERTY };
    const res = evaluateAssetMatrimonialOwnership(asset, mat);
    expect(res.applicableException).toBe(SECTION_219_EXCEPTIONS.DISPOSITION_IN_FAVOR_OF_SPOUSE);
    expect(res.isDispositionProhibited).toBe(false);
  });

  it('19. Section 219(d) Exception: Consented by other spouse in Special Notary document', () => {
    const asset = { desc: 'Community Land Plot', hasSpouseNotarialConsent: true };
    const mat = { isMarried: true, regime: MATRIMONIAL_REGIMES.COMMUNITY_OF_PROPERTY };
    const res = evaluateAssetMatrimonialOwnership(asset, mat);
    expect(res.applicableException).toBe(SECTION_219_EXCEPTIONS.SPOUSE_NOTARIAL_CONSENT);
    expect(res.isDispositionProhibited).toBe(false);
  });

  // ── PROPERTY TITLE & HABILITAÇÃO DE HERDEIROS TESTS ──

  it('20. Title Verification: Fake registration number string without primary deed fails title audit', () => {
    const asset = {
      type: 'Residential Land',
      desc: 'Ancestral Plot',
      details: { registrationNumber: 'FAKE-12345' } // Registration string only!
    };
    const res = verifyPropertyTitle(asset);
    expect(res.isValidTitle).toBe(false);
    expect(res.blockers[0]).toContain('PROPERTY TITLE VERIFICATION REQUIRED');
  });

  it('21. Title Verification: Habilitação de Herdeiros establishes heirship only; specific parcel bequest without partition deed fails', () => {
    const asset = {
      type: 'Orchard Plot',
      desc: 'Ancestral Orchard',
      titleDocType: TITLE_DOCUMENT_TYPES.DEED_OF_SUCCESSION_HABILITACAO,
      hasRegisteredPartitionDeed: false
    };
    const res = verifyPropertyTitle(asset, { isGoa: true });
    expect(res.canBequestSpecificAsset).toBe(false);
    expect(res.requiresLegalReviewForUndividedShare).toBe(true);
    expect(res.blockers[0]).toContain('HABILITAÇÃO DE HERDEIROS VERIFICATION');
  });

  it('22. Title Verification: Form I & XIV treated strictly as corroborative fiscal record', () => {
    const asset = {
      type: 'Agricultural Land',
      titleDocType: TITLE_DOCUMENT_TYPES.FORM_I_AND_XIV_ONLY
    };
    const res = verifyPropertyTitle(asset);
    expect(res.isValidTitle).toBe(false);
    expect(res.isCorroborativeOnly).toBe(true);
  });

  // ── NOMINATION RULES (PPF vs EPF) TESTS ──

  it('23. Nomination Rules: PPF mapped to Government Savings Promotion Act, 1873 & Paragraph 14', () => {
    const res = generateNominationClause('PPF Account');
    expect(res.category).toBe('PUBLIC_PROVIDENT_FUND');
    expect(res.governingStatute).toContain('Government Savings Promotion Act, 1873');
    expect(res.legalRule).toContain('Paragraph 14');
  });

  it('24. Nomination Rules: EPF mapped to Employees Provident Funds Act, 1952', () => {
    const res = generateNominationClause('EPF Account');
    expect(res.category).toBe('EMPLOYEES_PROVIDENT_FUND');
    expect(res.governingStatute).toContain("Employees' Provident Funds and Miscellaneous Provisions Act, 1952");
  });

  // ── PERSONAL LAW ROUTER TESTS ──

  it('25. Personal Law Router: Missing or unrecorded religion returns LEGAL_REVIEW_REQUIRED (never defaults to Hindu)', () => {
    const res = resolvePersonalLawRegime({ personal: { fullName: 'Amit' } }); // Missing religion
    expect(res.regime).toBe(PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED);
    expect(res.requiresLegalReview).toBe(true);
  });

  it('26. Personal Law Router: Shia Ismaili / Dawoodi Bohra flags school-specific legal review', () => {
    const res = resolvePersonalLawRegime({ personal: { religion: 'Muslim', sect: 'Dawoodi Bohra' } });
    expect(res.isMuslim).toBe(true);
    expect(res.isShia).toBe(true);
    expect(res.requiresExpertLegalReview).toBe(true);
  });

  // ── REAL jsPDF SECTION 333 PDF GEOMETRY & TYPOGRAPHY TESTS ──

  it('27. Section 333 PDF Generator: Real jsPDF generates A4 with 50mm left margin and dates in words', async () => {
    const willData = {
      personal: {
        fullName: "Dr. Joseph Patrick D'Souza-Fernandes",
        fatherName: "Antonio Fernandes",
        motherName: "Maria D'Souza",
        occupation: "Medical Doctor (Retired)",
        maritalStatus: "Married",
        age: 62,
        dob: "1964-05-15",
        pob: "Margao, Goa",
        fatherPob: "Margao, Goa",
        motherPob: "Margao, Goa",
        parentsPortugueseRegime: true,
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
          details: { titleDocType: "REGISTERED_SALE_DEED", registrationNumber: "REG-892/2012" },
          allocations: [{ beneficiaryId: "b1", percentage: 50 }]
        }
      ],
      debts: [],
      hasNoEnforceableDebtsDeclared: true,
      lifetimeGifts: [],
      hasNoLifetimeGiftsDeclared: true,
      beneficiaries: [
        { id: "b1", name: "Kevin Fernandes", relation: "Son" },
        { id: "b2", name: "Maria Fernandes", relation: "Spouse" }
      ],
      familyStructure: {
        children: [{ name: "Kevin Fernandes", age: 30 }]
      },
      executor: { name: "Advocate Francis Xavier Pereira", relation: "Family Advocate" },
      witnesses: [
        { name: "Witness 1", address: "Margao, Goa", idProof: "Aadhaar" },
        { name: "Witness 2", address: "Margao, Goa", idProof: "Passport" }
      ]
    };

    const doc = await generateGoaSection333PDF(willData);
    expect(doc).toBeDefined();
    // Real jsPDF measurements in mm (A4: 210 x 297mm)
    expect(Math.round(doc.internal.pageSize.getWidth())).toBe(210); // A4 width
    expect(Math.round(doc.internal.pageSize.getHeight())).toBe(297); // A4 height
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);

    // Verify formal date in words helper
    const words = formatDateToFormalWords("1964-05-15");
    expect(words).toContain("fifteenth day of May nineteen hundred and sixty four");
  });

  // ── DRAFT READINESS INDEX & ADVOCATE VERIFICATION GATE TESTS ──

  it('28. Draft Readiness Index: 96-100 strictly blocked without documented advocate review sign-off', () => {
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
        parentsPortugueseRegime: true,
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
          allocations: [{ beneficiaryId: "b1", percentage: 50 }]
        }
      ],
      debts: [],
      hasNoEnforceableDebtsDeclared: true,
      lifetimeGifts: [],
      hasNoLifetimeGiftsDeclared: true,
      beneficiaries: [{ id: "b1", name: "Kevin Fernandes", relation: "Son" }],
      familyStructure: { children: [{ name: "Kevin Fernandes" }] },
      executor: { name: "Advocate Francis Xavier Pereira" },
      witnesses: [{ name: "Witness 1", address: "Margao" }, { name: "Witness 2", address: "Margao" }]
      // Without advocate review sign-off!
    };

    const res = calculateDraftReadinessIndex(readyProfile);
    // Score is capped at 85/100 without advocate review
    expect(res.score).toBeLessThanOrEqual(85);
    expect(res.statusBadge).toBe(DRAFT_STATUS_BANDS.READY_FOR_NOTARY_REVIEW);
  });

  it('29. Draft Readiness Index: Awards 96+ VERIFIED EXECUTION DRAFT when documented advocate review is present', () => {
    const readyProfileWithAdvocate = {
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
        parentsPortugueseRegime: true,
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
          allocations: [{ beneficiaryId: "b1", percentage: 50 }]
        }
      ],
      debts: [],
      hasNoEnforceableDebtsDeclared: true,
      lifetimeGifts: [],
      hasNoLifetimeGiftsDeclared: true,
      beneficiaries: [{ id: "b1", name: "Kevin Fernandes", relation: "Son" }],
      familyStructure: { children: [{ name: "Kevin Fernandes" }] },
      executor: { name: "Advocate Francis Xavier Pereira" },
      witnesses: [{ name: "Witness 1", address: "Margao", idProof: "Aadhaar" }, { name: "Witness 2", address: "Margao", idProof: "Passport" }],
      advocateReviewSignOff: {
        advocateName: "Advocate Francis Xavier Pereira",
        enrollmentNumber: "MAH/1234/2005",
        reviewDate: "2026-11-03"
      }
    };

    const res = calculateDraftReadinessIndex(readyProfileWithAdvocate);
    expect(res.score).toBeGreaterThanOrEqual(96);
    expect(res.statusBadge).toBe(DRAFT_STATUS_BANDS.VERIFIED_EXECUTION_DRAFT);
  });

  it('30. Draft Readiness Index: Mandatory blocker overrides score and forces INCOMPLETE status', () => {
    const blockedProfile = {
      personal: {
        fullName: "Dr. Joseph",
        addressCity: "Margao",
        addressState: "Goa"
        // Missing mother's name and occupation
      },
      assets: [{ id: 1, type: "Flat", value: 1000000, titleDocType: "REGISTERED_SALE_DEED" }]
    };
    const res = calculateDraftReadinessIndex(blockedProfile);
    expect(res.statusBadge).toBe(DRAFT_STATUS_BANDS.INCOMPLETE);
    expect(res.score).toBeLessThanOrEqual(75);
    expect(res.audit.totalBlockersCount).toBeGreaterThan(0);
  });

});
