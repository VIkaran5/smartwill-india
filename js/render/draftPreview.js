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
      <div class="paper-watermark">SAMPLE PREVIEW • SMARTWILL</div>

      <div class="legal-paper-crest">
        <div class="crest-emblem">⚖️</div>
        <div class="crest-title">LEGAL TESTAMENTARY INSTRUMENT</div>
        <div class="crest-statute">GOVERNED BY THE INDIAN SUCCESSION ACT, 1925 & HINDU SUCCESSION ACT, 1956</div>
      </div>

      <div class="paper-header text-center">
        <h2 class="doc-title">LAST WILL AND TESTAMENT</h2>
        <p class="doc-subtitle">(Formal Testamentary Disposition under Indian Succession Law)</p>
      </div>

      <div class="paper-preamble">
        <p>
          I, <strong>${(safeFullName || 'TESTATOR').toUpperCase()}</strong>${idStr ? ' [Identity Document: ' + idStr + ']' : ''},
          residing at <strong>${escapeHTML(fullAddress)}</strong>,
          born on <strong>${escapeHTML(p.dob || 'DD/MM/YYYY')}</strong>,
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
          I hereby declare that I am executing this Will in good physical health and sound disposing mental faculties. I fully comprehend and appreciate the nature, extent, and value of all my movable and immovable properties, and the natural claims of those persons who are the objects of my affection and bounty.
        </p>
      </div>

      <div class="clause-block">
        <h4 class="clause-title"><span class="clause-tag">SECTION III</span> DECLARATION OF ABSOLUTE SELF-ACQUIRED PROPERTIES & TITLE</h4>
        <p>
          I hereby declare and affirm that all properties, assets, bank accounts, investments, and estate described in this Will are my absolute, self-acquired properties, acquired out of my own personal earnings, resources, and separate investments (or inherited by me with absolute, alienable ownership rights). No other person, coparcener, or relative has any ancestral, joint family, or Hindu Undivided Family (HUF) right, title, or interest in any of these properties, and I possess the absolute, unfettered right to bequeath the same under Section 30 of the Hindu Succession Act, 1956 and the Indian Succession Act, 1925.
        </p>
      </div>

      <div class="clause-block">
        <h4 class="clause-title"><span class="clause-tag">SECTION IV</span> APPOINTMENT & OPERATIONAL POWERS OF EXECUTOR</h4>
        <p>
  `;

  if (execName) {
    html += `
          I hereby nominate, constitute, and appoint <strong>${execName}</strong> (${execRel || 'Legal Representative'}) as the sole Executor of this my Last Will and Testament.
    `;
    if (altExecName) {
      html += `
          In the event that <strong>${execName}</strong> is unable, unwilling, or predeceases me, I hereby nominate and appoint <strong>${altExecName}</strong>${altExecRel ? ` (${altExecRel})` : ''} as the Alternate Executor of this Will with identical powers and duties.
      `;
    }
    html += `
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
        <h4 class="clause-title"><span class="clause-tag">SECTION V</span> SCHEDULE OF BEQUEST OF ASSETS & BENEFICIARY ALLOCATIONS</h4>
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

      html += `
        <div class="draft-asset-item">
          <div class="draft-asset-header">
            <span>Asset #${idx + 1} [${safeType}]: ${safeDesc}</span>
            <span style="font-weight: 500; font-size: 0.8rem; color: #64748b;">${approxVal}</span>
          </div>
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
          html += `<li>• <span class="alloc-badge">${alloc.percentage}% Absolute Share</span> Bequeathed forever to <strong>${benName}</strong>${benId}</li>`;
        });
      }

      html += `
          </ul>
        </div>
      `;
    });

    html += `
        <div class="draft-subclause-box">
          <strong>🛡️ Survivorship & Anti-Lapse Provision (30-Day Rule):</strong><br>
          If any named beneficiary predeceases me, or fails to survive me by a period of thirty (30) clear days, the share bequeathed to such beneficiary (including any share in the residuary estate) shall not lapse, but shall devolve upon their surviving lineal descendants per stirpes in equal proportions. In the event that such deceased beneficiary leaves no surviving lineal descendants, their share shall be divided equally among the remaining surviving named beneficiaries of this Will.
        </div>

        <div class="draft-subclause-box">
          <strong>🔒 Minority Protection & Guardianship Trust:</strong><br>
          If any beneficiary or lineal descendant entitled to any share under this Will is a minor (under the age of 18 years) at the time of my demise, their share shall be held in trust by their Natural / Testamentary Guardian (or my Executor) without remuneration, and applied exclusively for their education, healthcare, maintenance, and welfare until they attain the age of majority (18 years).
        </div>
    `;
  }

  html += `
      </div>

      <div class="clause-block">
        <h4 class="clause-title"><span class="clause-tag">SECTION VI</span> NOMINATION DIRECTIVE & BENEFICIAL OWNERSHIP</h4>
        <p>
          I hereby expressly declare and direct that any nomination registered in respect of my bank accounts, Fixed Deposits, Demat accounts, shares, mutual funds, or other financial assets is made solely for institutional transmission and procedural convenience. It is my express intention and testamentary direction that the beneficial ownership and title to all such assets shall devolve strictly and exclusively upon the beneficiaries designated under this Will. My nominees and beneficiaries are directed to execute all requisite receipts, release deeds, and indemnity instruments to give full and immediate effect to this testamentary disposition.
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

      <div class="clause-block">
        <h4 class="clause-title"><span class="clause-tag">SECTION VIII</span> EXCLUSION OF UNINTENDED HEIRS & THIRD PARTIES</h4>
        <p>
          Having carefully provided for my beloved family in accordance with my judgment, I hereby declare that no other relative, heir, or third party shall have any claim, title, or interest whatsoever in my estate save as expressly bequeathed under this Will.
        </p>
      </div>

      <div class="clause-block signature-section">
        <h4 class="clause-title"><span class="clause-tag">EXECUTION</span> IN WITNESS WHEREOF</h4>
        <p>
          I, the said <strong>${safeFullName || 'Testator'}</strong>, having understood and approved this Will, have hereunto set my hand and affixed my signature to this my Last Will and Testament on this <strong>${currentDate}</strong> at <strong>${executionPlace}</strong>, India.
        </p>
        <div class="testator-execution-deck">
          <div class="testator-sign-box">
            <div class="sign-line"></div>
            <p class="sign-label">Signature / Mark of Testator</p>
            <p class="sign-name">Name: ${safeFullName || 'Testator'}</p>
            <p style="font-size: 0.78rem; color: #64748b; margin-top: 3px;">Date: ________________________</p>
          </div>
          <div class="thumb-impression-box">
            <div class="thumb-icon">👆</div>
            <span>Left Thumb Impression (LTI)</span>
          </div>
        </div>
      </div>

      <div class="clause-block witness-section">
        <h4 class="clause-title"><span class="clause-tag">ATTESTATION</span> ATTESTATION BY TWO INDEPENDENT WITNESSES</h4>
        <p class="witness-intro">
          Signed, acknowledged, and declared by the above-named Testator as and for their Last Will and Testament, in the presence of us, who at their request, in their presence, and in the presence of each other, all being present at the same time, have subscribed our names as attesting witnesses. We affirm that we are of legal age (18+ years), of sound mind, and are NEITHER beneficiaries NOR spouses of beneficiaries under this Will.
        </p>
        <div class="witness-grid">
          <div class="witness-card">
            <h5 class="witness-title">WITNESS 1</h5>
            <p>Signature: ________________________________</p>
            <p>Full Name: ________________________________</p>
            <p>Father's / Spouse's Name: ___________________</p>
            <p>Permanent Address: ________________________</p>
            <p>Phone / Aadhaar / PAN: ____________________</p>
            <p>Date: ____________________________________</p>
          </div>
          <div class="witness-card">
            <h5 class="witness-title">WITNESS 2</h5>
            <p>Signature: ________________________________</p>
            <p>Full Name: ________________________________</p>
            <p>Father's / Spouse's Name: ___________________</p>
            <p>Permanent Address: ________________________</p>
            <p>Phone / Aadhaar / PAN: ____________________</p>
            <p>Date: ____________________________________</p>
          </div>
        </div>
      </div>

      <div class="draft-page-initials-box">
        <span>Page Authentication Safeguard:</span>
        <span>Testator Initial: [ ____________ ]</span>
        <span>Witness 1: [ ____________ ]</span>
        <span>Witness 2: [ ____________ ]</span>
      </div>

      <div class="paper-footer text-center mt-3">
        <small class="text-muted">SmartWill India • Formatted under the Indian Succession Act, 1925 & Hindu Succession Act, 1956</small>
      </div>
    </div>
  `;
  return html;
}

function renderTeluguDraft(p, safeFullName, fullAddress, idStr, execName, execRel, altExecName, altExecRel, assets, beneficiaries, currentDate) {
  const executionPlace = escapeHTML(p.addressCity || 'హైదరాబాద్');

  let html = `
    <div class="legal-paper-preview">
      <div class="paper-watermark">నమూనా ముసాయిదా • SMARTWILL</div>

      <div class="legal-paper-crest">
        <div class="crest-emblem">⚖️</div>
        <div class="crest-title">కడపటి ఇష్టపూర్వక మరణ శాసన పత్రము</div>
        <div class="crest-statute">భారతీయ వారసత్వ చట్టం 1925 & హిందూ వారసత్వ చట్టం 1956 కి లోబడి తయారుచేయబడినది</div>
      </div>

      <div class="paper-header text-center">
        <h2 class="doc-title">కడపటి ఇష్టపూర్వక మరణ శాసన పత్రము (LAST WILL)</h2>
        <p class="doc-subtitle">(భారతీయ వారసత్వ చట్టం 1925 ప్రకారం రూపొందించబడిన విధిబద్ధ పత్రము)</p>
      </div>

      <div class="paper-preamble">
        <p>
          నేను, <strong>${safeFullName || '____________________ (శాసనకర్త)'}</strong>${idStr ? ' [గుర్తింపు పత్రం: ' + idStr + ']' : ''},
          నివాసము: <strong>${escapeHTML(fullAddress)}</strong>,
          పుట్టిన తేది: <strong>${escapeHTML(p.dob || 'DD/MM/YYYY')}</strong>,
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
    html += `
          నా తదనంతరం నా ఈ విల్ ప్రకారం నా ఆస్తులను కేటాయించడానికి మరియు పంపిణీ చేయడానికి <strong>${execName}</strong> (${execRel || 'బంధువు / ప్రతినిధి'}) గారిని నా విల్ ఎగ్జిక్యూటర్‌గా నియమిస్తున్నాను.
    `;
    if (altExecName) {
      html += `
          ఒకవేళ సదరు ఎగ్జిక్యూటర్ ఈ బాధ్యతను నిర్వర్తించలేని పక్షంలో, <strong>${altExecName}</strong> (${altExecRel || 'బంధువు / ప్రతినిధి'}) ప్రత్యామ్నాయ ఎగ్జిక్యూటర్ (Alternate Executor) గా వ్యవహరిస్తారు.
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

      html += `
        <div class="draft-asset-item">
          <div class="draft-asset-header">
            <span>ఆస్తి #${idx + 1} [${safeType}]: ${safeDesc}</span>
            <span style="font-weight: 500; font-size: 0.8rem; color: #64748b;">${approxVal}</span>
          </div>
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
          <strong>🛡️ వారసత్వ భద్రత నిబంధన (30-రోజుల నియమం / Anti-Lapse):</strong><br>
          ఒకవేళ నా లబ్ధిదారులలో ఎవరైనా నాకంటే ముందే మరణించినచో, లేదా నా మరణం తర్వాత 30 రోజుల వరకు జీవించని పక్షంలో, వారికి కేటాయించిన వాటా వారి చట్టబద్ధమైన సంతానానికి సమానంగా (per stirpes) చెందుతుంది. సంతానం లేని పక్షంలో ఆ వాటా సజీవులైన ఇతర లబ్ధిదారులకు సమానంగా పంపిణీ కావలెను.
        </div>

        <div class="draft-subclause-box">
          <strong>🔒 మైనర్ల సంరక్షణ నిబంధన (Minority Protection Trust):</strong><br>
          ఈ విల్ ద్వారా వాటా పొందే లబ్ధిదారులలో ఎవరైనా నా మరణ సమయానికి మైనర్ (18 సంవత్సరాల లోపు వయస్సు) అయి ఉంటే, వారి వాటా వారి సహజ సంరక్షకుడు లేదా నా ఎగ్జిక్యూటర్ ద్వారా ట్రస్ట్‌గా నిర్వహించబడి, వారి విద్య, వైద్యం మరియు సంక్షేమం కొరకు మాత్రమే వినియోగించబడవలెను.
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
            <div class="thumb-icon">👆</div>
            <span>ఎడమ చేతి బొటనవేలి ముద్ర (LTI)</span>
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
      <div class="paper-watermark">नमूना ड्राफ्ट • SMARTWILL</div>

      <div class="legal-paper-crest">
        <div class="crest-emblem">⚖️</div>
        <div class="crest-title">अंतिम इच्छा पत्र / वसीयतनामा</div>
        <div class="crest-statute">भारतीय उत्तराधिकार अधिनियम 1925 एवं हिंदू उत्तराधिकार अधिनियम 1956 के अंतर्गत</div>
      </div>

      <div class="paper-header text-center">
        <h2 class="doc-title">अंतिम इच्छा पत्र / वसीयतनामा (LAST WILL)</h2>
        <p class="doc-subtitle">(भारतीय उत्तराधिकार अधिनियम 1925 के अंतर्गत तैयार विधिक प्रारूप)</p>
      </div>

      <div class="paper-preamble">
        <p>
          मैं, <strong>${safeFullName || '____________________ (वसीयतकर्ता)'}</strong>${idStr ? ' [पहचान पत्र: ' + idStr + ']' : ''},
          निवासी: <strong>${escapeHTML(fullAddress)}</strong>,
          जन्म तिथि: <strong>${escapeHTML(p.dob || 'DD/MM/YYYY')}</strong>,
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
          मैं स्पष्ट रूप से घोषित करता/करती हूँ कि इस वसीयत में वर्णित समस्त संपत्तियां मेरी व्यक्तिगत कमाई एवं निवेशों द्वारा अर्जित "स्वअर्जित संपत्तियां" (Self-Acquired Properties) हैं। इन पर किसी भी संयुक्त परिवार (HUF) अथवा पैतृक अधिकार का दावा नहीं है। अतः धारा 30 के अधीन मुझे इनके निस्तारण का पूर्ण विधिक अधिकार प्राप्त है।
        </p>
      </div>

      <div class="clause-block">
        <h4 class="clause-title"><span class="clause-tag">SECTION IV</span> निष्पादक की नियुक्ति एवं व्यापक अधिकार (POWERS OF EXECUTOR)</h4>
        <p>
  `;

  if (execName) {
    html += `
          मेरे उपरांत मेरी संपत्तियों का वितरण इस वसीयत के अनुसार कराने हेतु मैं <strong>${execName}</strong> (${execRel || 'कानूनी प्रतिनिधि'}) को अपना निष्पादक (Executor) नियुक्त करता/करती हूँ।
    `;
    if (altExecName) {
      html += `
          यदि उक्त निष्पादक कार्य करने में असमर्थ रहें, तो <strong>${altExecName}</strong> (${altExecRel || 'कानूनी प्रतिनिधि'}) वैकल्पिक निष्पादक होंगे।
      `;
    }
    html += `
          <p style="margin-top: 1rem; margin-bottom: 0.6rem; font-weight: 600;">मैं अपने निष्पादक को निम्नलिखित समस्त विधिक अधिकार प्रदान करता/करती हूँ:</p>
          <ul class="executor-powers-list">
            <li>• <strong>(क) प्रभार एवं नियंत्रण:</strong> मेरी समस्त चल एवं अचल संपत्तियों, बैंक खातों एवं लॉकरों का प्रभार प्राप्त करना;</li>
            <li>• <strong>(ख) विधिक हस्तांतरण:</strong> बैंकों, वित्तीय संस्थानों, सोसायटी एवं प्राधिकरणों के समक्ष उपस्थित होकर नामान्तरण (Mutation) एवं हस्तांतरण पूर्ण कराना;</li>
            <li>• <strong>(ग) देयताओं का भुगतान:</strong> सर्वप्रथम वैध देनदारियों, अंतिम संस्कार व्यय एवं प्रशासनिक शुल्कों का भुगतान करना;</li>
            <li>• <strong>(घ) कर-दायित्व:</strong> मेरा अंतिम आयकर रिटर्न (ITR) दाखिल कर कर-देयताएं चुकाना;</li>
            <li>• <strong>(ङ) न्यायालयीन प्रक्रिया:</strong> आवश्यक होने पर इस वसीयत का प्रोबेट (Probate) प्राप्त करने हेतु अधिवक्ताओं की सेवाएं लेना।</li>
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

      html += `
        <div class="draft-asset-item">
          <div class="draft-asset-header">
            <span>संपत्ति #${idx + 1} [${safeType}]: ${safeDesc}</span>
            <span style="font-weight: 500; font-size: 0.8rem; color: #64748b;">${approxVal}</span>
          </div>
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
          <strong>🛡️ उत्तरजीविता एवं सुरक्षित हस्तांतरण नियम (30-दिवसीय नियम / Anti-Lapse):</strong><br>
          यदि मेरे किसी नामित उत्तराधिकारी का स्वर्गवास मुझसे पूर्व हो जाता है या वे मेरे 30 दिन पश्चात तक जीवित नहीं रहते, तो उनका हिस्सा उनके विधिक वंशजों (per stirpes) को प्राप्त होगा। वंशज न होने पर शेष जीवित उत्तराधिकारियों में बराबर बांटा जाएगा।
        </div>

        <div class="draft-subclause-box">
          <strong>🔒 नाबालिग उत्तराधिकारी संरक्षण (Minority Protection Trust):</strong><br>
          यदि कोई उत्तराधिकारी मेरी मृत्यु के समय नाबालिग (18 वर्ष से कम) है, तो उनका हिस्सा उनके प्राकृतिक संरक्षक या निष्पादक द्वारा ट्रस्ट में रखा जाएगा और उनकी शिक्षा व कल्याण हेतु ही प्रयुक्त होगा।
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
            <div class="thumb-icon">👆</div>
            <span>बाएं अंगूठे का निशान (LTI)</span>
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
        <span>पृष्ठ हस्ताक्षर सुरक्षा (Page Initials):</span>
        <span>वसीयतकर्ता हस्ताक्षर: [ ____________ ]</span>
        <span>गवाह 1: [ ____________ ]</span>
        <span>गवाह 2: [ ____________ ]</span>
      </div>

      <div class="paper-footer text-center mt-3">
        <small class="text-muted">SmartWill India • भारतीय उत्तराधिकार अधिनियम 1925 के अंतर्गत तैयार विधिक प्रारूप</small>
      </div>
    </div>
  `;
  return html;
}

/**
 * function openDraftPreviewModal(preferredLang) {
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
          @media print {
            body { padding: 0; }
            @page { margin: 1.5cm; }
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
