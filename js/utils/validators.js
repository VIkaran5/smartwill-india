/* Validators Utility Module for SmartWill India */

export function isValidEmailFormat(email) {
  if (!email || email.length > 254) return false;
  const basicRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,10}$/;
  if (!basicRegex.test(email)) return false;

  const parts = email.split('@');
  if (parts.length !== 2) return false;
  const domain = parts[1].toLowerCase();
  const domainParts = domain.split('.');

  if (domainParts.length < 2) return false;

  const validTLDs = [
    'com', 'in', 'org', 'net', 'edu', 'gov', 'mil', 'co', 'info', 'biz', 'io', 
    'me', 'dev', 'app', 'online', 'site', 'tech', 'store', 'live', 'agency', 
    'asia', 'uk', 'us', 'ca', 'au', 'de', 'fr', 'jp', 'cn', 'eu', 'ai'
  ];

  const tld = domainParts[domainParts.length - 1];
  const secondTld = domainParts.length > 2 ? domainParts[domainParts.length - 2] : '';

  if (secondTld === 'co' || secondTld === 'gov' || secondTld === 'ac' || secondTld === 'edu' || secondTld === 'res') {
    if (!validTLDs.includes(tld)) return false;
  } else {
    if (!validTLDs.includes(tld)) return false;
  }

  if (/(.)\1{2,}/.test(tld)) return false;

  const domainName = domainParts[0];
  if (!domainName || domainName.length < 2) return false;

  return true;
}

export function getEmailTypoWarning(email) {
  if (!email || !email.includes('@')) return null;
  const parts = email.split('@');
  if (parts.length !== 2) return null;
  const domain = parts[1].toLowerCase();

  const gmailTypos = [
    'gmail.co', 'gmail.con', 'gmail.comm', 'gmail.cm', 'gmail.co.in',
    'gail.com', 'gail.co', 'gail.co.in', 'gamil.com', 'gmial.com', 
    'gmaill.com', 'gmai.com', 'gmal.com', 'gmai.co',
    'kail.co', 'kail.com', 'gnail.com', 'gmaik.com', 'gmil.com',
    'gmaol.com', 'gmali.com', 'gemail.com', 'gimail.com', 'hmail.com',
    'gmail.om', 'gmail.cim', 'gmail.vom', 'gmail.xom', 'gmsil.com',
    'gmaikl.com', 'gmail.coom', 'gmail.cmo',
    'ail.com', 'ail.co', 'mail.com', 'gail.in', 'gmail.ind'
  ];
  if (gmailTypos.includes(domain)) {
    return 'Did you mean @gmail.com?';
  }

  const yahooTypos = ['yaho.com', 'yaho.co.in', 'yhoo.com', 'yaho.co', 'yahou.com'];
  if (yahooTypos.includes(domain)) {
    return 'Did you mean @yahoo.com?';
  }

  const outlookTypos = ['outloo.com', 'outlok.com', 'hotmial.com', 'hotmai.com', 'hotmial.co'];
  if (outlookTypos.includes(domain)) {
    return 'Did you mean @outlook.com or @hotmail.com?';
  }

  return null;
}

export function isValidIndianPhone(phone) {
  if (!phone) return false;
  const cleanPhone = String(phone).trim().replace(/\D/g, '');
  return /^[6-9]\d{9}$/.test(cleanPhone);
}

export function validateGovtId(type, digits) {
  const cleanDigits = (digits || '').trim().toUpperCase();
  if (!cleanDigits) return { isValid: true, message: '' };

  if (type === 'Aadhaar Card') {
    const valid = /^\d{4}$/.test(cleanDigits);
    return { isValid: valid, message: valid ? `✓ Valid Aadhaar Card (Last 4 Digits: XXXX-${cleanDigits})` : '⚠️ Aadhaar last 4 digits must contain exactly 4 numbers (0-9).' };
  } else if (type === 'PAN Card') {
    const valid = /^\d{3}[A-Z]$/.test(cleanDigits);
    return { isValid: valid, message: valid ? `✓ Valid PAN Card Last 4 Digits (XXXX-${cleanDigits})` : '⚠️ PAN Card last 4 characters must be 3 numbers + 1 letter (e.g. 7190M).' };
  } else if (type === 'Voter ID') {
    const valid = /^\d{4}$/.test(cleanDigits);
    return { isValid: valid, message: valid ? `✓ Valid Voter ID (EPIC) Last 4 Digits (XXXX-${cleanDigits})` : '⚠️ Voter ID last 4 digits must contain exactly 4 numbers (0-9).' };
  } else if (type === 'Passport') {
    const valid = /^\d{4}$/.test(cleanDigits);
    return { isValid: valid, message: valid ? `✓ Valid Passport Last 4 Digits (XXXX-${cleanDigits})` : '⚠️ Passport last 4 digits must contain exactly 4 numbers (0-9).' };
  }

  const valid = /^[A-Z0-9]{4}$/.test(cleanDigits);
  return { isValid: valid, message: valid ? `✓ Valid Identity Digits (${cleanDigits})` : '⚠️ Please enter 4 valid characters for selected Govt ID.' };
}
