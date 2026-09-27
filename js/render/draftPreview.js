/* Draft Will Document Preview Service & Modal Controller for SmartWill India
 * Renders authentic formatted legal drafts in English, Telugu, and Hindi under Indian Succession Act 1925
 */
import { getState, updateState } from '../state/store.js';
import { escapeHTML } from '../utils/sanitizer.js';
import { buildCleanAddress } from '../utils/formatters.js';
import { currentLang, t } from '../i18n/index.js';
import { showToast } from '../ui/toast.js';
import { WizardController } from '../wizard/controller.js';

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
  const assets = Array.isArray(willData.assets) ? willData.assets : [];
  const beneficiaries = Array.isArray(willData.beneficiaries) ? willData.beneficiaries : [];
  const now = new Date();
  const currentDate = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  if (lang === 'te') {
    return renderTeluguDraft(p, safeFullName, fullAddress, idStr, execName, execRel, assets, beneficiaries, currentDate);
  }
  if (lang === 'hi') {
    return renderHindiDraft(p, safeFullName, fullAddress, idStr, execName, execRel, assets, beneficiaries, currentDate);
  }
  return renderEnglishDraft(p, safeFullName, fullAddress, idStr, execName, execRel, assets, beneficiaries, currentDate);
}

/**
 * 🇬🇧 English Legal Draft Template (Indian Succession Act, 1925)
 */
function renderEnglishDraft(p, safeFullName, fullAddress, idStr, execName, execRel, assets, beneficiaries, currentDate) {
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
          being of sound disposing mind, memory, and understanding, and acting of my own free choice, volition, and without any coercion, undue influence, or fraud,
          do hereby make, publish, and declare this writing to be my <strong>Last Will and Testament</strong>.
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
        <h4 class="clause-title">3. APPOINTMENT OF WILL EXECUTOR</h4>
        <p>
  `;

  if (execName) {
    html += `
          I hereby nominate, constitute, and appoint <strong>${execName}</strong> (${execRel || 'Legal Representative'}) as the sole Executor and Trustee of this my Last Will and Testament.
          I direct my said Executor to first settle all my legitimate debts, testamentary charges, medical expenses, and funeral costs out of my estate prior to distributing any bequests or shares to my beneficiaries.
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
        <h4 class="clause-title">4. SCHEDULE OF BEQUEST OF ASSETS & BENEFICIARY ALLOCATIONS</h4>
        <p>
          I hereby bequeath, devise, and distribute all my specified movable and immovable assets to the designated beneficiaries in the exact proportions set forth below:
        </p>
  `;

  if (assets.length === 0) {
    html += `<p class="text-muted italic-note">No specific assets recorded. All property will pass according to Clause 5 (Residuary Estate).</p>`;
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
  }

  html += `
      </div>

      <div class="clause-block">
        <h4 class="clause-title">5. RESIDUARY ESTATE CLAUSE</h4>
        <p>
          Any other real or personal property, bank accounts, investments, jewellery, digital assets, insurance proceeds, or claims whatsoever belonging to me at the time of my death not specifically mentioned herein shall be divided equally among my designated beneficiaries surviving me.
        </p>
      </div>

      <div class="clause-block signature-section">
        <h4 class="clause-title">IN WITNESS WHEREOF</h4>
        <p>
          I, the said <strong>${safeFullName || 'Testator'}</strong>, have hereunto set my hand and affixed my signature to this my Last Will and Testament on this <strong>${currentDate}</strong>.
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
          Signed, acknowledged, and declared by the above-named Testator as and for their Last Will and Testament, in the presence of us, both present at the same time, who at their request, in their presence, and in the presence of each other, have hereunto subscribed our names as attesting witnesses. We verify that we are of legal age and are NOT beneficiaries under this Will.
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

      <div class="paper-footer text-center">
        <small class="text-muted">SmartWill India Legal Documentation Service • Governed by the Indian Succession Act, 1925</small>
      </div>
    </div>
  `;
  return html;
}

/**
 * 🇮🇳 Telugu Legal Draft Template (భారతీయ వారసత్వ చట్టం 1925)
 */
function renderTeluguDraft(p, safeFullName, fullAddress, idStr, execName, execRel, assets, beneficiaries, currentDate) {
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
          సంపూర్ణ ఆరోగ్య స్పృహతో, జ్ఞాపకశక్తితో మరియు ఎవరి బలవంతం లేదా ప్రలోభం లేకుండా, నా స్వచ్ఛంద ఆమోదంతో ఈ క్రింది విధంగా నా కడపటి విల్ (మరణ శాసనము) వ్రాయించి ఆమోదిస్తున్నాను.
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
          నేను చక్కటి మానసిక స్థితిలో, సంపూర్ణ వివేచనతో నా ఆస్తుల వివరాలను మరియు నాపై ఆధారపడిన కుటుంబ సభ్యుల సంక్షేమాన్ని గుర్తించి, నా స్వంత ఆలోచనతో ఈ విల్ రాయడం జరిగినది.
        </p>
      </div>

      <div class="clause-block">
        <h4 class="clause-title">3. విల్ ఎగ్జిక్యూటర్ నియామకం (APPOINTMENT OF EXECUTOR)</h4>
        <p>
  `;

  if (execName) {
    html += `
          నా తదనంతరం నా ఈ విల్ ప్రకారం నా ఆస్తులను కేటాయించడానికి మరియు పంపిణీ చేయడానికి <strong>${execName}</strong> (${execRel || 'బంధువు / ప్రతినిధి'}) గారిని నా విల్ ఎగ్జిక్యూటర్‌గా నియమిస్తున్నాను. నా ఎగ్జిక్యూటర్ నా ఋణాలు, అంత్యక్రియల ఖర్చులు మరియు చట్టపరమైన బాధ్యతలను ముందుగా చెల్లించి, ఆపై మిగిలిన ఆస్తులను లబ్ధిదారులకు పంచవలెను.
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
        <h4 class="clause-title">4. ఆస్తుల కేటాయింపు పట్టిక (BEQUEST OF ASSETS SCHEDULE)</h4>
        <p>నా చర మరియు స్థిర ఆస్తులు నా తరువాత క్రింది విధంగా నా లబ్ధిదారులకు చెందవలెను:</p>
  `;

  if (assets.length === 0) {
    html += `<p class="text-muted italic-note">ప్రత్యేక ఆస్తులు నమోదు కాలేదు. మిగిలిన ఆస్తుల నిబంధన (5వ క్లాజ్) వర్తిస్తుంది.</p>`;
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
  }

  html += `
      </div>

      <div class="clause-block">
        <h4 class="clause-title">5. మిగిలిన ఆస్తుల నిబంధన (RESIDUARY ESTATE)</h4>
        <p>
          ఈ విల్‌లో ప్రత్యేకంగా పేర్కొనబడని నా ఇతర బ్యాంక్ నిల్వలు, స్థిర, చర ఆస్తులు లేదా హక్కులు ఏవైనా నా మరణానంతరం మిగిలి ఉంటే, అవి నా లబ్ధిదారులందరికీ సమాన వాటాలుగా చెందవలెను.
        </p>
      </div>

      <div class="clause-block signature-section">
        <h4 class="clause-title">శాసనకర్త సంతకం (SIGNATURE OF TESTATOR)</h4>
        <p>
          పై తెలిపిన వివరాలన్నీ సత్యమైనవని ధృవీకరిస్తూ ఈ తేది <strong>${currentDate}</strong> న శాసనకర్తగా నేను నా సంతకం చేస్తున్నాను.
        </p>
        <div class="testator-sign-box">
          <div class="sign-line"></div>
          <p class="sign-label"><strong>శాసనకర్త సంతకం / వేలిముద్ర</strong></p>
          <p class="sign-name">పేరు: ${safeFullName || 'శాసనకర్త'}</p>
        </div>
      </div>

      <div class="clause-block witness-section">
        <h4 class="clause-title">ఇద్దరు సాక్షుల సంతకాలు (ATTESTATION BY TWO WITNESSES)</h4>
        <p class="witness-intro">
          శాసనకర్త తమ స్వచ్ఛంద నిర్ణయంతో, స్వస్థ చిత్తంతో మా సమక్షంలో సంతకం చేయగా, వారి కోరిక మేరకు, వారి సమక్షంలో మరియు ఒకరి సమక్షంలో మరొకరం సాక్షులుగా సంతకాలు చేస్తున్నాము. మేము ఈ విల్‌లో ఎటువంటి ఆస్తి లబ్ధి పొందే వారము కాదని ధృవీకరిస్తున్నాము.
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

      <div class="paper-footer text-center">
        <small class="text-muted">SmartWill India • భారతీయ వారసత్వ చట్టం 1925 కి లోబడి తయారు చేయబడిన లీగల్ పత్రం</small>
      </div>
    </div>
  `;
  return html;
}

/**
 * 🇮🇳 Hindi Legal Draft Template (भारतीय उत्तराधिकार अधिनियम 1925)
 */
function renderHindiDraft(p, safeFullName, fullAddress, idStr, execName, execRel, assets, beneficiaries, currentDate) {
  let html = `
    <div class="legal-paper-preview">
      <div class="paper-watermark">नमूना ड्राफ्ट • SMARTWILL INDIA</div>

      <div class="paper-header text-center">
        <h2 class="doc-title">अंतिम इच्छा पत्र / वसीयतनामा (LAST WILL & TESTAMENT)</h2>
        <p class="doc-subtitle">(भारतीय उत्तराधिकार अधिनियम 1925 के अंतर्गत तैयार)</p>
      </div>

      <div class="paper-preamble">
        <p>
          मैं, <strong>${safeFullName || '____________________ (वसीयतकर्ता)'}</strong>${idStr ? ' [पहचान पत्र: ' + idStr + ']' : ''},
          निवासी: <strong>${escapeHTML(fullAddress)}</strong>,
          जन्म तिथि: <strong>${escapeHTML(p.dob || 'DD/MM/YYYY')}</strong>,
          धर्म: <strong>${escapeHTML(p.religion || 'हिंदू')}</strong>,
          पूर्ण स्वस्थ चित्त, स्मरण शक्ति एवं स्वेच्छा से, बिना किसी दबाव, प्रलोभन अथवा अनुचित प्रभाव के, इस दस्तावेज़ को अपनी <strong>अंतिम वसीयत (वसीयतनामा)</strong> के रूप में घोषित एवं निष्पादित करता/करती हूँ।
        </p>
      </div>

      <div class="clause-block">
        <h4 class="clause-title">1. पूर्व वसीयतों का निरस्तीकरण (REVOCATION OF FORMER WILLS)</h4>
        <p>
          मैं इस तिथि से पूर्व अपने द्वारा निष्पादित की गई सभी पूर्व वसीयतों, इच्छा पत्रों एवं संबंधित प्रपत्रों को पूर्णतः निरस्त करता/करती हूँ तथा इसे ही अपनी एकमात्र वैध वसीयत घोषित करता/करती हूँ।
        </p>
      </div>

      <div class="clause-block">
        <h4 class="clause-title">2. स्वस्थ चित्त एवं स्वेच्छा की घोषणा (SOUND MIND DECLARATION)</h4>
        <p>
          मैं यह घोषणा करता/करती हूँ कि मैं शारीरिक एवं मानसिक रूप से स्वस्थ हूँ। मैं अपनी संपत्तियों के मूल्य और अपने उत्तराधिकारियों के कल्याण को भली-भांति समझते हुए यह वसीयत लिख रहा/रही हूँ।
        </p>
      </div>

      <div class="clause-block">
        <h4 class="clause-title">3. वसीयत निष्पादक की नियुक्ति (APPOINTMENT OF EXECUTOR)</h4>
        <p>
  `;

  if (execName) {
    html += `
          मेरे उपरांत मेरी संपत्तियों का वितरण इस वसीयत के अनुसार कराने हेतु मैं <strong>${execName}</strong> (${execRel || 'कानूनी प्रतिनिधि'}) को अपना निष्पादक (Executor) नियुक्त करता/करती हूँ। निष्पादक सबसे पहले मेरे वैध ऋण, अंतिम संस्कार और प्रशासनिक व्यय चुकाएंगे, तत्पश्चात शेष संपत्ति का वितरण करेंगे।
    `;
  } else {
    html += `
          भारतीय उत्तराधिकार अधिनियम 1925 के प्रावधानों के तहत, मैंने कोई निजी निष्पादक नियुक्त नहीं किया है। मेरी संपत्ति का प्रबंधन मेरे उत्तराधिकारियों या न्यायालय द्वारा नियुक्त प्रशासक के माध्यम से किया जाएगा।
    `;
  }

  html += `
        </p>
      </div>

      <div class="clause-block">
        <h4 class="clause-title">4. संपत्ति आवंटन अनुसूची (BEQUEST OF ASSETS SCHEDULE)</h4>
        <p>मेरी चल एवं अचल संपत्तियों का अधिकार मेरे उपरांत निम्नलिखित रूप से मेरे उत्तराधिकारियों को दिया जाए:</p>
  `;

  if (assets.length === 0) {
    html += `<p class="text-muted italic-note">कोई विशिष्ट संपत्ति दर्ज नहीं। शेष संपत्ति नियम (खंड 5) लागू होगा।</p>`;
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
          html += `<li>• <strong>${alloc.percentage}% हिस्सा</strong> पूर्ण अधिकारों के साथ <strong>${benName}</strong>${benId} को दिया जाता है।</li>`;
        });
      }

      html += `
          </ul>
        </div>
      `;
    });
  }

  html += `
      </div>

      <div class="clause-block">
        <h4 class="clause-title">5. शेष संपत्ति नियम (RESIDUARY ESTATE)</h4>
        <p>
          मेरी अन्य कोई भी चल या अचल संपत्ति, बैंक खाते या अधिकार जिनका उल्लेख इस वसीयत में नहीं हुआ है, वे मेरे सभी जीवित उत्तराधिकारियों में समान रूप से वितरित की जाएंगी।
        </p>
      </div>

      <div class="clause-block signature-section">
        <h4 class="clause-title">वसीयतकर्ता के हस्ताक्षर (SIGNATURE OF TESTATOR)</h4>
        <p>
          इसके साक्ष्य स्वरूप, मैंने आज दिनांक <strong>${currentDate}</strong> को अपनी पूर्ण सहमति से इस वसीयत पर हस्ताक्षर किए हैं।
        </p>
        <div class="testator-sign-box">
          <div class="sign-line"></div>
          <p class="sign-label"><strong>वसीयतकर्ता के हस्ताक्षर / अंगूठे का निशान</strong></p>
          <p class="sign-name">नाम: ${safeFullName || 'वसीयतकर्ता'}</p>
        </div>
      </div>

      <div class="clause-block witness-section">
        <h4 class="clause-title">दो गवाहों के हस्ताक्षर (ATTESTATION BY TWO WITNESSES)</h4>
        <p class="witness-intro">
          वसीयतकर्ता ने हमारे समक्ष इस वसीयत पर हस्ताक्षर किए और हमने उनके अनुरोध पर, उनकी उपस्थिति में तथा एक-दूसरे की उपस्थिति में गवाह के रूप में हस्ताक्षर किए हैं। हम पुष्टि करते हैं कि हम इस वसीयत में लाभार्थी नहीं हैं।
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

      <div class="paper-footer text-center">
        <small class="text-muted">SmartWill India • भारतीय उत्तराधिकार अधिनियम 1925 के अधीन तैयार विधिक प्रारूप</small>
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
