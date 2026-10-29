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
      <div class="paper-watermark">SAMPLE DRAFT • SMARTWILL INDIA</div>

      <div class="paper-header text-center">
        <h2 class="doc-title">LAST WILL AND TESTAMENT</h2>
        <p class="doc-subtitle">(Drafted under and pursuant to the Indian Succession Act, 1925)</p>
      </div>

      <div class="paper-preamble">
        <p>
          I, <strong>${(safeFullName || 'TESTATOR').toUpperCase()}</strong>${idStr ? ' [Identity Document: ' + idStr + ']' : ''},
          residing at <strong>${escapeHTML(fullAddress)}</strong>,
          born on <strong>${escapeHTML(p.dob || 'DD/MM/YYYY')}</strong>,
          professing <strong>${escapeHTML(p.religion || 'Hindu')}</strong> faith,
          being of sound disposing mind, memory, and understanding, having read over (or had read over and explained to me in a language I fully understand) and approved the contents hereof, and acting of my own free choice, volition, and without any coercion, undue influence, fraud, or misrepresentation from any person whatsoever,
          do hereby make, publish, and declare this writing to be my <strong>Last Will and Testament</strong>, executed at <strong>${executionPlace}</strong>, India.
        </p>
      </div>

      <div class="clause-block">
        <h4 class="clause-title">1. REVOCATION OF ALL FORMER WILLS & CODICILS</h4>
        <p>
          I hereby revoke, cancel, and annul all prior Wills, Codicils, Testaments, and testamentary dispositions of every nature whatsoever made by me at any time heretofore,
          and declare this to be my sole, exclusive, and operative Last Will and Testament.
        </p>
      </div>

      <div class="clause-block">
        <h4 class="clause-title">2. DECLARATION OF SOUND HEALTH AND FREE WILL</h4>
        <p>
          I hereby declare that I am executing this Will in good physical health and sound mental disposition. I fully comprehend and appreciate the nature, extent, and value of all my movable and immovable properties, and the natural claims of those persons who are the objects of my affection and bounty.
        </p>
      </div>

      <div class="clause-block">
        <h4 class="clause-title">3. DECLARATION OF ABSOLUTE SELF-ACQUIRED PROPERTIES & TITLE</h4>
        <p>
          I hereby declare and affirm that all properties, assets, bank accounts, investments, and estate described in this Will are my absolute, self-acquired properties, acquired out of my own hard-earned funds, personal earnings, and investments (or inherited by me with absolute, alienable ownership rights). No other person, coparcener, or relative has any ancestral, joint family, or Hindu Undivided Family (HUF) right, title, or interest in any of these properties, and I possess the absolute, unfettered right to bequeath the same under Section 30 of the Hindu Succession Act, 1956 and the Indian Succession Act, 1925.
        </p>
      </div>

      <div class="clause-block">
        <h4 class="clause-title">4. APPOINTMENT OF WILL EXECUTOR & OPERATIONAL POWERS</h4>
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
          <br><br>
          I expressly confer upon my Executor full power and authority to:
          <br>• (a) Take possession, custody, and charge of all my movable and immovable assets, title documents, and financial records;
          <br>• (b) Deal with all Banks, Depository Participants, Asset Management Companies, Registrars, Housing Societies, and Municipal or Revenue Authorities, and execute all necessary discharges and transfer documents;
          <br>• (c) Settle all my legitimate debts, testamentary charges, taxes, and funeral expenses out of my estate prior to distributing any bequests to my beneficiaries;
          <br>• (d) Apply for Probate or Letters of Administration from a court of competent jurisdiction if deemed necessary or requested by any financial institution, and engage advocates or chartered accountants for the same;
          <br>• (e) Be reimbursed from my estate for all legitimate and reasonable out-of-pocket expenses incurred in the proper administration of this Will.
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
        <h4 class="clause-title">5. SCHEDULE OF BEQUEST OF ASSETS & BENEFICIARY ALLOCATIONS</h4>
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
            <strong>Asset #${idx + 1} [${safeType}]:</strong> ${safeDesc}${approxVal}
          </div>
          <ul class="draft-alloc-list">
      `;

      const allocs = asset.allocations || [];
      if (allocs.length === 0) {
        html += `<li>• 100% share bequeathed to designated legal heirs in equal parts.</li>`;
      } else {
        allocs.forEach(alloc => {
          const ben = beneficiaries.find(b => b.id === alloc.beneficiaryId);
          const benName = ben ? `${escapeHTML(ben.name)} (${escapeHTML(ben.relation || 'Beneficiary')})` : 'Beneficiary';
          const benId = (ben && ben.idType && ben.idDigits) ? ` [${escapeHTML(ben.idType)}: Ending in XXXX-${escapeHTML(ben.idDigits)}]` : '';
          html += `<li>• <strong>${alloc.percentage}% Share</strong> bequeathed absolutely and forever to <strong>${benName}</strong>${benId}</li>`;
        });
      }

      html += `
          </ul>
        </div>
      `;
    });

    html += `
        <div class="draft-subclause mt-2 p-2" style="background: rgba(0,0,0,0.02); border-left: 3px solid #dfb76c; font-size: 0.88rem; line-height: 1.5;">
          <strong>Survivorship & Anti-Lapse Provision (Sections 105 & 109, Indian Succession Act, 1925):</strong>
          In the event that any of my designated beneficiaries predeceases me, the bequest intended for such deceased beneficiary shall devolve upon their lawful surviving lineal descendants (children) in equal shares (<em>per stirpes</em>). If such deceased beneficiary leaves no surviving lineal descendants, their share shall accrue and be divided equally among my remaining surviving beneficiaries named herein.
        </div>
    `;
  }

  html += `
      </div>

      <div class="clause-block">
        <h4 class="clause-title">6. NOMINATION OVERRIDE & BENEFICIAL OWNERSHIP CLAUSE</h4>
        <p>
          I expressly declare and clarify that any nominee registered by me in respect of any bank account, Fixed Deposit, locker, Demat account, mutual fund holding, provident fund, gratuity, or insurance policy is appointed solely as a procedural custodian to facilitate receipt of funds upon my demise. As settled under Indian law (including decisions of the Hon'ble Supreme Court of India in <em>Sarbati Devi</em> and <em>Shakti Yezdani</em>), any nominee who receives such funds shall hold the same strictly as a trustee for the benefit of the legatee(s) named in this Will, and the bequests in this Will shall strictly supersede and prevail over all nominations.
        </p>
      </div>

      <div class="clause-block">
        <h4 class="clause-title">7. RESIDUARY ESTATE CLAUSE</h4>
        <p>
          ${(() => {
            const bens = beneficiaries.filter(b => b && b.name);
            if (bens.length === 1) {
              const b = bens[0];
              return `Any other real, personal, movable, or immovable property, bank accounts, investments, jewellery, digital assets, vehicles, insurance proceeds, or claims whatsoever belonging to me at the time of my death not specifically mentioned herein shall devolve entirely and absolutely upon my sole designated beneficiary, <strong>${escapeHTML(b.name)}</strong> (${escapeHTML(b.relation || 'Beneficiary')}). In the event that my sole beneficiary predeceases me, the residuary estate shall devolve upon their surviving lineal descendants in equal shares.`;
            } else if (bens.length > 1) {
              const benList = bens.map(b => `<strong>${escapeHTML(b.name)}</strong> (${escapeHTML(b.relation || '')})`).join(', ');
              return `Any other real, personal, movable, or immovable property, bank accounts, investments, jewellery, digital assets, vehicles, insurance proceeds, or claims whatsoever belonging to me at the time of my death not specifically mentioned herein shall be divided equally among my designated beneficiaries: ${benList}. In the event that any beneficiary predeceases me, their share shall pass to their surviving children, or accrue to the remaining surviving beneficiaries.`;
            }
            return `Any other real, personal, movable, or immovable property, bank accounts, investments, jewellery, digital assets, vehicles, insurance proceeds, or claims whatsoever belonging to me at the time of my death not specifically mentioned herein shall be divided equally among my designated beneficiaries surviving me, or in their absence, to my nearest surviving legal heirs under law.`;
          })()}
        </p>
      </div>

      <div class="clause-block">
        <h4 class="clause-title">8. EXCLUSION OF UNINTENDED HEIRS & DELIBERATE INTENTION</h4>
        <p>
          I declare that I have made adequate and loving provision for the objects of my affection. Except for the beneficiaries specifically named herein, I have intentionally not bequeathed any part of my estate to any other relative, heir, or claimant. This is my deliberate and conscious testamentary disposition.
        </p>
      </div>

      <div class="clause-block signature-section">
        <h4 class="clause-title">IN WITNESS WHEREOF</h4>
        <p>
          I, the said <strong>${safeFullName || 'Testator'}</strong>, having understood and approved this Will, have hereunto set my hand and affixed my signature to this my Last Will and Testament on this <strong>${currentDate}</strong> at <strong>${executionPlace}</strong>, India.
        </p>
        <div class="testator-sign-box">
          <div class="sign-line"></div>
          <p class="sign-label"><strong>Signature / Thumb Impression of Testator</strong></p>
          <p class="sign-name">Name: ${safeFullName || 'Testator'}</p>
        </div>
      </div>

      <div class="clause-block witness-section">
        <h4 class="clause-title">ATTESTATION BY TWO INDEPENDENT WITNESSES</h4>
        <p class="witness-intro">
          Signed, acknowledged, and declared by the above-named Testator as and for their Last Will and Testament, in the presence of us, both present at the same time, who at their request, in their presence, and in the presence of each other, have hereunto subscribed our names as attesting witnesses. We verify and solemnly affirm that we are of legal age (18+ years), of sound disposing mind, and are NOT beneficiaries nor spouses of beneficiaries under this Will (satisfying the requirements of Section 63 and Section 67 of the Indian Succession Act, 1925).
        </p>
        <div class="witness-grid">
          <div class="witness-card">
            <h5 class="witness-title">WITNESS 1</h5>
            <p>Signature: ________________________________</p>
            <p>Full Name: ________________________________</p>
            <p>Father's / Spouse's Name: ___________________</p>
            <p>Permanent Address: ________________________</p>
            <p>Phone / Aadhaar / PAN: ____________________</p>
          </div>
          <div class="witness-card">
            <h5 class="witness-title">WITNESS 2</h5>
            <p>Signature: ________________________________</p>
            <p>Full Name: ________________________________</p>
            <p>Father's / Spouse's Name: ___________________</p>
            <p>Permanent Address: ________________________</p>
            <p>Phone / Aadhaar / PAN: ____________________</p>
          </div>
        </div>
      </div>

      <div class="draft-page-initials-box" style="margin-top: 20px; padding: 10px 14px; background: rgba(0,0,0,0.03); border: 1px dashed #cbd5e1; border-radius: 6px; font-family: monospace; font-size: 0.78rem; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
        <span>Page Initial Safeguard:</span>
        <span>Testator Initial: [ ____________ ]</span>
        <span>Witness 1: [ ____________ ]</span>
        <span>Witness 2: [ ____________ ]</span>
      </div>

      <div class="paper-footer text-center mt-3">
        <small class="text-muted">SmartWill India Legal Documentation Service • Aligned with Sections 59, 63, 67, 105 & 109 of the Indian Succession Act, 1925</small>
      </div>
    </div>
  `;
  return html;
}

/**
 * 🇮🇳 Telugu Legal Draft Template (భారతీయ వారసత్వ చట్టం 1925)
 */
function renderTeluguDraft(p, safeFullName, fullAddress, idStr, execName, execRel, altExecName, altExecRel, assets, beneficiaries, currentDate) {
  const executionPlace = escapeHTML(p.addressCity || 'హైదరాబాద్');

  let html = `
    <div class="legal-paper-preview">
      <div class="paper-watermark">నమూనా ముసాయిదా • SMARTWILL INDIA</div>

      <div class="paper-header text-center">
        <h2 class="doc-title">కడపటి ఇష్టపూర్వక మరణ శాసన పత్రము (LAST WILL)</h2>
        <p class="doc-subtitle">(భారతీయ వారసత్వ చట్టం 1925 ప్రకారం రూపొందించబడినది)</p>
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
        <h4 class="clause-title">1. పూర్వ విల్స్ రద్దు నిబంధన (REVOCATION OF FORMER WILLS)</h4>
        <p>
          ఈ తేదికి ముందు నేను వ్రాసిన లేదా తయారు చేసిన అన్ని రకాల పూర్వ విల్స్, దస్తావేజులు మరియు నిబంధనలను దీని ద్వారా పూర్తిగా రద్దు చేస్తున్నాను. ఇదియే నా ఏకైక మరియు తుది చెల్లుబాటు అయ్యే విల్ పత్రము.
        </p>
      </div>

      <div class="clause-block">
        <h4 class="clause-title">2. సంపూర్ణ ఆరోగ్య స్పృహ ప్రకటన (SOUND HEALTH & MIND DECLARATION)</h4>
        <p>
          నేను చక్కటి శారీరక మరియు మానసిక స్థితిలో, సంపూర్ణ వివేచనతో నా స్థిర, చర ఆస్తుల విలువను మరియు నాపై ఆధారపడిన కుటుంబ సభ్యుల సంక్షేమాన్ని గుర్తించి, నా స్వంత ఆలోచనతో ఈ విల్ రాయడం జరిగినది.
        </p>
      </div>

      <div class="clause-block">
        <h4 class="clause-title">3. స్వార్జిత ఆస్తుల ప్రకటన (DECLARATION OF SELF-ACQUIRED PROPERTIES)</h4>
        <p>
          ఈ విల్‌లో పేర్కొన్న నా స్థిర మరియు చర ఆస్తులన్నీ నా స్వంత సంపాదనతో, కష్టార్జితంతో మరియు పెట్టుబడులతో స్వయంగా సంపాదించిన "స్వార్జిత ఆస్తులు" (Self-Acquired Properties) అని ఇందుమూలముగా ప్రకటిస్తున్నాను. వీటిపై ఎటువంటి ఉమ్మడి కుటుంబపు (HUF) లేదా పూర్వీకుల (Ancestral/Coparcenary) హక్కులు ఎవరికీ లేవు. కావున భారతీయ వారసత్వ చట్టం మరియు హిందూ వారసత్వ చట్టం సెక్షన్ 30 ప్రకారం ఈ ఆస్తులను నా ఇష్టానుసారం పంచడానికి నాకు సంపూర్ణ చట్టపరమైన అధికారం కలదు.
        </p>
      </div>

      <div class="clause-block">
        <h4 class="clause-title">4. విల్ ఎగ్జిక్యూటర్ నియామకం & అధికారాలు (APPOINTMENT & POWERS OF EXECUTOR)</h4>
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
          <br><br>
          నా ఎగ్జిక్యూటర్‌కు నేను క్రింది సంపూర్ణ అధికారాలను కల్పిస్తున్నాను:
          <br>• (ఎ) నా స్థిర మరియు చర ఆస్తులు, దస్తావేజులు మరియు బ్యాంక్ ఖాతాల నిర్వహణ బాధ్యత తీసుకోవడం;
          <br>• (బి) బ్యాంకులు, డీమ్యాట్ సంస్థలు, సబ్-రిజిస్ట్రార్ కార్యాలయాలు మరియు ప్రభుత్వ సంస్థలతో లావాదేవీలు నిర్వహించి ఆస్తుల బదిలీలు పూర్తి చేయడం;
          <br>• (సి) నా న్యాయబద్ధమైన అప్పులు, అంత్యక్రియల ఖర్చులు మరియు చట్టపరమైన బాధ్యతలను ముందుగా చెల్లించి, ఆపై మిగిలిన ఆస్తులను లబ్ధిదారులకు పంచడం;
          <br>• (డి) ఏదైనా సంస్థ కోరినచో కోర్టు ద్వారా ప్రొబేట్ (Probate) లేదా లెటర్స్ ఆఫ్ అడ్మినిస్ట్రేషన్ పొందుటకు న్యాయవాదులను నియమించడం.
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
        <h4 class="clause-title">5. ఆస్తుల కేటాయింపు పట్టిక (BEQUEST OF ASSETS SCHEDULE)</h4>
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
            <strong>ఆస్తి #${idx + 1} [${safeType}]:</strong> ${safeDesc}${approxVal}
          </div>
          <ul class="draft-alloc-list">
      `;

      const allocs = asset.allocations || [];
      if (allocs.length === 0) {
        html += `<li>• లబ్ధిదారులందరికీ సమాన భాగాలుగా (100%) చెందుతుంది.</li>`;
      } else {
        allocs.forEach(alloc => {
          const ben = beneficiaries.find(b => b.id === alloc.beneficiaryId);
          const benName = ben ? `${escapeHTML(ben.name)} (${escapeHTML(ben.relation || 'లబ్ధిదారుడు')})` : 'లబ్ధిదారుడు';
          const benId = (ben && ben.idType && ben.idDigits) ? ` [${escapeHTML(ben.idType)}: XXXX-${escapeHTML(ben.idDigits)}]` : '';
          html += `<li>• <strong>${alloc.percentage}% వాటా</strong> సంపూర్ణ హక్కులతో <strong>${benName}</strong>${benId} కి దక్కవలెను.</li>`;
        });
      }

      html += `
          </ul>
        </div>
      `;
    });

    html += `
        <div class="draft-subclause mt-2 p-2" style="background: rgba(0,0,0,0.02); border-left: 3px solid #dfb76c; font-size: 0.88rem; line-height: 1.5;">
          <strong>వారసత్వ భద్రత నిబంధన (Anti-Lapse / Survivorship - సెక్షన్లు 105 & 109):</strong>
          ఒకవేళ నా లబ్ధిదారులలో ఎవరైనా నాకంటే ముందే మరణించినచో, వారికి కేటాయించిన వాటా వారి చట్టబద్ధమైన సంతానానికి సమానంగా చెందుతుంది. సంతానం లేని పక్షంలో ఆ వాటా సజీవులైన ఇతర లబ్ధిదారులకు సమానంగా పంపిణీ కావలెను.
        </div>
    `;
  }

  html += `
      </div>

      <div class="clause-block">
        <h4 class="clause-title">6. నామినేషన్ల కంటే విల్ ప్రాధాన్యత నిబంధన (NOMINATION OVERRIDE CLAUSE)</h4>
        <p>
          నా బ్యాంక్ ఖాతాలు, ఫిక్స్‌డ్ డిపాజిట్లు, డీమ్యాట్ అకౌంట్లు లేదా బీమా పాలసీలలో నమోదైన 'నామినీ' (Nominee) కేవలం ప్రక్రియ సౌలభ్యం కొరకు మాత్రమేనని స్పష్టం చేస్తున్నాను. భారత సర్వోన్నత న్యాయస్థానం (సుప్రీం కోర్టు) తీర్పుల ప్రకారం, నామినీ కేవలం ధర్మకర్త (Trustee) మాత్రమే. ఈ విల్‌లో పేర్కొన్న లబ్ధిదారుల హక్కులే అత్యున్నతమైనవి మరియు అన్ని నామినేషన్లను అధిగమిస్తాయి.
        </p>
      </div>

      <div class="clause-block">
        <h4 class="clause-title">7. మిగిలిన ఆస్తుల నిబంధన (RESIDUARY ESTATE)</h4>
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
        <h4 class="clause-title">8. ఇతర వ్యక్తుల మినహాయింపు (EXCLUSION OF UNINTENDED HEIRS)</h4>
        <p>
          నేను నా ప్రియమైన కుటుంబ సభ్యులకు తగిన ఆస్తి ఏర్పాటు చేశాను. ఈ విల్‌లో ప్రత్యేకంగా పేర్కొనబడిన లబ్ధిదారులు మినహా, ఇతర ఏ బంధువు లేదా మూడవ వ్యక్తికి నా ఆస్తిపై ఎటువంటి హక్కు గానీ, వాటా గానీ ఉండకూడదని స్పష్టం చేస్తున్నాను.
        </p>
      </div>

      <div class="clause-block signature-section">
        <h4 class="clause-title">శాసనకర్త సంతకం (SIGNATURE OF TESTATOR)</h4>
        <p>
          పై తెలిపిన వివరాలన్నీ సత్యమైనవని ధృవీకరిస్తూ ఈ తేది <strong>${currentDate}</strong> న <strong>${executionPlace}</strong> లో శాసనకర్తగా నేను నా సంతకం చేస్తున్నాను.
        </p>
        <div class="testator-sign-box">
          <div class="sign-line"></div>
          <p class="sign-label"><strong>శాసనకర్త సంతకం / వేలిముద్ర</strong></p>
          <p class="sign-name">పేరు: ${safeFullName || 'శాసనకర్త'}</p>
        </div>
      </div>

      <div class="clause-block witness-section">
        <h4 class="clause-title">ఇద్దరు సాక్షుల సంతకాలు (ATTESTATION BY TWO INDEPENDENT WITNESSES)</h4>
        <p class="witness-intro">
          శాసనకర్త తమ స్వచ్ఛంద నిర్ణయంతో, స్వస్థ చిత్తంతో మా సమక్షంలో సంతకం చేయగా, వారి కోరిక మేరకు, వారి సమక్షంలో మరియు ఒకరి సమక్షంలో మరొకరం సాక్షులుగా సంతకాలు చేస్తున్నాము. మేము 18 సంవత్సరాలు నిండిన స్వతంత్ర సాక్షులమని మరియు ఈ విల్‌లో ఎటువంటి ఆస్తి లబ్ధి పొందే వారము లేదా లబ్ధిదారుల జీవిత భాగస్వాములం కాదని ధృవీకరిస్తున్నాము (భారతీయ వారసత్వ చట్టం సెక్షన్లు 63 మరియు 67 ప్రకారం).
        </p>
        <div class="witness-grid">
          <div class="witness-card">
            <h5 class="witness-title">సాక్షి 1 (WITNESS 1)</h5>
            <p>సంతకం: ________________________________</p>
            <p>పూర్తి పేరు: _______________________________</p>
            <p>తండ్రి / భర్త పేరు: ___________________________</p>
            <p>పూర్తి చిరునామా: ____________________________</p>
            <p>ఫోన్ / ఆధార్ / పాన్: ________________________</p>
          </div>
          <div class="witness-card">
            <h5 class="witness-title">సాక్షి 2 (WITNESS 2)</h5>
            <p>సంతకం: ________________________________</p>
            <p>పూర్తి పేరు: _______________________________</p>
            <p>తండ్రి / భర్త పేరు: ___________________________</p>
            <p>పూర్తి చిరునామా: ____________________________</p>
            <p>ఫోన్ / ఆధార్ / పాన్: ________________________</p>
          </div>
        </div>
      </div>

      <div class="draft-page-initials-box" style="margin-top: 20px; padding: 10px 14px; background: rgba(0,0,0,0.03); border: 1px dashed #cbd5e1; border-radius: 6px; font-family: monospace; font-size: 0.78rem; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
        <span>పేజీల సంతకాల భద్రత:</span>
        <span>శాసనకర్త సంతకం: [ ____________ ]</span>
        <span>సాక్షి 1: [ ____________ ]</span>
        <span>సాక్షి 2: [ ____________ ]</span>
      </div>

      <div class="paper-footer text-center mt-3">
        <small class="text-muted">SmartWill India • భారతీయ వారసత్వ చట్టం 1925 (సెక్షన్లు 59, 63, 67, 105, 109) కి లోబడి రూపొందించబడిన అధికారిక పత్రం</small>
      </div>
    </div>
  `;
  return html;
}

/**
 * 🇮🇳 Hindi Legal Draft Template (भारतीय उत्तराधिकार अधिनियम 1925)
 */
function renderHindiDraft(p, safeFullName, fullAddress, idStr, execName, execRel, altExecName, altExecRel, assets, beneficiaries, currentDate) {
  const executionPlace = escapeHTML(p.addressCity || 'हैदराबाद');

  let html = `
    <div class="legal-paper-preview">
      <div class="paper-watermark">नमूना ड्राफ्ट • SMARTWILL INDIA</div>

      <div class="paper-header text-center">
        <h2 class="doc-title">अंतिम इच्छा पत्र / वसीयतनामा (LAST WILL & TESTAMENT)</h2>
        <p class="doc-subtitle">(भारतीय उत्तराधिकार अधिनियम 1925 के अंतर्गत तैयार विधिक प्रारूप)</p>
      </div>

      <div class="paper-preamble">
        <p>
          मैं, <strong>${safeFullName || '____________________ (वसीयतकर्ता)'}</strong>${idStr ? ' [पहचान पत्र: ' + idStr + ']' : ''},
          निवासी: <strong>${escapeHTML(fullAddress)}</strong>,
          जन्म तिथि: <strong>${escapeHTML(p.dob || 'DD/MM/YYYY')}</strong>,
          धर्म: <strong>${escapeHTML(p.religion || 'हिंदू')}</strong>,
          स्थान: <strong>${executionPlace}</strong>,
          पूर्ण स्वस्थ चित्त, स्मरण शक्ति एवं स्वेच्छा से, बिना किसी दबाव, कपट, प्रलोभन अथवा अनुचित प्रभाव के, इस दस्तावेज़ की सभी शर्तों को भली-भांति पढ़कर व समझकर (अथवा अपनी समझ की भाषा में समझकर), इसे अपनी <strong>अंतिम वसीयत (LAST WILL & TESTAMENT)</strong> के रूप में निष्पादित एवं घोषित करता/करती हूँ।
        </p>
      </div>

      <div class="clause-block">
        <h4 class="clause-title">1. पूर्व वसीयतों का निरस्तीकरण (REVOCATION OF FORMER WILLS)</h4>
        <p>
          मैं इस तिथि से पूर्व अपने द्वारा निष्पादित की गई सभी पूर्व वसीयतों, इच्छा पत्रों, कोडीसिल (Codicils) एवं संबंधित प्रपत्रों को इसके द्वारा पूर्णतः निरस्त करता/करती हूँ तथा इसे ही अपनी एकमात्र वैध वसीयत घोषित करता/करती हूँ।
        </p>
      </div>

      <div class="clause-block">
        <h4 class="clause-title">2. स्वस्थ चित्त एवं स्वेच्छा की घोषणा (SOUND DISPOSING MIND DECLARATION)</h4>
        <p>
          मैं यह घोषित करता/करती हूँ कि मैं शारीरिक एवं मानसिक रूप से पूर्णतः स्वस्थ हूँ। मैं अपनी संपत्तियों की प्रकृति व मूल्य और अपने आश्रित उत्तराधिकारियों के भविष्य को पूर्णतः समझते हुए स्वेच्छा से यह वसीयत निष्पादित कर रहा/रही हूँ।
        </p>
      </div>

      <div class="clause-block">
        <h4 class="clause-title">3. स्वअर्जित संपत्ति की घोषणा (DECLARATION OF ABSOLUTE SELF-ACQUIRED PROPERTY)</h4>
        <p>
          मैं स्पष्ट रूप से घोषित करता/करती हूँ कि इस वसीयत में वर्णित समस्त चल एवं अचल संपत्तियां मेरी अपनी कमाई, व्यक्तिगत संसाधनों एवं निवेशों द्वारा अर्जित की गई "स्वअर्जित संपत्तियां" (Self-Acquired Properties) हैं। इन पर किसी भी संयुक्त हिंदू परिवार (HUF) अथवा पैतृक अधिकार (Ancestral / Coparcenary Claim) का कोई प्रभाव नहीं है। अतः हिंदू उत्तराधिकार अधिनियम 1956 की धारा 30 एवं भारतीय उत्तराधिकार अधिनियम 1925 के तहत मुझे अपनी इच्छानुसार इनका निस्तारण करने का पूर्ण विधिक अधिकार प्राप्त है।
        </p>
      </div>

      <div class="clause-block">
        <h4 class="clause-title">4. निष्पादक की नियुक्ति एवं व्यापक अधिकार (APPOINTMENT & POWERS OF EXECUTOR)</h4>
        <p>
  `;

  if (execName) {
    html += `
          मेरे उपरांत मेरी संपत्तियों का वितरण इस वसीयत के अनुसार कराने हेतु मैं <strong>${execName}</strong> (${execRel || 'कानूनी प्रतिनिधि'}) को अपना निष्पादक (Executor) नियुक्त करता/करती हूँ।
    `;
    if (altExecName) {
      html += `
          यदि उक्त निष्पादक कार्य करने में असमर्थ रहें, तो <strong>${altExecName}</strong> (${altExecRel || 'कानूनी प्रतिनिधि'}) वैकल्पिक निष्पादक (Alternate Executor) के रूप में कार्य करेंगे।
      `;
    }
    html += `
          <br><br>
          मैं अपने निष्पादक को निम्नलिखित समस्त विधिक अधिकार प्रदान करता/करती हूँ:
          <br>• (क) मेरी चल एवं अचल संपत्तियों, बैंक खातों, जमा राशियों एवं लॉकरों का प्रभार प्राप्त करना;
          <br>• (ख) बैंकों, वित्तीय संस्थानों, कंपनियों, सोसायटी, सब-रजिस्ट्रार एवं सरकारी प्राधिकरणों के समक्ष उपस्थित होकर संपत्तियों का नामान्तरण (Mutation) एवं हस्तांतरण पूर्ण कराना;
          <br>• (ग) सर्वप्रथम मेरी वैध देनदारियों, अंतिम संस्कार व्यय एवं प्रशासनिक शुल्कों का भुगतान करना, तत्पश्चात अवशिष्ट संपत्तियों का वितरण करना;
          <br>• (घ) आवश्यकता पड़ने पर किसी भी प्राधिकरण के समक्ष इस वसीयत का प्रोबेट (Probate) अथवा लेटर्स ऑफ एडमिनिस्ट्रेशन प्राप्त करने हेतु अधिवक्ताओं की सेवाएं लेना।
    `;
  } else {
    html += `
          भारतीय उत्तराधिकार अधिनियम 1925 के प्रावधानों के तहत, मैंने कोई निजी निष्पादक नियुक्त नहीं किया है। मेरी संपत्ति का प्रबंधन मेरे उत्तराधिकारियों द्वारा आपसी सहमति से या सक्षम न्यायालय द्वारा नियुक्त प्रशासक के माध्यम से किया जाएगा।
    `;
  }

  html += `
        </p>
      </div>

      <div class="clause-block">
        <h4 class="clause-title">5. संपत्ति आवंटन अनुसूची एवं उत्तरजीविता नियम (BEQUEST OF ASSETS & ANTI-LAPSE PROVISION)</h4>
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
            <strong>संपत्ति #${idx + 1} [${safeType}]:</strong> ${safeDesc}${approxVal}
          </div>
          <ul class="draft-alloc-list">
      `;

      const allocs = asset.allocations || [];
      if (allocs.length === 0) {
        html += `<li>• 100% हिस्सा सभी उत्तराधिकारियों में बराबर बंटेगा।</li>`;
      } else {
        allocs.forEach(alloc => {
          const ben = beneficiaries.find(b => b.id === alloc.beneficiaryId);
          const benName = ben ? `${escapeHTML(ben.name)} (${escapeHTML(ben.relation || 'उत्तराधिकारी')})` : 'उत्तराधिकारी';
          const benId = (ben && ben.idType && ben.idDigits) ? ` [${escapeHTML(ben.idType)}: XXXX-${escapeHTML(ben.idDigits)}]` : '';
          html += `<li>• <strong>${alloc.percentage}% हिस्सा</strong> पूर्ण विधिक स्वामित्व के साथ <strong>${benName}</strong>${benId} को दिया जाता है।</li>`;
        });
      }

      html += `
          </ul>
        </div>
      `;
    });

    html += `
        <div class="draft-subclause mt-2 p-2" style="background: rgba(0,0,0,0.02); border-left: 3px solid #dfb76c; font-size: 0.88rem; line-height: 1.5;">
          <strong>उत्तरजीविता एवं सुरक्षित हस्तांतरण नियम (Anti-Lapse / Survivorship - धारा 105 एवं 109):</strong>
          यदि मेरे किसी नामित उत्तराधिकारी का स्वर्गवास मुझसे पूर्व हो जाता है, तो उनका निर्धारित हिस्सा उनके विधिक वंशजों (Lineal Descendants) को समान रूप से प्राप्त होगा। वंशज न होने की स्थिति में, वह हिस्सा शेष जीवित उत्तराधिकारियों में उनके मूल अनुपात के अनुसार विभाजित किया जाएगा।
        </div>
    `;
  }

  html += `
      </div>

      <div class="clause-block">
        <h4 class="clause-title">6. नामांकन पर वसीयत की सर्वोच्चता (NOMINATION OVERRIDE CLAUSE)</h4>
        <p>
          मैं यह स्पष्ट करता/करती हूँ कि मेरे किसी भी बैंक खाते, सावधि जमा (FDs), डीमैट खाते, म्यूचुअल फंड अथवा जीवन बीमा पॉलिसी में उल्लिखित कोई भी 'नामांकित व्यक्ति' (Nominee) केवल प्रशासनिक सुविधा हेतु धर्ता (Trustee) मात्र है। भारत के सर्वोच्च न्यायालय के स्थापित विधि-सिद्धांतों (सरबती देवी एवं शक्ति यजदानी मामले) के अनुसार, इस वसीयत में नामित उत्तराधिकारियों के विधिक अधिकार किसी भी पूर्व नामांकन से ऊपर व बाध्यकारी होंगे।
        </p>
      </div>

      <div class="clause-block">
        <h4 class="clause-title">7. अवशिष्ट संपत्ति नियम (RESIDUARY ESTATE CLAUSE)</h4>
        <p>
          ${(() => {
            const bens = beneficiaries.filter(b => b && b.name);
            if (bens.length === 1) {
              const b = bens[0];
              return `इस वसीयत में विशेष रूप से उल्लेख न की गई मेरी अन्य कोई भी वर्तमान अथवा भविष्य की चल या अचल संपत्ति, बैंक खाते, अप्रत्याशित राशियां या अधिकार पूर्ण रूप से मेरे एकमात्र उत्तराधिकारी <strong>${escapeHTML(b.name)}</strong> (${escapeHTML(b.relation || 'उत्तराधिकारी')}) को प्राप्त होंगे।`;
            } else if (bens.length > 1) {
              const benList = bens.map(b => `<strong>${escapeHTML(b.name)}</strong> (${escapeHTML(b.relation || '')})`).join(', ');
              return `इस वसीयत में विशेष रूप से उल्लेख न की गई मेरी अन्य समस्त वर्तमान अथवा भविष्य की संपत्तियां मेरे नामित उत्तराधिकारियों: ${benList} में समान अनुपात में वितरित की जाएंगी।`;
            }
            return `मेरी अन्य कोई भी चल या अचल संपत्ति, बैंक खाते या अधिकार जिनका उल्लेख इस वसीयत में नहीं हुआ है, वे मेरे सभी जीवित उत्तराधिकारियों में समान रूप से बांटी जाएंगी।`;
          })()}
        </p>
      </div>

      <div class="clause-block">
        <h4 class="clause-title">8. अन्य उत्तराधिकारियों का विवर्जन (EXCLUSION OF UNINTENDED HEIRS)</h4>
        <p>
          मैंने अपनी समस्त संपत्तियों का वितरण अपने प्रिय परिजनों के कल्याण हेतु सोच-समझकर किया है। इस वसीयत में नामित उत्तराधिकारियों के अतिरिक्त, मेरे किसी अन्य रिश्तेदार अथवा तृतीय पक्ष का मेरी संपत्तियों पर कोई अधिकार अथवा दावा मान्य नहीं होगा।
        </p>
      </div>

      <div class="clause-block signature-section">
        <h4 class="clause-title">वसीयतकर्ता के हस्ताक्षर (SIGNATURE OF TESTATOR)</h4>
        <p>
          इसके साक्ष्य स्वरूप, मैंने आज दिनांक <strong>${currentDate}</strong> को <strong>${executionPlace}</strong> में अपनी पूर्ण सहमति, स्वस्थ चित्त एवं स्वेच्छा से इस वसीयत पर अपने हस्ताक्षर किए हैं।
        </p>
        <div class="testator-sign-box">
          <div class="sign-line"></div>
          <p class="sign-label"><strong>वसीयतकर्ता के हस्ताक्षर / अंगूठे का निशान</strong></p>
          <p class="sign-name">नाम: ${safeFullName || 'वसीयतकर्ता'}</p>
        </div>
      </div>

      <div class="clause-block witness-section">
        <h4 class="clause-title">दो स्वतंत्र गवाहों द्वारा सत्यापन (ATTESTATION BY TWO INDEPENDENT WITNESSES)</h4>
        <p class="witness-intro">
          वसीयतकर्ता ने हमारे समक्ष इस वसीयत पर हस्ताक्षर किए और हमने उनके अनुरोध पर, उनकी उपस्थिति में तथा एक-दूसरे की उपस्थिति में स्वतंत्र गवाह के रूप में हस्ताक्षर किए हैं। हम पुष्टि करते हैं कि हमारी आयु 18 वर्ष से अधिक है तथा हम इस वसीयत में न तो लाभार्थी हैं और न ही किसी लाभार्थी के जीवनसाथी हैं (भारतीय उत्तराधिकार अधिनियम 1925 की धारा 63 एवं 67 के अनुरूप)।
        </p>
        <div class="witness-grid">
          <div class="witness-card">
            <h5 class="witness-title">गवाह 1 (WITNESS 1)</h5>
            <p>हस्ताक्षर: ________________________________</p>
            <p>पूरा नाम: _______________________________</p>
            <p>पिता / पति का नाम: ________________________</p>
            <p>स्थाई पता: _______________________________</p>
            <p>फोन / आधार / पैन: ________________________</p>
          </div>
          <div class="witness-card">
            <h5 class="witness-title">गवाह 2 (WITNESS 2)</h5>
            <p>हस्ताक्षर: ________________________________</p>
            <p>पूरा नाम: _______________________________</p>
            <p>पिता / पति का नाम: ________________________</p>
            <p>स्थाई पता: _______________________________</p>
            <p>फोन / आधार / पैन: ________________________</p>
          </div>
        </div>
      </div>

      <div class="draft-page-initials-box" style="margin-top: 20px; padding: 10px 14px; background: rgba(0,0,0,0.03); border: 1px dashed #cbd5e1; border-radius: 6px; font-family: monospace; font-size: 0.78rem; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
        <span>पृष्ठ हस्ताक्षर सुरक्षा (Page Initials):</span>
        <span>वसीयतकर्ता हस्ताक्षर: [ ____________ ]</span>
        <span>गवाह 1: [ ____________ ]</span>
        <span>गवाह 2: [ ____________ ]</span>
      </div>

      <div class="paper-footer text-center mt-3">
        <small class="text-muted">SmartWill India • भारतीय उत्तराधिकार अधिनियम 1925 (धारा 59, 63, 67, 105 एवं 109) के अंतर्गत तैयार विधिक प्रारूप</small>
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
