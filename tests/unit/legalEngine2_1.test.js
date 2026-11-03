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
import { generateGoaSection333PDF } from '../../js/services/pdfGoaSection333.js';

describe('SmartWill India — Legal Engine 2.1 Statutory Regression Suite', () => {

  // ── GOA SECTION 1(4)(a)–(g) STATUTORY CLASSIFICATION TESTS ──

  it('1. Section 1(4)(a): Governed by Portuguese Civil Code of 1867 prior to 20 December 1961', () => {
    const res = classifyGoaJurisdiction({
      pob: 'Margao, Goa',
      dob: '1958-04-12',
      pre1961PortugueseRegime: true
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_ACT_APPLICABLE);
    expect(res.statutoryClause).toBe(GOA_SECTION_1_4_CLAUSES.CLAUSE_A);
  });

  it('2. Section 1(4)(b): Born in Goa to parents governed by the Portuguese Civil Code', () => {
    const res = classifyGoaJurisdiction({
      pob: 'Panaji, Goa',
      fatherPob: 'Margao, Goa',
      parentsPortugueseRegime: true
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_ACT_APPLICABLE);
    expect(res.statutoryClause).toBe(GOA_SECTION_1_4_CLAUSES.CLAUSE_B);
  });

  it('3. Section 1(4)(c): Born outside Goa to parents governed by the Code without opt-out declaration', () => {
    const res = classifyGoaJurisdiction({
      pob: 'Mumbai, Maharashtra',
      fatherPob: 'Margao, Goa',
      parentsPortugueseRegime: true,
      statutoryOptOutClauseC: false
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_ACT_APPLICABLE);
    expect(res.statutoryClause).toBe(GOA_SECTION_1_4_CLAUSES.CLAUSE_C);
  });

  it('4. Section 1(4)(c) Negative: Born outside Goa to Goan parents who executed statutory opt-out', () => {
    const res = classifyGoaJurisdiction({
      pob: 'London, UK',
      fatherPob: 'Margao, Goa',
      parentsPortugueseRegime: true,
      statutoryOptOutClauseC: true
    });
    expect(res.status).toBe(JURISDICTION_STATUS.INDIAN_SUCCESSION_ACT_APPLICABLE);
    expect(res.statutoryClause).toContain('Section 1(4)(c) Opt-Out');
  });

  it('5. Section 1(4)(d): Born in Goa to rest-of-India parents, fulfilling permanent residence and election', () => {
    const res = classifyGoaJurisdiction({
      pob: 'Margao, Goa',
      fatherPob: 'Delhi',
      motherPob: 'Delhi',
      statutoryElectionClauseD: true,
      permanentResidenceGoaSatisfied: true
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_ACT_APPLICABLE);
    expect(res.statutoryClause).toBe(GOA_SECTION_1_4_CLAUSES.CLAUSE_D);
  });

  it('6. Section 1(4)(d) Negative: Born in Goa to rest-of-India parents without statutory election', () => {
    const res = classifyGoaJurisdiction({
      pob: 'Margao, Goa',
      fatherPob: 'Delhi',
      motherPob: 'Delhi',
      statutoryElectionClauseD: false
    });
    expect(res.status).toBe(JURISDICTION_STATUS.INDIAN_SUCCESSION_ACT_APPLICABLE);
    expect(res.reasons[0]).toContain('Section 1(4)(d) Incomplete');
  });

  it('7. Section 1(4)(e): Born in Goa to foreign parents fulfilling Citizenship Act conditions and electing', () => {
    const res = classifyGoaJurisdiction({
      pob: 'Panaji, Goa',
      foreignParentsCitizenshipFulfilled: true
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_ACT_APPLICABLE);
    expect(res.statutoryClause).toBe(GOA_SECTION_1_4_CLAUSES.CLAUSE_E);
  });

  it('8. Section 1(4)(f): Born in Goa of unknown parents or unknown nationality', () => {
    const res = classifyGoaJurisdiction({
      pob: 'Vasco, Goa',
      unknownParentsOrNationality: true
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_ACT_APPLICABLE);
    expect(res.statutoryClause).toBe(GOA_SECTION_1_4_CLAUSES.CLAUSE_F);
  });

  it('9. Section 1(4)(g): Adopted by parents governed by the specified Code or Act', () => {
    const res = classifyGoaJurisdiction({
      pob: 'Bangalore, Karnataka',
      isAdopted: true,
      adoptiveParentsGoanRegime: true
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_ACT_APPLICABLE);
    expect(res.statutoryClause).toBe(GOA_SECTION_1_4_CLAUSES.CLAUSE_G);
  });

  it('10. Section 1(4) Proviso: Consular, diplomatic, or temporary military officers exempted', () => {
    const res = classifyGoaJurisdiction({
      addressCity: 'Margao',
      addressState: 'Goa',
      pob: 'Goa',
      isConsularOrDiplomaticPosting: true
    });
    expect(res.status).toBe(JURISDICTION_STATUS.INDIAN_SUCCESSION_ACT_APPLICABLE);
    expect(res.statutoryClause).toContain('Section 1(4) Proviso');
  });

  // ── SECTION 89 & SECTION 90+ COLLATION TESTS ──

  it('11. Section 89(1) Base adds ALL lifetime gifts, not merely collatable gifts', () => {
    const willData = {
      assets: [{ id: 1, type: 'Fixed Deposit', value: 2000000, allocations: [{ beneficiaryId: 'b1', percentage: 50 }] }],
      debts: [{ id: 'd1', amount: 200000 }],
      lifetimeGifts: [
        { id: 'g1', value: 300000, recipientRelation: 'Son' },       // Collatable under Sec 90
        { id: 'g2', value: 100000, recipientRelation: 'Unrelated' }  // Non-collatable, but included in Sec 89 base
      ],
      beneficiaries: [{ id: 'b1', name: 'Son A', relation: 'Son' }]
    };
    const calc = calculateGoaInheritance(willData);
    // (20,00,000 - 2,00,000) + 3,00,000 + 1,00,000 = 22,00,000
    expect(calc.section89ComputationBase).toBe(2200000);
    expect(calc.totalAllLifetimeGifts).toBe(400000);
    expect(calc.descendantCollationAdvancements).toBe(300000);
    expect(calc.thirdPartyLifetimeGifts).toBe(100000);
    expect(calc.statutoryLegitimeValue).toBe(1100000); // 50%
    expect(calc.statutoryDisposableQuota).toBe(1100000); // 50%
  });

  it('12. Substituted Section 83 forced shares under Goa Act 35 of 2023', () => {
    const willData = {
      assets: [{ id: 1, type: 'Cash', value: 1000000, allocations: [{ beneficiaryId: 'b1', percentage: 50 }] }],
      beneficiaries: [{ id: 'b1', name: 'Child A', relation: 'Daughter' }]
    };
    const calc = calculateGoaInheritance(willData);
    expect(calc.statutoryLegitimeValue).toBe(500000);
    expect(calc.statutoryDisposableQuota).toBe(500000);
  });

  // ── SECTION 219 FOUR STATUTORY EXCEPTIONS TESTS ──

  it('13. Section 219(a) Exception: Asset subsequently allotted to spouse in partition', () => {
    const asset = { desc: 'Partitioned Plot Sy #12', isInherited: true, hasRegisteredPartitionDeed: true };
    const mat = { isMarried: true, regime: MATRIMONIAL_REGIMES.COMMUNITY_OF_PROPERTY };
    const res = evaluateAssetMatrimonialOwnership(asset, mat);
    expect(res.section219Applies).toBe(false);
    expect(res.applicableException).toBe(SECTION_219_EXCEPTIONS.ALLOTTED_IN_PARTITION);
    expect(res.disposablePercentage).toBe(100);
  });

  it('14. Section 219(b) Exception: Asset does not form part of community (separate asset with incommunicability clause)', () => {
    const asset = { desc: 'Inherited Ancestral Jewels', isInherited: true, hasIncommunicabilityClause: true };
    const mat = { isMarried: true, regime: MATRIMONIAL_REGIMES.COMMUNITY_OF_PROPERTY };
    const res = evaluateAssetMatrimonialOwnership(asset, mat);
    expect(res.section219Applies).toBe(false);
    expect(res.applicableException).toBe(SECTION_219_EXCEPTIONS.NOT_PART_OF_COMMUNITY);
    expect(res.disposablePercentage).toBe(100);
  });

  it('15. Section 219(c) Exception: Disposition made by one spouse in favour of the other', () => {
    const asset = {
      desc: 'Community Flat 402',
      allocations: [{ beneficiaryId: 'b_spouse', percentage: 100, isSpouse: true, relation: 'Spouse' }]
    };
    const mat = { isMarried: true, regime: MATRIMONIAL_REGIMES.COMMUNITY_OF_PROPERTY };
    const res = evaluateAssetMatrimonialOwnership(asset, mat);
    expect(res.section219Applies).toBe(false);
    expect(res.applicableException).toBe(SECTION_219_EXCEPTIONS.DISPOSITION_IN_FAVOR_OF_SPOUSE);
    expect(res.disposablePercentage).toBe(100);
  });

  it('16. Section 219(d) Exception: Other spouse consents to disposition in Special Notary document', () => {
    const asset = { desc: 'Community Land Plot', hasSpouseNotarialConsent: true };
    const mat = { isMarried: true, regime: MATRIMONIAL_REGIMES.COMMUNITY_OF_PROPERTY };
    const res = evaluateAssetMatrimonialOwnership(asset, mat);
    expect(res.section219Applies).toBe(false);
    expect(res.applicableException).toBe(SECTION_219_EXCEPTIONS.SPOUSE_NOTARIAL_CONSENT);
    expect(res.disposablePercentage).toBe(100);
  });

  it('17. Section 219 General Rule: Community asset without exception restricted to 50% moiety', () => {
    const asset = { desc: 'General Community Acquest', allocations: [{ beneficiaryId: 'b_child', percentage: 100 }] };
    const mat = { isMarried: true, regime: MATRIMONIAL_REGIMES.COMMUNITY_OF_PROPERTY };
    const res = evaluateAssetMatrimonialOwnership(asset, mat);
    expect(res.section219Applies).toBe(true);
    expect(res.disposablePercentage).toBe(50);
  });

  // ── GOA SECTIONS 45 & 46 STATUTORY DEBT PRIORITY TESTS ──

  it('18. Goa Sections 45 & 46 debt priorities contain 3-part charges and creditor/legatee priority without wage limits', () => {
    const res = generateStatutoryDebtHierarchy({ isGoa: true });
    expect(res.section45Charges.length).toBe(3);
    expect(res.section45Charges[0]).toContain('Funeral and last-rites');
    expect(res.section45Charges[1]).toContain('Executorship and management burdens');
    expect(res.section45Charges[2]).toContain('Enforceable debts');
    expect(res.section46Priority[0]).toContain('First Priority: Inheritance Creditors');
    expect(res.section46Priority[1]).toContain('Second Priority: Legatees');
    expect(res.section46Priority[2]).toContain('Third Priority: Personal Creditors of Heirs');
    expect(JSON.stringify(res)).not.toContain('labourer, artisan');
  });

  // ── INDIAN TRUSTS ACT SECTION 20 TRUST INVESTMENTS TESTS ──

  it('19. Trust investments grounded in Section 20 Indian Trusts Act authorisations without arbitrary assumptions', () => {
    const res = generateMinorTrustClauses({ name: 'Aarav' }, { name: 'Maria' }, { isGoa: true });
    expect(res.authorizedInvestments[0]).toContain('specifically authorised by this testamentary trust instrument pursuant to Section 20');
    expect(res.authorizedInvestments[1]).toContain('specified and notified by the Central Government');
    expect(JSON.stringify(res)).not.toContain('IBBI');
  });

  // ── PERSONAL LAW ROUTING TESTS (PARSI, MUSLIM, CHRISTIAN, HINDU, GOA) ──

  it('20. Personal Law Routing: Distinct Parsi pathway under ISA Sections 50-56 & Part VI', () => {
    const res = resolvePersonalLawRegime({ personal: { religion: 'Parsi', addressCity: 'Mumbai' } });
    expect(res.regime).toBe(PERSONAL_LAW_REGIMES.PARSI);
    expect(res.isParsi).toBe(true);
    expect(res.statutoryCrest).toContain('PARSI TESTAMENTARY SUCCESSION');
  });

  it('21. Personal Law Routing: Distinct Muslim Sunni vs Shia Wasīyyat pathways', () => {
    const sunniRes = resolvePersonalLawRegime({ personal: { religion: 'Muslim', sect: 'Sunni', addressCity: 'Hyderabad' } });
    expect(sunniRes.regime).toBe(PERSONAL_LAW_REGIMES.MUSLIM_SUNNI);
    expect(sunniRes.wasīyyatRules).toContain('consent (express or implied) of all other surviving legal heirs');

    const shiaRes = resolvePersonalLawRegime({ personal: { religion: 'Muslim', sect: 'Shia (Ithna-Ashari)', addressCity: 'Lucknow' } });
    expect(shiaRes.regime).toBe(PERSONAL_LAW_REGIMES.MUSLIM_SHIA);
    expect(shiaRes.wasīyyatRules).toContain('whether in favor of an heir or non-heir without requiring consent');
  });

  it('22. Personal Law Routing: Distinct Christian & Civil marriage pathway under ISA Part VI', () => {
    const res = resolvePersonalLawRegime({ personal: { religion: 'Christian', addressCity: 'Kochi' } });
    expect(res.regime).toBe(PERSONAL_LAW_REGIMES.CHRISTIAN_CIVIL);
    expect(res.isChristian).toBe(true);
  });

  it('23. Personal Law Routing: Distinct Hindu pathway under HSA Section 30 & ISA Schedule III', () => {
    const res = resolvePersonalLawRegime({ personal: { religion: 'Hindu', addressCity: 'Bengaluru' } });
    expect(res.regime).toBe(PERSONAL_LAW_REGIMES.HINDU);
    expect(res.isHindu).toBe(true);
    expect(res.statutoryCrest).toContain('HINDU SUCCESSION ACT, 1956 & INDIAN SUCCESSION ACT, 1925 (SCHEDULE III)');
  });

  // ── TITLE VERIFICATION & UNPARTITIONED INHERITANCE TESTS ──

  it('24. Title Verification: Revenue records Form I & XIV alone trigger PROPERTY TITLE VERIFICATION REQUIRED', () => {
    const asset = { type: 'Plot of Land', titleDocType: TITLE_DOCUMENT_TYPES.FORM_I_AND_XIV_ONLY };
    const res = verifyPropertyTitle(asset, { isGoa: true });
    expect(res.isValidTitle).toBe(false);
    expect(res.statusText).toContain('PROPERTY TITLE VERIFICATION REQUIRED');
  });

  it('25. Title Verification: Unpartitioned ancestral orchard triggers Section 16 & 220 blocker', () => {
    const asset = {
      type: 'Agricultural Land',
      desc: 'Ancestral Orchard Plot Sy #89/2, Borda Village',
      isInherited: true,
      hasRegisteredPartitionDeed: false,
      details: { registrationNumber: 'Reg-405/1998' }
    };
    const res = verifyPropertyTitle(asset, { isGoa: true });
    expect(res.canBequestSpecificAsset).toBe(false);
    expect(res.blockers[0]).toContain('SECTION 16 & SECTION 220');
  });

  // ── NOMINATION DISAGGREGATION TESTS ──

  it('26. Nomination Engine: Distinguishes Section 39(7) Life Insurance beneficial nominee from Sarbati Devi baseline', () => {
    const res = generateNominationClause('Life Insurance Policy');
    expect(res.category).toBe('LIFE_INSURANCE');
    expect(res.governingStatute).toContain('Section 39(7)');
    expect(res.legalText).toContain('modified the baseline rule laid down in Sarbati Devi');
  });

  it('27. Nomination Engine: Accurately grounds Demat in Shakti Yezdani & Companies Act Sec 72', () => {
    const res = generateNominationClause('Demat Account & Equity Shares');
    expect(res.category).toBe('SECURITIES_DEMAT');
    expect(res.governingStatute).toContain('Section 72');
    expect(res.precedent).toContain('Shakti Yezdani');
  });

  // ── SECTION 333 PHYSICAL & PROCEDURAL PDF TESTS ──

  it('28. Section 333 Dedicated PDF: Generates valid A4 document with double line spacing and Notary record', async () => {
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
        { id: "b1", name: "Kevin Fernandes", relation: "Son" },
        { id: "b2", name: "Maria Fernandes", relation: "Spouse" }
      ],
      executor: { name: "Advocate Francis Xavier Pereira", relation: "Family Advocate" },
      witnesses: [{ name: "Witness 1" }, { name: "Witness 2" }]
    };

    const doc = await generateGoaSection333PDF(willData);
    expect(doc).toBeDefined();
    expect(doc.internal.pageSize.getWidth()).toBe(210);
    expect(doc.internal.pageSize.getHeight()).toBe(297);
  });

  // ── DRAFT READINESS INDEX STATUS BANDS & BLOCKER OVERRIDE ──

  it('29. Draft Readiness Index: 96-100 assigns explicit VERIFIED EXECUTION DRAFT status', () => {
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
      beneficiaries: [{ id: "b1", name: "Kevin Fernandes", relation: "Son" }],
      executor: { name: "Advocate Francis Xavier Pereira", relation: "Advocate" },
      witnesses: [{ name: "Witness 1" }, { name: "Witness 2" }]
    };

    const res = calculateDraftReadinessIndex(readyProfile);
    expect(res.score).toBeGreaterThanOrEqual(95);
    expect(res.statusBadge).toBe(DRAFT_STATUS_BANDS.VERIFIED_EXECUTION_DRAFT);
  });

  it('30. Draft Readiness Index: Mandatory blocker overrides numerical score and forces INCOMPLETE status', () => {
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
