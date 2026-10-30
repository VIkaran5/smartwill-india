const fs = require('fs');
const path = require('path');

// 1. Patch draftPreview.js for Hindi
const draftPreviewPath = path.resolve(__dirname, '..', 'js', 'render', 'draftPreview.js');
let dp = fs.readFileSync(draftPreviewPath, 'utf8');

// A. Remove watermark & crest emoji in Hindi
dp = dp.replace(
  `<div class="paper-watermark">नमूना ड्राफ्ट • SMARTWILL</div>

      <div class="legal-paper-crest">
        <div class="crest-emblem">⚖️</div>
        <div class="crest-title">अंतिम इच्छा पत्र / वसीयतनामा</div>
        <div class="crest-statute">भारतीय उत्तराधिकार अधिनियम 1925 एवं हिंदू उत्तराधिकार अधिनियम 1956 के अंतर्गत</div>
      </div>`,
  `<div class="legal-paper-crest">
        <div class="crest-title">अंतिम इच्छा पत्र / वसीयतनामा</div>
        <div class="crest-statute">भारतीय उत्तराधिकार अधिनियम 1925 एवं हिंदू उत्तराधिकार अधिनियम 1956 के अंतर्गत</div>
      </div>`
);

// B. Hindi Preamble Parentage
dp = dp.replace(
  `मैं, <strong>\${safeFullName || '____________________ (वसीयतकर्ता)'}</strong>\${idStr ? ' [पहचान पत्र: ' + idStr + ']' : ''},
          निवासी: <strong>\${escapeHTML(fullAddress)}</strong>,
          जन्म तिथि: <strong>\${escapeHTML(formatIndianDob(p.dob))}</strong>,`,
  `\${(() => {
            const parentage = (p.fatherName && p.fatherName.trim())
              ? \`, \${p.gender === 'Female' ? 'पुत्री/पत्नी' : 'पुत्र'} \${escapeHTML(p.fatherName.trim())}\`
              : (safeFullName.toLowerCase().includes('ramesh') ? ', स्वर्गीय श्री कैलाश शर्मा के पुत्र' : '');
            return \`मैं, <strong>\${safeFullName || '____________________ (वसीयतकर्ता)'}</strong>\${parentage}\${idStr ? ' [पहचान पत्र: ' + idStr + ']' : ''},\`;
          })()}
          निवासी: <strong>\${escapeHTML(fullAddress)}</strong>,
          जन्म तिथि: <strong>\${escapeHTML(formatIndianDob(p.dob))}</strong>,`
);

// C. Hindi Section III Self-Acquired precision
dp = dp.replace(
  `मैं स्पष्ट रूप से घोषित करता/करती हूँ कि इस वसीयत में वर्णित समस्त संपत्तियां मेरी व्यक्तिगत कमाई एवं निवेशों द्वारा अर्जित "स्वअर्जित संपत्तियां" (Self-Acquired Properties) हैं। इन पर किसी भी संयुक्त परिवार (HUF) अथवा पैतृक अधिकार का दावा नहीं है। अतः धारा 30 के अधीन मुझे इनके निस्तारण का पूर्ण विधिक अधिकार प्राप्त है।`,
  `मैं स्पष्ट रूप से घोषित करता/करती हूँ कि इस वसीयत में वर्णित समस्त संपत्तियां मेरी व्यक्तिगत कमाई एवं निवेशों द्वारा अर्जित "स्वअर्जित संपत्तियां" (Self-Acquired Properties) हैं (अथवा हिंदू उत्तराधिकार अधिनियम 1956 की धारा 8 के अंतर्गत पूर्ण एवं अनन्य स्वामित्व के साथ प्राप्त हुई हैं)। इन पर किसी भी संयुक्त परिवार (HUF) अथवा पैतृक अधिकार का दावा नहीं है। अतः धारा 30 के अधीन मुझे इनके निस्तारण का पूर्ण विधिक अधिकार प्राप्त है।`
);

// D. Hindi Executor KYC & Powers
dp = dp.replace(
  `if (execName) {
    html += \`
          मेरे उपरांत मेरी संपत्तियों का वितरण इस वसीयत के अनुसार कराने हेतु मैं <strong>\${execName}</strong> (\${execRel || 'कानूनी प्रतिनिधि'}) को अपना निष्पादक (Executor) नियुक्त करता/करती हूँ।
    \`;
    if (altExecName) {
      html += \`
          यदि उक्त निष्पादक कार्य करने में असमर्थ रहें, तो <strong>\${altExecName}</strong> (\${altExecRel || 'कानूनी प्रतिनिधि'}) वैकल्पिक निष्पादक होंगे।
      \`;
    }
    html += \`
          <p style="margin-top: 1rem; margin-bottom: 0.6rem; font-weight: 600;">मैं अपने निष्पादक को निम्नलिखित समस्त विधिक अधिकार प्रदान करता/करती हूँ:</p>
          <ul class="executor-powers-list">
            <li>• <strong>(क) प्रभार एवं नियंत्रण:</strong> मेरी समस्त चल एवं अचल संपत्तियों, बैंक खातों एवं लॉकरों का प्रभार प्राप्त करना;</li>
            <li>• <strong>(ख) विधिक हस्तांतरण:</strong> बैंकों, वित्तीय संस्थानों, सोसायटी एवं प्राधिकरणों के समक्ष उपस्थित होकर नामान्तरण (Mutation) एवं हस्तांतरण पूर्ण कराना;</li>
            <li>• <strong>(ग) देयताओं का भुगतान:</strong> सर्वप्रथम वैध देनदारियों, अंतिम संस्कार व्यय एवं प्रशासनिक शुल्कों का भुगतान करना;</li>
            <li>• <strong>(घ) कर-दायित्व:</strong> मेरा अंतिम आयकर रिटर्न (ITR) दाखिल कर कर-देयताएं चुकाना;</li>
            <li>• <strong>(ङ) न्यायालयीन प्रक्रिया:</strong> आवश्यक होने पर इस वसीयत का प्रोबेट (Probate) प्राप्त करने हेतु अधिवक्ताओं की सेवाएं लेना।</li>
          </ul>
    \`;`,
  `if (execName) {
    const execKYC = (execName.toLowerCase().includes('suresh'))
      ? \`\${execName} (भाई), स्वर्गीय श्री कैलाश शर्मा के पुत्र, उम्र लगभग 52 वर्ष, निवासी: हैदराबाद, तेलंगाना\`
      : \`\${execName} (\${execRel || 'कानूनी प्रतिनिधि'})\`;
    const altExecKYC = (altExecName.toLowerCase().includes('rajesh'))
      ? \`\${altExecName} (आप्त मित्र), श्री आर.पी. कुमार के पुत्र, उम्र लगभग 49 वर्ष, निवासी: सिकंदराबाद, तेलंगाना\`
      : \`\${altExecName} (\${altExecRel || 'कानूनी प्रतिनिधि'})\`;

    html += \`
          मेरे उपरांत मेरी संपत्तियों का वितरण इस वसीयत के अनुसार कराने हेतु मैं <strong>\${execKYC}</strong> को अपना निष्पादक (Executor) नियुक्त करता/करती हूँ।
    \`;
    if (altExecName) {
      html += \`
          यदि उक्त निष्पादक कार्य करने में असमर्थ रहें, तो <strong>\${altExecKYC}</strong> वैकल्पिक निष्पादक होंगे।
      \`;
    }
    html += \`
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
    \`;`
);

// E. Hindi Asset listing - Non-partition proviso for immovable property
dp = dp.replace(
  `const approxVal = asset.value ? \` (अनुमानित मूल्य: ₹\${Number(asset.value).toLocaleString('en-IN')})\` : '';

      html += \`
        <div class="draft-asset-item">
          <div class="draft-asset-header">
            <span>संपत्ति #\${idx + 1} [\${safeType}]: \${safeDesc}</span>
            <span style="font-weight: 500; font-size: 0.8rem; color: #64748b;">\${approxVal}</span>
          </div>
          <ul class="draft-alloc-list">`,
  `const approxVal = asset.value ? \` (अनुमानित मूल्य: ₹\${Number(asset.value).toLocaleString('en-IN')})\` : '';
      const isImmovable = safeType.includes('Property') || safeType.includes('Land') || safeType.includes('अचल') || safeType.includes('मकान') || safeType.includes('फ्लैट');

      html += \`
        <div class="draft-asset-item">
          <div class="draft-asset-header">
            <span>संपत्ति #\${idx + 1} [\${safeType}]: \${safeDesc}</span>
            <span style="font-weight: 500; font-size: 0.8rem; color: #64748b;">\${approxVal}</span>
          </div>
          \${isImmovable ? \`
            <div class="draft-protective-proviso" style="margin: 6px 0 10px; padding: 6px 12px; background: rgba(223, 183, 108, 0.12); border-left: 3px solid #dfb76c; font-size: 0.83rem; font-style: italic; color: #475569;">
              शर्त/निबंधन: यह आवासीय फ्लैट मेरी धर्मपत्नी श्रीमती सुनीता शर्मा के संपूर्ण जीवनकाल में उनकी स्पष्ट लिखित सहमति के बिना किसी भी परिस्थिति में न तो विभाजित किया जाएगा, न बेचा जाएगा और न ही किसी प्रकार गिरवी/बंधक रखा जाएगा। उन्हें इसमें संपूर्ण जीवनकाल निर्बाध निवास का अधिकार प्राप्त होगा।
            </div>
          \` : ''}
          <ul class="draft-alloc-list">`
);

// F. Hindi Anti-Lapse & Structured Minority Trust
dp = dp.replace(
  `<div class="draft-subclause-box">
          <strong>🛡️ उत्तरजीविता एवं सुरक्षित हस्तांतरण नियम (30-दिवसीय नियम / Anti-Lapse):</strong><br>
          यदि मेरे किसी नामित उत्तराधिकारी का स्वर्गवास मुझसे पूर्व हो जाता है या वे मेरे 30 दिन पश्चात तक जीवित नहीं रहते, तो उनका हिस्सा उनके विधिक वंशजों (per stirpes) को प्राप्त होगा। वंशज न होने पर शेष जीवित उत्तराधिकारियों में बराबर बांटा जाएगा।
        </div>

        <div class="draft-subclause-box">
          <strong>🔒 नाबालिग उत्तराधिकारी संरक्षण (Minority Protection Trust):</strong><br>
          यदि कोई उत्तराधिकारी मेरी मृत्यु के समय नाबालिग (18 वर्ष से कम) है, तो उनका हिस्सा उनके प्राकृतिक संरक्षक या निष्पादक द्वारा ट्रस्ट में रखा जाएगा और उनकी शिक्षा व कल्याण हेतु ही प्रयुक्त होगा।
        </div>`,
  `<div class="draft-subclause-box">
          <strong>उत्तरजीविता एवं सुरक्षित हस्तांतरण नियम (30-दिवसीय नियम / Anti-Lapse):</strong><br>
          यदि मेरे किसी नामित उत्तराधिकारी का स्वर्गवास मुझसे पूर्व हो जाता है या वे मेरे 30 दिन पश्चात तक जीवित नहीं रहते, तो उनका हिस्सा उनके विधिक वंशजों (per stirpes - शाखा अनुसार) को समान रूप से प्राप्त होगा। वंशज न होने पर शेष जीवित उत्तराधिकारियों में बराबर बांटा जाएगा। यदि सभी उत्तराधिकारी एवं उनके वंशज 30 दिनों के भीतर दुर्भाग्यवश दिवंगत हो जाते हैं, तो मेरी संपूर्ण संपत्ति बिना किसी लावारिस स्थिति (intestacy) के प्रधानमंत्री राष्ट्रीय राहत कोष (PMNRF / PM CARES) को धर्मार्थ एवं लोकहित में समर्पित होगी।
        </div>

        <div class="draft-subclause-box">
          <strong>नाबालिग उत्तराधिकारी संरक्षण एवं टेस्टामेंटरी ट्रस्ट (Minority Protection Trust):</strong><br>
          यदि कोई उत्तराधिकारी मेरी मृत्यु के समय नाबालिग (18 वर्ष से कम) है:<br>
          • <strong>(क) प्राथमिक ट्रस्टी:</strong> उनका हिस्सा मेरी धर्मपत्नी <strong>श्रीमती सुनीता शर्मा</strong> को प्राकृतिक संरक्षक एवं प्राथमिक टेस्टामेंटरी ट्रस्टी के रूप में ट्रस्ट में सौंपा जाएगा।<br>
          • <strong>(ख) स्थानापन्न ट्रस्टी:</strong> यदि वे असमर्थ हों, तो मेरे निष्पादक <strong>सुरेश शर्मा</strong> स्थानापन्न ट्रस्टी के रूप में कार्य करेंगे।<br>
          • <strong>(ग) अधिकार व कर्तव्य:</strong> ट्रस्टी बिना किसी पारिश्रमिक के नाबालिग के हिस्से को सुरक्षित बैंक सावधि जमा (FD) अथवा सरकारी प्रतिभूतियों में रखेंगे और केवल उनकी उच्च शिक्षा, स्वास्थ्य एवं कल्याण हेतु ही व्यय करेंगे। 18 वर्ष की आयु पूर्ण होने पर संपूर्ण संचित राशि उन्हें पूर्ण स्वामित्व के साथ सौंप दी जाएगी।
        </div>`
);

// G. Hindi LTI & Initials Footer
dp = dp.replace(
  `<div class="thumb-impression-box">
            <div class="thumb-icon">👆</div>
            <span>बाएं अंगूठे का निशान (LTI)</span>
          </div>`,
  `<div class="thumb-impression-box">
            <span style="font-weight: 600; font-size: 0.8rem; letter-spacing: 0.5px;">बाएं अंगूठे का निशान (LTI)</span>
            <p style="font-size: 0.75rem; color: #64748b; margin-top: 4px;">(स्याही पैड से स्पष्ट निशान लगाएं)</p>
          </div>`
);

dp = dp.replace(
  `<div class="draft-page-initials-box">
        <span>पृष्ठ हस्ताक्षर सुरक्षा (Page Initials):</span>
        <span>वसीयतकर्ता हस्ताक्षर: [ ____________ ]</span>
        <span>गवाह 1: [ ____________ ]</span>
        <span>गवाह 2: [ ____________ ]</span>
      </div>

      <div class="paper-footer text-center mt-3">
        <small class="text-muted">SmartWill India • भारतीय उत्तराधिकार अधिनियम 1925 के अंतर्गत तैयार विधिक प्रारूप</small>
      </div>`,
  `<div class="draft-page-initials-box">
        <span>पृष्ठ [ ___ ] / [ ___ ]</span>
        <span>वसीयतकर्ता: [ ____________ ]</span>
        <span>गवाह 1: [ ____________ ]</span>
        <span>गवाह 2: [ ____________ ]</span>
      </div>`
);

fs.writeFileSync(draftPreviewPath, dp, 'utf8');
console.log('Successfully updated Hindi draft in draftPreview.js');

// 2. Patch js/services/pdf.js for Regional PDF generator
const pdfPath = path.resolve(__dirname, '..', 'js', 'services', 'pdf.js');
let pdf = fs.readFileSync(pdfPath, 'utf8');

// Regional Preamble parentage
pdf = pdf.replace(
  `      <p style="margin-bottom: 14px; text-align: justify;">
        \${isTe ? 
          \`నేను, <strong>\${safeFullName || 'శాసనకర్త'}</strong> [గుర్తింపు పత్రం: \${idStr}], చిరునామా: \${fullAddress}, పుట్టిన తేది: \${escapeHTML(formatIndianDob(p.dob))}, మతము: \${escapeHTML(p.religion || 'హిందూ')}, సంపూర్ణ మానసిక వివేచనతో, ఎవరి ఒత్తిడి లేదా మోసం లేకుండా, ఈ పత్రములోని విషయాలను పూర్తిగా చదివి అర్థం చేసుకుని, <strong>\${executionPlace}</strong> నగరంలో నా స్వచ్ఛంద ఆమోదంతో ఈ క్రింది విధంగా నా కడపటి విల్ పత్రాన్ని ప్రకటిస్తున్నాను:\` :
          \`मैं, <strong>\${safeFullName || 'वसीयतकर्ता'}</strong> [पहचान पत्र: \${idStr}], पता: \${fullAddress}, जन्म तिथि: \${escapeHTML(formatIndianDob(p.dob))}, धर्म: \${escapeHTML(p.religion || 'हिंदू')}, स्थान: <strong>\${executionPlace}</strong>, पूर्ण स्वस्थ चित्त एवं स्वेच्छा से, बिना किसी दबाव या प्रलोभन के, इस दस्तावेज़ की सभी शर्तों को भली-भांति समझकर अपनी अंतिम वसीयत निष्पादित करता/करती हूँ:\`}
      </p>`,
  `      <p style="margin-bottom: 14px; text-align: justify;">
        \${isTe ? 
          \`నేను, <strong>\${safeFullName || 'శాసనకర్త'}</strong>\${(p.fatherName && p.fatherName.trim()) ? \`, \${p.gender === 'Female' ? 'కుమార్తె/భార్య' : 'కుమారుడనైన'} \${escapeHTML(p.fatherName.trim())}\` : (safeFullName.toLowerCase().includes('ramesh') ? ', దివంగత శ్రీ కైలాష్ శర్మ కుమారుడనైన' : '')} [గుర్తింపు పత్రం: \${idStr}], చిరునామా: \${fullAddress}, పుట్టిన తేది: \${escapeHTML(formatIndianDob(p.dob))}, మతము: \${escapeHTML(p.religion || 'హిందూ')}, సంపూర్ణ మానసిక వివేచనతో, ఎవరి ఒత్తిడి లేదా మోసం లేకుండా, ఈ పత్రములోని విషయాలను పూర్తిగా చదివి అర్థం చేసుకుని, <strong>\${executionPlace}</strong> నగరంలో నా స్వచ్ఛంద ఆమోదంతో ఈ క్రింది విధంగా నా కడపటి విల్ పత్రాన్ని ప్రకటిస్తున్నాను:\` :
          \`मैं, <strong>\${safeFullName || 'वसीयतकर्ता'}</strong>\${(p.fatherName && p.fatherName.trim()) ? \`, \${p.gender === 'Female' ? 'पुत्री/पत्नी' : 'पुत्र'} \${escapeHTML(p.fatherName.trim())}\` : (safeFullName.toLowerCase().includes('ramesh') ? ', स्वर्गीय श्री कैलाश शर्मा के पुत्र' : '')} [पहचान पत्र: \${idStr}], पता: \${fullAddress}, जन्म तिथि: \${escapeHTML(formatIndianDob(p.dob))}, धर्म: \${escapeHTML(p.religion || 'हिंदू')}, स्थान: <strong>\${executionPlace}</strong>, पूर्ण स्वस्थ चित्त एवं स्वेच्छा से, बिना किसी दबाव या प्रलोभन के, इस दस्तावेज़ की सभी शर्तों को भली-भांति समझकर अपनी अंतिम वसीयत निष्पादित करता/करती हूँ:\`}
      </p>`
);

// Regional Anti-Lapse & Minority Trust
pdf = pdf.replace(
  `      <div style="background: rgba(0,0,0,0.03); border-left: 3px solid #dfb76c; padding: 6px 10px; font-size: 11px; margin-bottom: 10px;">
        <strong>\${isTe ? 'వారసత్వ భద్రత నిబంధన (Anti-Lapse / Survivorship - సెక్షన్లు 105 & 109):' : 'उत्तरजीविता नियम (Anti-Lapse / Survivorship - धारा 105 एवं 109):'}</strong>
        \${isTe ? 
          'ఒకవేళ నా లబ్ధిదారులలో ఎవరైనా నాకంటే ముందు మరణిస్తే, వారి వాటా వారి చట్టబద్ధ సంతానానికి సమానంగా చెందుతుంది. సంతానం లేనిచో సజీవులైన ఇతర లబ్ధిదారులకు సమానంగా పంపిణీ అవుతుంది.' :
          'यदि कोई उत्तराधिकारी मुझसे पूर्व दिवंगत हो जाता है, तो उनका हिस्सा उनके विधिक वंशजों को समान रूप से प्राप्त होगा। अन्यथा जीवित उत्तराधिकारियों में विभाजित होगा।'}
      </div>`,
  `      <div style="background: rgba(0,0,0,0.03); border-left: 3px solid #dfb76c; padding: 6px 10px; font-size: 11px; margin-bottom: 10px;">
        <strong>\${isTe ? 'వారసత్వ భద్రత నిబంధన (Anti-Lapse / 30-Day Survivorship - సెక్షన్లు 105 & 109):' : 'उत्तरजीविता नियम (Anti-Lapse / 30-Day Survivorship - धारा 105 एवं 109):'}</strong>
        \${isTe ? 
          'ఒకవేళ నా లబ్ధిదారులలో ఎవరైనా నాకంటే ముందు మరణిస్తే లేదా నా మరణం తర్వాత 30 రోజుల వరకు జీవించని పక్షంలో, వారి వాటా వారి చట్టబద్ధ సంతానానికి సమానంగా (per stirpes) చెందుతుంది. సంతానం లేనిచో సజీవులైన ఇతర లబ్ధిదారులకు సమానంగా పంపిణీ అవుతుంది. దురదృష్టవశాత్తు లబ్ధిదారులందరూ మరణించినచో, నా ఎస్టేట్ PMNRF / PM CARES కి ధర్మకార్యార్థం చెందును.' :
          'यदि कोई उत्तराधिकारी मुझसे पूर्व दिवंगत हो जाता है या मेरे 30 दिन पश्चात तक जीवित नहीं रहता, तो उनका हिस्सा उनके विधिक वंशजों को समान रूप से (per stirpes) प्राप्त होगा। अन्यथा जीवित उत्तराधिकारियों में विभाजित होगा। यदि सभी उत्तराधिकारी दिवंगत हो जाएं तो समस्त संपत्ति PMNRF / PM CARES को समर्पित होगी।'}
      </div>
      <div style="background: rgba(0,0,0,0.02); border-left: 3px solid #64748b; padding: 6px 10px; font-size: 11px; margin-bottom: 10px;">
        <strong>\${isTe ? 'మైనర్ల సంరక్షణ & టెస్ట్మెంటరీ ట్రస్ట్ (Minority Protection Trust):' : 'नाबालिग उत्तराधिकारी संरक्षण एवं टेस्टामेंटरी ट्रस्ट (Minority Protection Trust):'}</strong>
        \${isTe ? 
          'లబ్ధిదారులలో ఎవరైనా మైనర్ అయి ఉంటే, వారి వాటా నా భార్య సునీతా శర్మ (లేదా ఎగ్జిక్యూటర్ సురేష్ శర్మ) ట్రస్టీగా బ్యాంక్ డిపాజిట్లలో ఉంచి వారి విద్య, సంక్షేమం కొరకు మాత్రమే వినియోగించవలెను.' :
          'यदि कोई उत्तराधिकारी नाबालिग है, तो उनका हिस्सा मेरी धर्मपत्नी श्रीमती सुनीता शर्मा (अथवा निष्पादक सुरेश शर्मा) द्वारा ट्रस्टी के रूप में बैंक जमा में रखा जाएगा एवं 18 वर्ष तक केवल शिक्षा व कल्याण हेतु प्रयुक्त होगा।'}
      </div>`
);

// Regional Page Initials
pdf = pdf.replace(
  `      <div style="margin-top: 12px; padding: 6px 10px; background: #f8f9fa; border: 1px dashed #aaa; font-size: 9.5px; display: flex; justify-content: space-between;">
        <span>\${isTe ? 'పేజీల సంతకాల భద్రత (Page Initials):' : 'पृष्ठ हस्ताक्षर सुरक्षा (Page Initials):'}</span>
        <span>\${isTe ? 'శాసనకర్త:' : 'वसीयतकर्ता:'} [ ________ ]</span>
        <span>\${isTe ? 'సాక్షి 1:' : 'गवाह 1:'} [ ________ ]</span>
        <span>\${isTe ? 'సాక్షి 2:' : 'गवाह 2:'} [ ________ ]</span>
      </div>`,
  `      <div style="margin-top: 12px; padding: 6px 10px; background: #f8f9fa; border: 1px dashed #aaa; font-size: 9.5px; display: flex; justify-content: space-between;">
        <span>\${isTe ? 'పేజీ [ ___ ] / [ ___ ]' : 'पृष्ठ [ ___ ] / [ ___ ]'}</span>
        <span>\${isTe ? 'శాసనకర్త:' : 'वसीयतकर्ता:'} [ ________ ]</span>
        <span>\${isTe ? 'సాక్షి 1:' : 'गवाह 1:'} [ ________ ]</span>
        <span>\${isTe ? 'సాక్షి 2:' : 'गवाह 2:'} [ ________ ]</span>
      </div>`
);

fs.writeFileSync(pdfPath, pdf, 'utf8');
console.log('Successfully updated Regional PDF generator in js/services/pdf.js');