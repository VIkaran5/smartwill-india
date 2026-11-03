/**
 * SmartWill India — Legal Engine 2.1
 * Statutory Jurisdiction Classifier: Section 1(4)(a)–(g) of Goa Act 23 of 2016
 *
 * Implements deterministic classification under Section 1(4) of the Goa Succession,
 * Special Notaries and Inventory Proceeding Act, 2012 (Goa Act 23 of 2016).
 * Replaces naive domicile/city checks with evidentiary personal-law classification.
 */

export const JURISDICTION_STATUS = {
  GOA_ACT_APPLICABLE: "GOA_ACT_APPLICABLE",
  INDIAN_SUCCESSION_ACT_APPLICABLE: "INDIAN_SUCCESSION_ACT_APPLICABLE",
  LEGAL_REVIEW_REQUIRED: "LEGAL_REVIEW_REQUIRED"
};

/**
 * Classifies the governing succession jurisdiction strictly under Section 1(4) criteria.
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
  const parentsPortugueseRegime = Boolean(p.parentsPortugueseRegime || p.parentsCivilCode1867);
  const civilMarriageGoa = Boolean(p.civilMarriageGoa || p.marriedUnderGoaCivilCode);
  const statutoryElectionGoa = Boolean(p.statutoryElectionGoa);
  const statutoryOptOutGoa = Boolean(p.statutoryOptOutGoa);

  // If user explicitly opted out under competent statutory procedure
  if (statutoryOptOutGoa) {
    reasons.push("Testator executed a verified statutory opt-out or election out of the Goa succession regime where legally permissible.");
    return {
      status: JURISDICTION_STATUS.INDIAN_SUCCESSION_ACT_APPLICABLE,
      statutoryClause: "Section 1(4) Proviso",
      applicableAct: "Indian Succession Act, 1925",
      reasons,
      blockers: [],
      canGenerateWill: true
    };
  }

  // 1. Section 1(4)(a): Pre-1961 Civil Code 1867 status
  if (parentsPortugueseRegime && (isTestatorBornGoa || isFatherBornGoa)) {
    reasons.push("Governed under Section 1(4)(a) & (b): Lineal continuity under the Civil Code of 1867 preserved by Goa Act 23 of 2016.");
    return {
      status: JURISDICTION_STATUS.GOA_ACT_APPLICABLE,
      statutoryClause: "Section 1(4)(a) & (b)",
      applicableAct: "Goa Act 23 of 2016",
      reasons,
      blockers: [],
      canGenerateWill: true
    };
  }

  // 2. Section 1(4)(c): Born in Goa to parents governed under the regime
  if (isTestatorBornGoa && (isFatherBornGoa || isMotherBornGoa || parentsPortugueseRegime)) {
    reasons.push("Governed under Section 1(4)(c): Testator born in Goa to qualifying parents subject to the Goa succession regime.");
    return {
      status: JURISDICTION_STATUS.GOA_ACT_APPLICABLE,
      statutoryClause: "Section 1(4)(c)",
      applicableAct: "Goa Act 23 of 2016",
      reasons,
      blockers: [],
      canGenerateWill: true
    };
  }

  // 3. Section 1(4)(f): Civil Marriage in Goa under Goan Civil Code
  if (civilMarriageGoa && isGoaResident) {
    reasons.push("Governed under Section 1(4)(f): Civil marriage solemnized and registered in Goa under the civil registry regime.");
    return {
      status: JURISDICTION_STATUS.GOA_ACT_APPLICABLE,
      statutoryClause: "Section 1(4)(f)",
      applicableAct: "Goa Act 23 of 2016",
      reasons,
      blockers: [],
      canGenerateWill: true
    };
  }

  // 4. Section 1(4)(d): Explicit statutory declaration / election
  if (statutoryElectionGoa && isGoaResident) {
    reasons.push("Governed under Section 1(4)(d): Submission to Goa succession regime via formal statutory declaration or registered election.");
    return {
      status: JURISDICTION_STATUS.GOA_ACT_APPLICABLE,
      statutoryClause: "Section 1(4)(d)",
      applicableAct: "Goa Act 23 of 2016",
      reasons,
      blockers: [],
      canGenerateWill: true
    };
  }

  // 5. If resident in Goa, but birthplace or parentage is completely unrecorded or ambiguous
  if (isGoaResident) {
    if (!testatorPob && !fatherPob) {
      blockers.push("Testator place of birth and parents' origin not recorded. Section 1(4) applicability cannot be verified from Goa residence alone.");
      return {
        status: JURISDICTION_STATUS.LEGAL_REVIEW_REQUIRED,
        statutoryClause: "Section 1(4) Verification Required",
        applicableAct: "Unconfirmed",
        reasons: ["Current residence in Goa alone does not establish Goa Succession Act applicability without birthplace and parental status."],
        blockers,
        canGenerateWill: false
      };
    }

    // Resident in Goa, but born outside Goa to non-Goan parents (e.g., migrant from Mumbai/Delhi)
    if (!isTestatorBornGoa && !isFatherBornGoa && !isMotherBornGoa && !civilMarriageGoa) {
      reasons.push("Section 1(4)(g) Exception: Testator resides in Goa but has neither Goan birth, Goan parentage, nor Goan civil marriage registration. Governed by their personal law under Central statutes pursuant to Jose Paulo Coutinho (2020) 17 SCC 159.");
      return {
        status: JURISDICTION_STATUS.INDIAN_SUCCESSION_ACT_APPLICABLE,
        statutoryClause: "Section 1(4)(g) & Jose Paulo Coutinho",
        applicableAct: "Indian Succession Act, 1925",
        reasons,
        blockers: [],
        canGenerateWill: true
      };
    }
  }

  // 6. Non-Goa Testator: Governed by standard Indian Succession Act / Hindu Succession Act / Muslim Law
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
