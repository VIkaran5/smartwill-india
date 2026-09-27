/* Dynamic Asset List Renderer with Category-Specific Structured Fields
 * Fully bilingual/trilingual: English, Telugu (te), Hindi (hi)
 */
import { getState, updateState } from '../state/store.js';
import { escapeHTML } from '../utils/sanitizer.js';
import { formatIndianRupeeWords } from '../utils/formatters.js';

export function getCurrentLang() {
  const state = getState();
  const lang = (state && state.lang) || (typeof document !== 'undefined' ? document.documentElement.lang : 'en') || 'en';
  if (lang === 'te' || lang === 'hi') return lang;
  return 'en';
}

export const ASSET_I18N = {
  en: {
    categoryLabel: 'Asset Category',
    estimatedValue: 'Estimated Value (₹)',
    approxHint: '(Approximate is fine)',
    willPreviewTag: '📜 Legal Will Preview:',
    fillDetailsAbove: 'Fill details above',
    removeAsset: 'Remove Asset',
    categories: {
      'Bank Account / FD': '🏦 Bank Account / FD',
      'Property / Land': '🏠 Property / Land',
      'Mutual Funds / Stocks': '📈 Mutual Funds / Stocks',
      'Gold / Jewelry': '✨ Gold / Jewelry',
      'Insurance Policy': '🛡️ Insurance Policy',
      'Vehicle': '🚗 Vehicle',
      'Other Asset': '💼 Other Asset'
    },
    bank: {
      bankName: 'Bank Name',
      bankNamePh: 'e.g. HDFC Bank, SBI',
      accType: 'Account Type',
      accTypes: {
        'Savings Account': 'Savings Account',
        'Fixed Deposit (FD)': 'Fixed Deposit (FD)',
        'Current Account': 'Current Account',
        'Recurring Deposit (RD)': 'Recurring Deposit (RD)'
      },
      last4: 'Last 4 Digits of A/C',
      last4Ph: 'e.g. 4589',
      branch: 'Branch / City',
      branchPh: 'e.g. Banjara Hills, Hyderabad'
    },
    property: {
      propType: 'Property Type',
      propTypes: {
        'Residential Flat / Apartment': 'Residential Flat / Apartment',
        'Independent House / Villa': 'Independent House / Villa',
        'Agricultural Land': 'Agricultural Land',
        'Plot / Open Land': 'Plot / Open Land',
        'Commercial Property / Shop': 'Commercial Property / Shop'
      },
      unitNo: 'Flat / House / Plot No.',
      unitNoPh: 'e.g. Flat 402, Plot 18',
      locality: 'Building / Layout / Locality',
      localityPh: 'e.g. Green View Apts, Gachibowli',
      city: 'City / District',
      cityPh: 'e.g. Hyderabad'
    },
    mutualFunds: {
      platform: 'Broker / Platform Name',
      platformPh: 'e.g. Zerodha, Groww, CAMS, KFintech',
      clientId: 'Demat A/C / Client ID / Folio No.',
      clientIdPh: 'e.g. Client ID: AB1234 or Folio No.'
    },
    gold: {
      weight: 'Approximate Weight (Grams / Tolas)',
      weightPh: 'e.g. ~120 grams 22K Gold Jewelry',
      location: 'Custody Location / Bank Locker',
      locationPh: 'e.g. SBI Locker #14, Jubilee Hills or Home Safe'
    },
    insurance: {
      provider: 'Insurance Company',
      providerPh: 'e.g. HDFC Life, LIC of India',
      policyType: 'Policy Type',
      policyTypes: {
        'Term Life Insurance': 'Term Life Insurance',
        'Endowment / Money Back': 'Endowment / Money Back',
        'Health Insurance': 'Health Insurance'
      },
      policyNo: 'Policy Number',
      policyNoPh: 'e.g. Policy # 98765432'
    },
    vehicle: {
      vehicleType: 'Vehicle Type',
      vehicleTypes: {
        'Car / 4-Wheeler': 'Car / 4-Wheeler',
        'Bike / 2-Wheeler': 'Bike / 2-Wheeler',
        'Commercial Vehicle': 'Commercial Vehicle'
      },
      makeModel: 'Make & Model',
      makeModelPh: 'e.g. Hyundai Creta, Honda City',
      regNo: 'Registration Number',
      regNoPh: 'e.g. TS 09 EA 1234 / DL 01 AB 5678'
    },
    other: {
      title: 'Asset Title / Category',
      titlePh: 'e.g. EPF / Provident Fund, Business Equity, Art',
      details: 'Identifying Details / Number / Location',
      detailsPh: 'e.g. UAN: 100987654321, 25% Shares in XYZ Pvt Ltd'
    }
  },
  te: {
    categoryLabel: 'ఆస్తి వర్గం',
    estimatedValue: 'సుమారు విలువ (₹)',
    approxHint: '(సుమారుగా సరిపోతుంది)',
    willPreviewTag: '📜 వీలునామాలో ఎలా వస్తుంది:',
    fillDetailsAbove: 'వివరాలు పూరించండి',
    removeAsset: 'తొలగించండి',
    categories: {
      'Bank Account / FD': '🏦 బ్యాంక్ ఖాతా / FD',
      'Property / Land': '🏠 ఆస్తి / స్థలం',
      'Mutual Funds / Stocks': '📈 మ్యూచువల్ ఫండ్స్ / డీమ్యాట్',
      'Gold / Jewelry': '✨ బంగారం / ఆభరణాలు',
      'Insurance Policy': '🛡️ ఇన్సూరెన్స్ పాలసీ',
      'Vehicle': '🚗 వాహనం',
      'Other Asset': '💼 ఇతర ఆస్తులు'
    },
    bank: {
      bankName: 'బ్యాంక్ పేరు',
      bankNamePh: 'ఉదా: SBI, HDFC',
      accType: 'ఖాతా రకం',
      accTypes: {
        'Savings Account': 'సేవింగ్స్ ఖాతా',
        'Fixed Deposit (FD)': 'ఫిక్స్‌డ్ డిపాజిట్ (FD)',
        'Current Account': 'కరెంట్ ఖాతా',
        'Recurring Deposit (RD)': 'రికరింగ్ డిపాజిట్ (RD)'
      },
      last4: 'ఖాతా చివరి 4 అంకెలు',
      last4Ph: 'ఉదా: 4589',
      branch: 'బ్రాంచ్ / నగరం',
      branchPh: 'ఉదా: బంజారా హిల్స్, హైదరాబాద్'
    },
    property: {
      propType: 'ఆస్తి రకం',
      propTypes: {
        'Residential Flat / Apartment': 'ఫ్లాట్ / అపార్ట్‌మెంట్',
        'Independent House / Villa': 'స్వతంత్ర ఇల్లు / విల్లా',
        'Agricultural Land': 'వ్యవసాయ భూమి',
        'Plot / Open Land': 'ప్లాట్ / ఓపెన్ ల్యాండ్',
        'Commercial Property / Shop': 'వాణిజ్య ఆస్తి / షాప్'
      },
      unitNo: 'ఫ్లాట్ / ఇంటి / ప్లాట్ నం.',
      unitNoPh: 'ఉదా: ఫ్లాట్ 402, ప్లాట్ 18',
      locality: 'భవనం / లేఅవుట్ / ప్రాంతం',
      localityPh: 'ఉదా: గ్రీన్ వ్యూ అపార్ట్‌మెంట్స్',
      city: 'నగరం / జిల్లా',
      cityPh: 'ఉదా: హైదరాబాద్'
    },
    mutualFunds: {
      platform: 'బ్రోకర్ / ప్లాట్‌ఫామ్ పేరు',
      platformPh: 'ఉదా: Zerodha, Groww, CAMS',
      clientId: 'డీమ్యాట్ ఖాతా / క్లయింట్ ID / ఫోలియో నం.',
      clientIdPh: 'ఉదా: క్లయింట్ ID: AB1234 లేదా ఫోలియో నం.'
    },
    gold: {
      weight: 'సుమారు బరువు (గ్రాములు / తులాలలో)',
      weightPh: 'ఉదా: ~120 గ్రాముల 22K బంగారం',
      location: 'నిల్వ స్థలం / బ్యాంక్ లాకర్',
      locationPh: 'ఉదా: SBI లాకర్ #14, జూబ్లీహిల్స్ లేదా ఇంట్లో సేఫ్'
    },
    insurance: {
      provider: 'భీమా సంస్థ',
      providerPh: 'ఉదా: LIC, HDFC Life',
      policyType: 'పాలసీ రకం',
      policyTypes: {
        'Term Life Insurance': 'టర్మ్ లైఫ్ ఇన్సూరెన్స్',
        'Endowment / Money Back': 'ఎండోమెంట్ / మనీ బ్యాక్',
        'Health Insurance': 'హెల్త్ ఇన్సూరెన్స్'
      },
      policyNo: 'పాలసీ సంఖ్య',
      policyNoPh: 'ఉదా: పాలసీ నం: 98765432'
    },
    vehicle: {
      vehicleType: 'వాహనం రకం',
      vehicleTypes: {
        'Car / 4-Wheeler': 'కారు / 4-వీలర్',
        'Bike / 2-Wheeler': 'బైక్ / 2-వీలర్',
        'Commercial Vehicle': 'వాణిజ్య వాహనం'
      },
      makeModel: 'మేక్ & మోడల్',
      makeModelPh: 'ఉదా: Hyundai Creta, Honda City',
      regNo: 'రిజిస్ట్రేషన్ సంఖ్య',
      regNoPh: 'ఉదా: TS 09 EA 1234 / AP 09 AB 5678'
    },
    other: {
      title: 'ఆస్తి పేరు / వివరణ',
      titlePh: 'ఉదా: ప్రావిడెంట్ ఫండ్ (EPF), బిజినెస్ వాటా',
      details: 'గుర్తింపు వివరాలు / లొకేషన్',
      detailsPh: 'ఉదా: UAN: 100987654321, 25% వాటా'
    }
  },
  hi: {
    categoryLabel: 'संपत्ति श्रेणी',
    estimatedValue: 'अनुमानित मूल्य (₹)',
    approxHint: '(लगभग अनुमानित चलेगा)',
    willPreviewTag: '📜 वसीयत में कानूनी विवरण:',
    fillDetailsAbove: 'कृपया ऊपर विवरण दर्ज करें',
    removeAsset: 'हटाएं',
    categories: {
      'Bank Account / FD': '🏦 बैंक खाता / FD',
      'Property / Land': '🏠 मकान / जमीन / प्लॉट',
      'Mutual Funds / Stocks': '📈 म्यूचुअल फंड / शेयर',
      'Gold / Jewelry': '✨ सोना / आभूषण',
      'Insurance Policy': '🛡️ बीमा पॉलिसी',
      'Vehicle': '🚗 वाहन (कार / बाइक)',
      'Other Asset': '💼 अन्य संपत्ति'
    },
    bank: {
      bankName: 'बैंक का नाम',
      bankNamePh: 'उदा: SBI, HDFC Bank',
      accType: 'खाते का प्रकार',
      accTypes: {
        'Savings Account': 'बचत खाता (Savings Account)',
        'Fixed Deposit (FD)': 'सावधि जमा (FD)',
        'Current Account': 'चालू खाता (Current Account)',
        'Recurring Deposit (RD)': 'आवर्ती जमा (RD)'
      },
      last4: 'खाते के अंतिम 4 अंक',
      last4Ph: 'उदा: 4589',
      branch: 'शाखा / शहर',
      branchPh: 'उदा: बंजारा हिल्स, हैदराबाद'
    },
    property: {
      propType: 'संपत्ति का प्रकार',
      propTypes: {
        'Residential Flat / Apartment': 'आवासीय फ्लैट / अपार्टमेंट',
        'Independent House / Villa': 'स्वतंत्र मकान / विला',
        'Agricultural Land': 'कृषि भूमि',
        'Plot / Open Land': 'प्लॉट / खुली जमीन',
        'Commercial Property / Shop': 'व्यावसायिक संपत्ति / दुकान'
      },
      unitNo: 'फ्लैट / मकान / प्लॉट नं.',
      unitNoPh: 'उदा: फ्लैट 402, प्लॉट 18',
      locality: 'इमारत / कॉलोनी / इलाका',
      localityPh: 'उदा: ग्रीन व्यू अपार्टमेंट्स',
      city: 'शहर / जिला',
      cityPh: 'उदा: हैदराबाद'
    },
    mutualFunds: {
      platform: 'ब्रोकर / प्लेटफॉर्म का नाम',
      platformPh: 'उदा: Zerodha, Groww, CAMS, KFintech',
      clientId: 'डीमैट खाता / क्लाइंट आईडी / फोलियो नं.',
      clientIdPh: 'उदा: क्लाइंट आईडी: AB1234 या फोलियो नं.'
    },
    gold: {
      weight: 'अनुमानित वजन (ग्राम / तोले में)',
      weightPh: 'उदा: ~120 ग्राम 22K सोने के आभूषण',
      location: 'रखने का स्थान / बैंक लॉकर',
      locationPh: 'उदा: SBI लॉकर #14, जुबली हिल्स या घर की तिजोरी'
    },
    insurance: {
      provider: 'बीमा कंपनी',
      providerPh: 'उदा: LIC of India, HDFC Life',
      policyType: 'पॉलिसी का प्रकार',
      policyTypes: {
        'Term Life Insurance': 'टर्म लाइफ इंश्योरेंस',
        'Endowment / Money Back': 'एंडोमेंट / मनी बैक',
        'Health Insurance': 'स्वास्थ्य बीमा'
      },
      policyNo: 'पॉलिसी संख्या',
      policyNoPh: 'उदा: पॉलिसी नं: 98765432'
    },
    vehicle: {
      vehicleType: 'वाहन का प्रकार',
      vehicleTypes: {
        'Car / 4-Wheeler': 'कार / 4-पहिया',
        'Bike / 2-Wheeler': 'बाइक / 2-पहिया',
        'Commercial Vehicle': 'व्यावसायिक वाहन'
      },
      makeModel: 'मेक और मॉडल',
      makeModelPh: 'उदा: Hyundai Creta, Honda City',
      regNo: 'पंजीकरण संख्या (Registration No.)',
      regNoPh: 'उदा: TS 09 EA 1234 / DL 01 AB 5678'
    },
    other: {
      title: 'संपत्ति का नाम / श्रेणी',
      titlePh: 'उदा: भविष्य निधि (EPF), व्यापार में शेयर, कलाकृति',
      details: 'पहचान विवरण / संख्या / स्थान',
      detailsPh: 'उदा: UAN: 100987654321, 25% शेयर'
    }
  }
};

/**
 * Computes a formal, court-admissible legal description from structured fields
 */
export function computeAssetDesc(type, details = {}) {
  if (!details) return '';
  switch (type) {
    case 'Bank Account / FD': {
      const { bankName = '', accType = 'Savings Account', last4 = '', branch = '' } = details;
      if (!bankName && !last4) return details.legacyDesc || '';
      const bPart = bankName ? `${bankName.trim()} ` : '';
      const aPart = accType ? `${accType} ` : 'Account ';
      const lPart = last4 ? `ending in ${last4.trim()}` : '';
      const brPart = branch ? `, ${branch.trim()} Branch` : '';
      return `${bPart}${aPart}${lPart}${brPart}`.trim();
    }
    case 'Property / Land': {
      const { propType = 'Residential Flat / Apartment', unitNo = '', locality = '', city = '' } = details;
      const parts = [unitNo, locality, city].map(s => (s || '').trim()).filter(Boolean).join(', ');
      if (!parts) return details.legacyDesc || propType;
      return `${propType} (${parts})`;
    }
    case 'Mutual Funds / Stocks': {
      const { platform = '', clientId = '' } = details;
      if (!platform && !clientId) return details.legacyDesc || '';
      const pPart = platform ? `${platform.trim()} ` : '';
      const idPart = clientId ? `(Account/Client: ${clientId.trim()})` : '';
      return `${pPart}Investment Holding ${idPart}`.trim();
    }
    case 'Gold / Jewelry': {
      const { weight = '', location = '' } = details;
      if (!weight && !location) return details.legacyDesc || 'Gold & Jewelry';
      const wPart = weight ? `${weight.trim()} Gold & Jewelry` : 'Gold & Jewelry';
      const locPart = location ? ` kept at ${location.trim()}` : '';
      return `${wPart}${locPart}`.trim();
    }
    case 'Insurance Policy': {
      const { provider = '', policyType = 'Term Life Insurance', policyNo = '' } = details;
      if (!provider && !policyNo) return details.legacyDesc || '';
      const pPart = provider ? `${provider.trim()} ` : '';
      const noPart = policyNo ? ` (Policy No: ${policyNo.trim()})` : '';
      return `${pPart}${policyType}${noPart}`.trim();
    }
    case 'Vehicle': {
      const { vehicleType = 'Car / 4-Wheeler', makeModel = '', regNo = '' } = details;
      if (!makeModel && !regNo) return details.legacyDesc || '';
      const mPart = makeModel ? `${makeModel.trim()}` : vehicleType;
      const regPart = regNo ? ` (Reg: ${regNo.trim()})` : '';
      return `${mPart}${regPart}`.trim();
    }
    case 'Other Asset':
    default: {
      const { assetName = '', details: moreDetails = '' } = details;
      if (assetName && moreDetails) return `${assetName.trim()} (${moreDetails.trim()})`;
      return (assetName || moreDetails || details.legacyDesc || '').trim();
    }
  }
}

/**
 * Initializes structured details if not already present, and clears any stale dummy mock values
 */
function ensureAssetDetails(asset) {
  if (!asset.details || typeof asset.details !== 'object') {
    asset.details = {};
  }
  // Sanitize any legacy mock dummy data left from prior sessions
  if (asset.desc === 'HDFC Savings Account (A/C: XXXX1234)' && (asset.value === '500000' || asset.value === 500000)) {
    asset.desc = '';
    asset.value = '';
    asset.details = {};
  }
  if (asset.desc === 'Flat No 402, Green View Apartments, Hyderabad' && (asset.value === '7500000' || asset.value === 7500000)) {
    asset.desc = '';
    asset.value = '';
    asset.details = {};
  }
  if (asset.details.bankName === 'HDFC Bank' && asset.details.last4 === '1234') {
    asset.details = {};
    asset.desc = '';
  }
  if (asset.details.unitNo === 'Flat No 402' && asset.details.locality === 'Green View Apartments') {
    asset.details = {};
    asset.desc = '';
  }
}

/**
 * Generates category-specific inputs HTML in the active language
 */
function renderFieldsHTML(asset, lang = 'en') {
  const d = asset.details || {};
  const t = ASSET_I18N[lang] || ASSET_I18N.en;

  switch (asset.type) {
    case 'Bank Account / FD':
      return `
        <div class="asset-field-item">
          <label class="asset-field-label">${escapeHTML(t.bank.bankName)}</label>
          <input type="text" class="form-control asset-subfield" data-field="bankName" data-id="${asset.id}"
            value="${escapeHTML(d.bankName || '')}" placeholder="${escapeHTML(t.bank.bankNamePh)}">
        </div>
        <div class="asset-field-item">
          <label class="asset-field-label">${escapeHTML(t.bank.accType)}</label>
          <select class="form-select asset-subfield" data-field="accType" data-id="${asset.id}">
            <option value="Savings Account" ${d.accType === 'Savings Account' ? 'selected' : ''}>${escapeHTML(t.bank.accTypes['Savings Account'])}</option>
            <option value="Fixed Deposit (FD)" ${d.accType === 'Fixed Deposit (FD)' ? 'selected' : ''}>${escapeHTML(t.bank.accTypes['Fixed Deposit (FD)'])}</option>
            <option value="Current Account" ${d.accType === 'Current Account' ? 'selected' : ''}>${escapeHTML(t.bank.accTypes['Current Account'])}</option>
            <option value="Recurring Deposit (RD)" ${d.accType === 'Recurring Deposit (RD)' ? 'selected' : ''}>${escapeHTML(t.bank.accTypes['Recurring Deposit (RD)'])}</option>
          </select>
        </div>
        <div class="asset-field-item">
          <label class="asset-field-label">${escapeHTML(t.bank.last4)}</label>
          <input type="text" class="form-control asset-subfield" data-field="last4" data-id="${asset.id}"
            value="${escapeHTML(d.last4 || '')}" placeholder="${escapeHTML(t.bank.last4Ph)}" maxlength="4" pattern="[0-9]{1,4}">
        </div>
        <div class="asset-field-item">
          <label class="asset-field-label">${escapeHTML(t.bank.branch)}</label>
          <input type="text" class="form-control asset-subfield" data-field="branch" data-id="${asset.id}"
            value="${escapeHTML(d.branch || '')}" placeholder="${escapeHTML(t.bank.branchPh)}">
        </div>
      `;

    case 'Property / Land':
      return `
        <div class="asset-field-item">
          <label class="asset-field-label">${escapeHTML(t.property.propType)}</label>
          <select class="form-select asset-subfield" data-field="propType" data-id="${asset.id}">
            <option value="Residential Flat / Apartment" ${d.propType === 'Residential Flat / Apartment' ? 'selected' : ''}>${escapeHTML(t.property.propTypes['Residential Flat / Apartment'])}</option>
            <option value="Independent House / Villa" ${d.propType === 'Independent House / Villa' ? 'selected' : ''}>${escapeHTML(t.property.propTypes['Independent House / Villa'])}</option>
            <option value="Agricultural Land" ${d.propType === 'Agricultural Land' ? 'selected' : ''}>${escapeHTML(t.property.propTypes['Agricultural Land'])}</option>
            <option value="Plot / Open Land" ${d.propType === 'Plot / Open Land' ? 'selected' : ''}>${escapeHTML(t.property.propTypes['Plot / Open Land'])}</option>
            <option value="Commercial Property / Shop" ${d.propType === 'Commercial Property / Shop' ? 'selected' : ''}>${escapeHTML(t.property.propTypes['Commercial Property / Shop'])}</option>
          </select>
        </div>
        <div class="asset-field-item">
          <label class="asset-field-label">${escapeHTML(t.property.unitNo)}</label>
          <input type="text" class="form-control asset-subfield" data-field="unitNo" data-id="${asset.id}"
            value="${escapeHTML(d.unitNo || '')}" placeholder="${escapeHTML(t.property.unitNoPh)}">
        </div>
        <div class="asset-field-item">
          <label class="asset-field-label">${escapeHTML(t.property.locality)}</label>
          <input type="text" class="form-control asset-subfield" data-field="locality" data-id="${asset.id}"
            value="${escapeHTML(d.locality || '')}" placeholder="${escapeHTML(t.property.localityPh)}">
        </div>
        <div class="asset-field-item">
          <label class="asset-field-label">${escapeHTML(t.property.city)}</label>
          <input type="text" class="form-control asset-subfield" data-field="city" data-id="${asset.id}"
            value="${escapeHTML(d.city || '')}" placeholder="${escapeHTML(t.property.cityPh)}">
        </div>
      `;

    case 'Mutual Funds / Stocks':
      return `
        <div class="asset-field-item" style="grid-column: span 2;">
          <label class="asset-field-label">${escapeHTML(t.mutualFunds.platform)}</label>
          <input type="text" class="form-control asset-subfield" data-field="platform" data-id="${asset.id}"
            value="${escapeHTML(d.platform || '')}" placeholder="${escapeHTML(t.mutualFunds.platformPh)}">
        </div>
        <div class="asset-field-item" style="grid-column: span 2;">
          <label class="asset-field-label">${escapeHTML(t.mutualFunds.clientId)}</label>
          <input type="text" class="form-control asset-subfield" data-field="clientId" data-id="${asset.id}"
            value="${escapeHTML(d.clientId || '')}" placeholder="${escapeHTML(t.mutualFunds.clientIdPh)}">
        </div>
      `;

    case 'Gold / Jewelry':
      return `
        <div class="asset-field-item" style="grid-column: span 2;">
          <label class="asset-field-label">${escapeHTML(t.gold.weight)}</label>
          <input type="text" class="form-control asset-subfield" data-field="weight" data-id="${asset.id}"
            value="${escapeHTML(d.weight || '')}" placeholder="${escapeHTML(t.gold.weightPh)}">
        </div>
        <div class="asset-field-item" style="grid-column: span 2;">
          <label class="asset-field-label">${escapeHTML(t.gold.location)}</label>
          <input type="text" class="form-control asset-subfield" data-field="location" data-id="${asset.id}"
            value="${escapeHTML(d.location || '')}" placeholder="${escapeHTML(t.gold.locationPh)}">
        </div>
      `;

    case 'Insurance Policy':
      return `
        <div class="asset-field-item">
          <label class="asset-field-label">${escapeHTML(t.insurance.provider)}</label>
          <input type="text" class="form-control asset-subfield" data-field="provider" data-id="${asset.id}"
            value="${escapeHTML(d.provider || '')}" placeholder="${escapeHTML(t.insurance.providerPh)}">
        </div>
        <div class="asset-field-item">
          <label class="asset-field-label">${escapeHTML(t.insurance.policyType)}</label>
          <select class="form-select asset-subfield" data-field="policyType" data-id="${asset.id}">
            <option value="Term Life Insurance" ${d.policyType === 'Term Life Insurance' ? 'selected' : ''}>${escapeHTML(t.insurance.policyTypes['Term Life Insurance'])}</option>
            <option value="Endowment / Money Back" ${d.policyType === 'Endowment / Money Back' ? 'selected' : ''}>${escapeHTML(t.insurance.policyTypes['Endowment / Money Back'])}</option>
            <option value="Health Insurance" ${d.policyType === 'Health Insurance' ? 'selected' : ''}>${escapeHTML(t.insurance.policyTypes['Health Insurance'])}</option>
          </select>
        </div>
        <div class="asset-field-item" style="grid-column: span 2;">
          <label class="asset-field-label">${escapeHTML(t.insurance.policyNo)}</label>
          <input type="text" class="form-control asset-subfield" data-field="policyNo" data-id="${asset.id}"
            value="${escapeHTML(d.policyNo || '')}" placeholder="${escapeHTML(t.insurance.policyNoPh)}">
        </div>
      `;

    case 'Vehicle':
      return `
        <div class="asset-field-item">
          <label class="asset-field-label">${escapeHTML(t.vehicle.vehicleType)}</label>
          <select class="form-select asset-subfield" data-field="vehicleType" data-id="${asset.id}">
            <option value="Car / 4-Wheeler" ${d.vehicleType === 'Car / 4-Wheeler' ? 'selected' : ''}>${escapeHTML(t.vehicle.vehicleTypes['Car / 4-Wheeler'])}</option>
            <option value="Bike / 2-Wheeler" ${d.vehicleType === 'Bike / 2-Wheeler' ? 'selected' : ''}>${escapeHTML(t.vehicle.vehicleTypes['Bike / 2-Wheeler'])}</option>
            <option value="Commercial Vehicle" ${d.vehicleType === 'Commercial Vehicle' ? 'selected' : ''}>${escapeHTML(t.vehicle.vehicleTypes['Commercial Vehicle'])}</option>
          </select>
        </div>
        <div class="asset-field-item">
          <label class="asset-field-label">${escapeHTML(t.vehicle.makeModel)}</label>
          <input type="text" class="form-control asset-subfield" data-field="makeModel" data-id="${asset.id}"
            value="${escapeHTML(d.makeModel || '')}" placeholder="${escapeHTML(t.vehicle.makeModelPh)}">
        </div>
        <div class="asset-field-item" style="grid-column: span 2;">
          <label class="asset-field-label">${escapeHTML(t.vehicle.regNo)}</label>
          <input type="text" class="form-control asset-subfield" data-field="regNo" data-id="${asset.id}"
            value="${escapeHTML(d.regNo || '')}" placeholder="${escapeHTML(t.vehicle.regNoPh)}">
        </div>
      `;

    case 'Other Asset':
    default:
      return `
        <div class="asset-field-item" style="grid-column: span 2;">
          <label class="asset-field-label">${escapeHTML(t.other.title)}</label>
          <input type="text" class="form-control asset-subfield" data-field="assetName" data-id="${asset.id}"
            value="${escapeHTML(d.assetName || d.legacyDesc || '')}" placeholder="${escapeHTML(t.other.titlePh)}">
        </div>
        <div class="asset-field-item" style="grid-column: span 2;">
          <label class="asset-field-label">${escapeHTML(t.other.details)}</label>
          <input type="text" class="form-control asset-subfield" data-field="details" data-id="${asset.id}"
            value="${escapeHTML(d.details || '')}" placeholder="${escapeHTML(t.other.detailsPh)}">
        </div>
      `;
  }
}

export function renderAssets() {
  const container = document.getElementById('assetsContainer');
  if (!container) return;

  const state = getState();
  const lang = getCurrentLang();
  const t = ASSET_I18N[lang] || ASSET_I18N.en;
  container.innerHTML = '';

  state.assets.forEach((asset, index) => {
    ensureAssetDetails(asset);
    const descText = asset.desc || computeAssetDesc(asset.type, asset.details) || t.fillDetailsAbove;

    const row = document.createElement('div');
    row.className = 'dynamic-row asset-card-structured';
    row.innerHTML = `
      <!-- Card Header: Title/Badge on Left, Remove Button on Right -->
      <div class="asset-card-header">
        <div class="asset-card-title">
          <span class="asset-num-badge">#${index + 1}</span>
          <span class="asset-title-text" id="badgeName_${asset.id}">${escapeHTML(t.categories[asset.type] || asset.type)}</span>
        </div>
        ${state.assets.length > 1 ? `
          <button type="button" class="btn-remove-row" data-id="${asset.id}" title="${escapeHTML(t.removeAsset)}" aria-label="${escapeHTML(t.removeAsset)}">
            <span class="remove-cross">&times;</span>
            <span class="remove-text">${escapeHTML(t.removeAsset)}</span>
          </button>
        ` : ''}
      </div>

      <!-- Top Row: Category & Estimated Value in a Clean 50/50 Grid -->
      <div class="asset-card-top-grid">
        <div class="form-group mb-0">
          <label class="form-label">${escapeHTML(t.categoryLabel)}</label>
          <select class="form-select asset-type" data-id="${asset.id}">
            <option value="Bank Account / FD" ${asset.type === 'Bank Account / FD' ? 'selected' : ''}>${escapeHTML(t.categories['Bank Account / FD'])}</option>
            <option value="Property / Land" ${asset.type === 'Property / Land' ? 'selected' : ''}>${escapeHTML(t.categories['Property / Land'])}</option>
            <option value="Mutual Funds / Stocks" ${asset.type === 'Mutual Funds / Stocks' ? 'selected' : ''}>${escapeHTML(t.categories['Mutual Funds / Stocks'])}</option>
            <option value="Gold / Jewelry" ${asset.type === 'Gold / Jewelry' ? 'selected' : ''}>${escapeHTML(t.categories['Gold / Jewelry'])}</option>
            <option value="Insurance Policy" ${asset.type === 'Insurance Policy' ? 'selected' : ''}>${escapeHTML(t.categories['Insurance Policy'])}</option>
            <option value="Vehicle" ${asset.type === 'Vehicle' ? 'selected' : ''}>${escapeHTML(t.categories['Vehicle'])}</option>
            <option value="Other Asset" ${asset.type === 'Other Asset' ? 'selected' : ''}>${escapeHTML(t.categories['Other Asset'])}</option>
          </select>
        </div>

        <div class="form-group mb-0">
          <label class="form-label">
            <span>${escapeHTML(t.estimatedValue)}</span>
            <span class="text-xs text-muted font-normal">(${escapeHTML(t.approxHint)})</span>
          </label>
          <input type="number" class="form-control asset-val" data-id="${asset.id}"
            value="${escapeHTML(asset.value || '')}"
            placeholder="e.g. 500000">
          <div class="asset-rupee-words text-xs font-semibold mt-1" id="rupeeWords_${asset.id}"
            style="color:var(--accent-gold);min-height:16px;">
            ${asset.value ? escapeHTML(formatIndianRupeeWords(asset.value)) : ''}
          </div>
        </div>
      </div>

      <!-- Specific Dynamic Input Fields for this Asset Category -->
      <div class="asset-fields-grid" id="assetFields_${asset.id}">
        ${renderFieldsHTML(asset, lang)}
      </div>

      <!-- Live Legal Will Preview Summary -->
      <div class="asset-preview-bar" id="assetPreviewBar_${asset.id}">
        <span class="preview-tag">${escapeHTML(t.willPreviewTag)}</span>
        <span class="preview-text" id="previewText_${asset.id}">${escapeHTML(descText)}</span>
      </div>
    `;
    container.appendChild(row);
  });

  bindAssetRowEvents();
}

function bindAssetRowEvents() {
  const lang = getCurrentLang();
  const t = ASSET_I18N[lang] || ASSET_I18N.en;

  // Category change listener: re-renders fields for this card
  document.querySelectorAll('.asset-type').forEach(el => {
    el.addEventListener('change', (e) => {
      const id = Number(e.target.dataset.id);
      const newType = e.target.value;
      const curState = getState();
      const assets = curState.assets.map(a => {
        if (a.id === id) {
          const freshDetails = {};
          return { ...a, type: newType, details: freshDetails, desc: computeAssetDesc(newType, freshDetails) };
        }
        return a;
      });
      updateState({ assets });

      // Dynamically update card header badge
      const curLang = getCurrentLang();
      const curT = ASSET_I18N[curLang] || ASSET_I18N.en;
      const badgeEl = document.getElementById(`badgeName_${id}`);
      if (badgeEl) {
        badgeEl.textContent = curT.categories[newType] || newType;
      }

      // Dynamically re-render fields area
      const targetAsset = assets.find(a => a.id === id);
      const fieldsGrid = document.getElementById(`assetFields_${id}`);
      if (fieldsGrid && targetAsset) {
        fieldsGrid.innerHTML = renderFieldsHTML(targetAsset, curLang);
        bindSubfieldEvents(fieldsGrid, id);
      }
      const previewText = document.getElementById(`previewText_${id}`);
      if (previewText && targetAsset) {
        previewText.textContent = targetAsset.desc || curT.fillDetailsAbove;
      }
    });
  });

  // Value input listener
  document.querySelectorAll('.asset-val').forEach(el => {
    el.addEventListener('input', (e) => {
      const id = Number(e.target.dataset.id);
      const curState = getState();
      const assets = curState.assets.map(a => a.id === id ? { ...a, value: e.target.value } : a);
      updateState({ assets });

      const wordsEl = document.getElementById(`rupeeWords_${id}`);
      if (wordsEl) {
        wordsEl.textContent = e.target.value ? formatIndianRupeeWords(e.target.value) : '';
      }
    });
  });

  // Delete row listener
  document.querySelectorAll('.btn-remove-row').forEach(el => {
    el.addEventListener('click', (e) => {
      const id = Number(e.target.dataset.id);
      removeAsset(id);
    });
  });

  // Bind subfield inputs
  document.querySelectorAll('.asset-fields-grid').forEach(grid => {
    const id = Number(grid.id.replace('assetFields_', ''));
    bindSubfieldEvents(grid, id);
  });
}

function bindSubfieldEvents(container, id) {
  container.querySelectorAll('.asset-subfield').forEach(input => {
    const handler = (e) => {
      const field = e.target.dataset.field;
      const value = e.target.value;
      const curState = getState();
      const assets = curState.assets.map(a => {
        if (a.id === id) {
          const details = { ...(a.details || {}), [field]: value };
          const desc = computeAssetDesc(a.type, details);
          return { ...a, details, desc };
        }
        return a;
      });
      updateState({ assets });

      const targetAsset = assets.find(a => a.id === id);
      const curLang = getCurrentLang();
      const curT = ASSET_I18N[curLang] || ASSET_I18N.en;
      const previewText = document.getElementById(`previewText_${id}`);
      if (previewText && targetAsset) {
        previewText.textContent = targetAsset.desc || curT.fillDetailsAbove;
      }
    };

    input.addEventListener('input', handler);
    input.addEventListener('change', handler);
  });
}

export function addNewAsset(type = 'Bank Account / FD') {
  const state = getState();
  const newId = (state.assets.length ? Math.max(...state.assets.map(a => a.id)) : 0) + 1;
  const newAsset = { id: newId, type, details: {}, desc: '', value: '' };
  const assets = [...state.assets, newAsset];
  updateState({ assets });
  renderAssets();

  // Auto-focus first input of newly added card
  setTimeout(() => {
    const newField = document.querySelector(`#assetFields_${newId} input`);
    if (newField) newField.focus();
  }, 50);
}

export function removeAsset(id) {
  const state = getState();
  const assets = state.assets.filter(a => a.id !== id);
  updateState({ assets });
  renderAssets();
}

// Automatically re-render if language changes while on page
if (typeof window !== 'undefined') {
  window.addEventListener('languageChanged', () => {
    if (document.getElementById('assetsContainer')) {
      renderAssets();
    }
  });
}
