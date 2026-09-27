/* Dynamic Beneficiary List Renderer with Card Headers, Smart PAN/ID Validation & Phone Live Checking
 * Fully trilingual: English, Telugu (te), Hindi (hi)
 */
import { getState, updateState } from '../state/store.js';
import { escapeHTML } from '../utils/sanitizer.js';
import { applyTranslations, currentLang } from '../i18n/index.js';

export function getCurrentLang() {
  const state = getState();
  const lang = (state && state.lang) || (typeof document !== 'undefined' ? document.documentElement.lang : 'en') || 'en';
  if (lang === 'te' || lang === 'hi') return lang;
  return 'en';
}

export const BENEFICIARY_I18N = {
  en: {
    memberBadge: 'Family Member',
    removeMember: 'Remove Member',
    fullName: 'Full Legal Name',
    relation: 'Relationship',
    mobile: 'Mobile Number',
    govtIdType: 'Govt ID Type (Optional)',
    govtIdDigits: 'Last 4 Digits / Chars',
    selectIdFirst: 'Select ID type first',
    panDigitsLabel: 'Last 4 (3 Digits + 1 Letter)',
    aadhaarDigitsLabel: 'Last 4 Digits',
    guardianLabel: 'Appointed Guardian / Trustee for Minor',
    guardianPlaceholder: 'Full legal name of adult guardian (e.g. Mother / Uncle)',
    guardianHelp: 'Under Indian Guardian & Wards Act 1890, a guardian manages minor\'s inheritance until age 18.',
    relations: {
      'Spouse': 'Spouse (Wife / Husband)',
      'Son': 'Son',
      'Daughter': 'Daughter',
      'Minor Son (Under 18)': 'Minor Son (Under 18)',
      'Minor Daughter (Under 18)': 'Minor Daughter (Under 18)',
      'Mother': 'Mother',
      'Father': 'Father',
      'Brother': 'Brother',
      'Sister': 'Sister',
      'Grandchild': 'Grandchild',
      'Other': 'Other Relative / Individual'
    },
    idTypes: {
      '': 'None / Select ID',
      'PAN Card': 'PAN Card (e.g. 567A)',
      'Aadhaar Card': 'Aadhaar Card (Last 4 Digits)',
      'Voter ID': 'Voter ID',
      'Passport': 'Passport'
    },
    namePlaceholders: {
      Spouse: 'e.g. Priya Sharma or Rajesh Sharma',
      Son: 'e.g. Rahul Sharma, Rohan Verma',
      'Minor Son (Under 18)': 'e.g. Rahul Sharma, Rohan Verma',
      Daughter: 'e.g. Ananya Sharma, Priya Verma',
      'Minor Daughter (Under 18)': 'e.g. Ananya Sharma, Priya Verma',
      Mother: 'e.g. Sunita Sharma, Lakshmi Devi',
      Father: 'e.g. Ramesh Sharma, Mohan Rao',
      Brother: 'e.g. Suresh Sharma, Vikram Rao',
      Sister: 'e.g. Kavita Sharma, Rekha Rao',
      Grandchild: 'e.g. Aarav Sharma, Diya Sharma',
      Other: 'Full legal name as per Govt ID'
    },
    idValidation: {
      panValid: (code) => `✓ Valid PAN (XXXX-${code})`,
      panInvalid: '⚠️ PAN last 4 must be 3 numbers + 1 letter (e.g. 567A)',
      aadhaarValid: (code) => `✓ Valid Aadhaar (XXXX-${code})`,
      aadhaarInvalid: '⚠️ Aadhaar last 4 must be 4 numbers (0-9)',
      voterValid: (code) => `✓ Valid Voter ID (XXXX-${code})`,
      voterInvalid: '⚠️ Voter ID last 4 must be 4 numbers',
      passportValid: (code) => `✓ Valid Passport (XXXX-${code})`,
      passportInvalid: '⚠️ Passport last 4 must be 4 numbers',
      genericValid: (code) => `✓ Valid ID (${code})`,
      genericInvalid: '⚠️ Enter 4 alphanumeric characters'
    },
    phoneValidation: {
      valid: (phone) => `✓ Valid Indian Mobile (+91 ${phone})`,
      invalid: '⚠️ Must be 10 digits starting with 6, 7, 8, or 9'
    }
  },
  te: {
    memberBadge: 'కుటుంబ సభ్యుడు / వారసుడు',
    removeMember: 'సభ్యుడిని తొలగించండి',
    fullName: 'పూర్తి చట్టపరమైన పేరు',
    relation: 'సంబంధం',
    mobile: 'మొబైల్ నంబర్',
    govtIdType: 'ప్రభుత్వ ID రకం (ఐచ్ఛికం)',
    govtIdDigits: 'చివరి 4 అంకెలు / అక్షరాలు',
    selectIdFirst: 'ముందుగా ID రకాన్ని ఎంచుకోండి',
    panDigitsLabel: 'చివరి 4 (3 అంకెలు + 1 అక్షరం)',
    aadhaarDigitsLabel: 'చివరి 4 అంకెలు',
    guardianLabel: 'మైనర్ సంరక్షకుడు / ట్రస్టీ (Guardian)',
    guardianPlaceholder: 'సంరక్షకుడి పూర్తి పేరు (ఉదా: తల్లి / బాబాయ్)',
    guardianHelp: 'గార్డియన్ & వార్డ్స్ చట్టం 1890 ప్రకారం, పిల్లల వయస్సు 18 ఏళ్లు వచ్చే వరకు సంరక్షకుడు ఆస్తిని నిర్వహిస్తారు.',
    relations: {
      'Spouse': 'భార్య / భర్త (జీవిత భాగస్వామి)',
      'Son': 'కుమారుడు (Son)',
      'Daughter': 'కుమార్తె (Daughter)',
      'Minor Son (Under 18)': 'మైనర్ కుమారుడు (18 ఏళ్ల లోపు)',
      'Minor Daughter (Under 18)': 'మైనర్ కుమార్తె (18 ఏళ్ల లోపు)',
      'Mother': 'తల్లి (Mother)',
      'Father': 'తండ్రి (Father)',
      'Brother': 'సోదరుడు (Brother)',
      'Sister': 'సోదరి (Sister)',
      'Grandchild': 'మనవడు / మనవరాలు',
      'Other': 'ఇతర బంధువులు / ఇతరులు'
    },
    idTypes: {
      '': 'ఎంపిక చేయలేదు / ID ఎంచుకోండి',
      'PAN Card': 'పాన్ కార్డ్ (ఉదా: 567A)',
      'Aadhaar Card': 'ఆధార్ కార్డ్ (చివరి 4 అంకెలు)',
      'Voter ID': 'ఓటర్ ID',
      'Passport': 'పాస్‌పోర్ట్'
    },
    namePlaceholders: {
      Spouse: 'ఉదా: ప్రియ శర్మ లేదా రాజేష్ శర్మ',
      Son: 'ఉదా: రాహుల్ శర్మ, రోహన్ వర్మ',
      'Minor Son (Under 18)': 'ఉదా: రాహుల్ శర్మ, రోహన్ వర్మ',
      Daughter: 'ఉదా: అనన్య శర్మ, ప్రియ వర్మ',
      'Minor Daughter (Under 18)': 'ఉదా: అనన్య శర్మ, ప్రియ వర్మ',
      Mother: 'ఉదా: సునీత శర్మ, లక్ష్మీ దేవి',
      Father: 'ఉదా: రమేష్ శర్మ, మోహన్ రావు',
      Brother: 'ఉదా: సురేష్ శర్మ, విక్రమ్ రావు',
      Sister: 'ఉదా: కవిత శర్మ, రేఖ రావు',
      Grandchild: 'ఉదా: ఆరవ్ శర్మ, దియా శర్మ',
      Other: 'గుర్తింపు కార్డు ప్రకారం పూర్తి పేరు'
    },
    idValidation: {
      panValid: (code) => `✓ సరైన పాన్ కార్డ్ (XXXX-${code})`,
      panInvalid: '⚠️ PAN చివరి 4 అక్షరాలలో 3 అంకెలు + 1 లెటర్ ఉండాలి (ఉదా: 567A)',
      aadhaarValid: (code) => `✓ సరైన ఆధార్ నంబర్ (XXXX-${code})`,
      aadhaarInvalid: '⚠️ ఆధార్ చివరి 4 అంకెలు నంబర్లు మాత్రమే ఉండాలి (0-9)',
      voterValid: (code) => `✓ సరైన ఓటర్ ID (XXXX-${code})`,
      voterInvalid: '⚠️ ఓటర్ ID లో 4 అంకెలు ఉండాలి',
      passportValid: (code) => `✓ సరైన పాస్‌పోర్ట్ నంబర్ (XXXX-${code})`,
      passportInvalid: '⚠️ పాస్‌పోర్ట్ లో 4 అంకెలు ఉండాలి',
      genericValid: (code) => `✓ సరైన గుర్తింపు ID (${code})`,
      genericInvalid: '⚠️ 4 అంకెలు లేదా అక్షరాలు నమోదు చేయండి'
    },
    phoneValidation: {
      valid: (phone) => `✓ సరైన మొబైల్ నంబర్ (+91 ${phone})`,
      invalid: '⚠️ 6, 7, 8, లేదా 9 తో మొదలయ్యే 10 అంకెల నంబర్ ఉండాలి'
    }
  },
  hi: {
    memberBadge: 'परिवार का सदस्य / वारिस',
    removeMember: 'सदस्य हटाएं',
    fullName: 'पूरा कानूनी नाम',
    relation: 'संबंध',
    mobile: 'मोबाइल नंबर',
    govtIdType: 'सरकारी पहचान पत्र (वैकल्पिक)',
    govtIdDigits: 'अंतिम 4 अंक / अक्षर',
    selectIdFirst: 'पहले पहचान पत्र चुनें',
    panDigitsLabel: 'अंतिम 4 (3 अंक + 1 अक्षर)',
    aadhaarDigitsLabel: 'अंतिम 4 अंक',
    guardianLabel: 'नाबालिग के लिए नियुक्त अभिभावक (Guardian)',
    guardianPlaceholder: 'अभिभावक का पूरा नाम (उदा: माता / चाचा)',
    guardianHelp: 'गार्जियन एंड वार्ड्स एक्ट 1890 के अनुसार, 18 वर्ष की आयु तक अभिभावक संपत्ति की देखभाल करेंगे।',
    relations: {
      'Spouse': 'पति / पत्नी (जीवनसाथी)',
      'Son': 'पुत्र (Son)',
      'Daughter': 'पुत्री (Daughter)',
      'Minor Son (Under 18)': 'नाबालिग पुत्र (18 वर्ष से कम)',
      'Minor Daughter (Under 18)': 'नाबालिग पुत्री (18 वर्ष से कम)',
      'Mother': 'माता (Mother)',
      'Father': 'पिता (Father)',
      'Brother': 'भाई (Brother)',
      'Sister': 'बहन (Sister)',
      'Grandchild': 'पोता / पोती / नाती / नातिन',
      'Other': 'अन्य रिश्तेदार / अन्य'
    },
    idTypes: {
      '': 'कोई नहीं / ID चुनें',
      'PAN Card': 'पैन कार्ड (उदा: 567A)',
      'Aadhaar Card': 'आधार कार्ड (अंतिम 4 अंक)',
      'Voter ID': 'वोटर आईडी',
      'Passport': 'पासपोर्ट'
    },
    namePlaceholders: {
      Spouse: 'उदा: प्रिया शर्मा या राजेश शर्मा',
      Son: 'उदा: राहुल शर्मा, रोहन वर्मा',
      'Minor Son (Under 18)': 'उदा: राहुल शर्मा, रोहन वर्मा',
      Daughter: 'उदा: अनन्या शर्मा, प्रिया वर्मा',
      'Minor Daughter (Under 18)': 'उदा: अनन्या शर्मा, प्रिया वर्मा',
      Mother: 'उदा: सुनीता शर्मा, लक्ष्मी देवी',
      Father: 'उदा: रमेश शर्मा, मोहन राव',
      Brother: 'उदा: सुरेश शर्मा, विक्रम राव',
      Sister: 'उदा: कविता शर्मा, रेखा राव',
      Grandchild: 'उदा: आरव शर्मा, दीया शर्मा',
      Other: 'पहचान पत्र के अनुसार पूरा नाम'
    },
    idValidation: {
      panValid: (code) => `✓ मान्य पैन कार्ड (XXXX-${code})`,
      panInvalid: '⚠️ पैन के अंतिम 4 में 3 अंक + 1 अक्षर होने चाहिए (उदा: 567A)',
      aadhaarValid: (code) => `✓ मान्य आधार नंबर (XXXX-${code})`,
      aadhaarInvalid: '⚠️ आधार के अंतिम 4 केवल अंक होने चाहिए (0-9)',
      voterValid: (code) => `✓ मान्य वोटर आईडी (XXXX-${code})`,
      voterInvalid: '⚠️ वोटर आईडी में 4 अंक होने चाहिए',
      passportValid: (code) => `✓ मान्य पासपोर्ट नंबर (XXXX-${code})`,
      passportInvalid: '⚠️ पासपोर्ट में 4 अंक होने चाहिए',
      genericValid: (code) => `✓ मान्य पहचान आईडी (${code})`,
      genericInvalid: '⚠️ 4 मान्य अंक या अक्षर दर्ज करें'
    },
    phoneValidation: {
      valid: (phone) => `✓ मान्य भारतीय मोबाइल (+91 ${phone})`,
      invalid: '⚠️ 6, 7, 8, या 9 से शुरू होने वाला 10 अंकों का नंबर होना चाहिए'
    }
  }
};

function getIdPlaceholder(idType, t) {
  if (idType === 'PAN Card') return 'e.g. 567A';
  if (idType === 'Aadhaar Card') return 'e.g. 1234';
  if (idType) return 'e.g. 5678';
  return t.selectIdFirst;
}

function getIdDigitsLabel(idType, t) {
  if (idType === 'PAN Card') return t.panDigitsLabel;
  if (idType === 'Aadhaar Card') return t.aadhaarDigitsLabel;
  return t.govtIdDigits;
}

function validateBenGovtId(idType, digits, t) {
  const clean = (digits || '').trim().toUpperCase();
  if (!clean) return { ok: true, message: '' };

  if (idType === 'Aadhaar Card') {
    const ok = /^\d{4}$/.test(clean);
    return { ok, message: ok ? t.idValidation.aadhaarValid(clean) : t.idValidation.aadhaarInvalid };
  }
  if (idType === 'PAN Card') {
    const ok = /^\d{3}[A-Z]$/.test(clean);
    return { ok, message: ok ? t.idValidation.panValid(clean) : t.idValidation.panInvalid };
  }
  if (idType === 'Voter ID') {
    const ok = /^\d{4}$/.test(clean);
    return { ok, message: ok ? t.idValidation.voterValid(clean) : t.idValidation.voterInvalid };
  }
  if (idType === 'Passport') {
    const ok = /^\d{4}$/.test(clean);
    return { ok, message: ok ? t.idValidation.passportValid(clean) : t.idValidation.passportInvalid };
  }
  const ok = /^[A-Z0-9]{4}$/.test(clean);
  return { ok, message: ok ? t.idValidation.genericValid(clean) : t.idValidation.genericInvalid };
}

export function renderBeneficiaries() {
  const container = document.getElementById('beneficiariesContainer');
  if (!container) return;

  const state = getState();
  const lang = getCurrentLang();
  const t = BENEFICIARY_I18N[lang] || BENEFICIARY_I18N.en;
  container.innerHTML = '';

  state.beneficiaries.forEach((ben, index) => {
    // Sanitize any legacy mock dummy data left from prior sessions
    if (ben.name === 'Priya Sharma' || ben.name === 'Arjun Sharma') {
      ben.name = '';
    }
    if (ben.phone === '9876543210' || ben.phone === '9876543211') {
      ben.phone = '';
    }
    if (ben.idDigits === '5678' || ben.idDigits === '9812') {
      ben.idDigits = '';
    }

    const relName = t.relations[ben.relation] || ben.relation || t.memberBadge;
    const titleText = ben.name ? `${relName} — ${ben.name}` : relName;
    const namePh = t.namePlaceholders[ben.relation] || t.namePlaceholders.Other;

    const row = document.createElement('div');
    row.className = 'dynamic-row beneficiary-card-structured';
    row.id = `benCard_${ben.id}`;
    row.innerHTML = `
      <!-- Card Header: Number + Relation Badge on Left, Remove Button on Right -->
      <div class="beneficiary-card-header">
        <div class="beneficiary-card-title">
          <span class="beneficiary-num-badge">#${index + 1}</span>
          <span class="beneficiary-title-text" id="benTitle_${ben.id}">👤 ${escapeHTML(titleText)}</span>
        </div>
        ${state.beneficiaries.length > 1 ? `
          <button type="button" class="btn-remove-row btn-remove-ben" data-id="${ben.id}" title="${escapeHTML(t.removeMember)}" aria-label="${escapeHTML(t.removeMember)}">
            <span class="remove-cross">&times;</span>
            <span class="remove-text">${escapeHTML(t.removeMember)}</span>
          </button>
        ` : ''}
      </div>

      <!-- Row 1: Full Legal Name & Relationship in 50/50 Grid -->
      <div class="beneficiary-grid-row">
        <div class="form-group mb-0">
          <label class="form-label">${escapeHTML(t.fullName)} <span class="required" style="color:var(--accent-rose);">*</span></label>
          <input type="text" class="form-control ben-name" data-id="${ben.id}"
            value="${escapeHTML(ben.name || '')}"
            placeholder="${escapeHTML(namePh)}"
            id="benNameInput_${ben.id}">
        </div>

        <div class="form-group mb-0">
          <label class="form-label">${escapeHTML(t.relation)} <span class="required" style="color:var(--accent-rose);">*</span></label>
          <select class="form-select ben-rel" data-id="${ben.id}">
            ${Object.entries(t.relations).map(([val, label]) => `
              <option value="${val}" ${ben.relation === val ? 'selected' : ''}>${escapeHTML(label)}</option>
            `).join('')}
          </select>
        </div>
      </div>

      <!-- Appointed Guardian Section for Minors -->
      <div class="beneficiary-guardian-box mt-3 ${ben.relation && ben.relation.includes('Minor') ? '' : 'hidden'}" id="guardianBox_${ben.id}">
        <div class="guardian-header">
          <span class="guardian-tag">🛡️ ${escapeHTML(t.guardianLabel)} <span class="required" style="color:var(--accent-rose);">*</span></span>
          <span class="guardian-help-badge">${escapeHTML(t.guardianHelp)}</span>
        </div>
        <div class="guardian-input-wrap mt-2">
          <input type="text" class="form-control ben-guardian" data-id="${ben.id}"
            value="${escapeHTML(ben.guardian || '')}"
            placeholder="${escapeHTML(t.guardianPlaceholder)}">
        </div>
      </div>

      <!-- Row 2: Mobile Number, Govt ID Type, and Last 4 Digits/Chars in 3-Column Grid -->
      <div class="beneficiary-grid-details mt-3">
        <div class="form-group mb-0">
          <label class="form-label">${escapeHTML(t.mobile)}</label>
          <input type="tel" class="form-control ben-phone" data-id="${ben.id}"
            value="${escapeHTML(ben.phone || '')}"
            placeholder="e.g. 9876543210" maxlength="10" inputmode="tel">
          <div class="text-xs mt-1 font-semibold ben-phone-badge" id="benPhoneBadge_${ben.id}"></div>
        </div>

        <div class="form-group mb-0">
          <label class="form-label">${escapeHTML(t.govtIdType)}</label>
          <select class="form-select ben-id-type" data-id="${ben.id}">
            ${Object.entries(t.idTypes).map(([val, label]) => `
              <option value="${val}" ${ben.idType === val ? 'selected' : ''}>${escapeHTML(label)}</option>
            `).join('')}
          </select>
        </div>

        <div class="form-group mb-0">
          <label class="form-label" id="idDigitsLabel_${ben.id}">
            ${escapeHTML(getIdDigitsLabel(ben.idType, t))}
          </label>
          <input type="text" class="form-control ben-id-digits" data-id="${ben.id}"
            maxlength="4"
            value="${escapeHTML(ben.idDigits || '')}"
            placeholder="${escapeHTML(getIdPlaceholder(ben.idType, t))}">
          <div class="text-xs mt-1 font-semibold ben-id-badge" id="benIdBadge_${ben.id}"></div>
        </div>
      </div>
    `;
    container.appendChild(row);

    // Initial badge validation if values are pre-filled
    if (ben.phone) {
      updatePhoneBadge(ben.id, ben.phone, t);
    }
    if (ben.idDigits) {
      updateIdBadge(ben.id, ben.idType, ben.idDigits, t);
    }
  });

  applyTranslations(currentLang);
  bindBeneficiaryRowEvents();
}

function updatePhoneBadge(id, phone, t) {
  const badge = document.getElementById(`benPhoneBadge_${id}`);
  if (!badge) return;
  const clean = (phone || '').trim().replace(/\D/g, '');
  if (!clean) {
    badge.innerHTML = '';
    return;
  }
  if (/^[6-9]\d{9}$/.test(clean)) {
    badge.style.color = '#10b981';
    badge.innerHTML = escapeHTML(t.phoneValidation.valid(clean));
  } else {
    badge.style.color = '#f43f5e';
    badge.innerHTML = escapeHTML(t.phoneValidation.invalid);
  }
}

function updateIdBadge(id, idType, digits, t) {
  const badge = document.getElementById(`benIdBadge_${id}`);
  if (!badge) return;
  const clean = (digits || '').trim().toUpperCase();
  if (!clean || !idType) {
    badge.innerHTML = '';
    return;
  }
  const res = validateBenGovtId(idType, clean, t);
  badge.style.color = res.ok ? '#10b981' : '#f43f5e';
  badge.innerHTML = escapeHTML(res.message);
}

function bindBeneficiaryRowEvents() {
  const lang = getCurrentLang();
  const t = BENEFICIARY_I18N[lang] || BENEFICIARY_I18N.en;

  // Name input listener: updates state and live card header title
  document.querySelectorAll('.ben-name').forEach(el => {
    el.addEventListener('input', (e) => {
      const id = Number(e.target.dataset.id);
      const val = e.target.value;
      const state = getState();
      const beneficiaries = state.beneficiaries.map(b => b.id === id ? { ...b, name: val } : b);
      updateState({ beneficiaries });

      const target = beneficiaries.find(b => b.id === id);
      const titleEl = document.getElementById(`benTitle_${id}`);
      if (titleEl && target) {
        const curLang = getCurrentLang();
        const curT = BENEFICIARY_I18N[curLang] || BENEFICIARY_I18N.en;
        const relName = curT.relations[target.relation] || target.relation || curT.memberBadge;
        titleEl.textContent = `👤 ${target.name ? `${relName} — ${target.name}` : relName}`;
      }
    });
  });

  // Relationship select listener: updates state, placeholder, guardian box, and title
  document.querySelectorAll('.ben-rel').forEach(el => {
    el.addEventListener('change', (e) => {
      const id = Number(e.target.dataset.id);
      const rel = e.target.value;
      const state = getState();
      const beneficiaries = state.beneficiaries.map(b => b.id === id ? { ...b, relation: rel } : b);
      updateState({ beneficiaries });

      const curLang = getCurrentLang();
      const curT = BENEFICIARY_I18N[curLang] || BENEFICIARY_I18N.en;
      const target = beneficiaries.find(b => b.id === id);

      // 1. Update Guardian box visibility
      const gBox = document.getElementById(`guardianBox_${id}`);
      if (gBox) {
        if (rel && rel.includes('Minor')) {
          gBox.classList.remove('hidden');
        } else {
          gBox.classList.add('hidden');
        }
      }

      // 2. Update Name input placeholder contextually
      const nameInput = document.getElementById(`benNameInput_${id}`);
      if (nameInput) {
        nameInput.placeholder = curT.namePlaceholders[rel] || curT.namePlaceholders.Other;
      }

      // 3. Update Card Header title
      const titleEl = document.getElementById(`benTitle_${id}`);
      if (titleEl && target) {
        const relName = curT.relations[target.relation] || target.relation || curT.memberBadge;
        titleEl.textContent = `👤 ${target.name ? `${relName} — ${target.name}` : relName}`;
      }
    });
  });

  // Guardian input listener
  document.querySelectorAll('.ben-guardian').forEach(el => {
    el.addEventListener('input', (e) => {
      const id = Number(e.target.dataset.id);
      const state = getState();
      const beneficiaries = state.beneficiaries.map(b => b.id === id ? { ...b, guardian: e.target.value } : b);
      updateState({ beneficiaries });
    });
  });

  // Phone input listener with live formatting and validation
  document.querySelectorAll('.ben-phone').forEach(el => {
    el.addEventListener('input', (e) => {
      const id = Number(e.target.dataset.id);
      const val = e.target.value.replace(/\D/g, '');
      if (e.target.value !== val) e.target.value = val;

      const state = getState();
      const beneficiaries = state.beneficiaries.map(b => b.id === id ? { ...b, phone: val } : b);
      updateState({ beneficiaries });

      const curLang = getCurrentLang();
      const curT = BENEFICIARY_I18N[curLang] || BENEFICIARY_I18N.en;
      updatePhoneBadge(id, val, curT);
    });
  });

  // ID Type select listener: updates label, placeholder, and re-validates digits
  document.querySelectorAll('.ben-id-type').forEach(el => {
    el.addEventListener('change', (e) => {
      const id = Number(e.target.dataset.id);
      const idType = e.target.value;
      const state = getState();
      const beneficiaries = state.beneficiaries.map(b => b.id === id ? { ...b, idType } : b);
      updateState({ beneficiaries });

      const curLang = getCurrentLang();
      const curT = BENEFICIARY_I18N[curLang] || BENEFICIARY_I18N.en;

      // Update Label
      const labelEl = document.getElementById(`idDigitsLabel_${id}`);
      if (labelEl) {
        labelEl.textContent = getIdDigitsLabel(idType, curT);
      }

      // Update Placeholder
      const digitsInput = document.querySelector(`.ben-id-digits[data-id="${id}"]`);
      if (digitsInput) {
        digitsInput.placeholder = getIdPlaceholder(idType, curT);
        updateIdBadge(id, idType, digitsInput.value, curT);
      }
    });
  });

  // ID Digits input listener: Auto-Uppercase & Real-time validation
  document.querySelectorAll('.ben-id-digits').forEach(el => {
    el.addEventListener('input', (e) => {
      const id = Number(e.target.dataset.id);
      const state = getState();
      const targetBen = state.beneficiaries.find(b => b.id === id);
      const idType = targetBen ? targetBen.idType : '';

      let val = e.target.value.trim();

      // Auto-uppercase for PAN / non-Aadhaar IDs
      if (idType !== 'Aadhaar Card' && val) {
        val = val.toUpperCase();
        if (e.target.value !== val) e.target.value = val;
      }

      const beneficiaries = state.beneficiaries.map(b => b.id === id ? { ...b, idDigits: val } : b);
      updateState({ beneficiaries });

      const curLang = getCurrentLang();
      const curT = BENEFICIARY_I18N[curLang] || BENEFICIARY_I18N.en;
      updateIdBadge(id, idType, val, curT);
    });
  });

  // Remove beneficiary button
  document.querySelectorAll('.btn-remove-ben').forEach(el => {
    el.addEventListener('click', (e) => {
      const id = Number(e.currentTarget.dataset.id || e.target.dataset.id);
      removeBeneficiary(id);
    });
  });
}

export function removeBeneficiary(id) {
  const state = getState();
  const beneficiaries = state.beneficiaries.filter(b => b.id !== id);
  updateState({ beneficiaries });
  renderBeneficiaries();
}

// Automatically re-render if language changes while on page
if (typeof window !== 'undefined') {
  window.addEventListener('languageChanged', () => {
    if (document.getElementById('beneficiariesContainer')) {
      renderBeneficiaries();
    }
  });
}
