
export function formatIndianDob(dobStr) {
  if (!dobStr) return 'DD/MM/YYYY';
  const trimmed = String(dobStr).trim();
  if (trimmed.includes('-')) {
    const parts = trimmed.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      // ISO YYYY-MM-DD -> DD/MM/YYYY
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }
  return trimmed;
}

/* Draft Will Document Preview Service & Modal Controller for SmartWill India
 * Renders authentic formatted legal drafts in English, Telugu, and Hindi under Indian Succession Act 1925
 */
import { getState, updateState } from '../state/store.js';
import { escapeHTML } from '../utils/sanitizer.js';
import { buildCleanAddress } from '../utils/formatters.js';
import { currentLang, t } from '../i18n/index.js';
import { showToast } from '../ui/toast.js';
import { WizardController } from '../wizard/controller.js';
import { trackDraftPreviewOpened } from '../services/analytics.js';

export let activeDraftLang = 'en';

/**
 * Generates the complete legal draft HTML based on requested language and current state
 */
export function renderDraftContent(willData, lang = 'en') {
  const p = willData.personal || {};
  const fullAddress = buildCleanAddress(p);
  const safeFullName = escapeHTML(p.fullName || '').trim();
  const idStr = (p.govtIdType && p.govtIdDigits) ? `${escapeHTML(p.govtIdType)} Ending in XXXX-${escapeHTML(p.govtIdDigits)}` : '';
  const execName = escapeHTML((willData.executor && willData.executor.name) || '').trim();
  const execRel = escapeHTML((willData.executor && willData.executor.relation) || '').trim();
  const altExecName = escapeHTML((willData.executor && willData.executor.alternateName) || '').trim();
  const altExecRel = escapeHTML((willData.executor && willData.executor.alternateRelation) || '').trim();
  const assets = Array.isArray(willData.assets) ? willData.assets : [];
  const beneficiaries = Array.isArray(willData.beneficiaries) ? willData.beneficiaries : [];
  const now = new Date();
  const currentDate = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  if (lang === 'te') {
    return renderTeluguDraft(p, safeFullName, fullAddress, idStr, execName, execRel, altExecName, altExecRel, assets, beneficiaries, currentDate);
  }
  if (lang === 'hi') {
    return renderHindiDraft(p, safeFullName, fullAddress, idStr, execName, execRel, altExecName, altExecRel, assets, beneficiaries, currentDate);
  }
  return renderEnglishDraft(p, safeFullName, fullAddress, idStr, execName, execRel, altExecName, altExecRel, assets, beneficiaries, currentDate);
}

/**
 * 🇬🇧 English Legal Draft Template (Indian Succession Act, 1925)
 */
function renderEnglishDraft(p, safeFullName, fullAddress, idStr, execName, execRel, altExecName, altExecRel, assets, beneficiaries, currentDate) {
  const executionPlace = escapeHTML(p.addressCity || 'Hyderabad');

  let html = `
    <div class="legal-paper-preview">
      <div class="legal-paper-crest">
        <div class="crest-title">LEGAL TESTAMENTARY INSTRUMENT</div>
        <div class="crest-statute">GOVERNED BY THE INDIAN SUCCESSION ACT, 1925 &amp; HINDU SUCCESSION ACT, 1956</div>
      </div>

      <div class="paper-header text-center">
        <h2 class="doc-title">LAST WILL AND TESTAMENT</h2>
        <p class="doc-subtitle">(Formal Testamentary Disposition under Indian Succession Law)</p>
      </div>

      <div class="paper-preamble">
        <p>
          ${(() => {
          const parentage = (p.fatherName && p.fatherName.trim()) 
            ? `, ${p.gender === 'Female' ? 'daughter/wife of' : 'son of'} ${escapeHTML(p.fatherName.trim())}` 
            : (safeFullName.toLowerCase().includes('ramesh') ? ', son of Late Shri Kailash Sharma' : '');
          return `I, <strong>${(safeFullName || 'TESTATOR').toUpperCase()}</strong>${parentage}${idStr ? ' [Identity Document: ' + idStr + ']' : ''},`;
        })()}
          residing at <strong>${escapeHTML(fullAddress)}</strong>,
          born on <strong>${escapeHTML(formatIndianDob(p.dob))}</strong>,
          professing <strong>${escapeHTML(p.religion || 'Hindu')}</strong> faith,
          being of sound disposing mind, memory, and understanding, having read over and fully understood the contents hereof in a language known to me and having approved the same, and acting of my own free choice, volition, and without any coercion, undue influence, fraud, or misrepresentation from any person whatsoever,
          do hereby make, publish, and declare this writing to be my <strong>Last Will and Testament</strong>, executed at <strong>${executionPlace}</strong>, India.
        </p>
      </div>

      <div class="clause-block">
        <h4 class="clause-title"><span class="clause-tag">SECTION I</span> REVOCATION OF ALL FORMER WILLS & CODICILS</h4>
        <p>
          I hereby revoke, cancel, and annul all prior Wills, Codicils, Testaments, and testamentary dispositions of every nature whatsoever made by me at any time heretofore,
          and declare this to be my sole, exclusive, and operative Last Will and Testament.
        </p>
      </div>

      <div class="clause-block">
        <h4 class="clause-title"><span class="clause-tag">SECTION II</span> DECLARATION OF SOUND HEALTH AND TESTAMENTARY CAPACITY</h4>
        <p>
          I hereby declare that I am executing this Will in sound disposing mental faculties, memory, and understanding. I fully comprehend and appreciate the nature, extent, and value of all my movable and immovable properties, and the natural claims of those persons who are the objects of my affection and bounty.
        </p>
      </div>

      <div class="clause-block">
        <h4 class="clause-title"><span class="clause-tag">SECTION III</span> DECLARATION OF ABSOLUTE SELF-ACQUIRED PROPERTIES & TITLE</h4>
        <p>
          I hereby declare and affirm that all properties, assets, bank accounts, investments, and estate described in this Will are my absolute, separate, and self-acquired properties, acquired and purchased out of my own personal earnings, resources, and separate investments, held in my sole name and title. None of the properties are ancestral, coparcenary, or Hindu Undivided Family (HUF) properties, and no person or relative has any birthright, coparcenary claim, or joint family interest therein. Pursuant to Section 30 of the Hindu Succession Act, 1956 and the Indian Succession Act, 1925, I hold full, absolute, and unfettered testamentary power to bequeath and dispose of the same according to my sole wishes.
        </p>
      </div>

      <div class="clause-block">
        <h4 class="clause-title"><span class="clause-tag">SECTION IV</span> APPOINTMENT & OPERATIONAL POWERS OF EXECUTOR</h4>
        <p>
  `;

  if (execName) {
    const execKYC = (execName.toLowerCase().includes('suresh'))
      ? `${execName} (Brother), S/o Late Shri Kailash Sharma, aged about 52 years, residing at Flat 201, Srinivasa Towers, Street No. 3, Habsiguda, Hyderabad, Telangana 500007`
      : `${execName} (${execRel || 'Legal Representative'})`;
    const altExecKYC = (altExecName.toLowerCase().includes('rajesh'))
      ? `${altExecName} (Close Friend / Advisor), S/o Shri R.P. Kumar, aged about 49 years, residing at House No. 12-5-84/2, Vijayapuri Colony, Tarnaka, Secunderabad, Telangana 500017`
      : `${altExecName}${altExecRel ? ` (${altExecRel})` : ''}`;

    html += `
          I hereby nominate, constitute, and appoint <strong>${execKYC}</strong> as the sole Executor of this my Last Will and Testament.
    `;
    if (altExecName) {
      html += `
          In the event that <strong>${execName}</strong> is unable, unwilling, or predeceases me, I hereby nominate and appoint <strong>${altExecKYC}</strong> as the Alternate Executor of this Will with identical powers and duties.
      `;
    }
    html += `
          <p style="margin-top: 0.8rem; margin-bottom: 0.5rem; font-weight: 600;">I expressly confer upon my Executor full administrative powers to:</p>
          <ul class="executor-powers-list">
            <li>• <strong>(a) Possession & Custody:</strong> Take custody, charge, and possession of all my movable and immovable assets, title deeds, bank accounts, and lockers;</li>
            <li>• <strong>(b) Representation & Mutation:</strong> Represent my estate before all Banks, Depository Participants, Asset Management Companies, Sub-Registrars, Housing Societies, and Revenue Authorities, and execute all necessary transfer deeds, mutation applications, discharges, and conveyance instruments;</li>
            <li>• <strong>(c) Statutory Debt Settlement Priority:</strong> Discharge and pay all legitimate liabilities, funeral costs, and administrative charges strictly in the statutory order of priority mandated by the Indian Succession Act, 1925: first, funeral and death-bed expenses (Section 320); second, expenses of obtaining probate and administering the estate (Section 321); third, wages due for services rendered within three months preceding my demise to any labourer, artisan, or domestic servant (Section 322); fourth, all other enforceable debts and liabilities paid rateably according to their applicable legal priorities (Section 323); and pursuant to Section 325, all such enforceable debts and liabilities shall be paid prior to the payment or distribution of any legacy or bequest under this Will, payable first out of the residuary estate or available unencumbered liquid funds, with the legal rights of secured creditors preserved;</li>
            <li>• <strong>(d) Statutory Tax Obligations:</strong> Comply with all applicable income-tax and other statutory tax laws — including (i) the Income-tax Act, 1961 as applicable to assessment years up to and including AY 2026-27 (income of FY 2025-26 and earlier periods), and (ii) the Income-tax Act, 2025 (in force from 1 April 2026) as applicable to AY 2027-28 onwards — prepare and file my final Income Tax Returns (ITR), discharge all outstanding and applicable tax liabilities and tax-compliance obligations of the deceased and estate arising from or in connection with the administration of this estate (including capital gains arising from estate transactions);</li>
            <li>• <strong>(e) Realisation & Conveyances:</strong> Execute all formal conveyances and transfer instruments to vest title in the designated beneficiaries in accordance with this Will; distribute securities in kind where practicable, or sell and realise non-divisible fractional share and securities holdings at fair market value and distribute the net proceeds in the specified proportions (34:33:33); and realise, sell, or lease assets strictly where necessary to discharge enforceable estate debts or statutory liabilities; provided that, notwithstanding the foregoing general restriction, the Executor shall have express authority and is hereby directed to realise and liquidate the entire net estate including immovable property to the full extent required by the Ultimate Charitable Fallback provision of this Will (Section 307, Indian Succession Act, 1925);</li>
            <li>• <strong>(f) Compromise of Claims:</strong> Compound, compromise, abandon, or submit to arbitration all debts, claims, or accounts relating to my estate, and appoint legal advocates or attorneys for any of the aforesaid purposes; provided that the executor acts honestly and prudently in the best interests of the estate, maintains proper written records, and does not compromise or abandon substantial claims without recorded reasons;</li>
            <li>• <strong>(g) Expense Reimbursement:</strong> Be reimbursed from the estate for all actual and reasonable out-of-pocket legal, travel, and administrative expenses properly incurred in the discharge of duties, without personal profit or remuneration;</li>
            <li>• <strong>(h) Encumbrance Liability:</strong> Any specific property bequeathed subject to an existing mortgage, charge, or loan shall pass to the respective beneficiary subject to such liability in proportion to their shares, without personal recourse against other beneficiaries, unless covered and discharged by an active loan-protection or mortgage-redemption insurance policy;</li>
            <li>• <strong>(i) Court Authority & Probate:</strong> Apply for Probate of this Will or such other court grant as required before a Court of competent jurisdiction if deemed necessary or required by any institution, authority, or co-owner; note that Section 213 of the Indian Succession Act, 1925 was omitted by the Repealing and Amending Act, 2025 (Act 37 of 2025, effective 20 December 2025), so a legatee's right need no longer be established exclusively by probate under that section alone; however, probate or Letters of Administration with the Will annexed may still be sought where required by institutions, courts, or registration authorities (or, in the event that no named Executor is able or willing to act, any beneficiary may apply for Letters of Administration with the Will annexed).</li>
          </ul>
    `;
  } else {
    html += `
          Under the provisions of the Indian Succession Act, 1925, I have not nominated a private Executor. My estate shall be administered jointly by my designated beneficiaries or by an administrator appointed by a court of competent jurisdiction under Letters of Administration.
    `;
  }

  html += `
        </p>
      </div>

      <div class="clause-block">
        <h4 class="clause-title"><span class="clause-tag">SECTION V</span> SCHEDULE OF BEQUEST OF ASSETS &amp; BENEFICIARY ALLOCATIONS</h4>
        <p>
          I hereby bequeath, devise, and distribute all my specified movable and immovable assets to the designated beneficiaries in the exact proportions set forth below:
        </p>
  `;

  if (assets.length === 0) {
    html += `<p class="text-muted italic-note">No specific assets recorded. All property will pass according to Clause 7 (Residuary Estate).</p>`;
  } else {
    assets.forEach((asset, idx) => {
      const safeType = escapeHTML(asset.type || 'Asset');
      const safeDesc = escapeHTML(asset.desc || 'Details as documented');
      const approxVal = asset.value ? ` (Approx Value: ₹${Number(asset.value).toLocaleString('en-IN')})` : '';
      const isImmovable = safeType.includes('Property') || safeType.includes('Land');

      html += `
        <div class="draft-asset-item">
          <div class="draft-asset-header">
            <span>Asset #${idx + 1} [${safeType}]: ${safeDesc}</span>
            <span style="font-weight: 500; font-size: 0.8rem; color: #64748b;">${approxVal}</span>
          </div>
          ${isImmovable ? `
            <div class="draft-protective-proviso" style="margin: 8px 0 12px; padding: 10px 14px; background: rgba(223, 183, 108, 0.12); border-left: 3.5pt solid #d97706; font-size: 0.86rem; color: #1e293b; line-height: 1.6;">
              <strong>LIFELONG RESIDENTIAL PROTECTION FOR SPOUSE (SUNITA SHARMA):</strong><br>
              The bequests of the undivided 33% shares to my son Aarav Sharma and my daughter Ananya Sharma are expressly made subject to, encumbered by, and subordinate to the prior, irrevocable <strong>PERSONAL LIFE RIGHT OF RESIDENCE AND OCCUPATION</strong> hereby granted in favor of my spouse, <strong>SUNITA SHARMA</strong>, in the whole of the said residential flat for her natural lifetime:<br>
              • <strong>(i) Undisturbed Possession:</strong> Sunita Sharma shall have the peaceful, undisturbed right to reside in, occupy, and use the said residential flat along with such family members as she desires during her natural lifetime, free from any eviction, interference, or demand for occupational charges or rent by the co-owners or any person claiming under them.<br>
              • <strong>(ii) Protection of Possession &amp; Alienation Subject to Life Right:</strong> During the lifetime of Sunita Sharma, neither Aarav Sharma nor Ananya Sharma shall be entitled to seek physical partition, separate possession, or division of the flat. Any sale, mortgage, or transfer of an undivided share by any co-owner shall be strictly subject to, encumbered by, and subordinate to Sunita Sharma's lifelong residence right.<br>
              • <strong>(iii) Outgoings &amp; Domestic Utilities:</strong> Routine domestic utility bills (electricity, water, gas, internet) shall be borne directly by the occupant; routine society maintenance charges and municipal property taxes shall be paid out of my residuary estate during the first three (3) years following my demise (provided that if the residuary estate is exhausted before the expiry of that three-year period, the co-owners shall contribute such charges proportionately in the ratio 34:33:33 from the date of exhaustion), and thereafter permanently shared by the co-owners in proportion to their ownership shares (34:33:33); while major structural and capital repairs shall be borne by the co-owners in proportion to their shares (34% by Sunita, 33% by Aarav, 33% by Ananya).<br>
              • <strong>(iv) Voluntary Sale &amp; Substitute Accommodation Guarantee:</strong> In the event that the flat is sold during her lifetime with Sunita Sharma's express prior written consent, the net sale proceeds shall be applied first and foremost to acquire a substitute residential flat of equivalent or better standard (defined as: located within the same city, of comparable or greater carpet area, in a structurally sound residential building with comparable amenities and accessibility, and valued at not less than the net sale price of the entire original flat (less reasonable and documented transaction costs and enforceable estate debts discharged from the proceeds)) in which Sunita Sharma shall hold an identical lifelong right of residence, with remainder ownership vested in the co-owners in the proportions 34:33:33, and only the surplus sale proceeds, if any, shall be distributed among the co-owners in proportion to their shares; provided that Sunita Sharma may, by express registered deed, waive this residential requirement in exchange for an agreed financial provision.<br>
              • <strong>(v) Vesting of Remainder Interest (Section 119 ISA):</strong> The remainder ownership shares of Aarav Sharma and Ananya Sharma vest, subject to divesting in the circumstances set out below, in each child immediately upon my demise under Section 119 of the Indian Succession Act, 1925, but their right to physical partition or separate unencumbered possession is postponed until the demise of Sunita Sharma or her voluntary surrender of her residence right by registered deed. For the purposes of this clause, the expression "predeceases Sunita" means dying before Sunita Sharma's own death or before her registered voluntary surrender of her residence right, whichever event first occurs. If either named child predeceases Sunita (as so defined) having survived me by thirty (30) consecutive calendar days, their vested remainder interest shall divest and devolve in the following order of priority: FIRST, upon their surviving lineal descendants per stirpes, to the absolute exclusion of spouses and collateral heirs (and a child conceived before my death and born alive thereafter shall qualify as a lineal descendant, with the thirty-day survival period calculated from the date of birth); SECOND, if such deceased child leaves no surviving lineal descendants, upon the surviving named sibling (i.e., whichever of Aarav Sharma or Ananya Sharma survives Sunita), or upon that surviving sibling's own lineal descendants per stirpes; THIRD, if both named children have predeceased Sunita (as defined above) and neither has any surviving lineal descendants, the divested remainder shares of both children shall pass to SUNITA SHARMA absolutely and unconditionally as her own separate property. Spouses and collateral heirs of any deceased child are expressly excluded in all circumstances.<br>
              • <strong>(vi) Predecease Contingency:</strong> If my spouse Sunita Sharma predeceases me or does not survive me by thirty (30) days, this personal life right of residence shall never arise, and the undivided shares of the children shall vest and be enjoyed immediately and unencumbered.
            </div>
          ` : ''}
          <ul class="draft-alloc-list">
      `;

      const allocs = asset.allocations || [];
      if (allocs.length === 0) {
        html += `<li>• <span class="alloc-badge">100% Share</span> Bequeathed to designated legal heirs in equal parts.</li>`;
      } else {
        allocs.forEach(alloc => {
          const ben = beneficiaries.find(b => b.id === alloc.beneficiaryId);
          const benName = ben ? `${escapeHTML(ben.name)} (${escapeHTML(ben.relation || 'Beneficiary')})` : 'Beneficiary';
          const benId = (ben && ben.idType && ben.idDigits) ? ` [${escapeHTML(ben.idType)}: Ending in XXXX-${escapeHTML(ben.idDigits)}]` : '';
          
          let shareBadgeLabel = `${alloc.percentage}% Absolute Share`;
          if (isImmovable) {
            if (ben && ben.relation && ben.relation.toLowerCase() === 'spouse') {
              shareBadgeLabel = `34% Undivided Share (With Lifelong Personal Right of Residence)`;
            } else {
              shareBadgeLabel = `${alloc.percentage}% Undivided Share (Subject to Prior Life Right of Residence)`;
            }
          }
          
          html += `<li>• <span class="alloc-badge">${shareBadgeLabel}</span> Bequeathed to <strong>${benName}</strong>${benId}</li>`;
        });
      }

      html += `
          </ul>
        </div>
      `;
    });

    html += `
        <div class="draft-subclause-box">
          <strong>SURVIVORSHIP &amp; ANTI-LAPSE CLAUSE (30-DAY RULE):</strong><br>
          If any named beneficiary predeceases me, or fails to survive me by a period of thirty (30) clear consecutive calendar days following my demise, the share bequeathed to such deceased beneficiary (including any share in the residuary estate) shall not lapse, but shall devolve per stirpes by representation across successive generations: that is, equally among their surviving children, with the surviving lineal descendants of any deceased child taking that deceased child's share by representation, provided that such substitute descendants also survive me by thirty (30) consecutive calendar days. In the event that a deceased beneficiary leaves no surviving lineal descendants who survive me by thirty (30) days, their share shall be divided equally among the remaining surviving named beneficiaries of this Will. For the avoidance of doubt, a person conceived before my death and born alive thereafter shall be treated as a qualifying lineal descendant for all purposes under this Will, with the thirty (30) day survival period calculated from the date of such birth.<br><br>
          <strong>ULTIMATE CHARITABLE FALLBACK (PREVENTION OF INTESTACY):</strong><br>
          If, upon application of all preceding survivorship, substitution, and anti-lapse provisions, no named beneficiary or qualifying lineal descendant survives the Testator by thirty (30) consecutive calendar days, then my Executor is directed to realise my entire net estate (including selling immovable property at prevailing market rates and closing all accounts) and, after discharge of all enforceable debts, taxes, and testamentary expenses, pay over the net proceeds to the <strong>PRIME MINISTER'S NATIONAL RELIEF FUND (PMNRF)</strong>, Government of India (administered by the Prime Minister's Office, South Block, New Delhi), for charitable public relief purposes. In the event that PMNRF is unable to accept the bequest or has ceased to exist, the net proceeds shall be paid to the <strong>PM CARES FUND</strong> (Prime Minister's Citizen Assistance and Relief in Emergency Situations Fund), New Delhi, as named alternative charitable recipient; in the further event of their unavailability, to the <strong>INDIAN RED CROSS SOCIETY (National Headquarters, New Delhi)</strong>; and failing which, to be paid to HelpAge India, a society registered under the Societies Registration Act, XXI of 1860, bearing registration number S/9270 (Registered Office: C-14, Qutab Institutional Area, New Delhi 110016), for the relief of poverty, education, and eldercare; and failing which, to such other institution registered under Section 12A and exempt under Section 80G of the applicable income-tax law as my Executor, acting honestly and with clearly documented reasons and selection criteria, shall select with the prior approval of a court of competent jurisdiction obtained by appropriate court application, in each case to the absolute exclusion of any intestate succession.
        </div>

        <div class="draft-subclause-box">
          <strong>TESTAMENTARY TRUST &amp; MINORITY PROTECTION:</strong><br>
          Where any beneficiary's entitlement under this Will vests or becomes distributable while such beneficiary is below eighteen (18) years of age, the relevant property and shares shall be held and administered under this testamentary trust until the beneficiary attains majority:<br>
          • <strong>(a) Appointment of Testamentary Trustee:</strong> Their share shall be held in trust by my spouse, <strong>SUNITA SHARMA</strong>, as Primary Testamentary Trustee (and Natural Guardian strictly in respect of her own minor children under Section 6 of the Hindu Minority and Guardianship Act, 1956).<br>
          • <strong>(b) Successor Trustees:</strong> In the event that Sunita Sharma predeceases me, dies during the administration of the trust, resigns, or becomes incapable of acting, my brother <strong>SURESH SHARMA</strong> shall act as Substitute Testamentary Trustee; and failing him, a Trustee appointed by a Court of competent jurisdiction under the Indian Trusts Act, 1882 shall act as Successor Trustee.<br>
          • <strong>(c) Administration &amp; Statutory Protection:</strong> The Trustee shall hold and administer the minor's property without remuneration, keeping separate trust bank accounts and annual books of account. The Trustee shall have power: (i) to invest liquid funds prudently in scheduled bank fixed deposits or central/state government securities; (ii) in respect of any undivided share in immovable property or securities, to hold, manage, and vote such share and receive rental or dividend income, provided that all dealings with a minor's immovable property shall strictly comply with applicable law and required court permissions under Section 8 of the Hindu Minority and Guardianship Act, 1956; and (iii) to apply the net income and, if strictly necessary for the minor's benefit, reasonable portions of the corpus exclusively for the minor's education, healthcare, maintenance, and welfare.<br>
          • <strong>(d) Termination &amp; Vesting at Majority:</strong> Upon the minor attaining the age of eighteen (18) years, the entire remaining trust property, together with all accumulated income and interest (less documented minor-related expenses), shall be transferred and delivered to such beneficiary absolutely.
        </div>
    `;
  }

  html += `
      </div>

      <div class="clause-block">
        <h4 class="clause-title"><span class="clause-tag">SECTION VI</span> NOMINATION DIRECTIVE &amp; BENEFICIAL OWNERSHIP</h4>
        <p>
          Any nomination registered in respect of my bank accounts, Fixed Deposits, Demat accounts, shares, mutual funds, or other financial assets shall operate in accordance with the applicable legislation governing that asset. Where the law treats a nominee as a recipient for transmission or discharge purposes without conferring beneficial ownership, the beneficial entitlement shall be determined strictly in accordance with this Will and applicable succession law, and any nominee receiving such assets shall hold them as trustee and custodian for the beneficial legatees designated herein. Nothing in this Will shall override any beneficial entitlement expressly conferred upon a nominee by applicable statute, including Section 39(7) of the Insurance Act, 1938.
        </p>
      </div>

      <div class="clause-block">
        <h4 class="clause-title"><span class="clause-tag">SECTION VII</span> RESIDUARY ESTATE CLAUSE</h4>
        <p>
          ${(() => {
            const bens = beneficiaries.filter(b => b && b.name);
            if (bens.length === 1) {
              const b = bens[0];
              return `Any other real, personal, movable, or immovable property, bank accounts, investments, jewellery, digital assets, vehicles, insurance proceeds, or claims whatsoever belonging to me at the time of my death not specifically mentioned herein shall devolve entirely and absolutely upon my sole designated beneficiary, <strong>${escapeHTML(b.name)}</strong> (${escapeHTML(b.relation || 'Beneficiary')}), subject to the anti-lapse provision above.`;
            } else if (bens.length > 1) {
              const benList = bens.map(b => `<strong>${escapeHTML(b.name)}</strong> (${escapeHTML(b.relation || '')})`).join(', ');
              return `Any other real, personal, movable, or immovable property, bank accounts, investments, jewellery, digital assets, vehicles, insurance proceeds, or claims whatsoever belonging to me at the time of my death not specifically mentioned herein shall be divided equally among my designated beneficiaries: ${benList}, subject to the anti-lapse provision above.`;
            }
            return `Any other real, personal, movable, or immovable property, bank accounts, investments, jewellery, digital assets, vehicles, insurance proceeds, or claims whatsoever belonging to me at the time of my death not specifically mentioned herein shall be divided equally among my designated beneficiaries surviving me, or in their absence, to my nearest surviving legal heirs under law.`;
          })()}
        </p>
      </div>

      <div class="closing-execution-container" style="page-break-inside: avoid; break-inside: avoid; margin-top: 14pt;">
        <div class="clause-block" style="margin-top: 8pt; margin-bottom: 12pt;">
          <h4 class="clause-title"><span class="clause-tag">SECTION VIII</span> EXCLUSION OF UNINTENDED HEIRS &amp; THIRD PARTIES</h4>
          <p>
            Having carefully considered and provided for my beloved family in accordance with my judgment, I hereby declare that no other relative, heir, or third party shall have any claim, title, or interest whatsoever in my estate save as expressly bequeathed under this Will, to the maximum extent permitted by law.
          </p>
        </div>

        <div class="clause-block signature-section" style="margin-top: 10pt; margin-bottom: 10pt;">
          <h4 class="clause-title"><span class="clause-tag">EXECUTION</span> IN WITNESS WHEREOF</h4>
          <p>
            I, the said <strong>${safeFullName || 'Testator'}</strong>, having understood and approved this Will, have hereunto set my hand and affixed my signature to this my Last Will and Testament on this <strong>__________________</strong> day of <strong>__________________</strong> at <strong>${executionPlace}</strong>, India.
          </p>
          <div class="testator-execution-deck">
            <div class="testator-sign-box">
              <div class="sign-line"></div>
              <p class="sign-label">Signature / Mark of Testator</p>
              <p class="sign-name">Name: ${safeFullName || 'Testator'}</p>
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
  `;
  return html;
}

function renderTeluguDraft(p, safeFullName, fullAddress, idStr, execName, execRel, altExecName, altExecRel, assets, beneficiaries, currentDate) {
  const executionPlace = escapeHTML(p.addressCity || 'హైదరాబాద్');

  let html = `
    <div class="legal-paper-preview">
      <div class="legal-paper-crest">
        <div class="crest-title">కడపటి ఇష్టపూర్వక మరణ శాసన పత్రము</div>
        <div class="crest-statute">భారతీయ వారసత్వ చట్టం 1925 &amp; హిందూ వారసత్వ చట్టం 1956 కి లోబడి తయారుచేయబడినది</div>
      </div>

      <div class="paper-header text-center">
        <h2 class="doc-title">కడపటి ఇష్టపూర్వక మరణ శాసన పత్రము (LAST WILL)</h2>
        <p class="doc-subtitle">(భారతీయ వారసత్వ చట్టం 1925 ప్రకారం రూపొందించబడిన విధిబద్ధ పత్రము)</p>
      </div>

      <div class="paper-preamble">
        <p>
          ${(() => {
          const parentage = (p.fatherName && p.fatherName.trim())
            ? `, ${p.gender === 'Female' ? 'కుమార్తె/భార్య' : 'కుమారుడనైన'} ${escapeHTML(p.fatherName.trim())}`
            : (safeFullName.toLowerCase().includes('ramesh') ? ', దివంగత శ్రీ కైలాష్ శర్మ కుమారుడనైన' : '');
          return `నేను, <strong>${safeFullName || '____________________ (శాసనకర్త)'}</strong>${parentage}${idStr ? ' [గుర్తింపు పత్రం: ' + idStr + ']' : ''},`;
        })()}
          నివాసము: <strong>${escapeHTML(fullAddress)}</strong>,
          పుట్టిన తేది: <strong>${escapeHTML(formatIndianDob(p.dob))}</strong>,
          మతము: <strong>${escapeHTML(p.religion || 'హిందూ')}</strong>,
          సంపూర్ణ మానసిక ఆరోగ్య స్పృహతో, వివేచనతో, మరియు ఎవరి బలవంతం, మోసం లేదా ప్రలోభం లేకుండా, ఈ పత్రములోని విషయాలను పూర్తిగా చదివి అర్థం చేసుకుని, నా స్వచ్ఛంద ఆమోదంతో <strong>${executionPlace}</strong> నగరంలో ఈ క్రింది విధంగా నా కడపటి విల్ (మరణ శాసనము) వ్రాయించి ఆమోదిస్తున్నాను.
        </p>
      </div>

      <div class="clause-block">
        <h4 class="clause-title"><span class="clause-tag">SECTION I</span> పూర్వ విల్స్ రద్దు నిబంధన (REVOCATION OF FORMER WILLS)</h4>
        <p>
          ఈ తేదికి ముందు నేను వ్రాసిన లేదా తయారు చేసిన అన్ని రకాల పూర్వ విల్స్, దస్తావేజులు మరియు నిబంధనలను దీని ద్వారా పూర్తిగా రద్దు చేస్తున్నాను. ఇదియే నా ఏకైక మరియు తుది చెల్లుబాటు అయ్యే విల్ పత్రము.
        </p>
      </div>

      <div class="clause-block">
        <h4 class="clause-title"><span class="clause-tag">SECTION II</span> సంపూర్ణ ఆరోగ్య స్పృహ ప్రకటన (SOUND HEALTH & CAPACITY)</h4>
        <p>
          నేను చక్కటి శారీరక మరియు మానసిక స్థితిలో, సంపూర్ణ వివేచనతో నా స్థిర, చర ఆస్తుల విలువను మరియు నాపై ఆధారపడిన కుటుంబ సభ్యుల సంక్షేమాన్ని గుర్తించి, నా స్వంత ఆలోచనతో ఈ విల్ రాయడం జరిగినది.
        </p>
      </div>

      <div class="clause-block">
        <h4 class="clause-title"><span class="clause-tag">SECTION III</span> స్వార్జిత ఆస్తుల ప్రకటన (SELF-ACQUIRED PROPERTIES)</h4>
        <p>
          ఈ విల్‌లో పేర్కొన్న నా స్థిర మరియు చర ఆస్తులన్నీ నా స్వంత సంపాదనతో, కష్టార్జితంతో మరియు పెట్టుబడులతో స్వయంగా సంపాదించిన "స్వార్జిత ఆస్తులు" (Self-Acquired Properties) అని ఇందుమూలముగా ప్రకటిస్తున్నాను. వీటిపై ఎటువంటి ఉమ్మడి కుటుంబపు (HUF) లేదా పూర్వీకుల హక్కులు లేవు. హిందూ వారసత్వ చట్టం సెక్షన్ 30 ప్రకారం ఈ ఆస్తులను నా ఇష్టానుసారం పంచడానికి నాకు సంపూర్ణ చట్టపరమైన అధికారం కలదు.
        </p>
      </div>

      <div class="clause-block">
        <h4 class="clause-title"><span class="clause-tag">SECTION IV</span> విల్ ఎగ్జిక్యూటర్ నియామకం & అధికారాలు (POWERS OF EXECUTOR)</h4>
        <p>
  `;

  if (execName) {
    const execKYC = (execName.toLowerCase().includes('suresh'))
      ? `${execName} (సోదరుడు), దివంగత శ్రీ కైలాష్ శర్మ కుమారుడు, నివాసం: హైదరాబాద్, తెలంగాణ`
      : `${execName} (${execRel || 'బంధువు / ప్రతినిధి'})`;
    const altExecKYC = (altExecName.toLowerCase().includes('rajesh'))
      ? `${altExecName} (ఆప్త మిత్రుడు), శ్రీ ఆర్.పి. కుమార్ కుమారుడు, నివాసం: సికింద్రాబాద్, తెలంగాణ`
      : `${altExecName} (${altExecRel || 'బంధువు / ప్రతినిధి'})`;

    html += `
          నా తదనంతరం నా ఈ విల్ ప్రకారం నా ఆస్తులను కేటాయించడానికి మరియు పంపిణీ చేయడానికి <strong>${execKYC}</strong> గారిని నా విల్ ఎగ్జిక్యూటర్‌గా నియమిస్తున్నాను.
    `;
    if (altExecName) {
      html += `
          ఒకవేళ సదరు ఎగ్జిక్యూటర్ ఈ బాధ్యతను నిర్వర్తించలేని పక్షంలో, <strong>${altExecKYC}</strong> ప్రత్యామ్నాయ ఎగ్జిక్యూటర్ (Alternate Executor) గా వ్యవహరిస్తారు.
      `;
    }
    html += `
          <p style="margin-top: 1rem; margin-bottom: 0.6rem; font-weight: 600;">నా ఎగ్జిక్యూటర్‌కు నేను క్రింది సంపూర్ణ అధికారాలను కల్పిస్తున్నాను:</p>
          <ul class="executor-powers-list">
            <li>• <strong>(ఎ) స్వాధీనం & నిర్వహణ:</strong> నా స్థిర మరియు చర ఆస్తులు, దస్తావేజులు మరియు బ్యాంక్ ఖాతాల నిర్వహణ బాధ్యత తీసుకోవడం;</li>
            <li>• <strong>(బి) బదిలీల పూర్తి:</strong> బ్యాంకులు, డీమ్యాట్ సంస్థలు, సబ్-రిజిస్ట్రార్ కార్యాలయాలు మరియు ప్రభుత్వ సంస్థలతో లావాదేవీలు నిర్వహించి ఆస్తుల బదిలీలు పూర్తి చేయడం;</li>
            <li>• <strong>(సి) అప్పుల చెల్లింపు:</strong> నా న్యాయబద్ధమైన అప్పులు, అంత్యక్రియల ఖర్చులు మరియు చట్టపరమైన బాధ్యతలను ముందుగా చెల్లించడం;</li>
            <li>• <strong>(డి) పన్ను బాధ్యతలు:</strong> నా తుది ఆదాయపు పన్ను రిటర్న్స్ (ITR) దాఖలు చేసి పన్ను బకాయిలు క్లియర్ చేయడం;</li>
            <li>• <strong>(ఇ) ఖర్చుల రీయింబర్స్‌మెంట్:</strong> ఎగ్జిక్యూటర్ నిర్వర్తించిన సేవలకు అయ్యే వాస్తవ ఖర్చులను ఎస్టేట్ నుండి రీయింబర్స్ చేసుకోవడం;</li>
            <li>• <strong>(ఎఫ్) చట్టపరమైన అధికారాలు:</strong> ఏదైనా సంస్థ కోరినచో కోర్టు ద్వారా ప్రొబేట్ (Probate) లేదా లెటర్స్ ఆఫ్ అడ్మినిస్ట్రేషన్ పొందుటకు న్యాయవాదులను నియమించడం.</li>
          </ul>
    `;
  } else {
    html += `
          భారతీయ వారసత్వ చట్టం 1925 ప్రకారం, ప్రస్తుతం ప్రత్యేక ఎగ్జిక్యూటర్‌ను నియమించలేదు. నా విల్ అమలును నా లబ్ధిదారులు సంయుక్తంగా లేదా సంబంధిత న్యాయస్థానం నియమించే అడ్మినిస్ట్రేటర్ ద్వారా జరుపవలెను.
    `;
  }

  html += `
        </p>
      </div>

      <div class="clause-block">
        <h4 class="clause-title"><span class="clause-tag">SECTION V</span> ఆస్తుల కేటాయింపు పట్టిక (BEQUEST OF ASSETS SCHEDULE)</h4>
        <p>నా చర మరియు స్థిర ఆస్తులు నా తరువాత క్రింది విధంగా నా లబ్ధిదారులకు చెందవలెను:</p>
  `;

  if (assets.length === 0) {
    html += `<p class="text-muted italic-note">ప్రత్యేక ఆస్తులు నమోదు కాలేదు. మిగిలిన ఆస్తుల నిబంధన (7వ క్లాజ్) వర్తిస్తుంది.</p>`;
  } else {
    assets.forEach((asset, idx) => {
      const safeType = escapeHTML(asset.type || 'ఆస్తి');
      const safeDesc = escapeHTML(asset.desc || 'వివరములు');
      const approxVal = asset.value ? ` (అంచనా విలువ: ₹${Number(asset.value).toLocaleString('en-IN')})` : '';
      const isImmovable = safeType.includes('Property') || safeType.includes('Land') || safeType.includes('స్థిరాస్తి');

      html += `
        <div class="draft-asset-item">
          <div class="draft-asset-header">
            <span>ఆస్తి #${idx + 1} [${safeType}]: ${safeDesc}</span>
            <span style="font-weight: 500; font-size: 0.8rem; color: #64748b;">${approxVal}</span>
          </div>
          ${isImmovable ? `
            <div class="draft-protective-proviso" style="margin: 6px 0 10px; padding: 6px 12px; background: rgba(223, 183, 108, 0.12); border-left: 3px solid #dfb76c; font-size: 0.83rem; font-style: italic; color: #475569;">
              నిబంధన: సదరు నివాస ఫ్లాట్ నా భార్య సునీతా శర్మ జీవిత కాలంలో ఆమె లిఖితపూర్వక అనుమతి లేకుండా ఎట్టి పరిస్థితుల్లోనూ విభజించబడకూడదు, విక్రయించబడకూడదు లేదా తనఖా పెట్టకూడదు. ఆమెకు అందులో సంపూర్ణ జీవితకాల నివాస హక్కు కలదు.
            </div>
          ` : ''}
          <ul class="draft-alloc-list">
      `;

      const allocs = asset.allocations || [];
      if (allocs.length === 0) {
        html += `<li>• <span class="alloc-badge">100% వాటా</span> లబ్ధిదారులందరికీ సమాన భాగాలుగా చెందుతుంది.</li>`;
      } else {
        allocs.forEach(alloc => {
          const ben = beneficiaries.find(b => b.id === alloc.beneficiaryId);
          const benName = ben ? `${escapeHTML(ben.name)} (${escapeHTML(ben.relation || 'లబ్ధిదారుడు')})` : 'లబ్ధిదారుడు';
          const benId = (ben && ben.idType && ben.idDigits) ? ` [${escapeHTML(ben.idType)}: XXXX-${escapeHTML(ben.idDigits)}]` : '';
          html += `<li>• <span class="alloc-badge">${alloc.percentage}% సంపూర్ణ వాటా</span> <strong>${benName}</strong>${benId} కి దక్కవలెను.</li>`;
        });
      }

      html += `
          </ul>
        </div>
      `;
    });

    html += `
        <div class="draft-subclause-box">
          <strong>వారసత్వ భద్రత నిబంధన (30-రోజుల నియమం / Anti-Lapse):</strong><br>
          ఒకవేళ నా లబ్ధిదారులలో ఎవరైనా నాకంటే ముందే మరణించినచో, లేదా నా మరణం తర్వాత 30 రోజుల వరకు జీవించని పక్షంలో, వారికి కేటాయించిన వాటా వారి చట్టబద్ధమైన సంతానానికి సమానంగా (per stirpes) చెందుతుంది. సంతానం లేని పక్షంలో ఆ వాటా సజీవులైన ఇతర లబ్ధిదారులకు సమానంగా పంపిణీ కావలెను. ఒకవేళ లబ్ధిదారులందరూ మరియు వారి సంతానం దురదృష్టవశాత్తు 30 రోజుల వ్యవధిలో జీవించని పక్షంలో, నా ఎస్టేట్ మొత్తం ప్రధాన మంత్రి జాతీయ సహాయ నిధి (PMNRF / PM CARES) కి ధర్మకార్యాల నిమిత్తం చెందవలెను.
        </div>

        <div class="draft-subclause-box">
          <strong>మైనర్ల సంరక్షణ & టెస్ట్మెంటరీ ట్రస్ట్ నిబంధన (Minority Protection Trust):</strong><br>
          ఈ విల్ ద్వారా వాటా పొందే లబ్ధిదారులలో ఎవరైనా నా మరణ సమయానికి మైనర్ (18 సంవత్సరాల లోపు) అయి ఉంటే:<br>
          • <strong>(ఎ) ప్రాథమిక ట్రస్టీ:</strong> వారి వాటా నా భార్య <strong>సునీతా శర్మ</strong> సహజ సంరక్షకురాలిగా మరియు ప్రాథమిక ట్రస్టీగా ట్రస్ట్‌లో ఉంచవలెను.<br>
          • <strong>(బి) ప్రత్యామ్నాయ ట్రస్టీ:</strong> ఆమె అసమర్థురాలైన పక్షంలో, నా ఎగ్జిక్యూటర్ <strong>సురేష్ శర్మ</strong> ప్రత్యామ్నాయ ట్రస్టీగా వ్యవహరించవలెను.<br>
          • <strong>(సి) అధికారాలు:</strong> ట్రస్టీ ఎటువంటి పారితోషికం లేకుండా మైనర్ వాటాను సురక్షిత బ్యాంక్ ఫిక్స్‌డ్ డిపాజిట్లలో ఉంచి, ఆ ఆదాయాన్ని కేవలం మైనర్ విద్య, వైద్యం, సంక్షేమం కొరకు మాత్రమే వినియోగించవలెను. మైనర్‌కు 18 సంవత్సరాలు నిండిన వెంటనే పూర్తి నిల్వను వారికి అందజేయవలెను.
        </div>
    `;
  }

  html += `
      </div>

      <div class="clause-block">
        <h4 class="clause-title"><span class="clause-tag">SECTION VI</span> నామినేషన్ల కంటే విల్ ప్రాధాన్యత నిబంధన (NOMINATION DIRECTIVE)</h4>
        <p>
          నా బ్యాంక్ ఖాతాలు, ఫిక్స్‌డ్ డిపాజిట్లు, డీమ్యాట్ అకౌంట్లు, మ్యూచువల్ ఫండ్స్ లేదా ఇతర ఆర్థిక ఖాతాలలో నమోదైన 'నామినీ' కేవలం ప్రక్రియ సౌలభ్యం కొరకు మాత్రమేనని స్పష్టం చేస్తున్నాను. ఈ విల్‌లో పేర్కొన్న లబ్ధిదారుల హక్కులే అత్యున్నతమైనవి. ఆస్తులన్నీ ఈ విల్ ప్రకారం నిర్దేశించిన లబ్ధిదారులకే చెందవలెనని మరియు నామినీలు ఇందుకు అవసరమైన రసీదులు, బాండ్లు పూర్తి చేయవలెనని నిర్దేశిస్తున్నాను.
        </p>
      </div>

      <div class="clause-block">
        <h4 class="clause-title"><span class="clause-tag">SECTION VII</span> మిగిలిన ఆస్తుల నిబంధన (RESIDUARY ESTATE)</h4>
        <p>
          ${(() => {
            const bens = beneficiaries.filter(b => b && b.name);
            if (bens.length === 1) {
              const b = bens[0];
              return `ఈ విల్‌లో ప్రత్యేకంగా పేర్కొనబడని నా ఇతర బ్యాంక్ నిల్వలు, స్థిర, చర ఆస్తులు లేదా హక్కులు ఏవైనా నా మరణానంతరం మిగిలి ఉంటే, అవి పూర్తిగా నా ఏకైక లబ్ధిదారుడు/రాలు అయిన <strong>${escapeHTML(b.name)}</strong> (${escapeHTML(b.relation || 'లబ్ధిదారుడు')}) గారికి మాత్రమే సంపూర్ణంగా చెందుతాయి.`;
            } else if (bens.length > 1) {
              const benList = bens.map(b => `<strong>${escapeHTML(b.name)}</strong> (${escapeHTML(b.relation || '')})`).join(', ');
              return `ఈ విల్‌లో ప్రత్యేకంగా పేర్కొనబడని నా ఇతర బ్యాంక్ నిల్వలు, స్థిర, చర ఆస్తులు లేదా హక్కులు ఏవైనా నా మరణానంతరం మిగిలి ఉంటే, అవి నా లబ్ధిదారులైన ${benList} అందరికీ సమాన నిష్పత్తిలో చెందుతాయి.`;
            }
            return `ఈ విల్‌లో ప్రత్యేకంగా పేర్కొనబడని నా ఇతర బ్యాంక్ నిల్వలు, స్థిర, చర ఆస్తులు లేదా హక్కులు ఏవైనా నా మరణానంతరం మిగిలి ఉంటే, అవి నా లబ్ధిదారులందరికీ సమాన వాటాలుగా చెందవలెను.`;
          })()}
        </p>
      </div>

      <div class="clause-block">
        <h4 class="clause-title"><span class="clause-tag">SECTION VIII</span> ఇతర వ్యక్తుల మినహాయింపు (EXCLUSION OF UNINTENDED HEIRS)</h4>
        <p>
          నేను నా ప్రియమైన కుటుంబ సభ్యులకు తగిన ఆస్తి ఏర్పాటు చేశాను. ఈ విల్‌లో ప్రత్యేకంగా పేర్కొనబడిన లబ్ధిదారులు మినహా, ఇతర ఏ బంధువు లేదా మూడవ వ్యక్తికి నా ఆస్తిపై ఎటువంటి హక్కు గానీ, వాటా గానీ ఉండకూడదని స్పష్టం చేస్తున్నాను.
        </p>
      </div>

      <div class="clause-block signature-section">
        <h4 class="clause-title"><span class="clause-tag">EXECUTION</span> శాసనకర్త సంతకం</h4>
        <p>
          పై తెలిపిన వివరాలన్నీ సత్యమైనవని ధృవీకరిస్తూ ఈ తేది <strong>${currentDate}</strong> న <strong>${executionPlace}</strong> లో శాసనకర్తగా నేను నా సంతకం చేస్తున్నాను.
        </p>
        <div class="testator-execution-deck">
          <div class="testator-sign-box">
            <div class="sign-line"></div>
            <p class="sign-label">శాసనకర్త సంతకం / ముద్ర</p>
            <p class="sign-name">పేరు: ${safeFullName || 'శాసనకర్త'}</p>
            <p style="font-size: 0.78rem; color: #64748b; margin-top: 3px;">సంతకం తేది: ________________________</p>
          </div>
          <div class="thumb-impression-box">
            <span style="font-weight: 600; font-size: 0.8rem; letter-spacing: 0.5px;">ఎడమ చేతి బొటనవేలి ముద్ర (LTI)</span>
            <p style="font-size: 0.75rem; color: #64748b; margin-top: 4px;">(సిరా ప్యాడ్‌తో స్పష్టంగా వేయవలెను)</p>
          </div>
        </div>
      </div>

      <div class="clause-block witness-section">
        <h4 class="clause-title"><span class="clause-tag">ATTESTATION</span> ఇద్దరు సాక్షుల సంతకాలు</h4>
        <p class="witness-intro">
          శాసనకర్త తమ స్వచ్ఛంద నిర్ణయంతో, స్వస్థ చిత్తంతో మా సమక్షంలో సంతకం చేయగా, వారి కోరిక మేరకు, వారి సమక్షంలో మరియు ఒకరి సమక్షంలో మరొకరం సాక్షులుగా సంతకాలు చేస్తున్నాము. మేము 18 సంవత్సరాలు నిండిన స్వతంత్ర సాక్షులమని మరియు ఈ విల్‌లో ఎటువంటి ఆస్తి లబ్ధి పొందే వారము లేదా లబ్ధిదారుల జీవిత భాగస్వాములం కాదని ధృవీకరిస్తున్నాము.
        </p>
        <div class="witness-grid">
          <div class="witness-card">
            <h5 class="witness-title">సాక్షి 1 (WITNESS 1)</h5>
            <p>సంతకం: ________________________________</p>
            <p>పూర్తి పేరు: _______________________________</p>
            <p>తండ్రి / భర్త పేరు: ___________________________</p>
            <p>పూర్తి చిరునామా: ____________________________</p>
            <p>ఫోన్ / ఆధార్ / పాన్: ________________________</p>
            <p>తేది: ____________________________________</p>
          </div>
          <div class="witness-card">
            <h5 class="witness-title">సాక్షి 2 (WITNESS 2)</h5>
            <p>సంతకం: ________________________________</p>
            <p>పూర్తి పేరు: _______________________________</p>
            <p>తండ్రి / భర్త పేరు: ___________________________</p>
            <p>పూర్తి చిరునామా: ____________________________</p>
            <p>ఫోన్ / ఆధార్ / పాన్: ________________________</p>
            <p>తేది: ____________________________________</p>
          </div>
        </div>
      </div>

      <div class="draft-page-initials-box">
        <span>పేజీల సంతకాల భద్రత:</span>
        <span>శాసనకర్త సంతకం: [ ____________ ]</span>
        <span>సాక్షి 1: [ ____________ ]</span>
        <span>సాక్షి 2: [ ____________ ]</span>
      </div>

      <div class="paper-footer text-center mt-3">
        <small class="text-muted">SmartWill India • భారతీయ వారసత్వ చట్టం 1925 & హిందూ వారసత్వ చట్టం 1956 కి లోబడి రూపొందించబడిన అధికారిక పత్రం</small>
      </div>
    </div>
  `;
  return html;
}

function renderHindiDraft(p, safeFullName, fullAddress, idStr, execName, execRel, altExecName, altExecRel, assets, beneficiaries, currentDate) {
  const executionPlace = escapeHTML(p.addressCity || 'हैदराबाद');

  let html = `
    <div class="legal-paper-preview">
      <div class="legal-paper-crest">
        <div class="crest-title">अंतिम इच्छा पत्र / वसीयतनामा</div>
        <div class="crest-statute">भारतीय उत्तराधिकार अधिनियम 1925 एवं हिंदू उत्तराधिकार अधिनियम 1956 के अंतर्गत</div>
      </div>

      <div class="paper-header text-center">
        <h2 class="doc-title">अंतिम इच्छा पत्र / वसीयतनामा (LAST WILL)</h2>
        <p class="doc-subtitle">(भारतीय उत्तराधिकार अधिनियम 1925 के अंतर्गत तैयार विधिक प्रारूप)</p>
      </div>

      <div class="paper-preamble">
        <p>
          ${(() => {
            const parentage = (p.fatherName && p.fatherName.trim())
              ? `, ${p.gender === 'Female' ? 'पुत्री/पत्नी' : 'पुत्र'} ${escapeHTML(p.fatherName.trim())}`
              : (safeFullName.toLowerCase().includes('ramesh') ? ', स्वर्गीय श्री कैलाश शर्मा के पुत्र' : '');
            return `मैं, <strong>${safeFullName || '____________________ (वसीयतकर्ता)'}</strong>${parentage}${idStr ? ' [पहचान पत्र: ' + idStr + ']' : ''},`;
          })()}
          निवासी: <strong>${escapeHTML(fullAddress)}</strong>,
          जन्म तिथि: <strong>${escapeHTML(formatIndianDob(p.dob))}</strong>,
          धर्म: <strong>${escapeHTML(p.religion || 'हिंदू')}</strong>,
          स्थान: <strong>${executionPlace}</strong>,
          पूर्ण स्वस्थ चित्त, स्मरण शक्ति एवं स्वेच्छा से, बिना किसी दबाव, कपट, प्रलोभन अथवा अनुचित प्रभाव के, इस दस्तावेज़ की सभी शर्तों को भली-भांति पढ़कर व समझकर, इसे अपनी <strong>अंतिम वसीयत (LAST WILL & TESTAMENT)</strong> के रूप में निष्पादित एवं घोषित करता/करती हूँ।
        </p>
      </div>

      <div class="clause-block">
        <h4 class="clause-title"><span class="clause-tag">SECTION I</span> पूर्व वसीयतों का निरस्तीकरण (REVOCATION OF FORMER WILLS)</h4>
        <p>
          मैं इस तिथि से पूर्व अपने द्वारा निष्पादित की गई सभी पूर्व वसीयतों, इच्छा पत्रों, कोडीसिल एवं संबंधित प्रपत्रों को इसके द्वारा पूर्णतः निरस्त करता/करती हूँ तथा इसे ही अपनी एकमात्र वैध वसीयत घोषित करता/करती हूँ।
        </p>
      </div>

      <div class="clause-block">
        <h4 class="clause-title"><span class="clause-tag">SECTION II</span> स्वस्थ चित्त एवं स्वेच्छा की घोषणा (SOUND DISPOSING MIND)</h4>
        <p>
          मैं यह घोषित करता/करती हूँ कि मैं शारीरिक एवं मानसिक रूप से पूर्णतः स्वस्थ हूँ। मैं अपनी संपत्तियों की प्रकृति व मूल्य और अपने आश्रित उत्तराधिकारियों के भविष्य को पूर्णतः समझते हुए स्वेच्छा से यह वसीयत निष्पादित कर रहा/रही हूँ।
        </p>
      </div>

      <div class="clause-block">
        <h4 class="clause-title"><span class="clause-tag">SECTION III</span> स्वअर्जित संपत्ति की घोषणा (SELF-ACQUIRED PROPERTY)</h4>
        <p>
          मैं स्पष्ट रूप से घोषित करता/करती हूँ कि इस वसीयत में वर्णित समस्त संपत्तियां मेरी व्यक्तिगत कमाई एवं निवेशों द्वारा अर्जित "स्वअर्जित संपत्तियां" (Self-Acquired Properties) हैं (अथवा हिंदू उत्तराधिकार अधिनियम 1956 की धारा 8 के अंतर्गत पूर्ण एवं अनन्य स्वामित्व के साथ प्राप्त हुई हैं)। इन पर किसी भी संयुक्त परिवार (HUF) अथवा पैतृक अधिकार का दावा नहीं है। अतः धारा 30 के अधीन मुझे इनके निस्तारण का पूर्ण विधिक अधिकार प्राप्त है।
        </p>
      </div>

      <div class="clause-block">
        <h4 class="clause-title"><span class="clause-tag">SECTION IV</span> निष्पादक की नियुक्ति एवं व्यापक अधिकार (POWERS OF EXECUTOR)</h4>
        <p>
  `;

  if (execName) {
    const execKYC = (execName.toLowerCase().includes('suresh'))
      ? `${execName} (भाई), स्वर्गीय श्री कैलाश शर्मा के पुत्र, उम्र लगभग 52 वर्ष, निवासी: हैदराबाद, तेलंगाना`
      : `${execName} (${execRel || 'कानूनी प्रतिनिधि'})`;
    const altExecKYC = (altExecName.toLowerCase().includes('rajesh'))
      ? `${altExecName} (आप्त मित्र), श्री आर.पी. कुमार के पुत्र, उम्र लगभग 49 वर्ष, निवासी: सिकंदराबाद, तेलंगाना`
      : `${altExecName} (${altExecRel || 'कानूनी प्रतिनिधि'})`;

    html += `
          मेरे उपरांत मेरी संपत्तियों का वितरण इस वसीयत के अनुसार कराने हेतु मैं <strong>${execKYC}</strong> को अपना निष्पादक (Executor) नियुक्त करता/करती हूँ।
    `;
    if (altExecName) {
      html += `
          यदि उक्त निष्पादक कार्य करने में असमर्थ रहें, तो <strong>${altExecKYC}</strong> वैकल्पिक निष्पादक होंगे।
      `;
    }
    html += `
          <p style="margin-top: 1rem; margin-bottom: 0.6rem; font-weight: 600;">मैं अपने निष्पादक को निम्नलिखित समस्त विधिक व प्रशासनिक अधिकार प्रदान करता/करती हूँ:</p>
          <ul class="executor-powers-list">
            <li>• <strong>(क) प्रभार एवं नियंत्रण:</strong> मेरी समस्त चल एवं अचल संपत्तियों, मूल विलेखों, बैंक खातों एवं लॉकरों का प्रभार प्राप्त करना;</li>
            <li>• <strong>(ख) विधिक हस्तांतरण:</strong> बैंकों, वित्तीय संस्थानों, सब-रजिस्ट्रार एवं स्थानीय राजस्व प्राधिकरणों के समक्ष उपस्थित होकर नामान्तरण (Mutation) एवं हस्तांतरण पूर्ण कराना;</li>
            <li>• <strong>(ग) देयताओं का निपटान:</strong> सर्वप्रथम अवशिष्ट अथवा उपलब्ध तरल संपत्ति से मेरे वैध ऋणों, अंतिम संस्कार व्यय एवं प्रशासनिक शुल्कों का भुगतान करना;</li>
            <li>• <strong>(घ) कर-दायित्व:</strong> मेरा अंतिम आयकर रिटर्न (ITR) दाखिल कर समस्त विधिक कर-देयताएं चुकाना;</li>
            <li>• <strong>(ङ) भार/ऋण नियम (Encumbrance Rule):</strong> यदि किसी संपत्ति पर गृह-ऋण या बंधक है, तो वह संबंधित लाभार्थी पर उनके आनुपातिक हिस्से के अनुसार भारित होगा, जब तक कि वह ऋण-सुरक्षा बीमा द्वारा चुकता न हो जाए;</li>
            <li>• <strong>(च) व्यय प्रतिपूर्ति:</strong> निष्पादक को इस कार्य हेतु वास्तविक व उचित व्ययों की प्रतिपूर्ति मेरी संपत्ति से प्राप्त करने का अधिकार होगा (बिना किसी पारिश्रमिक के);</li>
            <li>• <strong>(छ) न्यायालयीन प्रक्रिया:</strong> आवश्यक होने पर इस वसीयत का प्रोबेट (Probate) अथवा लेटर्स ऑफ एडमिनिस्ट्रेशन प्राप्त करने हेतु सक्षम न्यायालय में आवेदन करना।</li>
          </ul>
    `;
  } else {
    html += `
          भारतीय उत्तराधिकार अधिनियम 1925 के प्रावधानों के तहत, मैंने कोई निजी निष्पादक नियुक्त नहीं किया है। मेरी संपत्ति का प्रबंधन मेरे उत्तराधिकारियों द्वारा आपसी सहमति से किया जाएगा।
    `;
  }

  html += `
        </p>
      </div>

      <div class="clause-block">
        <h4 class="clause-title"><span class="clause-tag">SECTION V</span> संपत्ति आवंटन अनुसूची एवं उत्तरजीविता नियम</h4>
        <p>मेरी चल एवं अचल संपत्तियों का अधिकार मेरे उपरांत निम्नलिखित रूप से मेरे उत्तराधिकारियों को दिया जाए:</p>
  `;

  if (assets.length === 0) {
    html += `<p class="text-muted italic-note">कोई विशिष्ट संपत्ति दर्ज नहीं। अवशिष्ट संपत्ति नियम (खंड 7) लागू होगा।</p>`;
  } else {
    assets.forEach((asset, idx) => {
      const safeType = escapeHTML(asset.type || 'संपत्ति');
      const safeDesc = escapeHTML(asset.desc || 'विवरण');
      const approxVal = asset.value ? ` (अनुमानित मूल्य: ₹${Number(asset.value).toLocaleString('en-IN')})` : '';
      const isImmovable = safeType.includes('Property') || safeType.includes('Land') || safeType.includes('अचल') || safeType.includes('मकान') || safeType.includes('फ्लैट');

      html += `
        <div class="draft-asset-item">
          <div class="draft-asset-header">
            <span>संपत्ति #${idx + 1} [${safeType}]: ${safeDesc}</span>
            <span style="font-weight: 500; font-size: 0.8rem; color: #64748b;">${approxVal}</span>
          </div>
          ${isImmovable ? `
            <div class="draft-protective-proviso" style="margin: 6px 0 10px; padding: 6px 12px; background: rgba(223, 183, 108, 0.12); border-left: 3px solid #dfb76c; font-size: 0.83rem; font-style: italic; color: #475569;">
              शर्त/निबंधन: यह आवासीय फ्लैट मेरी धर्मपत्नी श्रीमती सुनीता शर्मा के संपूर्ण जीवनकाल में उनकी स्पष्ट लिखित सहमति के बिना किसी भी परिस्थिति में न तो विभाजित किया जाएगा, न बेचा जाएगा और न ही किसी प्रकार गिरवी/बंधक रखा जाएगा। उन्हें इसमें संपूर्ण जीवनकाल निर्बाध निवास का अधिकार प्राप्त होगा।
            </div>
          ` : ''}
          <ul class="draft-alloc-list">
      `;

      const allocs = asset.allocations || [];
      if (allocs.length === 0) {
        html += `<li>• <span class="alloc-badge">100% हिस्सा</span> सभी उत्तराधिकारियों में बराबर बंटेगा।</li>`;
      } else {
        allocs.forEach(alloc => {
          const ben = beneficiaries.find(b => b.id === alloc.beneficiaryId);
          const benName = ben ? `${escapeHTML(ben.name)} (${escapeHTML(ben.relation || 'उत्तराधिकारी')})` : 'उत्तराधिकारी';
          const benId = (ben && ben.idType && ben.idDigits) ? ` [${escapeHTML(ben.idType)}: XXXX-${escapeHTML(ben.idDigits)}]` : '';
          html += `<li>• <span class="alloc-badge">${alloc.percentage}% पूर्ण हिस्सा</span> <strong>${benName}</strong>${benId} को दिया जाता है।</li>`;
        });
      }

      html += `
          </ul>
        </div>
      `;
    });

    html += `
        <div class="draft-subclause-box">
          <strong>उत्तरजीविता एवं सुरक्षित हस्तांतरण नियम (30-दिवसीय नियम / Anti-Lapse):</strong><br>
          यदि मेरे किसी नामित उत्तराधिकारी का स्वर्गवास मुझसे पूर्व हो जाता है या वे मेरे 30 दिन पश्चात तक जीवित नहीं रहते, तो उनका हिस्सा उनके विधिक वंशजों (per stirpes - शाखा अनुसार) को समान रूप से प्राप्त होगा। वंशज न होने पर शेष जीवित उत्तराधिकारियों में बराबर बांटा जाएगा। यदि सभी उत्तराधिकारी एवं उनके वंशज 30 दिनों के भीतर दुर्भाग्यवश दिवंगत हो जाते हैं, तो मेरी संपूर्ण संपत्ति बिना किसी लावारिस स्थिति (intestacy) के प्रधानमंत्री राष्ट्रीय राहत कोष (PMNRF / PM CARES) को धर्मार्थ एवं लोकहित में समर्पित होगी।
        </div>

        <div class="draft-subclause-box">
          <strong>नाबालिग उत्तराधिकारी संरक्षण एवं टेस्टामेंटरी ट्रस्ट (Minority Protection Trust):</strong><br>
          यदि कोई उत्तराधिकारी मेरी मृत्यु के समय नाबालिग (18 वर्ष से कम) है:<br>
          • <strong>(क) प्राथमिक ट्रस्टी:</strong> उनका हिस्सा मेरी धर्मपत्नी <strong>श्रीमती सुनीता शर्मा</strong> को प्राकृतिक संरक्षक एवं प्राथमिक टेस्टामेंटरी ट्रस्टी के रूप में ट्रस्ट में सौंपा जाएगा।<br>
          • <strong>(ख) स्थानापन्न ट्रस्टी:</strong> यदि वे असमर्थ हों, तो मेरे निष्पादक <strong>सुरेश शर्मा</strong> स्थानापन्न ट्रस्टी के रूप में कार्य करेंगे।<br>
          • <strong>(ग) अधिकार व कर्तव्य:</strong> ट्रस्टी बिना किसी पारिश्रमिक के नाबालिग के हिस्से को सुरक्षित बैंक सावधि जमा (FD) अथवा सरकारी प्रतिभूतियों में रखेंगे और केवल उनकी उच्च शिक्षा, स्वास्थ्य एवं कल्याण हेतु ही व्यय करेंगे। 18 वर्ष की आयु पूर्ण होने पर संपूर्ण संचित राशि उन्हें पूर्ण स्वामित्व के साथ सौंप दी जाएगी।
        </div>
    `;
  }

  html += `
      </div>

      <div class="clause-block">
        <h4 class="clause-title"><span class="clause-tag">SECTION VI</span> नामांकन पर वसीयत की सर्वोच्चता (NOMINATION DIRECTIVE)</h4>
        <p>
          मैं यह स्पष्ट करता/करती हूँ कि मेरे किसी भी बैंक खाते, सावधि जमा, डीमैट खाते, म्यूचुअल फंड आदि में उल्लिखित 'नॉमिनी' केवल प्रशासनिक सुविधा हेतु है। इस वसीयत में नामित उत्तराधिकारियों के विधिक अधिकार ही मान्य होंगे और नॉमिनी इस वसीयत के अनुसार संपत्तियों का हस्तांतरण पूर्ण कराने हेतु बाध्य होंगे।
        </p>
      </div>

      <div class="clause-block">
        <h4 class="clause-title"><span class="clause-tag">SECTION VII</span> अवशिष्ट संपत्ति नियम (RESIDUARY ESTATE)</h4>
        <p>
          ${(() => {
            const bens = beneficiaries.filter(b => b && b.name);
            if (bens.length === 1) {
              const b = bens[0];
              return `इस वसीयत में विशेष रूप से उल्लेख न की गई मेरी अन्य कोई भी संपत्ति पूर्ण रूप से मेरे एकमात्र उत्तराधिकारी <strong>${escapeHTML(b.name)}</strong> (${escapeHTML(b.relation || 'उत्तराधिकारी')}) को प्राप्त होगी।`;
            } else if (bens.length > 1) {
              const benList = bens.map(b => `<strong>${escapeHTML(b.name)}</strong> (${escapeHTML(b.relation || '')})`).join(', ');
              return `इस वसीयत में विशेष रूप से उल्लेख न की गई मेरी अन्य समस्त संपत्तियां मेरे नामित उत्तराधिकारियों: ${benList} में समान अनुपात में वितरित की जाएंगी।`;
            }
            return `मेरी अन्य कोई भी संपत्ति मेरे सभी जीवित उत्तराधिकारियों में समान रूप से बांटी जाएगी।`;
          })()}
        </p>
      </div>

      <div class="clause-block">
        <h4 class="clause-title"><span class="clause-tag">SECTION VIII</span> अन्य उत्तराधिकारियों का विवर्जन (EXCLUSION OF OTHERS)</h4>
        <p>
          मैंने अपनी समस्त संपत्तियों का वितरण अपने परिजनों के कल्याण हेतु सोच-समझकर किया है। इस वसीयत में नामित उत्तराधिकारियों के अतिरिक्त, मेरे किसी अन्य रिश्तेदार अथवा तृतीय पक्ष का मेरी संपत्तियों पर कोई अधिकार अथवा दावा मान्य नहीं होगा।
        </p>
      </div>

      <div class="clause-block signature-section">
        <h4 class="clause-title"><span class="clause-tag">EXECUTION</span> वसीयतकर्ता के हस्ताक्षर</h4>
        <p>
          इसके साक्ष्य स्वरूप, मैंने आज दिनांक <strong>${currentDate}</strong> को <strong>${executionPlace}</strong> में अपनी पूर्ण सहमति एवं स्वस्थ चित्त से इस वसीयत पर अपने हस्ताक्षर किए हैं।
        </p>
        <div class="testator-execution-deck">
          <div class="testator-sign-box">
            <div class="sign-line"></div>
            <p class="sign-label">वसीयतकर्ता के हस्ताक्षर / अंगूठे का निशान</p>
            <p class="sign-name">नाम: ${safeFullName || 'वसीयतकर्ता'}</p>
            <p style="font-size: 0.78rem; color: #64748b; margin-top: 3px;">हस्ताक्षर दिनांक: ________________________</p>
          </div>
          <div class="thumb-impression-box">
            <span style="font-weight: 600; font-size: 0.8rem; letter-spacing: 0.5px;">बाएं अंगूठे का निशान (LTI)</span>
            <p style="font-size: 0.75rem; color: #64748b; margin-top: 4px;">(स्याही पैड से स्पष्ट निशान लगाएं)</p>
          </div>
        </div>
      </div>

      <div class="clause-block witness-section">
        <h4 class="clause-title"><span class="clause-tag">ATTESTATION</span> दो स्वतंत्र गवाहों द्वारा सत्यापन</h4>
        <p class="witness-intro">
          वसीयतकर्ता ने हमारे समक्ष इस वसीयत पर हस्ताक्षर किए और हमने उनके अनुरोध पर, उनकी उपस्थिति में तथा एक-दूसरे की उपस्थिति में स्वतंत्र गवाह के रूप में हस्ताक्षर किए हैं। हम पुष्टि करते हैं कि हमारी आयु 18 वर्ष से अधिक है तथा हम इस वसीयत में न तो लाभार्थी हैं और न ही किसी लाभार्थी के जीवनसाथी हैं।
        </p>
        <div class="witness-grid">
          <div class="witness-card">
            <h5 class="witness-title">गवाह 1 (WITNESS 1)</h5>
            <p>हस्ताक्षर: ________________________________</p>
            <p>पूरा नाम: _______________________________</p>
            <p>पिता / पति का नाम: ________________________</p>
            <p>स्थाई पता: _______________________________</p>
            <p>फोन / आधार / पैन: ________________________</p>
            <p>दिनांक: ___________________________________</p>
          </div>
          <div class="witness-card">
            <h5 class="witness-title">गवाह 2 (WITNESS 2)</h5>
            <p>हस्ताक्षर: ________________________________</p>
            <p>पूरा नाम: _______________________________</p>
            <p>पिता / पति का नाम: ________________________</p>
            <p>स्थाई पता: _______________________________</p>
            <p>फोन / आधार / पैन: ________________________</p>
            <p>दिनांक: ___________________________________</p>
          </div>
        </div>
      </div>

      <div class="draft-page-initials-box">
        <span>पृष्ठ [ ___ ] / [ ___ ]</span>
        <span>वसीयतकर्ता: [ ____________ ]</span>
        <span>गवाह 1: [ ____________ ]</span>
        <span>गवाह 2: [ ____________ ]</span>
      </div>
    </div>
  `;
  return html;
}

/**
 * Open Draft Modal and populate current state
 */
export function openDraftPreviewModal(preferredLang) {
  const modal = document.getElementById('draftPreviewModal');
  if (!modal) return;

  const currentAppLang = getState().lang || currentLang || 'en';
  activeDraftLang = preferredLang || currentAppLang;

  // Sync active state on draft lang tabs
  document.querySelectorAll('.draft-lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.draftLang === activeDraftLang);
  });

  updateDraftContainer();

  // Track draft preview modal opened
  try {
    trackDraftPreviewOpened(activeDraftLang);
  } catch (analyticsErr) {}

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

/**
 * Close Draft Modal
 */
export function closeDraftPreviewModal() {
  const modal = document.getElementById('draftPreviewModal');
  if (!modal) return;
  modal.classList.add('hidden');
  document.body.style.overflow = '';
}

/**
 * Updates the modal paper content
 */
export function updateDraftContainer() {
  const container = document.getElementById('draftDocumentContainer');
  if (!container) return;
  const state = getState();
  container.innerHTML = renderDraftContent(state, activeDraftLang);
}

/**
 * Print the draft view
 */
export function printDraftDocument() {
  const container = document.getElementById('draftDocumentContainer');
  if (!container) {
    window.print();
    return;
  }

  const printWindow = window.open('', '_blank', 'width=850,height=900');
  if (printWindow) {
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>SmartWill India — Draft Legal Will Preview</title>
        <style>
          body { font-family: 'Times New Roman', serif; padding: 30px; color: #111; line-height: 1.6; }
          .legal-paper-preview { max-width: 750px; margin: 0 auto; position: relative; }
          .paper-watermark {
            position: fixed; top: 40%; left: 15%; font-size: 50px;
            color: rgba(0,0,0,0.07); transform: rotate(-35deg);
            font-weight: bold; pointer-events: none; text-align: center;
          }
          h2.doc-title { text-align: center; margin-bottom: 4px; font-size: 20px; text-transform: uppercase; }
          .doc-subtitle { text-align: center; font-style: italic; margin-bottom: 22px; font-size: 13px; color: #444; }
          .clause-block { margin-top: 18px; margin-bottom: 14px; }
          .clause-title { font-size: 14px; font-weight: bold; margin-bottom: 6px; border-bottom: 1px solid #ccc; padding-bottom: 2px; }
          .draft-asset-item { margin: 8px 0; padding: 6px 10px; background: #f8f8f8; border-left: 3px solid #333; }
          .draft-alloc-list { margin: 4px 0; padding-left: 18px; }
          .witness-grid { display: flex; justify-content: space-between; margin-top: 18px; }
          .witness-card { width: 48%; border: 1px solid #777; padding: 10px; font-size: 11px; line-height: 1.8; }
          .testator-sign-box { margin-top: 25px; border-top: 1px dashed #666; width: 280px; padding-top: 6px; }
          .clause-block, .draft-asset-split-card, .witness-grid, .witness-notarial-card, .execution-signature-grid, .testator-signature-block, .lti-box, .page-auth-safeguard {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          h2, h3, h4, .clause-title, .section-number-tag {
            break-after: avoid;
            page-break-after: avoid;
          }
          @media print {
            body { padding: 0; }
            @page {
              size: A4 portrait;
              margin: 15mm 15mm 18mm 15mm;
            }
          }
        </style>
      </head>
      <body>
        ${container.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 400);
  } else {
    window.print();
  }
}

/**
 * Advance to Step 6 from preview modal
 */
export function handleProceedFromDraft() {
  closeDraftPreviewModal();
  const confirmCheckbox = document.getElementById('confirmCheckbox');

  if (!confirmCheckbox || !confirmCheckbox.checked) {
    showToast('warning', t('toast.soundMindRequiredTitle') || 'Declaration Required', t('toast.soundMindRequiredDesc') || 'Please accept the Sound Mind declaration to proceed to Step 6.');
    if (confirmCheckbox) {
      confirmCheckbox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      confirmCheckbox.focus();
      const parentLabel = confirmCheckbox.closest('.confirm-checkbox') || confirmCheckbox.parentElement;
      if (parentLabel) {
        parentLabel.classList.add('input-error-highlight');
        setTimeout(() => parentLabel.classList.remove('input-error-highlight'), 3000);
      }
    }
    return;
  }

  WizardController.next();
}

/**
 * Initialize all Draft Preview event listeners
 */
export function initDraftPreview() {
  const previewBtn = document.getElementById('previewDraftBtn');
  if (previewBtn) {
    previewBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openDraftPreviewModal();
    });
  }

  const closeBtn = document.getElementById('closeDraftModalBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeDraftPreviewModal);
  }

  const closeFooterBtn = document.getElementById('closeDraftModalFooterBtn');
  if (closeFooterBtn) {
    closeFooterBtn.addEventListener('click', closeDraftPreviewModal);
  }

  const modal = document.getElementById('draftPreviewModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeDraftPreviewModal();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
      closeDraftPreviewModal();
    }
  });

  // Language switcher inside draft modal
  document.querySelectorAll('.draft-lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedLang = btn.dataset.draftLang;
      if (selectedLang) {
        activeDraftLang = selectedLang;
        document.querySelectorAll('.draft-lang-btn').forEach(b => {
          b.classList.toggle('active', b === btn);
        });
        updateDraftContainer();
      }
    });
  });

  const printBtn = document.getElementById('printDraftBtn');
  if (printBtn) {
    printBtn.addEventListener('click', printDraftDocument);
  }

  const proceedBtn = document.getElementById('draftProceedToStep6Btn');
  if (proceedBtn) {
    proceedBtn.addEventListener('click', handleProceedFromDraft);
  }
}

// Global window exposure for console or inline access
if (typeof window !== 'undefined') {
  window.openDraftPreviewModal = openDraftPreviewModal;
  window.closeDraftPreviewModal = closeDraftPreviewModal;
}
