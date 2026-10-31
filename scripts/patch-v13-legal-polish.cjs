/**
 * v13 Legal Polish Patch
 * Addresses all feedback from ChatGPT (9.2) and Claude (9.6) reviews of v12:
 *
 * 1. Fix "clause (vi) below" -> "Clause (vi) above"
 * 2. Harmonize anti-lapse flat shares with Clause (v) divesting rules
 * 3. Harmonize posthumous descendant survival calculation with Charitable Fallback trigger
 * 4. Securities clause: single common valuation date, debts paid first, sell securities to equalize
 * 5. Residence right phrasing: charged upon property, non-terminable by co-owners, voluntarily surrenderable by registered deed
 * 6. Explicit "Remainder of Page Intentionally Left Blank" markers for pages 4 and 6
 */

const fs = require('fs');
const path = require('path');

const DRAFT_PREVIEW = path.resolve(__dirname, '../js/render/draftPreview.js');

let src = fs.readFileSync(DRAFT_PREVIEW, 'utf8');
const original = src;
const fixes = [];

// ─── FIX 1 & 2: Anti-lapse ending — "Clause (vi) above" + Clause (v) divesting harmony ───
const f1Old = `Any share of Flat 402 passing under these general anti-lapse provisions takes subject to Sunita Sharma's life right of residence, if she survives me by thirty (30) days, and otherwise takes free of that right under clause (vi) below.`;
const f1New = `Any share of Flat 402 passing to a named child or sibling under these general anti-lapse provisions takes subject to Sunita Sharma's life right of residence (if she survives me by thirty (30) days, and otherwise takes free of that right under Clause (vi) above), and shall further be held subject to the divesting and succession conditions of Clause (v) above until the expiration of said life right.`;

if (src.includes(f1Old)) {
  src = src.replace(f1Old, f1New);
  fixes.push('Fix 1 & 2 ✅ Anti-lapse: "Clause (vi) above" corrected + anti-lapse shares expressly subject to Clause (v) divesting');
} else {
  fixes.push('Fix 1 & 2 ❌ SKIPPED — target not found');
}

// ─── FIX 3: Charitable fallback trigger — posthumous descendant cross-reference ───────────
const f3Old = `If, upon application of all preceding survivorship, substitution, and anti-lapse provisions, no named beneficiary or qualifying lineal descendant survives the Testator by thirty (30) consecutive calendar days, then my Executor is directed to realise my entire net estate`;
const f3New = `If, upon application of all preceding survivorship, substitution, and anti-lapse provisions, no named beneficiary or qualifying lineal descendant survives the Testator by thirty (30) consecutive calendar days (provided that the survival requirement for any qualifying posthumously born descendant shall be determined in accordance with the birth-based survival rule stated in the anti-lapse clause above), then my Executor is directed to realise my entire net estate`;

if (src.includes(f3Old)) {
  src = src.replace(f3Old, f3New);
  fixes.push('Fix 3 ✅ Charitable fallback: harmonised with birth-based 30-day survival calculation for posthumous descendants');
} else {
  fixes.push('Fix 3 ❌ SKIPPED — target not found');
}

// ─── FIX 4: Securities clause — common valuation date, debts priority, sell to equalize ───
const f4Old = `distribute securities in kind where practicable (valued at the closing market price on the distribution date or, where no exchange price is available, at fair value determined by an independent valuer appointed by the Executor); sell non-divisible or fractional holdings at the prevailing market price on the date of realisation and distribute the net sale proceeds in the ratio 34:33:33; where whole-unit securities cannot be divided precisely in the ratio 34:33:33, the Executor shall make a cash-balancing payment from the estate's liquid funds (or, where estate liquid funds are insufficient, require the beneficiary receiving the excess value to pay the shortfall in cash to the other beneficiaries) so that each beneficiary's aggregate entitlement is as close as practicable to their specified proportional share, with written allocation statements provided to all beneficiaries documenting the value of securities transferred and any cash adjustments made;`;
const f4New = `distribute securities in kind where practicable (valued at the closing market price on a single common distribution date for all beneficiaries or, where no exchange price is available, at fair value determined by an independent valuer appointed by the Executor); sell non-divisible or fractional holdings at the prevailing market price on the date of realisation and distribute the net sale proceeds in the ratio 34:33:33; where whole-unit securities cannot be divided precisely in the ratio 34:33:33, the Executor shall make a cash-balancing payment from available estate liquid funds remaining after full discharge of statutory debts, taxes, and administration expenses under Clauses IV(c) and IV(d) (or, where estate liquid funds are insufficient, sell sufficient securities to equalise the shares) so that each beneficiary's aggregate entitlement is as close as practicable to their specified proportional share, with written allocation statements provided to all beneficiaries documenting the value of securities transferred and any cash adjustments made;`;

if (src.includes(f4Old)) {
  src = src.replace(f4Old, f4New);
  fixes.push('Fix 4 ✅ Securities clause: single common distribution date, debts priority for cash balancing, and executor sells securities to equalise');
} else {
  fixes.push('Fix 4 ❌ SKIPPED — target not found');
}

// ─── FIX 5: Residence right phrasing — charged upon property, non-terminable ─────────────
const f5Old = `The bequests of the undivided 33% shares to my son Aarav Sharma and my daughter Ananya Sharma are expressly made subject to, encumbered by, and subordinate to the prior, irrevocable <strong>PERSONAL LIFE RIGHT OF RESIDENCE AND OCCUPATION</strong> hereby granted in favor of my spouse, <strong>SUNITA SHARMA</strong>, in the whole of the said residential flat for her natural lifetime:`;
const f5New = `The bequests of the undivided 33% shares to my son Aarav Sharma and my daughter Ananya Sharma are expressly made subject to, encumbered by, and subordinate to the prior <strong>LIFE RIGHT OF RESIDENCE AND OCCUPATION CHARGED UPON THE SAID PROPERTY</strong> hereby granted in favor of my spouse, <strong>SUNITA SHARMA</strong>, in the whole of the said residential flat for her natural lifetime (non-terminable by any co-owner or person claiming under them, and voluntarily surrenderable only by Sunita Sharma through an express registered deed):`;

if (src.includes(f5Old)) {
  src = src.replace(f5Old, f5New);
  fixes.push('Fix 5 ✅ Residence right: charged upon property, non-terminable by co-owners, voluntarily surrenderable by registered deed');
} else {
  fixes.push('Fix 5 ❌ SKIPPED — target not found');
}

// ─── FIX 6: Upgraded Page Gap Markers — institutional legal blank space protection ───────
const f6Marker1Old = `<div class="page-gap-marker">&mdash;&mdash;&mdash;&mdash; continued on next page &mdash;&mdash;&mdash;&mdash;</div>\n        <div class="draft-subclause-box">`;
const f6Marker1New = `<div class="page-gap-marker">[ &mdash;&mdash;&mdash;&mdash; Remainder of Page Intentionally Left Blank &bull; Continued on Next Page &mdash;&mdash;&mdash;&mdash; ]</div>\n        <div class="draft-subclause-box">`;

if (src.includes(f6Marker1Old)) {
  src = src.replace(f6Marker1Old, f6Marker1New);
  fixes.push('Fix 6a ✅ Page 4 Gap Marker: institutional "[ Remainder of Page Intentionally Left Blank • Continued on Next Page ]"');
} else {
  fixes.push('Fix 6a ❌ SKIPPED — marker 1 not found');
}

const f6Marker2Old = `<div class="page-gap-marker">&mdash;&mdash;&mdash;&mdash; continued on next page &mdash;&mdash;&mdash;&mdash;</div>\n      <div class="closing-execution-container"`;
const f6Marker2New = `<div class="page-gap-marker">[ &mdash;&mdash;&mdash;&mdash; Remainder of Page Intentionally Left Blank &bull; Continued on Next Page for Execution &mdash;&mdash;&mdash;&mdash; ]</div>\n      <div class="closing-execution-container"`;

if (src.includes(f6Marker2Old)) {
  src = src.replace(f6Marker2Old, f6Marker2New);
  fixes.push('Fix 6b ✅ Page 6 Gap Marker: institutional "[ Remainder of Page Intentionally Left Blank • Continued on Next Page for Execution ]"');
} else {
  fixes.push('Fix 6b ❌ SKIPPED — marker 2 not found');
}

// ─── Write result ────────────────────────────────────────────────────────────
if (src !== original) {
  fs.writeFileSync(DRAFT_PREVIEW, src, 'utf8');
  console.log('\n✅ v13 patch applied to draftPreview.js\n');
} else {
  console.log('\n⚠️  No changes written — all fixes skipped\n');
}

fixes.forEach((f, i) => console.log(`  [${i + 1}] ${f}`));
console.log('');
