/**
 * SmartWill India — Legal Engine 2.1
 * Statutory Jurisdiction Classifier: Section 1(4)(a)–(g) of Goa Act 23 of 2016
 *
 * Implements the exact statutory categories under Section 1(4) of the Goa Succession,
 * Special Notaries and Inventory Proceeding Act, 2012 (Goa Act 23 of 2016):
 *
 * Clause (a): Persons governed by Portuguese Civil Code of 1867 before 20 December 1961
 * Clause (b): Persons born in Goa to parents governed by that Civil Code
 * Clause (c): Persons born outside Goa to parents governed by that Code, subject to statutory opt-out
 *             executed before the Special Notary within statutory 3-year deadlines
 * Clause (d): Persons born in Goa to parents governed by corresponding laws in the rest of India,
 *             subject to permanent residence and statutory election requirements
 *             (Proviso: Consular, diplomatic, or military postings do not constitute permanent residence)
 * Clause (e): Persons born in Goa to foreign-citizen parents satisfying Sections 3 & 4 of the Citizenship Act, 1955
 * Clause (f): Persons born in Goa of unknown parents or unknown nationality
 * Clause (g): Persons adopted by parents governed by the specified Code or Act
 */

export const JURISDICTION_STATUS = {
  GOA_ACT_APPLICABLE: "GOA_ACT_APPLICABLE",
  INDIAN_SUCCESSION_ACT_APPLICABLE: "INDIAN_SUCCESSION_ACT_APPLICABLE",
  LEGAL_REVIEW_REQUIRED: "LEGAL_REVIEW_REQUIRED"
};

export const GOA_SECTION_1_4_CLAUSES = {
  CLAUSE_A: "Section 1(4)(a): Governed by Portuguese Civil Code of 1867 before 20 December 1961",
  CLAUSE_B: "Section 1(4)(b): Born in Goa to parents governed by the Portuguese Civil Code",
  CLAUSE_C: "Section 1(4)(c): Born outside Goa to parents governed by the Code (no valid opt-out declaration)",
  CLAUSE_D: "Section 1(4)(d): Born in Goa to rest-of-India parents, with verified permanent residence and statutory election",
  CLAUSE_E: "Section 1(4)(e): Born in Goa to foreign parents satisfying Sections 3 & 4 of Citizenship Act, 1955",
  CLAUSE_F: "Section 1(4)(f): Born in Goa of unknown parents or unknown nationality",
  CLAUSE_G: "Section 1(4)(g): Adopted by parents governed by the specified Code or Act"
};

/**
 * Classifies the governing succession jurisdiction strictly under Section 1(4)(a)–(g) criteria.
 * @param {Object} p - Personal data object
 * @returns {Object} { status, statutoryClause, applicableAct, reasons, blockers, canGenerateWill }
 */
export function classifyGoaJurisdiction(p = {}) {
  const reasons = [];
  const blockers = [];

  const rawAddr = `${p.addressLine1 || ''} ${p.addressLine2 || ''} ${p.addressCity || ''} ${p.addressState || ''}`.toLowerCase();
  const isGoaResident = rawAddr.includes('goa') || rawAddr.includes('margao') || rawAddr.includes('panaji') || rawAddr.includes('vasco') || rawAddr.includes('mapusa');

  const testatorPob = (p.pob || p.placeOfBirth || '').trim().toLowerCase();
  const isTestatorBornGoa = testatorPob.includes('goa') || testatorPob.includes('margao') || testatorPob.includes('panaji') || testatorPob.includes('vasco') || testatorPob.includes('mapusa');

  // Parents' 1867 Civil Code status: Requires affirmative verification, not mere birthplace
  const parentsPortugueseRegime = Boolean(p.parentsPortugueseRegime || p.parentsCivilCode1867 || (p.fatherPortugueseRegime && p.motherPortugueseRegime));
  
  // Clause (a): Proof of personal subjection to 1867 Civil Code prior to 20 Dec 1961
  const pre1961TestatorRegime = Boolean(p.pre1961PortugueseRegime || p.governedByCivilCode1867);
  const bornBefore1961InGoa = Boolean(p.dob && new Date(p.dob) < new Date('1961-12-20') && isTestatorBornGoa);

  const isAdopted = Boolean(p.isAdopted);
  const adoptiveParentsGoanRegime = Boolean(p.adoptiveParentsGoanRegime);
  const isUnknownParents = Boolean(p.unknownParentsOrNationality);
  const foreignParentsCitizenshipFulfilled = Boolean(p.foreignParentsCitizenshipFulfilled || p.citizenshipActSec3or4Fulfilled);
  const statutoryElectionClauseD = Boolean(p.statutoryElectionClauseD || p.statutoryElectionGoa);

  // Section 1(4) Proviso: Posting in government service, diplomatic service, or armed forces
  // does not establish permanent residence under Clause (d), but does not exclude from (a), (b), (c), or (g).
  const isConsularOrMilitaryPosting = Boolean(p.isConsularOrDiplomaticPosting || p.isTemporaryMilitaryPosting || p.isGovernmentPosting);
  const permanentResidenceGoaSatisfied = Boolean(p.permanentResidenceGoaSatisfied) && !isConsularOrMilitaryPosting;

  // Clause (c) Opt-Out: Must be executed before Special Notary within the statutory 3-year periods
  const hasOptedOutUnderClauseC = Boolean(
    (p.statutoryOptOutClauseC || p.statutoryOptOutGoa) &&
    p.optOutBeforeSpecialNotary &&
    p.optOutWithinThreeYearPeriod
  );

  // ── Clause (g): Adopted by parents governed by the specified Code or Act ──
  if (isAdopted) {
    if (adoptiveParentsGoanRegime) {
      reasons.push("Section 1(4)(g): Person adopted by parents governed by the Portuguese Civil Code of 1867 or Goa Act 23 of 2016.");
      return {
        status: JURISDICTION_STATUS.GOA_ACT_APPLICABLE,
        statutoryClause: GOA_SECTION_1_4_CLAUSES.CLAUSE_G,
        applicableAct: "Goa Act 23 of 2016",
        reasons,
        blockers: [],
        canGenerateWill: true
      };
    } else {
      reasons.push("Section 1(4)(g) Not Met: Adoptive parents were not governed by the Portuguese Civil Code or Goa Act 23 of 2016.");
      return {
        status: JURISDICTION_STATUS.INDIAN_SUCCESSION_ACT_APPLICABLE,
        statutoryClause: "Indian Succession Act (Adoption Under Personal Law)",
        applicableAct: "Indian Succession Act, 1925",
        reasons,
        blockers: [],
        canGenerateWill: true
      };
    }
  }

  // ── Clause (a): Governed by Portuguese Civil Code before 20 December 1961 ──
  if (pre1961TestatorRegime) {
    reasons.push("Section 1(4)(a): Affirmative statutory record establishing testator was personally governed by the Portuguese Civil Code of 1867 prior to 20 December 1961.");
    return {
      status: JURISDICTION_STATUS.GOA_ACT_APPLICABLE,
      statutoryClause: GOA_SECTION_1_4_CLAUSES.CLAUSE_A,
      applicableAct: "Goa Act 23 of 2016",
      reasons,
      blockers: [],
      canGenerateWill: true
    };
  } else if (bornBefore1961InGoa && p.parentsPortugueseRegime === undefined) {
    // Born in Goa before 1961, but no affirmative proof of Portuguese Civil Code subjection
    blockers.push("Section 1(4)(a) Unverified: Birth in Goa prior to 20 December 1961 does not automatically establish subjection to the Portuguese Civil Code of 1867. Documentary verification of civil registration under the 1867 Code is required.");
    return {
      status: JURISDICTION_STATUS.LEGAL_REVIEW_REQUIRED,
      statutoryClause: "Section 1(4)(a) Verification Required",
      applicableAct: "Unconfirmed",
      reasons: ["Historical civil registration under the Portuguese Civil Code of 1867 must be independently verified by an advocate."],
      blockers,
      canGenerateWill: false
    };
  }

  // ── Clause (b): Born in Goa to parents governed by the Civil Code ──
  if (isTestatorBornGoa && parentsPortugueseRegime) {
    reasons.push("Section 1(4)(b): Testator was born in Goa to parents affirmatively verified as governed by the Portuguese Civil Code of 1867.");
    return {
      status: JURISDICTION_STATUS.GOA_ACT_APPLICABLE,
      statutoryClause: GOA_SECTION_1_4_CLAUSES.CLAUSE_B,
      applicableAct: "Goa Act 23 of 2016",
      reasons,
      blockers: [],
      canGenerateWill: true
    };
  }

  // ── Clause (c): Born outside Goa to parents governed by the Code, subject to statutory opt-out ──
  if (!isTestatorBornGoa && parentsPortugueseRegime) {
    if (hasOptedOutUnderClauseC) {
      reasons.push("Section 1(4)(c) Opt-Out: Testator born outside Goa executed a statutory declaration opting out before the Special Notary within the prescribed three-year statutory deadline.");
      return {
        status: JURISDICTION_STATUS.INDIAN_SUCCESSION_ACT_APPLICABLE,
        statutoryClause: "Section 1(4)(c) Opt-Out (Special Notary Declaration)",
        applicableAct: "Indian Succession Act, 1925",
        reasons,
        blockers: [],
        canGenerateWill: true
      };
    }
    reasons.push("Section 1(4)(c): Testator born outside Goa to parents governed by the Portuguese Civil Code without an executed statutory opt-out before the Special Notary.");
    return {
      status: JURISDICTION_STATUS.GOA_ACT_APPLICABLE,
      statutoryClause: GOA_SECTION_1_4_CLAUSES.CLAUSE_C,
      applicableAct: "Goa Act 23 of 2016",
      reasons,
      blockers: [],
      canGenerateWill: true
    };
  }

  // ── Clause (f): Born in Goa of unknown parents or unknown nationality ──
  if (isTestatorBornGoa && isUnknownParents) {
    reasons.push("Section 1(4)(f): Testator born in Goa of unknown parents or unknown nationality.");
    return {
      status: JURISDICTION_STATUS.GOA_ACT_APPLICABLE,
      statutoryClause: GOA_SECTION_1_4_CLAUSES.CLAUSE_F,
      applicableAct: "Goa Act 23 of 2016",
      reasons,
      blockers: [],
      canGenerateWill: true
    };
  }

  // ── Clause (e): Born in Goa to foreign parents satisfying Citizenship Act Sections 3 & 4 ──
  if (isTestatorBornGoa && foreignParentsCitizenshipFulfilled) {
    reasons.push("Section 1(4)(e): Testator born in Goa to foreign-citizen parents, satisfying Sections 3 and 4 of the Citizenship Act, 1955.");
    return {
      status: JURISDICTION_STATUS.GOA_ACT_APPLICABLE,
      statutoryClause: GOA_SECTION_1_4_CLAUSES.CLAUSE_E,
      applicableAct: "Goa Act 23 of 2016",
      reasons,
      blockers: [],
      canGenerateWill: true
    };
  }

  // ── Clause (d): Born in Goa to rest-of-India parents, with permanent residence and election ──
  if (isTestatorBornGoa && !parentsPortugueseRegime) {
    if (isConsularOrMilitaryPosting) {
      reasons.push("Section 1(4) Proviso: Government service, diplomatic posting, or armed forces assignment in Goa does not constitute permanent residence under Clause (d). Governed by personal law under Jose Paulo Coutinho (2020) 17 SCC 159.");
      return {
        status: JURISDICTION_STATUS.INDIAN_SUCCESSION_ACT_APPLICABLE,
        statutoryClause: "Indian Succession Act (Proviso: Posting Excluded from Permanent Residence)",
        applicableAct: "Indian Succession Act, 1925",
        reasons,
        blockers: [],
        canGenerateWill: true
      };
    }

    if (statutoryElectionClauseD && permanentResidenceGoaSatisfied) {
      reasons.push("Section 1(4)(d): Testator born in Goa to rest-of-India parents, satisfying permanent residence requirement and having declared statutory election.");
      return {
        status: JURISDICTION_STATUS.GOA_ACT_APPLICABLE,
        statutoryClause: GOA_SECTION_1_4_CLAUSES.CLAUSE_D,
        applicableAct: "Goa Act 23 of 2016",
        reasons,
        blockers: [],
        canGenerateWill: true
      };
    } else {
      reasons.push("Section 1(4)(d) Incomplete: Testator born in Goa to non-Goan parents, but statutory election or permanent residence requirement is unrecorded. Governed by their personal law pursuant to Jose Paulo Coutinho (2020) 17 SCC 159.");
      return {
        status: JURISDICTION_STATUS.INDIAN_SUCCESSION_ACT_APPLICABLE,
        statutoryClause: "Indian Succession Act (Non-Electing Section 1(4)(d))",
        applicableAct: "Indian Succession Act, 1925",
        reasons,
        blockers: [],
        canGenerateWill: true
      };
    }
  }

  // Ambiguity Gate: Goa resident with unrecorded birthplace or parentage
  if (isGoaResident) {
    blockers.push("Section 1(4) Verification Required: Residence or domicile in Goa alone does not establish legal regime. Affirmative documentary proof of parents' legal status or statutory declaration is mandatory.");
    return {
      status: JURISDICTION_STATUS.LEGAL_REVIEW_REQUIRED,
      statutoryClause: "Section 1(4) Verification Required",
      applicableAct: "Unconfirmed",
      reasons: ["Current residence in Goa alone is legally insufficient to establish Section 1(4) applicability."],
      blockers,
      canGenerateWill: false
    };
  }

  // Unknown personal law gate: If personal law data is completely absent, trigger legal review
  if (!p.religion && !p.personalLaw && !p.applicablePersonalLaw) {
    blockers.push("Personal Law Unrecorded: Succession regime cannot be inferred without declaring personal law or ancestral civil code subjection.");
    return {
      status: JURISDICTION_STATUS.LEGAL_REVIEW_REQUIRED,
      statutoryClause: "Personal Law Unconfirmed",
      applicableAct: "Unconfirmed",
      reasons: ["Personal law and ancestral succession origin must be declared."],
      blockers,
      canGenerateWill: false
    };
  }

  // Standard Rest-of-India Jurisdiction
  reasons.push("Governed under the Indian Succession Act, 1925 and applicable personal law (rest of India jurisdiction).");
  return {
    status: JURISDICTION_STATUS.INDIAN_SUCCESSION_ACT_APPLICABLE,
    statutoryClause: "Indian Succession Act, 1925 (Part VI)",
    applicableAct: "Indian Succession Act, 1925",
    reasons,
    blockers: [],
    canGenerateWill: true
  };
}
