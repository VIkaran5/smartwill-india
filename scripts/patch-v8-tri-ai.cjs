/**
 * v8 Tri-AI Patch Script
 * Addresses ALL remaining issues from Gemini (9.9/10), Claude (9.3/10), ChatGPT (8.5/10)
 */

const fs = require('fs');
const path = require('path');

const DRAFT_PREVIEW = path.join(__dirname, '../js/render/draftPreview.js');
const APP_CSS = path.join(__dirname, '../css/app.css');

let dpContent = fs.readFileSync(DRAFT_PREVIEW, 'utf8');
let cssContent = fs.readFileSync(APP_CSS, 'utf8');

let fixCount = 0;

function applyFix(label, contentVar, search, replace) {
  if (contentVar.includes(search)) {
    console.log(`  ✅ Fix applied: ${label}`);
    fixCount++;
    return contentVar.split(search).join(replace);
  } else {
    console.error(`  ❌ FAILED: ${label}`);
    console.error(`     Search (first 100): "${search.substring(0,100)}"`);
    return contentVar;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FIX 1: CSS - Allow .draft-asset-item to flow across pages (fix blank pages 3-4)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[FIX 1] CSS: Allow draft-asset-item to flow across page breaks...');
cssContent = applyFix(
  'Remove draft-asset-item from break-inside:avoid list',
  cssContent,
  '  .draft-asset-split-card, .draft-asset-item, .draft-subclause-box, .witness-grid, .witness-notarial-card, .execution-signature-grid, .testator-signature-block, .lti-box, .closing-execution-container, .page-auth-safeguard, .legal-advisory-callout {',
  '  .draft-asset-split-card, .draft-subclause-box, .witness-grid, .witness-notarial-card, .execution-signature-grid, .testator-signature-block, .lti-box, .closing-execution-container, .page-auth-safeguard, .legal-advisory-callout {'
);
cssContent = applyFix(
  'Add draft-asset-item break-inside:auto in @media print',
  cssContent,
  '  .clause-block {\n    break-inside: auto !important;\n    page-break-inside: auto !important;\n  }',
  '  .clause-block, .draft-asset-item {\n    break-inside: auto !important;\n    page-break-inside: auto !important;\n  }'
);

// ─────────────────────────────────────────────────────────────────────────────
// FIX 2: Income-tax Act — dual-law reference (1961 + 2025)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[FIX 2] Income-tax Act: dual-law reference...');
dpContent = applyFix(
  'IT Act dual-law: 1961 (prior periods) + 2025 (current)',
  dpContent,
  'Comply with all applicable income-tax and other statutory tax laws (including under the Income-tax Act, 2025 in force from 1 April 2026), prepare and file my final Income Tax Returns (ITR), discharge all outstanding and applicable tax liabilities and tax-compliance obligations of the deceased and estate arising from or in connection with the administration of this estate (including capital gains arising from estate transactions);',
  'Comply with all applicable income-tax and other statutory tax laws — including (i) the Income-tax Act, 1961 as applicable to assessment years up to and including AY 2026-27 (income of FY 2025-26 and earlier periods), and (ii) the Income-tax Act, 2025 (in force from 1 April 2026) as applicable to AY 2027-28 onwards — prepare and file my final Income Tax Returns (ITR), discharge all outstanding and applicable tax liabilities and tax-compliance obligations of the deceased and estate arising from or in connection with the administration of this estate (including capital gains arising from estate transactions);'
);

// ─────────────────────────────────────────────────────────────────────────────
// FIX 3: HelpAge India — correct from "charitable trust" → "society reg. no. 9270"
//         and fix court clause: "consultation" → "prior approval"
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[FIX 3] HelpAge India + court approval fix...');
dpContent = applyFix(
  'HelpAge India: trust→society + court consultation→approval',
  dpContent,
  'to be paid to the HelpAge India registered national charitable trust (Registered Office: C-14, Qutab Institutional Area, New Delhi 110016) for the relief of poverty, education, and eldercare; and failing which, to such other registered public charitable trust or institution as my Executor, acting honestly and with recorded reasons, shall select in consultation with a High Court of competent jurisdiction, in each case to the absolute exclusion of any intestate succession.',
  'to be paid to HelpAge India, a society registered under the Societies Registration Act, XXI of 1860, bearing registration number S/9270 (Registered Office: C-14, Qutab Institutional Area, New Delhi 110016), for the relief of poverty, education, and eldercare; and failing which, to such other institution registered under Section 12A and exempt under Section 80G of the applicable income-tax law as my Executor, acting honestly and with clearly documented reasons and selection criteria, shall select with the prior approval of a court of competent jurisdiction obtained by appropriate court application, in each case to the absolute exclusion of any intestate succession.'
);

// ─────────────────────────────────────────────────────────────────────────────
// FIX 4: Clause (v) — full rewrite:
//   a) "vests, subject to divesting" 
//   b) Define "predeceases Sunita" timing
//   c) THIRD tier: both branches fail → Sunita absolutely
//   d) Posthumous child protection in clause (v) specifically
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[FIX 4] Clause (v): vesting language, dual-branch-fail fallback, posthumous...');
dpContent = applyFix(
  'Clause (v) full rewrite with triple-tier devolution and Sunita ultimate fallback',
  dpContent,
  `• <strong>(v) Vesting of Remainder Interest (Section 119 ISA):</strong> The remainder ownership shares of Aarav Sharma and Ananya Sharma vest immediately upon my demise under Section 119 of the Indian Succession Act, 1925, but their right to physical partition or separate unencumbered possession is postponed until the demise of Sunita Sharma or her voluntary surrender of her residence right by registered deed. If either child predeceases Sunita after surviving me by thirty (30) consecutive calendar days, their vested remainder interest shall devolve upon their surviving lineal descendants per stirpes (to the absolute exclusion of spouses and collateral heirs). In the event that such deceased child leaves no surviving lineal descendants, their vested remainder share shall pass exclusively to the surviving sibling of such deceased child (i.e., the other child named under this Will), or if the surviving sibling has also predeceased, to the surviving sibling's own lineal descendants per stirpes. Spouses and collateral heirs of the deceased child are expressly excluded from any benefit under this clause in all circumstances.`,
  `• <strong>(v) Vesting of Remainder Interest (Section 119 ISA):</strong> The remainder ownership shares of Aarav Sharma and Ananya Sharma vest, subject to divesting in the circumstances set out below, in each child immediately upon my demise under Section 119 of the Indian Succession Act, 1925, but their right to physical partition or separate unencumbered possession is postponed until the demise of Sunita Sharma or her voluntary surrender of her residence right by registered deed. For the purposes of this clause, the expression "predeceases Sunita" means dying before Sunita Sharma's own death or before her registered voluntary surrender of her residence right, whichever event first occurs. If either named child predeceases Sunita (as so defined) having survived me by thirty (30) consecutive calendar days, their vested remainder interest shall divest and devolve in the following order of priority: FIRST, upon their surviving lineal descendants per stirpes, to the absolute exclusion of spouses and collateral heirs (and a child conceived before my death and born alive thereafter shall qualify as a lineal descendant, with the thirty-day survival period calculated from the date of birth); SECOND, if such deceased child leaves no surviving lineal descendants, upon the surviving named sibling (i.e., whichever of Aarav Sharma or Ananya Sharma survives Sunita), or upon that surviving sibling's own lineal descendants per stirpes; THIRD, if both named children have predeceased Sunita (as defined above) and neither has any surviving lineal descendants, the divested remainder shares of both children shall pass to SUNITA SHARMA absolutely and unconditionally as her own separate property. Spouses and collateral heirs of any deceased child are expressly excluded in all circumstances.`
);

// ─────────────────────────────────────────────────────────────────────────────
// FIX 5: Substitute accommodation — use full flat value (not Sunita's 34%)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[FIX 5] Substitute accommodation: full flat value benchmark...');
dpContent = applyFix(
  'Substitute accommodation: full flat sale price floor (not 34%)',
  dpContent,
  'and valued at not less than the proportionate fair market value of Sunita Sharma\'s share in the sold flat) in which Sunita Sharma shall hold an identical lifelong right of residence',
  'and valued at not less than the net sale price of the entire original flat (less reasonable and documented transaction costs and enforceable estate debts discharged from the proceeds)) in which Sunita Sharma shall hold an identical lifelong right of residence'
);

// ─────────────────────────────────────────────────────────────────────────────
// FIX 6: Execution date — remove parenthetical "(Date to be handwritten...)"
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[FIX 6] Execution date: remove parenthetical instruction...');
dpContent = applyFix(
  'Remove (Date to be handwritten in ink at time of signing)',
  dpContent,
  'on this <strong>__________________</strong> (Date to be handwritten in ink at time of signing) at',
  'on this <strong>__________________</strong> day of <strong>__________________</strong> at'
);

// ─────────────────────────────────────────────────────────────────────────────
// FIX 7: Posthumous descendants — add to SURVIVORSHIP & ANTI-LAPSE CLAUSE
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[FIX 7] Survivorship clause: posthumous descendants protection...');
dpContent = applyFix(
  'Posthumous descendants: 30-day period from birth',
  dpContent,
  'In the event that a deceased beneficiary leaves no surviving lineal descendants who survive me by thirty (30) days, their share shall be divided equally among the remaining surviving named beneficiaries of this Will.',
  'In the event that a deceased beneficiary leaves no surviving lineal descendants who survive me by thirty (30) days, their share shall be divided equally among the remaining surviving named beneficiaries of this Will. For the avoidance of doubt, a person conceived before my death and born alive thereafter shall be treated as a qualifying lineal descendant for all purposes under this Will, with the thirty (30) day survival period calculated from the date of such birth.'
);

// ─────────────────────────────────────────────────────────────────────────────
// FIX 8: Section IV(i) — Update probate: note s.213 omitted by R&A Act 2025
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[FIX 8] Probate: note s.213 omitted by Repealing & Amending Act 2025...');
dpContent = applyFix(
  'Probate reference updated for omission of s.213',
  dpContent,
  '(i) Court Authority &amp; Probate:</strong> Apply for Probate of this Will before a Court of competent jurisdiction if deemed necessary or required by any institution (or, in the event that no named Executor is able or willing to act, for any beneficiary to apply for Letters of Administration with the Will annexed).',
  '(i) Court Authority &amp; Probate:</strong> Apply for Probate of this Will or such other court grant as required before a Court of competent jurisdiction if deemed necessary or required by any institution, authority, or co-owner; note that Section 213 of the Indian Succession Act, 1925 was omitted by the Repealing and Amending Act, 2025 (Act 37 of 2025, effective 20 December 2025), so a legatee\'s right need no longer be established exclusively by probate under that section alone; however, probate or Letters of Administration with the Will annexed may still be sought where required by institutions, courts, or registration authorities (or, in the event that no named Executor is able or willing to act, any beneficiary may apply for Letters of Administration with the Will annexed).'
);

// ─────────────────────────────────────────────────────────────────────────────
// Write updated files
// ─────────────────────────────────────────────────────────────────────────────
fs.writeFileSync(DRAFT_PREVIEW, dpContent, 'utf8');
fs.writeFileSync(APP_CSS, cssContent, 'utf8');

console.log(`\n${'='.repeat(60)}`);
console.log(`v8 Patch Complete. ${fixCount}/8 fixes applied.`);
if (fixCount < 8) {
  console.log('⚠️  Some fixes failed - check logs above!');
  process.exit(1);
} else {
  console.log('✅ All 8 fixes applied successfully!');
}
console.log(`${'='.repeat(60)}\n`);
