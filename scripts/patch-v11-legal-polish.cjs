/**
 * v11 Legal Polish Patch
 * Fixes identified by Claude (9.5), ChatGPT (9.0), Gemini (9.0) reviews of v10:
 *
 * Fix 1: Demat labels — "BO ID" -> "Client ID", "Full Demat ID" -> "BO ID (16-digit)"
 * Fix 2: Anti-lapse precedence sentence — Claude's exact replacement (plugs 2 logical gaps)
 * Fix 3: Clause (v) SECOND tier — add that inherited share stays subject to divesting
 * Fix 4: Executor power (e) — add valuation date + cash balancing clause
 * Fix 5: Executor power (e) — add securities-in-kind or cash distribution note (ChatGPT/Gemini)
 */

const fs = require('fs');
const path = require('path');

const DRAFT_PREVIEW = path.resolve(__dirname, '../js/render/draftPreview.js');

let src = fs.readFileSync(DRAFT_PREVIEW, 'utf8');
const original = src;
const fixes = [];

// ─── FIX 1: Demat labels ────────────────────────────────────────────────────
// Old: BO ID: ${boId} | Full Demat ID: ${fullDemat}
// New: Client ID: ${boId} | BO ID (16-digit): ${fullDemat}
const f1Old = ".replace(/BO ID:\\\\s*\\\\d{8}-\\\\d{8,16}/i, `BO ID: ${boId} | Full Demat ID: ${fullDemat}`)";
const f1New = ".replace(/BO ID:\\\\s*\\\\d{8}-\\\\d{8,16}/i, `Client ID: ${boId} | BO ID (16-digit): ${fullDemat}`)";
if (src.includes(f1Old)) {
  src = src.replace(f1Old, f1New);
  fixes.push('Fix 1: Demat labels updated (BO ID -> Client ID, Full Demat ID -> BO ID 16-digit)');
} else {
  // Try without escaped backslashes (raw source)
  const f1OldRaw = '`BO ID: ${boId} | Full Demat ID: ${fullDemat}`';
  const f1NewRaw = '`Client ID: ${boId} | BO ID (16-digit): ${fullDemat}`';
  if (src.includes(f1OldRaw)) {
    src = src.replace(f1OldRaw, f1NewRaw);
    fixes.push('Fix 1: Demat labels updated (BO ID -> Client ID, Full Demat ID -> BO ID 16-digit)');
  } else {
    fixes.push('Fix 1 SKIPPED: target not found');
  }
}

// ─── FIX 2: Anti-lapse precedence sentence (Claude's exact replacement) ─────
const f2Old = `The specific succession and divesting provisions of Section V, Clause (v) above (governing the undivided shares in Flat 402) shall prevail over and take priority over these general anti-lapse provisions to the full extent of any inconsistency; the general anti-lapse provisions shall apply to all other assets and any remaining residuary estate.`;
const f2New = `Clause (v) governs the divesting of a child's share of Flat 402 where that child survives me by thirty (30) days but dies before Sunita Sharma (as defined). The general anti-lapse provisions continue to apply to Flat 402 where any named beneficiary predeceases me or fails to survive me by thirty (30) days, and to all other assets and the residuary estate. Any share of Flat 402 passing under these general anti-lapse provisions takes subject to Sunita Sharma's life right of residence.`;
if (src.includes(f2Old)) {
  src = src.replace(f2Old, f2New);
  fixes.push('Fix 2: Anti-lapse precedence sentence replaced with Claude\'s precise version');
} else {
  fixes.push('Fix 2 SKIPPED: target not found');
}

// ─── FIX 3: Clause (v) SECOND tier — inherited share stays subject to divesting
const f3Old = `SECOND, if such deceased child leaves no surviving lineal descendants, upon the other named child under this Will (Aarav Sharma or Ananya Sharma, as the case may be) if that other named child is then living, or, if that other named child is also deceased, upon that other named child's own surviving lineal descendants per stirpes;`;
const f3New = `SECOND, if such deceased child leaves no surviving lineal descendants, upon the other named child under this Will (Aarav Sharma or Ananya Sharma, as the case may be) if that other named child is then living — provided that any share of Flat 402 so received by that surviving named child under this second tier shall itself remain subject to the same divesting conditions of this Clause (v) as originally applicable, until the expiry of Sunita Sharma's life right of residence — or, if that other named child is also deceased, upon that other named child's own surviving lineal descendants per stirpes;`;
if (src.includes(f3Old)) {
  src = src.replace(f3Old, f3New);
  fixes.push('Fix 3: Clause (v) SECOND tier — inherited share remains subject to divesting until life right ends');
} else {
  fixes.push('Fix 3 SKIPPED: target not found');
}

// ─── FIX 4: Executor power (e) — add valuation date + cash balancing ────────
const f4Old = `distribute securities in kind where practicable, or sell and realise non-divisible fractional share and securities holdings at fair market value and distribute the net proceeds in the specified proportions (34:33:33)`;
const f4New = `distribute securities in kind where practicable, or sell and realise non-divisible or fractional share and securities holdings at their fair market value as of the date of distribution (or, where a quoted market price exists, at the last recorded market price on the date of realisation) and distribute the net proceeds in the specified proportions (34:33:33); where whole-unit securities cannot be divided precisely in the ratio 34:33:33, the Executor may apply a cash-balancing payment to achieve equitable division`;
if (src.includes(f4Old)) {
  src = src.replace(f4Old, f4New);
  fixes.push('Fix 4: Executor power (e) — valuation date and cash-balancing clause added');
} else {
  fixes.push('Fix 4 SKIPPED: target not found');
}

// ─── Write result ────────────────────────────────────────────────────────────
if (src !== original) {
  fs.writeFileSync(DRAFT_PREVIEW, src, 'utf8');
  console.log('\n✅ v11 patch applied to draftPreview.js\n');
} else {
  console.log('\n⚠️  No changes made — all fixes skipped?\n');
}

fixes.forEach((f, i) => console.log(`  [${i + 1}] ${f}`));
console.log('');
