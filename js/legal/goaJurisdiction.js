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
 * Clause (d): Persons born in Goa to parents governed by corresponding laws in the rest of India,
 *             subject to permanent residence and statutory election requirements
 * Clause (e): Persons born in Goa to foreign-citizen parents fulfilling Citizenship Act conditions and electing coverage
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
  CLAUSE_C: "Section 1(4)(c): Born outside Goa to parents governed by the Code (no statutory opt-out)",
  CLAUSE_D: "Section 1(4)(d): Born in Goa to rest-of-India parents, with permanent residence and statutory election",
  CLAUSE_E: "Section 1(4)(e): Born in Goa to foreign parents, satisfying Citizenship Act & statutory election",
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
  const fatherPob = (p.fatherPob || p.fatherPlaceOfBirth || '').trim().toLowerCase();
  const motherPob = (p.motherPob || p.motherPlaceOfBirth || '').trim().toLowerCase();

  const isTestatorBornGoa = testatorPob.includes('goa') || testatorPob.includes('margao') || testatorPob.includes('panaji') || testatorPob.includes('vasco') || testatorPob.includes('mapusa');
  const isFatherBornGoa = fatherPob.includes('goa') || fatherPob.includes('margao') || fatherPob.includes('panaji') || fatherPob.includes('vasco') || fatherPob.includes('mapusa');
  const isMotherBornGoa = motherPob.includes('goa') || motherPob.includes('margao') || motherPob.includes('panaji') || motherPob.includes('vasco') || motherPob.includes('mapusa');

  // Parents' 1867 Civil Code status
  const parentsPortugueseRegime = Boolean(p.parentsPortugueseRegime || p.parentsCivilCode1867 || (p.fatherPortugueseRegime || p.motherPortugueseRegime));
  const pre1961TestatorRegime = Boolean(p.pre1961PortugueseRegime || (p.dob && new Date(p.dob) < new Date('1961-12-20') && isTestatorBornGoa));

  const hasOptedOutUnderClauseC = Boolean(p.statutoryOptOutClauseC || p.statutoryOptOutGoa);
  const isAdopted = Boolean(p.isAdopted);
  const adoptiveParentsGoanRegime = Boolean(p.adoptiveParentsGoanRegime);
  const isUnknownParents = Boolean(p.unknownParentsOrNationality);
  const foreignParentsCitizenshipFulfilled = Boolean(p.foreignParentsCitizenshipFulfilled);
  const statutoryElectionClauseD = Boolean(p.statutoryElectionClauseD || p.statutoryElectionGoa);
  const permanentResidenceGoaSatisfied = Boolean(p.permanentResidenceGoaSatisfied);

  // Excluded Categories Proviso: Consular, Diplomatic, or temporary non-Goan postings
  const isConsularOrMilitaryTemporary = Boolean(p.isConsularOrDiplomaticPosting || p.isTemporaryMilitaryPosting);
  if (isConsularOrMilitaryTemporary && !pre1961TestatorRegime && !parentsPortugueseRegime) {
    reasons.push("Section 1(4) Proviso Exclusion: Children or dependents of consular, diplomatic, or temporary military officers posted in Goa are expressly excluded from the Goa Succession Act.");
    return {
      status: JURISDICTION_STATUS.INDIAN_SUCCESSION_ACT_APPLICABLE,
      statutoryClause: "Section 1(4) Proviso (Temporary Consular/Military Exemption)",
      applicableAct: "Indian Succession Act, 1925",
      reasons,
      blockers: [],
      canGenerateWill: true
    };
  }

  // ── Clause (a): Governed by Portuguese Civil Code before 20 December 1961 ──
  if (pre1961TestatorRegime) {
    reasons.push("Section 1(4)(a): Testator was personally governed by the Portuguese Civil Code of 1867 prior to 20 December 1961.");
    return {
      status: JURISDICTION_STATUS.GOA_ACT_APPLICABLE,
      statutoryClause: GOA_SECTION_1_4_CLAUSES.CLAUSE_A,
      applicableAct: "Goa Act 23 of 2016",
      reasons,
      blockers: [],
      canGenerateWill: true
    };
  }

  // ── Clause (b): Born in Goa to parents governed by the Civil Code ──
  if (isTestatorBornGoa && (parentsPortugueseRegime || isFatherBornGoa || isMotherBornGoa)) {
    reasons.push("Section 1(4)(b): Testator was born in Goa to parents governed by the Portuguese Civil Code of 1867.");
    return {
      status: JURISDICTION_STATUS.GOA_ACT_APPLICABLE,
      statutoryClause: GOA_SECTION_1_4_CLAUSES.CLAUSE_B,
      applicableAct: "Goa Act 23 of 2016",
      reasons,
      blockers: [],
      canGenerateWill: true
    };
  }

  // ── Clause (c): Born outside Goa to parents governed by the Code, unless opting out ──
  if (!isTestatorBornGoa && (parentsPortugueseRegime || isFatherBornGoa || isMotherBornGoa)) {
    if (hasOptedOutUnderClauseC) {
      reasons.push("Section 1(4)(c) Opt-Out: Testator was born outside Goa to Goan parents and executed a statutory declaration opting out of the Goa Act within the prescribed statutory period.");
      return {
        status: JURISDICTION_STATUS.INDIAN_SUCCESSION_ACT_APPLICABLE,
        statutoryClause: "Section 1(4)(c) Opt-Out Declaration",
        applicableAct: "Indian Succession Act, 1925",
        reasons,
        blockers: [],
        canGenerateWill: true
      };
    }
    reasons.push("Section 1(4)(c): Testator was born outside Goa to parents governed by the Portuguese Civil Code and has not executed an opt-out declaration.");
    return {
      status: JURISDICTION_STATUS.GOA_ACT_APPLICABLE,
      statutoryClause: GOA_SECTION_1_4_CLAUSES.CLAUSE_C,
      applicableAct: "Goa Act 23 of 2016",
      reasons,
      blockers: [],
      canGenerateWill: true
    };
  }

  // ── Clause (g): Adopted by parents governed by the specified Code or Act ──
  if (isAdopted && adoptiveParentsGoanRegime) {
    reasons.push("Section 1(4)(g): Person adopted by parents governed by the Portuguese Civil Code of 1867 or Goa Act 23 of 2016.");
    return {
      status: JURISDICTION_STATUS.GOA_ACT_APPLICABLE,
      statutoryClause: GOA_SECTION_1_4_CLAUSES.CLAUSE_G,
      applicableAct: "Goa Act 23 of 2016",
      reasons,
      blockers: [],
      canGenerateWill: true
    };
  }

  // ── Clause (f): Born in Goa of unknown parents or nationality ──
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

  // ── Clause (e): Born in Goa to foreign parents, satisfying Citizenship Act & election ──
  if (isTestatorBornGoa && foreignParentsCitizenshipFulfilled) {
    reasons.push("Section 1(4)(e): Testator born in Goa to foreign-citizen parents, fulfilling Citizenship Act conditions and electing coverage under the Goa Act.");
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
  if (isTestatorBornGoa && (!parentsPortugueseRegime && !isFatherBornGoa && !isMotherBornGoa)) {
    if (statutoryElectionClauseD && permanentResidenceGoaSatisfied) {
      reasons.push("Section 1(4)(d): Testator born in Goa to rest-of-India parents, satisfying permanent residence requirement and having declared a statutory election to be governed by the Goa Act.");
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
    if (!testatorPob && !fatherPob) {
      blockers.push("Section 1(4) Verification Required: Testator place of birth and parental origin are unrecorded. Domicile or residence in Goa alone does not establish Goa Succession Act applicability.");
      return {
        status: JURISDICTION_STATUS.LEGAL_REVIEW_REQUIRED,
        statutoryClause: "Section 1(4) Verification Required",
        applicableAct: "Unconfirmed",
        reasons: ["Current residence in Goa alone is legally insufficient to establish Section 1(4) applicability."],
        blockers,
        canGenerateWill: false
      };
    }
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
