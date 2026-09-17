/* Draft Local Storage Management — AES-GCM 256-bit Encrypted
 * Uses Web Crypto API (window.crypto.subtle) with PBKDF2 key derivation.
 * The encryption key is derived from the device ID stored locally.
 *
 * What this protects against:
 *   ✅ Casual inspection of browser localStorage / dev tools
 *   ✅ Shared/public computer glancing at stored financial data
 *   ✅ Generic browser extensions scanning localStorage for plaintext JSON
 *
 * What this does NOT protect against:
 *   ❌ A determined attacker with full browser profile access who can
 *      read both the ciphertext AND the device ID key material from the
 *      same localStorage bucket — key and ciphertext are co-located.
 *      Future upgrade: derive key from Firebase Auth session token instead.
 */

import { DRAFT_EXPIRY_MS } from '../config/constants.js';

const STORAGE_KEY = 'smartwill_draft';
const DEVICE_ID_KEY = 'smartwill_device_id';
const SALT = 'smartwill_india_v1_salt_2026';

function isStorageAvailable() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function isCryptoAvailable() {
  return typeof window !== 'undefined' &&
    window.crypto &&
    window.crypto.subtle &&
    typeof window.crypto.subtle.importKey === 'function';
}

function getDeviceId() {
  if (!isStorageAvailable()) return 'fallback-device-id';
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

async function deriveKey() {
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getDeviceId()),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return window.crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: new TextEncoder().encode(SALT), iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptPayload(plaintext) {
  const key = await deriveKey();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext)
  );
  const packed = new Uint8Array(12 + ciphertext.byteLength);
  packed.set(iv, 0);
  packed.set(new Uint8Array(ciphertext), 12);
  return btoa(String.fromCharCode(...packed));
}

async function decryptPayload(b64) {
  const key = await deriveKey();
  const packed = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: packed.slice(0, 12) },
    key,
    packed.slice(12)
  );
  return new TextDecoder().decode(decrypted);
}

function legacyDecode(raw) {
  try { return JSON.parse(decodeURIComponent(atob(raw))); } catch { return null; }
}

export async function loadDraft() {
  try {
    if (!isStorageAvailable()) return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    let decoded = null;
    if (isCryptoAvailable()) {
      try { decoded = JSON.parse(await decryptPayload(raw)); }
      catch { decoded = legacyDecode(raw); } // backwards compat
    } else {
      decoded = legacyDecode(raw);
    }
    if (!decoded) return null;
    if (decoded.timestamp && (Date.now() - decoded.timestamp > DRAFT_EXPIRY_MS)) {
      clearDraft(); return null;
    }
    return decoded.data || null;
  } catch { return null; }
}

export async function saveDraft(stateData) {
  try {
    if (!isStorageAvailable()) return;
    const payload = JSON.stringify({ timestamp: Date.now(), data: stateData });
    if (isCryptoAvailable()) {
      localStorage.setItem(STORAGE_KEY, await encryptPayload(payload));
    } else {
      localStorage.setItem(STORAGE_KEY, btoa(encodeURIComponent(payload)));
    }
  } catch (e) { console.error('[SmartWill] Draft save error', e); }
}

export function clearDraft() {
  try {
    if (!isStorageAvailable()) return;
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) { console.error('[SmartWill] Draft clear error', e); }
}

