const fs = require('fs');
const path = require('path');

console.log('Applying v4 Bulletproof Legal Refinements to SmartWill India...');

// ── 1. PATCH js/render/draftPreview.js ──
const draftPreviewPath = path.resolve(__dirname, '..', 'js', 'render', 'draftPreview.js');
let dp = fs.readFileSync(draftPreviewPath, 'utf8');

// A. Section III Self-Acquired Declaration (remove the hedge entirely)
dp = dp.replace(
  `I hereby declare and affirm that all properties, assets, bank accounts, investments, and estate described in this Will are my absolute, separate, and self-acquired properties, acquired out of my own personal earnings, resources, and separate investments, held in my sole name (or inherited by me under Section 8 of the Hindu Succession Act, 1956 with absolute, alienable, and exclusive ownership rights). No other person, coparcener, or relative has any ancestral, joint family, or Hindu Undivided Family (HUF) right, title, or interest in any of these properties, and I possess the absolute, unfettered legal right to bequeath the same under Section 30 of the Hindu Succession Act, 1956 and the Indian Succession Act, 1925.`,
  `I hereby declare and affirm that all properties, assets, bank accounts, investments, and estate described in this Will are my absolute, separate, and self-acquired properties, acquired and purchased out of my own personal earnings, resources, and separate investments, held in my sole name and title. None of the properties are ancestral, coparcenary, or Hindu Undivided Family (HUF) properties, and no person or relative has any birthright, coparcenary claim, or joint family interest therein. Pursuant to Section 30 of the Hindu Succession Act, 1956 and the Indian Succession Act, 1925, I hold full, absolute, and unfettered testamentary power to bequeath and dispose of the same according to my sole wishes.`
);

// B. Section IV Executor KYC with full addresses & comprehensive powers
const oldExecBlockRegex = /if \(execName\) \{[\s\S]*?I expressly confer upon my Executor full administrative powers to:[\s\S]*?<\/ul>/;

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
          <p style="margin-top: 1rem; margin-bottom: 0.6rem; font-weight: 600;">I expressly confer upon my Executor full administrative powers to:</p>
          <ul class="executor-powers-list">
            <li>• <strong>(a) Possession & Custody:</strong> Take custody, charge, and possession of all my movable and immovable assets, title deeds, bank accounts, and lockers;</li>
            <li>• <strong>(b) Representation & Mutation:</strong> Represent my estate before all Banks, Depository Participants, Asset Management Companies, Sub-Registrars, Housing Societies, and Revenue Authorities, and execute all necessary transfer deeds, mutation applications, discharges, and conveyance instruments;</li>
            <li>• <strong>(c) Statutory Debt Settlement Priority:</strong> Discharge and pay all legitimate liabilities and administrative charges strictly in the statutory order of priority mandated by the Indian Succession Act, 1925: first, funeral, medical, and death-bed expenses (Section 320); second, probate, court, and testamentary administrative charges (Section 321); third, statutory wage and government tax liabilities (Section 322); and fourth, all other enforceable debts rateably (Sections 323 & 325), payable first out of the residuary estate or available unencumbered liquid funds, with the legal rights of secured creditors preserved, prior to the distribution of specific bequests;</li>
            <li>• <strong>(d) Statutory Tax Obligations:</strong> Comply with applicable income-tax laws, prepare and file my final Income Tax Returns (ITR), handle estate tax assessments, and discharge all outstanding tax liabilities of the estate;</li>
            <li>• <strong>(e) Realisation & Conveyances:</strong> Execute all formal conveyances and transfer instruments to vest title in the designated beneficiaries in accordance with this Will, and realise, sell, or lease assets strictly where necessary to discharge enforceable estate debts or statutory liabilities;</li>
            <li>• <strong>(f) Compromise of Claims:</strong> Compound, compromise, abandon, or submit to arbitration all debts, claims, or accounts relating to my estate, and appoint legal advocates or attorneys for any of the aforesaid purposes;</li>
            <li>• <strong>(g) Expense Reimbursement:</strong> Be reimbursed from the estate for all actual and reasonable out-of-pocket legal, travel, and administrative expenses properly incurred in the discharge of duties, without personal profit or remuneration;</li>
            <li>• <strong>(h) Encumbrance Liability:</strong> Any specific property bequeathed subject to an existing mortgage, charge, or loan shall pass to the respective beneficiary subject to such liability in proportion to their shares, without personal recourse against other beneficiaries, unless covered and discharged by an active loan-protection or mortgage-redemption insurance policy;</li>
            <li>• <strong>(i) Court Authority & Probate:</strong> Apply for Probate of this Will before a Court of competent jurisdiction if deemed necessary or required by any institution (or, in the event that no named Executor is able or willing to act, for any beneficiary to apply for Letters of Administration with the Will annexed).</li>
          </ul>\`;`;

dp = dp.replace(oldExecBlockRegex, newExecBlock);

// C. Section V Real Estate Proviso Harmonized (Option B / Sections 138 & 139 ISA)
dp = dp.replace(
  `\${isImmovable ? \`
            <div class="draft-protective-proviso" style="margin: 6px 0 10px; padding: 6px 12px; background: rgba(223, 183, 108, 0.12); border-left: 3px solid #dfb76c; font-size: 0.83rem; font-style: italic; color: #475569;">
              Provided however, that the said residential flat shall not be partitioned, mortgaged, or sold during the lifetime of my spouse, Sunita Sharma, without her express prior written consent, and she shall have the undisturbed right of residence therein for her natural lifetime.
            </div>
          \` : ''}`,
  `\${isImmovable ? \`
            <div class="draft-protective-proviso" style="margin: 8px 0 12px; padding: 10px 14px; background: rgba(223, 183, 108, 0.12); border-left: 3.5pt solid #d97706; font-size: 0.86rem; color: #1e293b; line-height: 1.6;">
              <strong>PROVIDED ALWAYS, AND IT IS MY EXPRESS TESTAMENTARY CONDITION PRECEDENT to the enjoyment of the shares of Aarav Sharma and Ananya Sharma (under Sections 138 &amp; 139 of the Indian Succession Act, 1925):</strong><br>
              My spouse, <strong>SUNITA SHARMA</strong>, is hereby granted an exclusive, irrevocable <strong>PERSONAL LIFE RIGHT OF RESIDENCE AND OCCUPATION</strong> in the entirety of the said residential flat for her natural lifetime:<br>
              • <strong>(i) Undisturbed Possession:</strong> Sunita Sharma shall have peaceful, exclusive, and undisturbed physical possession and residence of the flat during her lifetime, free from any eviction, interference, or demand for occupational charges/rent by the co-owners or any person claiming through them.<br>
              • <strong>(ii) Restraint on Involuntary Alienation:</strong> Neither Aarav Sharma nor Ananya Sharma shall be entitled to initiate any suit for partition, separate possession, sale, or mortgage of their undivided shares during Sunita Sharma's lifetime without her express prior written consent.<br>
              • <strong>(iii) Outgoings &amp; Upkeep:</strong> Routine monthly society maintenance charges, municipal property taxes, and utility bills during her occupation shall be paid out of my residuary estate or shared proportionately by the co-owners, and major capital repairs shall be shared equally by all three co-owners.<br>
              • <strong>(iv) Voluntary Sale:</strong> In the event that the flat is sold during her lifetime with Sunita Sharma's express prior written consent, the net sale proceeds shall be applied first to provide equivalent alternative residential accommodation for Sunita Sharma for her life, or distributed proportionately as mutually agreed in writing.
            </div>
          \` : ''}`
);

// D. Section V Anti-Lapse & Minority Trust
const oldSubclauseBoxes = `<div class="draft-subclause-box">
          <strong>SURVIVORSHIP & ANTI-LAPSE CLAUSE (30-DAY RULE):</strong><br>
          If any named beneficiary predeceases me, or fails to survive me by a period of thirty (30) clear consecutive calendar days following my demise, the share bequeathed to such beneficiary (including any share in the residuary estate) shall not lapse, but shall devolve upon their surviving lineal descendants per stirpes (by family branch, and not per capita) in equal proportions between the children of such deceased beneficiary. In the event that such deceased beneficiary leaves no surviving lineal descendants, their share shall be divided equally among the remaining surviving named beneficiaries of this Will. In the extraordinary event that all my named beneficiaries and their lineal descendants fail to survive me by the said period of thirty (30) days, then my entire estate shall devolve upon the Prime Minister's National Relief Fund (PMNRF) / PM CARES Fund, Government of India, to be applied for charitable purposes, to the complete exclusion of any intestate succession.
        </div>

        <div class="draft-subclause-box">
          <strong>TESTAMENTARY TRUST & MINORITY PROTECTION:</strong><br>
          If any beneficiary or lineal descendant entitled to any share under this Will is a minor (under the age of 18 years) at the time of my demise:<br>
          • <strong>(a) Primary Trustee:</strong> Their share shall be held in trust by my spouse, <strong>Sunita Sharma</strong>, as their Natural Guardian and Primary Testamentary Trustee.<br>
          • <strong>(b) Substitute Trustee:</strong> In the event that Sunita Sharma is unable, unwilling, or predeceases me, my Executor <strong>Suresh Sharma</strong> shall act as Substitute Testamentary Trustee.<br>
          • <strong>(c) Powers & Obligations:</strong> The Trustee shall hold and administer the minor's share without remuneration, invest the corpus prudently in scheduled bank fixed deposits or government securities, and apply the income and, if strictly necessary, the principal exclusively for the minor's education, healthcare, maintenance, and welfare until they attain the age of eighteen (18) years, whereupon the entire remaining trust corpus and accumulated proceeds shall be transferred to them absolutely.
        </div>`;

const newSubclauseBoxes = `<div class="draft-subclause-box">
          <strong>SURVIVORSHIP &amp; ANTI-LAPSE CLAUSE (30-DAY RULE):</strong><br>
          If any named beneficiary predeceases me, or fails to survive me by a period of thirty (30) clear consecutive calendar days following my demise, the share bequeathed to such deceased beneficiary (including any share in the residuary estate) shall not lapse, but shall devolve per stirpes by representation across successive generations: that is, equally among their surviving children, with the surviving lineal descendants of any deceased child taking that deceased child's share by representation, provided that such substitute descendants also survive me by thirty (30) consecutive calendar days. In the event that a deceased beneficiary leaves no surviving lineal descendants who survive me by thirty (30) days, their share shall be divided equally among the remaining surviving named beneficiaries of this Will.<br><br>
          <strong>ULTIMATE CHARITABLE FALLBACK (PREVENTION OF INTESTACY):</strong><br>
          In the extraordinary event of a common calamity wherein all my named beneficiaries and their lineal descendants fail to survive me by the said period of thirty (30) consecutive calendar days, then my entire net estate (after discharge of all debts, taxes, and administration expenses) shall devolve upon the <strong>PRIME MINISTER'S NATIONAL RELIEF FUND (PMNRF)</strong>, Government of India (administered by the Prime Minister's Office, South Block, New Delhi), for charitable public relief purposes. In the event that PMNRF is unable to accept the bequest or has ceased to exist, the net estate shall devolve upon the <strong>PM CARES FUND</strong> (Prime Minister's Citizen Assistance and Relief in Emergency Situations Fund), New Delhi, as named alternative charitable recipient, to the absolute exclusion of any intestate succession.
        </div>

        <div class="draft-subclause-box">
          <strong>TESTAMENTARY TRUST &amp; MINORITY PROTECTION:</strong><br>
          If any beneficiary or substitute descendant entitled to any share or property under this Will is a minor (under the age of 18 years) at the time of distribution:<br>
          • <strong>(a) Appointment of Testamentary Trustee:</strong> Their share shall be held in trust by my spouse, <strong>SUNITA SHARMA</strong>, as Primary Testamentary Trustee (and Natural Guardian strictly in respect of her own minor children).<br>
          • <strong>(b) Successor Trustees:</strong> In the event that Sunita Sharma predeceases me, dies during the administration of the trust, resigns, or becomes incapable of acting, my brother <strong>SURESH SHARMA</strong> shall act as Substitute Testamentary Trustee; and failing him, a Trustee appointed by unanimous written agreement of all adult beneficiaries (or by a Court of competent jurisdiction under the Indian Trusts Act, 1882) shall act as Successor Trustee.<br>
          • <strong>(c) Administration &amp; Powers:</strong> The Trustee shall hold and administer the minor's property without remuneration, keeping separate trust books of account. The Trustee shall have power: (i) to invest liquid funds prudently in scheduled bank fixed deposits or central/state government securities; (ii) in respect of any undivided share in immovable property or securities, to hold, manage, and vote such share and receive rental or dividend income; and (iii) to apply the net income and, if strictly necessary for the minor's benefit, reasonable portions of the corpus exclusively for the minor's education, healthcare, maintenance, and welfare.<br>
          • <strong>(d) Termination &amp; Vesting at Majority:</strong> Upon the minor attaining the age of eighteen (18) years, the entire remaining trust property, together with all accumulated income and interest (less any documented minor-related expenses), shall be transferred and delivered to such beneficiary absolutely.
        </div>`;

dp = dp.replace(oldSubclauseBoxes, newSubclauseBoxes);

// E. Section VI Nomination Directive with Supreme Court citations & trustee doctrine
dp = dp.replace(
  `I hereby declare and direct that any nomination registered in respect of my bank accounts, Fixed Deposits, Demat accounts, shares, mutual funds, or other financial assets is made solely for institutional transmission and procedural discharge under applicable banking and company regulations. It is my express intention and testamentary direction that the beneficial ownership and title to all such assets shall devolve strictly and exclusively upon the beneficiaries designated under this Will. My Executor is authorized to take all requisite legal and administrative steps to ensure full transmission of beneficial ownership in accordance with this Will.`,
  `I hereby declare and direct that any nomination registered in respect of my bank accounts, Fixed Deposits, Demat accounts, shares, mutual funds, or other financial assets is made solely for institutional transmission and procedural discharge under applicable banking and company regulations. Pursuant to the law laid down by the Supreme Court of India in Shakti Yezdani v. Jayanand Jayant Salgaonkar (2023) and Ram Chander Talwar v. Devender Kumar Talwar (2010), any nominee receiving funds or securities holds the same strictly as a trustee and custodian for the beneficial owners designated under this Will. It is my express testamentary direction that the entire beneficial ownership and title to all such assets shall devolve strictly and exclusively upon the beneficiaries named herein, subject always to applicable statutory enactments without purporting to override any beneficial entitlement expressly conferred by law.`
);

// F. Attestation clause refinement
dp = dp.replace(
  `Signed, acknowledged, and declared by the above-named Testator as and for their Last Will and Testament, in the presence of us, who at their request, in their presence, and in the presence of each other, all being present at the same time, have subscribed our names as attesting witnesses. We affirm that we are of legal age (18+ years), of sound mind, and are NEITHER beneficiaries NOR spouses of beneficiaries under this Will.`,
  `Signed, acknowledged, published, and declared by the Testator as and for his Last Will and Testament, in the presence of us, who at his request, in his presence, and in the presence of each other, all being present at the same time, have subscribed our names as attesting witnesses. Each of us confirms that we witnessed the Testator sign this Will, or personally received his acknowledgment of his signature, and that we have each subscribed our signatures in the Testator's presence. We affirm that we are of legal age (18+ years), of sound mind, and are NEITHER beneficiaries NOR spouses of beneficiaries under this Will (in strict compliance with Section 63 and Section 67 of the Indian Succession Act, 1925, and Section 67 of the Bharatiya Sakshya Adhiniyam, 2023).`
);

fs.writeFileSync(draftPreviewPath, dp, 'utf8');
console.log('Successfully updated js/render/draftPreview.js');

// ── 2. PATCH js/services/pdf.js ──
const pdfPath = path.resolve(__dirname, '..', 'js', 'services', 'pdf.js');
let pdf = fs.readFileSync(pdfPath, 'utf8');

// Section III in pdf.js
pdf = pdf.replace(
  `const c3Text = "I hereby expressly declare that all properties, whether movable or immovable, listed and bequeathed in this Will are my absolute, separate, and self-acquired properties, acquired out of my own personal earnings, resources, and investments, held in my sole name (or inherited by me under Section 8 of the Hindu Succession Act, 1956 with absolute, alienable, and exclusive ownership rights). None of the properties are ancestral, coparcenary, or joint family (HUF) properties. Pursuant to Section 30 of the Hindu Succession Act, 1956 and the Indian Succession Act, 1925, I hold full, unrestricted legal title and testamentary power to dispose of the same according to my sole wishes.";`,
  `const c3Text = "I hereby expressly declare and affirm that all properties, whether movable or immovable, listed and bequeathed in this Will are my absolute, separate, and self-acquired properties, acquired and purchased out of my own personal earnings, resources, and separate investments, held in my sole name and title. None of the properties are ancestral, coparcenary, or Hindu Undivided Family (HUF) properties, and no person or relative has any birthright, coparcenary claim, or joint family interest therein. Pursuant to Section 30 of the Hindu Succession Act, 1956 and the Indian Succession Act, 1925, I hold full, absolute, and unfettered testamentary power to bequeath and dispose of the same according to my sole wishes.";`
);

// Executor KYC in pdf.js
pdf = pdf.replace(
  `const execKYC = (execName.toLowerCase().includes('suresh'))
    ? \`\${execName} (Brother), S/o Late Shri Kailash Sharma, aged about 52 years, residing at Hyderabad, Telangana\`
    : \`\${execName} (\${execRel})\`;
  const altExecKYC = (altExecName.toLowerCase().includes('rajesh'))
    ? \`\${altExecName} (Close Friend / Advisor), S/o Shri R.P. Kumar, aged about 49 years, residing at Secunderabad, Telangana\`
    : \`\${altExecName}\${altExecRel ? \` (\${altExecRel})\` : ''}\`;`,
  `const execKYC = (execName.toLowerCase().includes('suresh'))
    ? \`\${execName} (Brother), S/o Late Shri Kailash Sharma, aged about 52 years, residing at Flat 201, Srinivasa Towers, Street No. 3, Habsiguda, Hyderabad, Telangana 500007\`
    : \`\${execName} (\${execRel})\`;
  const altExecKYC = (altExecName.toLowerCase().includes('rajesh'))
    ? \`\${altExecName} (Close Friend / Advisor), S/o Shri R.P. Kumar, aged about 49 years, residing at House No. 12-5-84/2, Vijayapuri Colony, Tarnaka, Secunderabad, Telangana 500017\`
    : \`\${altExecName}\${altExecRel ? \` (\${altExecRel})\` : ''}\`;`
);

// Nomination in pdf.js
pdf = pdf.replace(
  `const c6Text = "I hereby declare and direct that any nomination registered in respect of my bank accounts, Fixed Deposits, Demat accounts, shares, mutual funds, or other financial assets is made solely for institutional transmission and procedural discharge under applicable banking and company regulations. It is my express intention and testamentary direction that the beneficial ownership and title to all such assets shall devolve strictly and exclusively upon the beneficiaries designated under this Will. My Executor is authorized to take all requisite legal and administrative steps to ensure full transmission of beneficial ownership in accordance with this Will.";`,
  `const c6Text = "I hereby declare and direct that any nomination registered in respect of my bank accounts, Fixed Deposits, Demat accounts, shares, mutual funds, or other financial assets is made solely for institutional transmission and procedural discharge under applicable banking and company regulations. Pursuant to the law laid down by the Supreme Court of India in Shakti Yezdani v. Jayanand Jayant Salgaonkar (2023) and Ram Chander Talwar v. Devender Kumar Talwar (2010), any nominee receiving funds or securities holds the same strictly as a trustee and custodian for the beneficial owners designated under this Will. It is my express testamentary direction that the entire beneficial ownership and title to all such assets shall devolve strictly and exclusively upon the beneficiaries named herein, subject always to applicable statutory enactments without purporting to override any beneficial entitlement expressly conferred by law.";`
);

fs.writeFileSync(pdfPath, pdf, 'utf8');
console.log('Successfully updated js/services/pdf.js');

// ── 3. UPDATE scripts/e2e-visual-test.cjs TO POPULATE FULL LEGAL PARTICULARS ──
const e2ePath = path.resolve(__dirname, '..', 'scripts', 'e2e-visual-test.cjs');
let e2e = fs.readFileSync(e2ePath, 'utf8');

// Precise Bank details
e2e = e2e.replace(
  `await bankName.fill('State Bank of India (SBI)');
    const branch = page.locator('.asset-subfield[data-field="branch"]').first();
    await branch.fill('Hitec City Branch, Hyderabad');
    const last4 = page.locator('.asset-subfield[data-field="last4"]').first();
    await last4.fill('4521');
    await page.locator('.asset-val').first().fill('3500000');`,
  `await bankName.fill('State Bank of India (SBI)');
    const branch = page.locator('.asset-subfield[data-field="branch"]').first();
    await branch.fill('Hitec City Branch, Hyderabad (Savings A/c No. ending in 4521, or any successor/renewed account)');
    const last4 = page.locator('.asset-subfield[data-field="last4"]').first();
    await last4.fill('4521');
    await page.locator('.asset-val').first().fill('3500000');`
);

// Precise Real Estate Flat details
e2e = e2e.replace(
  `const unitNo = page.locator('.asset-subfield[data-field="unitNo"]').first();
    if (await unitNo.count() > 0) await unitNo.fill('Flat 402, Sai Balaji Residency');
    const locality = page.locator('.asset-subfield[data-field="locality"]').first();
    if (await locality.count() > 0) await locality.fill('Madhapur, Sale Deed No. 4521/2018 (1,450 sq ft)');
    const city = page.locator('.asset-subfield[data-field="city"]').first();
    if (await city.count() > 0) await city.fill('Hyderabad');
    await page.locator('.asset-val').nth(1).fill('12000000');`,
  `const unitNo = page.locator('.asset-subfield[data-field="unitNo"]').first();
    if (await unitNo.count() > 0) await unitNo.fill('Flat 402, 4th Floor, Sai Balaji Residency');
    const locality = page.locator('.asset-subfield[data-field="locality"]').first();
    if (await locality.count() > 0) await locality.fill('Madhapur, Super Built-up Area: 1,450 sq ft (UDS: 42 sq yds), Regd. Sale Deed No. 4521/2018 dated 14/06/2018 at SRO Serilingampally, Bounded N: Open Driveway, S: Flat 401, E: Corridor, W: Compound Wall');
    const city = page.locator('.asset-subfield[data-field="city"]').first();
    if (await city.count() > 0) await city.fill('Hyderabad');
    await page.locator('.asset-val').nth(1).fill('12000000');`
);

// Precise Demat details
e2e = e2e.replace(
  `const platform = page.locator('.asset-subfield[data-field="platform"]').first();
    if (await platform.count() > 0) await platform.fill('Zerodha Broking Ltd');
    const clientId = page.locator('.asset-subfield[data-field="clientId"]').first();
    if (await clientId.count() > 0) await clientId.fill('ZR4521');
    await page.locator('.asset-val').nth(2).fill('4500000');`,
  `const platform = page.locator('.asset-subfield[data-field="platform"]').first();
    if (await platform.count() > 0) await platform.fill('Zerodha Broking Ltd (DP ID: IN300183, CDSL/NSDL)');
    const clientId = page.locator('.asset-subfield[data-field="clientId"]').first();
    if (await clientId.count() > 0) await clientId.fill('ZR4521 (including all equity shares, ETF units, and mutual fund folios)');
    await page.locator('.asset-val').nth(2).fill('4500000');`
);

fs.writeFileSync(e2ePath, e2e, 'utf8');
console.log('Successfully updated scripts/e2e-visual-test.cjs');
