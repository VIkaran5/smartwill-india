/* Shared Application Constants for SmartWill India */

export const TOTAL_STEPS = 6;
export const MIN_PAYMENT_AMOUNT = 299;
export const WILL_PRICE_INR = 299;
export const CURRENCY_CODE = 'INR';
export const DRAFT_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
export const MAX_PHONE_LENGTH = 10;
export const DEFAULT_LANGUAGE = 'en';
export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'EN' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिंदी' }
];

export const GOVT_ID_TYPES = {
  PAN: 'PAN Card',
  AADHAAR: 'Aadhaar Card',
  VOTER_ID: 'Voter ID',
  PASSPORT: 'Passport'
};
