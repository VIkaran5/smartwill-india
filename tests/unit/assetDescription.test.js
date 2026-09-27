import { describe, it, expect } from 'vitest';
import { computeAssetDesc } from '../../js/render/assets.js';

describe('Structured Asset Description Synthesis (computeAssetDesc)', () => {
  it('should synthesize Bank Account / FD description accurately', () => {
    const desc = computeAssetDesc('Bank Account / FD', {
      bankName: 'HDFC Bank',
      accType: 'Savings Account',
      last4: '4589',
      branch: 'Banjara Hills'
    });
    expect(desc).toBe('HDFC Bank Savings Account ending in 4589, Banjara Hills Branch');
  });

  it('should synthesize Property / Land description accurately', () => {
    const desc = computeAssetDesc('Property / Land', {
      propType: 'Residential Flat / Apartment',
      unitNo: 'Flat 402',
      locality: 'Green View Apartments',
      city: 'Hyderabad'
    });
    expect(desc).toBe('Residential Flat / Apartment (Flat 402, Green View Apartments, Hyderabad)');
  });

  it('should synthesize Mutual Funds / Stocks description accurately', () => {
    const desc = computeAssetDesc('Mutual Funds / Stocks', {
      platform: 'Zerodha Kite',
      clientId: 'AB1234'
    });
    expect(desc).toBe('Zerodha Kite Investment Holding (Account/Client: AB1234)');
  });

  it('should synthesize Gold / Jewelry description accurately', () => {
    const desc = computeAssetDesc('Gold / Jewelry', {
      weight: '~120 grams 22K Gold',
      location: 'SBI Locker #14, Jubilee Hills'
    });
    expect(desc).toBe('~120 grams 22K Gold Gold & Jewelry kept at SBI Locker #14, Jubilee Hills');
  });

  it('should synthesize Insurance Policy description accurately', () => {
    const desc = computeAssetDesc('Insurance Policy', {
      provider: 'LIC of India',
      policyType: 'Term Life Insurance',
      policyNo: '987654321'
    });
    expect(desc).toBe('LIC of India Term Life Insurance (Policy No: 987654321)');
  });

  it('should synthesize Vehicle description accurately', () => {
    const desc = computeAssetDesc('Vehicle', {
      vehicleType: 'Car / 4-Wheeler',
      makeModel: 'Hyundai Creta SX',
      regNo: 'TS 09 EA 1234'
    });
    expect(desc).toBe('Hyundai Creta SX (Reg: TS 09 EA 1234)');
  });

  it('should synthesize Other Asset description accurately', () => {
    const desc = computeAssetDesc('Other Asset', {
      assetName: 'Employee Provident Fund (EPF)',
      details: 'UAN 100987654321'
    });
    expect(desc).toBe('Employee Provident Fund (EPF) (UAN 100987654321)');
  });

  it('should fall back gracefully to legacyDesc when fields are empty', () => {
    const desc = computeAssetDesc('Bank Account / FD', {
      legacyDesc: 'Old Bank Account String'
    });
    expect(desc).toBe('Old Bank Account String');
  });
});
