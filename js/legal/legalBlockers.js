/**
 * SmartWill India — Legal Engine 2.1
 * Automated Pre-Flight Legal Blocker System
 *
 * Runs comprehensive statutory consistency validation before PDF generation.
 * Emits itemized legal diagnostic reports with page, clause, statute, and remedy.
 */

import { classifyGoaJurisdiction, JURISDICTION_STATUS } from './goaJurisdiction.js';
import { resolvePersonalLawRegime, PERSONAL_LAW_REGIMES } from './personalLawRouter.js';
import { calculateGoaInheritance, CALCULATION_STATUS } from './inheritanceCalculator.js';
import { verifyPropertyTitle } from './titleVerification.js';
import { validateResiduaryAllocations } from './residuaryValidator.js';
import { evaluateAssetMatrimonialOwnership } from './matrimonialRegime.js';

export function runPreFlightLegalBlockerAudit(willData = {}) {
  const p = willData.personal || {};
  const assets = Array.isArray(willData.assets) ? willData.assets : [];
  const blockers = [];
  const warnings = [];
  const authContext = willData.authenticatedServerContext || willData.authContext || null;

  // Gate 1: Jurisdiction Classification (Section 1(4))
  const jur = classifyGoaJurisdiction(p, authContext);
  const isGoa = (jur.status === JURISDICTION_STATUS.GOA_ACT_APPLICABLE || jur.status === JURISDICTION_STATUS.GOA_APPLICABLE);

  if (jur.status === JURISDICTION_STATUS.LEGAL_REVIEW_REQUIRED || jur.status === JURISDICTION_STATUS.GOA_STATUS_UNDETERMINED) {
    const jurBlockersList = (jur.blockers && jur.blockers.length > 0)
      ? jur.blockers
      : ["ERR_GOA_JURISDICTION_UNCONFIRMED: Applicability under Section 1(4) of Goa Act 23 of 2016 is unconfirmed. Domicile or residence in Goa alone does not establish legal regime."];

    jurBlockersList.forEach(jurBlocker => {
      let jurCode = "ERR_GOA_JURISDICTION_UNCONFIRMED";
      const jurCodeMatch = jurBlocker.match(/^(ERR_[A-Z0-9_]+)/);
      if (jurCodeMatch) {
        jurCode = jurCodeMatch[1];
      }
      if (!blockers.some(b => b.code === jurCode && b.errorDescription === jurBlocker)) {
        blockers.push({
          code: jurCode,
          page: "Page 1",
          clause: "Preamble & Jurisdiction Selection",
          errorDescription: jurBlocker,
          applicableStatute: "Section 1(4), Goa Succession Act, 2012",
          requiredCorrection: "Record testator's verified place of birth, parents' birthplace, and civil code personal law status with documentary proof.",
          preventsGeneration: true
        });
      }
    });
  }

  // Gate 1B: Central Personal Law & Shariat Audit Gate
  const pl = resolvePersonalLawRegime(willData, authContext);
  if (pl.regime === PERSONAL_LAW_REGIMES.LEGAL_REVIEW_REQUIRED || (pl.blockers && pl.blockers.length > 0)) {
    const plBlockersList = (pl.blockers && pl.blockers.length > 0)
      ? pl.blockers
      : ["ERR_PERSONAL_LAW_REVIEW_REQUIRED: Personal law regime requires legal review"];

    plBlockersList.forEach(primaryBlocker => {
      let blockerCode = "ERR_PERSONAL_LAW_REVIEW_REQUIRED";
      const codeMatch = primaryBlocker.match(/^(ERR_[A-Z0-9_]+|UNRECOGNIZED_PERSONAL_LAW)/);
      if (codeMatch) {
        blockerCode = codeMatch[1];
      }
      if (primaryBlocker.includes("ISMAILI_BOHRA_SPECIAL_REVIEW")) {
        blockerCode = "ERR_ISMAILI_BOHRA_SPECIAL_REVIEW";
      }

      if (!blockers.some(b => b.code === blockerCode && b.errorDescription === primaryBlocker)) {
        blockers.push({
          code: blockerCode,
          page: "Page 1",
          clause: "Preamble & Personal Law Routing",
          errorDescription: primaryBlocker,
          applicableStatute: pl.statuteCitation || "Applicable Personal Law / Indian Succession Act, 1925",
          requiredCorrection: "Obtain qualified advocate verification of personal law and testamentary authority.",
          preventsGeneration: true
        });
      }
    });
  }

  // Gate 2: Section 333 Mandatory Personal Metadata (for Goa Wills)
  if (isGoa) {
    if (!p.motherName || !p.motherName.trim()) {
      blockers.push({
        code: "ERR_MISSING_SECTION333_METADATA",
        page: "Page 1",
        clause: "Preamble — Testator Parentage",
        errorDescription: "Mother's full name is missing. Section 333(1) mandates full identification of both parents.",
        applicableStatute: "Section 333(1), Goa Succession Act, 2012",
        requiredCorrection: "Enter mother's full legal name in personal details questionnaire.",
        preventsGeneration: true
      });
    }

    if (!p.occupation || !p.occupation.trim()) {
      blockers.push({
        code: "ERR_MISSING_SECTION333_METADATA",
        page: "Page 1",
        clause: "Preamble — Testator Occupation",
        errorDescription: "Occupation is missing. Section 333(1) mandates statement of testator's profession/occupation.",
        applicableStatute: "Section 333(1), Goa Succession Act, 2012",
        requiredCorrection: "Enter current or former professional occupation in personal details.",
        preventsGeneration: true
      });
    }

    if (!p.maritalStatus || !p.maritalStatus.trim()) {
      blockers.push({
        code: "ERR_MISSING_SECTION333_METADATA",
        page: "Page 1",
        clause: "Preamble — Testator Marital Status",
        errorDescription: "Explicit marital status is missing. Section 333(1) mandates statement of marital status.",
        applicableStatute: "Section 333(1), Goa Succession Act, 2012",
        requiredCorrection: "Select explicit marital status (Married, Unmarried, Widowed, Divorced).",
        preventsGeneration: true
      });
    }
  }

  // Gate 3: Title Verification & Unpartitioned Inheritance Checks (Sections 16, 17, 220)
  assets.forEach((asset, idx) => {
    const titleCheck = verifyPropertyTitle(asset, { isGoa });
    if (!titleCheck.isValidTitle || !titleCheck.canBequestSpecificAsset) {
      blockers.push({
        code: titleCheck.isPartitioned === false ? "ERR_UNPARTITIONED_INHERITANCE" : "ERR_TITLE_UNVERIFIED",
        page: `Page ${Math.min(3 + idx, 5)}`,
        clause: `Section V — Asset #${idx + 1} (${asset.type || 'Property'})`,
        errorDescription: titleCheck.blockers[0] || "Property title is unverified or asset forms part of an unpartitioned inheritance.",
        applicableStatute: isGoa ? "Sections 16, 17 & 220, Goa Succession Act, 2012" : "Transfer of Property Act, 1882",
        requiredCorrection: "Provide registered partition deed, registered sale deed, or restrict bequest to testator's undivided fractional share.",
        preventsGeneration: true
      });
    }

    // Gate 4: Section 219 Statutory Nullity for Specific Community Asset Bequest
    if (isGoa) {
      const mat = evaluateAssetMatrimonialOwnership(asset, willData.matrimonial || {});
      const allocs = asset.allocations || [];
      const hasSpecificAllocations = allocs.length > 0;

      if (mat.isDispositionProhibited && hasSpecificAllocations) {
        blockers.push({
          code: "ERR_SECTION219_PROHIBITED_DISPOSITION",
          page: `Page ${Math.min(3 + idx, 5)}`,
          clause: `Section V — Asset #${idx + 1} (${asset.desc || asset.type || 'Community Asset'})`,
          errorDescription: "Under Section 219 of Goa Act 23 of 2016, disposition of a specific, determined asset of the marital community prior to partition is NULL AND VOID. It cannot be bequeathed to third parties without an applicable statutory exception.",
          applicableStatute: "Section 219, Goa Succession Act, 2012 (Goa Act 23 of 2016)",
          requiredCorrection: "Provide registered partition allotment deed, proof of separate asset, bequest exclusively to spouse, or registered Special Notary spouse consent.",
          preventsGeneration: true
        });
      }
    }
  });

  // Gate 5: Section 83/89 Mandatory Inheritance Calculation (Goa Wills)
  if (isGoa) {
    const calc = calculateGoaInheritance(willData);
    if (calc.status === CALCULATION_STATUS.INCOMPLETE) {
      blockers.push({
        code: "ERR_INHERITANCE_INCOMPLETE",
        page: "Page 2",
        clause: "Section III & Schedule — Estate Valuation",
        errorDescription: "Section 89 estate valuation is incomplete. Missing asset values prevent calculation of the Section 83 forced legitime and disposable quota.",
        applicableStatute: "Sections 83 & 89, Goa Succession Act, 2012",
        requiredCorrection: "Enter estimated market values for all assets and declare outstanding debts.",
        preventsGeneration: true
      });
    } else if (calc.status === CALCULATION_STATUS.ESTATE_INSOLVENT) {
      blockers.push({
        code: "ERR_ESTATE_INSOLVENT",
        page: "Page 2",
        clause: "Section IV — Estate Liabilities & Debts",
        errorDescription: calc.blockers[0] || "Enforceable debts exceed total testator estate value. Under Section 45, estate is insolvent.",
        applicableStatute: "Section 45, Goa Succession Act, 2012 (Goa Act 23 of 2016)",
        requiredCorrection: "Settle or re-evaluate estate liabilities before testamentary disposition; creditors have priority over all bequests.",
        preventsGeneration: true
      });
    } else if (calc.status === CALCULATION_STATUS.INOFFICIOUS_BREACH) {
      blockers.push({
        code: "ERR_LEGITIME_BREACH",
        page: "Page 2",
        clause: "Section III & Section V — Bequest Schedule",
        errorDescription: calc.blockers[0] || "Total testamentary bequests exceed the statutory disposable quota (quota disponível).",
        applicableStatute: "Section 83 (Goa Act 35 of 2023) & Sections 110–121 (Statutory Reduction)",
        requiredCorrection: "Reduce testamentary bequests to within the statutory disposable quota pursuant to Section 111 & 112 reduction schedule.",
        preventsGeneration: true
      });
    }
  }

  // Gate 6: Residuary Allocation Verification (100% Check)
  const resCheck = validateResiduaryAllocations(willData);
  if (!resCheck.isValid) {
    blockers.push({
      code: "ERR_RESIDUARY_MISMATCH",
      page: "Page 6",
      clause: "Section VII — Residuary Estate Clause",
      errorDescription: resCheck.blockers[0] || "Total residuary allocations do not equal 100%.",
      applicableStatute: "Indian Succession Act, 1925 / Goa Succession Act, 2012",
      requiredCorrection: "Adjust residuary shares so the sum equals exactly 100.0%.",
      preventsGeneration: true
    });
  }

  const hasFatalBlockers = blockers.some(b => b.preventsGeneration);

  return {
    isExecutionReady: !hasFatalBlockers,
    blockers,
    warnings,
    totalBlockersCount: blockers.length,
    totalWarningsCount: warnings.length
  };
}
