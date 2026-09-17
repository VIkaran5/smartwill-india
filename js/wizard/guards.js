/* Pure Side-Effect-Free Validation Guards for SmartWill Wizard
 * Returns structured validation result objects: { ok: boolean, code?: string, field?: string, meta?: object } */
import { isValidEmailFormat, getEmailTypoWarning, isValidIndianPhone } from '../utils/validators.js';

export const GUARD_ERROR_CODES = {
  MANDATORY_FIELDS_MISSING: 'MANDATORY_FIELDS_MISSING',
  INVALID_PHONE: 'INVALID_PHONE',
  INVALID_EMAIL: 'INVALID_EMAIL',
  EMAIL_TYPO_WARNING: 'EMAIL_TYPO_WARNING',
  INVALID_GOVT_ID_FORMAT: 'INVALID_GOVT_ID_FORMAT',
  BENEFICIARY_REQUIRED: 'BENEFICIARY_REQUIRED',
  ASSET_REQUIRED: 'ASSET_REQUIRED',
  ALLOCATION_INCOMPLETE: 'ALLOCATION_INCOMPLETE',
  DECLARATION_REQUIRED: 'DECLARATION_REQUIRED'
};

export const STEP_GUARDS = {
  PERSONAL: (domainState) => {
    const p = domainState.personal || domainState.testator || {};
    const fullName = (p.fullName || '').trim();
    const dob = p.dob || '';
    const line1 = (p.addressLine1 || '').trim();
    const city = (p.addressCity || '').trim();
    const stateVal = (p.addressState || '').trim();
    const pincode = (p.addressPincode || '').trim();
    const digits = (p.govtIdDigits || '').trim();
    const phone = (p.phone || '').trim();
    const email = (p.email || '').trim();
    const idType = p.govtIdType || 'PAN Card';

    if (!fullName || !dob || !line1 || !city || !stateVal || !pincode || !phone || !email) {
      const missingField = !fullName ? 'fullName' :
                         !dob ? 'dob' :
                         !line1 ? 'addressLine1' :
                         !city ? 'addressCity' :
                         !stateVal ? 'addressState' :
                         !pincode ? 'addressPincode' :
                         !phone ? 'phone' : 'email';
      return { ok: false, code: GUARD_ERROR_CODES.MANDATORY_FIELDS_MISSING, field: missingField };
    }

    if (!isValidIndianPhone(phone)) {
      return { ok: false, code: GUARD_ERROR_CODES.INVALID_PHONE, field: 'phone' };
    }

    const typoWarn = getEmailTypoWarning(email);
    if (typoWarn) {
      return { ok: false, code: GUARD_ERROR_CODES.EMAIL_TYPO_WARNING, field: 'email', meta: { suggestion: typoWarn } };
    }

    if (!isValidEmailFormat(email)) {
      return { ok: false, code: GUARD_ERROR_CODES.INVALID_EMAIL, field: 'email' };
    }

    if (digits) {
      let valid = true;
      if (idType === 'Aadhaar Card' && !/^\d{4}$/.test(digits)) valid = false;
      else if (idType === 'PAN Card' && !/^\d{3}[a-zA-Z]$/.test(digits)) valid = false;
      else if (idType === 'Passport' && !/^\d{4}$/.test(digits)) valid = false;
      else if (idType === 'Voter ID' && !/^\d{4}$/.test(digits)) valid = false;
      else if (!/^[a-zA-Z0-9]{4}$/.test(digits)) valid = false;

      if (!valid) {
        return { ok: false, code: GUARD_ERROR_CODES.INVALID_GOVT_ID_FORMAT, field: 'govtIdDigits', meta: { idType } };
      }
    }

    return { ok: true };
  },

  BENEFICIARIES: (domainState) => {
    const list = domainState.beneficiaries || [];
    if (!Array.isArray(list) || list.length === 0) {
      return { ok: false, code: GUARD_ERROR_CODES.BENEFICIARY_REQUIRED, field: 'beneficiaries' };
    }
    return { ok: true };
  },

  ASSETS: (domainState) => {
    const list = domainState.assets || [];
    if (!Array.isArray(list) || list.length === 0) {
      return { ok: false, code: GUARD_ERROR_CODES.ASSET_REQUIRED, field: 'assets' };
    }
    return { ok: true };
  },

  ALLOCATION: (domainState) => {
    const assets = domainState.assets || [];
    for (const asset of assets) {
      const allocations = asset.allocations || [];
      const totalPct = allocations.reduce((sum, a) => sum + (Number(a.percentage) || 0), 0);
      if (Math.abs(totalPct - 100) > 0.01) {
        return {
          ok: false,
          code: GUARD_ERROR_CODES.ALLOCATION_INCOMPLETE,
          field: 'allocations',
          meta: {
            assetId: asset.id,
            assetType: asset.type || 'Asset',
            assetDesc: asset.desc || 'Unspecified',
            totalPercentage: totalPct
          }
        };
      }
    }
    return { ok: true };
  },

  EXECUTOR: (domainState) => {
    if (domainState.declarationAccepted === false) {
      return { ok: false, code: GUARD_ERROR_CODES.DECLARATION_REQUIRED, field: 'confirmCheckbox' };
    }
    return { ok: true };
  },

  PAYMENT: () => {
    return { ok: true };
  }
};

/**
 * Validates a specific step given domainState
 */
export function validateStepGuard(stepNameOrNumber, domainState) {
  const stepName = typeof stepNameOrNumber === 'number'
    ? numberToStepName(stepNameOrNumber)
    : stepNameOrNumber;

  const guard = STEP_GUARDS[stepName];
  if (!guard) return { ok: true };
  return guard(domainState);
}

function numberToStepName(num) {
  const map = { 1: 'PERSONAL', 2: 'ASSETS', 3: 'BENEFICIARIES', 4: 'ALLOCATION', 5: 'EXECUTOR', 6: 'PAYMENT' };
  return map[num] || null;
}
