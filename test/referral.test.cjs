'use strict';

/**
 * Item 6 Referral System — Unit Tests
 *
 * All test cases import and exercise the real exported functions from the
 * actual shipped modules. No hand-written reimplementations of logic under
 * test. If any of these functions have a bug, these tests will catch it.
 *
 * Functions under test:
 *   calculateReferralDiscount   — api/referral-helpers.js
 *   processReferralRewardState  — api/referral-helpers.js
 *   validateReferrerInput       — api/referral-helpers.js
 *   isReferralStorageActive     — api/referral-helpers.js
 *   applyCreditWrites           — api/referral-helpers.js (write-phase logic)
 *   checkPaymentValid           — api/verify-payment.js
 */

const {
  calculateReferralDiscount,
  processReferralRewardState,
  validateReferrerInput,
  isReferralStorageActive,
  applyCreditWrites
} = require('../api/referral-helpers');

const { checkPaymentValid } = require('../api/verify-payment');

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log('PASS: ' + testName);
    passed++;
  } else {
    console.error('FAIL: ' + testName);
    failed++;
  }
}

console.log('=== Item 6: Referral System Unit Tests ===\n');

// ─────────────────────────────────────────────────────────────
// 1. calculateReferralDiscount (referral-helpers.js)
// ─────────────────────────────────────────────────────────────
const disc0 = calculateReferralDiscount(0, 299);
assert(disc0.creditRedeemed === 0 && disc0.expectedAmount === 299,
  'calculateReferralDiscount: zero balance -> Rs.299, creditRedeemed 0');

const disc49 = calculateReferralDiscount(49, 299);
assert(disc49.creditRedeemed === 0 && disc49.expectedAmount === 299,
  'calculateReferralDiscount: balance 49 (< 50) -> no discount');

const disc50 = calculateReferralDiscount(50, 299);
assert(disc50.creditRedeemed === 50 && disc50.expectedAmount === 249,
  'calculateReferralDiscount: balance exactly 50 -> Rs.249, creditRedeemed 50');

const disc150 = calculateReferralDiscount(150, 299);
assert(disc150.creditRedeemed === 50 && disc150.expectedAmount === 249,
  'calculateReferralDiscount: balance 150 -> max Rs.50 deducted, not 150');

// ─────────────────────────────────────────────────────────────
// 2. checkPaymentValid (verify-payment.js) with discounted amount
// ─────────────────────────────────────────────────────────────
assert(checkPaymentValid('PAID', 249, 'INR', 249) === true,
  'checkPaymentValid: Rs.249 PAID against expectedAmount 249 -> true');
assert(checkPaymentValid('PAID', 299, 'INR', 249) === false,
  'checkPaymentValid: Rs.299 paid but expectedAmount was 249 -> false (mismatch guard)');
assert(checkPaymentValid('PAID', 249, 'INR', 299) === false,
  'checkPaymentValid: Rs.249 paid but expectedAmount was 299 -> false (discount theft guard)');

// ─────────────────────────────────────────────────────────────
// 3. processReferralRewardState (referral-helpers.js)
// ─────────────────────────────────────────────────────────────
const step1 = processReferralRewardState(
  { balance: 0, totalEarned: 0, totalReferred: 0, creditedOrderIds: [] },
  'SW_ORDER_001'
);
assert(step1.shouldCredit === true && step1.state.balance === 50 && step1.state.totalReferred === 1,
  'processReferralRewardState: first referral -> +Rs.50, shouldCredit true');

const step2Dup = processReferralRewardState(step1.state, 'SW_ORDER_001');
assert(step2Dup.shouldCredit === false && step2Dup.state.balance === 50,
  'processReferralRewardState: same orderId again -> shouldCredit false, balance stays 50 (no double reward)');

const step3New = processReferralRewardState(step1.state, 'SW_ORDER_002');
assert(step3New.shouldCredit === true && step3New.state.balance === 100 && step3New.state.totalReferred === 2,
  'processReferralRewardState: second distinct orderId -> +Rs.50, balance 100');

// ─────────────────────────────────────────────────────────────
// 4. validateReferrerInput (referral-helpers.js) — real function, not a copy
// ─────────────────────────────────────────────────────────────
assert(validateReferrerInput('USER_A', 'USER_A') === false,
  'validateReferrerInput: self-referral USER_A->USER_A is rejected');
assert(validateReferrerInput('USER_A', 'USER_B') === true,
  'validateReferrerInput: different user USER_B->USER_A is accepted');
assert(validateReferrerInput('USER_A', '') === false,
  'validateReferrerInput: empty string referrer is rejected');
assert(validateReferrerInput('USER_A', null) === false,
  'validateReferrerInput: null referrer is rejected');
assert(validateReferrerInput('USER_A', '   ') === false,
  'validateReferrerInput: whitespace-only referrer is rejected');

// ─────────────────────────────────────────────────────────────
// 5. isReferralStorageActive (referral-helpers.js) — real function, not a copy
// ─────────────────────────────────────────────────────────────
const now = Date.now();
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
assert(isReferralStorageActive({ ref: 'USER_B', expiresAt: now + THIRTY_DAYS_MS }, now) === true,
  'isReferralStorageActive: fresh 30-day entry is active');
assert(isReferralStorageActive({ ref: 'USER_B', expiresAt: now + 1000 }, now) === true,
  'isReferralStorageActive: entry expiring in 1 second is still active');
assert(isReferralStorageActive({ ref: 'USER_B', expiresAt: now - 1000 }, now) === false,
  'isReferralStorageActive: expired entry (1s ago) is inactive');
assert(isReferralStorageActive(null, now) === false,
  'isReferralStorageActive: null entry is inactive');
assert(isReferralStorageActive({ ref: 'USER_B' }, now) === false,
  'isReferralStorageActive: missing expiresAt is inactive');
assert(isReferralStorageActive({ expiresAt: now + THIRTY_DAYS_MS }, now) === false,
  'isReferralStorageActive: missing ref is inactive');

// ─────────────────────────────────────────────────────────────
// 6. applyCreditWrites (referral-helpers.js) — write-phase logic
//    Uses a mock transaction to capture t.update()/t.set() calls without
//    hitting Firestore. Tests the actual write decisions, not just math.
// ─────────────────────────────────────────────────────────────

function makeMockTransaction() {
  const writes = [];
  return {
    writes,
    update(ref, data) { writes.push({ op: 'update', path: ref._path, data }); },
    set(ref, data, opts) { writes.push({ op: 'set', path: ref._path, data, opts }); }
  };
}
function makeMockDb() {
  return {
    collection: function(col) {
      return {
        doc: function(id) {
          return { _path: col + '/' + id };
        }
      };
    }
  };
}
function makeMockAdmin() {
  return { firestore: { FieldValue: {
    serverTimestamp: () => '__ts__',
    arrayUnion: (...args) => ({ __arrayUnion: args })
  } } };
}

// 6a: PAID with referral — referrer gets credited
{
  const t = makeMockTransaction(); const db = makeMockDb(); const admin = makeMockAdmin();
  applyCreditWrites(t, db, admin, {
    orderId: 'SW_T001', payerUid: 'UID_A', referredBy: 'UID_B',
    creditRedeemed: 0, isPaid: true, payerCreditDoc: null,
    referrerCreditDoc: { exists: true, data: () => ({ balance: 0, totalEarned: 0, totalReferred: 0, creditedOrderIds: [] }) }
  });
  const w = t.writes.find(x => x.path === 'referralCredits/UID_B');
  assert(!!w && w.data.balance === 50, 'applyCreditWrites: PAID + referral -> referrer credited +Rs.50');
  assert(t.writes.length === 1, 'applyCreditWrites: no payer deduct when creditRedeemed=0');
}

// 6b: Duplicate orderId — no second credit (idempotent)
{
  const t = makeMockTransaction(); const db = makeMockDb(); const admin = makeMockAdmin();
  applyCreditWrites(t, db, admin, {
    orderId: 'SW_T001', payerUid: 'UID_A', referredBy: 'UID_B',
    creditRedeemed: 0, isPaid: true, payerCreditDoc: null,
    referrerCreditDoc: { exists: true, data: () => ({ balance: 50, totalEarned: 50, totalReferred: 1, creditedOrderIds: ['SW_T001'] }) }
  });
  assert(t.writes.length === 0, 'applyCreditWrites: duplicate orderId -> zero writes (idempotent)');
}

// 6c: PAID with creditRedeemed — payer balance deducted
{
  const t = makeMockTransaction(); const db = makeMockDb(); const admin = makeMockAdmin();
  applyCreditWrites(t, db, admin, {
    orderId: 'SW_T002', payerUid: 'UID_A', referredBy: null,
    creditRedeemed: 50, isPaid: true, referrerCreditDoc: null,
    payerCreditDoc: { exists: true, data: () => ({ balance: 50, creditPendingOrderId: 'SW_T002' }) }
  });
  const w = t.writes.find(x => x.path === 'referralCredits/UID_A');
  assert(!!w && w.data.balance === 0, 'applyCreditWrites: creditRedeemed=50 -> payer balance deducted to 0');
}

// 6d: FAILED payment — pending marker cleared, no referrer credit
{
  const t = makeMockTransaction(); const db = makeMockDb(); const admin = makeMockAdmin();
  applyCreditWrites(t, db, admin, {
    orderId: 'SW_T003', payerUid: 'UID_A', referredBy: 'UID_B',
    creditRedeemed: 50, isPaid: false, referrerCreditDoc: null,
    payerCreditDoc: { exists: true, data: () => ({ balance: 50, creditPendingOrderId: 'SW_T003' }) }
  });
  const w = t.writes.find(x => x.path === 'referralCredits/UID_A');
  assert(!!w && w.data.creditPendingOrderId === null, 'applyCreditWrites: failed payment -> pending marker cleared');
  assert(t.writes.length === 1, 'applyCreditWrites: failed payment -> no referrer write');
}

// 6e: No referral, no credit — zero writes
{
  const t = makeMockTransaction(); const db = makeMockDb(); const admin = makeMockAdmin();
  applyCreditWrites(t, db, admin, {
    orderId: 'SW_T004', payerUid: 'UID_A', referredBy: null,
    creditRedeemed: 0, isPaid: true, payerCreditDoc: null, referrerCreditDoc: null
  });
  assert(t.writes.length === 0, 'applyCreditWrites: no referral, no credit -> zero writes');
}

console.log('\n=============================================');
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
console.log('=============================================');
if (failed > 0) process.exit(1);
