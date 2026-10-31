/**
 * v10 Tri-AI Final Polish Patch
 * Addresses remaining items from Claude (9.6/10), Gemini (9.6/10), ChatGPT (8.8/10)
 *
 * Fixes:
 * 1. PMNRF address — remove conflicting street address → "Prime Minister's Office, New Delhi"
 * 2. Section 323 — separate s.322 priority rule from s.323 rateable payment (more precise)
 * 3. Clause (v) posthumous — add "must survive 30 days from birth" explicitly
 * 4. Clause (v) "predeceases Sunita" — "before the earlier of (a) death and (b) effective surrender"
 * 5. Anti-lapse vs Flat-specific succession — add express precedence rule
 * 6. Charitable fallback final tier — add permitted charitable objectives list
 * 7. Zerodha BO ID — fix display: split combined "12081600-04521892" into DP ID + BO ID
 * 8. Page gaps — add print-only "—— End of page ——" separator CSS class + inline markers
 * 9. CSS — add .page-gap-marker for @media print
 */

const fs = require('fs');
const path = require('path');

const DRAFT_PREVIEW = path.join(__dirname, '../js/render/draftPreview.js');
const APP_CSS = path.join(__dirname, '../css/app.css');

let dp = fs.readFileSync(DRAFT_PREVIEW, 'utf8');
let css = fs.readFileSync(APP_CSS, 'utf8');

let ok = 0, fail = 0;

function fix(label, content, search, replace) {
  if (content.includes(search)) {
    console.log(`  ✅ ${label}`);
    ok++;
    return content.split(search).join(replace);
  }
  console.error(`  ❌ FAILED: ${label}`);
  console.error(`     First 100: "${search.substring(0,100)}"`);
  fail++;
  return content;
}

// ─────────────────────────────────────────────────────────────────────────────
// FIX 1: PMNRF — Drop conflicting street address, use just "Prime Minister's Office, New Delhi"
// Both Claude+Gemini noted conflicting sources (PMO site: Seva Teerth vs PMNRF page: South Block)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[FIX 1] PMNRF: drop conflicting street address...');
dp = fix('PMNRF: drop Seva Teerth, use just PM Office New Delhi',
  dp,
  `<strong>PRIME MINISTER'S NATIONAL RELIEF FUND (PMNRF)</strong>, Government of India (Seva Teerth, New Delhi 110011), for charitable public relief purposes.`,
  `<strong>PRIME MINISTER'S NATIONAL RELIEF FUND (PMNRF)</strong>, Prime Minister's Office, Government of India, New Delhi, for charitable public relief purposes.`
);

// ─────────────────────────────────────────────────────────────────────────────
// FIX 2: SECTION 323 — Separate s.322 priority from s.323 rateable payment
// ChatGPT: "technically Section 322 handles priority ordering, Section 323 is rateable payment"
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[FIX 2] Section 323: separate from 322 priority vs rateable payment...');
dp = fix('Section 322/323: distinguish priority from rateable payment',
  dp,
  `third, wages due for services rendered within three months preceding my demise to any labourer, artisan, or domestic servant (Section 322); fourth, all other enforceable debts and liabilities paid rateably according to their applicable legal priorities (Section 323); and pursuant to Section 325`,
  `third, wages due for services rendered within three months preceding my demise to any labourer, artisan, or domestic servant, and thereafter all other enforceable debts in the order of their respective statutory priorities (Section 322); fourth, all remaining enforceable debts and liabilities paid equally and rateably among creditors of equal priority, subject to the preceding statutory provisions (Section 323); and pursuant to Section 325`
);

// ─────────────────────────────────────────────────────────────────────────────
// FIX 3: CLAUSE (v) POSTHUMOUS — Add explicit 30-day survival period from birth
// ChatGPT: "expressly state the posthumous child must survive thirty consecutive days from birth"
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[FIX 3] Clause (v): add 30-day survival from birth for posthumous...');
dp = fix('Clause (v): explicit 30-day survival from birth for posthumous child',
  dp,
  `(and a child conceived before the deceased child's death and born alive thereafter shall qualify as a lineal descendant under this Will, with any applicable survival period calculated from the date of birth);`,
  `(and a child conceived before the deceased child's death and born alive thereafter shall qualify as a lineal descendant under this Will, provided such child survives for thirty (30) consecutive days from the date of birth);`
);

// ─────────────────────────────────────────────────────────────────────────────
// FIX 4: CLAUSE (v) "PREDECEASES SUNITA" — "before the earlier of (a)+(b)" formulation
// ChatGPT: clarify death-before-surrender vs surrender-before-death
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[FIX 4] Clause (v): predeceases Sunita = before earlier of death or effective surrender...');
dp = fix('"predeceases Sunita" = before the earlier of death or effective registered surrender',
  dp,
  `For the purposes of this clause, the expression "predeceases Sunita" means dying before Sunita Sharma's own death or before her registered voluntary surrender of her residence right, whichever event first occurs.`,
  `For the purposes of this clause, the expression "predeceases Sunita" means dying before the earlier of: (a) Sunita Sharma's death; and (b) the effective date of her registered voluntary surrender of her personal right of residence. A child's death after the effective date of such voluntary surrender shall not trigger the divesting provisions of this clause.`
);

// ─────────────────────────────────────────────────────────────────────────────
// FIX 5: ANTI-LAPSE vs FLAT-SPECIFIC SUCCESSION — Add express precedence rule
// ChatGPT: "specific flat succession in s.V(v) should prevail over general anti-lapse"
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[FIX 5] Anti-lapse: add express precedence of flat-specific clause over general anti-lapse...');
dp = fix('Anti-lapse: express precedence of Clause (v) over general anti-lapse',
  dp,
  `For the avoidance of doubt, a person conceived before my death and born alive thereafter shall be treated as a qualifying lineal descendant for all purposes under this Will, with the thirty (30) day survival period calculated from the date of such birth.`,
  `For the avoidance of doubt, a person conceived before my death and born alive thereafter shall be treated as a qualifying lineal descendant for all purposes under this Will, with the thirty (30) day survival period calculated from the date of such birth. The specific succession and divesting provisions of Section V, Clause (v) above (governing the undivided shares in Flat 402) shall prevail over and take priority over these general anti-lapse provisions to the full extent of any inconsistency; the general anti-lapse provisions shall apply to all other assets and any remaining residuary estate.`
);

// ─────────────────────────────────────────────────────────────────────────────
// FIX 6: CHARITABLE FALLBACK FINAL TIER — Add permitted charitable objectives
// ChatGPT: "define the eligible final charitable purpose more expressly"
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[FIX 6] Charitable fallback: add permitted objectives to final tier...');
dp = fix('Charitable fallback: specify permitted objectives for final discretionary tier',
  dp,
  `to such other institution duly registered and approved as a charitable institution under applicable income-tax law as my Executor, acting honestly and with clearly documented reasons and selection criteria, shall select with the prior approval of a court of competent jurisdiction obtained by appropriate court application, in each case to the absolute exclusion of any intestate succession.`,
  `to such other institution duly registered and approved as a charitable institution under applicable income-tax law, operating in one or more of the following charitable fields: poverty relief, medical assistance, education, disaster relief, or eldercare in India, as my Executor, acting honestly and with clearly documented reasons and selection criteria, shall select with the prior approval of a court of competent jurisdiction obtained by appropriate court application, in each case to the absolute exclusion of any intestate succession.`
);

// ─────────────────────────────────────────────────────────────────────────────
// FIX 7: ZERODHA BO ID — Fix display in the asset description rendering
// The E2E test sets clientId as "BO ID: 12081600-04521892 (Trading Client Code: ZR4521...)"
// We need to detect the combined 16-digit DP+BO format and split it
// The rendered text shows: "BO ID: 12081600-04521892 (Trading...)"
// Actual correct display: "DP ID: 12081600 | BO ID: 04521892 | Full Demat ID: 1208160004521892"
// Fix in draftPreview.js: in the asset header rendering, detect Zerodha + combined format
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[FIX 7] Zerodha BO ID: add note in asset header for correct identification...');
// The description shows as safeDesc which comes from computeAssetDesc()
// For Mutual Funds, clientId = "BO ID: 12081600-04521892 (Trading Client Code: ZR4521...)"
// We'll add a post-processing step in the rendering loop to fix the description display
dp = fix('Asset rendering: Zerodha combined DP+BO ID → separate field display',
  dp,
  `      html += \`
        <div class="draft-asset-item">
          <div class="draft-asset-header">
            <span>Asset #\${idx + 1} [\${safeType}]: \${safeDesc}</span>
            <span style="font-weight: 500; font-size: 0.8rem; color: #64748b;">\${approxVal}</span>
          </div>`,
  `      // Fix Zerodha combined DP+BO format for display
      let displayDesc = safeDesc;
      const dpiMatch = safeDesc.match(/CDSL DP ID:\\s*(\\d{8})/i);
      const boiRawMatch = safeDesc.match(/BO ID:\\s*(\\d{8})-(\\d{8,16})/i);
      if (dpiMatch && boiRawMatch) {
        const dpId = dpiMatch[1];
        const boId = boiRawMatch[2].substring(0, 8);
        const fullDemat = dpId + boId;
        displayDesc = safeDesc
          .replace(/CDSL DP ID:\\s*\\d{8}/i, \`CDSL — DP ID: \${dpId}\`)
          .replace(/BO ID:\\s*\\d{8}-\\d{8,16}/i, \`BO ID: \${boId} | Full Demat ID: \${fullDemat}\`);
      }

      html += \`
        <div class="draft-asset-item">
          <div class="draft-asset-header">
            <span>Asset #\${idx + 1} [\${safeType}]: \${displayDesc}</span>
            <span style="font-weight: 500; font-size: 0.8rem; color: #64748b;">\${approxVal}</span>
          </div>\``
);

// ─────────────────────────────────────────────────────────────────────────────
// FIX 8: CSS — Add .page-gap-marker for print mode (shows "—— End of page ——")
// and add in HTML after Asset #3 and after Section VII
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[FIX 8] CSS: add page-gap-marker for print mode...');
css = fix('CSS: add .page-gap-marker display in @media print',
  css,
  `  /* Flatten asset boxes so content flows without creating empty bordered shells */`,
  `  /* Page gap markers visible only in print mode */
  .page-gap-marker {
    display: block !important;
    text-align: center !important;
    border-top: 0.5pt dashed #64748b !important;
    border-bottom: 0.5pt dashed #64748b !important;
    color: #64748b !important;
    font-size: 7pt !important;
    font-style: italic !important;
    padding: 2pt 0 !important;
    margin: 4pt 0 !important;
    letter-spacing: 1pt !important;
  }
  /* Flatten asset boxes so content flows without creating empty bordered shells */`
);

// Also add the page-gap-marker class to screen CSS (hidden on screen)
css = fix('CSS: hide page-gap-marker on screen',
  css,
  `.draft-asset-item {\n  margin: 0.8rem 0;`,
  `.page-gap-marker { display: none; }

.draft-asset-item {\n  margin: 0.8rem 0;`
);

// ─────────────────────────────────────────────────────────────────────────────
// FIX 9: Add gap markers in the HTML — after assets list, after Section VII
// The page gaps are at end of Asset section (before survivorship box) and
// at end of Section VII (before signature page).
// We add print-only markers at both locations.
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n[FIX 9] HTML: inject page-gap-markers at known blank areas...');
// After the assets rendering and before the subclause boxes (Survivorship + Trust)
dp = fix('HTML: add page-gap-marker after assets and before survivorship clause',
  dp,
  `    html += \`
        <div class="draft-subclause-box">
          <strong>SURVIVORSHIP &amp; ANTI-LAPSE CLAUSE (30-DAY RULE):</strong>`,
  `    html += \`
        <div class="page-gap-marker">&mdash;&mdash;&mdash;&mdash; continued &mdash;&mdash;&mdash;&mdash;</div>
        <div class="draft-subclause-box">
          <strong>SURVIVORSHIP &amp; ANTI-LAPSE CLAUSE (30-DAY RULE):</strong>`
);

// After Section VII (Residuary Estate) before the closing execution container
dp = fix('HTML: add page-gap-marker after Section VII before signature block',
  dp,
  `      <div class="closing-execution-container" style="page-break-inside: avoid; break-inside: avoid; margin-top: 14pt;">`,
  `      <div class="page-gap-marker">&mdash;&mdash;&mdash;&mdash; continued &mdash;&mdash;&mdash;&mdash;</div>
      <div class="closing-execution-container" style="page-break-inside: avoid; break-inside: avoid; margin-top: 14pt;">`
);

// ─────────────────────────────────────────────────────────────────────────────
// Write files
// ─────────────────────────────────────────────────────────────────────────────
fs.writeFileSync(DRAFT_PREVIEW, dp, 'utf8');
fs.writeFileSync(APP_CSS, css, 'utf8');

console.log(`\n${'='.repeat(65)}`);
if (fail === 0) {
  console.log(`✅ v10 Patch Complete: ${ok}/${ok + fail} fixes applied!`);
} else {
  console.log(`⚠️  v10 Patch: ${ok} applied, ${fail} FAILED!`);
  process.exit(1);
}
console.log(`${'='.repeat(65)}\n`);
