/**
 * v12 Legal Polish Patch
 * Fixes from Claude (9.6), ChatGPT (9.1), Gemini (9.6) reviews of v11:
 *
 * Fix 1 (HIGH): Anti-lapse ending — add "if she survives me by 30 days, otherwise free of that right"
 * Fix 2 (HIGH): General anti-lapse posthumous — harmonise "before my death" → "before the beneficiary's death"
 * Fix 3 (MEDIUM): Securities clause — single valuation method (closing price on distribution date);
 *                  cash-balancing funded from estate liquid funds; replace "equitable" with precise language
 * Fix 4 (LOW): Clause (v) SECOND tier — split dash-embedded proviso into its own sentence
 */

const fs = require('fs');
const path = require('path');

const DRAFT_PREVIEW = path.resolve(__dirname, '../js/render/draftPreview.js');

let src = fs.readFileSync(DRAFT_PREVIEW, 'utf8');
const original = src;
const fixes = [];

// ─── FIX 1: Anti-lapse ending — Sunita survival condition ─────────────────────
// OLD ending of the anti-lapse sentence:
const f1Old = `Any share of Flat 402 passing under these general anti-lapse provisions takes subject to Sunita Sharma's life right of residence.`;
// NEW — Claude + ChatGPT agreed wording:
const f1New = `Any share of Flat 402 passing under these general anti-lapse provisions takes subject to Sunita Sharma's life right of residence, if she survives me by thirty (30) days, and otherwise takes free of that right under clause (vi) below.`;
if (src.includes(f1Old)) {
  src = src.replace(f1Old, f1New);
  fixes.push('Fix 1 ✅ Anti-lapse ending: Sunita 30-day survival condition added');
} else {
  fixes.push('Fix 1 ❌ SKIPPED — target not found');
}

// ─── FIX 2: General anti-lapse posthumous — "before my death" → "before beneficiary's death" ──
const f2Old = `a person conceived before my death and born alive thereafter shall be treated as a qualifying lineal descendant for all purposes under this Will, with the thirty (30) day survival period calculated from the date of such birth.`;
const f2New = `a person conceived before the death of the beneficiary whose share is devolving under this anti-lapse clause, and born alive thereafter, shall be treated as a qualifying lineal descendant for all purposes under this Will, with the thirty (30) day survival period calculated from the date of birth of such posthumous child.`;
if (src.includes(f2Old)) {
  src = src.replace(f2Old, f2New);
  fixes.push('Fix 2 ✅ General anti-lapse posthumous: harmonised to "beneficiary\'s death" (not "my death")');
} else {
  fixes.push('Fix 2 ❌ SKIPPED — target not found');
}

// ─── FIX 3: Securities valuation — single method + cash balancing source + precise language ─────
const f3Old = `at their fair market value as of the date of distribution (or, where a quoted market price exists, at the last recorded market price on the date of realisation) and distribute the net proceeds in the specified proportions (34:33:33); where whole-unit securities cannot be divided precisely in the ratio 34:33:33, the Executor may apply a cash-balancing payment from the estate's liquid funds, or, where estate liquid funds are insufficient, require the beneficiary receiving the excess to pay the shortfall to the other beneficiaries, so that each beneficiary's aggregate entitlement is as close as practicable to their specified proportional share, with documented written calculations provided to all beneficiaries`;
// Check if Fix 4 from v11 already landed this text or the original:
const f3OldAlt = `at their fair market value as of the date of distribution (or, where a quoted market price exists, at the last recorded market price on the date of realisation) and distribute the net proceeds in the specified proportions (34:33:33); where whole-unit securities cannot be divided precisely in the ratio 34:33:33, the Executor may apply a cash-balancing payment to achieve equitable division`;
const f3New = `in-kind at the closing market price on the distribution date (or, where no exchange price is available, at fair value as determined by an independent valuer appointed by the Executor); sell non-divisible or fractional holdings at the prevailing market price on the date of realisation and distribute the net sale proceeds in the ratio 34:33:33; where whole-unit securities cannot be divided precisely in the ratio 34:33:33, the Executor shall make a cash-balancing payment from the estate's liquid funds (or, where estate liquid funds are insufficient, require the beneficiary receiving the excess value to pay the shortfall in cash to the other beneficiaries) so that each beneficiary's aggregate entitlement is as close as practicable to their specified proportional share, with written allocation statements provided to all beneficiaries documenting the value of securities transferred and any cash adjustments made`;

if (src.includes(f3Old)) {
  src = src.replace(f3Old, f3New);
  fixes.push('Fix 3 ✅ Securities: single valuation method (closing price on distribution date), cash-balancing source and written statements added');
} else if (src.includes(f3OldAlt)) {
  src = src.replace(f3OldAlt, f3New);
  fixes.push('Fix 3 ✅ Securities (alt match): single valuation method (closing price on distribution date), cash-balancing source and written statements added');
} else {
  fixes.push('Fix 3 ❌ SKIPPED — target not found; check line 138 manually');
}

// ─── FIX 4: Clause (v) SECOND tier — split dash-embedded proviso into own sentence ─────────────
const f4Old = `SECOND, if such deceased child leaves no surviving lineal descendants, upon the other named child under this Will (Aarav Sharma or Ananya Sharma, as the case may be) if that other named child is then living — provided that any share of Flat 402 so received by that surviving named child under this second tier shall itself remain subject to the same divesting conditions of this Clause (v) as originally applicable, until the expiry of Sunita Sharma's life right of residence — or, if that other named child is also deceased, upon that other named child's own surviving lineal descendants per stirpes;`;
const f4New = `SECOND, if such deceased child leaves no surviving lineal descendants, the divested share shall pass to the other named child under this Will (Aarav Sharma or Ananya Sharma, as the case may be) if that other named child is then living, or, if that other named child is also deceased, to that other named child's own surviving lineal descendants per stirpes. Any share of Flat 402 received by a surviving named child under this second tier shall itself remain subject to the same divesting conditions of this Clause (v) as originally applicable, until the expiry of Sunita Sharma's life right of residence;`;
if (src.includes(f4Old)) {
  src = src.replace(f4Old, f4New);
  fixes.push('Fix 4 ✅ SECOND tier: dash-embedded proviso split into its own sentence for readability');
} else {
  fixes.push('Fix 4 ❌ SKIPPED — target not found');
}

// ─── Write result ────────────────────────────────────────────────────────────
if (src !== original) {
  fs.writeFileSync(DRAFT_PREVIEW, src, 'utf8');
  console.log('\n✅ v12 patch applied to draftPreview.js\n');
} else {
  console.log('\n⚠️  No changes written — all fixes skipped\n');
}

fixes.forEach((f, i) => console.log(`  [${i + 1}] ${f}`));
console.log('');
