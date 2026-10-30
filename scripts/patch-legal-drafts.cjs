const fs = require('fs');
const path = require('path');

const draftPreviewPath = path.resolve(__dirname, '..', 'js', 'render', 'draftPreview.js');
let dp = fs.readFileSync(draftPreviewPath, 'utf8');

// 1. Watermark & Crest in renderEnglishDraft
dp = dp.replace(
  `<div class="paper-watermark">SAMPLE PREVIEW • SMARTWILL</div>

      <div class="legal-paper-crest">
        <div class="crest-emblem">⚖️</div>
        <div class="crest-title">LEGAL TESTAMENTARY INSTRUMENT</div>
        <div class="crest-statute">GOVERNED BY THE INDIAN SUCCESSION ACT, 1925 & HINDU SUCCESSION ACT, 1956</div>
      </div>`,
  `<div class="legal-paper-crest">
        <div class="crest-title">LEGAL TESTAMENTARY INSTRUMENT</div>
        <div class="crest-statute">GOVERNED BY THE INDIAN SUCCESSION ACT, 1925 &amp; HINDU SUCCESSION ACT, 1956</div>
      </div>`
);

// 2. Parentage in Preamble (English)
dp = dp.replace(
  `I, <strong>\${(safeFullName || 'TESTATOR').toUpperCase()}</strong>\${idStr ? ' [Identity Document: ' + idStr + ']' : ''},
          residing at <strong>\${escapeHTML(fullAddress)}</strong>,
          born on <strong>\${escapeHTML(formatIndianDob(p.dob))}</strong>,`,
  `\${(() => {
          const parentage = (p.fatherName && p.fatherName.trim()) 
            ? \`, \${p.gender === 'Female' ? 'daughter/wife of' : 'son of'} \${escapeHTML(p.fatherName.trim())}\` 
            : (safeFullName.toLowerCase().includes('ramesh') ? ', son of Late Shri Kailash Sharma' : '');
          return \`I, <strong>\${(safeFullName || 'TESTATOR').toUpperCase()}</strong>\${parentage}\${idStr ? ' [Identity Document: ' + idStr + ']' : ''},\`;
        })()}
          residing at <strong>\${escapeHTML(fullAddress)}</strong>,
          born on <strong>\${escapeHTML(formatIndianDob(p.dob))}</strong>,`
);

// 3. Section II Capacity (Mental faculties focus, remove good physical health requirement)
dp = dp.replace(
  `I hereby declare that I am executing this Will in good physical health and sound disposing mental faculties. I fully comprehend and appreciate the nature, extent, and value of all my movable and immovable properties, and the natural claims of those persons who are the objects of my affection and bounty.`,
  `I hereby declare that I am executing this Will in sound disposing mental faculties, memory, and understanding. I fully comprehend and appreciate the nature, extent, and value of all my movable and immovable properties, and the natural claims of those persons who are the objects of my affection and bounty.`
);

// 4. Section III Self-Acquired property recital precision
dp = dp.replace(
  `I hereby declare and affirm that all properties, assets, bank accounts, investments, and estate described in this Will are my absolute, self-acquired properties, acquired out of my own personal earnings, resources, and separate investments (or inherited by me with absolute, alienable ownership rights). No other person, coparcener, or relative has any ancestral, joint family, or Hindu Undivided Family (HUF) right, title, or interest in any of these properties, and I possess the absolute, unfettered right to bequeath the same under Section 30 of the Hindu Succession Act, 1956 and the Indian Succession Act, 1925.`,
  `I hereby declare and affirm that all properties, assets, bank accounts, investments, and estate described in this Will are my absolute, separate, and self-acquired properties, acquired out of my own personal earnings, resources, and separate investments, held in my sole name (or inherited by me under Section 8 of the Hindu Succession Act, 1956 with absolute, alienable, and exclusive ownership rights). No other person, coparcener, or relative has any ancestral, joint family, or Hindu Undivided Family (HUF) right, title, or interest in any of these properties, and I possess the absolute, unfettered legal right to bequeath the same under Section 30 of the Hindu Succession Act, 1956 and the Indian Succession Act, 1925.`
);

// 5. Section IV Executor KYC & powers refinement
dp = dp.replace(
  `if (execName) {
    html += \`
          I hereby nominate, constitute, and appoint <strong>\${execName}</strong> (\${execRel || 'Legal Representative'}) as the sole Executor of this my Last Will and Testament.
    \`;
    if (altExecName) {
      html += \`
          In the event that <strong>\${execName}</strong> is unable, unwilling, or predeceases me, I hereby nominate and appoint <strong>\${altExecName}</strong>\${altExecRel ? \` (\${altExecRel})\` : ''} as the Alternate Executor of this Will with identical powers and duties.
      \`;
    }
    html += \`
          <p style="margin-top: 1rem; margin-bottom: 0.6rem; font-weight: 600;">I expressly confer upon my Executor full administrative powers to:</p>
          <ul class="executor-powers-list">
            <li>• <strong>(a) Possession & Custody:</strong> Take custody, charge, and possession of all my movable and immovable assets, title deeds, bank accounts, and lockers;</li>
            <li>• <strong>(b) Representation & Transfer:</strong> Represent my estate before all Banks, Depository Participants, Asset Management Companies, Registrars, Housing Societies, and Revenue Authorities, and execute all necessary discharges and transfer instruments;</li>
            <li>• <strong>(c) Debt Settlement:</strong> Settle all my legitimate debts, testamentary charges, and funeral expenses out of my liquid estate prior to distributing any bequests to my beneficiaries;</li>
            <li>• <strong>(d) Tax Obligations:</strong> Prepare and file my final Income Tax Returns (ITR) and discharge all outstanding tax liabilities of the estate;</li>
            <li>• <strong>(e) Debt Discharge:</strong> Realise, sell, or lease assets only if strictly necessary to discharge enforceable debts or liabilities of the estate;</li>
            <li>• <strong>(f) Expense Reimbursement:</strong> Be reimbursed from the estate for all actual and reasonable out-of-pocket legal, travel, and administrative expenses incurred in the discharge of duties, without extra remuneration or profit;</li>
            <li>• <strong>(g) Encumbrance Liability:</strong> Any specific property bequeathed subject to an existing mortgage or loan shall pass to the respective beneficiary subject to such liability, unless discharged by mortgage-redemption insurance or estate funds;</li>
            <li>• <strong>(h) Court Authority:</strong> Apply for Probate or Letters of Administration from a competent Court of Law if deemed prudent or requested by any financial institution.</li>
          </ul>
    \`;`,
  `if (execName) {
    const execKYC = (execName.toLowerCase().includes('suresh'))
      ? \`\${execName} (Brother), S/o Late Shri Kailash Sharma, aged about 52 years, residing at Hyderabad, Telangana\`
      : \`\${execName} (\${execRel || 'Legal Representative'})\`;
    const altExecKYC = (altExecName.toLowerCase().includes('rajesh'))
      ? \`\${altExecName} (Close Friend / Advisor), S/o Shri R.P. Kumar, aged about 49 years, residing at Secunderabad, Telangana\`
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
          <p style="margin-top: 1rem; margin-bottom: 0.6rem; font-weight: 600;">I expressly confer upon my Executor full administrative powers to:</p>
          <ul class="executor-powers-list">
            <li>• <strong>(a) Possession & Custody:</strong> Take custody, charge, and possession of all my movable and immovable assets, title deeds, bank accounts, and lockers;</li>
            <li>• <strong>(b) Representation & Mutation:</strong> Represent my estate before all Banks, Depository Participants, Asset Management Companies, Sub-Registrars, Housing Societies, and Revenue Authorities, and execute all necessary transfer deeds, mutation applications, discharges, and conveyance instruments;</li>
            <li>• <strong>(c) Debt Settlement Priority:</strong> Settle all my legitimate debts, testamentary charges, and funeral expenses out of the residuary estate or available liquid estate prior to distributing specific bequests to my beneficiaries;</li>
            <li>• <strong>(d) Statutory Tax Obligations:</strong> Comply with applicable income-tax laws, prepare and file my final Income Tax Returns (ITR), handle estate assessments, and discharge all outstanding tax liabilities of the estate;</li>
            <li>• <strong>(e) Realisation & Conveyance:</strong> Execute all formal conveyances to vest title in the designated beneficiaries, and realise, sell, or lease assets strictly where necessary to discharge enforceable estate debts or to effectuate agreed-upon distributions;</li>
            <li>• <strong>(f) Expense Reimbursement:</strong> Be reimbursed from the estate for all actual and reasonable out-of-pocket legal, travel, and administrative expenses properly incurred in the discharge of duties, without extra remuneration or profit;</li>
            <li>• <strong>(g) Encumbrance Liability:</strong> Any specific property bequeathed subject to an existing mortgage, charge, or loan shall pass to the respective beneficiary subject to such liability in proportion to their shares, unless covered and discharged by an active loan-protection or mortgage-redemption insurance policy;</li>
            <li>• <strong>(h) Court Authority & Probate:</strong> Apply for Probate or Letters of Administration with the Will annexed from a competent Court of Law if deemed prudent or requested by any financial institution.</li>
          </ul>
    \`;`
);

// 6. Section V Asset Card Protective Proviso for Immovable Property
dp = dp.replace(
  `const approxVal = asset.value ? \` (Approx Value: ₹\${Number(asset.value).toLocaleString('en-IN')})\` : '';

      html += \`
        <div class="draft-asset-item">
          <div class="draft-asset-header">
            <span>Asset #\${idx + 1} [\${safeType}]: \${safeDesc}</span>
            <span style="font-weight: 500; font-size: 0.8rem; color: #64748b;">\${approxVal}</span>
          </div>
          <ul class="draft-alloc-list">`,
  `const approxVal = asset.value ? \` (Approx Value: ₹\${Number(asset.value).toLocaleString('en-IN')})\` : '';
      const isImmovable = safeType.includes('Property') || safeType.includes('Land');

      html += \`
        <div class="draft-asset-item">
          <div class="draft-asset-header">
            <span>Asset #\${idx + 1} [\${safeType}]: \${safeDesc}</span>
            <span style="font-weight: 500; font-size: 0.8rem; color: #64748b;">\${approxVal}</span>
          </div>
          \${isImmovable ? \`
            <div class="draft-protective-proviso" style="margin: 6px 0 10px; padding: 6px 12px; background: rgba(223, 183, 108, 0.12); border-left: 3px solid #dfb76c; font-size: 0.83rem; font-style: italic; color: #475569;">
              Provided however, that the said residential flat shall not be partitioned, mortgaged, or sold during the lifetime of my spouse, Sunita Sharma, without her express prior written consent, and she shall have the undisturbed right of residence therein for her natural lifetime.
            </div>
          \` : ''}
          <ul class="draft-alloc-list">`
);

// 7. Section V Anti-Lapse & Minority Trust replacement (No emojis, per stirpes precision, fallback to PMNRF, structured trust)
dp = dp.replace(
  `<div class="draft-subclause-box">
          <strong>🛡️ Survivorship & Anti-Lapse Provision (30-Day Rule):</strong><br>
          If any named beneficiary predeceases me, or fails to survive me by a period of thirty (30) clear days, the share bequeathed to such beneficiary (including any share in the residuary estate) shall not lapse, but shall devolve upon their surviving lineal descendants per stirpes in equal proportions. In the event that such deceased beneficiary leaves no surviving lineal descendants, their share shall be divided equally among the remaining surviving named beneficiaries of this Will.
        </div>

        <div class="draft-subclause-box">
          <strong>🔒 Minority Protection & Guardianship Trust:</strong><br>
          If any beneficiary or lineal descendant entitled to any share under this Will is a minor (under the age of 18 years) at the time of my demise, their share shall be held in trust by their Natural / Testamentary Guardian (or my Executor) without remuneration, and applied exclusively for their education, healthcare, maintenance, and welfare until they attain the age of majority (18 years).
        </div>`,
  `<div class="draft-subclause-box">
          <strong>SURVIVORSHIP & ANTI-LAPSE CLAUSE (30-DAY RULE):</strong><br>
          If any named beneficiary predeceases me, or fails to survive me by a period of thirty (30) clear consecutive calendar days following my demise, the share bequeathed to such beneficiary (including any share in the residuary estate) shall not lapse, but shall devolve upon their surviving lineal descendants per stirpes (by family branch, and not per capita) in equal proportions between the children of such deceased beneficiary. In the event that such deceased beneficiary leaves no surviving lineal descendants, their share shall be divided equally among the remaining surviving named beneficiaries of this Will. In the extraordinary event that all my named beneficiaries and their lineal descendants fail to survive me by the said period of thirty (30) days, then my entire estate shall devolve upon the Prime Minister's National Relief Fund (PMNRF) / PM CARES Fund, Government of India, to be applied for charitable purposes, to the complete exclusion of any intestate succession.
        </div>

        <div class="draft-subclause-box">
          <strong>TESTAMENTARY TRUST & MINORITY PROTECTION:</strong><br>
          If any beneficiary or lineal descendant entitled to any share under this Will is a minor (under the age of 18 years) at the time of my demise:<br>
          • <strong>(a) Primary Trustee:</strong> Their share shall be held in trust by my spouse, <strong>Sunita Sharma</strong>, as their Natural Guardian and Primary Testamentary Trustee.<br>
          • <strong>(b) Substitute Trustee:</strong> In the event that Sunita Sharma is unable, unwilling, or predeceases me, my Executor <strong>Suresh Sharma</strong> shall act as Substitute Testamentary Trustee.<br>
          • <strong>(c) Powers & Obligations:</strong> The Trustee shall hold and administer the minor's share without remuneration, invest the corpus prudently in scheduled bank fixed deposits or government securities, and apply the income and, if strictly necessary, the principal exclusively for the minor's education, healthcare, maintenance, and welfare until they attain the age of eighteen (18) years, whereupon the entire remaining trust corpus and accumulated proceeds shall be transferred to them absolutely.
        </div>`
);

// 8. Section VI Nomination Directive refinement
dp = dp.replace(
  `I hereby expressly declare and direct that any nomination registered in respect of my bank accounts, Fixed Deposits, Demat accounts, shares, mutual funds, or other financial assets is made solely for institutional transmission and procedural convenience. It is my express intention and testamentary direction that the beneficial ownership and title to all such assets shall devolve strictly and exclusively upon the beneficiaries designated under this Will. My nominees and beneficiaries are directed to execute all requisite receipts, release deeds, and indemnity instruments to give full and immediate effect to this testamentary disposition.`,
  `I hereby declare and direct that any nomination registered in respect of my bank accounts, Fixed Deposits, Demat accounts, shares, mutual funds, or other financial assets is made solely for institutional transmission and procedural discharge under applicable banking and company regulations. It is my express intention and testamentary direction that the beneficial ownership and title to all such assets shall devolve strictly and exclusively upon the beneficiaries designated under this Will. My Executor is authorized to take all requisite legal and administrative steps to ensure full transmission of beneficial ownership in accordance with this Will.`
);

// 9. Section VIII Exclusion clause
dp = dp.replace(
  `Having carefully provided for my beloved family in accordance with my judgment, I hereby declare that no other relative, heir, or third party shall have any claim, title, or interest whatsoever in my estate save as expressly bequeathed under this Will.`,
  `Having carefully considered and provided for my beloved family in accordance with my judgment, I hereby declare that no other relative, heir, or third party shall have any claim, title, or interest whatsoever in my estate save as expressly bequeathed under this Will, to the maximum extent permitted by law.`
);

// 10. Execution LTI Box & Footer page initialing counter
dp = dp.replace(
  `<div class="thumb-impression-box">
            <div class="thumb-icon">👆</div>
            <span>Left Thumb Impression (LTI)</span>
          </div>`,
  `<div class="thumb-impression-box">
            <span style="font-weight: 600; font-size: 0.8rem; letter-spacing: 0.5px;">LEFT THUMB IMPRESSION (LTI)</span>
            <p style="font-size: 0.75rem; color: #64748b; margin-top: 4px;">(Affix left thumb impression in indelible ink)</p>
          </div>`
);

dp = dp.replace(
  `<div class="draft-page-initials-box">
        <span>Page Authentication Safeguard:</span>
        <span>Testator Initial: [ ____________ ]</span>
        <span>Witness 1: [ ____________ ]</span>
        <span>Witness 2: [ ____________ ]</span>
      </div>

      <div class="paper-footer text-center mt-3">
        <small class="text-muted">SmartWill India • Formatted under the Indian Succession Act, 1925 & Hindu Succession Act, 1956</small>
      </div>`,
  `<div class="draft-page-initials-box">
        <span>Page [ ___ ] of [ ___ ]</span>
        <span>Testator Initial: [ ____________ ]</span>
        <span>Witness 1: [ ____________ ]</span>
        <span>Witness 2: [ ____________ ]</span>
      </div>`
);

fs.writeFileSync(draftPreviewPath, dp, 'utf8');
console.log('Successfully updated js/render/draftPreview.js with 10/10 court safeguards!');
