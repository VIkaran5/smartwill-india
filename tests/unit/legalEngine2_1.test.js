import { describe, it, expect } from 'vitest';
import {
  classifyGoaJurisdiction as rawClassifyGoaJurisdiction,
  JURISDICTION_STATUS,
  GOA_SECTION_1_4_CLAUSES,
  JURISDICTION_DOCUMENT_TYPES,
  validateJurisdictionEvidence as rawValidateJurisdictionEvidence
} from '../../js/legal/goaJurisdiction.js';
import { calculateGoaInheritance, CALCULATION_STATUS } from '../../js/legal/inheritanceCalculator.js';
import { evaluateAssetMatrimonialOwnership, MATRIMONIAL_REGIMES, SECTION_219_EXCEPTIONS } from '../../js/legal/matrimonialRegime.js';
import { verifyPropertyTitle, TITLE_DOCUMENT_TYPES } from '../../js/legal/titleVerification.js';
import { generateNominationClause } from '../../js/legal/nominationRules.js';
import { generateMinorTrustClauses, generateStatutoryDebtHierarchy } from '../../js/legal/trusteeMinorRules.js';
import { validateResiduaryAllocations } from '../../js/legal/residuaryValidator.js';
import { runPreFlightLegalBlockerAudit as rawRunPreFlightLegalBlockerAudit } from '../../js/legal/legalBlockers.js';
import { calculateDraftReadinessIndex as rawCalculateDraftReadinessIndex, DRAFT_STATUS_BANDS } from '../../js/legal/readinessIndex.js';
import {
  resolvePersonalLawRegime as rawResolvePersonalLawRegime,
  PERSONAL_LAW_REGIMES,
  validateShariatDeclarationRecord as rawValidateShariatDeclarationRecord,
  HISTORICAL_PRESIDENCY_CODES
} from '../../js/legal/personalLawRouter.js';
import { generateGoaSection333PDF as rawGenerateGoaSection333PDF, formatDateToFormalWords } from '../../js/services/pdfGoaSection333.js';

import {
  createTrustedServerEvidenceFixture,
  createTestAuthContext,
  createTestCompletenessDeclaration,
  registerAndVerifyEvidence,
  clearServerVerificationRegistry
} from '../fixtures/testEvidenceFixtures.js';

import {
  VALID_LAND_CLASSIFICATION_DOC_TYPES,
  VALID_PROPERTY_TERRITORY_DOC_TYPES,
  setCryptographicTicketVerifier,
  validateEvidenceRecordAgainstServer
} from '../../js/legal/evidenceValidator.js';

// Default authenticated server context for test suite
const defaultAuthContext = createTestAuthContext();

// Test suite wrappers enforcing authenticated server context
function classifyGoaJurisdiction(p, auth) {
  const context = arguments.length > 1 ? auth : (p && p.authenticatedServerContext !== undefined ? p.authenticatedServerContext : defaultAuthContext);
  return rawClassifyGoaJurisdiction(p, context);
}

function resolvePersonalLawRegime(willData, auth) {
  const context = arguments.length > 1 ? auth : (willData && willData.authenticatedServerContext !== undefined ? willData.authenticatedServerContext : defaultAuthContext);
  return rawResolvePersonalLawRegime(willData, context);
}

function validateShariatDeclarationRecord(record, personal, auth) {
  const context = arguments.length > 2 ? auth : defaultAuthContext;
  return rawValidateShariatDeclarationRecord(record, personal, context);
}

function validateJurisdictionEvidence(record, expectedDocTypes = [], context) {
  const effectiveContext = (arguments.length > 2 && context !== undefined)
    ? { ...defaultAuthContext, ...context }
    : defaultAuthContext;
  return rawValidateJurisdictionEvidence(record, expectedDocTypes, effectiveContext);
}

function ensureTestAuth(data) {
  if (!data || typeof data !== 'object') return data;
  if (!data.authenticatedServerContext && !data.authContext && (!data.personal || !data.personal.authenticatedServerContext)) {
    return {
      ...data,
      authenticatedServerContext: defaultAuthContext,
      personal: data.personal ? {
        ...data.personal,
        authenticatedServerContext: defaultAuthContext
      } : undefined
    };
  }
  return data;
}

async function generateGoaSection333PDF(willData) {
  return rawGenerateGoaSection333PDF(ensureTestAuth(willData));
}

function calculateDraftReadinessIndex(willData) {
  return rawCalculateDraftReadinessIndex(ensureTestAuth(willData));
}

function runPreFlightLegalBlockerAudit(willData) {
  return rawRunPreFlightLegalBlockerAudit(ensureTestAuth(willData));
}

// Standard verified evidence fixtures for test suite with authentic backend forensic verification
const sampleClauseAEvidence = createTrustedServerEvidenceFixture({
  documentStorageId: "DOC-STORE-GOA-1959-882",
  documentRef: "REG-CIVIL-1959/882",
  documentType: JURISDICTION_DOCUMENT_TYPES.HISTORICAL_PORTUGUESE_CIVIL_RECORD,
  issuingAuthority: "Conservatória do Registo Civil de Salcete (Margao)",
  registrationDate: "1959-06-12",
  verifiedParties: "Testator António Fernandes",
  reviewerRole: "ADVOCATE",
  enrollmentNumber: "GOA/123/2005",
  verifiedBy: "Advocate Carlos Pereira, Bar of Goa"
});

const sampleClauseBEvidence = createTrustedServerEvidenceFixture({
  documentStorageId: "DOC-STORE-GOA-1960-451",
  documentRef: "ASSENTO-1960/451",
  documentType: JURISDICTION_DOCUMENT_TYPES.PARENTS_PORTUGUESE_CIVIL_REGISTRATION,
  issuingAuthority: "Conservatória do Registo Civil de Ilhas (Panaji)",
  registrationDate: "1960-03-15",
  verifiedParties: "Parents Antonio Fernandes & Maria D'Souza",
  reviewerRole: "ADVOCATE",
  enrollmentNumber: "GOA/123/2005",
  verifiedBy: "Advocate Carlos Pereira, Bar of Goa"
});

const sampleClauseCEvidence = createTrustedServerEvidenceFixture({
  documentStorageId: "DOC-STORE-GOA-1980-021",
  documentRef: "NOT-OPTOUT-1980/21",
  documentType: JURISDICTION_DOCUMENT_TYPES.SPECIAL_NOTARY_OPT_OUT_DEED,
  issuingAuthority: "Special Notary Office of Margao",
  registrationDate: "1980-05-10",
  verifiedParties: "Declarant Francis Fernandes",
  reviewerRole: "SPECIAL_NOTARY",
  enrollmentNumber: "NOTARY/GOA/1980/12",
  verifiedBy: "Special Notary Office of Margao"
});

const sampleClauseDEvidence = createTrustedServerEvidenceFixture({
  documentStorageId: "DOC-STORE-GOA-2018-104",
  documentRef: "NOT-ELECTION-2018/104",
  documentType: JURISDICTION_DOCUMENT_TYPES.SPECIAL_NOTARY_ELECTION_DEED,
  issuingAuthority: "Special Notary Office of Panaji",
  registrationDate: "2018-05-20",
  verifiedParties: "Declarant Rajesh Gupta",
  reviewerRole: "SPECIAL_NOTARY",
  enrollmentNumber: "NOTARY/GOA/2018/45",
  verifiedBy: "Special Notary Office of Panaji"
});

const sampleResidenceEvidence = createTrustedServerEvidenceFixture({
  documentStorageId: "DOC-STORE-GOA-RES-2015-778",
  documentRef: "GOA-RES-CERT-2015/778",
  documentType: JURISDICTION_DOCUMENT_TYPES.PERMANENT_RESIDENCE_CERTIFICATE,
  issuingAuthority: "Mamlatdar of Tiswadi (Panaji)",
  issueDate: "2015-01-10",
  verifiedParties: "Rajesh Gupta",
  reviewerRole: "GOVERNMENT_AUTHORITY",
  enrollmentNumber: "MAMLATDAR/TISWADI/GOA",
  verifiedBy: "Mamlatdar of Tiswadi"
});

const sampleClauseEEvidence = createTrustedServerEvidenceFixture({
  documentStorageId: "DOC-STORE-MHA-1992-055",
  documentRef: "MHA-CIT-1992/55",
  documentType: JURISDICTION_DOCUMENT_TYPES.CITIZENSHIP_ACT_VERIFICATION_CERTIFICATE,
  issuingAuthority: "Ministry of Home Affairs / District Magistrate North Goa",
  issueDate: "1992-08-11",
  verifiedParties: "Foreign-Citizen Parents and Testator",
  reviewerRole: "GOVERNMENT_AUTHORITY",
  enrollmentNumber: "MHA/F-SEC/1992",
  verifiedBy: "District Magistrate North Goa"
});

const sampleClauseFEvidence = createTrustedServerEvidenceFixture({
  documentStorageId: "DOC-STORE-FOUNDLING-1975-002",
  documentRef: "CIVIL-FOUNDLING-1975/02",
  documentType: JURISDICTION_DOCUMENT_TYPES.FOUNDLING_CIVIL_REGISTRATION,
  issuingAuthority: "Civil Registrar of Mormugao (Vasco)",
  registrationDate: "1975-09-04",
  verifiedParties: "Foundling Child under Official Civil Custody",
  reviewerRole: "CIVIL_REGISTRAR",
  enrollmentNumber: "REGISTRAR/MORMUGAO/1975",
  verifiedBy: "Civil Registrar of Mormugao"
});

const sampleClauseGEvidence = createTrustedServerEvidenceFixture({
  documentStorageId: "DOC-STORE-ADOPT-2005-119",
  documentRef: "ADOPT-REG-2005/119",
  documentType: JURISDICTION_DOCUMENT_TYPES.REGISTERED_ADOPTION_DEED,
  issuingAuthority: "Sub-Registrar of Salcete (Margao)",
  registrationDate: "2005-11-20",
  verifiedParties: "Adoptive Parents governed by Goa Succession Act",
  reviewerRole: "SUB_REGISTRAR",
  enrollmentNumber: "SUBREG/SALCETE/2005",
  verifiedBy: "Sub-Registrar of Salcete",
  documentMetadata: { adoptiveParentsGoanRegimeVerified: true }
});

const sampleAdoptiveParentsGoanEvidence = createTrustedServerEvidenceFixture({
  documentStorageId: "DOC-STORE-ADOPT-PARENTS-001",
  documentRef: "ASSENTO-1955/210",
  documentType: JURISDICTION_DOCUMENT_TYPES.PARENTS_PORTUGUESE_CIVIL_REGISTRATION,
  issuingAuthority: "Conservatória do Registo Civil de Salcete (Margao)",
  registrationDate: "1955-08-14",
  verifiedParties: "Adoptive Parents Manuel & Maria Fernandes",
  reviewerRole: "ADVOCATE",
  enrollmentNumber: "GOA/123/2005",
  verifiedBy: "Advocate Carlos Pereira, Bar of Goa"
});

const sampleAdoptiveParentsRoiEvidence = createTrustedServerEvidenceFixture({
  documentStorageId: "DOC-STORE-ROI-ADOPT-PARENTS-002",
  documentRef: "DOMICILE-MH-1980/44",
  documentType: JURISDICTION_DOCUMENT_TYPES.REST_OF_INDIA_DOMICILE_CERTIFICATE,
  issuingAuthority: "Tahsildar of Pune",
  issueDate: "1980-04-12",
  verifiedParties: "Adoptive Parents Suresh & Anita Joshi",
  reviewerRole: "ADVOCATE",
  enrollmentNumber: "MAH/456/1990",
  verifiedBy: "Advocate Rajesh Deshmukh, Bar Council of Maharashtra"
});

const sampleParentsRoiEvidence = createTrustedServerEvidenceFixture({
  documentStorageId: "DOC-STORE-ROI-PARENTS-003",
  documentRef: "ROI-DOM-UP-1970/112",
  documentType: JURISDICTION_DOCUMENT_TYPES.REST_OF_INDIA_DOMICILE_CERTIFICATE,
  issuingAuthority: "District Magistrate of Lucknow",
  issueDate: "1970-07-15",
  verifiedParties: "Parents Ramesh & Sunita Gupta",
  reviewerRole: "ADVOCATE",
  enrollmentNumber: "UP/789/1985",
  verifiedBy: "Advocate Tariq Khan, High Court of Allahabad"
});

const samplePostingEvidence = createTrustedServerEvidenceFixture({
  documentStorageId: "DOC-STORE-GOVT-POSTING-004",
  documentRef: "MOD-POSTING-ORD-1998/55",
  documentType: JURISDICTION_DOCUMENT_TYPES.GOVERNMENT_POSTING_RECORD,
  issuingAuthority: "Ministry of Defence / Central Government of India",
  issueDate: "1998-02-01",
  verifiedParties: "Testator Parent Official Deployment Order to Goa",
  reviewerRole: "ADVOCATE",
  enrollmentNumber: "GOA/123/2005",
  verifiedBy: "Advocate Carlos Pereira, Bar of Goa"
});

const sampleSpecialMarriageCertificateEvidence = createTrustedServerEvidenceFixture({
  documentStorageId: "DOC-STORE-SMA-CERT-005",
  documentRef: "SMA-MARR-CERT-2012/441",
  documentType: JURISDICTION_DOCUMENT_TYPES.SPECIAL_MARRIAGE_CERTIFICATE,
  issuingAuthority: "Marriage Officer under Special Marriage Act, 1954, New Delhi",
  registrationDate: "2012-06-18",
  verifiedParties: "Spouses Married under Special Marriage Act, 1954",
  reviewerRole: "ADVOCATE",
  enrollmentNumber: "D/567/2008",
  verifiedBy: "Advocate Sunita Sharma, Bar Council of Delhi"
});

const sampleShariatDeclarationRecord = createTrustedServerEvidenceFixture({
  documentStorageId: "DOC-STORE-SHARIAT-DECL-006",
  filingReference: "SHARIAT-DECL-2022/89",
  declarationDate: "2022-03-15",
  prescribedAuthority: "District Magistrate, Lucknow",
  formType: "FORM_A_SHARIAT_SECTION_3",
  residenceTerritory: "Uttar Pradesh",
  reviewerRole: "ADVOCATE",
  enrollmentNumber: "UP/789/1985",
  verifiedBy: "Advocate Tariq Khan, High Court of Allahabad",
  documentMetadata: {
    filingReference: "SHARIAT-DECL-2022/89",
    declarationDate: "2022-03-15",
    prescribedAuthority: "District Magistrate, Lucknow",
    formType: "FORM_A_SHARIAT_SECTION_3",
    residenceTerritory: "Uttar Pradesh",
    statutoryDescendantCoverage: true,
    minorChildrenCovered: true,
    stateRuleAuthorityVerified: true,
    competenceVerified: true
  }
});
sampleShariatDeclarationRecord.filingReference = "SHARIAT-DECL-2022/89";
sampleShariatDeclarationRecord.declarationDate = "2022-03-15";
sampleShariatDeclarationRecord.prescribedAuthority = "District Magistrate, Lucknow";
sampleShariatDeclarationRecord.formType = "FORM_A_SHARIAT_SECTION_3";
sampleShariatDeclarationRecord.residenceTerritory = "Uttar Pradesh";
sampleShariatDeclarationRecord.statutoryDescendantCoverage = true;
sampleShariatDeclarationRecord.minorChildrenCovered = true;
sampleShariatDeclarationRecord.stateRuleAuthorityVerified = true;
sampleShariatDeclarationRecord.competenceVerified = true;

const sampleHistoricalTerritoryEvidence = createTrustedServerEvidenceFixture({
  documentStorageId: "DOC-STORE-HIST-TERR-007",
  documentRef: "HIST-SURVEY-1870/412",
  documentType: "CTS_PROPERTY_CARD",
  issuingAuthority: "High Court of Judicature at Bombay (Original Jurisdiction Registry)",
  issueDate: "1920-04-15",
  registrationDate: "1920-04-15",
  verifiedParties: "Testator and Property Survey Record",
  reviewerRole: "ADVOCATE",
  enrollmentNumber: "GOA/123/2005",
  verifiedBy: "Advocate Carlos Pereira, Bar of Goa",
  claimedStatutoryFact: "HISTORICAL_TERRITORY_PROPERTY"
});

const sampleRevenueClassificationEvidence = createTrustedServerEvidenceFixture({
  documentStorageId: "DOC-STORE-REVENUE-NA-2021-09",
  documentRef: "SANAD-NA-2021/891",
  documentType: "REVENUE_SANAD_NON_AGRICULTURAL",
  issuingAuthority: "Collector / Sub-Divisional Officer, Pune",
  issueDate: "2021-06-15",
  verifiedParties: "Imtiaz Khan",
  reviewerRole: "ADVOCATE",
  enrollmentNumber: "MAH/456/1990",
  verifiedBy: "Advocate Rajesh Deshmukh, Bar Council of Maharashtra",
  claimedStatutoryFact: "NON_AGRICULTURAL"
});

const sampleDeclarantRoiDomicileEvidence = createTrustedServerEvidenceFixture({
  documentStorageId: "DOC-STORE-ROI-DECL-DOM-008",
  documentRef: "ROI-DOM-UP-2019/554",
  documentType: JURISDICTION_DOCUMENT_TYPES.REST_OF_INDIA_DOMICILE_CERTIFICATE,
  issuingAuthority: "District Magistrate of Lucknow",
  issueDate: "2019-03-10",
  verifiedParties: "Tariq Aziz",
  reviewerRole: "ADVOCATE",
  enrollmentNumber: "UP/789/1985",
  verifiedBy: "Advocate Tariq Khan, High Court of Allahabad"
});

describe('SmartWill India — Legal Engine 2.1 Statutory Regression Suite', () => {

  // ── GOA SECTION 1(4)(a)–(g) STATUTORY CLASSIFICATION TESTS ──

  it('1. Section 1(4)(a): Requires affirmative proof of 1867 Civil Code regime (not mere pre-1961 birth date)', () => {
    const resVerified = classifyGoaJurisdiction({
      pob: 'Margao, Goa',
      dob: '1958-04-12',
      pre1961PortugueseRegime: true,
      clauseAEvidence: sampleClauseAEvidence
    });
    expect(resVerified.status).toBe(JURISDICTION_STATUS.GOA_APPLICABLE);
    expect(resVerified.statutoryClause).toBe(GOA_SECTION_1_4_CLAUSES.CLAUSE_A);

    const resUnverified = classifyGoaJurisdiction({
      pob: 'Margao, Goa',
      dob: '1958-04-12'
    });
    expect(resUnverified.status).toBe(JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED);
    expect(resUnverified.canGenerateWill).toBe(false);
  });

  it('2. Section 1(4)(b): Born in Goa to parents affirmatively governed by 1867 Civil Code', () => {
    const res = classifyGoaJurisdiction({
      pob: 'Panaji, Goa',
      fatherPob: 'Margao, Goa',
      parentsPortugueseRegime: true,
      clauseBEvidence: sampleClauseBEvidence
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_APPLICABLE);
    expect(res.statutoryClause).toBe(GOA_SECTION_1_4_CLAUSES.CLAUSE_B);
  });

  it('3. Section 1(4)(b) Negative: Parents born in Goa but NOT governed by Portuguese Civil Code', () => {
    const res = classifyGoaJurisdiction({
      pob: 'Margao, Goa',
      fatherPob: 'Margao, Goa',
      parentsPortugueseRegime: false,
      parentsRestOfIndiaGoverned: true,
      parentsRestOfIndiaEvidence: sampleParentsRoiEvidence
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_NOT_APPLICABLE);
    expect(res.reasons[0]).toContain('Jose Paulo Coutinho');
  });

  it('4. Section 1(4)(c): Born outside Goa to parents governed by the Code without valid opt-out', () => {
    const res = classifyGoaJurisdiction({
      pob: 'Mumbai, Maharashtra',
      parentsPortugueseRegime: true,
      clauseBEvidence: sampleClauseBEvidence,
      statutoryOptOutClauseC: false
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_APPLICABLE);
    expect(res.statutoryClause).toBe(GOA_SECTION_1_4_CLAUSES.CLAUSE_C);
  });

  it('5. Section 1(4)(c) Opt-Out: Executed before Special Notary within statutory 3-year deadline', () => {
    const res = classifyGoaJurisdiction({
      pob: 'London, UK',
      dob: '1960-01-01',
      parentsPortugueseRegime: true,
      clauseBEvidence: sampleClauseBEvidence,
      statutoryOptOutClauseC: true,
      optOutBeforeSpecialNotary: true,
      optOutDeclarationDate: '1980-05-10',
      clauseCEvidence: sampleClauseCEvidence
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_NOT_APPLICABLE);
    expect(res.statutoryClause).toContain('Section 1(4)(c) Opt-Out');
  });

  it('6. Section 1(4)(d): Born in Goa to rest-of-India parents, fulfilling permanent residence and statutory election', () => {
    const res = classifyGoaJurisdiction({
      pob: 'Margao, Goa',
      dob: '2000-01-01',
      parentsPortugueseRegime: false,
      parentsRestOfIndiaGoverned: true,
      parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
      statutoryElectionClauseD: true,
      clauseDEvidence: sampleClauseDEvidence,
      permanentResidenceEvidence: sampleResidenceEvidence
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_APPLICABLE);
    expect(res.statutoryClause).toBe(GOA_SECTION_1_4_CLAUSES.CLAUSE_D);
  });

  it('7. Section 1(4) Proviso: Consular/military posting does not establish permanent residence under Clause (d)', () => {
    const res = classifyGoaJurisdiction({
      pob: 'Margao, Goa',
      parentsPortugueseRegime: false,
      parentsRestOfIndiaGoverned: true,
      parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
      isTemporaryMilitaryPosting: true,
      postingEvidence: samplePostingEvidence,
      statutoryElectionClauseD: true
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_NOT_APPLICABLE);
    expect(res.statutoryClause).toContain('Posting Excluded from Permanent Residence');
  });

  it('8. Section 1(4)(e): Born in Goa to foreign parents satisfying Citizenship Act Sections 3 & 4', () => {
    const res = classifyGoaJurisdiction({
      pob: 'Panaji, Goa',
      foreignParentsCitizenshipFulfilled: true,
      clauseEEvidence: sampleClauseEEvidence
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_APPLICABLE);
    expect(res.statutoryClause).toBe(GOA_SECTION_1_4_CLAUSES.CLAUSE_E);
  });

  it('9. Section 1(4)(f): Born in Goa of unknown parents or unknown nationality', () => {
    const res = classifyGoaJurisdiction({
      pob: 'Vasco, Goa',
      unknownParentsOrNationality: true,
      clauseFEvidence: sampleClauseFEvidence
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_APPLICABLE);
    expect(res.statutoryClause).toBe(GOA_SECTION_1_4_CLAUSES.CLAUSE_F);
  });

  it('10. Section 1(4)(g): Adopted by parents governed by the specified Code or Act', () => {
    const res = classifyGoaJurisdiction({
      pob: 'Bangalore, Karnataka',
      isAdopted: true,
      clauseGEvidence: sampleClauseGEvidence,
      adoptiveParentsEvidence: sampleAdoptiveParentsGoanEvidence
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_APPLICABLE);
    expect(res.statutoryClause).toBe(GOA_SECTION_1_4_CLAUSES.CLAUSE_G);
  });

  // ── INHERITANCE CALCULATOR, SECTIONS 89 & 110–121 TESTS ──

  it('11. Section 89(1) Base adds ALL lifetime gifts; Section 89(2) perished property excluded', () => {
    const willData = {
      assets: [{ id: 1, type: 'Fixed Deposit', value: 2000000, allocations: [{ beneficiaryId: 'b1', percentage: 50 }] }],
      debts: [{ id: 'd1', amount: 200000 }],
      lifetimeGifts: [
        { id: 'g1', value: 300000, recipientRelation: 'Son' },
        { id: 'g2', value: 100000, recipientRelation: 'Third Party' },
        { id: 'g3', value: 50000, desc: 'Perished Car', hasPerishedWithoutFault: true }
      ],
      beneficiaries: [{ id: 'b1', name: 'Son A', relation: 'Son' }]
    };
    const calc = calculateGoaInheritance(willData);
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
      beneficiaries: [{ id: 'b_charity', name: 'Charity Trust', relation: 'Charity' }],
      familyStructure: {
        children: [{ name: 'Omitted Son', age: 24 }]
      }
    };
    const calc = calculateGoaInheritance(willData);
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
    expect(calc.statutoryLegitimeValue).toBeCloseTo(1000000, 0);
    expect(calc.statutoryDisposableQuota).toBeCloseTo(2000000, 0);
    expect(calc.legitimeDescription).toContain('Section 83(d)');
  });

  it('14. Estate Insolvency: Debts exceeding assets triggers fatal estate deficiency blocker', () => {
    const willData = {
      assets: [{ id: 1, type: 'Bank Account', value: 500000 }],
      debts: [{ id: 'd1', amount: 800000 }],
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
      allocations: [{ beneficiaryId: 'b_child', percentage: 50 }]
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
      details: { registrationNumber: 'FAKE-12345' }
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
    const res = resolvePersonalLawRegime({ personal: { fullName: 'Amit' } });
    expect(res.regime).toBe(PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED);
    expect(res.requiresLegalReview).toBe(true);
  });

  it('26. Personal Law Router: Shia Ismaili / Dawoodi Bohra flags school-specific legal review', () => {
    const res = resolvePersonalLawRegime({
      personal: {
        fullName: 'Ali Asghar',
        pob: 'Lucknow, UP',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: 'Muslim',
        sect: 'Dawoodi Bohra'
      }
    });
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
        clauseBEvidence: sampleClauseBEvidence,
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
    expect(Math.round(doc.internal.pageSize.getWidth())).toBe(210);
    expect(Math.round(doc.internal.pageSize.getHeight())).toBe(297);
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);

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
        clauseBEvidence: sampleClauseBEvidence,
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
    };

    const res = calculateDraftReadinessIndex(readyProfile);
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
        clauseBEvidence: sampleClauseBEvidence,
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
      },
      assets: [{ id: 1, type: "Flat", value: 1000000, titleDocType: "REGISTERED_SALE_DEED" }]
    };
    const res = calculateDraftReadinessIndex(blockedProfile);
    expect(res.statusBadge).toBe(DRAFT_STATUS_BANDS.INCOMPLETE);
    expect(res.score).toBeLessThanOrEqual(75);
    expect(res.audit.totalBlockersCount).toBeGreaterThan(0);
  });

  // ── SECTIONS 110–121 REDUCTION SCHEDULE TESTS ──

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
          recipientRelation: "Cousin"
        },
        {
          id: "g2",
          desc: "Gift of Shares to Trust",
          value: 1000000,
          date: "2024-06-15",
          recipientRelation: "Trust"
        }
      ],
      beneficiaries: [
        { id: "b1", name: "Friend Alpha", relation: "Friend" },
        { id: "b_son", name: "Raj", relation: "Son" }
      ],
      familyStructure: {
        children: [{ name: "Raj" }]
      }
    };

    const calc = calculateGoaInheritance(willData);
    expect(calc.status).toBe(CALCULATION_STATUS.INOFFICIOUS_BREACH);
    expect(calc.reductionSchedule).toBeDefined();
    expect(calc.reductionSchedule.totalReductionFromLegacies).toBe(3000000);
    expect(calc.reductionSchedule.legacies[0].reductionAmount).toBe(3000000);
    expect(calc.reductionSchedule.legacies[0].netValueAfterReduction).toBe(1000000);
  });

  it('32. Section 219 Negative: Partition deed without verified allotment to testator is rejected', () => {
    const asset = {
      desc: "Unallotted Family Parcel Sy #50",
      hasRegisteredPartitionDeed: true,
      isAllottedToTestator: false
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
      hasSpouseNotarialConsent: true
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
      isDocumentVerified: false
    };
    const res = verifyPropertyTitle(asset);
    expect(res.isValidTitle).toBe(false);
    expect(res.statusText).toBe("ROOT TITLE DOCUMENT UNVERIFIED");
    expect(res.blockers[0]).toContain("UNVERIFIED ROOT TITLE RECORD");
  });

  it('35. Personal Law Router: Unrecognized religion returns LEGAL_REVIEW_REQUIRED (never defaults to Hindu)', () => {
    const res = resolvePersonalLawRegime({
      personal: {
        fullName: "Test User",
        pob: "Delhi",
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: "Atheist"
      }
    });
    expect(res.regime).toBe(PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED);
    expect(res.requiresLegalReview).toBe(true);
    expect(res.isHindu).toBe(false);
  });

  it('36. Personal Law Router: Ismaili/Bohra returns fatal review blocker', () => {
    const res = resolvePersonalLawRegime({
      personal: {
        fullName: "Mustafa",
        pob: "Mumbai, Maharashtra",
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: "Muslim",
        sect: "Bohra"
      }
    });
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
        clauseBEvidence: sampleClauseBEvidence,
        addressLine1: "Borda",
        addressCity: "Margao",
        addressState: "Goa",
        pincode: "403601"
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

  it('40. Stage 1 Central Blocker: Unrecognized succession regime halts PDF generation', () => {
    const willData = {
      personal: {
        fullName: 'Alex Doe',
        pob: 'Bengaluru',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: 'Agnostic'
      }
    };
    const audit = runPreFlightLegalBlockerAudit(willData);
    expect(audit.isExecutionReady).toBe(false);
    expect(audit.blockers.some(b => b.code === 'ERR_PERSONAL_LAW_REVIEW_REQUIRED' || b.code === 'UNRECOGNIZED_PERSONAL_LAW')).toBe(true);
  });

  it('41. Stage 1 Central Blocker: Dawoodi Bohra / Ismaili special custom flagged for specialist review', () => {
    const willData = {
      personal: {
        fullName: 'Murtaza',
        pob: 'Surat, Gujarat',
        religion: 'Muslim',
        sect: 'Dawoodi Bohra',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence
      }
    };
    const audit = runPreFlightLegalBlockerAudit(willData);
    expect(audit.isExecutionReady).toBe(false);
    expect(audit.blockers.some(b => b.code === 'ERR_ISMAILI_BOHRA_SPECIAL_REVIEW')).toBe(true);
  });

  it('42. Stage 1: Non-Goan Indian citizen with no Section 1(4) qualifying criteria routed to Central Law', () => {
    const res = classifyGoaJurisdiction({
      pob: 'Jaipur, Rajasthan',
      parentsPortugueseRegime: false,
      parentsRestOfIndiaGoverned: true,
      parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
      addressState: 'Rajasthan',
      religion: 'Hindu'
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_NOT_APPLICABLE);
    expect(res.canGenerateWill).toBe(true);
  });

  it('43. Stage 1: Ambiguous ancestral lineage without documentation triggers GOA_STATUS_UNDETERMINED', () => {
    const res = classifyGoaJurisdiction({
      pob: 'Margao, Goa'
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED);
    expect(res.blockers[0]).toContain('ERR_GOA_JURISDICTION_UNCONFIRMED');
    expect(res.canGenerateWill).toBe(false);
  });

  it('44. Stage 1 Neutral: Atheist evaluated strictly on Section 1(4) factual criteria, not religion label', () => {
    const resGoa = classifyGoaJurisdiction({
      pob: 'Panaji, Goa',
      parentsPortugueseRegime: true,
      clauseBEvidence: sampleClauseBEvidence,
      religion: 'Atheist'
    });
    expect(resGoa.status).toBe(JURISDICTION_STATUS.GOA_APPLICABLE);

    const resRouter = resolvePersonalLawRegime({
      personal: {
        fullName: 'Test Person',
        pob: 'Delhi',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: 'Atheist'
      }
    });
    expect(resRouter.regime).toBe(PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED);
    expect(resRouter.requiresLegalReview).toBe(true);
  });

  it('45. Stage 1: Christian outside Goa governed fully by Indian Succession Act Part VI without Section 57 citation', () => {
    const res = resolvePersonalLawRegime({
      personal: {
        pob: 'Kochi, Kerala',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: 'Christian'
      }
    });
    expect(res.regime).toBe(PERSONAL_LAW_REGIMES.CHRISTIAN_CIVIL);
    expect(res.isChristian).toBe(true);
    expect(res.statuteCitation).toContain('Indian Succession Act, 1925 (Part VI');
    expect(res.statuteCitation).not.toContain('Section 57');
  });

  it('46. Stage 1: Parsi outside Goa governed by Indian Succession Act Part VI with Section 58 Parsi scope without Section 57 citation', () => {
    const res = resolvePersonalLawRegime({
      personal: {
        pob: 'Mumbai, Maharashtra',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: 'Parsi'
      }
    });
    expect(res.regime).toBe(PERSONAL_LAW_REGIMES.PARSI);
    expect(res.isParsi).toBe(true);
    expect(res.statuteCitation).toContain('Parsi Scope under Section 58');
    expect(res.statuteCitation).not.toContain('Sections 57');
  });

  it('47. Stage 1 Negative: Spurious 10-year residency claim rejected under Section 1(4)', () => {
    const res = classifyGoaJurisdiction({
      pob: 'Bhopal, Madhya Pradesh',
      addressState: 'Goa',
      tenYearResidencyClaim: true
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED);
    expect(res.blockers[0]).toContain('ERR_INVALID_JURISDICTION_CRITERIA');
  });

  it('48. Stage 1 Negative: Marriage of non-Goan to Goan rejected as Section 1(4) qualification route', () => {
    const res = classifyGoaJurisdiction({
      pob: 'Lucknow, Uttar Pradesh',
      marriageToGoanClaim: true
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED);
    expect(res.blockers[0]).toContain('ERR_INVALID_JURISDICTION_CRITERIA');
  });

  it('49. Stage 1 Proviso: Residence in Goa due to Indian government service excluded from permanent residence', () => {
    const res = classifyGoaJurisdiction({
      pob: 'Margao, Goa',
      parentsPortugueseRegime: false,
      parentsRestOfIndiaGoverned: true,
      parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
      isGovernmentPosting: true,
      postingEvidence: samplePostingEvidence,
      statutoryElectionClauseD: true
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_NOT_APPLICABLE);
    expect(res.statutoryClause).toContain('Posting Excluded from Permanent Residence');
  });

  it('50. Stage 1: Section 1(4)(c) disputed deadline or unverified opt-out declaration triggers GOA_STATUS_UNDETERMINED', () => {
    const res = classifyGoaJurisdiction({
      pob: 'Mumbai, Maharashtra',
      dob: '1970-01-01',
      parentsPortugueseRegime: true,
      clauseBEvidence: sampleClauseBEvidence,
      statutoryOptOutClauseC: true,
      optOutBeforeSpecialNotary: true,
      optOutDeclarationDate: '2020-01-01',
      clauseCEvidence: {
        ...sampleClauseCEvidence,
        registrationDate: '2020-01-01' // Statutory 3-year deadline long expired!
      }
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED);
    expect(res.blockers[0]).toContain('ERR_GOA_JURISDICTION_UNCONFIRMED');
  });

  it('51. Stage 1: Section 1(4)(e) foreign parents failing Citizenship Act requirements rejected', () => {
    const res = classifyGoaJurisdiction({
      pob: 'Panaji, Goa',
      foreignParentsCitizenshipFulfilled: false
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED);
  });

  it('52. Stage 1 Goa Supremacy: Muslim governed by Goa Act remains under Goa Act, preserves religion Muslim and isMuslim true', () => {
    const willData = {
      personal: {
        fullName: 'Ibrahim Khan',
        pob: 'Margao, Goa',
        parentsPortugueseRegime: true,
        clauseBEvidence: sampleClauseBEvidence,
        religion: 'Muslim',
        sect: 'Sunni'
      }
    };
    const res = resolvePersonalLawRegime(willData);
    expect(res.regime).toBe(PERSONAL_LAW_REGIMES.GOA_UCC);
    expect(res.isGoa).toBe(true);
    expect(res.religion).toBe('Muslim');
    expect(res.isMuslim).toBe(true);
    expect(res.shariatApplicable).toBe(false);
    expect(res.precedentAuthority).toContain('Jose Paulo Coutinho');
    expect(res.precedentAuthority).toContain('Ashabi Khan');
  });

  it('53. Stage 1 ISA Section 57(c) Residual Check: Negative test proving a Will covered by 57(a) or (b) is NOT reclassified under (c)', () => {
    const willDataPresidencyExecution = {
      personal: {
        fullName: 'Kolkata Testator',
        pob: 'Kolkata, West Bengal',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: 'Hindu',
        willExecutionPlace: 'Kolkata, West Bengal',
        historicalTerritoryCode: HISTORICAL_PRESIDENCY_CODES.BENGAL_LIEUTENANT_GOVERNOR,
        historicalTerritoryEvidence: sampleHistoricalTerritoryEvidence,
        willExecutionDate: '2026-05-10'
      },
      assets: []
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
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: 'Hindu',
        willExecutionPlace: 'Patna, Bihar',
        willExecutionDate: '2026-05-10'
      },
      assets: [
        {
          id: 1,
          type: "Residential Flat",
          immovableProperty: true,
          location: "Mumbai, Maharashtra",
          historicalTerritoryCode: HISTORICAL_PRESIDENCY_CODES.BOMBAY_OOCJ,
          historicalTerritoryEvidence: sampleHistoricalTerritoryEvidence,
          value: 10000000
        }
      ]
    };
    const resB = resolvePersonalLawRegime(willDataPresidencyProperty);
    expect(resB.section57Clause).toContain('Section 57(b)');
    expect(resB.section57Clause).not.toContain('Section 57(c)');
  });

  it('54. Stage 1 Positive Section 57(a), (b), (c) Regression Tests', () => {
    const willA = resolvePersonalLawRegime({
      personal: {
        fullName: 'Chennai Testator',
        pob: 'Chennai, Tamil Nadu',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: 'Hindu',
        willExecutionPlace: 'Chennai',
        historicalTerritoryCode: HISTORICAL_PRESIDENCY_CODES.MADRAS_OOCJ,
        historicalTerritoryEvidence: sampleHistoricalTerritoryEvidence,
        willExecutionDate: '2026-01-10'
      },
      assets: []
    });
    expect(willA.section57Clause).toContain('Section 57(a)');
    expect(willA.scheduleIIIApplicable).toBe(true);

    const willB = resolvePersonalLawRegime({
      personal: {
        fullName: 'Pune Testator',
        pob: 'Pune, Maharashtra',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: 'Hindu',
        willExecutionPlace: 'Pune',
        willExecutionDate: '2026-01-10'
      },
      assets: [
        {
          id: 1,
          type: "Commercial Shop",
          immovableProperty: true,
          location: "Mumbai",
          historicalTerritoryCode: HISTORICAL_PRESIDENCY_CODES.BOMBAY_OOCJ,
          historicalTerritoryEvidence: sampleHistoricalTerritoryEvidence,
          value: 8000000
        }
      ]
    });
    expect(willB.section57Clause).toContain('Section 57(b)');
    expect(willB.scheduleIIIApplicable).toBe(true);

    const willC = resolvePersonalLawRegime({
      personal: {
        fullName: 'Nagpur Testator',
        pob: 'Nagpur, Maharashtra',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: 'Hindu',
        willExecutionPlace: 'Nagpur',
        immovablePropertyLocation: 'Nagpur',
        willExecutionDate: '2026-01-15'
      },
      assets: [
        { id: "a1", type: "Residential House", desc: "Ancestral House in Nagpur", value: 1000000, immovablePropertyLocation: "Nagpur" }
      ]
    });
    expect(willC.section57Clause).toContain('Section 57(c)');
    expect(willC.scheduleIIIApplicable).toBe(true);
  });

  it('55. Stage 1: Hindu Succession Act Section 30 coparcenary testamentary power recognized', () => {
    const res = resolvePersonalLawRegime({
      personal: {
        fullName: 'Venkatesh Rao',
        pob: 'Bengaluru, Karnataka',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: 'Hindu',
        willExecutionPlace: 'Bengaluru',
        willExecutionDate: '2026-02-01'
      },
      assets: [
        { id: "a1", type: "Bank Account", desc: "Fixed Deposit at SBI Bengaluru", value: 500000 }
      ]
    });
    expect(res.regime).toBe(PERSONAL_LAW_REGIMES.HINDU);
    expect(res.coparcenaryNotice).toContain('Section 30 of the Hindu Succession Act, 1956');
  });

  it('56. Stage 1: Shariat Act Section 3 verified declaration applies Section 2 rules to wills and legacies', () => {
    const willData = {
      personal: {
        fullName: 'Zafar Ahmed',
        pob: 'Lucknow, Uttar Pradesh',
        dob: '1980-01-01',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: 'Muslim',
        sect: 'Sunni',
        contractCompetent: true,
        shariatDeclarationRecord: sampleShariatDeclarationRecord
      },
      assets: [
        { id: "a1", type: "Residential House", desc: "House in Lucknow", value: 2000000 }
      ]
    };
    const res = resolvePersonalLawRegime(willData);
    expect(res.regime).toBe(PERSONAL_LAW_REGIMES.MUSLIM_SUNNI);
    expect(res.shariatSec3Verified).toBe(true);
    expect(res.statuteCitation).toContain('Section 3 Declaration Verified');
  });

  it('57. Stage 1 Negative: Missing Section 3 declaration does not activate Shariat calculation; emits ERR_MUSLIM_TESTAMENTARY_REGIME_UNCONFIRMED and LEGAL_REVIEW_REQUIRED', () => {
    const willData = {
      personal: {
        fullName: 'Mohammed Ali',
        pob: 'Hyderabad, Telangana',
        dob: '1980-01-01',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: 'Muslim',
        sect: 'Sunni'
      },
      assets: [
        { id: "a1", type: "Residential House", desc: "House in Hyderabad", value: 2500000 }
      ]
    };
    const res = resolvePersonalLawRegime(willData);
    expect(res.regime).toBe(PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED);
    expect(res.blockers[0]).toContain('ERR_MUSLIM_TESTAMENTARY_REGIME_UNCONFIRMED');

    const audit = runPreFlightLegalBlockerAudit(willData);
    expect(audit.isExecutionReady).toBe(false);
    expect(audit.blockers.some(b => b.code === 'ERR_MUSLIM_TESTAMENTARY_REGIME_UNCONFIRMED')).toBe(true);
  });

  it('58. Stage 1 Forensic Negative: Naked Boolean assertions for Section 1(4)(a), (b), (g) strictly fail with ERR_GOA_EVIDENCE_UNVERIFIED and GOA_STATUS_UNDETERMINED', () => {
    const resClauseA = classifyGoaJurisdiction({
      pob: 'Margao, Goa',
      pre1961PortugueseRegime: true
    });
    expect(resClauseA.status).toBe(JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED);
    expect(resClauseA.blockers[0]).toContain('ERR_GOA_EVIDENCE_UNVERIFIED');

    const resClauseB = classifyGoaJurisdiction({
      pob: 'Panaji, Goa',
      parentsPortugueseRegime: true
    });
    expect(resClauseB.status).toBe(JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED);
    expect(resClauseB.blockers[0]).toContain('ERR_GOA_EVIDENCE_UNVERIFIED');

    const resClauseG = classifyGoaJurisdiction({
      pob: 'Margao, Goa',
      isAdopted: true,
      adoptiveParentsGoanRegime: true
    });
    expect(resClauseG.status).toBe(JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED);
    expect(resClauseG.blockers[0]).toContain('ERR_GOA_EVIDENCE_UNVERIFIED');
  });

  it('59. Stage 1 Shariat Section 3 Negatives: Naked Boolean, unverified record, incompetent declarant, and refused appeal strictly fail', () => {
    const validSampleAssets = [
      { id: "a1", type: "Residential House", desc: "House in Lucknow", value: 2000000 }
    ];

    const resNaked = resolvePersonalLawRegime({
      personal: {
        dob: '1980-01-01',
        pob: 'Lucknow, UP',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: 'Muslim',
        sect: 'Sunni',
        shariatSec3Declaration: true
      },
      assets: validSampleAssets
    });
    expect(resNaked.regime).toBe(PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED);
    expect(resNaked.blockers[0]).toContain('ERR_SHARIAT_SEC3_DEFECTIVE');

    const unverifiedRec = { ...sampleShariatDeclarationRecord, verificationStatus: 'PENDING_DOCUMENTATION' };
    const resUnverified = resolvePersonalLawRegime({
      personal: {
        dob: '1980-01-01',
        pob: 'Lucknow, UP',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: 'Muslim',
        sect: 'Sunni',
        shariatDeclarationRecord: unverifiedRec
      },
      assets: validSampleAssets
    });
    expect(resUnverified.regime).toBe(PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED);
    expect(resUnverified.blockers[0]).toContain('ERR_MUSLIM_TESTAMENTARY_REGIME_UNCONFIRMED');

    const incompetentRec = { ...sampleShariatDeclarationRecord, competenceVerified: false };
    const resIncompetent = resolvePersonalLawRegime({
      personal: {
        dob: '1980-01-01',
        pob: 'Lucknow, UP',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: 'Muslim',
        sect: 'Sunni',
        contractCompetent: false,
        shariatDeclarationRecord: incompetentRec
      },
      assets: validSampleAssets
    });
    expect(resIncompetent.regime).toBe(PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED);
    expect(resIncompetent.blockers[0]).toContain('ERR_SHARIAT_SEC3_INCOMPETENT');

    const refusedRec = { ...sampleShariatDeclarationRecord, appealFiled: true, appealStatus: 'REFUSED' };
    const resRefused = resolvePersonalLawRegime({
      personal: {
        dob: '1980-01-01',
        pob: 'Lucknow, UP',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: 'Muslim',
        sect: 'Sunni',
        shariatDeclarationRecord: refusedRec
      },
      assets: validSampleAssets
    });
    expect(resRefused.regime).toBe(PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED);
    expect(resRefused.blockers[0]).toContain('ERR_SHARIAT_SEC3_APPEAL_REFUSED');
  });

  it('60. Stage 1 Shariat Section 2 Asset-Level Check: Agricultural land is isolated and halts automated Will distribution with ERR_AGRICULTURAL_LAND_SHARIAT_EXCLUSION', () => {
    const willWithAgriLand = {
      personal: {
        fullName: 'Mohammed Khan',
        pob: 'Lucknow, UP',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        dob: '1980-01-01',
        religion: 'Muslim',
        sect: 'Sunni',
        shariatDeclarationRecord: sampleShariatDeclarationRecord
      },
      assets: [
        { id: 'a1', type: 'Residential Flat', value: 5000000 },
        { id: 'a2', type: 'Agricultural Land', desc: 'Ancestral Farm in Barabanki', value: 2500000, isAgriculturalLand: true }
      ]
    };
    const res = resolvePersonalLawRegime(willWithAgriLand);
    expect(res.regime).toBe(PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED);
    expect(res.agriculturalAssets.length).toBe(1);
    expect(res.blockers[0]).toContain('ERR_AGRICULTURAL_LAND_SHARIAT_EXCLUSION');

    const audit = runPreFlightLegalBlockerAudit(willWithAgriLand);
    expect(audit.isExecutionReady).toBe(false);
    expect(audit.blockers.some(b => b.code === 'ERR_AGRICULTURAL_LAND_SHARIAT_EXCLUSION')).toBe(true);
  });

  it('61. Stage 1 Muslim Sect Check: Missing or unrecognized school of jurisprudence strictly returns LEGAL_REVIEW_REQUIRED and ERR_MUSLIM_SCHOOL_UNVERIFIED (never defaults to Sunni)', () => {
    const resMissingSect = resolvePersonalLawRegime({
      personal: {
        fullName: 'Zafar',
        pob: 'Lucknow, UP',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        dob: '1980-01-01',
        religion: 'Muslim',
        shariatDeclarationRecord: sampleShariatDeclarationRecord
      },
      assets: []
    });
    expect(resMissingSect.regime).toBe(PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED);
    expect(resMissingSect.blockers[0]).toContain('ERR_MUSLIM_SCHOOL_UNVERIFIED');

    const resUnknownSect = resolvePersonalLawRegime({
      personal: {
        fullName: 'Zafar',
        pob: 'Lucknow, UP',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        dob: '1980-01-01',
        religion: 'Muslim',
        sect: 'Eclectic Non-Denominational',
        shariatDeclarationRecord: sampleShariatDeclarationRecord
      },
      assets: []
    });
    expect(resUnknownSect.regime).toBe(PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED);
    expect(resUnknownSect.blockers[0]).toContain('ERR_MUSLIM_SCHOOL_UNVERIFIED');
  });

  it('62. Stage 1 Hindu Section 57 Date Boundaries: Tests for missing execution date, invalid date, pre-1870 execution, exactly 1870-09-01, pre-1927 non-presidency, and exactly 1927-01-01', () => {
    const resMissingDate = resolvePersonalLawRegime({
      personal: {
        fullName: 'Ramesh',
        pob: 'Varanasi, UP',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: 'Hindu',
        willExecutionPlace: 'Nagpur'
      },
      assets: []
    });
    expect(resMissingDate.regime).toBe(PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED);
    expect(resMissingDate.blockers[0]).toContain('ERR_WILL_EXECUTION_DATE_REQUIRED');

    const resInvalidDate = resolvePersonalLawRegime({
      personal: {
        fullName: 'Ramesh',
        pob: 'Varanasi, UP',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: 'Hindu',
        willExecutionDate: 'NOT-A-DATE'
      },
      assets: []
    });
    expect(resInvalidDate.regime).toBe(PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED);
    expect(resInvalidDate.blockers[0]).toContain('ERR_INVALID_EXECUTION_DATE');

    const resPre1870 = resolvePersonalLawRegime({
      personal: {
        fullName: 'Ramesh',
        pob: 'Varanasi, UP',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: 'Hindu',
        willExecutionPlace: 'Calcutta',
        willExecutionDate: '1869-05-10'
      },
      assets: []
    });
    expect(resPre1870.regime).toBe(PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED);
    expect(resPre1870.blockers[0]).toContain('ERR_PRE_1870_WILL_INELIGIBLE');

    const resExact1870 = resolvePersonalLawRegime({
      personal: {
        fullName: 'Ramesh',
        pob: 'Varanasi, UP',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: 'Hindu',
        willExecutionPlace: 'Calcutta',
        historicalTerritoryCode: HISTORICAL_PRESIDENCY_CODES.BENGAL_LIEUTENANT_GOVERNOR,
        historicalTerritoryEvidence: sampleHistoricalTerritoryEvidence,
        willExecutionDate: '1870-09-01'
      },
      assets: []
    });
    expect(resExact1870.regime).toBe(PERSONAL_LAW_REGIMES.HINDU);
    expect(resExact1870.section57Clause).toContain('Section 57(a)');

    const resPre1927 = resolvePersonalLawRegime({
      personal: {
        fullName: 'Ramesh',
        pob: 'Varanasi, UP',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: 'Hindu',
        willExecutionPlace: 'Nagpur',
        immovablePropertyLocation: 'Nagpur',
        willExecutionDate: '1925-10-15'
      },
      assets: [
        { id: "a1", type: "Residential House", desc: "House in Nagpur", value: 100000, immovablePropertyLocation: "Nagpur" }
      ]
    });
    expect(resPre1927.regime).toBe(PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED);
    expect(resPre1927.blockers[0]).toContain('ERR_PRE_1927_NON_PRESIDENCY_WILL');

    const resExact1927 = resolvePersonalLawRegime({
      personal: {
        fullName: 'Ramesh',
        pob: 'Varanasi, UP',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: 'Hindu',
        willExecutionPlace: 'Nagpur',
        immovablePropertyLocation: 'Nagpur',
        willExecutionDate: '1927-01-01'
      },
      assets: [
        { id: "a1", type: "Residential House", desc: "House in Nagpur", value: 100000, immovablePropertyLocation: "Nagpur" }
      ]
    });
    expect(resExact1927.regime).toBe(PERSONAL_LAW_REGIMES.HINDU);
    expect(resExact1927.section57Clause).toContain('Section 57(c)');
  });

  it('63. Stage 1 Hindu Section 57 Territorial Boundary Ambiguity: Uncertain historical boundary returns LEGAL_REVIEW_REQUIRED with ERR_TERRITORIAL_JURISDICTION_AMBIGUOUS', () => {
    const resAmbiguousTerritory = resolvePersonalLawRegime({
      personal: {
        fullName: 'Ramesh',
        pob: 'Varanasi, UP',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: 'Hindu',
        willExecutionPlace: 'Presidency Outskirts / Greater Bengal Frontier',
        willExecutionDate: '2026-03-01',
        isTerritoryAmbiguous: true
      },
      assets: []
    });
    expect(resAmbiguousTerritory.regime).toBe(PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED);
    expect(resAmbiguousTerritory.blockers[0]).toContain('ERR_TERRITORIAL_JURISDICTION_AMBIGUOUS');
  });

  // ── REVISION 7 FORENSIC AUTHENTICATION, SMA 21/21A, & FAIL-CLOSED JURISDICTION TESTS ──

  it('64. Stage 1 Forensic Evidence Integrity: Reject empty-file SHA-256 and all-zeros hash with ERR_EMPTY_OR_INVALID_FILE_HASH', () => {
    const emptyHashRecord = {
      ...sampleClauseAEvidence,
      documentHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" // Standard empty file hash
    };
    const emptyRes = validateJurisdictionEvidence(emptyHashRecord, [JURISDICTION_DOCUMENT_TYPES.HISTORICAL_PORTUGUESE_CIVIL_RECORD]);
    expect(emptyRes.isValid).toBe(false);
    expect(emptyRes.blockerCode).toBe("ERR_EMPTY_OR_INVALID_FILE_HASH");

    const allZerosRecord = {
      ...sampleClauseAEvidence,
      documentHash: "0000000000000000000000000000000000000000000000000000000000000000"
    };
    const zerosRes = validateJurisdictionEvidence(allZerosRecord, [JURISDICTION_DOCUMENT_TYPES.HISTORICAL_PORTUGUESE_CIVIL_RECORD]);
    expect(zerosRes.isValid).toBe(false);
    expect(zerosRes.blockerCode).toBe("ERR_EMPTY_OR_INVALID_FILE_HASH");

    const malformedRecord = {
      ...sampleClauseAEvidence,
      documentHash: "not-a-valid-sha256-hash"
    };
    const malformedRes = validateJurisdictionEvidence(malformedRecord, [JURISDICTION_DOCUMENT_TYPES.HISTORICAL_PORTUGUESE_CIVIL_RECORD]);
    expect(malformedRes.isValid).toBe(false);
    expect(malformedRes.blockerCode).toBe("ERR_EMPTY_OR_INVALID_FILE_HASH");
  });

  it('65. Stage 1 Forensic Reviewer Validation: Reject arbitrary verifier text without authorized role or Bar enrollment with ERR_GOA_EVIDENCE_UNVERIFIED', () => {
    const unauthorizedRoleRecord = {
      ...sampleClauseAEvidence,
      reviewerRole: "PARALEGAL_ASSISTANT"
    };
    const resRole = validateJurisdictionEvidence(unauthorizedRoleRecord, [JURISDICTION_DOCUMENT_TYPES.HISTORICAL_PORTUGUESE_CIVIL_RECORD]);
    expect(resRole.isValid).toBe(false);
    expect(resRole.blockerCode).toBe("ERR_GOA_EVIDENCE_UNVERIFIED");
    expect(resRole.reason).toContain("Unauthorized or missing reviewer role");

    const missingEnrollmentRecord = {
      ...sampleClauseAEvidence,
      enrollmentNumber: ""
    };
    const resEnroll = validateJurisdictionEvidence(missingEnrollmentRecord, [JURISDICTION_DOCUMENT_TYPES.HISTORICAL_PORTUGUESE_CIVIL_RECORD]);
    expect(resEnroll.isValid).toBe(false);
    expect(resEnroll.blockerCode).toBe("ERR_GOA_EVIDENCE_UNVERIFIED");
    expect(resEnroll.reason).toContain("Missing reviewer professional credentials");
  });

  it('66. Stage 1 Forensic Party Mismatch: Strict context check rejects evidence record not matching testator', () => {
    const mismatchRecord = {
      ...sampleClauseAEvidence,
      verifiedParties: "Testator António Fernandes"
    };
    const resMismatch = validateJurisdictionEvidence(
      mismatchRecord,
      [JURISDICTION_DOCUMENT_TYPES.HISTORICAL_PORTUGUESE_CIVIL_RECORD],
      { testatorName: "Ramesh Kumar Sharma", strictTestatorMatch: true }
    );
    expect(resMismatch.isValid).toBe(false);
    expect(resMismatch.blockerCode).toBe("ERR_PARTY_MISMATCH");
    expect(resMismatch.reason).toContain("does not match testator");
  });

  it('67. Stage 1 Negative Goa Jurisdiction Bypass: Bare parentsPortugueseRegime: false without verified rest-of-India evidence returns GOA_STATUS_UNDETERMINED', () => {
    const res = classifyGoaJurisdiction({
      pob: "Margao, Goa",
      parentsPortugueseRegime: false,
      parentsRestOfIndiaGoverned: true
      // Notice: parentsRestOfIndiaEvidence is omitted!
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED);
    expect(res.blockers[0]).toContain("ERR_GOA_JURISDICTION_UNCONFIRMED");
    expect(res.blockers[0]).toContain("negative subjection to the Portuguese Civil Code cannot be established by a self-entered Boolean");
    expect(res.canGenerateWill).toBe(false);
  });

  it('68. Stage 1 Section 1(4)(d) Posting Proviso: Unverified posting orders return GOA_STATUS_UNDETERMINED; verified posting evidence returns GOA_NOT_APPLICABLE', () => {
    // Unverified posting orders
    const resUnverified = classifyGoaJurisdiction({
      pob: "Margao, Goa",
      parentsPortugueseRegime: false,
      parentsRestOfIndiaGoverned: true,
      parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
      isGovernmentPosting: true,
      postingEvidence: null // Missing posting orders!
    });
    expect(resUnverified.status).toBe(JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED);
    expect(resUnverified.blockers[0]).toContain("ERR_GOA_EVIDENCE_UNVERIFIED");

    // Verified posting orders
    const resVerified = classifyGoaJurisdiction({
      pob: "Margao, Goa",
      parentsPortugueseRegime: false,
      parentsRestOfIndiaGoverned: true,
      parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
      isGovernmentPosting: true,
      postingEvidence: samplePostingEvidence
    });
    expect(resVerified.status).toBe(JURISDICTION_STATUS.GOA_NOT_APPLICABLE);
    expect(resVerified.statutoryClause).toContain("Posting Excluded from Permanent Residence");
    expect(resVerified.canGenerateWill).toBe(true);
  });

  it('69. Stage 1 Section 1(4)(g) Adoption Separated Evidence: Registered adoption deed without separate verified proof of adoptive parents status returns GOA_STATUS_UNDETERMINED', () => {
    // Adoption deed verified, but adoptive parents status unverified (bare boolean attempt)
    const resUnverifiedParents = classifyGoaJurisdiction({
      pob: "Bangalore, Karnataka",
      isAdopted: true,
      clauseGEvidence: sampleClauseGEvidence,
      adoptiveParentsGoanRegime: true // Bare boolean attempt!
    });
    expect(resUnverifiedParents.status).toBe(JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED);
    expect(resUnverifiedParents.blockers[0]).toContain("ERR_GOA_EVIDENCE_UNVERIFIED");
    expect(resUnverifiedParents.blockers[0]).toContain("Reliance on naked Boolean assertions is prohibited");

    // Verified adoptive parents under rest-of-India law
    const resRoiAdoptive = classifyGoaJurisdiction({
      pob: "Bangalore, Karnataka",
      isAdopted: true,
      clauseGEvidence: sampleClauseGEvidence,
      adoptiveParentsEvidence: sampleAdoptiveParentsRoiEvidence
    });
    expect(resRoiAdoptive.status).toBe(JURISDICTION_STATUS.GOA_NOT_APPLICABLE);
    expect(resRoiAdoptive.statutoryClause).toContain("Indian Succession Act (Adoption Under Rest-of-India Law)");
    expect(resRoiAdoptive.canGenerateWill).toBe(true);

    // Verified adoptive parents under Goa Civil Code
    const resGoanAdoptive = classifyGoaJurisdiction({
      pob: "Bangalore, Karnataka",
      isAdopted: true,
      clauseGEvidence: sampleClauseGEvidence,
      adoptiveParentsEvidence: sampleAdoptiveParentsGoanEvidence
    });
    expect(resGoanAdoptive.status).toBe(JURISDICTION_STATUS.GOA_APPLICABLE);
    expect(resGoanAdoptive.statutoryClause).toBe(GOA_SECTION_1_4_CLAUSES.CLAUSE_G);
    expect(resGoanAdoptive.canGenerateWill).toBe(true);
  });

  it('70. Stage 1 Section 1(4)(c) Born Outside Goa with Goa Property/Lineage: Unrecorded parental status returns GOA_STATUS_UNDETERMINED', () => {
    const res = classifyGoaJurisdiction({
      pob: "New Delhi",
      hasGoaProperty: true,
      religion: "Hindu"
      // parentsPortugueseRegime is unrecorded!
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED);
    expect(res.blockers[0]).toContain("ERR_GOA_JURISDICTION_UNCONFIRMED");
    expect(res.statutoryClause).toContain("Section 1(4)(c) Parental Origin Inquiry");
  });

  it('71. Stage 1 Shariat Section 3 Declaration: Unrecognized authority returns ERR_SHARIAT_SEC3_DEFECTIVE', () => {
    const invalidAuthDecl = {
      ...sampleShariatDeclarationRecord,
      prescribedAuthority: "Municipal Councillor, Ward 4"
    };
    const res = validateShariatDeclarationRecord(invalidAuthDecl, { age: 35, contractCompetent: true });
    expect(res.isValid).toBe(false);
    expect(res.blockerCode).toBe("ERR_SHARIAT_SEC3_DEFECTIVE");
    expect(res.reason).toContain("not a recognized Section 3 authority");
  });

  it('72. Stage 1 Shariat Section 3 Declaration: Form Verification requires FORM_A_SHARIAT_SECTION_3', () => {
    const invalidFormDecl = {
      ...sampleShariatDeclarationRecord,
      prescribedForm: false,
      formType: "PLAIN_PAPER_AFFIDAVIT"
    };
    const res = validateShariatDeclarationRecord(invalidFormDecl, { age: 35, contractCompetent: true });
    expect(res.isValid).toBe(false);
    expect(res.blockerCode).toBe("ERR_SHARIAT_SEC3_DEFECTIVE");
    expect(res.reason).toContain("prescribed statutory form");
  });

  it('73. Stage 1 Shariat Section 3 Declaration: Minor or lacking Contract Act Section 11 competence facts returns ERR_SHARIAT_SEC3_INCOMPETENT', () => {
    const minorDecl = {
      ...sampleShariatDeclarationRecord,
      ageConfirmed18Plus: false,
      isAdult: false
    };
    const res = validateShariatDeclarationRecord(minorDecl, { age: 16, contractCompetent: false });
    expect(res.isValid).toBe(false);
    expect(res.blockerCode).toBe("ERR_SHARIAT_SEC3_INCOMPETENT");
    expect(res.reason).toContain("Section 11 of the Indian Contract Act, 1872");
  });

  it('74. Stage 1 Shariat Section 3 Declaration: Goa resident declarant rejected because Goa succession is a special and local law', () => {
    const goaDecl = {
      ...sampleShariatDeclarationRecord,
      residenceTerritory: "Goa"
    };
    const res = validateShariatDeclarationRecord(goaDecl, { age: 40, contractCompetent: true });
    expect(res.isValid).toBe(false);
    expect(res.blockerCode).toBe("ERR_SHARIAT_SEC3_RESIDENCE_UNVERIFIED");
    expect(res.reason).toContain("Jose Paulo Coutinho");
  });

  it('75. Stage 1 Shariat Section 2 Expanded Agricultural Asset Detection: Detects keywords and triggers ERR_AGRICULTURAL_LAND_SHARIAT_EXCLUSION', () => {
    const willWithPaddyAndOrchard = {
      personal: {
        fullName: "Mohammed Khan",
        pob: "Lucknow, UP",
        dob: "1980-01-01",
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: "Muslim",
        sect: "Sunni",
        shariatDeclarationRecord: sampleShariatDeclarationRecord
      },
      assets: [
        { id: "a1", type: "Residential House", value: 3000000 },
        { id: "a2", type: "Land Parcel", desc: "Paddy field and cashew plantation in Khasra No 102", value: 2000000 }
      ]
    };
    const res = resolvePersonalLawRegime(willWithPaddyAndOrchard);
    expect(res.regime).toBe(PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED);
    expect(res.agriculturalAssets.length).toBe(1);
    expect(res.blockers[0]).toContain("ERR_AGRICULTURAL_LAND_SHARIAT_EXCLUSION");

    const audit = runPreFlightLegalBlockerAudit(willWithPaddyAndOrchard);
    expect(audit.isExecutionReady).toBe(false);
    expect(audit.blockers.some(b => b.code === "ERR_AGRICULTURAL_LAND_SHARIAT_EXCLUSION")).toBe(true);
  });

  it('76. Stage 1 Special Marriage Act (SMA) Section 21: Christian marrying under SMA retains religion and is routed to ISA Part VI', () => {
    const willData = {
      personal: {
        fullName: "David DSilva",
        pob: "Mumbai, Maharashtra",
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: "Christian",
        marriageRegime: "SPECIAL_MARRIAGE_ACT_1954",
        marriageCertificateEvidence: sampleSpecialMarriageCertificateEvidence
      }
    };
    const res = resolvePersonalLawRegime(willData);
    expect(res.regime).toBe(PERSONAL_LAW_REGIMES.CHRISTIAN_CIVIL);
    expect(res.isChristian).toBe(true);
    expect(res.statuteCitation).toContain("Special Marriage Act, 1954 (Section 21)");
  });

  it('77. Stage 1 Special Marriage Act (SMA) Section 21: Muslim marrying under SMA retains isMuslim: true and is routed to ISA Part VI without altering religious identity', () => {
    const willData = {
      personal: {
        fullName: "Faiz Ahmed",
        pob: "Delhi",
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: "Muslim",
        spouseReligion: "Hindu",
        marriageRegime: "SPECIAL_MARRIAGE_ACT_1954",
        marriageCertificateEvidence: sampleSpecialMarriageCertificateEvidence
      }
    };
    const res = resolvePersonalLawRegime(willData);
    expect(res.regime).toBe(PERSONAL_LAW_REGIMES.CHRISTIAN_CIVIL);
    expect(res.isMuslim).toBe(true);
    expect(res.isChristian).toBe(false); // CRITICAL: NEVER FORCES isChristian: true
    expect(res.religion).toBe("Muslim");
    expect(res.statuteCitation).toContain("Special Marriage Act, 1954 (Section 21)");
  });

  it('78. Stage 1 Special Marriage Act (SMA) Section 21: Parsi marrying under SMA retains isParsi: true and is routed to ISA Part VI', () => {
    const willData = {
      personal: {
        fullName: "Rustom Wadia",
        pob: "Mumbai, Maharashtra",
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: "Parsi",
        spouseReligion: "Christian",
        marriageRegime: "SPECIAL_MARRIAGE_ACT_1954",
        marriageCertificateEvidence: sampleSpecialMarriageCertificateEvidence
      }
    };
    const res = resolvePersonalLawRegime(willData);
    expect(res.regime).toBe(PERSONAL_LAW_REGIMES.CHRISTIAN_CIVIL);
    expect(res.isParsi).toBe(true);
    expect(res.isChristian).toBe(false);
    expect(res.religion).toBe("Parsi");
    expect(res.statuteCitation).toContain("Special Marriage Act, 1954 (Section 21)");
  });

  it('79. Stage 1 Special Marriage Act (SMA) Section 21A: Both spouses Hindu/Buddhist/Sikh/Jain route to Hindu Succession Act & ISA Section 57 without Christian classification', () => {
    const willData = {
      personal: {
        fullName: "Arjun Verma",
        pob: "Bengaluru, Karnataka",
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: "Hindu",
        spouseReligion: "Hindu",
        marriageRegime: "SPECIAL_MARRIAGE_ACT_1954",
        marriageCertificateEvidence: sampleSpecialMarriageCertificateEvidence,
        willExecutionDate: "2026-04-15",
        willExecutionPlace: "Bengaluru"
      },
      assets: [
        { id: "a1", type: "Bank Account", desc: "Fixed Deposit at SBI Bengaluru", value: 500000 }
      ]
    };
    const res = resolvePersonalLawRegime(willData);
    expect(res.regime).toBe(PERSONAL_LAW_REGIMES.HINDU);
    expect(res.isHindu).toBe(true);
    expect(res.isChristian).toBe(false);
    expect(res.reasons.some(r => r.includes("Section 21A"))).toBe(true);
    expect(res.statuteCitation).toContain("Hindu Succession Act, 1956 (Section 30)");
  });

  it('80. Stage 1 Special Marriage Act (SMA) Blocker: Missing marriage certificate returns ERR_SMA_MARRIAGE_CERTIFICATE_REQUIRED and preventsGeneration: true', () => {
    const willData = {
      personal: {
        fullName: "Sameer Khan",
        pob: "Pune, Maharashtra",
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: "Muslim",
        marriageRegime: "SPECIAL_MARRIAGE_ACT_1954",
        marriageCertificateEvidence: null // Missing!
      }
    };
    const res = resolvePersonalLawRegime(willData);
    expect(res.regime).toBe(PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED);
    expect(res.blockers[0]).toContain("ERR_SMA_MARRIAGE_CERTIFICATE_REQUIRED");

    const audit = runPreFlightLegalBlockerAudit(willData);
    expect(audit.isExecutionReady).toBe(false);
    expect(audit.blockers.some(b => b.code === "ERR_SMA_MARRIAGE_CERTIFICATE_REQUIRED")).toBe(true);
  });

  it('81. Stage 1 Hindu Section 57 Historical Boundaries: Bombay OOCJ, Madras OOCJ, and Bengal Lieutenant-Governor codes routed to Section 57(a)', () => {
    const willBombayOOCJ = resolvePersonalLawRegime({
      personal: {
        fullName: "Narayan Rao",
        pob: "Bombay",
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: "Hindu",
        willExecutionPlace: "Bombay",
        historicalTerritoryCode: HISTORICAL_PRESIDENCY_CODES.BOMBAY_OOCJ,
        historicalTerritoryEvidence: sampleHistoricalTerritoryEvidence,
        willExecutionDate: "2026-02-15"
      },
      assets: []
    });
    expect(willBombayOOCJ.section57Clause).toContain("Section 57(a)");
    expect(willBombayOOCJ.scheduleIIIApplicable).toBe(true);

    const willMadrasOOCJ = resolvePersonalLawRegime({
      personal: {
        fullName: "Subramanian Iyer",
        pob: "Madras",
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: "Hindu",
        willExecutionPlace: "Madras",
        historicalTerritoryCode: HISTORICAL_PRESIDENCY_CODES.MADRAS_OOCJ,
        historicalTerritoryEvidence: sampleHistoricalTerritoryEvidence,
        willExecutionDate: "2026-02-15"
      },
      assets: []
    });
    expect(willMadrasOOCJ.section57Clause).toContain("Section 57(a)");
    expect(willMadrasOOCJ.scheduleIIIApplicable).toBe(true);

    const willBengalLtGov = resolvePersonalLawRegime({
      personal: {
        fullName: "Debabrata Banerjee",
        pob: "Calcutta",
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: "Hindu",
        willExecutionPlace: "Calcutta",
        historicalTerritoryCode: HISTORICAL_PRESIDENCY_CODES.BENGAL_LIEUTENANT_GOVERNOR,
        historicalTerritoryEvidence: sampleHistoricalTerritoryEvidence,
        willExecutionDate: "2026-02-15"
      },
      assets: []
    });
    expect(willBengalLtGov.section57Clause).toContain("Section 57(a)");
    expect(willBengalLtGov.scheduleIIIApplicable).toBe(true);
  });

  it('82. Stage 1 Hindu Section 57(b) Asset-Level Check: Evaluates each immovable asset individually; property in Bombay OOCJ triggers Section 57(b)', () => {
    const willData = {
      personal: {
        fullName: "Harish Chandra",
        pob: "Varanasi, UP",
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: "Hindu",
        willExecutionPlace: "Varanasi, UP",
        willExecutionDate: "2026-03-10"
      },
      assets: [
        { id: "a1", type: "Movable Shares", value: 1000000 },
        {
          id: "a2",
          type: "Real Estate",
          desc: "Commercial Office in Fort, Mumbai",
          isImmovable: true,
          historicalTerritoryCode: HISTORICAL_PRESIDENCY_CODES.BOMBAY_OOCJ,
          historicalTerritoryEvidence: sampleHistoricalTerritoryEvidence,
          value: 15000000
        }
      ]
    };
    const res = resolvePersonalLawRegime(willData);
    expect(res.section57Clause).toContain("Section 57(b)");
    expect(res.scheduleIIIApplicable).toBe(true);
  });

  it('83. Stage 1 Hindu Section 57(c) Residual Nature: Post-1927 will executed outside presidency towns without presidency property is routed to Section 57(c)', () => {
    const willData = {
      personal: {
        fullName: "Manoj Tiwari",
        pob: "Bhopal, MP",
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: "Hindu",
        willExecutionPlace: "Bhopal, MP",
        willExecutionDate: "2026-06-01"
      },
      assets: [
        { id: "a1", type: "House", location: "Bhopal, MP", value: 4000000, isImmovable: true }
      ]
    };
    const res = resolvePersonalLawRegime(willData);
    expect(res.section57Clause).toContain("Section 57(c)");
    expect(res.scheduleIIIApplicable).toBe(true);
  });

  it('84. Stage 1 Pre-Flight Blocker Audit: Verifies all Stage 1 fatal blockers halt execution readiness with preventsGeneration: true', () => {
    const willBlockedGoa = {
      personal: {
        fullName: "Dr. Joseph Fernandes",
        pob: "Margao, Goa" // Unconfirmed parental origin
      }
    };
    const auditGoa = runPreFlightLegalBlockerAudit(willBlockedGoa);
    expect(auditGoa.isExecutionReady).toBe(false);
    expect(auditGoa.blockers.some(b => b.code === "ERR_GOA_JURISDICTION_UNCONFIRMED" && b.preventsGeneration)).toBe(true);

    const willBlockedSMA = {
      personal: {
        fullName: "Sameer Khan",
        pob: "Pune, Maharashtra",
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: "Muslim",
        marriageRegime: "SPECIAL_MARRIAGE_ACT_1954"
      }
    };
    const auditSMA = runPreFlightLegalBlockerAudit(willBlockedSMA);
    expect(auditSMA.isExecutionReady).toBe(false);
    expect(auditSMA.blockers.some(b => b.code === "ERR_SMA_MARRIAGE_CERTIFICATE_REQUIRED" && b.preventsGeneration)).toBe(true);
  });

  // ── REVISION 8 FORENSIC REMEDIATION TESTS (85–95) ──

  it('85. Stage 1 Revision 8 Section 1(4)(c): Outside-Goa applicant with unrecorded parental status and no Goa property triggers GOA_STATUS_UNDETERMINED', () => {
    const res = classifyGoaJurisdiction({
      fullName: 'Vikram Seth',
      pob: 'Lucknow, Uttar Pradesh',
      religion: 'Hindu'
      // No parental regime declared; parentsStatusUnrecorded: true
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED);
    expect(res.statutoryClause).toBe('Section 1(4)(c) Parental Origin Inquiry');
    expect(res.blockers[0]).toContain('ERR_GOA_JURISDICTION_UNCONFIRMED');
    expect(res.canGenerateWill).toBe(false);
  });

  it('86. Stage 1 Revision 8 Section 1(4)(c): Outside-Goa applicant asserting bare negative Boolean parentsPortugueseRegime: false without rest-of-India affirmative status triggers GOA_STATUS_UNDETERMINED', () => {
    const res = classifyGoaJurisdiction({
      fullName: 'Anil Kapoor',
      pob: 'Chandigarh',
      parentsPortugueseRegime: false,
      // No parentsRestOfIndiaGoverned: true or parentsRestOfIndiaEvidence
      religion: 'Hindu'
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED);
    expect(res.statutoryClause).toBe('Section 1(4)(c) Parental Origin Inquiry');
    expect(res.blockers[0]).toContain('ERR_GOA_JURISDICTION_UNCONFIRMED');
    expect(res.canGenerateWill).toBe(false);
  });

  it('87. Stage 1 Revision 8 Section 1(4)(d): Born in Goa with statutory election registered after 3-year deadline following majority (age 21) triggers GOA_STATUS_UNDETERMINED', () => {
    const resLateElection = classifyGoaJurisdiction({
      fullName: 'Rajesh Gupta',
      pob: 'Margao, Goa',
      dob: '1990-01-01', // Majority on 2008-01-01; statutory election deadline on 2011-01-01 (age 21)
      parentsPortugueseRegime: false,
      parentsRestOfIndiaGoverned: true,
      parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
      statutoryElectionClauseD: true,
      clauseDEvidence: {
        ...sampleClauseDEvidence,
        registrationDate: '2015-05-20' // Executed 4+ years late (at age 25)!
      },
      permanentResidenceEvidence: sampleResidenceEvidence
    });
    expect(resLateElection.status).toBe(JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED);
    expect(resLateElection.statutoryClause).toBe('Section 1(4)(d) Election Deadline Expired');
    expect(resLateElection.blockers[0]).toContain('ERR_GOA_ELECTION_DEADLINE_EXPIRED');
    expect(resLateElection.canGenerateWill).toBe(false);
  });

  it('88. Stage 1 Revision 8 Evidence Hardening: Reject dummy or mock storage IDs with ERR_GOA_EVIDENCE_UNVERIFIED', () => {
    const mockEvidence = {
      ...sampleClauseAEvidence,
      documentStorageId: 'mock'
    };
    const res = validateJurisdictionEvidence(mockEvidence, [JURISDICTION_DOCUMENT_TYPES.HISTORICAL_PORTUGUESE_CIVIL_RECORD]);
    expect(res.isValid).toBe(false);
    expect(res.blockerCode).toBe('ERR_GOA_EVIDENCE_UNVERIFIED');
    expect(res.reason).toContain('invalid uploaded document storage identifier');
  });

  it('89. Stage 1 Revision 8 Evidence Hardening: Advocate Bar enrollment failing BAR_ENROLLMENT_REGEX returns ERR_GOA_EVIDENCE_UNVERIFIED', () => {
    const invalidBarEvidence = {
      ...sampleClauseAEvidence,
      enrollmentNumber: 'ADVOCATE-12345-INVALID'
    };
    const res = validateJurisdictionEvidence(invalidBarEvidence, [JURISDICTION_DOCUMENT_TYPES.HISTORICAL_PORTUGUESE_CIVIL_RECORD]);
    expect(res.isValid).toBe(false);
    expect(res.blockerCode).toBe('ERR_GOA_EVIDENCE_UNVERIFIED');
    expect(res.reason).toContain('does not match statutory Bar Council format');
  });

  it('90. Stage 1 Revision 8 Evidence Hardening: Strict context matching in classifier rejects evidence record belonging to different party with ERR_PARTY_MISMATCH', () => {
    const res = classifyGoaJurisdiction({
      fullName: 'Suresh Prabhu', // Testator name differs from sampleClauseAEvidence verifiedParties ('António Fernandes')
      pob: 'Panaji, Goa',
      dob: '1955-01-01',
      clauseAEvidence: sampleClauseAEvidence
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED);
    expect(res.blockers[0]).toContain('ERR_PARTY_MISMATCH');
    expect(res.canGenerateWill).toBe(false);
  });

  it('91. Stage 1 Revision 8 Shariat Section 3: Declarant under 18 at declaration date strictly fails Section 11 competence with ERR_SHARIAT_SEC3_INCOMPETENT', () => {
    const minorAtFilingRecord = {
      ...sampleShariatDeclarationRecord,
      declarationDate: '2020-05-15'
    };
    // Declarant born 2004-06-01 was only 15 years 11 months on declaration date (2020-05-15)
    const personalData = {
      dob: '2004-06-01',
      contractCompetent: true,
      addressState: 'Uttar Pradesh'
    };
    const res = validateShariatDeclarationRecord(minorAtFilingRecord, personalData);
    expect(res.isValid).toBe(false);
    expect(res.blockerCode).toBe('ERR_SHARIAT_SEC3_INCOMPETENT');
    expect(res.reason).toContain('at least 18 years of age on the statutory declaration date');
  });

  it('92. Stage 1 Revision 8 Shariat Section 3: Declarant residing in Goa with established non-Goan domicile passes; Goan-governed declarant rejected', () => {
    const declWithGoaAddr = {
      ...sampleShariatDeclarationRecord,
      residenceTerritory: 'Goa',
      domicileEvidence: sampleDeclarantRoiDomicileEvidence
    };
    // Case A: Declarant resides in Goa but has established rest-of-India succession status (non-Goan domicile) via verified documentary evidence
    const nonGoanDomiciliary = {
      fullName: 'Tariq Aziz',
      dob: '1980-01-01',
      contractCompetent: true,
      parentsRestOfIndiaGoverned: true,
      isGoanDomicile: false,
      domicileEvidence: sampleDeclarantRoiDomicileEvidence
    };
    const resNonGoan = validateShariatDeclarationRecord(declWithGoaAddr, nonGoanDomiciliary);
    expect(resNonGoan.isValid).toBe(true);

    // Case B: Declarant resides in Goa without verified rest-of-India domicile evidence (governed by Goa succession law under Jose Paulo Coutinho)
    const unverifiedGoan = {
      dob: '1980-01-01',
      contractCompetent: true,
      isGoanDomicile: false // Bare boolean without documentary evidence!
    };
    const declNoEvidence = {
      ...sampleShariatDeclarationRecord,
      residenceTerritory: 'Goa'
      // No domicileEvidence
    };
    const resGoan = validateShariatDeclarationRecord(declNoEvidence, unverifiedGoan);
    expect(resGoan.isValid).toBe(false);
    expect(resGoan.blockerCode).toBe('ERR_SHARIAT_SEC3_RESIDENCE_UNVERIFIED');
    expect(resGoan.reason).toContain('Jose Paulo Coutinho');
  });

  it('93. Stage 1 Revision 8 Personal Law Identity: Jewish applicant preserves distinct identity (isJewish: true, isChristian: false, religion: Jewish) under ISA Part VI', () => {
    const willData = {
      personal: {
        fullName: 'Ezekiel Isaac Malekar',
        pob: 'New Delhi',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: 'Jewish'
      }
    };
    const res = resolvePersonalLawRegime(willData);
    expect(res.regime).toBe(PERSONAL_LAW_REGIMES.CHRISTIAN_CIVIL);
    expect(res.isJewish).toBe(true);
    expect(res.isChristian).toBe(false);
    expect(res.religion).toBe('Jewish');
    expect(res.statuteCitation).toContain('Part VI Testamentary Succession');
    expect(res.statuteCitation).toContain('Jewish Testators');
  });

  it('94. Stage 1 Revision 8 SMA Safeguard: Generic civilMarriage: true without explicit SMA regime declaration returns ERR_CIVIL_MARRIAGE_REGIME_UNCONFIRMED', () => {
    const willData = {
      personal: {
        fullName: 'Sameer Sen',
        pob: 'Kolkata, West Bengal',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: 'Hindu',
        civilMarriage: true // Bare generic assertion without marriageRegime: 'SPECIAL_MARRIAGE_ACT_1954'
      }
    };
    const res = resolvePersonalLawRegime(willData);
    expect(res.regime).toBe(PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED);
    expect(res.requiresLegalReview).toBe(true);
    expect(res.blockers[0]).toContain('ERR_CIVIL_MARRIAGE_REGIME_UNCONFIRMED');
  });

  it('95. Stage 1 Revision 8 Section 57 Modern City Ambiguity: Modern presidency city provided without verified historical territory code returns ERR_TERRITORIAL_JURISDICTION_AMBIGUOUS', () => {
    const willData = {
      personal: {
        fullName: 'Siddharth Mukherjee',
        pob: 'Kolkata, West Bengal',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: 'Hindu',
        willExecutionPlace: 'Kolkata', // Modern city name without historical territory code
        willExecutionDate: '2026-05-15'
      }
    };
    const res = resolvePersonalLawRegime(willData);
    expect(res.regime).toBe(PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED);
    expect(res.requiresLegalReview).toBe(true);
    expect(res.blockers[0]).toContain('ERR_TERRITORIAL_JURISDICTION_AMBIGUOUS');
  });

  // ── REVISION 9 FORENSIC EVIDENCE & STATUTORY REGRESSION TESTS (96–113) ──

  it('96. Stage 1 Revision 9 Section 1(4)(c): Outside-Goa applicant with parentsRestOfIndiaGoverned: true without documentary evidence returns ERR_GOA_JURISDICTION_UNCONFIRMED', () => {
    const res = classifyGoaJurisdiction({
      pob: 'Bangalore, Karnataka',
      parentsRestOfIndiaGoverned: true
      // No parentsRestOfIndiaEvidence!
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED);
    expect(res.blockers[0]).toContain('ERR_GOA_JURISDICTION_UNCONFIRMED');
    expect(res.canGenerateWill).toBe(false);
  });

  it('97. Stage 1 Revision 9 Evidence Matching: Parental record with unrelated parents returns ERR_PARTY_MISMATCH', () => {
    const res = classifyGoaJurisdiction({
      fullName: 'Sunil Rao',
      fatherName: 'Ramesh Rao',
      motherName: 'Sunita Rao',
      pob: 'Margao, Goa',
      parentsPortugueseRegime: true,
      clauseBEvidence: {
        ...sampleClauseBEvidence,
        verifiedParties: 'Parents Manuel & Maria Fernandes' // Does not match Ramesh Rao / Sunita Rao
      }
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED);
    expect(res.blockers[0]).toContain('ERR_PARTY_MISMATCH');
    expect(res.canGenerateWill).toBe(false);
  });

  it('98. Stage 1 Revision 9 Evidence Matching: Testator own name on parental record strictly rejected with ERR_PARTY_MISMATCH', () => {
    const res = classifyGoaJurisdiction({
      fullName: 'Carlos Fernandes',
      pob: 'Margao, Goa',
      parentsPortugueseRegime: true,
      clauseBEvidence: {
        ...sampleClauseBEvidence,
        verifiedParties: 'Carlos Fernandes' // Testator own name used for parental record!
      }
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED);
    expect(res.blockers[0]).toContain('ERR_PARTY_MISMATCH');
    expect(res.canGenerateWill).toBe(false);
  });

  it('99. Stage 1 Revision 9 Server Sync: Evidence record with verificationPendingServerSync: true or serverVerified: false returns ERR_GOA_EVIDENCE_PENDING_SERVER_SYNC', () => {
    const pendingEvidence = {
      ...sampleClauseAEvidence,
      verificationPendingServerSync: true
    };
    const resPending = validateJurisdictionEvidence(pendingEvidence, [JURISDICTION_DOCUMENT_TYPES.HISTORICAL_PORTUGUESE_CIVIL_RECORD]);
    expect(resPending.isValid).toBe(false);
    expect(resPending.blockerCode).toBe('ERR_GOA_EVIDENCE_PENDING_SERVER_SYNC');

    const unverifiedServerEvidence = {
      ...sampleClauseAEvidence,
      serverVerified: false
    };
    const resUnsynced = validateJurisdictionEvidence(unverifiedServerEvidence, [JURISDICTION_DOCUMENT_TYPES.HISTORICAL_PORTUGUESE_CIVIL_RECORD]);
    expect(resUnsynced.isValid).toBe(false);
    expect(resUnsynced.blockerCode).toBe('ERR_GOA_EVIDENCE_PENDING_SERVER_SYNC');
  });

  it('100. Stage 1 Revision 9 Storage Audit: Non-blacklisted storage ID with storageVerified: false returns ERR_GOA_EVIDENCE_UNVERIFIED', () => {
    const unverifiedStorageDoc = {
      ...sampleClauseAEvidence,
      documentStorageId: 'DOC-STORE-CUSTOM-9921',
      storageVerified: false
    };
    const res = validateJurisdictionEvidence(unverifiedStorageDoc, [JURISDICTION_DOCUMENT_TYPES.HISTORICAL_PORTUGUESE_CIVIL_RECORD]);
    expect(res.isValid).toBe(false);
    expect(res.blockerCode).toBe('ERR_GOA_EVIDENCE_UNVERIFIED');
    expect(res.reason).toContain('secure repository');
  });

  it('101. Stage 1 Revision 9 Cryptographic Integrity: Syntactically valid SHA-256 hash not matching computed file bytes returns ERR_EMPTY_OR_INVALID_FILE_HASH', () => {
    const mismatchedHashDoc = {
      ...sampleClauseAEvidence,
      documentHash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
      computedHash: '9f8e7d6c5b4a9f8e7d6c5b4a9f8e7d6c5b4a9f8e7d6c5b4a9f8e7d6c5b4a9f8e'
    };
    const res = validateJurisdictionEvidence(mismatchedHashDoc, [JURISDICTION_DOCUMENT_TYPES.HISTORICAL_PORTUGUESE_CIVIL_RECORD]);
    expect(res.isValid).toBe(false);
    expect(res.blockerCode).toBe('ERR_EMPTY_OR_INVALID_FILE_HASH');
    expect(res.reason).toContain('does not match computed SHA-256 hash');
  });

  it('102. Stage 1 Revision 9 Advocate Credentialing: Advocate Bar enrollment without authoritative verification returns ERR_GOA_EVIDENCE_UNVERIFIED', () => {
    const unverifiedAdvocateDoc = {
      ...sampleClauseAEvidence,
      credentialVerified: false
    };
    const res = validateJurisdictionEvidence(unverifiedAdvocateDoc, [JURISDICTION_DOCUMENT_TYPES.HISTORICAL_PORTUGUESE_CIVIL_RECORD]);
    expect(res.isValid).toBe(false);
    expect(res.blockerCode).toBe('ERR_GOA_EVIDENCE_UNVERIFIED');
    expect(res.reason).toContain('authoritatively authenticated against the Bar Council registry');
  });

  it('103. Stage 1 Revision 9 Section 1(4)(d): Missing or invalid DOB returns ERR_GOA_JURISDICTION_UNCONFIRMED', () => {
    const res = classifyGoaJurisdiction({
      pob: 'Margao, Goa',
      dob: 'INVALID-DOB-STRING',
      parentsPortugueseRegime: false,
      parentsRestOfIndiaGoverned: true,
      parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
      statutoryElectionClauseD: true,
      clauseDEvidence: sampleClauseDEvidence,
      permanentResidenceEvidence: sampleResidenceEvidence
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED);
    expect(res.blockers[0]).toContain('ERR_GOA_JURISDICTION_UNCONFIRMED');
    expect(res.blockers[0]).toContain('requires a valid date of birth');
  });

  it('104. Stage 1 Revision 9 Section 1(4)(d): Missing or invalid election registration date returns ERR_GOA_JURISDICTION_UNCONFIRMED', () => {
    const res = classifyGoaJurisdiction({
      pob: 'Margao, Goa',
      dob: '2000-01-01',
      parentsPortugueseRegime: false,
      parentsRestOfIndiaGoverned: true,
      parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
      statutoryElectionClauseD: true,
      clauseDEvidence: {
        ...sampleClauseDEvidence,
        registrationDate: 'NOT-AN-ISO-DATE'
      },
      permanentResidenceEvidence: sampleResidenceEvidence
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED);
    expect(res.blockers[0]).toContain('ERR_GOA_JURISDICTION_UNCONFIRMED');
    expect(res.blockers[0]).toContain('requires a valid registration date');
  });

  it('105. Stage 1 Revision 9 Section 1(4)(c): Missing or invalid DOB or opt-out registration date returns ERR_GOA_JURISDICTION_UNCONFIRMED', () => {
    const resInvalidDob = classifyGoaJurisdiction({
      pob: 'London, UK',
      dob: 'NOT-VALID-DOB',
      parentsPortugueseRegime: true,
      clauseBEvidence: sampleClauseBEvidence,
      statutoryOptOutClauseC: true,
      optOutBeforeSpecialNotary: true,
      optOutDeclarationDate: '1980-05-10',
      clauseCEvidence: sampleClauseCEvidence
    });
    expect(resInvalidDob.status).toBe(JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED);
    expect(resInvalidDob.blockers[0]).toContain('ERR_GOA_JURISDICTION_UNCONFIRMED');

    const resInvalidOptOutDate = classifyGoaJurisdiction({
      pob: 'London, UK',
      dob: '1960-01-01',
      parentsPortugueseRegime: true,
      clauseBEvidence: sampleClauseBEvidence,
      statutoryOptOutClauseC: true,
      optOutBeforeSpecialNotary: true,
      optOutDeclarationDate: 'BAD-DATE',
      clauseCEvidence: {
        ...sampleClauseCEvidence,
        registrationDate: 'BAD-DATE'
      }
    });
    expect(resInvalidOptOutDate.status).toBe(JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED);
    expect(resInvalidOptOutDate.blockers[0]).toContain('ERR_GOA_JURISDICTION_UNCONFIRMED');
  });

  it('106. Stage 1 Revision 9 Shariat Section 3: Prescribed form boolean shortcut without FORM_A_SHARIAT_SECTION_3 returns ERR_SHARIAT_SEC3_DEFECTIVE', () => {
    const declNakedForm = {
      ...sampleShariatDeclarationRecord,
      prescribedForm: true,
      formType: 'AFFIDAVIT_PLAIN_PAPER'
    };
    const res = validateShariatDeclarationRecord(declNakedForm, { dob: '1980-01-01', contractCompetent: true });
    expect(res.isValid).toBe(false);
    expect(res.blockerCode).toBe('ERR_SHARIAT_SEC3_DEFECTIVE');
    expect(res.reason).toContain('FORM_A_SHARIAT_SECTION_3');
  });

  it('107. Stage 1 Revision 9 Shariat Section 3: Missing or invalid declaration date or DOB returns ERR_SHARIAT_SEC3_DEFECTIVE', () => {
    const declInvalidDate = {
      ...sampleShariatDeclarationRecord,
      declarationDate: 'INVALID-DATE'
    };
    const res1 = validateShariatDeclarationRecord(declInvalidDate, { dob: '1980-01-01', contractCompetent: true });
    expect(res1.isValid).toBe(false);
    expect(res1.blockerCode).toBe('ERR_SHARIAT_SEC3_DEFECTIVE');

    const res2 = validateShariatDeclarationRecord(sampleShariatDeclarationRecord, { dob: 'INVALID-DOB', contractCompetent: true });
    expect(res2.isValid).toBe(false);
    expect(res2.blockerCode).toBe('ERR_SHARIAT_SEC3_DEFECTIVE');
  });

  it('108. Stage 1 Revision 9 Shariat Section 3: Boolean competence shortcuts rejected when declarant was under 18 at declaration date', () => {
    const minorDecl = {
      ...sampleShariatDeclarationRecord,
      declarationDate: '2020-01-01',
      contractCompetent: true // Client shortcut
    };
    const res = validateShariatDeclarationRecord(minorDecl, {
      dob: '2004-06-01', // Declarant was 15.5 years old on 2020-01-01
      contractCompetent: true // Client shortcut
    });
    expect(res.isValid).toBe(false);
    expect(res.blockerCode).toBe('ERR_SHARIAT_SEC3_INCOMPETENT');
    expect(res.reason).toContain('at least 18 years of age on the statutory declaration date');
  });

  it('109. Stage 1 Revision 9 Shariat Section 3: Foreign residence returns ERR_SHARIAT_SEC3_TERRITORIAL_INELIGIBLE', () => {
    const foreignDecl = {
      ...sampleShariatDeclarationRecord,
      residenceTerritory: 'Dubai, UAE'
    };
    const res = validateShariatDeclarationRecord(foreignDecl, {
      dob: '1980-01-01',
      contractCompetent: true,
      addressCountry: 'UAE'
    });
    expect(res.isValid).toBe(false);
    expect(res.blockerCode).toBe('ERR_SHARIAT_SEC3_TERRITORIAL_INELIGIBLE');
    expect(res.reason).toContain('resident of the territory to which the Act extends');
  });

  it('110. Stage 1 Revision 9 Shariat Section 3: Goa address with non-Goan domicile asserted only via client booleans returns ERR_SHARIAT_SEC3_RESIDENCE_UNVERIFIED', () => {
    const goaDecl = {
      ...sampleShariatDeclarationRecord,
      residenceTerritory: 'Panaji, Goa'
    };
    const res = validateShariatDeclarationRecord(goaDecl, {
      dob: '1980-01-01',
      contractCompetent: true,
      addressState: 'Goa',
      isGoanDomicile: false, // Client boolean
      parentsRestOfIndiaGoverned: true // Client boolean without documentary evidence
    });
    expect(res.isValid).toBe(false);
    expect(res.blockerCode).toBe('ERR_SHARIAT_SEC3_RESIDENCE_UNVERIFIED');
    expect(res.reason).toContain('Jose Paulo Coutinho');
  });

  it('111. Stage 1 Revision 9 Section 57(a): Execution place historical code without verified documentary evidence returns ERR_HISTORICAL_TERRITORY_UNVERIFIED', () => {
    const willData = {
      personal: {
        fullName: 'Bimal Ghosh',
        pob: 'Kolkata, West Bengal',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: 'Hindu',
        willExecutionPlace: 'Kolkata',
        historicalTerritoryCode: HISTORICAL_PRESIDENCY_CODES.BENGAL_LIEUTENANT_GOVERNOR,
        // No historicalTerritoryEvidence!
        willExecutionDate: '2026-05-15'
      }
    };
    const res = resolvePersonalLawRegime(willData);
    expect(res.regime).toBe(PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED);
    expect(res.blockers[0]).toContain('ERR_HISTORICAL_TERRITORY_UNVERIFIED');
  });

  it('112. Stage 1 Revision 9 Section 57(b): Immovable asset claiming historical territory code without asset-level verified evidence returns ERR_HISTORICAL_TERRITORY_UNVERIFIED', () => {
    const willData = {
      personal: {
        fullName: 'Arun Deshmukh',
        pob: 'Varanasi, UP',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: 'Hindu',
        willExecutionPlace: 'Varanasi',
        willExecutionDate: '2026-03-10'
      },
      assets: [
        {
          id: 1,
          type: 'Real Estate',
          location: 'Mumbai',
          historicalTerritoryCode: HISTORICAL_PRESIDENCY_CODES.BOMBAY_OOCJ
          // No historicalTerritoryEvidence on asset!
        }
      ]
    };
    const res = resolvePersonalLawRegime(willData);
    expect(res.regime).toBe(PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED);
    expect(res.blockers[0]).toContain('ERR_HISTORICAL_TERRITORY_UNVERIFIED');
  });

  it('113. Stage 1 Revision 9 Section 2 Agricultural Land: Generic unclassified land parcel without confirmed revenue classification returns ERR_AGRICULTURAL_LAND_CLASSIFICATION_UNCERTAIN', () => {
    const willData = {
      personal: {
        fullName: 'Imtiaz Khan',
        pob: 'Lucknow, UP',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: 'Muslim',
        sect: 'Sunni',
        shariatDeclarationRecord: sampleShariatDeclarationRecord
      },
      assets: [
        {
          id: 'a1',
          type: 'Plot',
          desc: 'Open Plot No. 44, Sector C',
          value: 1500000
          // No revenueClassification or landClassification!
        }
      ]
    };
    const res = resolvePersonalLawRegime(willData);
    expect(res.regime).toBe(PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED);
    expect(res.blockers[0]).toContain('ERR_AGRICULTURAL_LAND_CLASSIFICATION_UNCERTAIN');
    expect(res.uncertainLandAssets.length).toBe(1);
  });

  // ── REVISION 10 FORENSIC REMEDIATION TESTS (114–125) ──

  it('114. Stage 1 Revision 10 Cryptographic Integrity: Evidence record without computedHash or with mismatched/fabricated computedHash returns ERR_EMPTY_OR_INVALID_FILE_HASH', () => {
    // Case A: Missing computedHash
    const noComputedHashDoc = {
      ...sampleClauseAEvidence
    };
    delete noComputedHashDoc.computedHash;
    const resNoComputed = validateJurisdictionEvidence(noComputedHashDoc, [JURISDICTION_DOCUMENT_TYPES.HISTORICAL_PORTUGUESE_CIVIL_RECORD]);
    expect(resNoComputed.isValid).toBe(false);
    expect(resNoComputed.blockerCode).toBe('ERR_EMPTY_OR_INVALID_FILE_HASH');
    expect(resNoComputed.reason).toContain('computed server document bytes');

    // Case B: Trivial / all identical character forged hash
    const trivialHashDoc = {
      ...sampleClauseAEvidence,
      documentHash: '0000000000000000000000000000000000000000000000000000000000000000',
      computedHash: '0000000000000000000000000000000000000000000000000000000000000000'
    };
    const resTrivial = validateJurisdictionEvidence(trivialHashDoc, [JURISDICTION_DOCUMENT_TYPES.HISTORICAL_PORTUGUESE_CIVIL_RECORD]);
    expect(resTrivial.isValid).toBe(false);
    expect(resTrivial.blockerCode).toBe('ERR_EMPTY_OR_INVALID_FILE_HASH');
  });

  it('115. Stage 1 Revision 10 Strict Testator Match: In strictTestatorMatch, parental records cannot satisfy testator own legal status check', () => {
    // Document issued to parents cannot prove testator's own status when strictTestatorMatch: true
    const res = validateJurisdictionEvidence(sampleParentsRoiEvidence, [
      JURISDICTION_DOCUMENT_TYPES.REST_OF_INDIA_DOMICILE_CERTIFICATE
    ], {
      testatorName: 'Rajesh Gupta',
      parentNames: ['Ramesh Gupta', 'Sunita Gupta'],
      strictTestatorMatch: true
    });
    expect(res.isValid).toBe(false);
    expect(res.blockerCode).toBe('ERR_PARTY_MISMATCH');
    expect(res.reason).toContain('Parent records cannot establish testator\'s own legal status');
  });

  it('116. Stage 1 Revision 10 Section 1(4) Birthplace Gate: Missing or empty place of birth fails closed with ERR_GOA_JURISDICTION_UNCONFIRMED', () => {
    const resMissingPob = classifyGoaJurisdiction({
      fullName: 'Sunil Kumar',
      hasGoaAncestryClaim: true,
      religion: 'Hindu'
      // pob omitted entirely
    });
    expect(resMissingPob.status).toBe(JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED);
    expect(resMissingPob.statutoryClause).toBe('Section 1(4) Birthplace Unconfirmed');
    expect(resMissingPob.blockers[0]).toContain('ERR_GOA_JURISDICTION_UNCONFIRMED');
    expect(resMissingPob.canGenerateWill).toBe(false);

    const resEmptyPob = classifyGoaJurisdiction({
      fullName: 'Sunil Kumar',
      hasGoaAncestryClaim: true,
      pob: '   ',
      religion: 'Hindu'
    });
    expect(resEmptyPob.status).toBe(JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED);
    expect(resEmptyPob.blockers[0]).toContain('ERR_GOA_JURISDICTION_UNCONFIRMED');
  });

  it('117. Stage 1 Revision 10 Outside-Goa Parental Origin Fail-Closed: Applicant born outside Goa with negative booleans without verified rest-of-India evidence returns GOA_STATUS_UNDETERMINED', () => {
    const res = classifyGoaJurisdiction({
      fullName: 'Arun Kulkarni',
      pob: 'Pune, Maharashtra',
      parentsPortugueseRegime: false,
      parentsCivilCode1867: false,
      parentsRestOfIndiaGoverned: false,
      religion: 'Hindu'
      // No parentsRestOfIndiaEvidence!
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED);
    expect(res.statutoryClause).toBe('Section 1(4)(c) Parental Origin Inquiry');
    expect(res.blockers[0]).toContain('ERR_GOA_JURISDICTION_UNCONFIRMED');
    expect(res.canGenerateWill).toBe(false);
  });

  it('118. Stage 1 Revision 10 Section 1(4)(d) Parental Evidence Subject Match: Rest-of-India parents evidence issued in testator own name fails with ERR_PARTY_MISMATCH', () => {
    const res = classifyGoaJurisdiction({
      fullName: 'Rajesh Gupta',
      pob: 'Margao, Goa',
      fatherName: 'Ramesh Gupta',
      motherName: 'Sunita Gupta',
      parentsPortugueseRegime: false,
      parentsRestOfIndiaGoverned: true,
      parentsRestOfIndiaEvidence: {
        ...sampleParentsRoiEvidence,
        verifiedParties: 'Rajesh Gupta' // Testator's own name instead of parents'!
      },
      statutoryElectionClauseD: false
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED);
    expect(res.blockers[0]).toContain('ERR_PARTY_MISMATCH');
    expect(res.canGenerateWill).toBe(false);
  });

  it('119. Stage 1 Revision 10 Shariat Section 3 Calendar Competence: Missing date of birth returns ERR_SHARIAT_SEC3_DEFECTIVE even when age fallback is supplied', () => {
    const res = validateShariatDeclarationRecord(sampleShariatDeclarationRecord, {
      fullName: 'Tariq Aziz',
      age: 35, // Self-declared age fallback
      contractCompetent: true,
      addressState: 'Uttar Pradesh'
      // dob omitted!
    });
    expect(res.isValid).toBe(false);
    expect(res.blockerCode).toBe('ERR_SHARIAT_SEC3_DEFECTIVE');
    expect(res.reason).toContain('Self-declared age is legally inadmissible');
  });

  it('120. Stage 1 Revision 10 Shariat Section 3 Declarant Domicile: Goa resident declarant cannot reuse parental domicile evidence; must provide declarant own verified domicile certificate', () => {
    const goaDecl = {
      ...sampleShariatDeclarationRecord,
      residenceTerritory: 'Goa',
      domicileEvidence: sampleParentsRoiEvidence // Parental document, not declarant's!
    };
    const res = validateShariatDeclarationRecord(goaDecl, {
      fullName: 'Tariq Aziz',
      dob: '1985-05-15',
      contractCompetent: true,
      addressState: 'Goa',
      parentsRestOfIndiaEvidence: sampleParentsRoiEvidence
    });
    expect(res.isValid).toBe(false);
    expect(res.blockerCode).toBe('ERR_SHARIAT_SEC3_RESIDENCE_UNVERIFIED');
  });

  it('121. Stage 1 Revision 10 Section 57 Execution Place Gate: Hindu testator with post-1927 execution date but missing execution place fails closed with ERR_WILL_EXECUTION_PLACE_REQUIRED', () => {
    const willData = {
      personal: {
        fullName: 'Rameshwar Sharma',
        pob: 'Varanasi, UP',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: 'Hindu',
        willExecutionDate: '2026-06-15'
        // willExecutionPlace omitted!
      }
    };
    const res = resolvePersonalLawRegime(willData);
    expect(res.regime).toBe(PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED);
    expect(res.blockers[0]).toContain('ERR_WILL_EXECUTION_PLACE_REQUIRED');
  });

  it('122. Stage 1 Revision 10 Immovable Property Schema: Comprehensive schema catches apartments, flats, shops, villas, and godowns as immovable property for Section 57', () => {
    const willDataApartment = {
      personal: {
        fullName: 'Kishore Joshi',
        pob: 'Pune, Maharashtra',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: 'Hindu',
        willExecutionPlace: 'Pune',
        willExecutionDate: '2026-04-20'
      },
      assets: [
        {
          id: 'apt-1',
          type: 'Apartment',
          location: 'South Mumbai', // Presidency city without historical code!
          desc: 'Luxury Apartment 402, Marine Drive'
        }
      ]
    };
    const res = resolvePersonalLawRegime(willDataApartment);
    expect(res.regime).toBe(PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED);
    expect(res.blockers[0]).toContain('ERR_TERRITORIAL_JURISDICTION_AMBIGUOUS');
  });

  it('123. Stage 1 Revision 10 Section 57 Historical Territory Evidence: Historical territory evidence without valid computedHash matching documentHash fails with ERR_EMPTY_OR_INVALID_FILE_HASH', () => {
    const uncomputedTerritoryDoc = {
      ...sampleHistoricalTerritoryEvidence,
      computedHash: 'badbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadb'
    };
    const willData = {
      personal: {
        fullName: 'Bimal Ghosh',
        pob: 'Kolkata, West Bengal',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: 'Hindu',
        willExecutionPlace: 'Kolkata',
        historicalTerritoryCode: HISTORICAL_PRESIDENCY_CODES.BENGAL_LIEUTENANT_GOVERNOR,
        historicalTerritoryEvidence: uncomputedTerritoryDoc,
        willExecutionDate: '2026-05-15'
      }
    };
    const res = resolvePersonalLawRegime(willData);
    expect(res.regime).toBe(PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED);
    expect(res.blockers[0]).toContain('ERR_HISTORICAL_TERRITORY_UNVERIFIED');
  });

  it('124. Stage 1 Revision 10 Section 2 Agricultural Land String Bypass Barred: Generic plot with naked string revenueClassification: NON_AGRICULTURAL without verified evidence returns ERR_AGRICULTURAL_LAND_CLASSIFICATION_UNCERTAIN', () => {
    const willData = {
      personal: {
        fullName: 'Imtiaz Khan',
        pob: 'Lucknow, UP',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: 'Muslim',
        sect: 'Sunni',
        shariatDeclarationRecord: sampleShariatDeclarationRecord
      },
      assets: [
        {
          id: 'plot-1',
          type: 'Plot',
          desc: 'Plot No. 12, Gulmohar Enclave',
          revenueClassification: 'NON_AGRICULTURAL' // Naked string without classificationEvidence!
        }
      ]
    };
    const res = resolvePersonalLawRegime(willData);
    expect(res.regime).toBe(PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED);
    expect(res.blockers[0]).toContain('ERR_AGRICULTURAL_LAND_CLASSIFICATION_UNCERTAIN');
  });

  it('125. Stage 1 Revision 10 Section 2 Agricultural Land with Verified NA Sanad: Generic plot with verified documentary NA Sanad clears agricultural uncertainty', () => {
    const willData = {
      personal: {
        fullName: 'Imtiaz Khan',
        pob: 'Lucknow, UP',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: 'Muslim',
        sect: 'Sunni',
        dob: '1980-01-01',
        shariatDeclarationRecord: sampleShariatDeclarationRecord
      },
      assets: [
        {
          id: 'plot-1',
          type: 'Plot',
          desc: 'Plot No. 12, Gulmohar Enclave',
          revenueClassification: 'NON_AGRICULTURAL',
          classificationEvidence: sampleRevenueClassificationEvidence
        }
      ]
    };
    const res = resolvePersonalLawRegime(willData);
    expect(res.regime).toBe(PERSONAL_LAW_REGIMES.MUSLIM_SUNNI);
    expect(res.shariatSec3Verified).toBe(true);
    expect(res.blockers.length).toBe(0);
  });

  // ── REVISION 11 FORENSIC & ADVERSARIAL TESTS (126–142) ──

  it('126. Stage 1 Revision 11 Finding 5 Unconditional Missing Birthplace Gate: Testator data without pob fails closed with GOA_STATUS_UNDETERMINED and ERR_GOA_JURISDICTION_UNCONFIRMED', () => {
    const res = classifyGoaJurisdiction({
      fullName: 'Test Person',
      religion: 'Hindu'
      // pob omitted entirely
    });
    expect(res.status).toBe(JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED);
    expect(res.statutoryClause).toBe('Section 1(4) Birthplace Unconfirmed');
    expect(res.blockers[0]).toContain('ERR_GOA_JURISDICTION_UNCONFIRMED');
    expect(res.canGenerateWill).toBe(false);
  });

  it('127. Stage 1 Revision 11 Adversarial 1: Matching forged computedHash and documentHash without backend server ticket fails closed with ERR_UNTRUSTED_CLIENT_EVIDENCE', () => {
    const forgedHash = 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90';
    const clientForgedDoc = {
      documentStorageId: 'DOC-STORE-FORGED-001',
      documentRef: 'FORGED-REF-001',
      documentType: JURISDICTION_DOCUMENT_TYPES.REST_OF_INDIA_DOMICILE_CERTIFICATE,
      issuingAuthority: 'Tahsildar of Pune',
      issueDate: '2019-05-10',
      verifiedParties: 'Testator Name',
      documentHash: forgedHash,
      computedHash: forgedHash,
      documentBytesSha256Verified: true,
      reviewerRole: 'ADVOCATE',
      enrollmentNumber: 'MAH/456/1990',
      verifiedBy: 'Advocate Rajesh Deshmukh',
      serverVerified: true,
      storageVerified: true
      // No authentic serverVerificationTicket!
    };
    const res = validateJurisdictionEvidence(clientForgedDoc);
    expect(res.isValid).toBe(false);
    expect(res.blockerCode).toBe('ERR_UNTRUSTED_CLIENT_EVIDENCE');
    expect(res.reason).toContain('lacks a verified server verification ticket');
  });

  it('128. Stage 1 Revision 11 Adversarial 2: All client verification flags set to true without backend server ticket fails closed with ERR_UNTRUSTED_CLIENT_EVIDENCE', () => {
    const allFlagsDoc = {
      documentStorageId: 'DOC-STORE-ALL-FLAGS-002',
      documentRef: 'FLAGS-REF-002',
      documentType: JURISDICTION_DOCUMENT_TYPES.HISTORICAL_PORTUGUESE_CIVIL_RECORD,
      issuingAuthority: 'Civil Registrar',
      issueDate: '1960-01-01',
      verifiedParties: 'Testator Name',
      documentHash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      computedHash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      serverVerified: true,
      storageVerified: true,
      reviewerVerified: true,
      credentialVerified: true,
      documentBytesSha256Verified: true,
      integrityVerified: true,
      metadataFormatVerified: true,
      statutoryFactEstablished: true,
      verificationStatus: 'VERIFIED',
      verificationDate: '2026-11-01',
      auditSessionId: 'AUDIT-SESSION-FAKE-999',
      reviewerRole: 'ADVOCATE',
      enrollmentNumber: 'GOA/123/2005',
      verifiedBy: 'Advocate Carlos Pereira'
    };
    const res = validateJurisdictionEvidence(allFlagsDoc);
    expect(res.isValid).toBe(false);
    expect(res.blockerCode).toBe('ERR_UNTRUSTED_CLIENT_EVIDENCE');
  });

  it('129. Stage 1 Revision 11 Adversarial 3: Evidence registered for user usr-alice-101 submitted by usr-bob-202 fails closed with ERR_CROSS_USER_EVIDENCE_REUSE', () => {
    const aliceDoc = createTrustedServerEvidenceFixture({
      user: { uid: 'usr-alice-101', email: 'alice@example.com' },
      willId: 'will-shared-001',
      documentStorageId: 'DOC-STORE-ALICE-101',
      documentRef: 'ALICE-REF-101',
      documentType: JURISDICTION_DOCUMENT_TYPES.REST_OF_INDIA_DOMICILE_CERTIFICATE,
      verifiedParties: 'Alice DSilva'
    });
    // Bob attempts to submit Alice's evidence
    const res = validateJurisdictionEvidence(aliceDoc, [JURISDICTION_DOCUMENT_TYPES.REST_OF_INDIA_DOMICILE_CERTIFICATE], {
      userId: 'usr-bob-202',
      willId: 'will-shared-001',
      testatorName: 'Bob DSilva'
    });
    expect(res.isValid).toBe(false);
    expect(res.blockerCode).toBe('ERR_CROSS_USER_EVIDENCE_REUSE');
    expect(res.reason).toContain('Cross-user evidence reuse is prohibited');
  });

  it('130. Stage 1 Revision 11 Adversarial 4: Evidence registered for will will-alpha-001 submitted for will will-beta-002 fails closed with ERR_CROSS_WILL_EVIDENCE_REUSE', () => {
    const willAlphaDoc = createTrustedServerEvidenceFixture({
      user: { uid: 'usr-charlie-303', email: 'charlie@example.com' },
      willId: 'will-alpha-001',
      documentStorageId: 'DOC-STORE-CHARLIE-001',
      documentRef: 'CHARLIE-REF-001',
      documentType: JURISDICTION_DOCUMENT_TYPES.REST_OF_INDIA_DOMICILE_CERTIFICATE,
      verifiedParties: 'Charlie DSilva'
    });
    // Charlie submits the evidence under will-beta-002
    const res = validateJurisdictionEvidence(willAlphaDoc, [JURISDICTION_DOCUMENT_TYPES.REST_OF_INDIA_DOMICILE_CERTIFICATE], {
      userId: 'usr-charlie-303',
      willId: 'will-beta-002',
      testatorName: 'Charlie DSilva'
    });
    expect(res.isValid).toBe(false);
    expect(res.blockerCode).toBe('ERR_CROSS_WILL_EVIDENCE_REUSE');
    expect(res.reason).toContain('Cross-will evidence reuse is prohibited');
  });

  it('131. Stage 1 Revision 11 Adversarial 5: Evidence registered for testator Rajesh Gupta submitted as parental document fails with ERR_PARTY_MISMATCH', () => {
    const testatorDoc = createTrustedServerEvidenceFixture({
      documentStorageId: 'DOC-STORE-RAJESH-001',
      documentRef: 'RAJESH-REF-001',
      documentType: JURISDICTION_DOCUMENT_TYPES.REST_OF_INDIA_DOMICILE_CERTIFICATE,
      verifiedParties: 'Rajesh Gupta'
    });
    const res = validateJurisdictionEvidence(testatorDoc, [JURISDICTION_DOCUMENT_TYPES.REST_OF_INDIA_DOMICILE_CERTIFICATE], {
      requiredSubject: 'PARENTS',
      testatorName: 'Rajesh Gupta',
      parentNames: ['Ramesh Gupta', 'Sunita Gupta'],
      strictSubjectMatch: true
    });
    expect(res.isValid).toBe(false);
    expect(res.blockerCode).toBe('ERR_PARTY_MISMATCH');
    expect(res.reason).toContain('Parental legal regime verification requires document issued in parents\' name');
  });

  it('132. Stage 1 Revision 11 Adversarial 6: Document version 2 against verified server generation version 1 fails with ERR_DOCUMENT_VERSION_STALE', () => {
    const version1Doc = createTrustedServerEvidenceFixture({
      documentStorageId: 'DOC-STORE-VER-001',
      documentVersion: 1
    });
    const modifiedVersionDoc = {
      ...version1Doc,
      documentVersion: 2 // Client altered document version
    };
    const res = validateJurisdictionEvidence(modifiedVersionDoc);
    expect(res.isValid).toBe(false);
    expect(res.blockerCode).toBe('ERR_DOCUMENT_VERSION_STALE');
    expect(res.reason).toContain('does not match verified server generation');
  });

  it('133. Stage 1 Revision 11 Adversarial 7: Genuine file hash with civil document submitted to prove real property territory fails with ERR_INVALID_PROPERTY_EVIDENCE', () => {
    expect(() => {
      registerAndVerifyEvidence({
        user: { uid: 'usr-test-101' },
        willId: 'will-test-101',
        documentStorageId: 'DOC-STORE-CIVIL-AS-PROP-001',
        documentBytes: Buffer.from('Genuine PDF Bytes of Domicile Certificate'),
        documentMetadata: {
          documentType: JURISDICTION_DOCUMENT_TYPES.REST_OF_INDIA_DOMICILE_CERTIFICATE,
          documentRef: 'DOM-1234/2021',
          issuingAuthority: 'Tahsildar',
          verifiedParties: 'Testator'
        },
        reviewer: {
          verifiedBy: 'Advocate Carlos Pereira',
          reviewerRole: 'ADVOCATE',
          enrollmentNumber: 'GOA/123/2005',
          credentialVerified: true
        },
        claimedStatutoryFact: 'HISTORICAL_TERRITORY_PROPERTY' // False statutory fact for a domicile cert!
      });
    }).toThrow('ERR_INVALID_PROPERTY_EVIDENCE');
  });

  it('134. Stage 1 Revision 11 Adversarial 8: Invalid Bar enrollment number or unauthorized reviewer role fails with ERR_INVALID_BAR_CREDENTIALS or ERR_UNAUTHORIZED_REVIEWER_ROLE', () => {
    expect(() => {
      registerAndVerifyEvidence({
        user: { uid: 'usr-test-101' },
        willId: 'will-test-101',
        documentStorageId: 'DOC-STORE-BAD-BAR-001',
        documentBytes: Buffer.from('Valid Document Bytes'),
        documentMetadata: { documentType: 'CTS_PROPERTY_CARD' },
        reviewer: {
          verifiedBy: 'Bogus Verifier',
          reviewerRole: 'ADVOCATE',
          enrollmentNumber: 'NOT-BAR-999' // Invalid Bar format!
        }
      });
    }).toThrow('ERR_INVALID_BAR_CREDENTIALS');

    expect(() => {
      registerAndVerifyEvidence({
        user: { uid: 'usr-test-101' },
        willId: 'will-test-101',
        documentStorageId: 'DOC-STORE-BAD-ROLE-001',
        documentBytes: Buffer.from('Valid Document Bytes'),
        documentMetadata: { documentType: 'CTS_PROPERTY_CARD' },
        reviewer: {
          verifiedBy: 'Office Assistant',
          reviewerRole: 'CLERK', // Unauthorized role!
          enrollmentNumber: 'CLERK/123'
        }
      });
    }).toThrow('ERR_UNAUTHORIZED_REVIEWER_ROLE');
  });

  it('135. Stage 1 Revision 11 Adversarial 9: Shariat declaration with fabricated form string returns ERR_SHARIAT_SEC3_DEFECTIVE', () => {
    const fabricatedFormDoc = {
      ...sampleShariatDeclarationRecord,
      formType: 'FORM_B_CUSTOM_DECLARATION' // Fabricated form string
    };
    const res = validateShariatDeclarationRecord(fabricatedFormDoc, {
      fullName: 'Tariq Aziz',
      dob: '1980-01-01',
      contractCompetent: true,
      addressState: 'Uttar Pradesh'
    });
    expect(res.isValid).toBe(false);
    expect(res.blockerCode).toBe('ERR_SHARIAT_SEC3_DEFECTIVE');
    expect(res.reason).toContain('FORM_A_SHARIAT_SECTION_3');
  });

  it('136. Stage 1 Revision 11 Adversarial 10: Declarant under 18 at declaration date fails with ERR_SHARIAT_SEC3_INCOMPETENT despite client competenceVerified: true', () => {
    const minorDeclarantRecord = {
      ...sampleShariatDeclarationRecord,
      declarationDate: '2022-03-15',
      competenceVerified: true // Client asserts competence
    };
    const res = validateShariatDeclarationRecord(minorDeclarantRecord, {
      fullName: 'Tariq Aziz',
      dob: '2010-01-01', // Declarant was 12 years old on 2022-03-15!
      contractCompetent: true, // Client asserts competence
      addressState: 'Uttar Pradesh'
    });
    expect(res.isValid).toBe(false);
    expect(res.blockerCode).toBe('ERR_SHARIAT_SEC3_INCOMPETENT');
    expect(res.reason).toContain('under 18 years of age on the statutory declaration date');
  });

  it('137. Stage 1 Revision 11 Adversarial 11: Goa resident declarant without declarant own verified non-Goan domicile certificate fails with ERR_SHARIAT_SEC3_RESIDENCE_UNVERIFIED', () => {
    const goaDecl = {
      ...sampleShariatDeclarationRecord,
      residenceTerritory: 'Goa',
      isGoanDomicile: false // Bare boolean assertion
    };
    const res = validateShariatDeclarationRecord(goaDecl, {
      fullName: 'Tariq Aziz',
      dob: '1980-01-01',
      contractCompetent: true,
      addressState: 'Goa'
      // No declarant-specific non-Goan domicile certificate!
    });
    expect(res.isValid).toBe(false);
    expect(res.blockerCode).toBe('ERR_SHARIAT_SEC3_RESIDENCE_UNVERIFIED');
    expect(res.reason).toContain('Jose Paulo Coutinho');
  });

  it('138. Stage 1 Revision 11 Adversarial 12: Section 57 willExecutionPlace set to Unknown, N/A, or < 3 chars fails with ERR_WILL_EXECUTION_PLACE_REQUIRED', () => {
    const invalidPlaces = ['Unknown', 'N/A', 'NA', 'none', '  ', 'ab'];
    for (const place of invalidPlaces) {
      const willData = {
        personal: {
          fullName: 'Rameshwar Sharma',
          pob: 'Varanasi, UP',
          parentsPortugueseRegime: false,
          parentsRestOfIndiaGoverned: true,
          parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
          religion: 'Hindu',
          willExecutionDate: '2026-06-15',
          willExecutionPlace: place
        },
        assets: []
      };
      const res = resolvePersonalLawRegime(willData);
      expect(res.regime).toBe(PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED);
      expect(res.blockers[0]).toContain('ERR_WILL_EXECUTION_PLACE_REQUIRED');
    }
  });

  it('139. Stage 1 Revision 11 Adversarial 13: Section 57 will with assets undefined without negative declaration fails with ERR_ASSET_INVENTORY_REQUIRED', () => {
    const willData = {
      personal: {
        fullName: 'Rameshwar Sharma',
        pob: 'Varanasi, UP',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: 'Hindu',
        willExecutionDate: '2026-06-15',
        willExecutionPlace: 'Varanasi, UP'
        // assets omitted entirely!
      }
    };
    const res = resolvePersonalLawRegime(willData);
    expect(res.regime).toBe(PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED);
    expect(res.blockers[0]).toContain('ERR_ASSET_INVENTORY_REQUIRED');
    expect(res.reasons.some(r => r.includes('Asset inventory is missing or unrecorded'))).toBe(true);
  });

  it('140. Stage 1 Revision 11 Adversarial 14: Property evidence registered for parcel SURVEY-456 submitted for asset SURVEY-123 fails with ERR_PARCEL_MISMATCH', () => {
    const parcel456Evidence = createTrustedServerEvidenceFixture({
      documentStorageId: 'DOC-STORE-PARCEL-456',
      documentRef: 'CTS-CARD-456',
      documentType: 'CTS_PROPERTY_CARD',
      parcelId: 'SURVEY-456',
      claimedStatutoryFact: 'HISTORICAL_TERRITORY_PROPERTY'
    });
    const willData = {
      personal: {
        fullName: 'Narayan Rao',
        pob: 'Bombay',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: 'Hindu',
        willExecutionDate: '2026-06-15',
        willExecutionPlace: 'Pune'
      },
      assets: [
        {
          id: 'asset-123',
          type: 'Plot',
          surveyNumber: 'SURVEY-123', // Mismatched parcel!
          location: 'South Mumbai',
          historicalTerritoryCode: HISTORICAL_PRESIDENCY_CODES.BOMBAY_OOCJ,
          historicalTerritoryEvidence: parcel456Evidence
        }
      ]
    };
    const res = resolvePersonalLawRegime(willData);
    expect(res.regime).toBe(PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED);
    expect(res.blockers.some(b => b.includes('ERR_PARCEL_MISMATCH'))).toBe(true);
  });

  it('141. Stage 1 Revision 11 Adversarial 15: Generic civil record submitted for land classification fails with ERR_AGRICULTURAL_LAND_CLASSIFICATION_UNCERTAIN', () => {
    const civilDocForLand = createTrustedServerEvidenceFixture({
      documentStorageId: 'DOC-STORE-CIVIL-AS-LAND-001',
      documentRef: 'DOMICILE-1980/12',
      documentType: JURISDICTION_DOCUMENT_TYPES.REST_OF_INDIA_DOMICILE_CERTIFICATE, // Inadmissible doc type for land!
      verifiedParties: 'Imtiaz Khan'
    });
    const willData = {
      personal: {
        fullName: 'Imtiaz Khan',
        pob: 'Lucknow, UP',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: 'Muslim',
        sect: 'Sunni',
        dob: '1980-01-01',
        shariatDeclarationRecord: sampleShariatDeclarationRecord
      },
      assets: [
        {
          id: 'plot-1',
          type: 'Plot',
          desc: 'Plot No. 12, Gulmohar Enclave',
          revenueClassification: 'NON_AGRICULTURAL',
          classificationEvidence: civilDocForLand
        }
      ]
    };
    const res = resolvePersonalLawRegime(willData);
    expect(res.regime).toBe(PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED);
    expect(res.blockers.some(b => b.includes('ERR_AGRICULTURAL_LAND_CLASSIFICATION_UNCERTAIN'))).toBe(true);
    expect(res.reasons.some(r => r.includes("Unrecognized document type 'REST_OF_INDIA_DOMICILE_CERTIFICATE'"))).toBe(true);
  });

  it('142. Stage 1 Revision 11 Adversarial 16: Muslim will with assets undefined without negative declaration fails with ERR_ASSET_INVENTORY_REQUIRED', () => {
    const willData = {
      personal: {
        fullName: 'Imtiaz Khan',
        pob: 'Lucknow, UP',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: 'Muslim',
        sect: 'Sunni',
        dob: '1980-01-01',
        shariatDeclarationRecord: sampleShariatDeclarationRecord
        // assets omitted entirely!
      }
    };
    const res = resolvePersonalLawRegime(willData);
    expect(res.regime).toBe(PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED);
    expect(res.blockers[0]).toContain('ERR_ASSET_INVENTORY_REQUIRED');
    expect(res.reasons.some(r => r.includes('Asset inventory is missing or unrecorded'))).toBe(true);
  });

  // ── REVISION 12 BACKEND SECURITY RECONSTRUCTION & ADVERSARIAL INTEGRATION TESTS ──

  it('143. Stage 1 Revision 12 Adversarial 17: Unauthenticated call to classifyGoaJurisdiction with evidence returns ERR_UNAUTHENTICATED_EVIDENCE_CONTEXT', () => {
    const resNoAuth = rawClassifyGoaJurisdiction({
      pob: 'Margao, Goa',
      dob: '1958-04-12',
      pre1961PortugueseRegime: true,
      clauseAEvidence: sampleClauseAEvidence
    }, null);

    expect(resNoAuth.status).toBe(JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED);
    expect(resNoAuth.canGenerateWill).toBe(false);
    expect(resNoAuth.blockers[0]).toContain('ERR_UNAUTHENTICATED_EVIDENCE_CONTEXT');

    const resEmptyAuth = rawClassifyGoaJurisdiction({
      pob: 'Margao, Goa',
      dob: '1958-04-12',
      pre1961PortugueseRegime: true,
      clauseAEvidence: sampleClauseAEvidence
    }, {});
    expect(resEmptyAuth.status).toBe(JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED);
    expect(resEmptyAuth.blockers[0]).toContain('ERR_UNAUTHENTICATED_EVIDENCE_CONTEXT');
  });

  it('144. Stage 1 Revision 12 Adversarial 18: Unauthenticated call to resolvePersonalLawRegime with Shariat Section 3 declaration fails with ERR_UNAUTHENTICATED_EVIDENCE_CONTEXT', () => {
    const willData = {
      personal: {
        fullName: 'Imtiaz Khan',
        pob: 'Lucknow, UP',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: 'Muslim',
        sect: 'Sunni',
        dob: '1980-01-01',
        shariatDeclarationRecord: sampleShariatDeclarationRecord
      },
      assets: [
        {
          id: 'plot-1',
          type: 'Plot',
          desc: 'Plot No. 12, Gulmohar Enclave',
          revenueClassification: 'NON_AGRICULTURAL',
          classificationEvidence: sampleRevenueClassificationEvidence
        }
      ]
    };

    const res = rawResolvePersonalLawRegime(willData, null);
    expect(res.regime).toBe(PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED);
    expect(res.blockers.some(b => b.includes('ERR_UNAUTHENTICATED_EVIDENCE_CONTEXT'))).toBe(true);
  });

  it('145. Stage 1 Revision 12 Adversarial 19: Forged evidence ticket with invalid HMAC signature rejected with ERR_FORGED_EVIDENCE_TICKET', () => {
    const validTicket = sampleClauseAEvidence.serverVerificationTicket;
    const tamperedEvidence = {
      ...sampleClauseAEvidence,
      serverVerificationTicket: {
        ...validTicket,
        claimedStatutoryFact: 'ALTERED_FACT_FORGERY',
        serverSignature: 'a'.repeat(64)
      }
    };

    const res = validateJurisdictionEvidence(
      tamperedEvidence,
      [JURISDICTION_DOCUMENT_TYPES.HISTORICAL_PORTUGUESE_CIVIL_RECORD]
    );

    expect(res.isValid).toBe(false);
    expect(res.blockerCode).toBe('ERR_FORGED_EVIDENCE_TICKET');
    expect(res.reason).toContain('Server verification ticket signature');
  });

  it('146. Stage 1 Revision 12 Adversarial 20: Naked boolean noAssets or noImmovableProperty fails closed with ERR_ASSET_INVENTORY_REQUIRED', () => {
    const hinduNakedBool = {
      personal: {
        fullName: 'Ramesh Sharma',
        pob: 'Varanasi, UP',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: 'Hindu',
        willExecutionDate: '2026-06-15',
        willExecutionPlace: 'Varanasi, UP',
        noImmovableProperty: true
      }
    };
    const resHindu = resolvePersonalLawRegime(hinduNakedBool);
    expect(resHindu.regime).toBe(PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED);
    expect(resHindu.blockers[0]).toContain('ERR_ASSET_INVENTORY_REQUIRED');

    const muslimNakedBool = {
      personal: {
        fullName: 'Imtiaz Khan',
        pob: 'Lucknow, UP',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: 'Muslim',
        sect: 'Sunni',
        dob: '1980-01-01',
        shariatDeclarationRecord: sampleShariatDeclarationRecord,
        noAssets: true
      }
    };
    const resMuslim = resolvePersonalLawRegime(muslimNakedBool);
    expect(resMuslim.regime).toBe(PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED);
    expect(resMuslim.blockers[0]).toContain('ERR_ASSET_INVENTORY_REQUIRED');
  });

  it('147. Stage 1 Revision 12 Adversarial 21: Client and public assets are completely free of server secrets and fixture generators', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');

    function searchDirForSecrets(dirPath) {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          searchDirForSecrets(fullPath);
        } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.cjs') || entry.name.endsWith('.html'))) {
          const content = fs.readFileSync(fullPath, 'utf8');
          const legacyRev11Key = ['smartwill', 'secret', 'key', '2026'].join('-');
          expect(content).not.toContain(legacyRev11Key);
          if (dirPath.includes('js') && !dirPath.includes('server') && !dirPath.includes('tests') && !dirPath.includes('functions')) {
            expect(content).not.toContain('createTrustedServerEvidenceFixture');
          }
        }
      }
    }

    const jsDir = path.resolve(process.cwd(), 'js');
    searchDirForSecrets(jsDir);
  });

  it('148. Stage 1 Revision 12 Adversarial 22: Server evidence verification engine enforces authoritative reviewer validation and raw byte hashing', async () => {
    const { registerAndVerifyEvidence } = await import('../../server/evidenceVerificationEngine.cjs');
    
    // 1. Unverified reviewer role rejected
    expect(() => registerAndVerifyEvidence({
      user: { uid: 'user-audit-123' },
      willId: 'will-audit-456',
      documentStorageId: 'DOC-123',
      documentBytes: 'test bytes content',
      reviewer: { verifiedBy: 'John Doe', reviewerRole: 'NOTARY_ASSISTANT' }
    })).toThrow(/ERR_UNAUTHORIZED_REVIEWER_ROLE/);

    // 2. Verified reviewer produces valid ticket with correct byte hash
    const validResult = registerAndVerifyEvidence({
      user: { uid: 'user-audit-123' },
      willId: 'will-audit-456',
      documentStorageId: 'DOC-STORE-123',
      documentBytes: 'statutory-document-raw-bytes-sample',
      documentMetadata: { documentType: 'HISTORICAL_PORTUGUESE_CIVIL_RECORD' },
      reviewer: {
        verifiedBy: 'Advocate Carlos Pereira, Bar of Goa',
        reviewerRole: 'ADVOCATE',
        enrollmentNumber: 'GOA/123/2005'
      }
    });

    expect(validResult).toBeDefined();
    expect(validResult.verificationTicketId).toMatch(/^TICKET-/);
    expect(validResult.serverSignature).toHaveLength(64);
    expect(validResult.userId).toBe('user-audit-123');
    expect(validResult.willId).toBe('will-audit-456');
  });

  it('149. Stage 1 Revision 12 Adversarial 23: Vercel serverless endpoint /api/verify-evidence enforces authentication and willId binding', async () => {
    const verifyEvidenceHandler = (await import('../../api/verify-evidence.js')).default || (await import('../../api/verify-evidence.js'));

    // Test rejection of non-POST
    let statusSet = 0;
    const mockResGet = {
      setHeader: () => {},
      status: (code) => { statusSet = code; return { json: () => {}, end: () => {} }; },
      json: () => {}
    };
    await verifyEvidenceHandler({ method: 'GET', headers: {} }, mockResGet);
    expect(statusSet).toBe(405);

    // Test rejection of unauthenticated POST
    let unauthStatus = 0;
    const mockResUnauth = {
      setHeader: () => {},
      status: (code) => { unauthStatus = code; return { json: () => {}, end: () => {} }; },
      json: () => {}
    };
    await verifyEvidenceHandler({ method: 'POST', headers: {}, body: {} }, mockResUnauth);
    expect(unauthStatus).toBe(401);
  });

  it('150. Stage 1 Revision 12 Adversarial 24: Cloud Function verifyEvidence enforces authentication and validates storage identity', async () => {
    const { verifyEvidence } = await import('../../functions/verifyEvidence.js');
    
    // Unauthenticated caller throws ERR_UNAUTHENTICATED_REQUEST
    await expect(verifyEvidence.run({}, { auth: null })).rejects.toThrow(/ERR_UNAUTHENTICATED_REQUEST/);

    // Missing willId throws ERR_WILL_BINDING_REQUIRED
    await expect(verifyEvidence.run({}, { auth: { uid: 'test-user-id', token: {} } })).rejects.toThrow(/ERR_WILL_BINDING_REQUIRED/);
  }, 20000);

  it('151. Stage 1 Revision 13 Adversarial 25: Missing signing secret in backend environment fails closed with ERR_SIGNING_KEY_UNAVAILABLE', async () => {
    const { registerAndVerifyEvidence } = await import('../../functions/evidenceVerificationEngine.cjs');
    const originalKey = process.env.SMARTWILL_EVIDENCE_SIGNING_KEY;
    try {
      delete process.env.SMARTWILL_EVIDENCE_SIGNING_KEY;
      expect(() => registerAndVerifyEvidence({
        user: { uid: 'u1' },
        willId: 'w1',
        documentStorageId: 'DOC-1',
        documentBytes: 'test bytes',
        reviewer: { verifiedBy: 'Advocate A', reviewerRole: 'ADVOCATE', enrollmentNumber: 'GOA/123/2005', authoritativeRegistryConfirmed: true }
      })).toThrow(/ERR_SIGNING_KEY_UNAVAILABLE/);
    } finally {
      process.env.SMARTWILL_EVIDENCE_SIGNING_KEY = originalKey;
    }
  });

  it('152. Stage 1 Revision 13 Adversarial 26: Submitting client-supplied documentBytes to verifyEvidence is strictly rejected with ERR_CLIENT_BYTES_PROHIBITED', async () => {
    const { verifyEvidence } = await import('../../functions/verifyEvidence.js');
    await expect(verifyEvidence.run({
      willId: 'will-101',
      documentStorageId: 'DOC-101',
      documentBytes: 'client-supplied-raw-content'
    }, {
      auth: { uid: 'usr-101', token: {} }
    })).rejects.toThrow(/ERR_CLIENT_BYTES_PROHIBITED/);
  }, 20000);

  it('153. Stage 1 Revision 13 Adversarial 27: Cross-user will access is strictly rejected with ERR_FORBIDDEN_WILL_ACCESS', async () => {
    const { verifyEvidence } = await import('../../functions/verifyEvidence.js');

    const mockDb = {
      collection: (colName) => ({
        doc: () => ({
          get: async () => ({
            exists: true,
            data: () => ({ userId: 'usr-bob-999' })
          })
        })
      })
    };

    await expect(verifyEvidence.run({
      willId: 'will-owned-by-bob',
      documentStorageId: 'DOC-STORAGE-123'
    }, {
      auth: { uid: 'usr-alice-111', token: {} },
      db: mockDb
    })).rejects.toThrow(/ERR_FORBIDDEN_WILL_ACCESS/);
  });

  it('154. Stage 1 Revision 13 Adversarial 28: Storage object belonging to another will or user is rejected with ERR_CROSS_WILL_DOCUMENT_STORAGE', async () => {
    const { verifyEvidence } = await import('../../functions/verifyEvidence.js');

    const mockDb = {
      collection: (colName) => ({
        doc: () => ({
          get: async () => ({
            exists: true,
            data: () => ({ userId: 'usr-alice-111' })
          })
        })
      })
    };

    const mockBucket = {
      file: () => ({
        exists: async () => [true],
        getMetadata: async () => [{
          metadata: {
            userId: 'usr-alice-111',
            willId: 'will-different-999'
          }
        }],
        download: async () => [Buffer.from('real-storage-bytes')]
      })
    };

    await expect(verifyEvidence.run({
      willId: 'will-alice-111',
      documentStorageId: 'DOC-STORAGE-CROSS'
    }, {
      auth: { uid: 'usr-alice-111', token: {} },
      db: mockDb,
      bucket: mockBucket
    })).rejects.toThrow(/ERR_CROSS_WILL_DOCUMENT_STORAGE/);
  });

  it('155. Stage 1 Revision 13 Adversarial 29: Missing cryptographic verifier in client validator fails closed with ERR_CRYPTO_VERIFIER_UNAVAILABLE', async () => {
    const { verifyTicketSignature } = await import('../../functions/evidenceVerificationEngine.cjs');

    try {
      // Temporarily deregister verifier
      setCryptographicTicketVerifier(null);

      const testTicketEvidence = {
        documentStorageId: 'DOC-123',
        serverVerificationTicket: {
          verificationTicketId: 'TICKET-123',
          userId: 'usr-default-101',
          willId: 'will-default-202',
          serverSignature: 'a'.repeat(64),
          serverComputedHash: 'b'.repeat(64)
        }
      };

      const res = validateEvidenceRecordAgainstServer(testTicketEvidence, {
        userId: 'usr-default-101',
        willId: 'will-default-202'
      });

      expect(res.isValid).toBe(false);
      expect(res.blockerCode).toBe('ERR_CRYPTO_VERIFIER_UNAVAILABLE');
    } finally {
      // Restore authoritative verifier
      setCryptographicTicketVerifier(verifyTicketSignature);
    }
  });

  it('156. Stage 1 Revision 13 Adversarial 30: Reviewer without authoritative Bar Council registry confirmation marked PENDING_MANUAL_VERIFICATION', async () => {
    const { registerAndVerifyEvidence: regEngine } = await import('../../functions/evidenceVerificationEngine.cjs');

    const unconfirmedTicket = regEngine({
      user: { uid: 'usr-default-101' },
      willId: 'will-default-202',
      documentStorageId: 'DOC-STORE-UNCONFIRMED',
      documentBytes: Buffer.from('authentic legal document content'),
      reviewer: {
        verifiedBy: 'Advocate Ramesh Joshi',
        reviewerRole: 'ADVOCATE',
        enrollmentNumber: 'MAH/999/2010',
        authoritativeRegistryConfirmed: false
      }
    });

    expect(unconfirmedTicket.reviewer.credentialVerified).toBe(false);
    expect(unconfirmedTicket.reviewer.verificationStatus).toBe('PENDING_MANUAL_VERIFICATION');
  });

  it('157. Stage 1 Revision 13 Adversarial 31: Empty asset array assets: [] without server-verified completeness attestation fails closed with ERR_ASSET_INVENTORY_REQUIRED', () => {
    // Muslim Shariat Section 2 pathway
    const muslimEmptyAssets = {
      personal: {
        fullName: 'Mohammed Ali',
        pob: 'Lucknow, UP',
        dob: '1980-01-01',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: 'Muslim',
        sect: 'Sunni',
        shariatDeclarationRecord: sampleShariatDeclarationRecord
      },
      assets: []
    };
    const resMuslim = resolvePersonalLawRegime(muslimEmptyAssets);
    expect(resMuslim.regime).toBe(PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED);
    expect(resMuslim.blockers[0]).toContain('ERR_ASSET_INVENTORY_REQUIRED');

    // Hindu Section 57(b) pathway
    const hinduEmptyAssets = {
      personal: {
        fullName: 'Ramesh Sharma',
        pob: 'Varanasi, UP',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: 'Hindu',
        willExecutionDate: '2026-06-15',
        willExecutionPlace: 'Varanasi, UP'
      },
      assets: []
    };
    const resHindu = resolvePersonalLawRegime(hinduEmptyAssets);
    expect(resHindu.regime).toBe(PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED);
    expect(resHindu.blockers[0]).toContain('ERR_ASSET_INVENTORY_REQUIRED');
  });

  it('158. Stage 1 Revision 13 Adversarial 32: Fabricated auditSessionId without valid server ticket fails closed with ERR_ASSET_INVENTORY_REQUIRED', () => {
    const fabricatedDeclaration = {
      personal: {
        fullName: 'Imtiaz Khan',
        pob: 'Lucknow, UP',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: 'Muslim',
        sect: 'Sunni',
        dob: '1980-01-01',
        shariatDeclarationRecord: sampleShariatDeclarationRecord,
        assetInventoryDeclaration: {
          hasNoAssets: true,
          declarationSigned: true,
          declarationDate: '2026-04-10',
          verifiedCompletenessAudit: true,
          auditSessionId: 'SESSION-FABRICATED-789'
        }
      },
      assets: []
    };

    const res = resolvePersonalLawRegime(fabricatedDeclaration);
    expect(res.regime).toBe(PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED);
    expect(res.blockers[0]).toContain('ERR_ASSET_INVENTORY_REQUIRED');
  });

  it('159. Stage 1 Revision 13 Adversarial 33: Complete repository, backend, and dist secret scan asserts ZERO hardcoded signing keys', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');

    const FORBIDDEN_SECRETS = [
      ['smartwill', 'secret', 'key', '2026'].join('-'),
      ['SMARTWILL', 'SERVER', 'SECRET', 'REV12', '9f82a4c17e384b0d'].join('_')
    ];

    const DIRS_TO_SCAN = ['js', 'server', 'functions', 'api', 'dist'];

    for (const dir of DIRS_TO_SCAN) {
      const fullDir = path.resolve(process.cwd(), dir);
      if (!fs.existsSync(fullDir)) continue;

      function scan(currentPath) {
        const entries = fs.readdirSync(currentPath, { withFileTypes: true });
        for (const entry of entries) {
          const entryPath = path.join(currentPath, entry.name);
          if (entry.isDirectory()) {
            if (entry.name !== 'node_modules') scan(entryPath);
          } else if (entry.isFile() && /\.(js|cjs|mjs|json|html)$/.test(entry.name)) {
            const content = fs.readFileSync(entryPath, 'utf8');
            for (const secret of FORBIDDEN_SECRETS) {
              expect(content).not.toContain(secret);
            }
          }
        }
      }
      scan(fullDir);
    }
  });

  it('160. Stage 1 Revision 13 Adversarial 34: Functions and Vercel endpoints self-contained and free of parent-directory imports', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');

    // 1. Verify functions/package has self-contained evidenceVerificationEngine.cjs
    const funcEnginePath = path.resolve(process.cwd(), 'functions/evidenceVerificationEngine.cjs');
    expect(fs.existsSync(funcEnginePath)).toBe(true);

    const funcVerifyContent = fs.readFileSync(path.resolve(process.cwd(), 'functions/verifyEvidence.js'), 'utf8');
    // Must NOT contain parent directory traversal to server
    expect(funcVerifyContent).not.toContain('../server/evidenceVerificationEngine');
    expect(funcVerifyContent).toContain('./evidenceVerificationEngine.cjs');

    // 2. Verify api/verify-evidence.js exports handler
    const vercelHandler = await import('../../api/verify-evidence.js');
    expect(typeof (vercelHandler.default || vercelHandler)).toBe('function');
  });

  it('161. Stage 1 Revision 14 Adversarial 35 (P0-1): Complete ticket canonical payload tampering protection', async () => {
    const { registerAndVerifyEvidence: regEngine, verifyTicketSignature } = await import('../../functions/evidenceVerificationEngine.cjs');

    const originalTicket = regEngine({
      user: { uid: 'usr-audit-101' },
      willId: 'will-audit-202',
      documentStorageId: 'DOC-AUTHENTIC-101',
      documentBytes: Buffer.from('canonical statutory document content'),
      documentMetadata: {
        documentType: 'TITLE_DEED_REGISTERED',
        documentRef: 'DEED-992/2020',
        issuingAuthority: 'Sub-Registrar of Margao',
        issueDate: '2020-05-15',
        verifiedParties: 'Dr. Joseph Fernandes'
      },
      reviewer: {
        verifiedBy: 'Advocate Carlos Pereira',
        reviewerRole: 'ADVOCATE',
        enrollmentNumber: 'GOA/123/2005'
      },
      storageGeneration: '88123049182',
      claimedStatutoryFact: 'HISTORICAL_TERRITORY_PROPERTY'
    });

    expect(verifyTicketSignature(originalTicket)).toBe(true);

    // Tampering test for EVERY security-relevant field individually:
    const fieldsToTamper = [
      { field: 'verifiedParties', altered: 'Fabricated Testator' },
      { field: 'documentType', altered: 'CONVERSION_CERTIFICATE' },
      { field: 'documentRef', altered: 'FORGED-REF-999' },
      { field: 'issuingAuthority', altered: 'Bogus Authority' },
      { field: 'issueDate', altered: '2025-01-01' },
      { field: 'storageGeneration', altered: '99999999999' },
      { field: 'documentVersion', altered: 9 },
      { field: 'serverComputedHash', altered: 'f'.repeat(64) },
      { field: 'userId', altered: 'usr-intruder-666' },
      { field: 'willId', altered: 'will-foreign-777' },
      { field: 'claimedStatutoryFact', altered: 'NON_AGRICULTURAL' },
      { field: 'statutoryFactEstablished', altered: true },
      { field: 'verificationStatus', altered: 'VERIFIED' },
      { field: 'verifiedAt', altered: '2026-11-04T00:00:00.000Z' },
      { field: 'verificationTicketId', altered: 'TICKET-FORGED-000' }
    ];

    for (const { field, altered } of fieldsToTamper) {
      const tampered = { ...originalTicket, [field]: altered };
      expect(verifyTicketSignature(tampered)).toBe(false);
    }

    // Tampering reviewer fields inside reviewer sub-object:
    const reviewerFieldsToTamper = [
      { field: 'reviewerRole', altered: 'HIGH_COURT_ADVOCATE' },
      { field: 'enrollmentNumber', altered: 'MAH/888/2012' },
      { field: 'verifiedBy', altered: 'Fabricated Advocate' },
      { field: 'credentialVerified', altered: true },
      { field: 'verificationStatus', altered: 'VERIFIED' }
    ];

    for (const { field, altered } of reviewerFieldsToTamper) {
      const tampered = {
        ...originalTicket,
        reviewer: { ...originalTicket.reviewer, [field]: altered }
      };
      expect(verifyTicketSignature(tampered)).toBe(false);
    }
  });

  it('162. Stage 1 Revision 14 Adversarial 36 (P0-2): Client-supplied reviewer verification flags are strictly stripped and rejected', async () => {
    const { registerAndVerifyEvidence: regEngine } = await import('../../functions/evidenceVerificationEngine.cjs');

    // Attacker crafts client request containing fabricated advocate with all verification flags set to true
    const clientForgedPayload = {
      user: { uid: 'usr-attacker-007' },
      willId: 'will-target-101',
      documentStorageId: 'DOC-SPOOF-001',
      documentBytes: Buffer.from('unverified document bytes'),
      reviewer: {
        verifiedBy: 'Self-Claimed Bar Council Advocate',
        reviewerRole: 'ADVOCATE',
        enrollmentNumber: 'MAH/555/2015',
        authoritativeRegistryConfirmed: true,
        barCouncilVerified: true,
        credentialVerified: true
      }
    };

    const result = regEngine(clientForgedPayload);

    // Backend must NEVER trust client booleans
    expect(result.reviewer.credentialVerified).toBe(false);
    expect(result.reviewer.verificationStatus).toBe('PENDING_MANUAL_VERIFICATION');
    expect(result.statutoryFactEstablished).toBe(false);
    expect(result.verificationStatus).toBe('PENDING_REVIEWER_VERIFICATION');
  });

  it('163. Stage 1 Revision 14 Adversarial 37 (P0-3): Storage metadata absence, path traversal, and generation binding', async () => {
    const { verifyEvidence } = await import('../../functions/verifyEvidence.js');

    const mockDb = {
      collection: () => ({
        doc: () => ({
          get: async () => ({
            exists: true,
            data: () => ({ userId: 'usr-owner-101' })
          }),
          set: async () => {}
        })
      }),
      batch: () => ({
        set: () => {},
        commit: async () => {}
      })
    };

    // 1. Path traversal rejected with ERR_FORBIDDEN_STORAGE_PATH
    await expect(verifyEvidence.run({
      willId: 'will-owner-101',
      documentStorageId: '../../etc/passwd'
    }, {
      auth: { uid: 'usr-owner-101', token: {} },
      db: mockDb
    })).rejects.toThrow(/ERR_FORBIDDEN_STORAGE_PATH/);

    // 2. Missing metadata.userId fails closed with ERR_STORAGE_METADATA_MISSING
    const bucketMissingUser = {
      file: () => ({
        exists: async () => [true],
        getMetadata: async () => [{ metadata: { willId: 'will-owner-101' } }],
        download: async () => [Buffer.from('document-content')]
      })
    };
    await expect(verifyEvidence.run({
      willId: 'will-owner-101',
      documentStorageId: 'users/usr-owner-101/doc.pdf'
    }, {
      auth: { uid: 'usr-owner-101', token: {} },
      db: mockDb,
      bucket: bucketMissingUser
    })).rejects.toThrow(/ERR_STORAGE_METADATA_MISSING/);

    // 3. Missing metadata.willId fails closed with ERR_STORAGE_METADATA_MISSING
    const bucketMissingWill = {
      file: () => ({
        exists: async () => [true],
        getMetadata: async () => [{ metadata: { userId: 'usr-owner-101' } }],
        download: async () => [Buffer.from('document-content')]
      })
    };
    await expect(verifyEvidence.run({
      willId: 'will-owner-101',
      documentStorageId: 'users/usr-owner-101/doc.pdf'
    }, {
      auth: { uid: 'usr-owner-101', token: {} },
      db: mockDb,
      bucket: bucketMissingWill
    })).rejects.toThrow(/ERR_STORAGE_METADATA_MISSING/);

    // 4. Object generation is bound from actual GCS metadata
    const bucketWithGeneration = {
      file: () => ({
        exists: async () => [true],
        getMetadata: async () => [{
          generation: '16928374829104',
          metadata: { userId: 'usr-owner-101', willId: 'will-owner-101' }
        }],
        download: async () => [Buffer.from('real-statutory-deed-bytes')]
      })
    };
    const validRun = await verifyEvidence.run({
      willId: 'will-owner-101',
      documentStorageId: 'users/usr-owner-101/wills/will-owner-101/deed.pdf',
      documentMetadata: { documentType: 'TITLE_DEED_REGISTERED' },
      reviewer: { verifiedBy: 'Advocate Pereira', reviewerRole: 'ADVOCATE', enrollmentNumber: 'GOA/123/2005' }
    }, {
      auth: { uid: 'usr-owner-101', token: {} },
      db: mockDb,
      bucket: bucketWithGeneration
    });
    expect(validRun.success).toBe(true);
    expect(validRun.ticket.storageGeneration).toBe('16928374829104');
  });

  it('164. Stage 1 Revision 14 Adversarial 38 (P1-1 & P1-2): Mandatory asynchronous Firestore persistence and fail-closed persistence failures', async () => {
    const { registerAndVerifyEvidence: regEngine, getTicketFromFirestore, persistTicketToFirestore } = await import('../../functions/evidenceVerificationEngine.cjs');

    let ticketStored = null;
    let auditStored = null;
    const mockDbSuccess = {
      batch: () => ({
        set: (ref, data) => {
          if (ref.path.includes('evidenceTickets')) ticketStored = data;
          if (ref.path.includes('evidenceAuditLogs')) auditStored = data;
        },
        commit: async () => {}
      }),
      collection: (name) => ({
        doc: (id) => ({
          path: `${name}/${id}`,
          get: async () => ({
            exists: true,
            data: () => ticketStored
          })
        })
      })
    };

    const ticket = await regEngine({
      user: { uid: 'usr-persist-101' },
      willId: 'will-persist-202',
      documentStorageId: 'DOC-PERSIST-101',
      documentBytes: Buffer.from('persisted statutory content'),
      reviewer: { verifiedBy: 'Advocate A', reviewerRole: 'ADVOCATE', enrollmentNumber: 'GOA/123/2005' },
      db: mockDbSuccess
    });

    expect(ticket).toBeDefined();
    expect(ticketStored).toBeDefined();
    expect(ticketStored.verificationTicketId).toBe(ticket.verificationTicketId);
    expect(auditStored).toBeDefined();
    expect(auditStored.ticketId).toBe(ticket.verificationTicketId);

    // Retrieve persisted ticket
    const retrieved = await getTicketFromFirestore(ticket.verificationTicketId, mockDbSuccess);
    expect(retrieved).toBeDefined();
    expect(retrieved.verificationTicketId).toBe(ticket.verificationTicketId);

    // Tampered record in Firestore throws ERR_PERSISTED_TICKET_TAMPERED
    const mockDbTampered = {
      collection: () => ({
        doc: () => ({
          get: async () => ({
            exists: true,
            data: () => ({ ...ticketStored, verifiedParties: 'Tampered Hacker Name' })
          })
        })
      })
    };
    await expect(getTicketFromFirestore(ticket.verificationTicketId, mockDbTampered)).rejects.toThrow(/ERR_PERSISTED_TICKET_TAMPERED/);

    // Persistence failure in Firestore causes registerAndVerifyEvidence to fail closed with ERR_PERSISTENCE_FAILED
    const mockDbFailing = {
      batch: () => ({
        set: () => {},
        commit: async () => { throw new Error('Firestore connection timeout'); }
      }),
      collection: () => ({})
    };
    await expect(regEngine({
      user: { uid: 'usr-persist-101' },
      willId: 'will-persist-202',
      documentStorageId: 'DOC-PERSIST-FAIL',
      documentBytes: Buffer.from('content'),
      reviewer: { verifiedBy: 'Advocate A', reviewerRole: 'ADVOCATE', enrollmentNumber: 'GOA/123/2005' },
      db: mockDbFailing
    })).rejects.toThrow(/ERR_PERSISTENCE_FAILED/);
  });

  it('165. Stage 1 Revision 14 Adversarial 39 (P1-3): Vercel endpoint /api/validate-ticket validates authentic tickets and rejects forged/cross-user tickets', async () => {
    const validateTicketHandler = (await import('../../api/validate-ticket.js')).default || (await import('../../api/validate-ticket.js'));
    const { registerAndVerifyEvidence: regEngine } = await import('../../functions/evidenceVerificationEngine.cjs');

    const validTicket = regEngine({
      user: { uid: 'usr-client-101' },
      willId: 'will-client-202',
      documentStorageId: 'DOC-CLIENT-VAL',
      documentBytes: Buffer.from('authentic bytes'),
      reviewer: { verifiedBy: 'Advocate Pereira', reviewerRole: 'ADVOCATE', enrollmentNumber: 'GOA/123/2005' }
    });

    // Helper for mock response
    function createRes() {
      let statusCode = 200;
      let jsonResult = null;
      let ended = false;
      return {
        setHeader: () => {},
        status: (c) => {
          statusCode = c;
          return {
            json: (j) => { jsonResult = j; return { statusCode, jsonResult }; },
            end: () => { ended = true; return { statusCode, jsonResult }; }
          };
        },
        getStatus: () => statusCode,
        getBody: () => jsonResult
      };
    }

    // 1. Rejects GET requests with 405 Method Not Allowed
    const resGet = createRes();
    await validateTicketHandler({ method: 'GET', headers: {} }, resGet);
    expect(resGet.getStatus()).toBe(405);

    // 2. Rejects unauthenticated requests with 401 Unauthorized
    const resNoAuth = createRes();
    await validateTicketHandler({ method: 'POST', headers: {}, body: { ticket: validTicket } }, resNoAuth);
    expect(resNoAuth.getStatus()).toBe(401);

    // 3. Valid ticket returns 200 with isValid: true
    const resValid = createRes();
    await validateTicketHandler({
      method: 'POST',
      headers: {},
      auth: { uid: 'usr-client-101', email: 'user@smartwill.in' },
      body: { ticket: validTicket }
    }, resValid, { auth: { uid: 'usr-client-101', email: 'user@smartwill.in' } });
    expect(resValid.getStatus()).toBe(200);
    expect(resValid.getBody().isValid).toBe(true);
    expect(resValid.getBody().ticketId).toBe(validTicket.verificationTicketId);

    // 4. Forged ticket signature returns 403 ERR_FORGED_EVIDENCE_TICKET
    const resForged = createRes();
    const forgedTicket = { ...validTicket, verifiedParties: 'Forged Name' };
    await validateTicketHandler({
      method: 'POST',
      headers: {},
      auth: { uid: 'usr-client-101' },
      body: { ticket: forgedTicket }
    }, resForged, { auth: { uid: 'usr-client-101' } });
    expect(resForged.getStatus()).toBe(403);
    expect(resForged.getBody().blockerCode).toBe('ERR_FORGED_EVIDENCE_TICKET');

    // 5. Cross-user ticket reuse returns 403 ERR_CROSS_USER_EVIDENCE_REUSE
    const resCrossUser = createRes();
    await validateTicketHandler({
      method: 'POST',
      headers: {},
      auth: { uid: 'usr-attacker-999' },
      body: { ticket: validTicket }
    }, resCrossUser, { auth: { uid: 'usr-attacker-999' } });
    expect(resCrossUser.getStatus()).toBe(403);
    expect(resCrossUser.getBody().blockerCode).toBe('ERR_CROSS_USER_EVIDENCE_REUSE');

    // 6. Persisted ticket tampering in Firestore returns 403 ERR_PERSISTED_TICKET_TAMPERED
    const mockDbTampered = {
      collection: () => ({
        doc: () => ({
          get: async () => ({
            exists: true,
            data: () => ({ ...validTicket, serverSignature: 'tampered-signature' })
          })
        })
      })
    };
    const resPersistedTampered = createRes();
    await validateTicketHandler({
      method: 'POST',
      headers: {},
      auth: { uid: 'usr-client-101' },
      body: { ticket: validTicket }
    }, resPersistedTampered, {
      auth: { uid: 'usr-client-101' },
      db: mockDbTampered
    });
    expect(resPersistedTampered.getStatus()).toBe(403);
    expect(resPersistedTampered.getBody().blockerCode).toBe('ERR_PERSISTED_TICKET_TAMPERED');
  });

  it('166. Stage 1 Revision 14 Adversarial 40 (P1-4): Spoofed authContext in form data strictly fails closed without authenticatedServerContext', () => {
    // Attempt to spoof authentication by providing authContext inside form data
    const spoofedPersonalData = {
      fullName: 'Ramesh Sharma',
      pob: 'Varanasi, UP',
      religion: 'Hindu',
      authContext: { userId: 'usr-spoofed', willId: 'will-spoofed' },
      clauseAEvidence: sampleClauseAEvidence
    };

    // Calling classifyGoaJurisdiction without trusted authenticatedServerContext
    const resGoa = classifyGoaJurisdiction(spoofedPersonalData, null);
    expect(resGoa.status).toBe(JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED);
    expect(resGoa.blockers[0]).toContain('ERR_UNAUTHENTICATED_EVIDENCE_CONTEXT');

    // Calling resolvePersonalLawRegime without trusted authenticatedServerContext
    const spoofedWill = {
      personal: spoofedPersonalData,
      authContext: { userId: 'usr-spoofed', willId: 'will-spoofed' },
      assets: []
    };
    const resPersonal = resolvePersonalLawRegime(spoofedWill, null);
    expect(resPersonal.regime).toBe(PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED);
  });

  it('167. Stage 1 Revision 14 Adversarial 41 (P1-5): Asset-completeness gate rejects generic signed tickets, pending reviewers, and altered facts', async () => {
    const testAuth = createTestAuthContext();

    // 1. Generic signed document (TITLE_DEED_REGISTERED) used as asset completeness attestation -> strictly rejected
    const genericTicketEvidence = createTrustedServerEvidenceFixture({
      documentType: 'TITLE_DEED_REGISTERED',
      claimedStatutoryFact: 'HISTORICAL_TERRITORY_PROPERTY'
    });

    const muslimGenericAttestation = {
      personal: {
        fullName: 'Mohammed Ali',
        pob: 'Lucknow, UP',
        dob: '1980-01-01',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: 'Muslim',
        sect: 'Sunni',
        shariatDeclarationRecord: sampleShariatDeclarationRecord,
        assetInventoryDeclaration: {
          hasNoAssets: true,
          declarationSigned: true,
          declarationDate: '2026-06-15',
          auditSessionId: 'SESSION-GENERIC-101',
          completenessAttestationTicket: genericTicketEvidence
        }
      },
      assets: []
    };
    const resGeneric = resolvePersonalLawRegime(muslimGenericAttestation, testAuth);
    expect(resGeneric.regime).toBe(PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED);
    expect(resGeneric.blockers[0]).toContain('ERR_ASSET_INVENTORY_REQUIRED');

    // 2. Pending reviewer ticket used as asset completeness attestation -> strictly rejected
    const { registerAndVerifyEvidence: regEngine } = await import('../../functions/evidenceVerificationEngine.cjs');
    const pendingReviewerTicket = regEngine({
      user: { uid: testAuth.userId },
      willId: testAuth.willId,
      documentStorageId: 'AUDIT-STORE-PENDING',
      documentBytes: Buffer.from('declaration bytes'),
      documentMetadata: {
        documentType: 'ASSET_COMPLETENESS_ATTESTATION',
        verifiedParties: 'Mohammed Ali'
      },
      reviewer: {
        verifiedBy: 'Advocate Pending',
        reviewerRole: 'ADVOCATE',
        enrollmentNumber: 'UP/111/2018'
      },
      claimedStatutoryFact: 'ASSET_COMPLETENESS'
    });
    expect(pendingReviewerTicket.reviewer.verificationStatus).toBe('PENDING_MANUAL_VERIFICATION');

    const muslimPendingAttestation = {
      personal: {
        fullName: 'Mohammed Ali',
        pob: 'Lucknow, UP',
        dob: '1980-01-01',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: 'Muslim',
        sect: 'Sunni',
        shariatDeclarationRecord: sampleShariatDeclarationRecord,
        assetInventoryDeclaration: {
          hasNoAssets: true,
          declarationSigned: true,
          declarationDate: '2026-06-15',
          auditSessionId: 'SESSION-PENDING-202',
          completenessAttestationTicket: pendingReviewerTicket
        }
      },
      assets: []
    };
    const resPending = resolvePersonalLawRegime(muslimPendingAttestation, testAuth);
    expect(resPending.regime).toBe(PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED);
    expect(resPending.blockers[0]).toContain('ERR_ASSET_INVENTORY_REQUIRED');

    // 3. Genuine, authoritatively verified asset completeness attestation -> successfully satisfies gate
    const genuineCompletenessDecl = createTestCompletenessDeclaration({
      userId: testAuth.userId,
      willId: testAuth.willId,
      testatorName: 'Mohammed Ali'
    });

    const muslimGenuineAttestation = {
      personal: {
        fullName: 'Mohammed Ali',
        pob: 'Lucknow, UP',
        dob: '1980-01-01',
        parentsPortugueseRegime: false,
        parentsRestOfIndiaGoverned: true,
        parentsRestOfIndiaEvidence: sampleParentsRoiEvidence,
        religion: 'Muslim',
        sect: 'Sunni',
        shariatDeclarationRecord: sampleShariatDeclarationRecord,
        assetInventoryDeclaration: genuineCompletenessDecl
      },
      assets: []
    };
    const resGenuine = resolvePersonalLawRegime(muslimGenuineAttestation, testAuth);
    expect(resGenuine.regime).toBe(PERSONAL_LAW_REGIMES.MUSLIM_SUNNI);
    expect(resGenuine.shariatSec3Verified).toBe(true);
    expect(resGenuine.blockers).toHaveLength(0);
  });

});
