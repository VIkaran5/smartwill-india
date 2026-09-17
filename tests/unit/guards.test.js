import { describe, it, expect } from 'vitest';
import { STEP_GUARDS, validateStepGuard, GUARD_ERROR_CODES } from '../../js/wizard/guards.js';

describe('Wizard Step Validation Guards (Pure Logic)', () => {
  describe('PERSONAL Guard', () => {
    it('should identify specific missing fields in PERSONAL guard', () => {
      const p = { fullName: 'Name', dob: 'dob', addressLine1: 'Line1', addressCity: 'City', addressState: 'State', addressPincode: '123', phone: '987', email: 'e' };

      expect(STEP_GUARDS.PERSONAL({ personal: { ...p, fullName: '' } }).field).toBe('fullName');
      expect(STEP_GUARDS.PERSONAL({ personal: { ...p, dob: '' } }).field).toBe('dob');
      expect(STEP_GUARDS.PERSONAL({ personal: { ...p, addressLine1: '' } }).field).toBe('addressLine1');
      expect(STEP_GUARDS.PERSONAL({ personal: { ...p, addressCity: '' } }).field).toBe('addressCity');
      expect(STEP_GUARDS.PERSONAL({ personal: { ...p, addressState: '' } }).field).toBe('addressState');
      expect(STEP_GUARDS.PERSONAL({ personal: { ...p, addressPincode: '' } }).field).toBe('addressPincode');
      expect(STEP_GUARDS.PERSONAL({ personal: { ...p, phone: '' } }).field).toBe('phone');
      expect(STEP_GUARDS.PERSONAL({ personal: { ...p, email: '' } }).field).toBe('email');
    });

    it('should reject invalid Indian mobile numbers', () => {
      const result = STEP_GUARDS.PERSONAL({
        personal: {
          fullName: 'Ramesh Sharma',
          dob: '1985-05-15',
          addressLine1: 'MG Road',
          addressCity: 'Mumbai',
          addressState: 'Maharashtra',
          addressPincode: '400001',
          phone: '1234567890', // Invalid (doesn't start with 6-9)
          email: 'ramesh@gmail.com'
        }
      });
      expect(result.ok).toBe(false);
      expect(result.code).toBe(GUARD_ERROR_CODES.INVALID_PHONE);
      expect(result.field).toBe('phone');
    });

    it('should flag email typos', () => {
      const result = STEP_GUARDS.PERSONAL({
        personal: {
          fullName: 'Ramesh Sharma',
          dob: '1985-05-15',
          addressLine1: 'MG Road',
          addressCity: 'Mumbai',
          addressState: 'Maharashtra',
          addressPincode: '400001',
          phone: '9876543210',
          email: 'ramesh@gmal.com' // Typo in domain
        }
      });
      expect(result.ok).toBe(false);
      expect(result.code).toBe(GUARD_ERROR_CODES.EMAIL_TYPO_WARNING);
      expect(result.meta.suggestion).toBe('Did you mean @gmail.com?');
    });

    it('should reject malformed email format', () => {
      const result = STEP_GUARDS.PERSONAL({
        personal: {
          fullName: 'Ramesh Sharma',
          dob: '1985-05-15',
          addressLine1: 'MG Road',
          addressCity: 'Mumbai',
          addressState: 'Maharashtra',
          addressPincode: '400001',
          phone: '9876543210',
          email: 'invalid-email'
        }
      });
      expect(result.ok).toBe(false);
      expect(result.code).toBe(GUARD_ERROR_CODES.INVALID_EMAIL);
    });

    it('should validate PAN card digits format', () => {
      const result = STEP_GUARDS.PERSONAL({
        personal: {
          fullName: 'Ramesh Sharma',
          dob: '1985-05-15',
          addressLine1: 'MG Road',
          addressCity: 'Mumbai',
          addressState: 'Maharashtra',
          addressPincode: '400001',
          phone: '9876543210',
          email: 'ramesh@gmail.com',
          govtIdType: 'PAN Card',
          govtIdDigits: '1234' // Invalid for PAN (expects 3 digits + 1 letter)
        }
      });
      expect(result.ok).toBe(false);
      expect(result.code).toBe(GUARD_ERROR_CODES.INVALID_GOVT_ID_FORMAT);
    });

    it('should validate Aadhaar card digits format', () => {
      const result = STEP_GUARDS.PERSONAL({
        personal: {
          fullName: 'Ramesh Sharma', dob: '1985-05-15', addressLine1: 'MG Road', addressCity: 'Mumbai', addressState: 'Maharashtra', addressPincode: '400001', phone: '9876543210', email: 'ramesh@gmail.com',
          govtIdType: 'Aadhaar Card', govtIdDigits: '123'
        }
      });
      expect(result.ok).toBe(false);
      expect(result.code).toBe(GUARD_ERROR_CODES.INVALID_GOVT_ID_FORMAT);
    });

    it('should validate Passport digits format', () => {
      const result = STEP_GUARDS.PERSONAL({
        personal: {
          fullName: 'Ramesh Sharma', dob: '1985-05-15', addressLine1: 'MG Road', addressCity: 'Mumbai', addressState: 'Maharashtra', addressPincode: '400001', phone: '9876543210', email: 'ramesh@gmail.com',
          govtIdType: 'Passport', govtIdDigits: 'ABCD'
        }
      });
      expect(result.ok).toBe(false);
      expect(result.code).toBe(GUARD_ERROR_CODES.INVALID_GOVT_ID_FORMAT);
    });

    it('should validate Voter ID digits format', () => {
      const result = STEP_GUARDS.PERSONAL({
        personal: {
          fullName: 'Ramesh Sharma', dob: '1985-05-15', addressLine1: 'MG Road', addressCity: 'Mumbai', addressState: 'Maharashtra', addressPincode: '400001', phone: '9876543210', email: 'ramesh@gmail.com',
          govtIdType: 'Voter ID', govtIdDigits: '99'
        }
      });
      expect(result.ok).toBe(false);
      expect(result.code).toBe(GUARD_ERROR_CODES.INVALID_GOVT_ID_FORMAT);
    });

    it('should validate Other Govt ID general alphanumeric format', () => {
      const result = STEP_GUARDS.PERSONAL({
        personal: {
          fullName: 'Ramesh Sharma', dob: '1985-05-15', addressLine1: 'MG Road', addressCity: 'Mumbai', addressState: 'Maharashtra', addressPincode: '400001', phone: '9876543210', email: 'ramesh@gmail.com',
          govtIdType: 'Driving License', govtIdDigits: '!!!'
        }
      });
      expect(result.ok).toBe(false);
      expect(result.code).toBe(GUARD_ERROR_CODES.INVALID_GOVT_ID_FORMAT);
    });

    it('should pass with valid personal details', () => {
      const result = STEP_GUARDS.PERSONAL({
        personal: {
          fullName: 'Ramesh Sharma',
          dob: '1985-05-15',
          addressLine1: 'MG Road',
          addressCity: 'Mumbai',
          addressState: 'Maharashtra',
          addressPincode: '400001',
          phone: '9876543210',
          email: 'ramesh@gmail.com',
          govtIdType: 'PAN Card',
          govtIdDigits: '567A'
        }
      });
      expect(result.ok).toBe(true);
    });
  });

  describe('BENEFICIARIES Guard', () => {
    it('should reject empty beneficiary list', () => {
      const result = STEP_GUARDS.BENEFICIARIES({ beneficiaries: [] });
      expect(result.ok).toBe(false);
      expect(result.code).toBe(GUARD_ERROR_CODES.BENEFICIARY_REQUIRED);
    });

    it('should pass when at least one beneficiary is present', () => {
      const result = STEP_GUARDS.BENEFICIARIES({
        beneficiaries: [{ id: 1, name: 'Priya Sharma', relation: 'Spouse' }]
      });
      expect(result.ok).toBe(true);
    });
  });

  describe('ASSETS Guard', () => {
    it('should reject empty asset list', () => {
      const result = STEP_GUARDS.ASSETS({ assets: [] });
      expect(result.ok).toBe(false);
      expect(result.code).toBe(GUARD_ERROR_CODES.ASSET_REQUIRED);
    });

    it('should pass when at least one asset is present', () => {
      const result = STEP_GUARDS.ASSETS({
        assets: [{ id: 1, type: 'Bank Account', desc: 'HDFC', value: '500000' }]
      });
      expect(result.ok).toBe(true);
    });
  });

  describe('ALLOCATION Guard', () => {
    it('should reject allocation percentages that do not total 100%', () => {
      const result = STEP_GUARDS.ALLOCATION({
        assets: [
          {
            id: 1,
            type: 'Bank Account',
            allocations: [
              { beneficiaryId: 1, percentage: 50 },
              { beneficiaryId: 2, percentage: 30 } // Total 80% (incomplete)
            ]
          }
        ]
      });
      expect(result.ok).toBe(false);
      expect(result.code).toBe(GUARD_ERROR_CODES.ALLOCATION_INCOMPLETE);
      expect(result.meta.totalPercentage).toBe(80);
    });

    it('should pass when allocations total 100%', () => {
      const result = STEP_GUARDS.ALLOCATION({
        assets: [
          {
            id: 1,
            type: 'Bank Account',
            allocations: [
              { beneficiaryId: 1, percentage: 60 },
              { beneficiaryId: 2, percentage: 40 }
            ]
          }
        ]
      });
      expect(result.ok).toBe(true);
    });
  });

  describe('EXECUTOR Guard', () => {
    it('should reject when declaration is explicitly false', () => {
      const result = STEP_GUARDS.EXECUTOR({ declarationAccepted: false });
      expect(result.ok).toBe(false);
      expect(result.code).toBe(GUARD_ERROR_CODES.DECLARATION_REQUIRED);
    });

    it('should pass when declaration is accepted', () => {
      const result = STEP_GUARDS.EXECUTOR({ declarationAccepted: true });
      expect(result.ok).toBe(true);
    });
  });

  describe('PAYMENT Guard', () => {
    it('should always return ok: true', () => {
      const result = STEP_GUARDS.PAYMENT();
      expect(result.ok).toBe(true);
    });
  });

  describe('validateStepGuard Helper', () => {
    it('should support numeric step inputs', () => {
      const result2 = validateStepGuard(2, { assets: [] });
      expect(result2.ok).toBe(false);
      expect(result2.code).toBe(GUARD_ERROR_CODES.ASSET_REQUIRED);

      const result3 = validateStepGuard(3, { beneficiaries: [] });
      expect(result3.ok).toBe(false);
      expect(result3.code).toBe(GUARD_ERROR_CODES.BENEFICIARY_REQUIRED);
    });

    it('should return ok: true for invalid or unknown step inputs', () => {
      expect(validateStepGuard('UNKNOWN_STEP', {}).ok).toBe(true);
      expect(validateStepGuard(99, {}).ok).toBe(true);
    });
  });
});
