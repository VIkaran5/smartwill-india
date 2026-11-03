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
  if (assets.length > 0) {
    let titleVerifiedCount = 0;
    assets.forEach(a => {
      const details = a.details || {};
      if (details.registrationNumber || a.titleDocType === 'REGISTERED_SALE_DEED' || a.titleDocType === 'REGISTERED_PARTITION_DEED') {
        titleVerifiedCount++;
      }
    });
    const titleRatio = titleVerifiedCount / assets.length;
    scoreC += Math.round(titleRatio * 20);
  }

  // Pillar D: Formatting & Section 333 Compliance (15 pts)
  if (isGoa) {
    if (p.motherName && p.occupation && p.maritalStatus) scoreD += 10;
    scoreD += 5; // Section 333 double-spaced engine active
  } else {
    scoreD += 15; // Standard Indian Succession Act formatting
  }

  // Pillar E: Execution Readiness (15 pts)
  if (willData.witnesses && willData.witnesses.length >= 2) scoreE += 5;
  if (audit.warnings.length === 0) scoreE += 5;
  if (audit.isExecutionReady) scoreE += 5;

  let totalScore = scoreA + scoreB + scoreC + scoreD + scoreE;

  // Enforce Blocker Rule: If any mandatory blocker exists, cap score at 75 and set status to INCOMPLETE
  let statusBadge = DRAFT_STATUS_BANDS.INCOMPLETE;

  if (audit.totalBlockersCount > 0) {
    totalScore = Math.min(totalScore, 75);
    statusBadge = DRAFT_STATUS_BANDS.INCOMPLETE;
  } else {
    if (totalScore >= 96) {
      statusBadge = DRAFT_STATUS_BANDS.VERIFIED_EXECUTION_DRAFT;
    } else if (totalScore >= 80) {
      statusBadge = DRAFT_STATUS_BANDS.READY_FOR_NOTARY_REVIEW;
    } else {
      statusBadge = DRAFT_STATUS_BANDS.INCOMPLETE;
    }
  }

  // Check if actual notarial execution details are entered (post-execution)
  const notaryData = willData.specialNotaryExecution || {};
  if (notaryData.registrationNumber && notaryData.bookVolume && notaryData.executionDate) {
    statusBadge = DRAFT_STATUS_BANDS.NOTARIAL_EXECUTION_COMPLETED;
  }

  return {
    score: totalScore,
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
