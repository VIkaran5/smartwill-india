/**
 * SmartWill India — Legal Engine 2.1
 * Transparent 100-Point Draft Readiness Index & Execution Status Engine
 *
 * Implements 5-Pillar Evidence-Based Scoring:
 * - Pillar A: Legal Data Completeness (20 pts)
 * - Pillar B: Statutory Jurisdiction & Alignment (30 pts)
 * - Pillar C: Title & Asset Evidence (20 pts)
 * - Pillar D: Section 333 / Formatting Compliance (15 pts)
 * - Pillar E: Execution & Notarial Readiness (15 pts)
 *
 * Explicit Status Bands:
 * - 0–79: INCOMPLETE — CRITICAL LEGAL DEFICIENCIES
 * - 80–95: DRAFT READY FOR SPECIAL NOTARY PRESENTATION
 * - 96–100: VERIFIED EXECUTION DRAFT — AWAITING SPECIAL NOTARY ENDORSEMENT
 * - Post-Execution: NOTARIAL EXECUTION COMPLETED (Requires authenticated Notary credentials)
 */

import { runPreFlightLegalBlockerAudit } from './legalBlockers.js';
import { classifyGoaJurisdiction, JURISDICTION_STATUS } from './goaJurisdiction.js';

export const DRAFT_STATUS_BANDS = {
  INCOMPLETE: "INCOMPLETE — CRITICAL LEGAL DEFICIENCIES",
  READY_FOR_NOTARY_REVIEW: "DRAFT READY FOR SPECIAL NOTARY PRESENTATION",
  VERIFIED_EXECUTION_DRAFT: "VERIFIED EXECUTION DRAFT — AWAITING SPECIAL NOTARY ENDORSEMENT",
  NOTARIAL_EXECUTION_COMPLETED: "NOTARIAL EXECUTION COMPLETED"
};

export function calculateDraftReadinessIndex(willData = {}) {
  const audit = runPreFlightLegalBlockerAudit(willData);
  const p = willData.personal || {};
  const assets = Array.isArray(willData.assets) ? willData.assets : [];
  const jur = classifyGoaJurisdiction(p);
  const isGoa = (jur.status === JURISDICTION_STATUS.GOA_ACT_APPLICABLE);

  let scoreA = 0; // Data completeness (max 20)
  let scoreB = 0; // Statutory alignment (max 30)
  let scoreC = 0; // Title & asset evidence (max 20)
  let scoreD = 0; // Formatting compliance (max 15)
  let scoreE = 0; // Execution readiness (max 15)

  // Pillar A: Legal Data Completeness (20 pts)
  if (p.fullName && p.dob) scoreA += 5;
  if (p.fatherName && (!isGoa || p.motherName)) scoreA += 5;
  if (p.addressLine1 && p.addressCity && p.pincode) scoreA += 5;
  if (p.govtIdType && p.govtIdDigits) scoreA += 5;

  // Pillar B: Statutory Alignment (30 pts)
  if (jur.status !== JURISDICTION_STATUS.LEGAL_REVIEW_REQUIRED) scoreB += 10;
  if (willData.executor && willData.executor.name) scoreB += 10;
  if (willData.beneficiaries && willData.beneficiaries.length > 0) scoreB += 10;

  // Pillar C: Title & Asset Evidence (20 pts)
  // CRITICAL: A mere typed registration number string NEVER awards title points.
  // Requires verified primary registered title deed type.
  if (assets.length > 0) {
    let titleVerifiedCount = 0;
    assets.forEach(a => {
      const details = a.details || {};
      const docType = details.titleDocType || a.titleDocType;
      const hasVerifiedDeed = docType === 'REGISTERED_SALE_DEED' ||
        docType === 'REGISTERED_PARTITION_DEED' ||
        docType === 'FINAL_INVENTORY_DECREE' ||
        docType === 'GOVERNMENT_GRANT' ||
        docType === 'REGISTERED_GIFT_DEED';

      if (hasVerifiedDeed) {
        titleVerifiedCount++;
      }
    });
    const titleRatio = titleVerifiedCount / assets.length;
    scoreC += Math.round(titleRatio * 20);
  }

  // Pillar D: Formatting & Section 333 Compliance (15 pts)
  if (isGoa) {
    if (p.motherName && p.occupation && p.maritalStatus && p.age) scoreD += 10;
    if (willData.witnesses && willData.witnesses.length >= 2 && willData.witnesses.every(w => w.name && (w.address || w.idProof))) {
      scoreD += 5; // Creditworthy witnesses with verified particulars
    }
  } else {
    scoreD += 15; // Standard Indian Succession Act formatting
  }

  // Pillar E: Execution Readiness (15 pts)
  if (willData.witnesses && willData.witnesses.length >= 2) scoreE += 5;
  if (audit.warnings.length === 0) scoreE += 5;
  if (audit.isExecutionReady) scoreE += 5;

  let totalScore = scoreA + scoreB + scoreC + scoreD + scoreE;

  // Enforce Advocate Verification Gate for 96+ Score
  // Under the forensic standard, 96-100 (VERIFIED EXECUTION DRAFT) is strictly blocked
  // without authenticated independent advocate review sign-off.
  const advocate = willData.advocateReviewSignOff || willData.advocateReview || {};
  const hasDocumentedAdvocateReview = Boolean(
    advocate.advocateName &&
    advocate.enrollmentNumber &&
    advocate.reviewDate &&
    (advocate.isAuthenticVerification === true || advocate.isBarCouncilVerified === true || advocate.isVerified === true)
  );

  let statusBadge = DRAFT_STATUS_BANDS.INCOMPLETE;

  if (audit.totalBlockersCount > 0) {
    totalScore = Math.min(totalScore, 75);
    statusBadge = DRAFT_STATUS_BANDS.INCOMPLETE;
  } else {
    if (totalScore >= 96) {
      if (hasDocumentedAdvocateReview) {
        statusBadge = DRAFT_STATUS_BANDS.VERIFIED_EXECUTION_DRAFT;
      } else {
        // Without advocate sign-off, cap at 85/100 and designate Ready for Notary Presentation
        totalScore = Math.min(totalScore, 85);
        statusBadge = DRAFT_STATUS_BANDS.READY_FOR_NOTARY_REVIEW;
      }
    } else if (totalScore >= 80) {
      statusBadge = DRAFT_STATUS_BANDS.READY_FOR_NOTARY_REVIEW;
    } else {
      statusBadge = DRAFT_STATUS_BANDS.INCOMPLETE;
    }
  }

  // Post-execution: Authenticated Special Notary Verification Record
  // CRITICAL STATUTORY SAFEGUARD: Cannot be marked completed if fatal legal blockers exist!
  const notaryData = willData.specialNotaryExecution || {};
  if (
    audit.totalBlockersCount === 0 &&
    notaryData.isNotaryAuthenticated &&
    notaryData.registrationNumber &&
    notaryData.bookVolume &&
    notaryData.executionDate &&
    notaryData.notaryName
  ) {
    statusBadge = DRAFT_STATUS_BANDS.NOTARIAL_EXECUTION_COMPLETED;
  }

  return {
    score: totalScore,
    scoreType: "Draft Checklist Score (Pre-Notarial Self-Assessment)",
    statusBadge,
    isExecutionReady: audit.isExecutionReady,
    pillars: {
      dataCompleteness: { score: scoreA, max: 20 },
      statutoryAlignment: { score: scoreB, max: 30 },
      titleEvidence: { score: scoreC, max: 20 },
      formattingCompliance: { score: scoreD, max: 15 },
      executionReadiness: { score: scoreE, max: 15 }
    },
    audit
  };
}
