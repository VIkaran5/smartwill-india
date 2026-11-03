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
      debts: [{ id: 'd1', amount: 800000 }], // Debts exceed assets
      hasNoLifetimeGiftsDeclared: true
    };
    const calc = calculateGoaInheritance(willData);
    expect(calc.status).toBe(CALCULATION_STATUS.ESTATE_INSOLVENT);
    expect(calc.blockers.some(b => b.includes('ESTATE DEFICIENCY DETECTED'))).toBe(true);
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
    const asset = {
      desc: 'Partitioned Plot Sy #12',
      hasRegisteredPartitionDeed: true,
      isAllottedToTestator: true,
      partitionDetails: { registrationNumber: 'PART-881/2018', isAllottedToTestator: true }
    };
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
    const asset = {
      desc: 'Community Land Plot',
      hasSpouseNotarialConsent: true,
      spouseConsentDetails: {
        isSpecialNotaryDocument: true,
        specialNotaryOffice: 'Margao',
        registrationNumber: 'CONS-456/2021',
        isVerified: true
      }
    };
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
        gender: "Male",
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
          isDocumentVerified: true,
          details: {
            titleDocType: "REGISTERED_SALE_DEED",
            registrationNumber: "REG-892/2012",
            subRegistrarOffice: "Margao",
            isDocumentVerified: true
          },
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
        gender: "Male",
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
          isDocumentVerified: true,
          details: {
            titleDocType: "REGISTERED_SALE_DEED",
            registrationNumber: "REG-892/2012",
            subRegistrarOffice: "Margao",
            isDocumentVerified: true
          },
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
        gender: "Male",
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
          isDocumentVerified: true,
          details: {
            titleDocType: "REGISTERED_SALE_DEED",
            registrationNumber: "REG-892/2012",
            subRegistrarOffice: "Margao",
            isDocumentVerified: true
          },
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
        reviewDate: "2026-11-03",
        isAuthenticVerification: true
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

  // ── ADVANCED STATUTORY EDGE CASE REGRESSION TESTS (P0 FORENSIC COMPLETION) ──

  it('31. Sections 110–121 Reduction Schedule: Computes exact rupee pro-rata reduction of legacies and reverse chronological reduction of gifts', () => {
    const willData = {
      assets: [
        {
          id: 1,
          type: "Land",
          value: 4000000,
          allocations: [{ beneficiaryId: "b1", percentage: 100, beneficiaryName: "Friend Alpha" }]
        }
      ],
      debts: [],
      hasNoEnforceableDebtsDeclared: true,
      lifetimeGifts: [
        {
          id: "g1",
          desc: "Gift of Gold to Cousin",
          value: 1000000,
          date: "2022-01-10",
          recipientRelation: "Cousin" // Third party
        },
        {
          id: "g2",
          desc: "Gift of Shares to Trust",
          value: 1000000,
          date: "2024-06-15",
          recipientRelation: "Trust" // More recent third party gift
        }
      ],
      beneficiaries: [
        { id: "b1", name: "Friend Alpha", relation: "Friend" },
        { id: "b_son", name: "Raj", relation: "Son" }
      ],
      familyStructure: {
        children: [{ name: "Raj" }] // Descendants survive -> 50% legitime, 50% disposable quota
      }
    };

    // Computation Base = 4,000,000 (assets) + 2,000,000 (gifts) = 6,000,000
    // Disposable quota (50%) = 3,000,000
    // Total dispositions subject to quota = 4,000,000 (legacy) + 2,000,000 (third-party gifts) = 6,000,000
    // Excess = 6,000,000 - 3,000,000 = 3,000,000 inofficious breach!
    const calc = calculateGoaInheritance(willData);
    expect(calc.status).toBe(CALCULATION_STATUS.INOFFICIOUS_BREACH);
    expect(calc.reductionSchedule).toBeDefined();

    // Section 111 & 112: Legacies reduced first pro-rata
    // Total legacy value = 4,000,000. Excess = 3,000,000.
    // Legacy absorbs entire 3,000,000 reduction!
    expect(calc.reductionSchedule.totalReductionFromLegacies).toBe(3000000);
    expect(calc.reductionSchedule.legacies[0].reductionAmount).toBe(3000000);
    expect(calc.reductionSchedule.legacies[0].netValueAfterReduction).toBe(1000000);
  });

  it('32. Section 219 Negative: Partition deed without verified allotment to testator is rejected', () => {
    const asset = {
      desc: "Unallotted Family Parcel Sy #50",
      hasRegisteredPartitionDeed: true,
      isAllottedToTestator: false // Mentioned in deed, but not allotted to this spouse!
    };
    const mat = { isMarried: true, regime: MATRIMONIAL_REGIMES.COMMUNITY_OF_PROPERTY };
    const res = evaluateAssetMatrimonialOwnership(asset, mat);
    expect(res.section219Applies).toBe(true);
    expect(res.isDispositionProhibited).toBe(true);
    expect(res.restrictions.some(r => r.includes('Section 219(a) Non-Compliance'))).toBe(true);
  });

  it('33. Section 219 Negative: Naked spouse consent boolean without Special Notary deed is rejected', () => {
    const asset = {
      desc: "Community Plot Sy #90",
      hasSpouseNotarialConsent: true // Naked boolean only!
    };
    const mat = { isMarried: true, regime: MATRIMONIAL_REGIMES.COMMUNITY_OF_PROPERTY };
    const res = evaluateAssetMatrimonialOwnership(asset, mat);
    expect(res.isDispositionProhibited).toBe(true);
    expect(res.restrictions.some(r => r.includes('Section 219(d) Non-Compliance'))).toBe(true);
  });

  it('34. Title Verification Negative: Primary title deed selected without document verification is rejected', () => {
    const asset = {
      type: "Residential Plot",
      desc: "Plot Sy #100",
      titleDocType: TITLE_DOCUMENT_TYPES.REGISTERED_SALE_DEED,
      isDocumentVerified: false // Unverified selection!
    };
    const res = verifyPropertyTitle(asset);
    expect(res.isValidTitle).toBe(false);
    expect(res.statusText).toBe("ROOT TITLE DOCUMENT UNVERIFIED");
    expect(res.blockers[0]).toContain("UNVERIFIED ROOT TITLE RECORD");
  });

  it('35. Personal Law Router: Unrecognized religion returns LEGAL_REVIEW_REQUIRED (never defaults to Hindu)', () => {
    const res = resolvePersonalLawRegime({ personal: { fullName: "Test User", religion: "Atheist" } });
    expect(res.regime).toBe(PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED);
    expect(res.requiresLegalReview).toBe(true);
    expect(res.isHindu).toBe(false);
  });

  it('36. Personal Law Router: Ismaili/Bohra returns fatal review blocker', () => {
    const res = resolvePersonalLawRegime({ personal: { religion: "Muslim", sect: "Bohra" } });
    expect(res.regime).toBe(PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED);
    expect(res.blockers[0]).toContain("ISMAILI_BOHRA_SPECIAL_REVIEW_REQUIRED");
  });

  it('37. PDF Generator Preflight: Missing mandatory age or executor throws fatal pre-flight error', async () => {
    const incompleteData = {
      personal: {
        fullName: "Dr. Joseph",
        fatherName: "Antonio",
        motherName: "Maria",
        occupation: "Doctor",
        maritalStatus: "Married",
        gender: "Male",
        dob: "1964-05-15",
        pob: "Margao, Goa",
        parentsPortugueseRegime: true,
        addressLine1: "Borda",
        addressCity: "Margao",
        addressState: "Goa",
        pincode: "403601"
        // Missing age!
      },
      executor: { name: "Advocate Pereira" }
    };
    await expect(generateGoaSection333PDF(incompleteData)).rejects.toThrow("PREFLIGHT_ERROR");
  });

  it('38. PDF Generator Preflight: Non-Goa jurisdiction throws fatal error preventing generation', async () => {
    const restOfIndiaData = {
      personal: {
        fullName: "Ramesh Sharma",
        fatherName: "Suresh Sharma",
        motherName: "Shanti Sharma",
        occupation: "Engineer",
        maritalStatus: "Married",
        gender: "Male",
        age: 45,
        dob: "1980-01-01",
        pob: "Delhi",
        addressLine1: "Sector 14",
        addressCity: "Delhi",
        addressState: "Delhi",
        pincode: "110001"
      },
      executor: { name: "Advocate Verma" }
    };
    await expect(generateGoaSection333PDF(restOfIndiaData)).rejects.toThrow("CANNOT_GENERATE_GOA_SECTION_333_PDF");
  });

  it('39. Readiness Index: Fatal legal blockers prevent NOTARIAL_EXECUTION_COMPLETED status even with notary fields filled', () => {
    const profileWithNotaryAndBlockers = {
      personal: {
        fullName: "Dr. Joseph"
        // Missing mandatory parentage and address -> triggers fatal audit blockers!
      },
      specialNotaryExecution: {
        isNotaryAuthenticated: true,
        registrationNumber: "NOT-999/2026",
        bookVolume: "Vol 4",
        executionDate: "2026-11-03",
        notaryName: "Advocate Notary"
      }
    };
    const res = calculateDraftReadinessIndex(profileWithNotaryAndBlockers);
    expect(res.statusBadge).toBe(DRAFT_STATUS_BANDS.INCOMPLETE);
    expect(res.statusBadge).not.toBe(DRAFT_STATUS_BANDS.NOTARIAL_EXECUTION_COMPLETED);
  });

  // ── STAGE 1: JURISDICTION, PERSONAL LAW & CENTRAL BLOCKER REGRESSION TESTS ──

  it('11. Stage 1: Non-Goan Indian citizen with no Section 1(4) qualifying criteria routed to Central Law', () => {
    const res = classifyGoaJurisdiction({
      pob: 'Jaipur, Rajasthan',
      parentsPortugueseRegime: false,
      parentsRestOfIndiaGoverned: true,
      addressState: 'Rajasthan',
      religion: 'Hindu'
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_NOT_APPLICABLE);
    expect(res.canGenerateWill).toBe(true);
  });

  it('12. Stage 1: Ambiguous ancestral lineage without documentation triggers GOA_STATUS_UNDETERMINED', () => {
    const res = classifyGoaJurisdiction({
      pob: 'Margao, Goa'
      // Parents status unrecorded
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED);
    expect(res.blockers[0]).toContain('ERR_GOA_JURISDICTION_UNCONFIRMED');
    expect(res.canGenerateWill).toBe(false);
  });

  it('13. Stage 1 Neutral: Atheist evaluated strictly on Section 1(4) factual criteria, not religion label', () => {
    // If Section 1(4)(b) criteria met:
    const resGoa = classifyGoaJurisdiction({
      pob: 'Panaji, Goa',
      parentsPortugueseRegime: true,
      religion: 'Atheist'
    });
    expect(resGoa.status).toBe(JURISDICTION_STATUS.GOA_APPLICABLE);

    // If outside Goa, Atheist routes to legal review because succession law cannot be assumed
    const resRouter = resolvePersonalLawRegime({
      personal: {
        pob: 'Delhi',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        religion: 'Atheist'
      }
    });
    expect(resRouter.regime).toBe(PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED);
    expect(resRouter.requiresLegalReview).toBe(true);
  });

  it('25. Stage 1: Christian outside Goa governed fully by Indian Succession Act Part VI', () => {
    const res = resolvePersonalLawRegime({
      personal: {
        pob: 'Kochi, Kerala',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        religion: 'Christian'
      }
    });
    expect(res.regime).toBe(PERSONAL_LAW_REGIMES.CHRISTIAN_CIVIL);
    expect(res.isChristian).toBe(true);
    expect(res.statuteCitation).toContain('Indian Succession Act, 1925 (Part VI');
  });

  it('26. Stage 1: Parsi outside Goa governed by Indian Succession Act Part VI with Parsi scope', () => {
    const res = resolvePersonalLawRegime({
      personal: {
        pob: 'Mumbai, Maharashtra',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        religion: 'Parsi'
      }
    });
    expect(res.regime).toBe(PERSONAL_LAW_REGIMES.PARSI);
    expect(res.isParsi).toBe(true);
    expect(res.statuteCitation).toContain('Parsi Scope');
  });

  it('40. Stage 1 Central Blocker: Unrecognized succession regime halts PDF generation', () => {
    const willData = {
      personal: {
        fullName: 'Alex Doe',
        pob: 'Bengaluru',
        religion: 'Agnostic'
      }
    };
    const audit = runPreFlightLegalBlockerAudit(willData);
    expect(audit.isExecutionReady).toBe(false);
    expect(audit.blockers.some(b => b.code === 'ERR_PERSONAL_LAW_REVIEW_REQUIRED' || b.code === 'ERR_UNRECOGNIZED_PERSONAL_LAW')).toBe(true);
  });

  it('41. Stage 1 Central Blocker: Dawoodi Bohra / Ismaili special custom flagged for specialist review', () => {
    const willData = {
      personal: {
        fullName: 'Murtaza',
        pob: 'Surat, Gujarat',
        religion: 'Muslim',
        sect: 'Dawoodi Bohra',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true
      }
    };
    const audit = runPreFlightLegalBlockerAudit(willData);
    expect(audit.isExecutionReady).toBe(false);
    expect(audit.blockers.some(b => b.code === 'ERR_ISMAILI_BOHRA_SPECIAL_REVIEW')).toBe(true);
  });

  it('79. Stage 1 Negative: Spurious 10-year residency claim rejected under Section 1(4)', () => {
    const res = classifyGoaJurisdiction({
      pob: 'Bhopal, Madhya Pradesh',
      addressState: 'Goa',
      tenYearResidencyClaim: true
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED);
    expect(res.blockers[0]).toContain('ERR_INVALID_JURISDICTION_CRITERIA');
  });

  it('80. Stage 1 Negative: Marriage of non-Goan to Goan rejected as Section 1(4) qualification route', () => {
    const res = classifyGoaJurisdiction({
      pob: 'Lucknow, Uttar Pradesh',
      marriageToGoanClaim: true
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED);
    expect(res.blockers[0]).toContain('ERR_INVALID_JURISDICTION_CRITERIA');
  });

  it('81. Stage 1 Proviso: Residence in Goa due to Indian government service excluded from permanent residence', () => {
    const res = classifyGoaJurisdiction({
      pob: 'Margao, Goa',
      parentsPortugueseRegime: false,
      parentsRestOfIndiaGoverned: true,
      isGovernmentPosting: true,
      statutoryElectionClauseD: true
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_NOT_APPLICABLE);
    expect(res.statutoryClause).toContain('Posting Excluded from Permanent Residence');
  });

  it('82. Stage 1: Section 1(4)(c) disputed deadline or missing declaration date triggers GOA_STATUS_UNDETERMINED', () => {
    const res = classifyGoaJurisdiction({
      pob: 'Mumbai, Maharashtra',
      parentsPortugueseRegime: true,
      // Claimed opt out but missing Special Notary date/record
      statutoryOptOutClauseC: true,
      optOutBeforeSpecialNotary: false
    });
    // Missing verified opt-out leaves testator under Goa Act (clause C default)
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_APPLICABLE);
    expect(res.statutoryClause).toBe(GOA_SECTION_1_4_CLAUSES.CLAUSE_C);
  });

  it('83. Stage 1: Section 1(4)(e) foreign parents failing Citizenship Act requirements rejected', () => {
    const res = classifyGoaJurisdiction({
      pob: 'Panaji, Goa',
      foreignParentsCitizenshipFulfilled: false
    });
    // Without meeting Citizenship Act Sections 3 & 4, fails clause (e)
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED);
  });

  it('84. Stage 1 Goa Supremacy: Muslim governed by Goa Act remains under Goa Act, not Shariat (Jose Paulo Coutinho & Ashabi Khan)', () => {
    const willData = {
      personal: {
        fullName: 'Ibrahim Khan',
        pob: 'Margao, Goa',
        parentsPortugueseRegime: true,
        religion: 'Muslim',
        sect: 'Sunni'
      }
    };
    const res = resolvePersonalLawRegime(willData);
    expect(res.regime).toBe(PERSONAL_LAW_REGIMES.GOA_UCC);
    expect(res.isGoa).toBe(true);
    expect(res.isMuslim).toBe(false); // Does not divert to Shariat!
    expect(res.precedentAuthority).toContain('Jose Paulo Coutinho');
    expect(res.precedentAuthority).toContain('Ashabi Khan');
  });

  it('85. Stage 1 ISA Section 57(c) Residual Check: Negative test proving a Will covered by 57(a) or (b) is NOT reclassified under (c)', () => {
    const willDataPresidencyExecution = {
      personal: {
        fullName: 'Kolkata Testator',
        pob: 'Kolkata, West Bengal',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        religion: 'Hindu',
        willExecutionPlace: 'Kolkata, West Bengal',
        willExecutionDate: '2026-05-10'
      }
    };
    const resA = resolvePersonalLawRegime(willDataPresidencyExecution);
    expect(resA.section57Clause).toContain('Section 57(a)');
    expect(resA.section57Clause).not.toContain('Section 57(c)');

    const willDataPresidencyProperty = {
      personal: {
        fullName: 'Patna Testator',
        pob: 'Patna, Bihar',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        religion: 'Hindu',
        willExecutionPlace: 'Patna, Bihar',
        immovablePropertyLocation: 'Mumbai, Maharashtra',
        willExecutionDate: '2026-05-10'
      }
    };
    const resB = resolvePersonalLawRegime(willDataPresidencyProperty);
    expect(resB.section57Clause).toContain('Section 57(b)');
    expect(resB.section57Clause).not.toContain('Section 57(c)');
  });

  it('91. Stage 1 Positive Section 57(a), (b), (c) Regression Tests', () => {
    // 57(a): Execution in presidency town
    const willA = resolvePersonalLawRegime({
      personal: {
        fullName: 'Chennai Testator',
        pob: 'Chennai, Tamil Nadu',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        religion: 'Hindu',
        willExecutionPlace: 'Chennai'
      }
    });
    expect(willA.section57Clause).toContain('Section 57(a)');
    expect(willA.scheduleIIIApplicable).toBe(true);

    // 57(b): Immoveable property in presidency town
    const willB = resolvePersonalLawRegime({
      personal: {
        fullName: 'Pune Testator',
        pob: 'Pune, Maharashtra',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        religion: 'Hindu',
        willExecutionPlace: 'Pune',
        immovablePropertyLocation: 'Mumbai'
      }
    });
    expect(willB.section57Clause).toContain('Section 57(b)');
    expect(willB.scheduleIIIApplicable).toBe(true);

    // 57(c): Post-1927 Will executed outside presidency towns with immoveables outside presidency towns
    const willC = resolvePersonalLawRegime({
      personal: {
        fullName: 'Nagpur Testator',
        pob: 'Nagpur, Maharashtra',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        religion: 'Hindu',
        willExecutionPlace: 'Nagpur',
        immovablePropertyLocation: 'Nagpur',
        willExecutionDate: '2026-01-15'
      }
    });
    expect(willC.section57Clause).toContain('Section 57(c)');
    expect(willC.scheduleIIIApplicable).toBe(true);
  });

  it('92. Stage 1: Hindu Succession Act Section 30 coparcenary testamentary power recognized', () => {
    const res = resolvePersonalLawRegime({
      personal: {
        fullName: 'Venkatesh Rao',
        pob: 'Bengaluru, Karnataka',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        religion: 'Hindu'
      }
    });
    expect(res.regime).toBe(PERSONAL_LAW_REGIMES.HINDU);
    expect(res.coparcenaryNotice).toContain('Section 30 of the Hindu Succession Act, 1956');
  });

  it('93. Stage 1: Shariat Act Section 3 verified declaration applies Section 2 rules to wills and legacies', () => {
    const willData = {
      personal: {
        fullName: 'Zafar Ahmed',
        pob: 'Lucknow, Uttar Pradesh',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        religion: 'Muslim',
        sect: 'Sunni',
        shariatSec3Declaration: true,
        contractCompetent: true
      }
    };
    const res = resolvePersonalLawRegime(willData);
    expect(res.regime).toBe(PERSONAL_LAW_REGIMES.MUSLIM_SUNNI);
    expect(res.shariatSec3Verified).toBe(true);
    expect(res.statuteCitation).toContain('Section 3 Declaration Verified');
  });

  it('94. Stage 1 Negative: Missing Section 3 declaration does not activate Shariat calculation; emits ERR_MUSLIM_TESTAMENTARY_REGIME_UNCONFIRMED and LEGAL_REVIEW_REQUIRED', () => {
    const willData = {
      personal: {
        fullName: 'Mohammed Ali',
        pob: 'Hyderabad, Telangana',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        religion: 'Muslim',
        sect: 'Sunni',
        shariatSec3Declaration: false // Missing declaration!
      }
    };
    const res = resolvePersonalLawRegime(willData);
    expect(res.regime).toBe(PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED);
    expect(res.blockers[0]).toContain('ERR_MUSLIM_TESTAMENTARY_REGIME_UNCONFIRMED');

    const audit = runPreFlightLegalBlockerAudit(willData);
    expect(audit.isExecutionReady).toBe(false);
    expect(audit.blockers.some(b => b.code === 'ERR_MUSLIM_TESTAMENTARY_REGIME_UNCONFIRMED')).toBe(true);
  });

});
