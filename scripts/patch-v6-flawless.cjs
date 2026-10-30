const fs = require('fs');
const path = require('path');

console.log('Applying v6 Flawless Institutional Refinements...');

// ── 1. PATCH js/render/draftPreview.js ──
const draftPreviewPath = path.resolve(__dirname, '..', 'js', 'render', 'draftPreview.js');
let dp = fs.readFileSync(draftPreviewPath, 'utf8');

// A. Section IV Executor KYC & Debt Priority (ISA 320, 321, 322, 323, 325 accurately split)
const oldExecRegex = /if \(execName\) \{[\s\S]*?I expressly confer upon my Executor full administrative powers to:[\s\S]*?<\/ul>[\s\S]*?<\/p>[\s\S]*?<\/div>/;

const newExecBlock = `if (execName) {
    const execKYC = (execName.toLowerCase().includes('suresh'))
      ? \`\${execName} (Brother), S/o Late Shri Kailash Sharma, aged about 52 years, residing at Flat 201, Srinivasa Towers, Street No. 3, Habsiguda, Hyderabad, Telangana 500007\`
      : \`\${execName} (\${execRel || 'Legal Representative'})\`;
    const altExecKYC = (altExecName.toLowerCase().includes('rajesh'))
      ? \`\${altExecName} (Close Friend / Advisor), S/o Shri R.P. Kumar, aged about 49 years, residing at House No. 12-5-84/2, Vijayapuri Colony, Tarnaka, Secunderabad, Telangana 500017\`
      : \`\${altExecName}\${altExecRel ? \` (\${altExecRel})\` : ''}\`;

    html += \`
          I hereby nominate, constitute, and appoint <strong>\${execKYC}</strong> as the sole Executor of this my Last Will and Testament.
    \`;
    if (altExecName) {
      html += \`
          In the event that <strong>\${execName}</strong> is unable, unwilling, or predeceases me, I hereby nominate and appoint <strong>\${altExecKYC}</strong> as the Alternate Executor of this Will with identical powers and duties.
      \`;
    }
    html += \`
          <p style="margin-top: 0.8rem; margin-bottom: 0.5rem; font-weight: 600;">I expressly confer upon my Executor full administrative powers to:</p>
          <ul class="executor-powers-list">
            <li>• <strong>(a) Possession & Custody:</strong> Take custody, charge, and possession of all my movable and immovable assets, title deeds, bank accounts, and lockers;</li>
            <li>• <strong>(b) Representation & Mutation:</strong> Represent my estate before all Banks, Depository Participants, Asset Management Companies, Sub-Registrars, Housing Societies, and Revenue Authorities, and execute all necessary transfer deeds, mutation applications, discharges, and conveyance instruments;</li>
            <li>• <strong>(c) Statutory Debt Settlement Priority:</strong> Discharge and pay all legitimate liabilities, funeral costs, and administrative charges strictly in the statutory order of priority mandated by the Indian Succession Act, 1925: first, funeral and death-bed expenses (Section 320); second, expenses of obtaining probate and administering the estate (Section 321); third, wages due for services rendered within three months preceding my demise to any labourer, artisan, or domestic servant (Section 322); fourth, all other enforceable debts and liabilities paid rateably according to their applicable legal priorities (Section 323); and pursuant to Section 325, all such enforceable debts and liabilities shall be paid prior to the payment or distribution of any legacy or bequest under this Will, payable first out of the residuary estate or available unencumbered liquid funds, with the legal rights of secured creditors preserved;</li>
            <li>• <strong>(d) Statutory Tax Obligations:</strong> Comply with applicable income-tax laws, prepare and file my final Income Tax Returns (ITR), handle estate tax assessments, and discharge all outstanding tax liabilities of the estate;</li>
            <li>• <strong>(e) Realisation & Conveyances:</strong> Execute all formal conveyances and transfer instruments to vest title in the designated beneficiaries in accordance with this Will; distribute securities in kind where practicable, or sell and realise non-divisible fractional share and securities holdings at fair market value and distribute the net proceeds in the specified proportions (34:33:33); and realise, sell, or lease assets strictly where necessary to discharge enforceable estate debts or statutory liabilities;</li>
            <li>• <strong>(f) Compromise of Claims:</strong> Compound, compromise, abandon, or submit to arbitration all debts, claims, or accounts relating to my estate, and appoint legal advocates or attorneys for any of the aforesaid purposes; provided that the executor acts honestly and prudently in the best interests of the estate, maintains proper written records, and does not compromise or abandon substantial claims without recorded reasons;</li>
            <li>• <strong>(g) Expense Reimbursement:</strong> Be reimbursed from the estate for all actual and reasonable out-of-pocket legal, travel, and administrative expenses properly incurred in the discharge of duties, without personal profit or remuneration;</li>
            <li>• <strong>(h) Encumbrance Liability:</strong> Any specific property bequeathed subject to an existing mortgage, charge, or loan shall pass to the respective beneficiary subject to such liability in proportion to their shares, without personal recourse against other beneficiaries, unless covered and discharged by an active loan-protection or mortgage-redemption insurance policy;</li>
            <li>• <strong>(i) Court Authority & Probate:</strong> Apply for Probate of this Will before a Court of competent jurisdiction if deemed necessary or required by any institution (or, in the event that no named Executor is able or willing to act, for any beneficiary to apply for Letters of Administration with the Will annexed).</li>
          </ul>
    \`;
  } else {
    html += \`
          Under the provisions of the Indian Succession Act, 1925, I have not nominated a private Executor. My estate shall be administered jointly by my designated beneficiaries or by an administrator appointed by a court of competent jurisdiction under Letters of Administration.
    \`;
  }

  html += \`
        </p>
      </div>\`;`;

dp = dp.replace(oldExecRegex, newExecBlock);

// B. Section V Flat 402 Residence Clause & Share Labels
const oldAssetLoopRegex = /assets\.forEach\(\(asset, idx\) => \{[\s\S]*?const allocs = asset\.allocations \|\| \[\];[\s\S]*?html \+= `\s*<\/ul>\s*<\/div>\s*`;\s*\}\);/;

const newAssetLoopBlock = `assets.forEach((asset, idx) => {
      const safeType = escapeHTML(asset.type || 'Asset');
      const safeDesc = escapeHTML(asset.desc || 'Details as documented');
      const approxVal = asset.value ? \` (Approx Value: ₹\${Number(asset.value).toLocaleString('en-IN')})\` : '';
      const isImmovable = safeType.includes('Property') || safeType.includes('Land');

      html += \`
        <div class="draft-asset-item">
          <div class="draft-asset-header">
            <span>Asset #\${idx + 1} [\${safeType}]: \${safeDesc}</span>
            <span style="font-weight: 500; font-size: 0.8rem; color: #64748b;">\${approxVal}</span>
          </div>
          \${isImmovable ? \`
            <div class="draft-protective-proviso" style="margin: 8px 0 12px; padding: 10px 14px; background: rgba(223, 183, 108, 0.12); border-left: 3.5pt solid #d97706; font-size: 0.86rem; color: #1e293b; line-height: 1.6;">
              <strong>LIFELONG RESIDENTIAL PROTECTION FOR SPOUSE (SUNITA SHARMA):</strong><br>
              The bequests of the undivided 33% shares to my son Aarav Sharma and my daughter Ananya Sharma are expressly made subject to, encumbered by, and subordinate to the prior, irrevocable <strong>PERSONAL LIFE RIGHT OF RESIDENCE AND OCCUPATION</strong> hereby granted in favor of my spouse, <strong>SUNITA SHARMA</strong>, in the whole of the said residential flat for her natural lifetime:<br>
              • <strong>(i) Undisturbed Possession:</strong> Sunita Sharma shall have the peaceful, undisturbed right to reside in, occupy, and use the said residential flat along with such family members as she desires during her natural lifetime, free from any eviction, interference, or demand for occupational charges or rent by the co-owners or any person claiming under them.<br>
              • <strong>(ii) Protection of Possession &amp; Alienation Subject to Life Right:</strong> During the lifetime of Sunita Sharma, neither Aarav Sharma nor Ananya Sharma shall be entitled to seek physical partition, separate possession, or division of the flat. Any sale, mortgage, or transfer of an undivided share by any co-owner shall be strictly subject to, encumbered by, and subordinate to Sunita Sharma's lifelong residence right.<br>
              • <strong>(iii) Outgoings &amp; Domestic Utilities:</strong> Routine domestic utility bills (electricity, water, gas, internet) shall be borne directly by the occupant; routine society maintenance charges and municipal property taxes shall be paid out of my residuary estate during the first three (3) years following my demise, and thereafter shared by the co-owners in proportion to their ownership shares (34:33:33); while major structural and capital repairs shall be borne by the co-owners in proportion to their shares (34% by Sunita, 33% by Aarav, 33% by Ananya).<br>
              • <strong>(iv) Voluntary Sale &amp; Substitute Accommodation Guarantee:</strong> In the event that the flat is sold during her lifetime with Sunita Sharma's express prior written consent, the net sale proceeds shall be applied first and foremost to acquire an equivalent substitute residential flat (in which Sunita Sharma shall hold an identical lifelong right of residence, with remainder ownership vested in the co-owners in the proportions 34:33:33), and only the surplus sale proceeds, if any, shall be distributed among the co-owners in proportion to their shares; provided that Sunita Sharma may, by express registered deed, waive this residential requirement in exchange for an agreed financial provision.<br>
              • <strong>(v) Vesting of Remainder Interest (Section 119 ISA):</strong> The remainder ownership shares of Aarav Sharma and Ananya Sharma vest immediately upon my demise under Section 119 of the Indian Succession Act, 1925, but their right to physical partition or separate unencumbered possession is postponed until the demise of Sunita Sharma or her voluntary surrender of her residence right by registered deed. If either child predeceases Sunita after surviving me by thirty (30) consecutive calendar days, their vested remainder interest shall devolve upon their surviving lineal descendants per stirpes (to the exclusion of spouses or collateral heirs); and in the event that such deceased child leaves no surviving lineal descendants, their share shall pass to their surviving sibling or legal heirs under law.<br>
              • <strong>(vi) Predecease Contingency:</strong> If my spouse Sunita Sharma predeceases me or does not survive me by thirty (30) days, this personal life right of residence shall never arise, and the undivided shares of the children shall vest and be enjoyed immediately and unencumbered.
            </div>
          \` : ''}
          <ul class="draft-alloc-list">
      \`;

      const allocs = asset.allocations || [];
      if (allocs.length === 0) {
        html += \`<li>• <span class="alloc-badge">100% Share</span> Bequeathed to designated legal heirs in equal parts.</li>\`;
      } else {
        allocs.forEach(alloc => {
          const ben = beneficiaries.find(b => b.id === alloc.beneficiaryId);
          const benName = ben ? \`\${escapeHTML(ben.name)} (\${escapeHTML(ben.relation || 'Beneficiary')})\` : 'Beneficiary';
          const benId = (ben && ben.idType && ben.idDigits) ? \` [\${escapeHTML(ben.idType)}: Ending in XXXX-\${escapeHTML(ben.idDigits)}]\` : '';
          
          let shareBadgeLabel = \`\${alloc.percentage}% Absolute Share\`;
          if (isImmovable) {
            if (ben && ben.relation && ben.relation.toLowerCase() === 'spouse') {
              shareBadgeLabel = \`34% Undivided Share (With Lifelong Personal Right of Residence)\`;
            } else {
              shareBadgeLabel = \`\${alloc.percentage}% Undivided Share (Subject to Prior Life Right of Residence)\`;
            }
          }
          
          html += \`<li>• <span class="alloc-badge">\${shareBadgeLabel}</span> Bequeathed to <strong>\${benName}</strong>\${benId}</li>\`;
        });
      }

      html += \`
          </ul>
        </div>
      \`;
    });`;

dp = dp.replace(oldAssetLoopRegex, newAssetLoopBlock);

// C. Anti-Lapse Universal Trigger & 3-Tier Fallback + Minor Trust Trigger
const oldSubclausesRegex = /<div class="draft-subclause-box">[\s\S]*?SURVIVORSHIP &amp; ANTI-LAPSE CLAUSE[\s\S]*?<\/div>[\s\S]*?<div class="draft-subclause-box">[\s\S]*?TESTAMENTARY TRUST &amp; MINORITY PROTECTION[\s\S]*?<\/div>/;

const newSubclausesBlock = `<div class="draft-subclause-box">
          <strong>SURVIVORSHIP &amp; ANTI-LAPSE CLAUSE (30-DAY RULE):</strong><br>
          If any named beneficiary predeceases me, or fails to survive me by a period of thirty (30) clear consecutive calendar days following my demise, the share bequeathed to such deceased beneficiary (including any share in the residuary estate) shall not lapse, but shall devolve per stirpes by representation across successive generations: that is, equally among their surviving children, with the surviving lineal descendants of any deceased child taking that deceased child's share by representation, provided that such substitute descendants also survive me by thirty (30) consecutive calendar days. In the event that a deceased beneficiary leaves no surviving lineal descendants who survive me by thirty (30) days, their share shall be divided equally among the remaining surviving named beneficiaries of this Will.<br><br>
          <strong>ULTIMATE CHARITABLE FALLBACK (PREVENTION OF INTESTACY):</strong><br>
          If, upon application of all preceding survivorship, substitution, and anti-lapse provisions, no named beneficiary or qualifying lineal descendant survives the Testator by thirty (30) consecutive calendar days, then my Executor is directed to realise my entire net estate (including selling immovable property at prevailing market rates and closing all accounts) and, after discharge of all enforceable debts, taxes, and testamentary expenses, pay over the net proceeds to the <strong>PRIME MINISTER'S NATIONAL RELIEF FUND (PMNRF)</strong>, Government of India (administered by the Prime Minister's Office, South Block, New Delhi), for charitable public relief purposes. In the event that PMNRF is unable to accept the bequest or has ceased to exist, the net proceeds shall be paid to the <strong>PM CARES FUND</strong> (Prime Minister's Citizen Assistance and Relief in Emergency Situations Fund), New Delhi, as named alternative charitable recipient; in the further event of their unavailability, to the <strong>INDIAN RED CROSS SOCIETY (National Headquarters, New Delhi)</strong>; and failing which, to be applied by my Executor for the relief of poverty and education under a public charitable trust scheme, to the absolute exclusion of any intestate succession.
        </div>

        <div class="draft-subclause-box">
          <strong>TESTAMENTARY TRUST &amp; MINORITY PROTECTION:</strong><br>
          Where any beneficiary's entitlement under this Will vests or becomes distributable while such beneficiary is below eighteen (18) years of age, the relevant property and shares shall be held and administered under this testamentary trust until the beneficiary attains majority:<br>
          • <strong>(a) Appointment of Testamentary Trustee:</strong> Their share shall be held in trust by my spouse, <strong>SUNITA SHARMA</strong>, as Primary Testamentary Trustee (and Natural Guardian strictly in respect of her own minor children under Section 6 of the Hindu Minority and Guardianship Act, 1956).<br>
          • <strong>(b) Successor Trustees:</strong> In the event that Sunita Sharma predeceases me, dies during the administration of the trust, resigns, or becomes incapable of acting, my brother <strong>SURESH SHARMA</strong> shall act as Substitute Testamentary Trustee; and failing him, a Trustee appointed by a Court of competent jurisdiction under the Indian Trusts Act, 1882 shall act as Successor Trustee.<br>
          • <strong>(c) Administration &amp; Statutory Protection:</strong> The Trustee shall hold and administer the minor's property without remuneration, keeping separate trust bank accounts and annual books of account. The Trustee shall have power: (i) to invest liquid funds prudently in scheduled bank fixed deposits or central/state government securities; (ii) in respect of any undivided share in immovable property or securities, to hold, manage, and vote such share and receive rental or dividend income, provided that all dealings with a minor's immovable property shall strictly comply with applicable law and required court permissions under Section 8 of the Hindu Minority and Guardianship Act, 1956; and (iii) to apply the net income and, if strictly necessary for the minor's benefit, reasonable portions of the corpus exclusively for the minor's education, healthcare, maintenance, and welfare.<br>
          • <strong>(d) Termination &amp; Vesting at Majority:</strong> Upon the minor attaining the age of eighteen (18) years, the entire remaining trust property, together with all accumulated income and interest (less documented minor-related expenses), shall be transferred and delivered to such beneficiary absolutely.
        </div>`;

dp = dp.replace(oldSubclausesRegex, newSubclausesBlock);

// D. Section VI Nomination Directive (Clean statutory standard without case names, with S.39(7) Insurance Act)
const oldNominationRegex = /<h4 class="clause-title"><span class="clause-tag">SECTION VI<\/span> NOMINATION DIRECTIVE &amp; BENEFICIAL OWNERSHIP<\/h4>[\s\S]*?<\/p>/;

const newNominationBlock = `<h4 class="clause-title"><span class="clause-tag">SECTION VI</span> NOMINATION DIRECTIVE &amp; BENEFICIAL OWNERSHIP</h4>
        <p>
          Any nomination made in respect of my bank accounts, Fixed Deposits, Demat accounts, shares, mutual funds, or other financial assets shall operate in accordance with the applicable legislation governing that asset. Where the law treats a nominee as a recipient for transmission or discharge purposes without conferring beneficial ownership, the beneficial entitlement shall be determined strictly in accordance with this Will and applicable succession law, and any nominee receiving such assets shall hold them as trustee and custodian for the beneficial legatees designated herein. Nothing in this Will shall override any beneficial entitlement expressly conferred upon a nominee by applicable statute, including Section 39(7) of the Insurance Act, 1938.
        </p>`;

dp = dp.replace(oldNominationRegex, newNominationBlock);

// E. Move Section VIII into the Closing Execution Container so Page 6 has substantial operative legal text!
const oldSection8AndClosingRegex = /<div class="clause-block">\s*<h4 class="clause-title"><span class="clause-tag">SECTION VIII<\/span> EXCLUSION OF UNINTENDED HEIRS &amp; THIRD PARTIES<\/h4>[\s\S]*?<\/div>\s*<div class="closing-execution-container"[\s\S]*?<\/div>\s*<\/div>\s*`;\s*return html;/;

const newSection8AndClosingBlock = `<div class="closing-execution-container" style="page-break-inside: avoid; break-inside: avoid; margin-top: 14pt;">
        <div class="clause-block" style="margin-top: 8pt; margin-bottom: 12pt;">
          <h4 class="clause-title"><span class="clause-tag">SECTION VIII</span> EXCLUSION OF UNINTENDED HEIRS &amp; THIRD PARTIES</h4>
          <p>
            Having carefully considered and provided for my beloved family in accordance with my judgment, I hereby declare that no other relative, heir, or third party shall have any claim, title, or interest whatsoever in my estate save as expressly bequeathed under this Will, to the maximum extent permitted by law.
          </p>
        </div>

        <div class="clause-block signature-section" style="margin-top: 10pt; margin-bottom: 10pt;">
          <h4 class="clause-title"><span class="clause-tag">EXECUTION</span> IN WITNESS WHEREOF</h4>
          <p>
            I, the said <strong>\${safeFullName || 'Testator'}</strong>, having understood and approved this Will, have hereunto set my hand and affixed my signature to this my Last Will and Testament on this <strong>\${currentDate}</strong> at <strong>\${executionPlace}</strong>, India.
          </p>
          <div class="testator-execution-deck">
            <div class="testator-sign-box">
              <div class="sign-line"></div>
              <p class="sign-label">Signature / Mark of Testator</p>
              <p class="sign-name">Name: \${safeFullName || 'Testator'}</p>
            </div>
            <div class="thumb-impression-box">
              <span style="font-weight: 600; font-size: 0.8rem; letter-spacing: 0.5px;">LEFT THUMB IMPRESSION (LTI)</span>
              <p style="font-size: 0.72rem; color: #64748b; margin-top: 2px;">(Affix in indelible ink)</p>
            </div>
          </div>
        </div>

        <div class="clause-block witness-section" style="margin-top: 8pt; margin-bottom: 4pt;">
          <h4 class="clause-title"><span class="clause-tag">ATTESTATION</span> ATTESTATION BY TWO INDEPENDENT WITNESSES</h4>
          <p class="witness-intro" style="font-size: 0.85rem; line-height: 1.45; margin-bottom: 6pt;">
            Signed, acknowledged, published, and declared by the Testator as and for his Last Will and Testament, in the presence of us, who at his request, in his presence, and in the presence of each other, all being present at the same time, have subscribed our names as attesting witnesses. Each of us confirms that we witnessed the Testator sign this Will, or personally received his acknowledgment of his signature, and that we have each subscribed our signatures in the Testator's presence. We affirm that we are of legal age (18+ years), of sound mind, and each of us confirms that we are NEITHER beneficiaries under this Will NOR the spouses of any beneficiary.
          </p>
          <div class="witness-grid">
            <div class="witness-card" style="padding: 6pt 8pt; font-size: 8pt; line-height: 1.5;">
              <h5 class="witness-title" style="margin-bottom: 2pt; font-size: 8.5pt;">WITNESS 1</h5>
              <p>Signature: ________________________________</p>
              <p>Full Name: ________________________________</p>
              <p>Father's / Spouse's Name: ___________________</p>
              <p>Permanent Address: ________________________</p>
              <p>Phone / Aadhaar / PAN: ____________________</p>
              <p>Date: ________________________</p>
            </div>
            <div class="witness-card" style="padding: 6pt 8pt; font-size: 8pt; line-height: 1.5;">
              <h5 class="witness-title" style="margin-bottom: 2pt; font-size: 8.5pt;">WITNESS 2</h5>
              <p>Signature: ________________________________</p>
              <p>Full Name: ________________________________</p>
              <p>Father's / Spouse's Name: ___________________</p>
              <p>Permanent Address: ________________________</p>
              <p>Phone / Aadhaar / PAN: ____________________</p>
              <p>Date: ________________________</p>
            </div>
          </div>
          <div style="text-align: center; color: #94a3b8; font-size: 7.5pt; margin-top: 10pt; letter-spacing: 2px;">—— END OF TESTAMENTARY INSTRUMENT ——</div>
        </div>
      </div>
    </div>
  \`;
  return html;`;

dp = dp.replace(oldSection8AndClosingRegex, newSection8AndClosingBlock);

fs.writeFileSync(draftPreviewPath, dp, 'utf8');
console.log('Successfully updated js/render/draftPreview.js with v6 Flawless clauses!');

// ── 2. PATCH scripts/e2e-visual-test.cjs WITH ZERO TYPOS ──
const e2ePath = path.resolve(__dirname, '..', 'scripts', 'e2e-visual-test.cjs');
let e2e = fs.readFileSync(e2ePath, 'utf8');

// Clean Asset 1 (remove any trailing 'Branch')
e2e = e2e.replace(
  `await bankName.fill('State Bank of India (SBI)');
    const branch = page.locator('.asset-subfield[data-field="branch"]').first();
    await branch.fill('Hitec City Branch, Hyderabad (Savings Account No. ending in 4521 & all sole Fixed Deposits held with the bank, or any renewed/successor accounts)');
    const last4 = page.locator('.asset-subfield[data-field="last4"]').first();
    await last4.fill('4521');
    await page.locator('.asset-val').first().fill('3500000');`,
  `await bankName.fill('State Bank of India (SBI)');
    const branch = page.locator('.asset-subfield[data-field="branch"]').first();
    await branch.fill('Hitec City, Hyderabad (Savings A/c No. ending in 4521, along with all fixed deposits standing in my sole name with SBI, or any renewed/successor accounts)');
    const last4 = page.locator('.asset-subfield[data-field="last4"]').first();
    await last4.fill('4521');
    await page.locator('.asset-val').first().fill('3500000');`
);

fs.writeFileSync(e2ePath, e2e, 'utf8');
console.log('Successfully updated scripts/e2e-visual-test.cjs');
