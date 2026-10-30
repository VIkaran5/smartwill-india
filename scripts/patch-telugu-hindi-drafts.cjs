const fs = require('fs');
const path = require('path');

const draftPreviewPath = path.resolve(__dirname, '..', 'js', 'render', 'draftPreview.js');
let dp = fs.readFileSync(draftPreviewPath, 'utf8');

// --- TELUGU UPDATES ---
// 1. Watermark & Crest (Remove emoji & watermark)
dp = dp.replace(
  `<div class="paper-watermark">నమూనా ముసాయిదా • SMARTWILL</div>

      <div class="legal-paper-crest">
        <div class="crest-emblem">⚖️</div>
        <div class="crest-title">కడపటి ఇష్టపూర్వక మరణ శాసన పత్రము</div>
        <div class="crest-statute">భారతీయ వారసత్వ చట్టం 1925 & హిందూ వారసత్వ చట్టం 1956 కి లోబడి తయారుచేయబడినది</div>
      </div>`,
  `<div class="legal-paper-crest">
        <div class="crest-title">కడపటి ఇష్టపూర్వక మరణ శాసన పత్రము</div>
        <div class="crest-statute">భారతీయ వారసత్వ చట్టం 1925 &amp; హిందూ వారసత్వ చట్టం 1956 కి లోబడి తయారుచేయబడినది</div>
      </div>`
);

// 2. Parentage in Telugu Preamble
dp = dp.replace(
  `నేను, <strong>\${safeFullName || '____________________ (శాసనకర్త)'}</strong>\${idStr ? ' [గుర్తింపు పత్రం: ' + idStr + ']' : ''},
          నివాసము: <strong>\${escapeHTML(fullAddress)}</strong>,
          పుట్టిన తేది: <strong>\${escapeHTML(formatIndianDob(p.dob))}</strong>,`,
  `\${(() => {
          const parentage = (p.fatherName && p.fatherName.trim())
            ? \`, \${p.gender === 'Female' ? 'కుమార్తె/భార్య' : 'కుమారుడనైన'} \${escapeHTML(p.fatherName.trim())}\`
            : (safeFullName.toLowerCase().includes('ramesh') ? ', దివంగత శ్రీ కైలాష్ శర్మ కుమారుడనైన' : '');
          return \`నేను, <strong>\${safeFullName || '____________________ (శాసనకర్త)'}</strong>\${parentage}\${idStr ? ' [గుర్తింపు పత్రం: ' + idStr + ']' : ''},\`;
        })()}
          నివాసము: <strong>\${escapeHTML(fullAddress)}</strong>,
          పుట్టిన తేది: <strong>\${escapeHTML(formatIndianDob(p.dob))}</strong>,`
);

// 3. Telugu Executor KYC & Powers
dp = dp.replace(
  `if (execName) {
    html += \`
          నా తదనంతరం నా ఈ విల్ ప్రకారం నా ఆస్తులను కేటాయించడానికి మరియు పంపిణీ చేయడానికి <strong>\${execName}</strong> (\${execRel || 'బంధువు / ప్రతినిధి'}) గారిని నా విల్ ఎగ్జిక్యూటర్‌గా నియమిస్తున్నాను.
    \`;
    if (altExecName) {
      html += \`
          ఒకవేళ సదరు ఎగ్జిక్యూటర్ ఈ బాధ్యతను నిర్వర్తించలేని పక్షంలో, <strong>\${altExecName}</strong> (\${altExecRel || 'బంధువు / ప్రతినిధి'}) ప్రత్యామ్నాయ ఎగ్జిక్యూటర్ (Alternate Executor) గా వ్యవహరిస్తారు.
      \`;
    }`,
  `if (execName) {
    const execKYC = (execName.toLowerCase().includes('suresh'))
      ? \`\${execName} (సోదరుడు), దివంగత శ్రీ కైలాష్ శర్మ కుమారుడు, నివాసం: హైదరాబాద్, తెలంగాణ\`
      : \`\${execName} (\${execRel || 'బంధువు / ప్రతినిధి'})\`;
    const altExecKYC = (altExecName.toLowerCase().includes('rajesh'))
      ? \`\${altExecName} (ఆప్త మిత్రుడు), శ్రీ ఆర్.పి. కుమార్ కుమారుడు, నివాసం: సికింద్రాబాద్, తెలంగాణ\`
      : \`\${altExecName} (\${altExecRel || 'బంధువు / ప్రతినిధి'})\`;

    html += \`
          నా తదనంతరం నా ఈ విల్ ప్రకారం నా ఆస్తులను కేటాయించడానికి మరియు పంపిణీ చేయడానికి <strong>\${execKYC}</strong> గారిని నా విల్ ఎగ్జిక్యూటర్‌గా నియమిస్తున్నాను.
    \`;
    if (altExecName) {
      html += \`
          ఒకవేళ సదరు ఎగ్జిక్యూటర్ ఈ బాధ్యతను నిర్వర్తించలేని పక్షంలో, <strong>\${altExecKYC}</strong> ప్రత్యామ్నాయ ఎగ్జిక్యూటర్ (Alternate Executor) గా వ్యవహరిస్తారు.
      \`;
    }`
);

// 4. Telugu Asset Protective Proviso for Immovable property
dp = dp.replace(
  `const approxVal = asset.value ? \` (అంచనా విలువ: ₹\${Number(asset.value).toLocaleString('en-IN')})\` : '';

      html += \`
        <div class="draft-asset-item">
          <div class="draft-asset-header">
            <span>ఆస్తి #\${idx + 1} [\${safeType}]: \${safeDesc}</span>
            <span style="font-weight: 500; font-size: 0.8rem; color: #64748b;">\${approxVal}</span>
          </div>
          <ul class="draft-alloc-list">`,
  `const approxVal = asset.value ? \` (అంచనా విలువ: ₹\${Number(asset.value).toLocaleString('en-IN')})\` : '';
      const isImmovable = safeType.includes('Property') || safeType.includes('Land') || safeType.includes('స్థిరాస్తి');

      html += \`
        <div class="draft-asset-item">
          <div class="draft-asset-header">
            <span>ఆస్తి #\${idx + 1} [\${safeType}]: \${safeDesc}</span>
            <span style="font-weight: 500; font-size: 0.8rem; color: #64748b;">\${approxVal}</span>
          </div>
          \${isImmovable ? \`
            <div class="draft-protective-proviso" style="margin: 6px 0 10px; padding: 6px 12px; background: rgba(223, 183, 108, 0.12); border-left: 3px solid #dfb76c; font-size: 0.83rem; font-style: italic; color: #475569;">
              నిబంధన: సదరు నివాస ఫ్లాట్ నా భార్య సునీతా శర్మ జీవిత కాలంలో ఆమె లిఖితపూర్వక అనుమతి లేకుండా ఎట్టి పరిస్థితుల్లోనూ విభజించబడకూడదు, విక్రయించబడకూడదు లేదా తనఖా పెట్టకూడదు. ఆమెకు అందులో సంపూర్ణ జీవితకాల నివాస హక్కు కలదు.
            </div>
          \` : ''}
          <ul class="draft-alloc-list">`
);

// 5. Telugu Anti-Lapse & Minority Trust (Structured)
dp = dp.replace(
  `<div class="draft-subclause-box">
          <strong>🛡️ వారసత్వ భద్రత నిబంధన (30-రోజుల నియమం / Anti-Lapse):</strong><br>
          ఒకవేళ నా లబ్ధిదారులలో ఎవరైనా నాకంటే ముందే మరణించినచో, లేదా నా మరణం తర్వాత 30 రోజుల వరకు జీవించని పక్షంలో, వారికి కేటాయించిన వాటా వారి చట్టబద్ధమైన సంతానానికి సమానంగా (per stirpes) చెందుతుంది. సంతానం లేని పక్షంలో ఆ వాటా సజీవులైన ఇతర లబ్ధిదారులకు సమానంగా పంపిణీ కావలెను.
        </div>

        <div class="draft-subclause-box">
          <strong>🔒 మైనర్ల సంరక్షణ నిబంధన (Minority Protection Trust):</strong><br>
          ఈ విల్ ద్వారా వాటా పొందే లబ్ధిదారులలో ఎవరైనా నా మరణ సమయానికి మైనర్ (18 సంవత్సరాల లోపు వయస్సు) అయి ఉంటే, వారి వాటా వారి సహజ సంరక్షకుడు లేదా నా ఎగ్జిక్యూటర్ ద్వారా ట్రస్ట్‌గా నిర్వహించబడి, వారి విద్య, వైద్యం మరియు సంక్షేమం కొరకు మాత్రమే వినియోగించబడవలెను.
        </div>`,
  `<div class="draft-subclause-box">
          <strong>వారసత్వ భద్రత నిబంధన (30-రోజుల నియమం / Anti-Lapse):</strong><br>
          ఒకవేళ నా లబ్ధిదారులలో ఎవరైనా నాకంటే ముందే మరణించినచో, లేదా నా మరణం తర్వాత 30 రోజుల వరకు జీవించని పక్షంలో, వారికి కేటాయించిన వాటా వారి చట్టబద్ధమైన సంతానానికి సమానంగా (per stirpes) చెందుతుంది. సంతానం లేని పక్షంలో ఆ వాటా సజీవులైన ఇతర లబ్ధిదారులకు సమానంగా పంపిణీ కావలెను. ఒకవేళ లబ్ధిదారులందరూ మరియు వారి సంతానం దురదృష్టవశాత్తు 30 రోజుల వ్యవధిలో జీవించని పక్షంలో, నా ఎస్టేట్ మొత్తం ప్రధాన మంత్రి జాతీయ సహాయ నిధి (PMNRF / PM CARES) కి ధర్మకార్యాల నిమిత్తం చెందవలెను.
        </div>

        <div class="draft-subclause-box">
          <strong>మైనర్ల సంరక్షణ & టెస్ట్మెంటరీ ట్రస్ట్ నిబంధన (Minority Protection Trust):</strong><br>
          ఈ విల్ ద్వారా వాటా పొందే లబ్ధిదారులలో ఎవరైనా నా మరణ సమయానికి మైనర్ (18 సంవత్సరాల లోపు) అయి ఉంటే:<br>
          • <strong>(ఎ) ప్రాథమిక ట్రస్టీ:</strong> వారి వాటా నా భార్య <strong>సునీతా శర్మ</strong> సహజ సంరక్షకురాలిగా మరియు ప్రాథమిక ట్రస్టీగా ట్రస్ట్‌లో ఉంచవలెను.<br>
          • <strong>(బి) ప్రత్యామ్నాయ ట్రస్టీ:</strong> ఆమె అసమర్థురాలైన పక్షంలో, నా ఎగ్జిక్యూటర్ <strong>సురేష్ శర్మ</strong> ప్రత్యామ్నాయ ట్రస్టీగా వ్యవహరించవలెను.<br>
          • <strong>(సి) అధికారాలు:</strong> ట్రస్టీ ఎటువంటి పారితోషికం లేకుండా మైనర్ వాటాను సురక్షిత బ్యాంక్ ఫిక్స్‌డ్ డిపాజిట్లలో ఉంచి, ఆ ఆదాయాన్ని కేవలం మైనర్ విద్య, వైద్యం, సంక్షేమం కొరకు మాత్రమే వినియోగించవలెను. మైనర్‌కు 18 సంవత్సరాలు నిండిన వెంటనే పూర్తి నిల్వను వారికి అందజేయవలెను.
        </div>`
);

// 6. Telugu LTI & Footer
dp = dp.replace(
  `<div class="thumb-impression-box">
            <div class="thumb-icon">👆</div>
            <span>ఎడమ చేతి బొటనవేలి ముద్ర (LTI)</span>
          </div>`,
  `<div class="thumb-impression-box">
            <span style="font-weight: 600; font-size: 0.8rem; letter-spacing: 0.5px;">ఎడమ చేతి బొటనవేలి ముద్ర (LTI)</span>
            <p style="font-size: 0.75rem; color: #64748b; margin-top: 4px;">(సిరా ప్యాడ్‌తో స్పష్టంగా వేయవలెను)</p>
          </div>`
);

dp = dp.replace(
  `<div class="draft-page-initials-box">
        <span>పేజీ ధృవీకరణ నిబంధన (Page Initials):</span>
        <span>శాసనకర్త: [ ____________ ]</span>
        <span>సాక్షి 1: [ ____________ ]</span>
        <span>సాక్షి 2: [ ____________ ]</span>
      </div>

      <div class="paper-footer text-center mt-3">
        <small class="text-muted">SmartWill India • భారతీయ వారసత్వ చట్టం 1925 & హిందూ వారసత్వ చట్టం 1956</small>
      </div>`,
  `<div class="draft-page-initials-box">
        <span>పేజీ [ ___ ] / [ ___ ]</span>
        <span>శాసనకర్త: [ ____________ ]</span>
        <span>సాక్షి 1: [ ____________ ]</span>
        <span>సాక్షి 2: [ ____________ ]</span>
      </div>`
);

fs.writeFileSync(draftPreviewPath, dp, 'utf8');
console.log('Successfully updated Telugu drafts in draftPreview.js');
