/**
 * v9 Tri-AI Patch Script
 * Addresses ALL issues from Claude (9.4/10), Gemini (9.4/10), ChatGPT (8.5/10)
 *
 * ROOT CAUSE of layout bug: .draft-asset-item has a bordered box. When break-inside:auto
 * allows content to flow, Chromium renders the box border on one page but content on next,
 * creating a large empty bordered box. Fix: flatten the box in @media print.
 *
 * Fixes:
 * 1. LAYOUT ROOT FIX - In @media print: flatten .draft-asset-item & .draft-protective-proviso
 *    (remove border/background/padding) so content flows as plain text, no empty box
 * 2. SECTION IV(i) PROBATE - Remove s.213 legislative commentary; simplify to 2 clean sentences
 *    + fix "any beneficiary" → eligible persons under Sections 231-235 ISA
 * 3. INCOME-TAX TERMINOLOGY - Replace "AY 2027-28" with "Tax Year 2026-27 and subsequent tax years"
 *    (new IT Act 2025 uses "Tax Year" not "Assessment Year")
 * 4. HELPAGE REGISTRATION - Remove unverified "S/9270" registration number
 * 5. CHARITABLE FALLBACK - Remove "Section 12A/80G" (IT Act 1961 numbers); replace with
 *    "registered and approved as a charitable institution under applicable income-tax law"
 * 6. PMNRF ADDRESS - Update from "South Block" to "Seva Teerth, New Delhi 110011"
 * 7. CLAUSE (v) POSTHUMOUS - "conceived before my death" → "conceived before the deceased child's death"
 * 8. CLAUSE (v) MIXED-BRANCH FIX - ChatGPT scenario: if Aarav dies w/ kids + Ananya dies w/ no kids,
 *    Ananya's share → Aarav's kids (sibling's lineal descendants). Clarify SECOND tier.
 * 9. SUBSTITUTE FLAT TERMS - Add that substitute flat takes same divesting terms as original
 * 10. EXECUTION DATE - Add "month and year" hint in blank (Claude: no year in blank)
 */

const fs = require('fs');
const path = require('path');

const DRAFT_PREVIEW = path.join(__dirname, '../js/render/draftPreview.js');
const APP_CSS = path.join(__dirname, '../css/app.css');

let dpContent = fs.readFileSync(DRAFT_PREVIEW, 'utf8');
let cssContent = fs.readFileSync(APP_CSS, 'utf8');

let fixCount = 0;
let failCount = 0;

function applyFix(label, content, search, replace) {
  if (content.includes(search)) {
    console.log(`  ✅ ${label}`);
    fixCount++;
    return content.split(search).join(replace);
  } else {
    console.error(`  ❌ FAILED: ${label}`);
    console.error(`     Search (first 120): "${search.substring(0,120)}"`);
    failCount++;
    return content;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FIX 1: CSS LAYOUT ROOT FIX
// Flatten .draft-asset-item AND .draft-protective-proviso in @media print
// so the bordered box doesn't create empty shells when content flows across pages
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[FIX 1] CSS: Flatten asset boxes in print mode (ROOT CAUSE of empty bordered box)...');
cssContent = applyFix(
  'Add print flattening for draft-asset-item and draft-protective-proviso at end of @media print',
  cssContent,
  '  h2, h3, h4, .clause-title, .section-number-tag {\n    break-after: avoid !important;\n    page-break-after: avoid !important;\n  }\n}',
  `  h2, h3, h4, .clause-title, .section-number-tag {
    break-after: avoid !important;
    page-break-after: avoid !important;
  }
  /* Flatten asset boxes so content flows without creating empty bordered shells */
  .draft-asset-item {
    border: none !important;
    border-left: none !important;
    background: none !important;
    box-shadow: none !important;
    padding: 2pt 0 !important;
    margin: 4pt 0 !important;
    break-inside: auto !important;
    page-break-inside: auto !important;
  }
  .draft-asset-item .draft-asset-header {
    border-bottom: 0.75pt solid #1e293b !important;
    margin-bottom: 4pt !important;
    padding-bottom: 2pt !important;
    font-weight: bold !important;
  }
  .draft-protective-proviso {
    border: none !important;
    border-left: 2pt solid #1e293b !important;
    background: none !important;
    padding: 4pt 8pt !important;
    break-inside: auto !important;
    page-break-inside: auto !important;
  }
}`
);

// ─────────────────────────────────────────────────────────────────────────────
// FIX 2: SECTION IV(i) PROBATE — Remove s.213 legislative commentary
// Simplify + fix "any beneficiary" → Sections 231-235 ISA
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[FIX 2] Section IV(i): Remove s.213 commentary, simplify probate clause...');
dpContent = applyFix(
  'Probate clause: clean simple wording + s.231-235 reference',
  dpContent,
  `• <strong>(i) Court Authority & Probate:</strong> Apply for Probate of this Will or such other court grant as required before a Court of competent jurisdiction if deemed necessary or required by any institution, authority, or co-owner; note that Section 213 of the Indian Succession Act, 1925 was omitted by the Repealing and Amending Act, 2025 (Act 37 of 2025, effective 20 December 2025), so a legatee's right need no longer be established exclusively by probate under that section alone; however, probate or Letters of Administration with the Will annexed may still be sought where required by institutions, courts, or registration authorities (or, in the event that no named Executor is able or willing to act, any beneficiary may apply for Letters of Administration with the Will annexed).`,
  `• <strong>(i) Court Authority & Probate:</strong> Apply for Probate of this Will or any other court grant if deemed necessary or required by any institution or authority. In the event that no named Executor is able or willing to act, an eligible person may apply for Letters of Administration with the Will annexed in accordance with Sections 231 to 235 of the Indian Succession Act, 1925, as applicable.`
);

// ─────────────────────────────────────────────────────────────────────────────
// FIX 3: INCOME-TAX TERMINOLOGY — "AY 2027-28" → "Tax Year 2026-27"
// IT Act 2025 uses "Tax Year" not "Assessment Year"
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[FIX 3] IT Act: replace AY terminology with Tax Year...');
dpContent = applyFix(
  'IT Act: AY 2026-27/AY 2027-28 → Tax Year terminology',
  dpContent,
  `Comply with all applicable income-tax and other statutory tax laws — including (i) the Income-tax Act, 1961 as applicable to assessment years up to and including AY 2026-27 (income of FY 2025-26 and earlier periods), and (ii) the Income-tax Act, 2025 (in force from 1 April 2026) as applicable to AY 2027-28 onwards — prepare and file my final Income Tax Returns (ITR), discharge all outstanding and applicable tax liabilities and tax-compliance obligations of the deceased and estate arising from or in connection with the administration of this estate (including capital gains arising from estate transactions);`,
  `Comply with all applicable income-tax and other statutory tax laws as in force for the relevant period — including the Income-tax Act, 1961 (governing Assessment Year 2026-27 and all prior assessment years) and the Income-tax Act, 2025 (in force from 1 April 2026, governing Tax Year 2026-27 and subsequent tax years) — prepare and file my final returns, discharge all outstanding and applicable tax liabilities and tax-compliance obligations of the deceased and estate (including capital gains arising from estate transactions);`
);

// ─────────────────────────────────────────────────────────────────────────────
// FIX 4: HELPAGE INDIA — Remove unverified registration number S/9270
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[FIX 4] HelpAge India: remove unverified registration number...');
dpContent = applyFix(
  'HelpAge: remove S/9270 reg number',
  dpContent,
  `to be paid to HelpAge India, a society registered under the Societies Registration Act, XXI of 1860, bearing registration number S/9270 (Registered Office: C-14, Qutab Institutional Area, New Delhi 110016), for the relief of poverty, education, and eldercare;`,
  `to be paid to HelpAge India, a society registered under the Societies Registration Act, XXI of 1860 (Registered Office: C-14, Qutab Institutional Area, New Delhi 110016), for the relief of poverty, education, and eldercare;`
);

// ─────────────────────────────────────────────────────────────────────────────
// FIX 5: CHARITABLE FALLBACK — Remove "Section 12A/80G" old IT Act section numbers
// Replace with generic "registered and approved as charitable institution under applicable income-tax law"
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[FIX 5] Charitable fallback: remove Section 12A/80G old section references...');
dpContent = applyFix(
  'Charitable fallback: generic charitable registration (no section numbers)',
  dpContent,
  `to such other institution registered under Section 12A and exempt under Section 80G of the applicable income-tax law as my Executor, acting honestly and with clearly documented reasons and selection criteria, shall select with the prior approval of a court of competent jurisdiction obtained by appropriate court application`,
  `to such other institution duly registered and approved as a charitable institution under applicable income-tax law as my Executor, acting honestly and with clearly documented reasons and selection criteria, shall select with the prior approval of a court of competent jurisdiction obtained by appropriate court application`
);

// ─────────────────────────────────────────────────────────────────────────────
// FIX 6: PMNRF ADDRESS — Update from "South Block" to "Seva Teerth, New Delhi 110011"
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[FIX 6] PMNRF: update address from South Block to Seva Teerth...');
dpContent = applyFix(
  'PMNRF address: South Block → Seva Teerth, New Delhi 110011',
  dpContent,
  `<strong>PRIME MINISTER'S NATIONAL RELIEF FUND (PMNRF)</strong>, Government of India (administered by the Prime Minister's Office, South Block, New Delhi)`,
  `<strong>PRIME MINISTER'S NATIONAL RELIEF FUND (PMNRF)</strong>, Government of India (Seva Teerth, New Delhi 110011)`
);

// ─────────────────────────────────────────────────────────────────────────────
// FIX 7: CLAUSE (v) POSTHUMOUS — "conceived before my death" → "conceived before the deceased child's death"
// For the first tier, it should be the deceased child's death that matters, not the testator's
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[FIX 7] Clause (v): fix posthumous date - deceased child\'s death, not testator\'s...');
dpContent = applyFix(
  'Clause (v) FIRST tier: posthumous conceived before deceased child\'s death',
  dpContent,
  `FIRST, upon their surviving lineal descendants per stirpes, to the absolute exclusion of spouses and collateral heirs (and a child conceived before my death and born alive thereafter shall qualify as a lineal descendant, with the thirty-day survival period calculated from the date of birth);`,
  `FIRST, upon their surviving lineal descendants per stirpes, to the absolute exclusion of spouses and collateral heirs (and a child conceived before the deceased child's death and born alive thereafter shall qualify as a lineal descendant under this Will, with any applicable survival period calculated from the date of birth);`
);

// Also fix the anti-lapse clause posthumous reference (testator's death IS correct there)
// That one remains "conceived before my death" — correct for the general anti-lapse clause

// ─────────────────────────────────────────────────────────────────────────────
// FIX 8: CLAUSE (v) SECOND TIER — Fix mixed-branch scenario (ChatGPT)
// Scenario: Aarav dies with kids, Ananya dies with NO kids, Sunita alive
// Ananya's share should go to Aarav's kids (Aarav is dead but his lineal descendants survive)
// Current: "surviving named sibling" — Aarav is NOT surviving, so ambiguous
// Fix: Explicitly say "the other named child if then living, or that other named child's lineal descendants"
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[FIX 8] Clause (v) SECOND tier: mixed-branch scenario fix...');
dpContent = applyFix(
  'Clause (v) SECOND tier: explicit sibling-or-sibling\'s-descendants regardless of sibling survival',
  dpContent,
  `SECOND, if such deceased child leaves no surviving lineal descendants, upon the surviving named sibling (i.e., whichever of Aarav Sharma or Ananya Sharma survives Sunita), or upon that surviving sibling's own lineal descendants per stirpes;`,
  `SECOND, if such deceased child leaves no surviving lineal descendants, upon the other named child under this Will (Aarav Sharma or Ananya Sharma, as the case may be) if that other named child is then living, or, if that other named child is also deceased, upon that other named child's own surviving lineal descendants per stirpes;`
);

// ─────────────────────────────────────────────────────────────────────────────
// FIX 9: SUBSTITUTE FLAT — Add that it takes same divesting terms as original
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[FIX 9] Substitute flat: expressly take same divesting terms as original...');
dpContent = applyFix(
  'Substitute flat: same divesting terms as original',
  dpContent,
  `in which Sunita Sharma shall hold an identical lifelong right of residence, with remainder ownership vested in the co-owners in the proportions 34:33:33, and only the surplus sale proceeds, if any, shall be distributed among the co-owners in proportion to their shares;`,
  `in which Sunita Sharma shall hold an identical lifelong right of residence and the substitute flat shall be held on the same terms (including the same succession, divesting, anti-alienation, and outgoings provisions) as the original flat under this Will, with remainder ownership vested in the co-owners in the proportions 34:33:33, and only the surplus sale proceeds, if any, shall be distributed among the co-owners in proportion to their shares;`
);

// ─────────────────────────────────────────────────────────────────────────────
// FIX 10: EXECUTION DATE — Add "day / month / year" hints so full date is written
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[FIX 10] Execution date: add day/month/year structure...');
dpContent = applyFix(
  'Execution date: day / month / year explicit blanks',
  dpContent,
  `on this <strong>__________________</strong> day of <strong>__________________</strong> at`,
  `on this <strong>______</strong> day of <strong>____________________</strong> (Month) <strong>__________</strong> (Year) at`
);

// ─────────────────────────────────────────────────────────────────────────────
// Write updated files
// ─────────────────────────────────────────────────────────────────────────────
fs.writeFileSync(DRAFT_PREVIEW, dpContent, 'utf8');
fs.writeFileSync(APP_CSS, cssContent, 'utf8');

console.log(`\n${'='.repeat(65)}`);
if (failCount === 0) {
  console.log(`✅ v9 Patch Complete: ${fixCount}/${fixCount + failCount} fixes applied successfully!`);
} else {
  console.log(`⚠️  v9 Patch: ${fixCount} applied, ${failCount} FAILED — check above!`);
  process.exit(1);
}
console.log(`${'='.repeat(65)}\n`);
