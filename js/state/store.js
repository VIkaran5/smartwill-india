/* Centralized State Store Module for SmartWill India
 * DPDP Act 2023 — Consent-First Architecture:
 * State changes are kept IN MEMORY ONLY until the user explicitly gives
 * DPDP consent. Once consent is recorded, encrypted persistence activates.
 */
import { loadDraft, saveDraft, clearDraft } from './storage.js';

const defaultState = {
  currentStep: 1,
  personal: {
    fullName: '',
    dob: '',
    gender: 'Male',
    religion: 'Hindu',
    govtIdType: 'PAN Card',
    govtIdDigits: '',
    phone: '',
    email: '',
    addressLine1: '',
    addressCity: '',
    addressState: '',
    addressPincode: '',
    pincodeStatus: ''
  },
  assets: [
    { id: 1, type: 'Bank Account / FD', details: {}, desc: '', value: '' }
  ],
  beneficiaries: [
    { id: 1, name: '', relation: 'Spouse', phone: '', idType: '', idDigits: '' }
  ],
  executor: { name: '', relation: '', alternateName: '', alternateRelation: '' }
};

export function deepClone(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

// In-memory state — only persisted after DPDP consent
let state = deepClone(defaultState);

// DPDP consent flag — set true only after user ticks the consent checkbox
let consentGiven = false;

// Check if user already gave consent in a prior session (stored in localStorage)
const CONSENT_KEY = 'sw_dpdp_consent';
function checkStoredConsent() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(CONSENT_KEY) : null;
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return !!(parsed && parsed.consentGiven && parsed.consentTimestamp);
  } catch { return false; }
}

export function recordConsent() {
  consentGiven = true;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({
        consentGiven: true,
        consentTimestamp: new Date().toISOString(),
        consentVersion: '1.0'
      }));
    }
  } catch (e) { console.warn('[SmartWill] Could not store consent record', e); }
}

export function isConsentGiven() { return consentGiven; }

/* Async initializer — must be called once at app start.
 * Loads encrypted draft from localStorage if consent was already given. */
export async function initStore() {
  if (checkStoredConsent()) {
    consentGiven = true;
    const saved = await loadDraft();
    if (saved) {
      state = saved;
      // Sanitize legacy mock dummy assets if they were saved in a prior session
      if (Array.isArray(state.assets)) {
        state.assets = state.assets.map(a => {
          if (a.desc === 'HDFC Savings Account (A/C: XXXX1234)' && (a.value === '500000' || a.value === 500000)) {
            return { ...a, desc: '', value: '', details: {} };
          }
          if (a.desc === 'Flat No 402, Green View Apartments, Hyderabad' && (a.value === '7500000' || a.value === 7500000)) {
            return { ...a, desc: '', value: '', details: {} };
          }
          return a;
        });
      }
      // Sanitize legacy mock dummy beneficiaries if present
      if (Array.isArray(state.beneficiaries)) {
        state.beneficiaries = state.beneficiaries.map(b => {
          let updated = { ...b };
          if (updated.name === 'Priya Sharma' || updated.name === 'Arjun Sharma') {
            updated.name = '';
          }
          if (updated.phone === '9876543210' || updated.phone === '9876543211') {
            updated.phone = '';
          }
          if (updated.idDigits === '5678' || updated.idDigits === '9812') {
            updated.idDigits = '';
          }
          return updated;
        });
      }
    }
  }
  if (typeof window !== 'undefined') {
    window.getWillState = getState;
  }
}

export function getState() {
  return deepClone(state);
}

export function updateState(patch, isRemoteUpdate = false) {
  state = {
    ...state,
    ...patch,
    personal: patch.personal ? { ...state.personal, ...patch.personal } : state.personal,
    executor: patch.executor ? { ...state.executor, ...patch.executor } : state.executor
  };

  // DPDP Consent Gate: only persist to encrypted storage AFTER consent is given
  if (consentGiven) {
    saveDraft(state); // async, intentionally fire-and-forget for perf
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('smartwill_state_change', {
      detail: { state, isRemoteUpdate }
    }));
  }
  return getState();
}

export function resetState(isRemoteUpdate = false) {
  state = deepClone(defaultState);
  clearDraft();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('smartwill_state_change', {
      detail: { state, isRemoteUpdate }
    }));
  }
  return getState();
}
