/* Country Codes & International Phone Number Metadata for SmartWill India */

export const POPULAR_COUNTRIES = [
  {
    iso: 'IN',
    name: 'India',
    dialCode: '+91',
    flag: '🇮🇳',
    minDigits: 10,
    maxDigits: 10,
    placeholder: '98765 43210',
    pattern: '^[6-9]\\d{9}$',
    keywords: ['india', 'in', 'bharat', 'hindustan'],
    help: '10 digits starting with 6, 7, 8, or 9'
  },
  {
    iso: 'US',
    name: 'United States',
    dialCode: '+1',
    flag: '🇺🇸',
    minDigits: 10,
    maxDigits: 10,
    placeholder: '202 555 0199',
    pattern: '^[2-9]\\d{9}$',
    keywords: ['usa', 'us', 'united states', 'america'],
    help: '10-digit mobile number'
  },
  {
    iso: 'CA',
    name: 'Canada',
    dialCode: '+1',
    flag: '🇨🇦',
    minDigits: 10,
    maxDigits: 10,
    placeholder: '416 555 0199',
    pattern: '^[2-9]\\d{9}$',
    keywords: ['canada', 'ca', 'toronto', 'vancouver'],
    help: '10-digit mobile number'
  },
  {
    iso: 'GB',
    name: 'United Kingdom',
    dialCode: '+44',
    flag: '🇬🇧',
    minDigits: 10,
    maxDigits: 11,
    placeholder: '7911 123456',
    pattern: '^\\d{10,11}$',
    keywords: ['uk', 'united kingdom', 'gb', 'britain', 'england', 'london', 'scotland'],
    help: '10 or 11 digits (exclude leading 0)'
  },
  {
    iso: 'AE',
    name: 'United Arab Emirates',
    dialCode: '+971',
    flag: '🇦🇪',
    minDigits: 9,
    maxDigits: 9,
    placeholder: '50 123 4567',
    pattern: '^5\\d{8}$',
    keywords: ['uae', 'united arab emirates', 'dubai', 'abu dhabi', 'sharjah'],
    help: '9 digits starting with 5'
  },
  {
    iso: 'AU',
    name: 'Australia',
    dialCode: '+61',
    flag: '🇦🇺',
    minDigits: 9,
    maxDigits: 9,
    placeholder: '412 345 678',
    pattern: '^4\\d{8}$',
    keywords: ['australia', 'au', 'sydney', 'melbourne'],
    help: '9 digits starting with 4 (exclude leading 0)'
  },
  {
    iso: 'SG',
    name: 'Singapore',
    dialCode: '+65',
    flag: '🇸🇬',
    minDigits: 8,
    maxDigits: 8,
    placeholder: '8123 4567',
    pattern: '^[89]\\d{7}$',
    keywords: ['singapore', 'sg'],
    help: '8 digits starting with 8 or 9'
  }
];

export const OTHER_COUNTRIES = [
  { iso: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷', minDigits: 10, maxDigits: 11, placeholder: '9 11 1234 5678' },
  { iso: 'AT', name: 'Austria', dialCode: '+43', flag: '🇦🇹', minDigits: 9, maxDigits: 11, placeholder: '664 123456' },
  { iso: 'BH', name: 'Bahrain', dialCode: '+973', flag: '🇧🇭', minDigits: 8, maxDigits: 8, placeholder: '3912 3456' },
  { iso: 'BD', name: 'Bangladesh', dialCode: '+880', flag: '🇧🇩', minDigits: 10, maxDigits: 10, placeholder: '1712 345678' },
  { iso: 'BE', name: 'Belgium', dialCode: '+32', flag: '🇧🇪', minDigits: 9, maxDigits: 9, placeholder: '470 12 34 56' },
  { iso: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷', minDigits: 10, maxDigits: 11, placeholder: '11 91234 5678' },
  { iso: 'CH', name: 'Switzerland', dialCode: '+41', flag: '🇨🇭', minDigits: 9, maxDigits: 9, placeholder: '79 123 45 67' },
  { iso: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪', minDigits: 10, maxDigits: 11, placeholder: '151 1234567' },
  { iso: 'DK', name: 'Denmark', dialCode: '+45', flag: '🇩🇰', minDigits: 8, maxDigits: 8, placeholder: '20 12 34 56' },
  { iso: 'EG', name: 'Egypt', dialCode: '+20', flag: '🇪🇬', minDigits: 10, maxDigits: 10, placeholder: '10 1234 5678' },
  { iso: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸', minDigits: 9, maxDigits: 9, placeholder: '612 34 56 78' },
  { iso: 'FI', name: 'Finland', dialCode: '+358', flag: '🇫🇮', minDigits: 9, maxDigits: 10, placeholder: '40 123 4567' },
  { iso: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷', minDigits: 9, maxDigits: 9, placeholder: '6 12 34 56 78' },
  { iso: 'GH', name: 'Ghana', dialCode: '+233', flag: '🇬🇭', minDigits: 9, maxDigits: 9, placeholder: '24 123 4567' },
  { iso: 'HK', name: 'Hong Kong', dialCode: '+852', flag: '🇭🇰', minDigits: 8, maxDigits: 8, placeholder: '9123 4567' },
  { iso: 'ID', name: 'Indonesia', dialCode: '+62', flag: '🇮🇩', minDigits: 9, maxDigits: 12, placeholder: '812 3456 7890' },
  { iso: 'IE', name: 'Ireland', dialCode: '+353', flag: '🇮🇪', minDigits: 9, maxDigits: 9, placeholder: '85 123 4567' },
  { iso: 'IL', name: 'Israel', dialCode: '+972', flag: '🇮🇱', minDigits: 9, maxDigits: 9, placeholder: '50 123 4567' },
  { iso: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹', minDigits: 9, maxDigits: 10, placeholder: '320 123 4567' },
  { iso: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵', minDigits: 10, maxDigits: 10, placeholder: '90 1234 5678' },
  { iso: 'KE', name: 'Kenya', dialCode: '+254', flag: '🇰🇪', minDigits: 9, maxDigits: 9, placeholder: '712 345 678' },
  { iso: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷', minDigits: 9, maxDigits: 10, placeholder: '10 1234 5678' },
  { iso: 'KW', name: 'Kuwait', dialCode: '+965', flag: '🇰🇼', minDigits: 8, maxDigits: 8, placeholder: '9123 4567' },
  { iso: 'LK', name: 'Sri Lanka', dialCode: '+94', flag: '🇱🇰', minDigits: 9, maxDigits: 9, placeholder: '77 123 4567' },
  { iso: 'MU', name: 'Mauritius', dialCode: '+230', flag: '🇲🇺', minDigits: 8, maxDigits: 8, placeholder: '5251 2345' },
  { iso: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽', minDigits: 10, maxDigits: 10, placeholder: '55 1234 5678' },
  { iso: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾', minDigits: 9, maxDigits: 10, placeholder: '12 345 6789' },
  { iso: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬', minDigits: 10, maxDigits: 10, placeholder: '802 123 4567' },
  { iso: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱', minDigits: 9, maxDigits: 9, placeholder: '6 12345678' },
  { iso: 'NO', name: 'Norway', dialCode: '+47', flag: '🇳🇴', minDigits: 8, maxDigits: 8, placeholder: '412 34 567' },
  { iso: 'NP', name: 'Nepal', dialCode: '+977', flag: '🇳🇵', minDigits: 10, maxDigits: 10, placeholder: '984 1234567' },
  { iso: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '🇳🇿', minDigits: 8, maxDigits: 10, placeholder: '21 123 4567' },
  { iso: 'OM', name: 'Oman', dialCode: '+968', flag: '🇴🇲', minDigits: 8, maxDigits: 8, placeholder: '9123 4567' },
  { iso: 'PH', name: 'Philippines', dialCode: '+63', flag: '🇵🇭', minDigits: 10, maxDigits: 10, placeholder: '917 123 4567' },
  { iso: 'PK', name: 'Pakistan', dialCode: '+92', flag: '🇵🇰', minDigits: 10, maxDigits: 10, placeholder: '301 2345678' },
  { iso: 'PL', name: 'Poland', dialCode: '+48', flag: '🇵🇱', minDigits: 9, maxDigits: 9, placeholder: '512 345 678' },
  { iso: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹', minDigits: 9, maxDigits: 9, placeholder: '912 345 678' },
  { iso: 'QA', name: 'Qatar', dialCode: '+974', flag: '🇶🇦', minDigits: 8, maxDigits: 8, placeholder: '3312 3456' },
  { iso: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦', minDigits: 9, maxDigits: 9, placeholder: '51 234 5678' },
  { iso: 'SE', name: 'Sweden', dialCode: '+46', flag: '🇸🇪', minDigits: 9, maxDigits: 10, placeholder: '70 123 45 67' },
  { iso: 'TH', name: 'Thailand', dialCode: '+66', flag: '🇹🇭', minDigits: 9, maxDigits: 9, placeholder: '81 234 5678' },
  { iso: 'TR', name: 'Turkey', dialCode: '+90', flag: '🇹🇷', minDigits: 10, maxDigits: 10, placeholder: '532 123 4567' },
  { iso: 'TW', name: 'Taiwan', dialCode: '+886', flag: '🇹🇼', minDigits: 9, maxDigits: 9, placeholder: '912 345 678' },
  { iso: 'VN', name: 'Vietnam', dialCode: '+84', flag: '🇻🇳', minDigits: 9, maxDigits: 10, placeholder: '91 234 5678' },
  { iso: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦', minDigits: 9, maxDigits: 9, placeholder: '71 234 5678' }
];

export const ALL_COUNTRIES = [
  ...POPULAR_COUNTRIES,
  ...OTHER_COUNTRIES.filter(c => !POPULAR_COUNTRIES.some(p => p.iso === c.iso))
].sort((a, b) => a.name.localeCompare(b.name));

/**
 * Find country by ISO code or Dial Code
 */
export function findCountry(identifier) {
  if (!identifier) return POPULAR_COUNTRIES[0];
  const cleaned = String(identifier).trim().toUpperCase();
  const dialCleaned = cleaned.startsWith('+') ? cleaned : `+${cleaned}`;

  return POPULAR_COUNTRIES.find(c => c.iso === cleaned || c.dialCode === dialCleaned || c.dialCode === cleaned)
    || ALL_COUNTRIES.find(c => c.iso === cleaned || c.dialCode === dialCleaned || c.dialCode === cleaned)
    || POPULAR_COUNTRIES[0]; // fallback to India
}

/**
 * Filter countries by search query (name, dialCode, or ISO)
 */
export function filterCountries(query) {
  if (!query || !query.trim()) {
    return {
      popular: POPULAR_COUNTRIES,
      all: ALL_COUNTRIES
    };
  }

  const q = query.trim().toLowerCase().replace(/^\+/, '');
  const matcher = (c) => {
    const codeMatch = c.dialCode.replace('+', '').includes(q);
    const nameMatch = c.name.toLowerCase().includes(q);
    const isoMatch = c.iso.toLowerCase().includes(q);
    const keywordMatch = c.keywords && c.keywords.some(k => k.includes(q));
    return codeMatch || nameMatch || isoMatch || keywordMatch;
  };

  return {
    popular: POPULAR_COUNTRIES.filter(matcher),
    all: ALL_COUNTRIES.filter(matcher)
  };
}

/**
 * Clean user-entered local phone string based on country context
 */
export function cleanLocalPhone(rawPhone, country) {
  if (!rawPhone) return '';
  let cleaned = String(rawPhone).replace(/\D/g, '');

  if (!country) country = POPULAR_COUNTRIES[0];

  // If user pasted a full number with country code (e.g. +91 9876543210 -> 919876543210)
  const dialDigits = country.dialCode.replace(/\D/g, '');
  if (dialDigits && cleaned.startsWith(dialDigits) && cleaned.length > dialDigits.length + 5) {
    cleaned = cleaned.slice(dialDigits.length);
  }

  // If user included domestic trunk prefix '0' (e.g. 09876543210 or 07911...)
  if (cleaned.startsWith('0') && cleaned.length > (country.minDigits || 9)) {
    cleaned = cleaned.slice(1);
  }

  // Cap at country maxDigits if defined
  if (country.maxDigits) {
    cleaned = cleaned.slice(0, country.maxDigits);
  }

  return cleaned;
}

/**
 * Validate phone number against country rule
 */
export function validatePhone(localDigits, country) {
  if (!localDigits) {
    return { isValid: false, message: 'Mobile number is required.' };
  }

  const c = country || POPULAR_COUNTRIES[0];
  const digits = String(localDigits).replace(/\D/g, '');

  if (c.iso === 'IN') {
    if (!/^[6-9]\d{9}$/.test(digits)) {
      return {
        isValid: false,
        message: 'Must be 10 digits starting with 6, 7, 8, or 9.'
      };
    }
    return {
      isValid: true,
      message: `✓ Valid Indian Mobile (${c.dialCode} ${digits})`
    };
  }

  // Specific pattern test if present
  if (c.pattern) {
    const reg = new RegExp(c.pattern);
    if (!reg.test(digits)) {
      return {
        isValid: false,
        message: c.help ? `⚠️ ${c.help} for ${c.name}.` : `⚠️ Please enter a valid mobile number for ${c.name}.`
      };
    }
  }

  // Length checks
  const min = c.minDigits || 7;
  const max = c.maxDigits || 15;
  if (digits.length < min || digits.length > max) {
    return {
      isValid: false,
      message: `⚠️ Mobile number for ${c.name} must be ${min === max ? `${min} digits` : `${min}-${max} digits`}.`
    };
  }

  return {
    isValid: true,
    message: `✓ Valid Mobile (${c.dialCode} ${digits})`
  };
}
