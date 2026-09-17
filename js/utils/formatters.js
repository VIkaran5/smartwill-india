/* Formatters Utility Module for SmartWill India */

export function formatIndianRupeeWords(numStr) {
  const num = Number(numStr);
  if (!num || isNaN(num) || num <= 0) return '';
  
  const formatted = num.toLocaleString('en-IN', { maximumFractionDigits: 0, style: 'currency', currency: 'INR' });
  
  if (num >= 10000000) { // 1 Crore+
    const cr = (num / 10000000).toFixed(2).replace(/\.00$/, '');
    return `${formatted} (${cr} Crores)`;
  } else if (num >= 100000) { // 1 Lakh+
    const lakh = (num / 100000).toFixed(2).replace(/\.00$/, '');
    return `${formatted} (${lakh} Lakhs)`;
  } else if (num >= 1000) {
    const k = (num / 1000).toFixed(1).replace(/\.0$/, '');
    return `${formatted} (${k} Thousand)`;
  }
  return formatted;
}

export function cleanAddressField(value) {
  if (!value) return '';
  return value.trim().replace(/\s+/g, ' ');
}

export function buildCleanAddress(personalState) {
  if (!personalState) return 'Not provided';
  const parts = [
    personalState.addressLine1,
    personalState.addressCity,
    personalState.addressState,
    personalState.addressPincode ? `PIN: ${personalState.addressPincode}` : ''
  ].filter(Boolean);
  
  return parts.length > 0 ? parts.join(', ') : 'Not provided';
}
